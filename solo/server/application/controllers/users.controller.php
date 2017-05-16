<?php

Class UsersController extends Controller{


    function set_profile_image(){
        //doesn't need to be locked down because it operates on the current user
        $user = current_user();
        Response($user->set_profile_image());
    }

    function forgot_password(){
        //public route
        $user = new User();

        $user->email = Request::clean($_POST['email']);
        $result = $user->forgot_password();

        Response($result);
    }

    function change_password(){
        //does not need to locked down because it operates on the current user
        $user = current_user();
        $result = $user->change_password();

        if ($user->validation_passed())
            Response($result);
        else Response()->error($user->errors());
    }

    function new_admin(){
        if(!current_user()->is('admin'))
            Response()->not_authorized();

        $user = new User();
        $result = $user->new_admin();

        if ($user->validation_passed())
            Response($result);
        else Response()->error($user->errors());
    }

    //todo:combine with new_admin. Virtually the same code
    function new_agent(){
        if(!current_user()->is('admin'))
            Response()->not_authorized();

        $user = new User();
        $result = $user->new_agent();

        if ($user->validation_passed())
            Response($result);
        else Response()->error($user->errors());
    }

    function send_password(){
        $user_id = Request::get('id');

        if (!current_user()->is('admin'))
            Response()->not_authorized();

        if(!isset($user_id))
            Response('Invalid user id');

        $user = new User($user_id);

        $result = $user->send_password();

        if ($user->validation_passed())
            Response($result);
        else Response()->error($user->errors());
    }

    function agents(){
            //todo: this should be an extenstion of check_authorization. Or a separate function (check_level?)
        if(!current_user()->is('admin'))
            Response()->not_authorized();

        $user = new User();
        $result = $user->get_agents();

        Response($result);
    }
}

 
