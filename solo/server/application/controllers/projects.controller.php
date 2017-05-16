<?php

class ProjectsController extends Controller{
    function add_person(){

        if(!current_user()->is('admin'))
            Response()->not_authorized();


        $user_id = Request::get('user_id');
        $project_id = Request::get('project_id');

        $project = new Project($project_id);

        $result = $project->assign_user($user_id);

        if($project->validation_passed())
            Response($result);
        else Response()->error($project->errors());
    }

    function remove_person(){

        if(!current_user()->is('admin'))
            Response()->not_authorized();


        $user_id = Request::get('user_id');
        $project_id = Request::get('project_id');

        $project = new Project($project_id);

        $result = $project->remove_user($user_id);

        if($project->validation_passed())
            Response($result);
        else Response()->error($project->errors());
    }
}