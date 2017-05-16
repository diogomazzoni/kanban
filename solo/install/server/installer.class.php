<?php

//todo:upgrading should delete old files
//todo:think about a separate upgrade script
class Installer {

    protected $config;
    protected $database_queries;
    protected $database_sql_file;
    protected $database_connection;
    protected $is_upgrade;
    protected $default_database_name;

    public $database_username;
    public $database_password;
    public $database_hostname;
    public $database_name;

    const VERSION = '2.0.0';

    function __construct() {
        require_once('config.class.php');
        require_once('response.class.php');

        @session_start();

        if (!isset($_SESSION['duet_installer']))
            $_SESSION['duet_installer'] = array();


        $this->default_database_name = 'solo_app';

        $this->database_queries = array();



        //need to check if this is an upgrade BEFORE we init the config object. Once the config object is
        //created a default config file will be generated if none existed already
        if(!isset($_SESSION['duet_installer_is_upgrade'])){
            $_SESSION['duet_installer_is_upgrade'] = file_exists('../server/config/config.php');
        }

        $this->is_upgrade = $_SESSION['duet_installer_is_upgrade'];

        $this->config = new Config();

        if($this->is_step_completed('folder_permissions'))
            $this->config->load_existing_config();
    }


    function system_user_image()
    {
        if (!is_dir('../server/files-folder/user_images')) {
            $this->create_directory('../server/files-folder/user_images');
        }

        if (!is_file('../server/files-folder/user_images/system.jpg')) {
            copy('resources/user_images/system.jpg', '../server/files-folder/user_images/system.jpg');
        }

        if (!is_dir('../server/files-folder/user_images/thumbs')) {
            $this->create_directory('../server/files-folder/user_images/thumbs');
        }

        if (!is_file('../server/files-folder/user_images/thumbs/system.jpg')) {
            copy('resources/user_images/thumbs/system.jpg', '../server/files-folder/user_images/thumbs/system.jpg');
        }
    }

    static function create_directory($path){
        //http: //stackoverflow.com/a/4134734/427276
        $old_umask = umask(0);

        //todo:does this need to 777?
        $result = mkdir($path, 0777, true);
        umask($old_umask);

        return $result;
    }

    function version() {
        return self::VERSION;
    }

    function is_upgrade() {
        return $this->is_upgrade;
    }

    function get_default_database_name() {
        return $this->default_database_name;
    }



    function complete_step($name) {
        $_SESSION['duet_installer'][$name] = true;
    }

    function is_step_completed($name) {
        return isset($_SESSION['duet_installer'][$name])
            && $_SESSION['duet_installer'][$name] == true;
    }


    function check_compatibility() {
        $results = array();

        //clear any previous install data anytime the installer is started over
        $this->config->clear();

        //check php version
        if (version_compare(PHP_VERSION, '5.4') >= 0) {
            //the user has the correct version
            $results['php_version'] = Response(PHP_VERSION);
        } else {
            //the user does not have the minimum php version
            $results['php_version'] = Response()->error(PHP_VERSION);
        }

        //check for pdo
        if (extension_loaded('pdo_mysql')) {
            $results['pdo'] = Response();
        } else $results['pdo'] = Response()->error();

        //check for curl
        if (extension_loaded('curl')) {
            $results['curl'] = Response();
        } else $results['curl'] = Response()->error();

        if ($results['php_version']->ok() && $results['pdo']->ok() && $results['curl']->ok()) {
            $this->complete_step('compatibility_verified');
            return Response($results);
        } else return Response()->error($results);

    }

    function is_valid_purchase_code($purchase_code) {
        $this->config->set('purchase_code', $purchase_code);
        $this->complete_step('license_verified');
        return true;
        /**************** IMPORTANT NOTE *******************
        Hi :) How are you?

        Please don't steal my software. I worked very hard
        on this application and like you, I have bills to
        pay. If you absolutely MUST have the software, and
        you can't afford it, please send me an email and
        I'm sure we can work something out.

        Thank you for your understanding.
        /***************************************************/

        $data = array(
            'purchase_code' => $purchase_code,
            'item_name' => 'Duet - Professional Project Management'
        );
        //todo:put the purchase code in teh config file. I can use it later


        //access token?
        $postUrl = 'http://www.plumtheory.com/gumroad/purchase_verifier.php';


        //open connection
        $ch = curl_init();

        //set the url, number of POST vars, POST data
        curl_setopt($ch, CURLOPT_URL, $postUrl);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);

        //close connection
        curl_close($ch);

        $response = json_decode($response);

