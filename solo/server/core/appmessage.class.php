<?php


class AppMessage{
//todo:combine with app class
    public $messages;
    private static $instance;

    private function __construct(){

    }

    private function __clone(){}

    private static function init_messages(){
        if (!isset($_SESSION['duet_app_messages']))
            $_SESSION['duet_app_messages'] = array();
    }

    public static function set($message, $level = 0)
    {
        self::init_messages();

        $_SESSION['duet_app_messages'][] = array(
            'message' => $message,
            'level' => $level
        );
    }

    public static function get(){
        self::init_messages();

        $messages =  $_SESSION['duet_app_messages'];

        //we clear the messages array each time they are retrieved
        $_SESSION['duet_app_messages'] = array();
        return $messages;
    }
}
 
