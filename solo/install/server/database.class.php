<?php

require_once('../server/core/database/db.connection.class.php');
require_once('../server/core/database/db.recordset.class.php');
require_once('../server/core/database/db.recordsetrow.class.php');
require_once('../server/core/database/db.exception.class.php');
require_once('../server/core/database/db.helpers.class.php');

use phpSweetPDO\SQLHelpers\Basic as Helpers;

class Database
{

    public $db;
    public $database;
    public $hostname;
    public $username;
    public $password;
    protected $is_connected;

    private static $instance;


    private function __construct()    {

        $this->connect();
    }


    public function connect()
    {
        @session_start();
        $data = isset($_SESSION['duet_config']) ? $_SESSION['duet_config'] : array();

        if(isset($data['database_name']))
            $this->database = $data['database_name'];

        if (isset($data['database_hostname']))
            $this->hostname = $data['database_hostname'];

        if (isset($data['database_username']))
            $this->username = $data['database_username'];

        if (isset($data['database_password']))
            $this->password = $data['database_password'];

        if(isset($this->database) && isset($this->hostname) && isset($this->username) && isset($this->password)){
            $this->db = new \phpSweetPDO\Connection("mysql:dbname=$this->database;host=$this->hostname", $this->username, $this->password);

            if(isset($this->db)){
                $this->is_connected = true;
            }
            return $this->db;
        }
        else return false;
    }

    function select($sql){
        $record_set = $this->db->select($sql);
        return $record_set->export();
    }

    function is_connected(){
        return $this->is_connected === true;
    }

    function insert($table, $params){
        $sql = Helpers::insert($table, $params);

        return $this->db->execute($sql);
    }

    function execute($sql){
        return $this->db->execute($sql);
    }




    public static function getInstance()
    {

        if (!isset(self::$instance)) {

            self::$instance = new Database();
        }else{
//            if(self::$instance->is_connected !== true)
//                self::$instance->connect();
        }



        return self::$instance;
    }


}