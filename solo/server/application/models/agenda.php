<?php

class Agenda extends Model{
    public $tasks;
    public $billing;
    public $activity;
    public $projects;

    function get($criteria = null){

        $tasks = new Task();
        $this->tasks = $tasks->get('WHERE assigned_to = ' . current_user()->id . ' AND is_complete = 0');



        $activity = new Activity();
        $this->activity = $activity->get();

        $project = new Project();
        $this->projects = $project->get("WHERE projects.is_archived = 0");


    }

    function get_billing_summary(){
        $activity = new Activity();
        $billing_activity_items = $activity->get("WHERE object_type = 'payment' OR object_type = 'invoice'");

        $invoice = new Invoice();
        $overdue_invoices = $invoice->get_overdue_invoices();
        $draft_invoices = $invoice->get_draft_invoices();
        $outstanding_invoices = $invoice->get_outstanding_invoices();

        return array(
            'overdue_invoices' => $overdue_invoices,
            'draft_invoices' => $draft_invoices,
            'outstanding_invoices' => $outstanding_invoices,
            'activity' => $billing_activity_items
        );

    }

    function user_can_access(User $user = null){
        return true;
    }
}