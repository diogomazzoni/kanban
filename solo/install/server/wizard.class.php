<?php

class Wizard
{
    public $step_number;
    public $variables;
    public $steps;

    function __construct()
    {
        require_once('installer.class.php');
        $this->installer = new Installer();
        $this->init_steps();

//        $_POST = $this->clean($_POST);
//        $_GET = $this->clean($_GET);
    }

    function init_steps()
    {
        $this->steps = array(
            'introduction',
            'server_compatibility',
            'folder_permissions',

            'database',
            'main_config',
            'finish'
        );
    }

    function start()
    {
        $step_number = isset($_GET['step']) ? $_GET['step'] : 1;

        $this->step_number = $step_number;
        $step_name = $this->steps[$step_number - 1];
        $this->$step_name();
    }

    function next_step_url()
    {
        echo $this->get_next_step_url();
    }

    function get_next_step_url()
    {
        return 'index.php?step=' . ((int)$this->step_number + 1);
    }

    function go_to_next_step()
    {
        header('Location:' . $this->get_next_step_url());
    }

    function step_number($step_name)
    {
        return array_search($step_name, $this->steps) + 1;
    }

    static function clean($str)
    {
        $str = is_array($str) ? array_map(array('Wizard', 'clean'), $str)
            : str_replace('\\', '\\\\', strip_tags(trim(htmlspecialchars((get_magic_quotes_gpc()
                ? stripslashes($str) : $str), ENT_QUOTES))));

        return $str;
    }

    function get_param($param_name)
    {
     //comparing against empty string, null, and false rather than using php's empty function because php's empty function
        //also compares against 0, and for the purposes of this wizard, 0 is a perfectly acceptable value
     if (isset($_POST[$param_name]) && $_POST[$param_name] !== '' && $_POST[$param_name] !== false && $_POST[$param_name] !== null)
            return $_POST[$param_name];
        else return false;
    }


    function load_view($name)
    {
        $this->set('step_number', $this->step_number);

        @extract($this->variables);

        ob_start();

        require_once('templates/header.php');
        require_once("templates/$name.php");
        require_once('templates/footer.php');

        ob_end_flush();

    }

    function set($name, $value)
    {
        $this->variables[$name] = $value;
    }


    function introduction()
    {
        $title = 'Introduction';

        if($this->installer->is_upgrade())
            $title .= ' - UPGRADE TO VERSION ' . $this->installer->version();

        $this->set('step_title', $title);
        $this->load_view('introduction');
    }

    function server_compatibility()
    {
        $this->set('step_title', 'Server Compatibility');

        $response = $this->installer->check_compatibility();
        $this->set('compatibility', $response);
        //check php version
        //
        $this->load_view('server_compatibility');
    }



    function folder_permissions()
    {
        $this->verify_requirements(__FUNCTION__);

        if ($check_permissions = $this->get_param('check_permissions')) {
            $result = $this->installer->check_folder_permissions();
            $result = $result->get_data();

            $this->set('permissions_result', $result['result'] == true);
            $this->set('config_folder_result', $result['config_folder']);
            $this->set('file_folder_result', $result['file_folder']);
            $this->set('logs_folder_result', $result['logs_folder']);
            $this->set('tmp_folder_result', $result['tmp_folder']);
            $this->set('language_combined_result', $result['language_combined_result']);
            $this->set('language_folder_result', $result['language_folder_result']);
            $this->set('build_folder_result', $result['build_folder_result']);
            $this->set('build_file_result', $result['build_file_result']);
        }

        $this->set('step_title', 'Folder Permissions');
        $this->load_view('folder_permissions');
    }

