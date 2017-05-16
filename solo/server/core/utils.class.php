<?php

class Utils{
    /**
     * Translates a string with underscores into camel case (e.g. first_name -&gt; firstName)
     * @param    string   $str                     String in underscore format
     * @param    bool     $capitalise_first_char   If true, capitalise the first char in $str
     * @return   string                              $str translated into camel caps
     */
    static function to_camel_case($str, $capitalise_first_char = false)
    {
        if ($capitalise_first_char) {
            $str[0] = strtoupper($str[0]);
        }
        $func = create_function('$c', 'return strtoupper($c[1]);');
        return preg_replace_callback('/_([a-z])/', $func, $str);
    }

    static function keys_to_camel_case($array){
        $new_array = array();

        foreach($array as $property => $property_value){
             $new_array[Utils::to_camel_case($property)] = $property_value;
        }

        return $new_array;
    }

    /**
     * Translates a camel case string into a string with underscores (e.g. firstName -&gt; first_name)
     * @param    string   $string    String in camel case format
     * @return    string            $str Translated into underscore format
     */
    static function from_camel_case($string)
    {
        $string[0] = strtolower($string[0]);
        return preg_replace_callback('/([A-Z])/', function ($c)
        {
            return '_' . strtolower($c[1]);
        }, $string);
    }

    static function decode($data)
    {
        if (is_object($data) || is_array($data)) {
            foreach ($data as &$value)
                $value = Utils::decode($value);
        } else $data = html_entity_decode($data);

        return $data;
    }

    //similar to the decode function, but also utf8 encodes strings so that json encode will work properly
    static function decodeUTF8($data){
        if (is_object($data) || is_array($data)) {
            foreach ($data as &$value)
                $value = Utils::decodeUTF8($value);
        } else $data = utf8_encode(html_entity_decode($data));

        return $data;
    }

    static function create_directory($path){
        //http: //stackoverflow.com/a/4134734/427276
        $old_umask = umask(0);

        //todo:does this need to 777?
        $result = mkdir($path, 0777, true);
        umask($old_umask);

        return $result;
    }
}
