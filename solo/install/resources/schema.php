<?php

$activity_sql = <<<EOT
CREATE TABLE IF NOT EXISTS `{activity_table_name}` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(11) NOT NULL,
`client_id` int(11) NOT NULL,
`object_type` varchar(20) NOT NULL,
`object_id` int(11) NOT NULL,
`user_id` int(11) NOT NULL,
`action_taken` varchar(20) NOT NULL,
`object_title` varchar(100) NOT NULL,
`linked_object_type` varchar(20) NOT NULL,
`linked_object_id` int(11) NOT NULL,
`linked_object_title` varchar(100) NOT NULL,
`activity_date` int(11) NOT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
EOT;



$files_sql = <<<EOT
CREATE TABLE IF NOT EXISTS `{files_table_name}` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `uploader_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `entity_type` mediumtext,
  `entity_id` int(11) DEFAULT NULL,
  `notes` mediumtext NOT NULL,
  `type` varchar(10) NOT NULL,
  `size` int(11) NOT NULL,
  `created` int(11) NOT NULL,
  `is_archived` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
EOT;


$projects_sql = <<<EOT
CREATE TABLE IF NOT EXISTS `{projects_table_name}` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(400) NOT NULL,
  `description` text,
  `client_id` int(11) NOT NULL,
  `start_date` int(11) NOT NULL,
  `due_date` int(11) DEFAULT NULL,
  `progress` int(11) NOT NULL,
  `expected_progress` int(11) NOT NULL,
  `file_folder` varchar(50) NOT NULL,
  `status_text` varchar(20) NOT NULL,
  `created_date` int(11) NOT NULL,
  `is_archived` tinyint(4) NOT NULL,
  `is_template` tinyint(4) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
EOT;

$project_notes_sql = <<<EOT
CREATE TABLE IF NOT EXISTS `{project_notes_table_name}` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`project_id` int(11) NOT NULL,
`notes` text NOT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
EOT;



$roles_sql = <<<EOT
CREATE TABLE IF NOT EXISTS `{roles_table_name}` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`name` varchar(20) NOT NULL,
`created` int(11) NOT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
EOT;

$role_user_sql = <<<EOT
CREATE TABLE IF NOT EXISTS `{role_user_table_name}` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`user_id` int(11) NOT NULL,
`role_id` int(11) NOT NULL,
`created` int(11) NOT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
EOT;

$sessions_sql = <<<EOT
CREATE TABLE IF NOT EXISTS `{sessions_table_name}` (
`session_id` varchar(40) NOT NULL,
`user_id` int(11) NOT NULL,
`username` varchar(255) NOT NULL,
`ip_address` varchar(16) NOT NULL,
`user_agent` varchar(50) NOT NULL,
`last_activity` int(10) unsigned NOT NULL,
PRIMARY KEY (`session_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
EOT;

$settings_sql = <<<EOT
CREATE TABLE IF NOT EXISTS `{settings_table_name}` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`section` varchar(100) DEFAULT NULL,
`name` varchar(50) NOT NULL,
`value` varchar(1000) NOT NULL,
`type` varchar(10) NOT NULL,
`description` text NOT NULL,
`default_value` varchar(1000) NOT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
EOT;

$tasks_sql = <<<EOT
CREATE TABLE IF NOT EXISTS `{tasks_table_name}` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task` mediumtext NOT NULL,
  `notes` mediumtext NOT NULL,
  `project_id` int(11) NOT NULL,
  `section_id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `is_complete` tinyint(1) NOT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `position` int(11) NOT NULL,
  `due_date` int(11) DEFAULT NULL,
  `weight` float DEFAULT NULL,
  `status_text` varchar(20) DEFAULT NULL,
  `is_overdue` tinyint(4) NOT NULL,
  `is_section` tinyint(4) NOT NULL,
  `is_invoiced` tinyint(4) NOT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `completed_by` int(11) NOT NULL,
  `completed_date` int(11) DEFAULT NULL,
  `created_date` int(11) NOT NULL,
  `total_time` int(11) NOT NULL,
  `modified_date` int(11) NOT NULL,
  `is_archived` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
EOT;

$task_sections_sql = <<<EOT
CREATE TABLE IF NOT EXISTS `{task_sections_table_name}` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`name` varchar(500) NOT NULL,
`list_id` int(11) NOT NULL,
`position` int(11) NOT NULL,
`action_mark_tasks_complete` int(11) NOT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;
EOT;



$time_entries_sql = <<<EOT
CREATE TABLE IF NOT EXISTS `{time_entries_table_name}` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`time` int(11) NOT NULL,
`task_id` int(11) NOT NULL,
`user_id` int(11) NOT NULL,
`start_date` int(11) NOT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
EOT;

$users_sql = <<<EOT
CREATE TABLE IF NOT EXISTS `{users_table_name}` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`client_id` int(11) DEFAULT NULL,
`first_name` varchar(400) NOT NULL,
`last_name` varchar(30) NOT NULL,
`email` varchar(100) NOT NULL,
`address1` varchar(100) NOT NULL,
`address2` varchar(100) NOT NULL,
`phone` varchar(100) NOT NULL,
`password` varchar(255) NOT NULL,
`salt` varchar(255) NOT NULL,
`temp_password` varchar(10) NOT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
EOT;

$user_project_sql = <<<EOT
CREATE TABLE IF NOT EXISTS `{user_project_table_name}` (
`id` int(11) NOT NULL AUTO_INCREMENT,
`user_id` int(11) NOT NULL,
`project_id` int(11) NOT NULL,
PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;
EOT;

$tables_sql = array(
    'activity' => $activity_sql,
    'files' => $files_sql,
    'projects' => $projects_sql,
    'project_notes' => $project_notes_sql,
    'roles' => $roles_sql,
    'role_user' => $role_user_sql,
    'sessions' => $sessions_sql,
    'settings' => $settings_sql,
    'tasks' => $tasks_sql,
    'task_sections' => $task_sections_sql,
    'time_entries' => $time_entries_sql,
    'users' => $users_sql,
    'user_project' => $user_project_sql
);