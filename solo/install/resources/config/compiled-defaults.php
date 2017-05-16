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
$CONFIG['unknown_user_thumb'] = "client/images/unknown-user.jpg";$CONFIG['enable_debugging'] = false;

$CONFIG['base_url'] = '';

$CONFIG['language'] = 'en';

$CONFIG['datepicker_format'] = 'mm/dd/yy';

$CONFIG['invoice_date_format'] = 'MM/DD/YYYY';

$CONFIG['company']['name'] = '';

$CONFIG['company']['address1'] = '';

$CONFIG['company']['address2'] = '';

$CONFIG['company']['email'] = '';

$CONFIG['company']['phone'] = '';

$CONFIG['company']['website'] = '';

$CONFIG['company']['logo'] = '';

$CONFIG['email']['use_smtp'] = false;

$CONFIG['email']['host'] = '';

$CONFIG['email']['port'] = 587;

$CONFIG['email']['enable_authentication'] = true;

$CONFIG['email']['username'] = '';

$CONFIG['email']['password'] = '';

$CONFIG['email']['enable_encryption'] = '';

$CONFIG['email']['smtp_debug'] = false;

$CONFIG['email']['debug_templates'] = true;

$CONFIG['email']['send_client_emails'] = true;

$CONFIG['invoice']['base_invoice_number'] = 201000;

$CONFIG['invoice']['default_rate'] = 0;

$CONFIG['invoice']['attach_pdf_to_emails'] = true;

$CONFIG['task']['at_risk_timeframe'] = 2;

$CONFIG['task']['clients_can_complete_tasks'] = false;

$CONFIG['task']['clients_can_create_tasks'] = false;

$CONFIG['task']['default_view'] = 'cards';

$CONFIG['theme'] = 'refresh';

$CONFIG['uploads']['max_file_size'] = 200000000;

$CONFIG['uploads']['allow_client_uploads'] = true;

$CONFIG['currency_symbol'] = '$';

$CONFIG['payments']['method'] = 'none';

$CONFIG['payments']['is_sandbox'] = true;

$CONFIG['payments']['stripe']['publishable_key'] = '';

$CONFIG['payments']['stripe']['secret_key'] = '';

$CONFIG['payments']['stripe']['currency_code'] = 'usd';

$CONFIG['payments']['paypal']['business_email'] = '';

$CONFIG['payments']['paypal']['language_code'] = '';

$CONFIG['payments']['paypal']['currency_code'] = '';

$CONFIG['payments']['paypal']['log_ipn_results'] = false;

$CONFIG['calendar']['first_day'] = 0;

$CONFIG['disable_client_access'] = false;

$CONFIG['auto_logout']['is_enabled'] = false;

$CONFIG['auto_logout']['max_inactivity'] = 1800;

$CONFIG['modules_to_hide'] = '';

$CONFIG['default_route_controller'] = 'portal';

$CONFIG['default_route_action'] = 'home';

$CONFIG['default_action'] = 'get';

$CONFIG['referrals']['log'] = true;

$CONFIG['log_queries'] = false;

$CONFIG['force_disable_mysql_strict_mode'] = false;

$CONFIG['purchase_code'] = '';

$CONFIG['timezone'] = 'US/Eastern';

$CONFIG['incoming_email']['email_address'] = '';

$CONFIG['incoming_email']['host'] = '';

$CONFIG['incoming_email']['port'] = 993;

$CONFIG['incoming_email']['password'] = '';

$CONFIG['estimates']['post_processing'] = 'none';

$CONFIG['scheduled_tasks']['code'] = '';




$CONFIG['uploads']['folder_name'] = "files-folder";
$CONFIG['uploads']['path'] = ROOT . '/' . $CONFIG['uploads']['folder_name'] . '/';
$CONFIG['uploads']['web_path'] = $CONFIG['base_url'] . 'server/' .  $CONFIG['uploads']['folder_name'] . '/';

$CONFIG['uploads']['user_images_folder_name'] = "user_images";
$CONFIG['uploads']['user_images_path'] = ROOT . '/' . $CONFIG['uploads']['folder_name'] . '/' . $CONFIG['uploads']['user_images_folder_name'] . '/';
$CONFIG['uploads']['user_images_web_path'] = $CONFIG['base_url'] . 'server/' . $CONFIG['uploads']['folder_name'] . '/' . $CONFIG['uploads']['user_images_folder_name'] . '/';

//CLIENT SIDE CONFIG
//Config values necessary for the client side (javascript) code
//DO NOT PLACE ANY SENSITIVE INFORMATION IN THESE VARIABLES
$CS_CONFIG['payment_method'] = $CONFIG['payments']['method'];
$CS_CONFIG['stripe_publishable_key'] = $CONFIG['payments']['stripe']['publishable_key'];
$CS_CONFIG['currency_symbol'] = $CONFIG['currency_symbol'];
$CS_CONFIG['datepicker_format'] = $CONFIG['datepicker_format'];
$CS_CONFIG['invoice_date_format'] = $CONFIG['invoice_date_format'];
$CS_CONFIG['calendarFirstDay'] = $CONFIG['calendar']['first_day'];
$CS_CONFIG['invoice_default_rate'] = $CONFIG['invoice']['default_rate'];


//Determines the format to show in the files view
//Valid values are Tiles or LineItems
$CS_CONFIG['default_file_view'] = "Tiles";
$CS_CONFIG['default_dashboard_projects_view'] = "Tiles";
$CS_CONFIG['default_route'] = "dashboard";
$CS_CONFIG['company_name'] = $CONFIG['company']['name'];
$CS_CONFIG['task_timer_save_interval'] = 3;
$CS_CONFIG['public_routes'] = $CONFIG['public_routes'];
$CS_CONFIG['allow_client_uploads'] = $CONFIG['uploads']['allow_client_uploads'];
$CS_CONFIG['enable_debugging'] = $CONFIG['enable_debugging'];
$CS_CONFIG['modules_to_hide'] = $CONFIG['modules_to_hide'];
$CS_CONFIG['clients_can_complete_tasks'] = $CONFIG['task']['clients_can_complete_tasks'];
$CS_CONFIG['clients_can_create_tasks'] = $CONFIG['task']['clients_can_create_tasks'];
$CS_CONFIG['theme'] = $CONFIG['theme'];
$CS_CONFIG['default_task_view'] = $CONFIG['task']['default_view'];