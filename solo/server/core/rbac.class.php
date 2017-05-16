<?php


class RBAC{
    //todo: this doesn't belong here. entity specific information in the core. reevaluate
    static $role_permissions = array(
        'admin' => array(
            'Agenda' => '*',
            'Dashboard' => '*',
            'Calendar' => '*',
            'Client' => '*',
            'File' => '*',
            'Invoice' => '*',
            'Estimate' => '*',
            'InvoiceItem' => '*',
            'Message' => '*',
            'Payment' => '*',
            'Project' => '*',
            'ProjectDetails' => '*',
            'ProjectNotes' => '*',
            'Task' => '*',
            'TaskSection' => '*',
            'Template' => '*',
            'TimeEntry' => '*',
            'TasksManager' => '*',
            'User' => '*'
        ),
        'agent' => array(
            'Agenda' => 'read',
            'Dashboard' => 'read',
            'Calendar' => 'read',
            'Client' => 'create|read|update',
            'File' => 'create|read|update|delete',
            'Invoice' => 'create|read|update|delete',
            'Estimate' => 'create|read|update|delete',
            'InvoiceItem' => 'create|read|update|delete',
            'Message' => 'create|read|update|delete',
            'Payment' => 'create|read',
            'Project' => 'create|read|update',
            'ProjectDetails' => 'read',
            'ProjectNotes' => 'create|read|update',
            'Task' => 'create|read|update|delete',
            'TaskSection' => 'create|read|update|delete',
            'Template' => 'create|read|update|delete',
            'TimeEntry' => 'create|read|update|delete',
            'TasksManager' => 'create|read|update',
            'User' => 'create|read|update'
        ),
        'client' => array(
            'Agenda' => 'read',
            'Dashboard' => 'read',
            'Calendar' => 'read',
            'Client' => 'read|update',
            'File' => 'create|read|update|delete',
            'Invoice' => 'read',
            'Estimate' => 'read',
            'InvoiceItem' => 'read',
            'Message' => 'create|read|update|delete',
            'Payment' => 'create|read',
            'Project' => 'read',
            'ProjectDetails' => 'read',
            'ProjectNotes' => 'read',
            'Task' => 'create|read|update|delete',
            'TaskSection' => 'create|read|update|delete',
            'Template' => '',
            'TimeEntry' => 'create|update',
            'User' => 'read|update'
        )

    );

    static function role_can_perform_action($role, $actions, $entity){
        //admins can do everything
        if($role == 'admin')
            return true;

        $actions = explode('|', $actions);

        if(isset(self::$role_permissions[$role]) && isset(self::$role_permissions[$role][$entity])){
            $permissions = self::$role_permissions[$role][$entity];
            $permissions = explode('|', $permissions);

            $result = true;
            foreach($actions as $action){
                if(!in_array($action, $permissions)){
                    $result = false;
                    break;
                }
            }

            return $result;

        }
        else return false;
    }

    static function export(){
        $all_rights = array('create', 'read', 'update', 'delete');

        $current_user = current_user();

        $permissions = self::$role_permissions[$current_user->role];

        $exportedRights = array();

        foreach($permissions as $model => $model_permissions){
            if($model_permissions === '*')
                $model_permissions = $all_rights;
            else $model_permissions = explode('|', $model_permissions);

            foreach($all_rights as $ability){
                $descriptionOfThisAbility = 'can' . ucFirst($ability) . ucFirst($model);

                $exportedRights[$descriptionOfThisAbility] = in_array($ability, $model_permissions) ? 1 : 0;
            }
        }

        return $exportedRights;
    }
}