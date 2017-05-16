<?php
if (isset($verification_result)) {
    $verification_checked = true;
} else {
    $verification_checked = false;
    $verification_result = false;
}
?>

<!-- Step description -->
<p>If you purchased the application from the Duet website, please enter the email address you used to make the purchase. If you purchased Duet from Codecanyon, please enter your codecanyon purchase code.
</p>


<?php if ($verification_result == false): ?>
    <!-- Have we already attempted a verification ? -->
    <?php if ($verification_checked): ?>
        <!-- A purchase code was entered, but it is incorrect -->
        <p class="step-result error">
            Oops. It looks like you entered an invalid email address or purchase code. Please re-enter the email address or purchase code.
        </p>
    <?php else: ?>
        <br>

    <?php endif; ?>

    <form method="post">
        <div class="field"><label></label>
        <input type="text" name="purchase_code" required="required" value="<?php  $this->get_config('purchase_code')?>">
        <input class="next-step button dark" type="submit" value="Verify Purchase Code">
    </form>



<?php else: ?>
    <p class="step-result success">
        Your purchase has been verified
    </p>

    <a class="next-step button dark" href="<?php $this->next_step_url(); ?>"> Next Step </a>
<?php endif; ?>
