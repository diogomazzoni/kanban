<?php


/**
 *Check if environment is development
 */

function set_reporting()
{
    global $CONFIG;

    if ($CONFIG['enable_debugging'] == true) {
        error_reporting(E_ALL);
        ini_set('display_errors', 'On');

        enable_debugging();
    } else {
        error_reporting(E_ALL);
        ini_set('display_errors', 'Off');
        ini_set('log_errors', 'On');
        ini_set('error_log', ROOT . DS . 'tmp' . DS . 'logs' . DS . 'error.log');
    }
}

function enable_debugging(){
    require_once('debug/ChromePhp.php');
}


/**
 * Check for Magic Quotes and remove them
 */
function strip_slashes_deep($value)
{
    $value = is_array($value) ? array_map('strip_slashes_deep', $value) : stripslashes($value);
    return $value;
}




function pre($data, $return = false)
{
    if(!$return){
        echo "<pre>";
        print_r($data);
        echo "</pre>";

        return true;
    }
    else {
        return "<pre>" . print_r($data, true) . "</pre>";
    }
}

function pre_if($test_function, $data){
    if($test_function() === true){
        pre($data);
    }
}


function get_item_from_array($item, &$array){
    $error = false;
    $itemArr = explode('.', $item);
    $optionStructure = $array;

    //determine if the specified option exists on the options structure, if so get a reference to it
    for ($i = 0; $i < count($itemArr); $i++) {
        if (isset($optionStructure[$itemArr[$i]]))
            $optionStructure = $optionStructure[$itemArr[$i]];
        else {
            //The specified parameter does not exist on the options object
            $error = true;
            $optionStructure = false;
        }
    }

    if(!$error)
        return $optionStructure;
    else return false;
}
function get_config($option)
{
    global $CONFIG;

    return get_item_from_array($option, $CONFIG);



}


function duet_autoload($className)
{
    if (file_exists(ROOT . DS . 'core' . DS . strtolower($className) . '.class.php')) {
        require_once(ROOT . DS . 'core' . DS . strtolower($className) . '.class.php');
    } else {
        $filename_parts = explode('Controller', $className);
        $filename_prefix = strtolower($filename_parts[0]);

        //if the call two explode produced an array with two elements, we're loading a controller, otherwise it's a
        //model
        if (isset($filename_parts[1])) {
            $filename = "$filename_prefix.controller.php";

            if (file_exists(ROOT . DS . 'application' . DS . 'controllers' . DS . $filename)) {
                require_once(ROOT . DS . 'application' . DS . 'controllers' . DS . $filename);
            }
        } else {
            $filename = "$filename_prefix.php";

            if (file_exists(ROOT . DS . 'application' . DS . 'models' . DS . $filename)) {
                require_once(ROOT . DS . 'application' . DS . 'models' . DS . $filename);
            }
        }
    }
}

function is_xhr()
{
    return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
}

//since php doesn't allow chaining off of a constructor
function Response($data = null, $code = null)
{
    $code = isset($code) ? $code : 200;
    return new Response($data, $code);
}

function current_user()
{
    return isset($_SESSION['current_user']) ? $_SESSION['current_user'] : Controller::current_user();
}