        if ($this->is_valid_purchase_code_response($response)) {
            $this->config->set('purchase_code', $purchase_code);
            $this->complete_step('license_verified');
            return true;
        } else return false;
    }

    function is_valid_purchase_code_response($response) {
        return $response->code == 200 && $response->data == 'valid';
    }

    function check_folder_permissions() {
        //todo: these paths will be wrong
        $language_folder_result = is_writable('../server/application/language');
        $config_folder_result = is_writable('../server/config');
        $file_folder_result = is_writable('../server/files-folder');
        $tmp_folder_result = is_writable('../server/tmp');
        $logs_folder_result = is_writable('../server/logs');

        //if the build path already exists, we need it to be writable
        $build_path = '../server/application/language/en/build'; //todo:this shouldn't be hardcoded
        if (is_dir($build_path)) {
            $build_path_result = is_writable($build_path);
        } else $build_path_result = true;

        $build_file = $build_path . '/all.php';
        if (file_exists($build_file)) {
            $build_file_result = is_writable($build_file);
        } else $build_file_result = true;

        $language_combined_result = $language_folder_result && $build_path_result && $build_file_result;

        $response_data = array(
            'result' => $language_combined_result && $config_folder_result && $file_folder_result && $logs_folder_result && $tmp_folder_result,
            'language_combined_result' => $language_combined_result,
            'language_folder_result' => $language_folder_result,
            'build_folder_result' => $build_path_result,
            'build_file_result' => $build_file_result,
            'config_folder' => $config_folder_result,
            'file_folder' => $file_folder_result,
            'logs_folder' => $logs_folder_result,
            'tmp_folder' => $tmp_folder_result,
        );

        if (($language_combined_result && $config_folder_result && $file_folder_result && $logs_folder_result && $tmp_folder_result) == true) {

            $this->complete_step('folder_permissions');
        }

        return Response($response_data);
    }



    function set_sql_file($file) {
        $this->database_sql_file = $file;
    }

    function connect_to_database($database, $hostname, $username, $password) {
        $this->database_name = $database;
        $this->database_hostname = $hostname;
        $this->database_username = $username;
        $this->database_password = $password;



        $connected = false;
        $errors = array();

        //if a value was entered, that's the value we want in the form, not the default
        $this->set_config('database_name', $database);

        //the connection we create here is only used to test that the parameters are correct. We will create a new connection
        //using the App's built in database class, when we actually set up the tables..

        //try to connect with the database name supplied
        try {
            $conn = @new PDO("mysql:host=$this->database_hostname;dbname=$this->database_name", $this->database_username, $this->database_password);
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $connected = true;
        } catch (PDOException $e) {
            $errors[] = 'Attempt 1 - Assume database already exists: ' . $e->getMessage();
        }

        //if the first connection attempt failed, it's possible the credentials are correct but the database hasn't been
        //created yet. Lets try to connect without the database name
        if ($connected == false) {
            try {
                $conn = @new PDO("mysql:host=$this->database_hostname;", $this->database_username, $this->database_password);

                $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

                $connected = true;
            } catch (PDOException $e) {
                $errors[] = 'Attempt 2 - Create database if not exists: ' . $e->getMessage();
            }
        }

        if ($connected != false) {
            //database_connection = $conn;

            $this->set_config(array(
                'database_name' => $database,
                'database_hostname' => $hostname,
                'database_username' => $username,
                'database_password' => $password
            ));

            $this->db = Database::getInstance();

            return Response();
        } else {

            return Response()->error('There was an error connecting to the database. Your database credentials are incorrect. This means that either the database name, hostname, username, or password are incorrect. Please contact your hosting provider to obtain the correct credentials.');
        }
    }

    function column_exists($table, $column) {
        $conn = $this->database_connection;
        $stmt = $conn->prepare("SHOW COLUMNS FROM `$table` LIKE '$column'");
        $stmt->execute();
        $result = $stmt->fetchAll();

        return is_array($result) && (count($result) > 0);
    }

    function manage_database(){

    }

    function load_database_dependencies(){
        require_once('../server/core/database/db.connection.class.php');
        require_once('../server/core/database/db.recordset.class.php');
        require_once('../server/core/database/db.recordsetrow.class.php');
        require_once('../server/core/database/db.exception.class.php');
        require_once('../server/core/database/db.helpers.class.php');
    }
    function setup_database(){
        include('databasemanager.class.php');
        $this->load_database_dependencies();

        $database_manager = new DatabaseManager($this->database_name, $this->database_hostname, $this->database_username, $this->database_password);

        $result = $database_manager->setup();

        if($result['status'] == 'success'){
            $this->complete_step('database_created');
            //return Response()->error($result['logs']);
            return Response($result['logs']);
        }
        else return Response()->error($result['logs']);
    }


    function print_config() {
        $this->config->print_config();
    }

    function get_config($name) {
        return $this->config->get($name);

    }

    function set_config($name, $value = null) {
        if (!is_array($name)) {
            if ($value !== false)
                $this->config->set($name, $value);
        } else {
            foreach ($name as $key => $value) {
                if ($value !== false)
                    $this->config->set($key, $value);
            }
        }

    }


    function build_config() {
        $this->load_database_dependencies();
        //import the params so we have access to them with the config->get method
        $this->config->import_params();

        $payment_method = $this->config->get('payment_method');
        $currency_symbol = $this->config->get('currency_symbol');

        //apply defaults to optional parameters
        if ($payment_method == false || !isset($payment_method) || empty($payment_method)) {
            $payment_method = 'none';
            $this->config->set('payment_method', $payment_method);
        }

        if ($currency_symbol == false || !isset($currency_symbol) || empty($currency_symbol)) {
            $currency_symbol = '$';
            $this->config->set('currency_symbol', $currency_symbol);
        }

        //his shouldn't only happen on clean installs. Seems like it should happen IF the code doesnt exist'
        if(!$this->config->get('scheduled_tasks.code')){
            $code = $this->generate_scheduled_tasks_code();

            $this->config->set('scheduled_tasks.code', $code);
        }


        $this->config->write($this->database_name, $this->database_hostname, $this->database_username, $this->database_password);
        $this->complete_step('config_created');
    }

    function build_language_file() {
        define('APP_ROUTE', '../server/application');

        require_once('../server/core/utils.class.php');
        require_once('../server/core/language.class.php');

        $language = $this->config->get('language');

        global $CONFIG;
        $CONFIG['language'] = $language;


        $language = new Language($language);
        $language->build_language_file($language);
    }

    function reload_config(){
        global $CONFIG;

        $CONFIG = array();
        include('../server/config/config.php');
    }

    function generate_scheduled_tasks_code(){
        return substr(uniqid(), -6, 6);
    }


}


