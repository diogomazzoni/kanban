<p>
    You can accept payments via <a href="http://www.paypal.com" target="_blank">PayPal</a> or
    <a href="https://stripe.com/" target="_blank">Stripe</a>. Please enter the details for your desired payment provider

    <br>
    <br>
    The application defaults to Sandbox mode. You will need to turn this off in the config file when you are ready to
    accept real payments
</p>

<?php
$wizard = $this;

function is_selected_payment_method($payment_method){
    global $wizard;
    if($payment_method == $wizard->installer->get_config('payments.method'))
        echo 'selected="selected"';
}

?>

<form method="post">
    <input name="is_submitted" value="1" type="hidden">
    <div class="field">
        <label for="">Currency Symbol</label>
        <input type="text" name="currency_symbol" value="<?php $this->get_currency_symbol(); ?>" required="required">
    </div>


    <div class="field">
        <label for="">Payment Method</label>
        <select name="payment_method" id=""  required="required">
            <option value="none" <?php is_selected_payment_method('none'); ?>>None</option>
            <option value="paypal" <?php is_selected_payment_method('paypal'); ?>>Paypal</option>
            <option value="stripe" <?php is_selected_payment_method('stripe'); ?>>Stripe</option>
        </select>
    </div>

    <div id="none-form"></div>
    <div id="paypal-form" class="payment-method-form" >
        <hr>
        <div class="field">
            <label for="">
                Paypal Email Address
                <span class="more-info">(more info)</span>
            <span class="more-info-details">
                This is the email address that you use to receive payments from paypal
            </span>
            </label>
            <input type="text" name="business_email" value="<?php $this->get_config('payments.paypal.business_email'); ?>">
        </div>

        <div class="field">
            <label for="">
                Currency Code
                <span class="more-info">(valid currency codes)</span>
            <span class="more-info-details">
                <a href="https://developer.paypal.com/webapps/developer/docs/classic/api/currency_codes/"
                   target="_blank">
                    List of valid currency codes
                </a>
            </span>
            </label>
            <input type="text" name="currency_code"
                   value="<?php $this->get_config('payments.paypal.currency_code'); ?>">
        </div>

        <div class="field">
            <label for="">
                Language Code
                <span class="more-info">(valid currency codes)</span>
            <span class="more-info-details">
                <a href="https://developer.paypal.com/webapps/developer/docs/classic/api/country_codes/"
                   target="_blank">
                    List of valid language codes
                </a>
            </span>
            </label>
            <input type="text" name="language_code"
                   value="<?php $this->get_config('payments.paypal.language_code'); ?>" >
        </div>
    </div>

    <div id="stripe-form" class="payment-method-form">
        <hr>
        <div class="field">
            <label for="">
                Stripe Publishable Key
            </label>
            <input type="text" name="publishable_key"
                   value="<?php $this->get_config('payments.stripe.publishable_key'); ?>">
        </div>
        <div class="field">
            <label for="">
                Stripe Secret Key
            </label>
            <input type="text" name="secret_key" value="<?php $this->get_config('payments.stripe.secret_key'); ?>">
        </div>
    </div>

    <input class="next-step button dark" type="submit" value="Finish Installation">
</form>

