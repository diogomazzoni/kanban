<?php

class AppEmail extends Email
{
    protected $user;

    function send($force = false)
    {
        $role = $this->get_role($this->user);

        //clients may not receive emails depending on settings
        if($role == 'client'){

            //if client access has been disabled there is no reason to send ANY emails (even forgot password)
            if(get_config('disable_client_access') == true){
                return false;
            }
            else if (get_config('email.send_client_emails') !== true){
                //clients have access to the system, but client emails are turned off. However, some emails (i.e. forgot
                //password) still need to be sent. The force parameter allows this

                if ($force == true)
                    return parent::send();
                else {
                    return false;
                }
            }
            else {
                //client access isn't disabled
                //client emails arent disabled
                return parent::send();
            }
        }
        else return parent::send();

    }

    function get_role($user)
    {
        if (is_array($user))
            $role = $user['role'];
        else $role = $user->role;

        return $role;
    }

    function set_recipient($user)
    {
        $this->user = $user;

        if (is_array($user))
            $email = $user['email'];
        else $email = $user->email;

        parent::set_recipient($email);
    }

    function get_client_targets($client_id)
    {
        //todo:this gets all users, even admins. It shoudldnt I don't think.

        $client = new Client($client_id);
        $users = $client->get_users();

        return $users;

    }

    function get_admins()
    {
        $sql = "SELECT role_user.user_id, roles.name AS role, users.email, users.id
                FROM role_user
                LEFT JOIN users
                  ON users.id = role_user.user_id
                LEFT JOIN roles
                  ON role_user.role_id = roles.id
                WHERE role_user.role_id = 1";

        $result = $this->select($sql);

        return $result;
    }

    function get_agents($project_id){
        $sql = "SELECT role_user.user_id, roles.name AS role, users.email, users.id
                FROM role_user
                LEFT JOIN users
                  ON users.id = role_user.user_id
                LEFT JOIN roles
                  ON role_user.role_id = roles.id
                WHERE role_user.role_id = 3 AND users.id IN(SELECT user_id FROM user_project WHERE project_id = $project_id)";

        $result = $this->select($sql);

        return $result;



    }

    function get_all_other_users($user_id, $client_id, $project_id)
    {

        $clients = $this->get_client_targets($client_id);
        $admins = $this->get_admins();
        $agents = $this->get_agents($project_id);
        $users = array_merge($admins, $clients, $agents);

        foreach ($users as $key => $user) {
            if ($user['id'] == $user_id) {
                unset($users[$key]);
            }
        }

        return $users;
    }



    function send_invoice($invoice)
    {
        $link = new Link();
        $link->get($invoice);
        $url = $link->url();

        $type = $invoice instanceof Estimate ? 'estimate' : 'invoice';
        $template = $type == 'estimate' ? 'new-estimate' : 'new-invoice';

        $users = $this->get_client_targets($invoice->client_id);
        $client = new Client($invoice->client_id);


        $invoice->prep_for_display();
        $subject = ($type != 'estimate') ? 'email_subjects.new_invoice' : 'email_subjects.new_estimate';

        $subject = Language::get($subject, array(
            'formattedTotal' => $invoice->formatted_total,
            'currencySymbol' => get_config('currency_symbol'),
            'formattedDueDate' => $invoice->formatted_due_date
        ));

        $data = array(
            'invoice' => $invoice,
            'currency_symbol' => get_config('currency_symbol'),
            'client' => $client,
            'company_name' => get_config('company.name'),
            'url' => $url
        );

        foreach ($users as $user) {

            //todo: this role id shouldn't be hardcoded, what if they change.
            if ($user['role_id'] == 2) {
                $this->set_recipient($user);

                $this->set_subject($subject);
                $this->generate($template, $data);
                $this->send();
            }
        }

        return true;
    }



    function send_forgot_password($user, $params)
    {
        $this->set_recipient($user);
        $this->set_subject('email_subjects.forgot_password');

        $this->generate('forgot-password', $params);
        return $this->send(true);
    }

    function send_admin_regenerate_password($user, $params){
        $this->set_recipient($user);
        $this->set_subject('email_subjects.admin_send_password');

        $this->generate('admin-send-password', $params);

        return $this->send(true);
    }

    function send_changed_password($user)
    {
        $this->set_recipient($user);
        $this->set_subject('email_subjects.changed_password');
        $this->generate('changed-password');
        return $this->send(true);
    }

