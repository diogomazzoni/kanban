<?php

Class Response{
    private $code;
    private $data;
    private $auth;
    private $user;
    private $lang;

    function __construct($data = null, $code = 200){
        $user = current_user();

        $this->user = $user != false ? $user->client_side() : false;

        if(isset($data)){
            $this->data = $data;
            $this->auth = 'continue';
            $this->code = $code;
            $this->render();
        }

        return $this;
    }

    public function not_logged_in(){
        $this->auth_status('not_logged_in');
    }

    public function auto_logged_out(){
        $this->auth_status('auto_logged_out');
    }

    public function logged_in($additional_data = null){
         $user = current_user();

        //todo:there may be no point in sending this data here. It's being sent in the user paremeter of the response object
         $this->data = array(
             'first_name' => $user->first_name,
             'last_name' => $user->last_name
         );

         if(isset($additional_data) && is_array($additional_data))
            $this->data = array_merge($this->data, $additional_data);

         $this->auth_status('logged_in');
    }

    public function not_authorized(){
        $this->auth_status('not_authorized');
    }

    public function successful_login(){
         $this->auth_status('successful_login');
    }

    public function unsuccessful_login(){
        $this->lang = $this->login_form_language();
        $this->auth_status('unsuccessful_login');
    }

    public function login_form_language(){
        global $LANG;
        return $LANG['loginForm'];
    }

    public function not_installed(){
        $this->auth_status('not_installed');
    }

    public function error($text){
        $this->code = 400;
        $this->data = $text;
        $this->render();
    }

    public function invalid_model($id){
        $this->error('Invalid model id: ' . $id);
    }

    function auth_status($status){
        $this->code = 200;
        $this->auth = $status;
        $this->render();
    }

    private function get_messages(){
        return AppMessage::get();
    }

    function render(){
        global $CONFIG;

        $response = array(
            'code' => $this->code,
//            'data' => Utils::decodeUTF8($this->data),
            'data' => $this->data,
            'auth' => $this->auth,
            'user' => $this->user,
            'messages' => $this->get_messages(),
            //added specifically so the login screen can display the company name (even if the user isn't logged in)
            'company' => $CONFIG['company']['name'],

            //added so that the login screen can display error messages, since the full lang file isn't loaded until successful login
            'lang' => $this->lang
        );

        Model::send_sql_log();

        //we're outputting JSON
        header('Content-type: application/json');
        //todo:convert everything to camel case here for the js. Right now all properties are still using underline syntax my_var_name
        echo json_encode($response);

        exit;
    }


}