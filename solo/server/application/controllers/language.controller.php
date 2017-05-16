<?php


class LanguageController extends Controller{

    function rebuild(){
        if(!current_user()->is('admin'))
            return false;

        $language = new Language();
        $result = $language->build_templates();

        if($result == true)
            Response($result);
        else Response()->error('');
    }

    function templates(){
        $lang = new Language();
        $templates = $lang->load_templates();

       echo $templates;
    }
}
 
