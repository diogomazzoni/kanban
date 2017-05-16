<?php


class HelpContact extends Model{
    public $sent;
    public $email;

    function save(){
        $data = array(
            'message' => nl2br($_POST['message']),
            'code' => get_config('purchase_code')
        );
        //todo:put the purchase code in teh config file. I can use it later


        //access token?
        $postUrl = 'https://www.duetapp.com/admin/support/support_email.php';


        //open connection
        $ch = curl_init();

        //set the url, number of POST vars, POST data
        curl_setopt($ch, CURLOPT_URL, $postUrl);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        //ssl
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);


        $response = curl_exec($ch);

        //close connection
        curl_close($ch);


        if($response == 'success')
        {
            $this->set('sent', 1); //t = 1;
            $this->set('email', get_config('purchase_code')); //t = 1;
            return $this->to_array();
        }
        else return false;


    }
}