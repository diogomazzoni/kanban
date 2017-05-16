<?php

class TasksManager extends Model
{
    public $order;
    public $original_order;
    public $project_id;

    function __construct($parameters = null){
        $this->import_parameters();

        parent::__construct($parameters);
    }

    function save()
    {
        $this->import_parameters();
        $i = 0;

        foreach($this->order as $task_at_position){
            //if there is currently no task at this position (i.e. new task added at end of  list) update order
            //OR if this position has a task that is different from the original order, then we need to update the task's order field
            //todo: use client id if id isn't available?
            if(!isset($this->original_order[$i]) || ($this->original_order[$i] != $task_at_position)){
                if(isset($task_at_position) && !empty($task_at_position))
                    $this->update(array('order' => $i), 'tasks', "id = $task_at_position");
            }

            $i++;
        }
    }


    function save_new($new_task_id){

        foreach($this->order as &$task_at_position){
            if(empty($task_at_position)){
                $task_at_position = $new_task_id;
                break;
            }
        }

        $this->save();
    }



    function get($criteria = null){
        //override the default get function, since this function doesn't make sense for task managers
    }

    function user_can_access(User $user = null){

        if(!isset($user))
            $user = current_user();

        if($user->is('admin'))
            return true;
        if($user->is('agent')){
            $project = new Project($this->project_id);
            return $project->is_assigned_to($user);
        }
        else return false;
    }
}
 
