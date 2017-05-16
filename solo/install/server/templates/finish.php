<?php
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

<p class="step-result">Please read this entire page before proceeding</p>

<ol>
    <li>You will need to delete this installation folder from the server after you have
        tested that all functionality works as you expect. <strong>Leaving this folder on your server is a huge
        security risk </strong>
    </li>

    <?php if(!$this->installer->is_upgrade()): ?>

    <li>
        You can log in with the following credentials:
        <br>
        <br>

        <u>Email Address:</u> admin <br>
        <u>Password:</u> admin<br><br>
    </li>

    <?php else: ?>

    <li>
        You can log in with your existing credentials.
    </li>

    <?php endif; ?>

    <?php if(!$this->installer->is_upgrade()): ?>
    <li>
        You must immediately update your profile and change you password when you log in. <strong>If you
        do not, it will be easy for someone to guess your admin password!</strong>
    </li>
    <?php endif; ?>


    <?php if ($this->installer->is_upgrade()): ?>
    <li>
        Sandbox mode has been turned back on. If you're accepting payments, you will need to turn off sandbox mode in the
        config file.
    </li>
    <?php endif; ?>

</ol>


<br><br>
<a class="next-step button dark" href="<?php echo guess_base_url(); ?>#login">Log In</a>