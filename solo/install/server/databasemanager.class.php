<?php


class DatabaseManager{

    public $tables_sql;
    public $table_names;
    public $temp_table_names;
    public $migration_statements;
    public $logs;

    protected $dropped_tables;

    protected $database;
    protected $hostname;
    protected $username;
    protected $password;
    protected $db;


    function __construct($database, $hostname, $username, $password){
        //current working directory is install, not install/server

        require_once('database.class.php');

        require_once('resources/table_names.php');



        //mostly needed for the connect function, and then the create/update functions
        $this->database = $database;
        $this->hostname = $hostname;
        $this->username = $username;
        $this->password = $password;

        $this->table_names = get_table_names();

        $this->logs = array();

        $this->dropped_tables = array();
    }

    function connect(){
        $this->db = new \phpSweetPDO\Connection('mysql:host=' . $this->hostname, $this->username, $this->password);

        return $this->db;
    }


    function add_migration_statements(array $statements) {
        $this->migration_statements = array_merge($this->migration_statements, $statements);
    }

    function reset_migration_statements(){
        $this->migration_statements = array();
    }



    function database_exists(){
        $sql = "SHOW DATABASES LIKE '$this->database'";

        $result = $this->select($sql);

        return count($result) > 0;
    }

    function prepare_schema_statements($temp_names = false){
        include("resources/schema.php");

        foreach($tables_sql as $table => &$sql){

            if($temp_names === true)
                $table_name = "temp_$table";
            else $table_name = $table;

            $sql = str_replace('{' . $table . '_table_name}', $table_name, $sql);

        }

        return $tables_sql;

    }

    function add_dropped_table($table_name){
        $this->dropped_tables[$table_name] = $table_name;
    }

    function is_dropped_table($table_name){
        return isset($this->dropped_tables[$table_name]);
    }

    function update_database(){
        $this->execute("USE `$this->database`");

        $result = $this->backup_existing_database();

        if ($result !== true) {
            return $this->response(false);
        }


        $this->drop_temp_tables();


        $temp_tables_sql = $this->prepare_schema_statements(true);

        foreach ($temp_tables_sql as $table_sql) {
            $this->execute($table_sql);
        }

//reset the global table names variables used in the schema.php sql statements
       $real_tables_sql = $this->prepare_schema_statements();


        $this->reset_migration_statements();



        foreach ($this->table_names as $table => $table_name) {

            if ($this->has_table($table_name)) {
                $this->log_status("Analyzing $table_name");
                $existing_table_schema = $this->select("DESCRIBE $table_name");

                if($this->has_table("temp_$table_name")){
                    $new_table_schema = $this->select("DESCRIBE temp_$table_name");
                    $statements = $this->compare_table($table_name, $existing_table_schema, $new_table_schema);
                    $this->add_migration_statements($statements);
                }
                else{
                    $this->log_status("Deleting $table_name");
                    $this->add_migration_statements(array("DROP TABLE $table_name"));
                    $this->add_dropped_table($table_name);
                }

            } else {
                $this->log_status("Create table $table_name");

                $this->add_migration_statements(array($real_tables_sql[$table_name]));
            }
        }


        //run the migration statements
        foreach ($this->migration_statements as $migration_statement) {
            $this->execute($migration_statement);
        }

//verify by running the whole thing again, make sure there are no remaining migration statements
        $this->reset_migration_statements();

        foreach ($this->table_names as $table => $table_name) {
            if(!$this->is_dropped_table($table_name)){
                if ($this->has_table($table_name)) {
                    $this->log_status("Verifying $table_name");
                    $existing_table_schema = $this->select("DESCRIBE $table_name");
                    $new_table_schema = $this->select("DESCRIBE temp_$table_name");
                    $statements = $this->compare_table($table_name, $existing_table_schema, $new_table_schema);
                    $this->add_migration_statements($statements);
                } else {
                    $this->log_status("Table $table_name doesn't exist");
                    $this->add_migration_statements(array($real_tables_sql[$table_name]));
                }
            }
        }

        foreach ($this->temp_table_names as $temp_table_name) {
            if ($this->has_table($temp_table_name))
                $this->execute('DROP TABLE ' . $temp_table_name);
        }

        $success = false;

        if (count($this->migration_statements) == 0) {
            $this->log_status("Migration Successful");
            $success = true;
        } else $this->log_status('Migration failed');


        return $this->response($success);
    }

    function create_database()
    {
        $this->execute("CREATE DATABASE IF NOT EXISTS `$this->database`");
        $this->execute("USE `$this->database`");

        $create_tables_sql_statements = $this->prepare_schema_statements();


        foreach ($create_tables_sql_statements as $table_name => $table_sql) {
            $this->log_status("Creating table: $table_name");
            $this->execute($table_sql);
        }

        include('resources/defaultsql.php');

        $default_sql = get_default_sql();

        foreach($default_sql as $statement){
            $this->execute($statement);
        }

        return $this->response(true);
    }

