
$(function () {
    var $sidebar = $('.sidebar'),
        $tabs = $sidebar.find('li, .submenu > div'),
        $step5Choice = $('[name=next_step]');

    function setSidebarHeight(){
        //I don't feel like figuring out the css for equal height columns right now
        //$sidebar.height($('.window').height());
    }

    $('.show-error-details').on('click', function(){
        $(this).next('.error-details').css('display', 'block');
        setSidebarHeight();
    });

    $('.more-info').on('click', function(){
        $(this).next('.more-info-details').css('display', 'block').end().remove();
    });

    $('.complete-installation').on('click', function(){
        $step5Choice.val('finish');
    });

    $('.advanced-configuration').on('click', function(){
        $step5Choice.val('advanced');
    });

    $('[name=payment_method]').on('change', function(){
        $('#' + $(this).val() + '-form').css('display', 'block').siblings('.payment-method-form').css('display', 'none');
        setSidebarHeight();
    });

    var $send_client_emails = $('[name=send_client_emails]'),
        $enable_client_access = $('[name=disable_client_access]');

    $('[name=disable_client_access]').on('change', function(){
        var $send_emails = $('#send-client-emails');

        if($(this).filter(':checked').val() == 0){
            $send_emails.css({display:'block'});
            $send_client_emails.prop('checked', false);
        }
        else {
            $send_emails.css({display:'none'});
            $send_client_emails.filter('[value=0]').prop('checked', true);
        }

    })
    //Form validation
    //Position the error messages next to input labels
    $.tools.validator.addEffect("labelMate", function (errors, event) {
        $.each(errors, function (index, error) {
            error.input.first().parents('.field').addClass('has-error').find('.error').remove().end().prepend('<span class="error">' + error.messages[0] + '</span>');
        });

    }, function (inputs) {
        inputs.each(function () {
            $(this).parents('.field').removeClass('has-error').find('.error').remove();
        });
    });

    // Regular Expression to test whether the value is valid
    $.tools.validator.fn("[name=base_url]", "The base url needs to end with a trailing slash - i.e. http://www.example.com/portal/", function(input, value) {
        return value.slice(-1) == '/';
    });


   $('form').validator({effect:'labelMate'}).submit(function(e){
        var $this = $(this);

        if (!e.isDefaultPrevented()) {
            $this.find('input[type=submit]').attr('disabled', 'disabled').val('Working');
        }
    });


    var payment_method = $('[name=payment_method]').val();
//    console.log(payment_method);
    if(payment_method != 'non')
        $('#' + payment_method + '-form').css('display', 'block');



    setSidebarHeight();
});