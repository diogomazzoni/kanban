
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
$CS_CONFIG['base_url'] = $CONFIG['base_url'];