    function setup(){

        $this->connect();

        if($this->database_exists() && !$this->is_empty_database())
            return $this->update_database();
        else return $this->create_database();
    }

    function is_empty_database(){
        $sql = "SHOW TABLES FROM  `$this->database`";

        $result = $this->select($sql);

        return count($result) == 0;
    }

    function response($status = false){
        return array(
            'status' => $status,
            'logs' => $this->logs
        );
    }

    static function create_directory($path){
        //http: //stackoverflow.com/a/4134734/427276
        $old_umask = umask(0);

        //todo:does this need to 777?
        $result = mkdir($path, 0777, true);
        umask($old_umask);

        return $result;
    }

    function backup_existing_database(){
        include('resources/backup.php');


        error_reporting(E_ALL);

        $backupDatabase = new Backup_Database($this->database, $this->db);

        if(!is_dir('../server/tmp/database-backups'))
            $this->create_directory('../server/tmp/database-backups');

        $result = $backupDatabase->backupTables('*', '../server/tmp/database-backups');

        if($result === true) {
            $this->log_status("Backup result: OK");
            return true;
        }
        else if(is_array($result)){
            $this->log_status('Backup failed: ' . $result['message']);
            return false;
        }
        else{
            $this->log_status('Backup failed: Unknown');
            return false;
        }
    }

    function log_status($status_message){
        $this->logs[] = $status_message;
    }

    function select($sql)
    {

        $record_set = $this->db->select($sql);
        return $record_set->export();
    }

    function execute($sql){
        $this->db->execute($sql);
    }

    function has_table($name)
    {
        $table = $this->select("SHOW TABLES LIKE '$name'");
        if (count($table))
            return true;
        else return false;
    }

    function get_field_data_from_schema($field_name, $schema)
    {
        $data = false;

        foreach ($schema as $field_details) {
            if ($field_details->Field == $field_name) {
                $data = $field_details;
                break;
            }
        }

        return $data;
    }




    function compare_table($table_name, $existing_schema, $new_schema)
    {
        $statements = array();

        $prev = -1;
        $index = 0;
        foreach ($new_schema as $field_details_in_new_schema) {
            $existing_field = $this->get_field_data_from_schema($field_details_in_new_schema->Field, $existing_schema);

            if ($existing_field !== false) {
                foreach ($field_details_in_new_schema as $attribute_name => $field_attribute) {
                    $field_name = $field_details_in_new_schema->Field;

                    if (isset($field_attribute) && !isset($existing_field->$attribute_name)) {
                        $this->log_status($field_name . ' ' . $attribute_name . ' does not exist on existing field description');
                    } else if (!isset($field_attribute) && isset($existing_field->$attribute_name)) {
                        $this->log_status('!' . $field_name . ' ' . $attribute_name . ' does not exist on new field description');

                    } else if ($field_attribute != $existing_field->$attribute_name) {
                        $this->log_status($field_name . ' ' . $attribute_name . ' is different: new value - ' . $field_attribute . ', existing value - ' . $existing_field->$attribute_name);

                        if ($attribute_name == 'Null') {//todo:strcasecmp?
                            //if making it null, we'll just reset the type since the default is not null
                            if ($field_attribute == 'YES')
                                $statements[] = "ALTER TABLE $table_name MODIFY COLUMN $field_name $existing_field->Type";
                            else $statements[] = "ALTER TABLE $table_name MODIFY COLUMN $field_name $existing_field->Type NOT NULL";
                        } else {
                            //need to add these
                        }
                    }

                }
            } else {
                $field = $field_details_in_new_schema;

                $null = $field->Null != 'YES' ? 'NOT NULL' : '';
                $after = $index > 0 ? 'AFTER ' . $new_schema[$prev]->Field : '';
                $this->log_status('Add field ' . $field->Field);
                $statements[] = "ALTER TABLE $table_name ADD $field->Field $field->Type $null $after";
            }

            $index++;
            $prev++;
        }

        foreach ($existing_schema as $field_details_in_existing_schema) {
            $new_field = $this->get_field_data_from_schema($field_details_in_existing_schema->Field, $new_schema);

            if ($new_field == false) {
                $this->log_status('Remove field ' . $field_details_in_existing_schema->Field);
                $statements[] = "ALTER TABLE $table_name DROP COLUMN `$field_details_in_existing_schema->Field`";
            }
        }


        return $statements;
    }

    function drop_temp_tables()
    {
        $this->temp_table_names = array();

        foreach ($this->table_names as $table => $table_name) {
//            $table_name = $table_name . '_table_name';
            $this->temp_table_names[] = 'temp_' . $table;
        }

        //drop any existing temporary tables
        foreach ($this->temp_table_names as $temp_table_name) {
            if ($this->has_table($temp_table_name))
                $this->execute('DROP TABLE ' . $temp_table_name);
        }
    }
}
 
