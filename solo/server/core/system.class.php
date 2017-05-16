<?php



class System{

    function load_language(){}

    static function get_config(){}

    static function log($data){


        if(class_exists('ChromePhp')){
            ChromePhp::log($data);
        }
    }

    static function get_latest_version(){


        function get_version($post_url){
            $ch = curl_init();

            //set the url, number of POST vars, POST data
            curl_setopt($ch, CURLOPT_URL, $post_url);
            curl_setopt($ch, CURLOPT_POST, 1);
            curl_setopt($ch, CURLOPT_POSTFIELDS, array());
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

            //todo:bad idea?
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

            $response = curl_exec($ch);

            //close connection
            curl_close($ch);


            return $response = json_decode($response);
        }

        //we'll try https first and if it fails we'll try http. This is just to account for any future changes
        //in the .htaccess config at duetapp.com
        $https = 'https://www.duetapp.com/admin/get_latest_version';
        $http = 'http://www.duetapp.com/admin/get_latest_version';

        $version = get_version($https);

        if(!isset($version))
            $version = get_version($http);

        if(!isset($version))
            $version =  array('version' => 'error');
        //open connection


        return $version;
    }

    function license_manager(){
        $last_server_check_date = 1412721669;
        $install_date =  1412721669;
        $now = time();
        $elapsed = ($now - $install_date)/86400;

        if($elapsed > 1){
            return false;
        }

        //if()
        //get the install date from this program.
        //compare against the install date
        //contact duet servers
        //compare against install date on duet servers, as well as the domain that it's installed on
        //if everythign is good, then load, if not, then prompt to purchase
    }


}

