<?php

class SearchController extends Controller{

    function get($query = null){
        if($query == null)
            return false;

        $search = new GlobalSearch();

        Response($search->do_search($query));
    }
}