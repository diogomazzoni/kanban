<?php


class TaskSection extends Model{
    public $name;
    public $list_id;
    public $position;

    function save(){
        if(!$this->can_save(current_user())){
            return false;
        }

        $this->import_parameters();

        if($this->is_new() && (!isset($this->position) || $this->position == 0)){
            $this->update_order_set_as_last_section();
        }

        return parent::save();
    }


    function can_save($current_user) {
        if ($current_user->is('client')) {
            if (get_config('task.clients_can_create_tasks') == true) {
                return true;
            }
            else return false;
        } else return true;
    }

    function get_list_sections($list_id = null){
        if(!isset($list_id))
            $list_id = $this->list_id;

        $sql = "SELECT * FROM task_sections WHERE list_id = $list_id ORDER BY position ASC";
        return $this->select($sql);
    }

    function update_order_set_as_last_section(){
        $sections = $this->get_list_sections();

        if(count($sections) > 0){
            $position = array_map(function ($section) {
                return $section->position;
            }, $sections);


            $next = max($position) + 1;
        }
        else $next = 1;


        $this->set('position', $next);
    }




    function user_can_access(User $user = null) {

        if(!isset($user))
            $user = current_user();

        if ($user->is('admin'))
            return true;
        else {
            $id = isset($this->list_id) ? $this->list_id : Request::get('list_id');
            $project = new Project($id);

            if($user->is('agent')){
                return $project->is_assigned_to($user);
            }
            else{
                return  $user->client_id == $project->client_id || ($this->is_new() && get_config('task.clients_can_create_tasks'));

            }

        }

    }



}
 
