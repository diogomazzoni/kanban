<?php


class Language
{
    public $language_code;
    public $language_file;
    private static $instance;

    function __construct(){
        global $CONFIG;

        $this->language_code = $CONFIG['language'];

        $this->language_file =  APP_ROUTE . "/language/$this->language_code/build/all.php";
    }

    public static function getInstance()
    {
        if (!isset(self::$instance)) {
            self::$instance = new Language();
        }

        return self::$instance;
    }

    function load_templates($rebuild = false){

        $template_file = APP_ROUTE . "/templates/app/$this->language_code/build/all-templates.html";

        if ($rebuild == true || !file_exists($template_file)) {
            $result = $this->build_templates();

            //if the build fails, then we want to load the default language (english)
            if($result == false){
                AppMessage::set('Unable to build the requested language file');
                $template_file = APP_ROUTE . "/templates/app/en/build/all-templates.html";
            }
        }

        return file_get_contents($template_file);
    }



    function build_language_file(){
        global $LANG;
        global $CONFIG;


        //store the loaded lang file in a temporary variable because the LANG var will be overridden when we load the
        //master
        $existing_lang = $LANG;

        //load the master
        require_once(APP_ROUTE . "/language/master/master.php");

        //loop through each string, grab the the existing translation if it's available
        foreach($LANG as $lang_component => $component_values){
            foreach($component_values as $lang_string => $sting_value){
                if(isset($existing_lang[$lang_component]) && isset($existing_lang[$lang_component][$lang_string])){
                    //if there is a translation available for this string, we want to use the translation
                    $LANG[$lang_component][$lang_string] = $existing_lang[$lang_component][$lang_string];
                }
            }
        }

        $language_code = $CONFIG['language'];

        //todo:build folder being created outside the context of a language code folder in some instances for unknown reasons. Appears to be linked to failed installations.
        if(!isset($language_code) || empty($language_code))
            $language_code = 'en';

        //the paths required to build language file
        $language_directory = APP_ROUTE . "/language";
        $full_path = "$language_directory/$language_code/build/all.php";
        $build_directory = "$language_directory/$language_code/build/";


        if(!is_dir($build_directory)){
           if(is_writeable($language_directory))    {
               Utils::create_directory($build_directory);
           }
           else{
               AppMessage::set('Language folder is not writable');
               return false;
           }
        }

        //Language::version_existing_file($full_path, $build_directory, 'all.php');

        $build = fopen($full_path, 'w');
        fwrite($build, "<?php \n\n");
        foreach($LANG as $lang_component => $component_values){
            fwrite($build, '//' . Utils::from_camel_case($lang_component) . "\n");
            fwrite($build, '$LANG[\'' . $lang_component . '\'] = ' . var_export($component_values, true) . ";\n\n");
        }

        return true;

    }

//    function array_to_string($array){
//        $array_string = 'array(';
//
//        foreach($array as $key => $value){
//            $array_string .= '  \'' . $key . '\' => "' . $value . '",' . "\n";
//        }
//
//        $array_string .= ');';
//
//        return $array_string;
//    }


    function build_templates(){

        global $LANG;

        if(!$this->build_language_file()){
            return false;
        }

        Model::load_library('mustache.php/src/Mustache/Autoloader');
        Mustache_Autoloader::register();

        $m = new Mustache_Engine();
        $base_template_dir = APP_ROUTE . "/templates/app";



        $template = file_get_contents("$base_template_dir/all-templates.mustache");
        $rendered = $m->render($template, $LANG); // "Hello, world!"

        $template_directory = $base_template_dir . "/$this->language_code/build/";
        $template_name = 'all-templates.html';
        $template_full_path = $template_directory . $template_name;

        if(!is_writable($template_directory)){
            AppMessage::set($template_directory . '  Template directory is not writable. Please make sure to read the instructions in the Translation section of the documentation before using this functionality');
            return false;
        }

        $this->version_existing_file($template_full_path, $template_directory, $template_name);

        $build = fopen($template_full_path, 'w');

        if($build){
            fwrite($build, "<script type=\"text/x-templates\">\n\n");
            fwrite($build, '<!-- ' . date('F j, Y, g:i:s a', time()) . " -->\n\n");
            fwrite($build, $rendered);
            fwrite($build, '</script>');
            return true;
        }
        else{
            AppMessage::set('Error building template file');
            return false;
        }
    }

    static function version_existing_file($file_full_path, $template_directory, $template_name)
    {
        if (file_exists($file_full_path)) {
            $versioned_file_name = Language::increment_file_name($template_directory, $template_name);
            rename($file_full_path, $template_directory . $versioned_file_name);
        }
    }

    static function increment_file_name($file_path, $filename)
    {
        if (count(glob($file_path . $filename)) > 0) {
            $filename_parts = explode(".", $filename);
            $file_ext = end($filename_parts);
            $file_name = str_replace(('.' . $file_ext), "", $filename);
            $newfilename = $file_name . '_old_v' . count(glob($file_path . "$file_name*.$file_ext")) . '.' . $file_ext;
            return $newfilename;
        } else {
            return $filename;
        }
    }

    //build the language file if it doesn't exist, and we need to delete all from the language folder. It can't be there anymore. just master. otherwise we'll overwrite peoples translated files. No Fun'


    static function load(){
        global $CONFIG;

        //when we inldude the language file, we want it to set the global LANG variable
        global $LANG;

        $language_file = APP_ROUTE . "/language/" . $CONFIG['language'] . "/build/all.php";
        if (file_exists($language_file))
            require_once($language_file);
        else {
            $LANG = array();
            return Language::build_language_file();

        }
    }

    static function get($key, $data = array()){
        global $LANG;

        $key_parts = explode('.', $key);
        $group = $key_parts[0];
        $item = $key_parts[1];

        //get the text if it exists. Retrun the key if it doesn't
        if(isset($LANG[$group][$item])){
            $line = $LANG[$group][$item];
            return Language::make_replacements($line, $data);
        }
        else return $key;
    }

    static function make_replacements($line, $data){

        foreach ($data as $key => $value) {
            $key = Utils::to_camel_case($key);
            //$line = preg_replace("/:$key\b/i", $value, $line);
            $line = str_replace(':'.$key, $value, $line);
        }

        return $line;
    }


}
 
