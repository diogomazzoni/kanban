<?php

class StructuredSettings{
    public $settings;

    function __construct($settings_array){
        $this->load($settings_array);
    }

    function load($settings_array){
        $settings = array();

        foreach($settings_array as $setting){
            if(isset($setting->section) && !empty($setting->section)){
                $section_parts = explode('.', $setting->section);

                //start at the base object
                $reference_to_section = &$settings;

                //loop through each of the section parts, crete an empty array for the section if it doesn't exist yet
                foreach($section_parts as $section_name){
                    if(!isset($reference_to_section[$section_name]))
                        $reference_to_section[$section_name] = array();

                    $reference_to_section = &$reference_to_section[$section_name];

                }

                $reference_to_section[$setting->name] = $setting;

            }
            else $settings[$setting->name] = $setting;
        }


        $this->settings = $settings;

    }

    function get($setting){
        return get_item_from_array($setting, $this->settings);
    }
}