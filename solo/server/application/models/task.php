<?php
use phpSweetPDO\SQLHelpers\Basic as Helpers;

Class Task extends Model
{
    public $task;
    public $notes;
    public $is_complete;
    public $is_section;
    public $assigned_to;
    public $project_id;
    public $section_id;

    public $created_by;
    public $position;
    public $due_date;
    public $weight;
    public $status_text;
    public $is_overdue;
    public $is_invoiced;
    public $invoice_id;
    public $completed_by;
    public $completed_date;
    public $total_time;
    public $created_date;
    public $modified_date;

    //params not saved to the db
    public $assigned_to_name;


    function validate()
    {
        $this->validator_tests = array(
            'task' => 'required'
        );

        return parent::validate();
    }

    function base_sql_for_get()
    {
        $sql = "SELECT tasks.*, files.name AS file, CONCAT(users.first_name, ' ', users.last_name) AS assigned_to_name, projects.name AS project_name
                FROM tasks
                LEFT JOIN users ON users.id = tasks.assigned_to
                LEFT JOIN projects on projects.id = tasks.project_id
                LEFT JOIN files ON files.entity_type = 'task' AND files.entity_id = tasks.id";

        return $sql;
    }

    function get($criteria = null, $order = null)
    {

        if (isset($criteria) && is_numeric($criteria)) {
            $sql = $this->base_sql_for_get();
            $sql .= " WHERE tasks.id = $criteria";
            $task = parent::get_one($sql);

            $this->update_status();

            return $task;
        } else {
            //this branch was mostly abandoned when we switched to the list format, where a task
            //list is a set of tasks organized by section

            //this branch is currently only used by agenda
            return $this->get_tasks($criteria,  array('due_date', 'ASC'));

        }
    }

    function organize($sections, $tasks)
    {
        $tasks_by_section_id = array();
        $organized = array();

        foreach ($tasks as $task) {
            $section_id = $task->section_id;

            if (!isset($tasks_by_section_id[$section_id])) {
                $tasks_by_section_id[$section_id] = array();
            }

            $tasks_by_section_id[$section_id][] = $task;
        }

        foreach ($sections as $section) {
            $organized[$section->id] = array();
            $organized[$section->id]['section'] = $section;
            $organized[$section->id]['tasks'] = $tasks_by_section_id[$section->id];

        }

        return $organized;
    }

    function get_tasks($criteria, $order)
    {
        $sql = $this->base_sql_for_get();
        $sql = $this->add_criteria($sql, $criteria);
        $sql = $this->modify_sql_for_user_type($sql);

        //needed because we're now joiining files and if there are multiple files, multiple rows for the same task will be returned. Obviously we don't want that
        //since the file join is simply to see IF there are files. We don't actually care about the file rows, since those are grabbed separately for each
        //task
        $sql .= " GROUP BY tasks.id";

        $sql = $this->add_order_by($sql, $order);


        $tasks = parent::get($sql);

        $tasks = $this->process_tasks($tasks);

        return $tasks;
    }

    function process_tasks($tasks)
    {
        foreach ($tasks as &$task) {
            //create the invoice
            $task_object = new Task($task);
//todo: i don't think this makes any sense because the invoice status will already be updated when I create the invoice using new Invoice
            //store the current task status as it exists in the database
            $old_status = $task_object->status_text;

            //update the task status
            $task_object->update_status();

            //if the old status and the new status do not match, then we need to save this task back to the database.
            if ($old_status != (string)$task_object->status_text) {
                //todo:make sure this isn't saving each time
                $task_object->save(false);
            }

            //we need to add the status text back the task array, since we're sending the array to the client,
            //not the object
            $task['status_text'] = $task_object->status_text;
            $task['user_image'] = User::get_profile_image($task['assigned_to'], true);
            //$tasks_organized_by_section[$task->section_id]['tasks'][] = $task;
        }

        return $tasks;
    }

    function get_list($list_id, $order, $additional_criteria = ''){

        $criteria = " WHERE tasks.project_id = $list_id $additional_criteria";
        $tasks = $this->get_tasks($criteria, $order);

        $task_section = new TaskSection();
        $sections = $task_section->get_list_sections($list_id);



        return array('tasks' => $tasks, 'sections' => $sections);
    }


    function update_status()
    {

        $today = strtotime('today midnight');
        $at_risk_timeframe = get_config('task.at_risk_timeframe');
        $at_risk_startpoint = strtotime("+$at_risk_timeframe days midnight");

        if ($this->is_complete == true) {
            $this->set('status_text', '');
            $this->set('is_overdue', false);
            return;
        }

        //due_date == 0 condition is a hack until we figure out how to handle
        if (!isset($this->due_date) || $this->due_date == 0) {
            $this->set('status_text', '');
            $this->set('is_overdue', false);
        } else if ($this->due_date < $today) {
            $this->set('status_text', Language::get('task.overdue'));
            $this->set('is_overdue', true);
        } else if ($this->due_date >= $today && $this->due_date <= $at_risk_startpoint) {
            $this->set('status_text', Language::get('task.atRisk'));
            $this->set('is_overdue', false);
        } else {
            $this->set('status_text', Language::get('task.onSchedule'));
            $this->set('is_overdue', false);
        }
    }

    function prep_fields_for_db()
    {
        //convert boolean values to 1/0 for the db. The client will send them as strings
        $is_complete = isset($_POST['isComplete']) && $_POST['isComplete'] == 'true' ? 1 : 0;
        $this->set('is_complete', $is_complete);

        $is_section = isset($_POST['isSection']) && $_POST['isSection'] == 'true' ? 1 : 0;
        $this->set('is_section', $is_section);
    }

    function quick_save()
    {
        //unset params that aren't saved to the db
        $this->unset_param('assigned_to_name');
        parent::save();
    }

    function can_save($current_user)
    {
        if ($current_user->is('client')) {
            if (get_config('task.clients_can_create_tasks') == true) {
                return true;
            } else {
                //clients can only modify a task if the correct option is turned on and the task is assigned to them
                return (get_config('task.clients_can_complete_tasks') == true) && ($this->assigned_to == $current_user->id);

            }
        } else return true;
    }

    function save($process_task = true)
    {
        $current_user = current_user();


        if (!$this->can_save($current_user)) {
            return false;
        }

        //we need to import parameters before we set the value, otherwise the manipulated values will be overridden
        $this->import_parameters();

        if (!isset($this->project_id)) {
            $this->set_error('project_id', Language::get('errors.task_invalid_project'));
            return false;
        }
        //todo:should we check that the user is the owner of this project or is the task owner function enough
        $project = new Project($this->project_id);



        //there are some cases when we don't want to do all of this additional processing (i.e. when we're just
        //updating the status (overdue, on schedule, etc)
        if ($process_task == false) {
            //unset params that aren't saved to the db
            $this->unset_param('assigned_to_name');
            return parent::save();
        }

        $update_tasks_manager = false;

        //unset params that aren't saved to the db
        $this->unset_param('assigned_to_name');

        $this->prep_fields_for_db();


        if (!isset($this->assigned_to))
            $this->set('assigned_to', $current_user->id);

        if ($this->is_new()) {
            $is_new = true;
            $update_tasks_manager = true;

            $this->set('created_date', time());
            $this->set('created_by', $current_user->id);
        } else {
            $is_new = false;

            //we need to compare the existing value to the new values
            //todo:we can eliminate the need for this extra set of queries if we create a 'previous values' array on the model that's set each time we call clear params. Too many queries when saving tasks.
            $existing_values = new Task($this->id);

            //are we marking the task complete? (i.e. it was previously set as incomplete, but we're not setting it as
            //complete
            if ((bool)$existing_values->is_complete == false && (bool)$this->is_complete == true) {
                $this->set('completed_date', time());
                $this->set('completed_by', $current_user->id);
                ActivityManager::task_completed($this);
            } else if ((bool)$existing_values->is_complete == true && (bool)$this->is_complete == false) {
                //the task was previously complete, but we're setting it back to active
                $this->set('completed_date', NULL);
            }

            //are we assigning this task to someone new?
            if (isset($this->assigned_to) && ($this->assigned_to != $existing_values->assigned_to)) {
                $assigned_to_user = new User($this->assigned_to);

                ActivityManager::task_reassigned($this, $assigned_to_user);

                $email = new AppEmail();
                $email->send_task_assignment(array(
                    'task' => $this,
                    'user' => $assigned_to_user
                ));
            }
        }

        //save the invoice in the database
        $result = parent::save();

        //add the task to the activity stream if it's new
        if ($is_new) {
            ActivityManager::task_created($this);
        }

        //update teh task order, if this is a new task (existing task reorders generate a call directly to the taskmanger
        //class so they don't need to be handled here
        //todo:this doesn't look relevant anymore, but it's definitely still being called when a new task is created so investigate how removing it will affect functionality
        if ($update_tasks_manager == true) {
            //newOrder, and oldOrder will only be set if the task is created from task list, not from the modal
            if (isset($_POST['newOrder']) && isset($_POST['oldOrder'])) {
                $tasks_manager = new TasksManager();
                //normalize names using order/original order, newOrder/oldOrder, and order/newOrder or something
                $tasks_manager->order = $_POST['newOrder'];
                $tasks_manager->original_order = $_POST['oldOrder'];
                $tasks_manager->save_new($this->id);
            }
        }

        //todo:we'll have a mark_complete function and a set_weight function
        $project->update_progress();

        return $result;

    }

    function set_due_date($due_date){
        $this->set('due_date', $due_date);
        $this->update_status();
        parent::save();
        return $this;
    }


    function get_files()
    {
        //todo: it would be good if calls to get_files and calls to get_time entries didn't initiate calls to update status. This is true of other entities too (i.e. projects)
        $sql = File::generate_base_sql_for_get() . " WHERE entity_type = 'task' AND entity_id = " . $this->id;

        return parent::get($sql);
    }

    function get_time_entries()
    {

        $sql = "SELECT time_entries.*, CONCAT(users.first_name, ' ', users.last_name) as user_name
                FROM time_entries
                LEFT JOIN users on time_entries.user_id = users.id
                WHERE task_id = $this->id";

        return parent::get($sql);
    }

    function update_total_time()
    {
        $total_time = 0;

        //get the time entries for this task
        $time_entries = new TimeEntry();
        $time_entries = $time_entries->get("WHERE task_id = $this->id");

        if (is_array($time_entries)) {
            //add each time entry to the total
            foreach ($time_entries as $time_entry) {
                $total_time += (int)$time_entry['time'];
            }

        }

        $this->set('total_time', $total_time);

        //we don't need to do any of the extra processing perfomed by the task save dunction
        return parent::save();
    }

    function delete()
    {
        $result = parent::delete();
        $this->update_project_progress();

        ActivityManager::task_deleted($this);

        return $result;
    }

    function update_project_progress()
    {
        $project = new Project($this->project_id);
        $project->update_progress();
    }

    function user_can_access(User $user = null)
    {
        return true;
    }

    function assign($user_id)
    {
        $assignable_users = $this->get_assignable_users();
        $assignable_ids = array_map(function ($user) {
            return $user->id;
        }, $assignable_users);


        if (in_array($user_id, $assignable_ids)) {
            $this->set('assigned_to', $user_id);
            $this->save();

            return new User($user_id);
        } else return false;
    }

    function get_assignable_users()
    {
        $current_user = current_user();

        if (!$current_user->is('admin') && !$current_user->is('agent'))
            return false;


        $project = new Project($this->project_id);
        $people = $project->get_assignable_users_for_task();


        return $people;
    }


}
 
