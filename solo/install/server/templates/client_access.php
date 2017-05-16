<?php
if (isset($verification_result)) {
    $verification_checked = true;
} else {
    $verification_checked = false;
    $verification_result = false;
}
?>

<!-- Step description -->
<p>You can use Solo to collaborate with your clients or your can use it internally (just you and your co-workers).</p>

<br>
<br>
<form method="post">
    <div id="enable-client-access" class="field radio-field">
        <strong>Will clients have access to the system?</strong>
        <div>
            <input type="radio" value="0" name="disable_client_access" ">
            <label>Yes</label>

        </div>

        <div>
            <input type="radio" value="1" name="disable_client_access" >
            <label>No</label>

        </div>

    </div>

<br>
<br>

    <div id="send-client-emails" class="field radio-field">
        <strong>Ok, clients will be able to log in and view their projects. Should the application send auto generated emails
        to clients?</strong>

        <div>
            <input type="radio" value="1" name="send_client_emails">
            <label>Yes</label>

        </div>

        <div>
            <input type="radio" value="0" name="send_client_emails">
            <label>No</label>

        </div>

    </div>

    <input class="button dark" type="submit" value="Next Step">

</form>
