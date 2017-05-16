<?php


class SettingFile extends Model{
    public $settings = array();
    public $not_saved_in_db = array();
    public $settings_array_name = 'settings';

    function extract_setting_info($section_or_setting, $setting_name, $value){
        $setting_data = new StdClass();
        $setting_data->section = $section_or_setting;
        $setting_data->name = $setting_name;
        $setting_data->value = $value;

        if(is_bool($value))
            $type = 'boolean';
        else if(is_numeric($value))
            $type = 'number';
        else if(is_string($value))
            $type = 'string';
        else $type = null;

        $setting_data->type = $type;

        return $setting_data;
    }

    function process_settings_section($section_or_setting, $section){
        foreach($section as $setting_name => $value){
            if(is_array($value)){
                $this->process_settings_section("$section_or_setting.$setting_name", $value);
            }
            else {
                $data = $this->extract_setting_info($section_or_setting, $setting_name, $value);
                $this->add_to_settings_array($data);
            }
        }
    }


    function load_from_file(){
        global $CONFIG;

        //todo:find a way to combine with process_settings_section. Almost identical loop
        foreach($CONFIG as $section_or_setting => $data){

            if(is_array($data)){
                $this->process_settings_section($section_or_setting, $data);
            }
            else {
                $data = $this->extract_setting_info(null, $section_or_setting, $data);
                $this->add_to_settings_array($data);
            }
        }
    }

    function add_to_settings_array($data){
        if($this->settings_array_name == 'settings')
            $this->settings[] = $data;
        else $this->not_saved_in_db[] = $data;
    }

    function load_non_db_settings(){
        global $CONFIG;
        $real_config = $CONFIG;


        $CONFIG = array();


        include('../server/config/config.base.php');
        $CONFIG['base_url'] = $real_config['base_url'];
        include('../server/config/config.static.php');
        $this->settings_array_name = 'not_saved_to_db';
        unset($CONFIG['base_url']);
        $this->load_from_file();
    }


    function get_settings_saved_to_db(){
        $settings_to_save = array();
        foreach($this->settings as $setting){
            $save = true;

            if ($setting->section == 'public_routes' || $setting->section == 'restricted_routes') {
                $save = false;

            }
            else{
                foreach ($this->not_saved_in_db as $not_saved) {
                    if ($setting->section == $not_saved->section && $setting->name == $not_saved->name) {
                        $save = false;
                        break;
                    }
                }
            }


            if($save === true)
                $settings_to_save[] = $setting;
        }

        return $settings_to_save;


    }

    function get_contents_of_file($file){
        $str = file_get_contents($file);

        $prefix = '<?php';


        if (substr($str, 0, strlen($prefix)) == $prefix) {
            $str = substr($str, strlen($prefix));
        }

        return $str;


    }
    function write($settings){


        $fp = fopen('../server/config/config.settings.php', 'w');


        foreach($settings as $setting){
            switch($setting['type']){
                case 'string':
                    $value =  "'" . $setting['value'] . "'";
                    break;
                case 'boolean':
                    $value = $setting['value'] == 1 ? 'true' : 'false';
                    break;
                default:
                    $value = $setting['value'];
                    break;
            }

            if(!isset($value))
                $value = "''";

            if(isset($setting['section'])){
                $location = explode('.', $setting['section']);

                $location = "['" . implode("']['", $location);


                fwrite($fp, '$' . "CONFIG$location']['" . $setting['name'] . "'] = $value;\n\n");
            }
            else  fwrite($fp, '$' . "CONFIG"  . "['" . $setting['name'] . "'] = $value;\n\n");
        }

        fclose($fp);

        $config_contents = "<?php \n\n" .
            $this->get_contents_of_file('../server/config/config.database.php') .
            $this->get_contents_of_file('../server/config/config.base.php') .
            $this->get_contents_of_file('../server/config/config.settings.php') .
            $this->get_contents_of_file('../server/config/config.static.php') .
            $this->get_contents_of_file('../server/config/config.client.php').
               "\n\n" .  '//Setting file created ' . date('M j Y - g:i a') . "\n\n" ;

        $this->archive_current();
        file_put_contents('../server/config/config.php', $config_contents);

        return true;
    }

    function archive_current(){
        $archive_path = ROOT . "/config/archive/";
        $versioned_filename = Language::increment_file_name($archive_path, 'config.php');

        copy('../server/config/config.php', $archive_path . $versioned_filename);
    }

}