    function database()
    {
        $this->verify_requirements(__FUNCTION__);

        if(!$this->installer->is_upgrade()){
            $db_name = $this->get_param('database_name');
            $db_host = $this->get_param('database_hostname');
            $db_user = $this->get_param('database_username');
            $db_pass = $this->get_param('database_password');
        }
        else{
            $db_name = $this->installer->get_config('database.name');
            $db_host = $this->installer->get_config('database.hostname');
            $db_user = $this->installer->get_config('database.user');
            $db_pass = $this->installer->get_config('database.password');
        }

        $is_submitted = isset($_POST['is_submitted']) && $_POST['is_submitted'] == 1;

        //no need to check the db_pass variable because it can be empty - i.e. default wamp install
        if ($is_submitted == true && $db_name != false && $db_host != false && $db_user != false) {

            //if no password was supplied then assume the user's password is the empty string.
            if($db_pass == false)
                $db_pass = '';

            $response = $this->installer->connect_to_database($db_name, $db_host, $db_user, $db_pass);

            //make sure we can connect to the databse
            if (!$response->ok()) {
                //we were unable to connect
                $this->set('result', 'error');
                $this->set('result_data', $response->get_data());
            } else {

                $response = $this->installer->setup_database();

//                if (!$this->installer->is_upgrade()) //the connection succeeded so let's create the database
//                    $response = $this->installer->create_database();
//                else $response = $this->installer->update_database();

                //check to see if the database was created ok
                if ($response->ok()) {
                    $this->set('result', 'success');
                    $this->set('result_data', null);
                } else {
                    //there was an error creating the database
                    $this->set('result', 'error');
                    $this->set('result_data', $response->get_data());
                }
            }
        }

        $this->set('step_title', 'Create Database');
        $this->load_view('database');
    }


    function main_config()
    {
        $this->verify_requirements(__FUNCTION__);

        $base_url = $this->get_param('base_url');

        $email = $this->get_param('company_email');


        if ($base_url != false && $email != false) {
            $this->installer->set_config(array(
                'base_url' => $base_url,
                'company.email' => $email

            ));


            $next_step = $this->get_param('next_step');
            $this->installer->complete_step('main_config');

            $this->go_to_next_step();
        }

        $this->set('step_title', 'Company Info');
        $this->load_view('main_config');
    }

    function get_database_name()
    {
        $name = $this->installer->get_config('database.name');

        if (!$name){
            $name = $this->installer->get_config('database_name');

            if(!$name)
                $name = $this->installer->get_default_database_name();
        }

        echo $name;
    }

    function get_currency_symbol(){
        $symbol = $this->installer->get_config('currency_symbol');
        if(!$symbol)
            $symbol = '$';

        echo $symbol;
    }

    function get_config($name)
    {
        $val = $this->installer->get_config($name);
        echo $val !== false ? $val : '';
    }



    function advanced_config()
    {
        $this->verify_requirements(__FUNCTION__);


        $this->set('step_title', 'Advanced Configuration');
        $this->load_view('advanced_config');
    }

    function finish()
    {
        $this->verify_requirements(__FUNCTION__);

        $this->installer->build_config();
        $this->installer->build_language_file();
        $this->installer->system_user_image();
        $this->set('step_title', 'Installation Complete');
        $this->load_view('finish');
        unset($_SESSION['duet_installer_is_upgrade']);
    }


    function please_complete_step($step_number, $step_name)
    {
        $this->set('step_title', $step_name);
        $this->set('step_name', $step_name);
        $this->set('step_to_complete', $step_number);
        $this->load_view('please-complete-step');
        exit;
    }

    function verify_requirements($step_name)
    {
        $for_this_step = $this->step_number($step_name);


        if ($for_this_step > 2) {
            if (!$this->installer->is_step_completed('compatibility_verified')) {
                $this->please_complete_step(2, 'Server Compatibility');
            }
        }



        if ($for_this_step > 3) {
            if (!$this->installer->is_step_completed('folder_permissions')) {
                $this->please_complete_step(4, 'Folder Permissions');
            }
        }



        if ($for_this_step > 4) {
            if (!$this->installer->is_step_completed('database_created')) {
                $this->please_complete_step(5, 'Database');
            }
        }

        if ($for_this_step > 5) {
            if (!$this->installer->is_step_completed('main_config')) {
                $this->please_complete_step(6, 'Main Config');
            }
        }
    }

    function is_disabled(){
        if($this->installer->is_upgrade())
            echo 'disabled="disabled"';
    }
}