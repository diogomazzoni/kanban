<?php

class TemplatesController extends Controller{

    function create_project(){
        $template = new Template();
        $result = $template->create_project();

        Response($result);
    }
}
