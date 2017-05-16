<?php


class ProjectNotes extends Model
{

    public $project_id;
    public $notes;


    function __construct($parameters = null)
    {
        $this->table = 'project_notes';
        $this->set('project_id', $parameters);

        parent::__construct($parameters);
    }

    function validate()
    {
        $this->validator_tests = array(
            'project_id' => 'required'
        );

        parent::validate();
    }

    function get($project_id = null)
    {
        //there's nothing to do if we don't have a project id
        if($project_id == null)
            return false;

        $project = new Project($project_id);
        //todo:test owner

        $sql = "SELECT * FROM project_notes WHERE project_id = $project_id";
        $notes = parent::get($sql);

        return isset($notes[0]) ? $notes[0] : false;
    }

    function save()
    {
        $this->import_parameters();

        if (!isset($this->notes) || empty($this->notes)) {
            $sql = "DELETE from project_notes
                    WHERE project_id = $this->project_id";
            return parent::execute($sql);
        }
        else {

             return parent::save();

        }
    }

    function user_can_access(User $user = null){

        if(!isset($user))
            $user = current_user();

        $project = new Project($this->project_id);

        if($user->role == 'admin' || $user->client_id == $project->client_id)
            return true;
        else if($user->is('agent')){
            $project = new Project($this->project_id);
            return $project->is_assigned_to($user);
        }
        else return false;
    }
}