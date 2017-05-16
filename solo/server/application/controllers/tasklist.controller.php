<?php

class TaskListController extends Controller{
    function change(){
        $task_list = new TaskList();
        $result = $task_list->change();

        Response($result);
    }
}
 
