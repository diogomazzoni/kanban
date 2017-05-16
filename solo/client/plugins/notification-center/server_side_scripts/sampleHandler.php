<?php


//Uncomment these lines for debugging purposes
//ini_set('error_reporting', E_ALL);
//ini_set('display_errors', 'On');

//inlude the notification center class
require_once('ttw.notification.center.php');

//create an instance of the notification center
$notifications = new NotificationCenter();

//process each command
switch ($_GET['command'])
{
    case 'save':
        return $notifications->save_notification($_GET, false);
        break;
    case 'get':
        return $notifications->get($_GET['category'], $_GET['read_status']);
        break;
    case 'get_new':
         return $notifications->get_new();
         break;
     case 'delete':
        // return $notifications->delete_notification($_GET['id']);
         break;
    default:
        break;
}