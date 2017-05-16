<?php
//todo:repeated
function curPageURL() {
    $pageURL = 'http';
    if (isset($_SERVER["HTTPS"]) && $_SERVER["HTTPS"] == "on") {$pageURL .= "s";}
    $pageURL .= "://";
    if ($_SERVER["SERVER_PORT"] != "80") {
        $pageURL .= $_SERVER["SERVER_NAME"].":".$_SERVER["SERVER_PORT"].$_SERVER["REQUEST_URI"];
    } else {
        $pageURL .= $_SERVER["SERVER_NAME"].$_SERVER["REQUEST_URI"];
    }
    return $pageURL;
}

//because many users will get it wrong and we want to get them to the login page successfully
function guess_base_url(){
    $url = curPageURL();
    $url_parts = explode('/', $url);

    //take install off the end of the url
    array_pop($url_parts);
    array_pop($url_parts);

    $guessed_base_url = implode('/', $url_parts);
    return $guessed_base_url;
}

?>

<p>Please complete the following information about your business. You can change these values later</p>

<br>

<form method="post">
    <div class="field">
        <label for="">
            Base Url
            <span class="more-info">(more info)</span>
            <span class="more-info-details">
                The base url is the url you will use to access the application and usually corresponds to the folder
                you uploaded the application files into. Based on your current url, we have attempted to guess your
                base url. Please verify this value is correct. If it is, copy and paste it into the input field below.<br><br>

                <u>Our guess for your base url:</u><br>
                <strong><?php echo guess_base_url(); ?>/</strong>
            </span>
        </label>


        <input type="text" name="base_url" required="required" value="<?php  $this->get_config('base_url')?>">
    </div>

    <hr>




    <div class="field">
        <label for="">
            Email Address
            <span class="more-info">(more info)</span>
            <span class="more-info-details">
                This is the email address that all system generated emails will come from
            </span>

        </label>
        <input type="text" name="company_email" required="required" value="<?php  $this->get_config('company.email')?>">
    </div>




    <input name="next_step" type="hidden" value="finish">

    <div class="step-five-options">
        <input class="advanced-configuration button dark" type="submit" value="Next Step">
    </div>
</form>
