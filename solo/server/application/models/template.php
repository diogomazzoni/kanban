<?php


class Template extends Project{

    public $project;

    function __construct($parameters = null){
        $this->table = 'projects';

        parent::__construct($parameters);
    }

    function get($criteria = null){
        $sql = "SELECT projects.*, clients.name AS client_name
                FROM projects
                LEFT JOIN clients ON projects.client_id = clients.id";

        if (is_numeric($criteria)) {
            $sql .= ' WHERE projects.id = ' . $criteria;
            $project = parent::get_one($sql);
            $this->import_parameters($project);


            return $project;
        } else {

            $sql = $this->add_criteria($sql, 'is_template = 1');
            //if the user isn't an admin, we'll need to filter for projects that this user has access to.
            $sql = $this->modify_sql_for_user_type($sql);

            $projects = Model::get($sql);

            return $projects;
            //return parent::get($sql);
        }
    }

    function save(){
        $this->unset_param('project');
        $this->set('is_template', true);
        return parent::save();
    }


    function create_project(){

        $this->import_parameters();

        $this->generate_project();

        $this->copy_tasks();

        $this->copy_files();

        $this->copy_notes();

        return $this->project->id;
    }

    function generate_project(){
        $project = new Project();


        //if we don't manually set this variable, the parameters from the $_POST array will be imported. We don't want
        //those parameters because then we would also be importing the Template id, which would effectively set this
        //new project model = this template model. We will manually set the parameters from the template that we want to
        //copy
        $project->params_imported = true;

        $project->set('client_id', Request::get('client_id'));
        $project->set('name', Request::get('name'));
        $project->set('start_date', Request::get('start_date'));
        $project->set('due_date', Request::get('due_date'));

        $project->save();

        $this->project = $project;
    }

    function copy_tasks(){
        $list = $this->get_organized_tasks();


        foreach($list as $list_section){
            $section = new TaskSection();

            $section->import_parameters_exactly($list_section['section']);

            $section->set('id', null);

            $section->set('list_id', $this->project->id);

            $section->save();

            foreach($list_section['tasks'] as $task_parameters){
                $task = new Task();

                $task->import_parameters_exactly($task_parameters);

                //we want to create a new task so we need to reset the id. If we don't the app will just save our changes on
                //the old task (bad idea)
                $task->set('id', null);

                $task->set('section_id', $section->id);
                $task->set('created_date', time());
                $task->set('project_id', $this->project->id);

                $task->quick_save();

            }
        }
    }

    function copy_files(){
        $files = $this->get_files();
        $paths = $this->project->file_paths();

        foreach($files as $file_parameters){
            $file_to_copy = new File($file_parameters);
            $file_to_copy_url = $file_to_copy->path();

            //create the file record
            $file = new File();
            $file->import_parameters_exactly($file_parameters);

            //we want to create a new file  so we need to reset the id. If we don't the app will just save our changes on
            //the old file (bad idea)
            $file->set('id', null);
            $file->set('created_date', time());
            $file->set('project_id', $this->project->id);

            $file->save();

            //copy the actual file
            if(file_exists($file_to_copy_url)){
                copy($file_to_copy_url, $paths['upload_path'] . $file->name);
            }
        }
    }

    function copy_notes(){
        $notes_to_copy = new ProjectNotes($this->id);
        $notes = new ProjectNotes();

        $notes->params_imported = true;
        $notes->set('notes', $notes_to_copy->notes);
        $notes->set('project_id', $this->project->id);
        $notes->save();
    }

}
