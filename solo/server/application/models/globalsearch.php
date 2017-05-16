<?php

class GlobalSearch extends Model{

    public $query;
    public $projects;
    public $tasks;
    public $invoices;
    public $files;
    public $clients;
    public $messages;

    public $user;

    function __construct($parameters = null){
        $this->user = current_user();

        parent::__construct($parameters = null);
    }

    function do_search($query){

       $this->query = $query;

        $this->get_projects();
        $this->get_tasks();

        $this->get_files();



       return $this->to_array();
    }

    function modify_sql_for_current_user($sql, $type = null, $table = null){
        $current_user = current_user();

         if($current_user->is('client')){
             $sql .= " AND $type.client_id = $current_user->client_id";
         }
         else if ($current_user->is('agent')){
            //all entities have to belong to a project that the agent is assigned to
            $projects = $this->user->get_assigned_projects();

            if($type != 'projects')
                $sql .= " AND $type.project_id IN (" . implode(',', $projects) . ")";
            else $sql .= " AND $type.id IN (" . implode(',', $projects) . ")";
         }

        return $sql;
    }

    function get_projects(){
        $sql = "SELECT projects.id, projects.name, projects.status_text, projects.due_date
                FROM projects
                WHERE
                  (
                      projects.name LIKE '%$this->query%'
                  )";


        $sql = $this->modify_sql_for_current_user($sql, 'projects');
        $this->projects = parent::get($sql);
    }

    function get_tasks(){
        $sql = "SELECT tasks.id, tasks.task, tasks.notes, tasks.project_id, tasks.due_date, projects.name AS project_name
                FROM tasks
                LEFT JOIN projects
                  ON projects.id = tasks.project_id
                WHERE
                  (
                  tasks.task LIKE '%$this->query%'
                  OR tasks.notes LIKE '%$this->query%'
                  )";

        $sql = $this->modify_sql_for_current_user($sql, 'tasks');
        $this->tasks = parent::get($sql);
    }

    function get_invoices(){
        $sql = "SELECT invoices.*, clients.name AS client_name, projects.name AS project_name
                FROM invoices
                LEFT JOIN clients
                  ON clients.id = invoices.client_id
                LEFT JOIN projects
                  ON projects.id = invoices.project_id
                WHERE
                  (
                  clients.name LIKE '%$this->query%'
                  OR projects.name LIKE '%$this->query%'
                  )";

        $sql = $this->modify_sql_for_current_user($sql, 'invoices');
        $this->invoices = parent::get($sql);
    }

    function get_files(){
        $sql = "SELECT files.id, files.name, files.project_id,  files.type AS file_type, projects.name AS project_name
                FROM files
                LEFT JOIN projects
                  ON projects.id = files.project_id
                WHERE
                  (
                  files.name LIKE '%$this->query%'
                  OR files.type LIKE '%$this->query%'
                  )";

        $sql = $this->modify_sql_for_current_user($sql, 'files');
        $this->files = parent::get($sql);
    }

    function get_clients(){


        if(current_user()->is('admin')){
            $sql = "SELECT clients.* FROM clients WHERE clients.name LIKE '%$this->query%'";
            $this->clients = parent::get($sql);
        }
    }

    function get_messages(){
        $sql = "SELECT messages.*
                FROM messages
                WHERE
                  messages.message LIKE '%$this->query%'";

        $sql = $this->modify_sql_for_current_user($sql, 'messages');
        $this->messages = parent::get($sql);
    }
}