<?php

Class FilesController extends Controller{
    function upload(){

        $file = new File();


        //we check access in the upload function
        if($file->upload())
            Response($file);
        else Response()->error($file->errors());
    }

    function download($id, $init_download = null){
        $file = new File($id);

        $this->check_authorization('read', $file);

        if($file->is_valid())
        {
            $path = $file->download($init_download);

            if ($path !== false)
                Response($path);
            else Response()->error(Language::get('errors.file_error_downloading')); //todo: all error strings should be set in the model?
        }
        else Response()->invalid_model($id);
    }

    function upload_notification(){
        $files = Request::get('files');
        $project = new Project($files[0]['project_id']);

        $this->check_authorization('read', $project);

        File::upload_notification($project, $files);
    }
}

 
