<?php

class Response
{
    protected $status;
    protected $data;

    function __construct($data = null)
    {
        //default response is success
        $this->status = 'success';
        $this->data = $data;
        return $this;
    }

    function error($data = null)
    {
        $this->status = 'error';
        $this->data = $data;
        return $this;
    }

    function get_data(){
        return $this->data;
    }

    function get_status(){
        return $this->status;
    }

    function ok()
    {
        return $this->status == 'success';
    }
}

//because I can't chain off a constructor
function Response($data = null)
{
    return new Response($data);
}