<?php


class SettingDisplay{
    public $info;
    public $display;



    function __construct(){
        $this->prepare_display();
        $this->prepare_info();
    }

    function prepare_info(){
        $info = array();

        $info['estimates.post_processing'] = 'Valid values are none, generate_invoice, or generate_and_send_invoice';

        $this->info = $info;

        return $info;
    }

    function get_info($key){
        return isset($this->info[$key]) ? $this->info[$key] : null;
    }
    function prepare_display(){
        $display = array();

        $display['debugging'] = array(
            'enable_debugging' => Language::get('settingsOverview.enableDebugging')
        );

        $display['general'] = array(
            'base_url' => Language::get('settingsOverview.baseUrl')

        );

        $display['Company Details'] = array(
            'company.name' => Language::get('settingsOverview.companyName'),
            'company.address1' => Language::get('settingsOverview.companyAddress1'),
            'company.address2' => Language::get('settingsOverview.companyAddress2'),
            'company.email' => Language::get('settingsOverview.companyEmail'),
            'company.phone' => Language::get('settingsOverview.companyPhone'),
            'company.website' => Language::get('settingsOverview.companyWebsite'),
            'company.logo' => Language::get('settingsOverview.companyLogo')
        );

        $display['Outgoing Email Settings'] = array(
            'email.use_smtp' => Language::get('settingsOverview.emailUseSmtp'),
            'email.host' => Language::get('settingsOverview.emailHost'),
            'email.port' => Language::get('settingsOverview.emailPort'),
            'email.enable_authentication' => Language::get('settingsOverview.emailEnableAuthentication'),
            'email.username' => Language::get('settingsOverview.emailUsername'),
            'email.password' => Language::get('settingsOverview.emailPassword'),
            'email.enable_encryption' => Language::get('settingsOverview.emailEnableEncryption'),
            'email.smtp_debug' => Language::get('settingsOverview.smtpDebug'),
            'email.debug_templates' => Language::get('settingsOverview.debugTemplates'),

        );

        $display['Incoming Email Settings'] = array(
            'incoming_email.email_address' => Language::get('settingsOverview.incomingEmailAddress'),
            'incoming_email.host' => Language::get('settingsOverview.incomingEmailHost'),
            'incoming_email.port' => Language::get('settingsOverview.incomingEmailPort'),
            'incoming_email.password' => Language::get('settingsOverview.incomingEmailPassword'),
        );

        $display['Invoice Settings'] = array(
            'invoice.base_invoice_number' => Language::get('settingsOverview.invoiceBaseInvoiceNumber'),
            'invoice.default_rate' => Language::get('settingsOverview.defaultRate'),
            'invoice.attach_pdf_to_emails' => Language::get('settingsOverview.attachPdfToEmails'),
        );

        $display['Task Settings'] = array(
            'task.at_risk_timeframe' => Language::get('settingsOverview.atRiskTimeframe'),
            'task.clients_can_complete_tasks' => Language::get('settingsOverview.clientsCanCompleteTasks'),
            'task.clients_can_create_tasks' => Language::get('settingsOverview.clientsCanCreateTasks'),
            'task.default_view' => Language::get('settingsOverview.defaultTasksView'),
        );

        $display['Theme Settings'] = array(
            'theme' => Language::get('settingsOverview.theme')
        );

        $display['Upload Settings'] = array(
            'uploads.allow_client_uploads' => Language::get('settingsOverview.uploadsAllowClientUploads')
        );

        $display['Currency & Payments'] = array(
            'currency_symbol' => Language::get('settingsOverview.currencySymbol'),
            'payments.method' => Language::get('settingsOverview.paymentsMethod'),
            'payments.is_sandbox' => Language::get('settingsOverview.paymentsIsSandbox'),
            'payments.stripe.publishable_key' => Language::get('settingsOverview.stripePublishableKey'),
            'payments.stripe.secret_key' => Language::get('settingsOverview.stripeSecretKey'),
            'payments.stripe.currency_code' => Language::get('settingsOverview.stripeCurrencyCode'),
            'payments.paypal.business_email' => Language::get('settingsOverview.paypalBusinessEmail'),
            'payments.paypal.language_code' => Language::get('settingsOverview.paypalLanguageCode'),
            'payments.paypal.currency_code' => Language::get('settingsOverview.paypalCurrencyCode'),
            'payments.paypal.log_ipn_results' => Language::get('settingsOverview.paypalLogIpnResults'),
        );

        $display['Calendar'] = array(
            'calendar.first_day' => Language::get('settingsOverview.calendarFirstDay')
        );

        $display['Modules To Hide'] = array(
            'modules_to_hide' => Language::get('settingsOverview.modulesToHide')
        );

        $display['Client Access'] = array(
            'disable_client_access' => Language::get('settingsOverview.disableClientAccess'),
            'email.send_client_emails' => Language::get('settingsOverview.emailSendClientEmails')
        );

        $display['Date & Time'] = array(
            'timezone' => Language::get('settingsOverview.timezone'),
            'datepicker_format' => Language::get('settingsOverview.datepickerFormat'),
            'invoice_date_format' => Language::get('settingsOverview.invoiceDateFormat')
        );

        $display['Estimates'] = array(
            'estimates.post_processing' => Language::get('settingsOverview.estimatesPostProcessing')
        );

        $display['Z Settings'] = array(
            'email.use_plugin' => Language::get('settingsOverview.emailUsePlugin')
        );

        $this->display = $display;

        return $display;
    }
}
 
