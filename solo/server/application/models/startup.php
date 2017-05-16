<?php


class Startup extends Model{

    function info(){
        $project = new Project();
        $projects = $project->get("WHERE projects.is_archived = 0");


        return array(
            'projects' => $projects
        );
    }
}
 
