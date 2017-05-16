<?php

use phpSweetPDO\SQLHelpers\Basic as Helpers;

Class User extends Model {

    public $client_id;
    public $first_name;
    public $last_name;
    public $email;
    public $address1;
    public $address2;
    public $phone;
    public $role;
    public $temp_password;

    //not saved to the db
    public $profile_image;
    public $client_name;
    private $assigned_projects;

    function validate() {
        $this->validator_tests = array(
            'first_name' => 'required',
            'email' => 'required'
        );

        return parent::validate();
    }

    function save() {
        $this->import_parameters();

        if ($this->is_new()) {
            return $this->create();
        } else {
            $current_user = current_user();

            if (!$current_user->is('admin') && $current_user->id != $this->id)
                return false;

            $this->unset_param('profile_image');
            $this->unset_param('role');
            $this->unset_param('client_name');
            $this->unset_param('assigned_projects');
            return parent::save();
        }
    }

    function new_admin() {
        if (!current_user()->is('admin'))
            return false;

        $this->import_parameters();
        $this->role = 'admin';
        return $this->create();
    }

    function new_agent() {
        if (!current_user()->is('admin'))
            return false;

        $this->import_parameters();
        $this->role = 'agent';
        return $this->create();
    }

    function create() {
        $auth = new Auth();

        if ($auth->username_available($this->email)) {

            $current_user = current_user();
            //clients can only create client users for their own account
            if ($current_user->is('client') && $this->client_id != $current_user->client_id)
                return false;

            parent::save();

            //if the role isn't set (by the new_admin or new_member functions), then this is a client
            if (!isset($this->role))
                $this->role = 'client';

            //only an admin can create a new admin or a new member
            if (($this->role == 'admin' || $this->role == 'agent') && !$current_user->is('admin'))
                return false;

            //if we're creating a client user, we need the client id
            if ($this->role == 'client' && !isset($this->client_id))
                return false;

            $role_number = $this->role_number($this->role);
            $registration = $auth->register($this->id, $role_number);

            if ($registration['result'] != false) {

                $email = new AppEmail();

                $email->send_new_user($this, array(
                    'email' => $this->email,
                    'temporary_password' => $registration['temporary_password']
                ));

                return array('id' => $this->id);
            } else return true;
        } else $this->set_error('email', Language::get('errors.user_email_address_exists')); //todo:lang

    }

    function get($criteria = null) {
        $user_fields = 'users.id, users.first_name, users.last_name, CONCAT(users.first_name, " ", users.last_name) AS name, users.email, users.address1,
                        users.address2, users.phone';

        if (is_numeric($criteria)) {
            //if we are getting a specific user, we want to get their role info
            //TODO: this only selects the first role. Need to change this if multiple roles are ever applied to one user
            //TODO: there should be a standard way to do this
            //TODO: this is including the username, password, salt in the user object - big no no
            $sql = "SELECT $user_fields, role_user.role_id, roles.name AS role FROM users
                    LEFT JOIN role_user
                      ON role_user.user_id = '$criteria'
                    LEFT JOIN roles
                      ON roles.id = role_user.role_id
                    WHERE users.id = '$criteria'";

            $params = parent::get_one($sql);

            $params->profile_image = $this->get_profile_image($params->id, false);

            return $params;
        } else {

            if(!current_user()->is('agent')){
                $sql = "SELECT $user_fields, role_user.role_id, roles.name AS role
                    FROM users
                    LEFT JOIN role_user
                      ON role_user.user_id = users.id
                    LEFT JOIN roles
                      ON roles.id = role_user.role_id
                    GROUP BY users.id";

                $sql = $this->modify_sql_for_user_type($sql);

                //todo: this isn't going to work for agents...I dont' think
                //we don't need the user's role info if we're getting a list so let's use the get function on the base model
                return parent::get($sql);
            }
            else return $this->get_users_list_for_an_agent($user_fields);


        }
    }

    function get_users_list_for_an_agent($user_fields) {
        $current_user = current_user();

        //get all admins

        $sql = "SELECT $user_fields, role_user.user_id, roles.name AS role, users.email, users.id
                FROM role_user
                LEFT JOIN users
                  ON users.id = role_user.user_id
                LEFT JOIN roles
                  ON role_user.role_id = roles.id
                WHERE role_user.role_id = 1";

        $admin_users = $this->select($sql);



        //get clients users
        //we have an agent id and we need to get all client users associated with this agent, this means that first we
        //need to get a list of projects that the agent is assigned to. Once we have the list of projects, we can get a
        //list of client ids associated with those projects (each project is associated with a client). Once we have a
        //list of client ids, we can get the list of users that comprise the client
        $sql = "SELECT $user_fields, role_user.role_id, roles.name AS role
                FROM users
                LEFT JOIN role_user
                  ON role_user.user_id = users.id
                LEFT JOIN roles
                  ON roles.id = role_user.role_id
                WHERE users.client_id IN (
                    SELECT projects.client_id
                    FROM projects
                    WHERE projects.id IN(
                      SELECT user_project.project_id
                      FROM user_project
                      WHERE user_project.user_id = $current_user->id
                    )
                )";

        $client_users = $this->select($sql);


        //get list of agents
        //get a list of project that this agent is on, then get a list of user_ids for other agents that are on the same
        //projects, then get all of the info for those users
        $sql = "SELECT $user_fields, role_user.user_id, roles.name AS role
                FROM role_user
                LEFT JOIN users
                  ON users.id = role_user.user_id
                LEFT JOIN roles
                  ON role_user.role_id = roles.id
                WHERE role_user.role_id = 3 AND users.id IN(
                      SELECT user_project.user_id
                      FROM user_project
                      WHERE user_project.project_id IN (
                          SELECT user_project.project_id
                          FROM user_project
                          WHERE user_project.user_id = $current_user->id
                      )
                )";

        $agent_users = $this->select($sql);

        return array_merge($admin_users, $client_users, $agent_users);
    }

    function client_side() {
        return array(
            'role' => $this->role,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'image' => $this->get_profile_image($this->id),
            'id' => $this->id,
            'requires_password_reset' => !empty($this->temp_password)
        );
    }

    function load_from_email_address($email){
        $sql = "SELECT id FROM users WHERE email = '$email'";
        $id = $this->select($sql);


        if(isset($id[0])){
            return new User($id[0]['id']);
        }
        else return false;



    }


    static function get_profile_image($user_id, $is_thumb = true) {

        //a user image == 0 indicates that the system generated an activity item
        if($user_id == 0){
           return get_config('uploads.user_images_web_path') . "system.jpg";
        }
        $image_path = glob(get_config('uploads.user_images_path') . "$user_id.*");
        if (isset($image_path[0])) {
            $ext = pathinfo($image_path[0], PATHINFO_EXTENSION);
            $base = get_config('uploads.user_images_web_path');

            if (!$is_thumb) {
                $image_url = $base . "$user_id.$ext";
            } else  $image_url = $base . "thumbs/$user_id.$ext";

        } else {
            if (!$is_thumb) {
                $image_url = get_config('unknown_user');
            } else $image_url = get_config('unknown_user_thumb');
        }

        return $image_url;
    }

    function delete_existing_images($user_id) {
        $images = glob(get_config('uploads.user_images_path') . "$user_id.*");
        $thumbs = glob(get_config('uploads.user_images_path') . "thumbs/$user_id.*");

        if (is_array($images)) {
            foreach ($images as $image) {
                if (is_file($image))
                    unlink($image);
            }
        }

        if (is_array($thumbs)) {
            foreach ($thumbs as $image) {
                if (is_file($image))
                    unlink($image);
            }
        }
    }

    function set_profile_image() {
        $this->delete_existing_images($this->id);

        //save references to the upload paths
        $upload_path = get_config('uploads.user_images_path');
        $web_path = get_config('uploads.user_images_web_path');

        File::set_upload_headers();


        //make the directories for the user images if they do not exist
        if (!is_dir($upload_path))
            Utils::create_directory($upload_path);

        if (!is_dir($upload_path . 'thumbs/'))
            Utils::create_directory($upload_path . 'thumbs/');


        //get the extension of the original image
        $ext = pathinfo($_FILES['files']['name'][0], PATHINFO_EXTENSION);

        //generate the filename for the image (user id + original extionsion) i.e. 1.jpg
        $name = isset($ext) && !empty($ext) ? "$this->id.$ext" : $this->id;

        //perform the upload
        $upload = new Upload(array(
            'upload_dir' => $upload_path,
            'upload_url' => $web_path,
            'file_name' => $name,
            'overwrite_existing' => true
        ));

        $status = $upload->post();

        $status = $status[0];

        if ($status->size > 0) {
            //we need to resize the images, the large size, and the thumb size
            $this->resize($upload_path . "$name", $upload_path . "$name", 200, 100);
            $this->resize($upload_path . "$name", $upload_path . "thumbs/$name", 80, 90);
            return true;
        } else return false;
    }

    //pulled from acp
    function resize($src_image, $dest_image, $thumb_size = 64, $jpg_quality = 90) {
        $image = getimagesize($src_image);

        if ($image[0] <= 0 || $image[1] <= 0) return false;
        $image['format'] = strtolower(preg_replace('/^.*?\//', '', $image['mime']));

        switch ($image['format']) {
            case 'jpg':
            case 'jpeg':
                $image_data = imagecreatefromjpeg($src_image);
                break;
            case 'png':
                $image_data = imagecreatefrompng($src_image);
                break;
            case 'gif':
                $image_data = imagecreatefromgif($src_image);
                break;
            default:
                // Unsupported format
                return false;
                break;
        }


        if ($image_data == false) return false;

        // Calculate measurements
        if ($image[0] > $image[1]) {
            // For landscape images
            $x_offset = ($image[0] - $image[1]) / 2;
            $y_offset = 0;
            $square_size = $image[0] - ($x_offset * 2);
        } else {
            // For portrait and square images
            $x_offset = 0;
            $y_offset = ($image[1] - $image[0]) / 2;
            $square_size = $image[1] - ($y_offset * 2);
        }

        // Resize and crop
        $canvas = imagecreatetruecolor($thumb_size, $thumb_size);
        if (imagecopyresampled($canvas, $image_data, 0, 0, $x_offset, $y_offset,
            $thumb_size, $thumb_size, $square_size, $square_size)
        ) {

            // Create thumbnail
            switch (strtolower(preg_replace('/^.*\./', '', $dest_image))) {
                case 'jpg':
                case 'jpeg':
                    return imagejpeg($canvas, $dest_image, $jpg_quality);
                    break;
                case 'png':
                    return imagepng($canvas, $dest_image);
                    break;
                case 'gif':
                    return imagegif($canvas, $dest_image);
                    break;
                default:
                    // Unsupported format
                    return false;
                    break;
            }
        } else {
            return false;
        }
    }


    static function set_profile_images($array, $is_thumb = true) {
        foreach ($array as &$array_item) {
            $array_item['user_image'] = User::get_profile_image($array_item['user_id'], $is_thumb);
        }
    }

    function forgot_password() {
        $auth = new Auth();

        $temp_password = $auth->forgot_password($this->email);

        if ($temp_password != false) {
            $email = new AppEmail();
            $result = $email->send_forgot_password($this, array(
                'temp_password' => $temp_password
            ));
        } else return false;

        return $result;
    }

    function send_password() {
        $auth = new Auth();

        $temp_password = $auth->forgot_password($this->email);

        $email = new AppEmail();
        $result = $email->send_admin_regenerate_password($this, array(
            'temp_password' => $temp_password,
            'email' => $this->email
        ));

        return $result;
    }

    function change_password() {
        $auth = new Auth();

        $current_password = Request::get('current_password');
        $new_password = Request::get('new_password');
        $new_password_confirm = Request::get('new_password_confirm');

        if ($new_password != $new_password_confirm)
            $this->set_error('new_password', Language::get('errors.user_passwords_dont_match'));


        $result = $auth->change_password($this->id, $current_password, $new_password, $new_password_confirm);

        if ($result !== true) {
            $this->set_error('new_password', Language::get('errors.user_error_changing_password'));
        } else {
            $email = new AppEmail();
            $result = $email->send_changed_password($this);
        }

        return $result;
    }

    function role_number($role_name){
        $roles = array(
            'admin' => 1,
            'client' => 2,
            'agent' => 3
        );

        return $roles[$role_name];
    }
    function is($role) {
        return $this->role == strtolower($role);
    }

    function can_access(Model $object) {
        return $object->user_can_access($this);
    }

    function user_can_access(User $user = null) { //name this is_owner?

        if(!isset($user))
            $user = current_user();

        if ($user->role == 'admin')
            return true;

        else if ($user->is('agent')) {
            //am i accessing my own user account
            if ($this->id == $user->id)
                return true;

            //agents can see all admins
            if ($this->is('admin'))
                return true;

            //if current user is attempting to access a client, then the current user must be assigned to one of the
            //client's projects
            if ($this->is('client') && $user->is_assigned_to_project_with_client_user($this))
                return true;

            //if the current user is attempting to access another agent, then they have to have a project in common
            if ($this->is('agent') && $this->shares_project_with_other_agent($user))
                return true;

            return false;
        }
        else if ($user->role == 'client'){
            //clients can see all admins
            if ($this->is('admin')){
                return true;
            }
            else if($this->is('agent') && $this->is_assigned_to_project_with_client_user($user)){
                return true;
            }
            else return $user->client_id == $this->client_id;
        }
        else return false;
    }

    function can($action, Model $entity) {
//        pre($this);
//        pre(RBAC::role_can_perform_action($this->role, $action, get_class($entity)) === true ? 'yes' : 'no');
//        pre($this->can_access($entity) === true ? 'yes2' : 'no2');
        //todo:I dhouldn't be checking can_access for creates should I? create is just an empty object. No one owns it yet
        return RBAC::role_can_perform_action($this->role, $action, get_class($entity)) && $this->can_access($entity);
    }

    function delete() {
        if (!current_user()->is('admin'))
            return false;

        if ($this->is('agent')) {
            $project = new Project();
            $project->remove_user_from_all_projects($this->id);
        }

        $auth = new Auth();
        return $auth->unregister($this->id);
    }

    //these functions are specific to user's with the 'agent' role
    function shares_project_with_other_agent(User $agent) {
        $projects = $this->get_assigned_projects();
        $user_projects = $agent->get_assigned_projects();
        $shared_projects = array_intersect($projects, $user_projects);

        return count($shared_projects) > 0;
    }

    function is_assigned_to_project_with_client_user(User $client_user) {
        $projects = $this->get_assigned_projects();

        $is_assigned_to_project_with_user = false;

        foreach ($projects as $project_id) {
            //todo. it would be great if I could get a list of project objects with one query.
            $project = new Project($project_id);

            if ($project->client_id == $client_user->client_id) {
                $is_assigned_to_project_with_user = true;
                break;
            }
        }

        return $is_assigned_to_project_with_user;

    }

    //todo:Do I want to keep this contained to the project model?
    function get_assigned_projects() {

        if (!isset($this->assigned_projects)) {
            $sql = "SELECT * FROM user_project WHERE user_id = $this->id";
            $projects = $this->select($sql);

            //we need to convert user into a usable array. Right now it's an array of recoredset objects. We want an
            //array of ids
            $projects = array_map(function($result) {
                return $result->project_id;
            }, $projects);

            $this->assigned_projects = $projects;
        }

        return $this->assigned_projects;
    }

    function is_assigned($project) {
        return in_array($project->id, $this->get_assigned_projects());
    }

    function get_agents() {
        if (!current_user()->is('admin'))
            return false;

        $sql = "SELECT role_user.user_id, role_user.role_id, users.id, users.first_name, users.last_name, roles.name AS role
                FROM role_user
                LEFT JOIN users
                    ON role_user.user_id = users.id
                LEFT JOIN roles
                    ON role_user.role_id = roles.id
                WHERE role_id = 3";

        return $this->select($sql);
    }


}
 
