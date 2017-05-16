<?php

class StartupController extends Controller{

    function info(){
        $startup = new Startup();
        Response($startup->info());
    }
}
