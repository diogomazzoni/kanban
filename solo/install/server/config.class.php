<?php


class Config{
    protected $params;
    protected $name;
    protected $setting_file;
    protected $db;

    function __construct(){

        require_once('database.class.php');

        @session_start();

        $this->params = array();

        $this->name = 'duet_config';

        $this->db = Database::getInstance();



        //we're storing the config values in a session because the values will be collected over several steps,
        //and therefore several different calls to this script
        if(!isset($_SESSION[$this->name]))
            $_SESSION[$this->name] = array();

    }


    function load_existing_config()
    {
        require_once('settingfile.class.php');

        $setting_file = new SettingFile();


        if (!file_exists('../server/config/config.php')) {
            $setting_file->make_default_config();
        }


        //make sure the new config files exist;
        $setting_file->make_files();

        $setting_file->load_from_file();





        $this->setting_file = $setting_file;
    }



    function set($key, $value){
        $_SESSION[$this->name][$key] = $value;
    }

    function print_config(){;
        pre($_SESSION[$this->name]);
    }

    function import_params(){
        $this->params = $_SESSION[$this->name];
    }

    function default_logo_path(){
        $path = $this->get('company.logo');

        if($path == false || strlen($path) == 0){
            $path = $this->get('base_url') . 'client/images/sample-logo.png';
            $this->set('company.logo', $path);
        }
    }

    function get($name)
    {
        $parts = explode('.', $name);

        if($parts[0] == 'database'){
            return  $this->get_database_property($parts[1]);
        }
        else{
            //if the setting has been set in the installation script at any point, then it will be stored in teh session
            //variable and it's the most recent value, so let's use that. If the setting hasn't been set by the installation
            //script, then we will get the value from the SettingFile
            if(isset($_SESSION[$this->name][$name])){

                return $_SESSION[$this->name][$name];
            }
            else{
                $name_parts = explode('.', $name);
                $name = array_pop($name_parts);
                $section = implode('.', $name_parts);

                return $this->setting_file->get($section, $name);
            }

        }

    }

    function get_database_property($property){

        switch($property){
            case 'name':
                $val =  defined('DB_NAME') ? DB_NAME : false;
                break;
            case 'hostname':
                $val = defined('DB_HOST') ? DB_HOST : false;
                break;
            case 'user':
                $val= defined('DB_USER') ? DB_USER : false;
                break;
            case 'password':
                $val = defined('DB_PASSWORD') ? DB_PASSWORD : false;
                break;

        }

        return $val;
    }

    function clear(){
        $_SESSION[$this->name] = array();
        $this->params = array();
    }


    function save_settings(){
        $this->setting_file->load_defaults();
        if(isset($this->db) && $this->db->is_connected()){


            $this->setting_file->load_non_db_settings();
            $settings = $this->setting_file->get_settings_saved_to_db();

            $this->db->execute('TRUNCATE settings');

            foreach ($settings as $setting) {

                $this->db->insert('settings', get_object_vars($setting));

            }
        }
    }
    function write(){

        $this->default_logo_path();

        $this->import_params();


        $this->save_settings();

        //force the new theme for v2; old themes don't work.
        $this->params['theme'] = 'refresh';

        foreach($this->params as $name => $value){
            $name_parts = explode('.', $name);
            $name = array_pop($name_parts);
            $section = implode('.', $name_parts);

            if (strlen($section) > 0)
                $sql = "UPDATE settings SET value = '$value' WHERE section = '$section' AND name = '$name'";
            else  $sql = "UPDATE settings SET value = '$value' WHERE section IS NULL AND name = '$name'";


            $this->db->execute($sql);
        }


        //write all the settings from the database to the file
        $settings = $this->db->select("SELECT * FROM settings");




       return $this->setting_file->write($settings);

    }
}