<?php

//modified version of code found here:
//modified to use pdo, rather than deprecated mysql apis
//http://www.azanweb.com/en/using-php-to-backup-mysql-databases/

/**
 * This file contains the Backup_Database class wich performs
 * a partial or complete backup of any given MySQL database
 * @author Daniel López Azaña <http://www.azanweb.com-->
 * @version 1.0
 */


/**
 * The Backup_Database class
 */
class Backup_Database
{
    /**
     * Host where database is located
     */
    var $host = '';

    /**
     * Username used to connect to database
     */
    var $username = '';

    /**
     * Password used to connect to database
     */
    var $passwd = '';

    /**
     * Database to backup
     */
    var $db_name = '';

    /**
     * Database charset
     */
    var $charset = '';

    /**
     * Constructor initializes database
     */
    function Backup_Database($db_name, $db, $charset = 'utf8')
    {
        $this->db_name = $db_name;
        $this->db = $db;
        $this->charset = $charset;

        $this->db->execute('SET NAMES ' . $this->charset);
    }

    function select($sql)
    {
        $record_set = $this->db->select($sql);
        return $record_set->export();
    }



    /**
     * Backup the whole database or just some tables
     * Use '*' for whole database or 'table1 table2 table3...'
     * @param string $tables
     */
    public function backupTables($tables = '*', $outputDir = '.')
    {
        try {
            /**
             * Tables to export
             */
            if ($tables == '*') {
                $tables = $this->select('SHOW TABLES');

            } else {
                $tables = is_array($tables) ? $tables : explode(',', $tables);
            }

            $sql = 'CREATE DATABASE IF NOT EXISTS ' . $this->db_name . ";\n\n";
            $sql .= 'USE ' . $this->db_name . ";\n\n";

            /**
             * Iterate tables
             */

            foreach ($tables as $table) {
                $table = $table["Tables_in_$this->db_name"];

                //echo "Backing up " . $table . " table...";

                $result = $this->select('SELECT * FROM ' . $table);

                //num field
                $fields = $this->select("DESCRIBE $table");
                $numFields = count($fields);

                $sql .= 'DROP TABLE IF EXISTS ' . $table . ';';
                $row2 = $this->select('SHOW CREATE TABLE ' . $table);
                // pre($row2[0]->{'Create Table'});
                $sql .= "\n\n" . $row2[0]->{'Create Table'} . ";\n\n";


                foreach ($result as $row) {

                    $sql .= 'INSERT INTO ' . $table . ' VALUES(';

                    foreach ($row as $field) {

                        $field = addslashes($field);
                        $field = preg_replace("/\n/", "\\n", $field);
                        if (isset($field)) {
                            $sql .= '"' . $field . '"';
                        } else {
                            $sql .= '""';
                        }
                        $sql .= ',';
                    }

                    $sql = rtrim($sql, ',');

                    $sql .= ");\n";
                }


                $sql .= "\n\n\n";

               // echo " OK" . "";
            }
        } catch (Exception $e) {
            var_dump($e);
            return false;
        }

        return $this->saveFile($sql, $outputDir);
    }

    /**
     * Save SQL to file
     * @param string $sql
     */
    protected function saveFile(&$sql, $outputDir = '.')
    {
        if (!$sql) return false;

        try {
            $handle = @fopen($outputDir . '/db-backup-' . $this->db_name . '-' . date("Ymd-His", time()) . '.sql', 'w+');
            $meta = @stream_get_meta_data($handle);

            if(!is_writable($meta['uri'])){

                return array(
                    'message' => 'Unable to save database backup. Please make sure the directory "' . $outputDir . '" exists and is writable'
                );
            }
            else{
                fwrite($handle, $sql);
                fclose($handle);
                return true;
            }

        } catch (Exception $e) {
            return array(
                'message' => $e->getMessage()
            );
        }

        return true;
    }
}
 
