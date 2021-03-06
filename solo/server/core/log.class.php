<?php

use Psr\Log\LogLevel;
use Monolog\Logger;
use Monolog\ErrorHandler;
use Monolog\Handler\StreamHandler;

class Log
{

    public $logger;
    private static $fatalErrors = array(E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR);


    private static $instance;


    private function __construct()
    {
        $this->init();
    }


    public function init()
    {
        global $CONFIG;

        //todo:log level should be a config parameter
        $logger = new KLogger\Logger('logs', Psr\Log\LogLevel::WARNING, array(
            'filename' => 'application.log',
            'dateFormat' => 'Y-m-d G:i:s'
        ));

        $this->logger = $logger;

        $this->register_fatal_handler();

        if(get_config('enable_debugging') == true)
            $this->register_error_handler();

        return $this->logger;
    }

    function register_error_handler(){
        function exception_handler($exception) {
            Log::error("Uncaught exception: " . $exception->getMessage());
        }

        //todo:preventing fatal errors generated by incorrect sql from being displayed, which is annoying for quickly debugging.
        //set_exception_handler('exception_handler');
    }

    function register_fatal_handler(){
        function shutdown()
        {
            $error = error_get_last();
            if ($error['type'] === E_ERROR) {
                $description = $error['type'] === E_ERROR ? 'Fatal Error' : 'Error';

                $message = "$description (" . $error['type'] . '): ' . $error['message'];
                $data = array('code' => $error['type'], 'message' => $error['message'], 'file' => $error['file'], 'line' => $error['line']);

                Log::error($message, $data);
            }

        }

        register_shutdown_function('shutdown');

    }

    public static function error($message, $data = array()){
        self::getInstance()->error($message, $data);
    }

    public static function info($message, $data = array()){
        self::getInstance()->info($message, $data);
    }

    public static function warning()
    {

    }

    public static function debug($message, $data = array()){
         if(get_config('enable_debugging') == true) //todo:should be info, and log level should be based on whether debugging is on
            self::getInstance()->error('DEBUG: ' . $message, $data);
    }



    /**
     *  Get Instance
     *
     *  Gets the singleton instance for this object. This method should be called
     *  statically in order to use the Database object:
     *
     *  <code>
     *  $db = MySqlDatabase::getInstance();
     *  </code>
     *
     * @return Database
     */
    public static function getInstance()
    {
        if (!isset(self::$instance)) {
            self::$instance = new Log();
        }

        return self::$instance->logger;
    }


}