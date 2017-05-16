<?php


class Calendar extends Model{
    public $tasks;
    public $project_id;
    public $project;


    function get($project_id = null){
        //there's nothing to do if we don't have a project id
        if($project_id == null)
            return false;

        $this->project = new Project($project_id);

        //nothing to do if the project doens't exist
        if(!$this->project->is_valid())
            return false;

        //todo:this should not get section headers
        $this->tasks = $this->project->get_tasks('incomplete');
    }

    function user_can_access(User $user = null){

        if(!isset($user))
            $user = current_user();

        //this->project is now an array, because of the call to to_array in the get function
        if($user->role == 'admin' || $user->client_id == $this->project->client_id)
            return true;
        else if($user->is('agent')){

            return $user->can_access($this->project);
        }
        else return false;
    }
}
 
