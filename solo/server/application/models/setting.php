<?php

class Setting extends Model{

    public $settings = array();

    function clear_settings(){
        $this->execute('TRUNCATE settings');
    }

    function load_settings(){
        $sql = "SELECT * FROM settings";
        $settings = $this->select($sql);

        return $settings;
    }

    function insert_setting($setting){
         $this->insert(get_object_vars($setting));
    }

    function get_for_display($criteria = null){
         //the organization we want to display to the user is not necessarily the same structure we have in the database,
        //there f



        //the final list of settings, separated by section, with descriptions,et
        $settings_array = array();

        //the raw setttings from the database
        $settings = $this->load_settings(true);

        //the settings object organized by section
        $structured_settings = new StructuredSettings($settings);

        $setting_display = new SettingDisplay();

        foreach($setting_display->display as $setting_section_name => $setting_section){

            $values = array();

            foreach($setting_section as $setting_key => $setting_description){
                $data = $structured_settings->get($setting_key);

                $value = $data->value;


                //handle booleans
                if($data->type == 'boolean'){
                    if ($value === true || $value == 1)
                        $value = 'Yes';
                    else if ($value === false || $value == 0)
                        $value = 'No';

                    //pre($value);
                }



                $values[] = array(
                    'id' => $data->id,
                    'description' => $setting_description,
                    'info' => $setting_display->get_info($setting_key),
                    'name' => $setting_key,
                    'type' => $data->type,
                    'value' => $value
                );
            }

            //put settings in alphebetcal order by name
            usort($values, function($a, $b){
                return strcasecmp($a['name'], $b['name']);
            });

            $settings_array[] = array(
                'section_name' => $setting_section_name,
                'values' => $values
            );
        }

        //alphabetize sections by name
        usort($settings_array, function ($a, $b) {
            return strcasecmp($a['section_name'], $b['section_name']);
        });


        return array(
            'settings'=>$settings_array,
            'scheduled_tasks' => $this->scheduled_tasks_urls()
        );
    }

    function scheduled_tasks_urls(){
        if(current_user()->is('admin')){
            $code = get_config('scheduled_tasks.code');
            $base_url = get_config('base_url');
            $frequently = $base_url . "server/index.php?url=scheduledtasks/frequently/$code";
            $daily = $base_url . "server/index.php?url=scheduledtasks/daily/$code";

            return array(
                    'frequently' => $frequently,
                    'daily' => $daily
            );
        }
        else return false;
    }


    function save(){
        $name = Request::get('name');
        $value = Request::get('value');

        $name_parts = explode('.', $name);
        $name = array_pop($name_parts);
        $section = implode('.', $name_parts);


        $this->save_setting_data_in_database($name, $section, $value);



        return $this->write_file();

    }

    function write_file(){
        //todo:this should all be in the setting file. class
        $file = new SettingFile();
        $settings = $this->load_settings();

        return $file->write($settings);
    }



    function save_setting_data_in_database($name, $section, $value){
        if (strlen($section) > 0)
            $sql = "UPDATE settings SET value = '$value' WHERE section = '$section' AND name = '$name'";
        else  $sql = "UPDATE settings SET value = '$value' WHERE section IS NULL AND name = '$name'";

        $this->execute($sql);
    }

    function rebuild_db_table(){
        //todo:this should all be in the setting file class
        $setting_file = new SettingFile();

        $setting_file->load_from_file();
        $setting_file->load_non_db_settings();
        $settings = $setting_file->get_settings_saved_to_db();

        $this->execute('TRUNCATE settings');
        foreach($settings as $setting){
            $this->insert_setting($setting);
        }

    }

    function get_setting_name($setting){

    }




}