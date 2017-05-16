<?php

class Request {

    private $url;
    private $data;
    private $model;
    private $action;
    private $query_string;
    public $post;
    public $get;



    function dispatch(){
        $this->initialize();

        //TODO: Is this a good thing?
        //todo:make our own globals $POST, $GET, store filtered data there
        //http://programmers.stackexchange.com/a/76410
        $_GET = $this->clean($_GET);
        $_POST = $this->clean($_POST);


        $this->post = $this->clean($_POST);
        $this->get = $this->clean($_GET);
        $this->run_route();
    }




    static function clear_params(){
        global $THE_REQUEST;
        $THE_REQUEST->post = array();
        $THE_REQUEST->get = array();
    }

    function initialize() {
        global $CONFIG;
        global $forceAction;

        //todo:convert from camel case to underscores throughout this class, and the application
        $controllerAction = isset($forceAction) ? $forceAction : $_GET['url'];
        $controllerAction = trim($controllerAction, "/");

        if (!empty($controllerAction)) {
            $urlArray = array();
            $urlArray = explode("/", $controllerAction);

            //if the model name is currently plural, make it singular
            if (substr($urlArray[0], -1) == 's' && !class_exists($urlArray[0])) {
                $this->model = substr($urlArray[0], 0, -1);
            } else $this->model = $urlArray[0];
            //$this->model = (substr($urlArray[0], -1) == 's') ? substr($urlArray[0], 0, -1) : $urlArray[0];

            array_shift($urlArray);
            $this->action = isset($urlArray[0]) ? $urlArray[0] : $CONFIG['default_action'];

            array_shift($urlArray);
            $this->query_string = $urlArray;
        } else {
            $this->model = $CONFIG['default_route_controller'];
            $this->action = $CONFIG['default_route_action'];
            $this->query_string = array();
        }
    }

    static function clean($str) {
        $str = is_array($str) ? array_map(array('Request', 'clean'), $str)
            : str_replace('\\', '\\\\', strip_tags(trim(htmlspecialchars((get_magic_quotes_gpc()
                ? stripslashes($str) : $str), ENT_QUOTES))));

        return $str;
    }

    static function get($param_name = null){
        global $THE_REQUEST;
        //currently the client side app passes params in camel case AND underscore case, we need to handle both

        if(!isset($param_name))
            return $THE_REQUEST->post;

        //let's try the param name as passed into the function, most likely underscore case
        if (isset($THE_REQUEST->post[$param_name]))
            return $THE_REQUEST->post[$param_name];
        else {
            //the param doesn't exist in underscore case so let's try camel case. If camel case doesn't exist either,
            //we'll return null
            $param_name = Utils::to_camel_case($param_name);

            if (isset($THE_REQUEST->post[$param_name]))
                return $THE_REQUEST->post[$param_name];
            else return null;
        }
    }




    function run_route() {
        global $CONFIG;

        //init the controller
        //if there is a controller specified for this model, load it. Otherwise we will use the base controller

        //Controllers can be name singlular or plural (i.e. CarsController or CarController) depending on what's most
        //appropriate for the app
        //Try to find the controller using the plural of the model, if it's not found use the singular, if the singular
        //isn't found then use the base controller
        if (class_exists($this->model . 'sController')) {
            $controller_name = $this->model . 'sController';
        } else if (class_exists($this->model . 'Controller'))
            $controller_name = $this->model . 'Controller';
        else $controller_name = 'Controller';

        $controller = new $controller_name($this->model, $this->action);

        //run the action
        if ((int)method_exists($controller, $this->action)) {
            call_user_func_array(array($controller, $this->action), $this->query_string);
        } else if (is_numeric($this->action)) {
            //in this case, action is actually the id of the item we would like to retrieve
            array_unshift($this->query_string, $this->action);
            call_user_func_array(array($controller, $CONFIG['default_action']), $this->query_string);
        }
    }
}
 
