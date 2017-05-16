<?php


//$activity_table_name = 'activity';
//$approvals_table_name = 'approvals';
//$clients_table_name = 'clients';
//$clients_tax_rates_table_name = 'clients_tax_rates';
//$estimates_table_name = 'estimates';
//$estimate_items_table_name = 'estimate_items';
//$estimate_items_tax_rates_table_name = 'estimate_items_tax_rates';
//$estimate_tax_totals_table_name = 'estimate_tax_totals';
//$files_table_name = 'files';
//$invoices_table_name = 'invoices';
//$invoice_items_table_name = 'invoice_items';
//$invoice_items_tax_rates_table_name = 'invoice_items_tax_rates';
//$invoice_tax_totals_table_name = 'invoice_tax_totals';
//$links_table_name = 'links';
//$messages_table_name = 'messages';
//$payments_table_name = 'payments';
//$payment_terms_table_name = 'payment_terms';
//$projects_table_name = 'projects';
//$project_notes_table_name = 'project_notes';
//$recurring_invoices_table_name = 'recurring_invoices';
//$recurring_invoice_items_table_name = 'recurring_invoice_items';
//$recurring_invoice_items_tax_rates_table_name = 'recurring_invoice_items_tax_rates';
//$roles_table_name = 'roles';
//$role_user_table_name = 'role_user';
//$sessions_table_name = 'sessions';
//$settings_table_name = 'settings';
//$tasks_table_name = 'tasks';
//$task_sections_table_name = 'task_sections';
//$tax_rates_table_name = 'tax_rates';
//$time_entries_table_name = 'time_entries';
//$users_table_name = 'users';
//$user_project_table_name = 'user_project';

function get_table_names(){
    $table_names = array(
        'activity' => 'activity',
        'files' => 'files',
        'projects' => 'projects',
        'project_notes' => 'project_notes',
        'roles' => 'roles',
        'role_user' => 'role_user',
        'sessions' => 'sessions',
        'settings' => 'settings',
        'tasks' => 'tasks',
        'task_sections' => 'task_sections',
        'time_entries' => 'time_entries',
        'users' => 'users',
        'user_project' => 'user_project'
    );

    return $table_names;
}
