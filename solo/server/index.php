<?php

define('DS', DIRECTORY_SEPARATOR);
define('ROOT', dirname(__FILE__));
define('APP_ROUTE', ROOT . '/application');
define('PLUGINS', realpath(__DIR__ . '/..') . '/plugins');

//TODO:namespace this stuff


//make sure the script is installed
if(!file_exists('config' . DS . 'config.settings.php')){
    echo json_encode(array(
        'code' => 200,
        'auth' => 'not_installed'
    ));

    exit;
}

require_once ('config' . DS . 'config.php');
require_once ('core' . DS . 'shared.functions.php');
require_once ('core' . DS . 'request.class.php');

//Set the time zone to whatever the default is to avoid 500 errors
//Will default to UTC if it's not set properly in php.ini
date_default_timezone_set(@date_default_timezone_get());


//the duet auto loader
spl_autoload_register('duet_autoload');

//psr-0 autoloader, currently only used for Monolog
$classLoader = new SplClassLoader('Psr', 'core/logger');
$classLoader->register();

$classLoader = new SplClassLoader('KLogger', 'core/logger');
$classLoader->register();


$classLoader = new SplClassLoader('Monolog', 'core/logger');
$classLoader->register();

Log::getInstance();
//todo:app class
set_reporting();

Language::load();


global $THE_REQUEST;
$THE_REQUEST = new Request();
$THE_REQUEST->dispatch();

?>