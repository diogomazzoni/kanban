<?php

class SettingsController extends Controller{
    function get($id = null){
        $current_user = current_user();

        if(!$current_user->is('admin'))
            Response()->not_authorized();

        $settings = new Setting();

        Response($settings->get_for_display());
    }

    //todo:delete;
    function load_from_file(){
        $setting = new Setting();
        $setting->write_to_file();
    }

    function rebuild(){
        $setting = new Setting();
        $setting->rebuild_db_table();
    }


}