    function send_new_user($user, $params)
    {
        $this->set_recipient($user);
        $this->set_subject('email_subjects.new_account');
        $this->generate('new-user', $params);
        return $this->send(true);
    }

    function send_client_payment_notification($client_id, $params)
    {
        $users = $this->get_client_targets($client_id);

        foreach($users as $user){
            $this->set_recipient($user);
            $this->set_subject('email_subjects.client_payment');
            $this->generate('client-payment', $params);
            $this->send();
        }

    }

    function send_admin_payment_notifications($admins, $params)
    {
        foreach ($admins as $admin) {
            $this->set_recipient($admin);
            $this->set_subject('email_subjects.admin_payment');
            $this->generate('admin-payment', $params);
            $this->send();
        }
    }

    function send_ipn_status($status, $data){
        $admins = $this->get_admins();


        foreach ($admins as $admin) {

            $this->set_recipient($admin);

            $this->set_subject('email_subjects.ipn_status');

            //Log::error($admin);

            $this->generate('ipn-status', array('status' => $status, 'data' => $data));

            $this->send();

        }
    }
    function send_estimate_approval($estimate, $invoice = null)
    {
        $admins = $this->get_admins();

        $estimate_link = new Link();
        $estimate_link->get($estimate);

        if(isset($invoice)){
            $invoice_link = new Link();
            $invoice_link->get($invoice);
            $invoice_url = $invoice_link->url();
        }
        else $invoice_url = false;

        $params = array(
            'estimate' => $estimate,
            'estimate_url' => $estimate_link->url(),
            'invoice' => $invoice,
            'invoice_url' => $invoice_url
        );


        foreach ($admins as $admin) {
            $this->set_recipient($admin);
            $this->set_subject('email_subjects.estimate_approval');
            $this->generate('estimate-approved', $params);
            $this->send();
        }
    }

    function send_estimate_rejection($estimate)
    {
        $admins = $this->get_admins();
        $estimate_link = new Link();
        $estimate_link->get($estimate);

        $params = array(
            'estimate' => $estimate,
            'estimate_url' => $estimate_link->url()
        );

        foreach ($admins as $admin) {
            $this->set_recipient($admin);
            $this->set_subject('email_subjects.estimate_rejected');
            $this->generate('estimate-rejected', $params);
            $this->send();
        }
    }


    function send_message_notification($params, $entity)
    {
        $params['separator'] = $this->get_quoted_text_separator();
        $user_id = $params['posted_by_user_id'];
        $users = $this->get_all_other_users($user_id, $params['client_id'], $params['project_id']);

        if(strlen(get_config('incoming_email.email_address')) > 1){
            $reply_to = AppEmail::generate_entity_reply_to_address($entity);
            $this->set_reply_to($reply_to);
        }

        foreach ($users as $user) {
            $this->set_recipient($user);

            $this->set_subject('email_subjects.message');
            $this->generate('message', $params);
            $result = $this->send();
        }
    }

    function send_file_upload_notification($project, $files)
    {
        $user_id = $files[0]['uploader_id'];

        $users = $this->get_all_other_users($user_id, $project->client_id, $project->id);

        $params = array(
            'project' => $project,
            'files' => $files,
            'base_url' => get_config('base_url')
        );

        foreach ($users as $user) {
            $this->set_recipient($user);
            $this->set_subject('email_subjects.uploaded_file');
            $this->generate('file', $params);
            $result = $this->send();
        }
    }

    function send_payment_notifications($params, $client_id)
    {
        $admins = $this->get_admins();
        $this->send_client_payment_notification($client_id, $params);
        $this->send_admin_payment_notifications($admins, $params);
    }

    function send_task_assignment($params)
    {
        $this->set_recipient($params['user']);
        $this->set_subject('email_subjects.task_assignment');
        $this->generate('task-assignment', $params);
        return $this->send();
    }

    static function parse_email_address($email){
        $parts = explode('@', $email);

        return array(
            'mailbox' => $parts[0],
            'host' => $parts[1]
        );
    }

    static function generate_entity_reply_to_address($entity){
        $email_parts = AppEmail::parse_email_address(get_config('incoming_email.email_address'));

        $reply_to =  $email_parts['mailbox'];
        $reply_to .= '+' . strtolower(get_class($entity)) . '-' . $entity->id;
        $reply_to .= '@' . $email_parts['host'];

        return $reply_to ;
    }

    static function get_quoted_text_separator(){
        return '##- ' . Language::get('email.quotedTextSeparator') . ' -##';
    }




}