<?php


class Email extends Model{
    public $message;
    public $recipient;
    public $sender_email;
    public $sender_name;
    public $reply_to;
    public $subject;

    public $has_attachment;
    public $attachment_path;
    public $attachment_name;

    function __construct(){
        $this->has_attachment = false;
        parent::__construct();
    }

    function generate($template, $data = null){

        $this->load_library('rain.tpl.class');

        raintpl::$tpl_dir = ROOT . "/application/templates/email/"; // template directory

        $tpl = new raintpl(); //include Rain TPL

        if(isset($data)){
            $data = Utils::decode($data);
            $tpl->assign($data);
        }

        if(!get_config('email.debug_templates'))
            $this->message = @$tpl->draw($template, true); // draw the template
        else $this->message = $tpl->draw($template, true); // draw the template
    }


    function validate(){
        if(!isset($this->recipient) || !isset($this->message))
            return false;

        if(!isset($this->sender_name))
            $this->set_sender_name();

        if(!isset($this->sender_email))
            $this->set_sender_email();

        if (!isset($this->subject))
            $this->set_subject();

        return true;
    }

    function send(){

        $this->validate();

        if(get_config('email.use_smtp') == true){
            return $this->send_smtp_email();
        }
        else if(get_config('email.use_plugin') == true){
            return $this->send_via_plugin();
        }
        else{
            return $this->send_email();
        }
    }


    function add_attachment($path_to_attachment, $attachment_name){
        if(is_file($path_to_attachment) && isset($attachment_name)){
            $this->has_attachment = true;
            $this->attachment_path = $path_to_attachment;
            $this->attachment_name = $attachment_name;
        }
    }

    function send_via_plugin(){
        $data = array(
            'from' => $this->sender_email,
            'from_name' => $this->sender_name,
            'to' => $this->recipient,
            'reply_to' => isset($this->reply_to) ? $this->reply_to : null,
            'attachment' => $this->has_attachment ? array($this->attachment_path, $this->attachment_name) : null,
            'subject' => $this->subject,
            'message' => $this->message
        );

        require_once(PLUGINS . '/mail/main.php');
        return mail_run($data);
    }

    function send_smtp_email(){
        $this->load_library('phpmailer/class.phpmailer');

        $mail = new PHPMailer;

        $mail->IsSMTP();                                                // Set mailer to use SMTP
        $mail->Host = get_config('email.host');                         // Specify main and backup server
        $mail->Port = get_config('email.port');
        $mail->SMTPAuth = get_config('email.enable_authentication');    // Enable SMTP authentication
        $mail->Username = get_config('email.username');                 // SMTP username
        $mail->Password = get_config('email.password');                 // SMTP password
        $mail->SMTPSecure = get_config('email.enable_encryption');      // Enable encryption, 'ssl' also accepted
        $mail->SMTPDebug = get_config('email.smtp_debug');
        $mail->CharSet = 'UTF-8';
        $mail->From = $this->sender_email;
        $mail->FromName = $this->sender_name;
        $mail->AddAddress($this->recipient);  // Add a recipient

        if(isset($this->reply_to))
            $mail->addReplyTo($this->reply_to);

        if($this->has_attachment){
            $mail->AddAttachment($this->attachment_path, $this->attachment_name);
        }

        $mail->IsHTML(true);    // Set email format to HTML

        $mail->Subject = $this->subject;
        $mail->Body    = $this->message;
        //todo:text version
        //$mail->AltBody = 'This is the body in plain text for non-HTML mail clients';


        if(!$mail->Send()) {
            return $mail->ErrorInfo;
        }
        else return true;
    }

    function send_email(){
        // To send HTML mail, the Content-type header must be set
        $headers = 'MIME-Version: 1.0' . "\r\n";
        $headers .= 'Content-type: text/html; charset=utf-8' . "\r\n";

        // Additional headers
        $headers .= "From: $this->sender_name <$this->sender_email>" . "\r\n";

        if(isset($this->reply_to))
            $headers.= "Reply-To: $this->reply_to\r\n";

        //send the email
        $result = mail($this->recipient, $this->subject, $this->message, $headers);

        return $result;
    }

    function set_recipient($recipient){
        $this->recipient = $recipient;
    }

    function set_reply_to($reply_to){
        $this->reply_to = $reply_to;
    }

    function set_sender_email($sender_email = null){
        $this->sender_email = isset($sender_email) ? $sender_email : get_config('company.email');
    }

    function set_sender_name($sender_name = null){
        $this->sender_name = isset($sender_name) ? $sender_name : get_config('company.name');
    }

    function set_subject($subject = null){
        $params =  array('company_name'=>get_config('company.name'));

        if(isset($subject)){
            $this->subject = Language::get($subject, $params);
        }
        else {
            $this->subject = Language::get('email_subject.default', $params);
        }
    }


}
 
