<?php

class ActivityManager{

    static function client_deleted($client){
        new Activity($client, Language::get('activity.deleted'), $client->name);
    }

    static function file_created($file){
        new Activity($file, Language::get('activity.uploaded'), $file->name);
    }
    static function file_deleted($file){
        new Activity($file, Language::get('activity.deleted'), $file->name);
    }

    static function invoice_created(Invoice $invoice){
        //todo:some saves shouldn't generate an activity item

        new Activity(
            $invoice,
            Language::get('activity.created'),
            '#' . $invoice->number,
            $invoice->get_is_auto_generated() !== true
        );
    }
    static function invoice_updated(Invoice $invoice){
        //todo:some saves shouldn't generate an activity item
        new Activity(
            $invoice,
            Language::get('activity.updated'),
            '#' . $invoice->number,
            $invoice->get_is_auto_generated() !== true
        );
    }
    static function invoice_deleted($invoice){
        new Activity($invoice, Language::get('activity.deleted'), $invoice->number);
    }

    static function message_activity_title($object){
        //get the activity title
        switch (get_class($object)) {
            case 'File':
                $title_field = 'name';
                break;
            case 'Invoice':
                $title_field = 'number';
                break;
            case 'Project':
                $title_field = 'name';
                break;
            case 'Task':
                $title_field = 'task';
                break;
            default:
                $title_field = '';
                break;
        }

        return isset($object->$title_field) ? $object->$title_field : '';
    }
    static function message_created($message){
        $activity = new Activity();
        $activity->set_object($message);
        $activity->set('object_title', $message->message);
        $activity->set('action_taken', Language::get('activity.posted'));

        $message->linked_object = new $message->reference_object($message->reference_id);
        $activity->set_linked_object($message->linked_object);

        $message->linked_object_title = ActivityManager::message_activity_title($message->linked_object);
        $activity->set('linked_object_title', $message->linked_object_title);

        $activity->save();
    }

    static function invoice_generated_from_recurring_series($recurring_invoice, $invoice){
        $activity = new Activity();
        $activity->set_object($invoice);
        $activity->set('object_title', $invoice->number);
        $activity->set('action_taken', 'generated');

        $activity->is_user_generated = false;


        $activity->set_linked_object($recurring_invoice);


        $activity->set('linked_object_title', $recurring_invoice->profile_name);

        $activity->save();

    }

    //todo:payment method (and possibly invoice) should be parameters on the payment object and this function, should just accept the payment object and possibly user_id
    static function payment_created($payment, $invoice, $payment_method, $user_id){
        $title = Language::get('activity.payment_created', array(
            'invoice_number' => $invoice->number,
            'currency_symbol' => get_config('currency_symbol'),
            'paymentAmount' => $payment->amount
        ));

        $activity = new Activity();
        $activity->set_object($payment);
        $activity->set('action_taken', Language::get('activity.completed'));
        $activity->set('object_title', $title);
        $activity->set('project_id', $invoice->project_id);
        $activity->set('client_id', $invoice->client_id);

        if ($payment_method == 'paypal') {
            $activity->is_user_generated = false;
            $activity->set('user_id', $user_id);
        }

        $activity->save();
    }

    static function project_due_date_updated($project){
        $change = $project->evaluate_date_difference($project->previous_params['due_date'], $project->due_date);

        $data = array_merge(array('project_name' => $project->name), $change);
        $title = Language::get('activity.due_date_updated_details', $data);
        $action = Language::get('activity.updated');

        new Activity($project, $action, $title);
    }
    static function project_status_changed($project){
        //todo: create a function on activity model to handle system generated messages. Otherwise this code will just be repeated
        $activity = new Activity();
        $activity->set_object($project);
        $activity->is_user_generated = false;
        $activity->set_action(Language::get('activity.status_change'));

        $language_key_for_status_text = Utils::to_camel_case(str_replace('-', '_', $project->get_status()));

        $localized_project_status = Language::get('activity.' . $language_key_for_status_text);

        $title_data = array(
            'project_name' => $project->name,
            'project_status' => $localized_project_status
        );

        $activity->set_title(Language::get('activity.status_change_details', $title_data));
        $activity->save();
    }
    static function project_created(){}
    static function project_deleted($project){
        new Activity($project, Language::get('activity.deleted'), $project->name);
    }

    static function task_created($task){
        new Activity($task, Language::get('activity.created'), $task->task);
    }
    static function task_deleted($task){
        new Activity($task, Language::get('activity.deleted'), $task->task);
    }
    static function task_completed($task){
        new Activity($task, Language::Get('activity.completed'), $task->task);
    }
    static function task_reassigned($task, $assigned_to_user){
        $title = Language::get('activity.assignment_details', array(
            'assigned_to_first_name' => $assigned_to_user->first_name,
            'assigned_to_last_name' => $assigned_to_user->last_name
        ));

        new Activity($task, Language::get('activity.reassigned'), $title);
    }
}
 
