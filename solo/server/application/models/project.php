<?php

use phpSweetPDO\SQLHelpers\Basic as Helpers;

Class Project extends Model {
    public $name;
    public $description;
    public $client_id;
    public $start_date;
    public $due_date;
    public $file_folder;

    public $progress;
    public $expected_progress;
    public $is_template;
    public $is_archived;

    protected $status_text;
    protected $created_date;

    //not saved to the db
    public $client_name;
    private $assigned_users;
    public $is_complete;

    function validate() {
        $this->validator_tests = array(
            'name' => 'required',
            'client_id' => 'required'
        );

        return parent::validate();
    }

    function save() {
        $this->import_parameters();

        //there are no real clients in Solo;
        $this->set('client_id', 1);
        //convert is_archived into 1 or 0
        $this->set('is_archived', intval($this->is_archived === 'true'));

        if ($this->is_new()) {
            //new projects won't have any tasks so the progress should be 100
            $this->set('progress', 100);

            $this->set('created_date', time());

            if (!isset($this->start_date))
                $this->set('start_date', strtotime('today'));
        } else {
            //generate activity if the due date has changed
            if ($this->due_date_changed()) {
                ActivityManager::project_due_date_updated($this);
            }
        }

        $this->unset_param('assigned_users');

        //todo: is this param even used? Check the client side
        $this->unset_param('is_complete');

        return parent::save();
    }

    function get_status() {
        return $this->status_text;
    }

    function due_date_changed() {
        return isset($this->previous_params) &&
            isset($this->previous_params['due_date']) &&
            ($this->previous_params['due_date'] != $this->due_date);
    }

    function evaluate_date_difference($from, $to) {
        $difference = $to - $from;
        $difference_in_days = abs(round($difference / 86400));
        $difference_direction = $to > $from ? Language::get('project.increased') : Language::get('project.decreased');
        $days_text = $difference_in_days > 1 ? Language::get('project.days') : Language::get('project.day');

        return array(
            'difference' => $difference,
            'difference_in_days' => $difference_in_days,
            'difference_direction' => $difference_direction,
            'days_text' => $days_text
        );
    }

    function files_folder_name() {
        $random_sting_length = 50 - strlen($this->name) - 1;
        $random_string = $this->rand_sha1($random_sting_length);

        $name = $this->sanitize_string($this->name) . '-' . $random_string;

        //check to make sure this name isn't already in use
        $records = $this->select("SELECT id FROM projects WHERE file_folder = '$name'");

        //if the name is already in use, try again. If not, return the name
        //todo:i should test this...
        if (count($records))
            return $this->files_folder_name();
        else return $name;
    }

    /**
     * Function: sanitize
     * Returns a sanitized string, typically for URLs.
     *
     * Parameters:
     *     $string - The string to sanitize.
     *     $force_lowercase - Force the string to lowercase?
     *     $anal - If set to *true*, will remove all non-alphanumeric characters.
     */
    static function sanitize_string($string, $force_lowercase = true, $anal = false) {
        //source:http://stackoverflow.com/questions/2668854/sanitizing-strings-to-make-them-url-and-filename-safe
        $strip = array("~", "`", "!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "=", "+", "[", "{", "]",
            "}", "\\", "|", ";", ":", "\"", "'", "&#8216;", "&#8217;", "&#8220;", "&#8221;", "&#8211;", "&#8212;",
            "â€”", "â€“", ",", "<", ".", ">", "/", "?");
        $clean = trim(str_replace($strip, "", strip_tags($string)));
        $clean = preg_replace('/\s+/', "-", $clean);
        $clean = ($anal) ? preg_replace("/[^a-zA-Z0-9]/", "", $clean) : $clean;
        return ($force_lowercase) ?
            (function_exists('mb_strtolower')) ?
                mb_strtolower($clean, 'UTF-8') :
                strtolower($clean) :
            $clean;
    }


    function rand_sha1($length) {
        //source: http://stackoverflow.com/questions/637278/what-is-the-best-way-to-generate-a-random-key-within-php
        $max = ceil($length / 40);
        $random = '';
        for ($i = 0; $i < $max; $i++) {
            $random .= sha1(microtime(true) . mt_rand(10000, 90000));
        }
        return substr($random, 0, $length);
    }

    function get_file_folder() {
        //create the file folder if it does not exist
        if (!isset($this->file_folder) || strlen($this->file_folder) == 0) {
            //generate the name of the folder
            $this->set('file_folder', $this->files_folder_name());
            $this->save();
            //create the folder on the filesystem
            $this->create_file_folder();
        }

        //just in case the folder was somehow deleted from the filesystem
        if (!$this->file_folder_exists_in_filesystem())
            $this->create_file_folder();


        return $this->file_folder;
    }

    function file_paths() {
        $folder = $this->get_file_folder();
        $upload_path = get_config('uploads.path') . $folder . '/';
        $web_path = get_config('uploads.web_path') . $folder . '/';

        return array(
            'upload_path' => $upload_path,
            'web_path' => $web_path
        );
    }

    function create_file_folder() {
        $path = get_config('uploads.path') . $this->file_folder;

        if (Utils::create_directory($path))
            return true;
        else return false;
    }

    function file_folder_exists_in_filesystem() {
        return !empty($this->file_folder) && is_dir(get_config('uploads.path') . $this->file_folder);
    }

    function delete_file_folder() {
        if ($this->file_folder_exists_in_filesystem())
            rmdir(get_config('uploads.path') . $this->file_folder);
    }

    function get($criteria = null) {
        $sql = "SELECT projects.*
                FROM projects";

        if (is_numeric($criteria)) {
            $sql .= ' WHERE projects.id = ' . $criteria;

            $project = parent::get_one($sql);
            $this->import_parameters($project);
            $this->update_status();

            $project['status_text'] = $this->status_text;

            return $project;
        } else {

            $sql = $this->add_criteria($sql, $criteria);
            $sql = $this->add_criteria($sql, 'is_template = 0');

            //if the user isn't an admin, we'll need to filter for projects that this user has access to.
            $sql = $this->modify_sql_for_user_type($sql);

            $projects = parent::get($sql);

            foreach ($projects as &$project) {
                //create the invoice
                $project_object = new Project($project);
//todo: i don't think this makes any sense because the invoice status will already be updated when I create the invoice using new Invoice
                //store the current project status as it exists in the database
                $old_status = $project_object->status_text;
                $old_expected_progress = $project_object->expected_progress;

                $project_object->clear_params();

                //update the project status
                $project_object->update_status();

                //if the old status and the new status do not match, then we need to save this task back to the database.
                if ($old_status != (string)$project_object->status_text || $old_expected_progress != (int)$project_object->expected_progress) {
                    //todo:make sure this isn't saving each time
                    //todo: I only want to update the expected progress if we're retreiving a single project. Not when we're getting the list
                    $project_object->save(false);
                }

                //we need to add the status text back the task array, since we're sending the array to the client,
                //not the object
                $project['status_text'] = $project_object->status_text;
            }
            return $projects;
            //return parent::get($sql);
        }
    }

    function get_tasks($filter = null) {
        $additional_criteria = '';

        if (isset($filter)) {
            if ($filter == 'incomplete')
                $additional_criteria = 'AND is_complete = 0';
            else if ($filter == 'complete')
                $additional_criteria = 'AND is_complete = 1';
        }

        $task = new Task();


        $tasks = $task->get_list($this->id, array('position', 'ASC'),  $additional_criteria);



        return $tasks;
    }

    function get_organized_tasks(){
       $tasks = $this->get_tasks();

        $task = new Task();

        return $task->organize($tasks['sections'], $tasks['tasks']);
    }


    function get_invoices() {
        $invoice = new Invoice();
        $invoices = $invoice->get("WHERE invoices.project_id = $this->id");

        return $invoices;
    }

    function get_estimates(){
        $estimate = new Estimate();
        $estimates = $estimate->get("WHERE estimates.project_id = $this->id");

        return $estimates;
    }

    function get_files() {
        $sql = File::generate_base_sql_for_get() . " WHERE project_id = $this->id";

        return parent::get($sql);
    }

    function get_activity() {
        $activity = new Activity();
        return $activity->get('WHERE project_id = ' . $this->id);
    }

    function get_users($admins = null) {
        $sql = "SELECT CONCAT(users.first_name, ' ', users.last_name) AS name, users.id, role_user.role_id, roles.name AS role
                FROM users
                LEFT JOIN role_user ON role_user.user_id = users.id
                LEFT JOIN roles ON role_user.role_id = roles.id";

        if (!isset($admins)) {
            $sql .= " WHERE users.client_id = $this->client_id
                    OR role_user.role_id = 1";
        } else {
            $sql .= " WHERE role_user.role_id = 1";
        }

        $users = $this->select($sql);
        return $users;
    }

    static function context($object_name, $id) {
        $context = array();

        if($object_name == 'board')
            $object_name = 'project';

        if ($object_name == 'project' || $object_name == 'template') {
            $context['project_id'] = $id;
            $context['entity_type'] = null;
            $context['entity_id'] = null;
        } else {
            $object = new $object_name($id);

            if (isset($object->project_id)) {
                $context['project_id'] = $object->project_id;
            }

            $context['entity_type'] = $object_name;
            $context['entity_id'] = $id;
        }

        return $context;
    }

    function get_calendar() {
        return new Calendar($this->id);
    }

    function get_details() {
    }

    function update_progress() {
        if (!$this->is_valid())
            return false;
        //todo:,  the get in this get updates the status of each task. Seems uncessary, but it needs to update status for other operations
        $tasks = $this->get_tasks();

        $tasks = $tasks['tasks'];

        if (count($tasks) == 0) {
            $this->set('progress', 100);
            $this->save();
            return true;
        }

        $unweighted_incomplete_tasks = array();
        $weighted_incomplete_tasks = array();

        $unweighted_completed_tasks = array();
        $weighted_completed_tasks = array();

        $total_percentage_for_unweighted_tasks = 100;
        $total_percentage_for_weighted_tasks = 0;

        //sort the tasks into groups
        foreach ($tasks as $task) {
            if ($task['is_section'] == 0) {
                if ($task['is_complete']) {
                    if ($task['weight'] > 0)
                        $weighted_completed_tasks[] = $task;
                    else $unweighted_completed_tasks[] = $task;
                } else {
                    if ($task['weight'] > 0)
                        $weighted_incomplete_tasks[] = $task;
                    else $unweighted_incomplete_tasks[] = $task;
                }
            }
        }

        //figure out how much of the total project progress should be allocated to unweighted tasks
        foreach ($weighted_completed_tasks as $task) {
            $total_percentage_for_unweighted_tasks -= $task['weight'];
        }

        foreach ($weighted_incomplete_tasks as $task) {
            $total_percentage_for_unweighted_tasks -= $task['weight'];
        }

        //each unweighted task will have an 'implied' weight that is calculated. Determine that value here
        $total_unweighted_tasks = count($unweighted_completed_tasks) + count($unweighted_incomplete_tasks);

        if ($total_unweighted_tasks > 0)
            $unweighted_task_implied_weight = $total_percentage_for_unweighted_tasks / $total_unweighted_tasks;
        else $unweighted_task_implied_weight = 0;

        //calculate progress
        $progress_from_unweighted = 0;
        $progress_from_weighted = 0;

        //determine how much of the project is completed by unweighted tasks
        $progress_from_unweighted = $unweighted_task_implied_weight * count($unweighted_completed_tasks);

        //determine how much of th project is completed by weighted tasks
        foreach ($weighted_completed_tasks as $task) {
            $progress_from_weighted += $task['weight'];
        }

        $progress = $progress_from_unweighted + $progress_from_weighted;

        //we want a whole number for progress
        $progress = round($progress, 0);


        $this->set('progress', $progress);

        $this->update_status();

        //todo:this shouldn't be saving all params back the db, but it is...something wrong with import/param logic
        $this->save();
    }

    function get_available_task_weight() {
        $sql = "SELECT SUM(weight)
                FROM tasks
                WHERE project_id = $this->id AND is_section = 0";

        $result = $this->select($sql);
        $sum = $result[0]['SUM(weight)'];

        $available_weight = 99 - $sum;

        return $available_weight;
    }

    function get_task_counts() {
        $task_counts = array(
            'incomplete' => 0,
            'complete' => 0,
            'total' => 0
        );

        $sql = "SELECT is_complete, COUNT(*)
                FROM tasks
                WHERE project_id = $this->id AND is_section = 0
                GROUP BY is_complete";

        $counts = $this->select($sql);

        foreach ($counts as $count) {
            if ($count['is_complete'] == 0) {
                $task_counts['incomplete'] = $count['COUNT(*)'];
            } else if ($count['is_complete'] == 1) {
                $task_counts['complete'] = $count['COUNT(*)'];
            }
        }

        $task_counts['total'] = $task_counts['incomplete'] + $task_counts['complete'];

        return $task_counts;
    }

    function calculate_expected_progress() {
        $total_time = $this->due_date - $this->start_date;
        $elapsed_time = time() - $this->start_date;
        $expected_progress = 0;

        if (!$this->has_due_date()) {
            $this->set('expected_progress', $expected_progress);
            return $expected_progress;
        }

        if ($total_time == 0) {
            //if the project begins and ends on the same day, we neeed to determine if that day is in the future or the past
            if ($this->start_date <= time())
                $expected_progress = 100;
            else $expected_progress = 0;
        } else if ($elapsed_time < 0)
            $expected_progress = 0;
        else {
            $expected_progress = min(array(round($elapsed_time / $total_time, 2) * 100, 100));

            if ($expected_progress < 0)
                $expected_progress = 0;
        }

        $this->set('expected_progress', $expected_progress);

        return $expected_progress;
    }

    function has_due_date() {
        return isset($this->due_date);
    }

    function get_total_time() {
        $sql = "SELECT SUM(total_time) AS project_total_time FROM tasks WHERE project_id = $this->id";

        $time = $this->select($sql);

        $time = isset($time[0]) && isset($time[0]->project_total_time) ? $time[0]->project_total_time : 0;

        return $time;
    }


    function get_invoice_stat($stat_name, $sql) {
        $stat = $this->select($sql);
        $stat = isset($stat[0]) && isset($stat[0]->$stat_name) ? $stat[0]->$stat_name : 0;
        return $stat;
    }

    function get_invoice_stats() {
        $billed = $this->get_invoice_stat('total_billed', "SELECT SUM(total) AS total_billed FROM invoices WHERE project_id = $this->id");
        $paid = $this->get_invoice_stat('total_paid', "SELECT SUM(total) AS total_paid FROM invoices WHERE project_id = $this->id AND is_paid = 1");
        $outstanding = $this->get_invoice_stat('total_outstanding', "SELECT SUM(total) AS total_outstanding FROM invoices WHERE project_id = $this->id AND is_paid = 0");

        return array(
            'total_billed' => $billed,
            'total_paid' => $paid,
            'total_outstanding' => $outstanding
        );
    }

    function get_overdue_invoices() {
        $sql = "SELECT * FROM invoices WHERE project_id = $this->id AND is_overdue = 1";
        $overdue = $this->select($sql);
    }

    function update_status($task_counts = null) {
        //there is no way to assess status on projects without a due date
        if (!$this->has_due_date()) {
            $this->set('status_text', 'on-schedule');
            return true;
        }

        if ($this->is_template == true)
            return;

        //it's possible to pass in the task counts (an array with the number of incomplete, complete, and total number
        //of tasks. This will be used to determine if the project has been started or not (a task count greater than
        //0 indicates that the project has started

        $expected_progress = $this->calculate_expected_progress();

        $old_status = $this->status_text;


        //if the due date has passed and the current progress isn't 100%, then the project is overdue regardless
        //of the expected progress value
        if ($this->due_date < time() && $this->progress < 100) {
            if ($this->progress <= 100)
                $this->set('status_text', 'overdue');


        } else if ($expected_progress > 0) {
            //the due date is sometime in the future, so let's set the status based on the expected progress
            if ($this->progress >= 100) {
                //if the task counts hasn't been passed in, we will need them to differentiate between a complete project
                //and a project that hasn't been started
                if (!isset($task_counts))
                    $task_counts = $this->get_task_counts();

                //if we're passing in the task counts and there arent' yet any tasks, the project status should be not
                //started.
                if ($task_counts['total'] == 0)
                    $this->set('status_text', 'not-started');
                else $this->set('status_text', 'complete');
            } else if ($expected_progress - $this->progress >= 25)
                $this->set('status_text', 'behind-schedule');
            else if ($expected_progress - $this->progress >= 10)
                $this->set('status_text', 'at-risk');
            else $this->set('status_text', 'on-schedule');
        } else $this->set('status_text', 'on-schedule');
//


        if (isset($old_status) && ($old_status != $this->status_text)) {
          $this->save_new_status($this->status_text);
            ActivityManager::project_status_changed($this);

        }

        return true;
    }

    function save_new_status($new_status){

        if(!isset($this->id))
            return;

        $sql = "UPDATE projects SET status_text = '$new_status' WHERE id = $this->id";
        $this->execute($sql);
    }

    function delete_project_files() {
        $files = $this->get_files();

        if (is_array($files)) {
            foreach ($files as $file) {
                $file = new File($file);
                $file->delete();
            }
        }

        $sql = "DELETE from files where project_id = " . $this->id;
        $this->execute($sql);
    }

    function delete() {
        $sql_delete_tasks = "DELETE FROM tasks WHERE project_id = " . $this->id;
        $this->execute($sql_delete_tasks);

        $this->delete_project_files();

        $this->delete_file_folder();

        $result = parent::delete();

        ActivityManager::project_deleted($this);

        return $result;
    }

    //used when getting a single project
    function user_can_access(User $user = null) {
        if(!isset($user))
            $user = current_user();

        if ($user->is('admin') || $user->client_id == $this->client_id)
            return true;
        else if ($user->is('agent')) {
            return $this->is_assigned_to($user);
        } else return false;
    }

    function is_assigned_to($user) {
        if (!isset($this->assigned_users)) {
            $sql = "SELECT user_id FROM user_project WHERE project_id = $this->id";

            $users = $this->select($sql);

            //we need to convert user into a usable array. Right now it's an array of recoredset objects. We want an
            //array of ids
            $users = array_map(function($result) {
                return $result->user_id;
            }, $users);

            $this->assigned_users = $users;
        }

        return in_array($user->id, $this->assigned_users);

    }


    function assign_user($user_id) {
        $sql = "SELECT id FROM user_project WHERE user_id = $user_id AND project_id = $this->id";
        $result = $this->select($sql);

        if (count($result) == 0) {
            $this->insert(array(
                'user_id' => $user_id,
                'project_id' => $this->id
            ), 'user_project');

            return true;
        } else {
            $this->set_error('project_id', Language::get('errors.assign_user_to_project_user_already_exists'));
            return false;
        }
    }

    function remove_user($user_id){
        if(!current_user()->is('admin'))
            return false;

        $sql = "DELETE FROM user_project WHERE user_id = $user_id AND project_id = $this->id";
        $result = $this->execute($sql);

        return true;
    }

    function remove_user_from_all_projects($user_id){
        $sql = "DELETE FROM user_project WHERE user_id = $user_id";
        $this->execute($sql);
        return true;
    }

    function get_people($get_admins = true, $get_agents = true, $get_clients = true){

        if($get_admins == true){
            //todo: there should be a general get admin function
            $sql = "SELECT role_user.user_id, roles.name AS role, users.email, users.id, users.first_name, users.last_name
                FROM role_user
                LEFT JOIN users
                  ON users.id = role_user.user_id
                LEFT JOIN roles
                  ON role_user.role_id = roles.id
                WHERE role_user.role_id = 1";

            $admins = $this->select($sql);
        }
        else $admins = array();


        if($get_clients == true){
            $sql = "SELECT users.id, users.email,users.first_name, users.last_name, role_user.role_id, roles.name AS role
                FROM users
                LEFT JOIN role_user
                  ON role_user.user_id = users.id
                LEFT JOIN roles
                  ON role_user.role_id = roles.id
                WHERE client_id = $this->client_id
                GROUP BY users.id";

            $clients = $this->select($sql);
        }
        else $clients = array();


        if($get_agents == true){
            $sql = "SELECT users.id, users.email, users.first_name, users.last_name, role_user.role_id, roles.name AS role
                FROM users
                 LEFT JOIN role_user
                  ON role_user.user_id = users.id
                LEFT JOIN roles
                  ON role_user.role_id = roles.id
                WHERE role_user.role_id = 3
                  AND users.id IN(SELECT user_id FROM user_project WHERE project_id = $this->id)";

            $agents = $this->select($sql);
        }
        else $agents = array();


        foreach($admins as &$admin){
            $admin->user_image = User::get_profile_image($admin->id);
        }

        foreach($clients as &$client){
            $client->user_image = User::get_profile_image($client->id);
        }

        foreach($agents as &$agent){
            $agent->user_image = User::get_profile_image($agent->id);
        }


        return array(
            'admins' => $admins,
            'clients' => $clients,
            'agents' => $agents
        );
    }

    function get_assignable_users_for_task(){
        if(!get_config('task.clients_can_complete_tasks') == true) {
            $people = $this->get_people(true, true, false);
            $people = array_merge($people['admins'], $people['agents']);
        }
        else {
            $people = $this->get_people(true, true, true);
            $people = array_merge($people['admins'], $people['agents'], $people['clients']);
        }


        return $people;
    }


}

 
