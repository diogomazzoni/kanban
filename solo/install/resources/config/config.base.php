<?php

global $CONFIG;
global $CS_CONFIG;

$CONFIG = array();
$CS_CONFIG = array();


//PUBLIC ROUTES
//Routes in this array can be accessible to the public (the user does not need to be logged in)
$CONFIG['public_routes'] = array(
    'paypal/ipn_listener',
    'app/config',
    'app/language',
    'language/templates',
    //the client side route
    'forgot_password',
    //the server side route
    'user/forgot_password',
    'link/*',

    'payments/save',
    'payment/save',
    'paypal/get_button',

    'scheduledtask/daily',
    'scheduledtask/frequently',

    'estimates/response',
    'estimate/response',
    'startup/info'
);

//RESTRICTED ROUTES
//There is some functionality that shouldn't be exposed regardless of whether the user is logged in,
//Routes in this array can not be accessed. Using any functionality on these models requires calling directly in another model
//i.e upload is called by the file model
$CONFIG['restricted_routes'] = array(
    'upload/*',
    'stripepayment/*',
    'paypalpayment/get',
    'payment/get',
    'tasksmanager/get'
);

//USER PLACEHOLDER IMAGES
$CONFIG['unknown_user'] = "client/images/unknown-user-big.jpg";
$CONFIG['unknown_user_thumb'] = "client/images/unknown-user.jpg";