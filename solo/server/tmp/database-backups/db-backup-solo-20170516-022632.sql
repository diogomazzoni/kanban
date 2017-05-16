CREATE DATABASE IF NOT EXISTS solo;

USE solo;

DROP TABLE IF EXISTS activity;

CREATE TABLE `activity` (
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;

INSERT INTO activity VALUES("1","1","0","task","1","1","created","Ã§Â´Ã§Â´Ã§","","0","","1494893071");
INSERT INTO activity VALUES("2","1","0","task","1","1","completed","Ã§Â´Ã§Â´Ã§","","0","","1494893072");
INSERT INTO activity VALUES("3","1","0","task","2","1","created","~Â´~Â´~Â´~Â´","","0","","1494893077");
INSERT INTO activity VALUES("4","1","0","task","2","1","completed","~Â´~Â´~Â´~Â´","","0","","1494893078");
INSERT INTO activity VALUES("5","1","0","task","3","1","created","5456656","","0","","1494893083");
INSERT INTO activity VALUES("6","1","0","task","4","1","created","54545454","","0","","1494893085");
INSERT INTO activity VALUES("7","1","0","task","5","1","created","546464","","0","","1494893087");
INSERT INTO activity VALUES("8","1","0","task","5","1","completed","546464","","0","","1494894249");



DROP TABLE IF EXISTS files;

CREATE TABLE `files` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8;




DROP TABLE IF EXISTS project_notes;

CREATE TABLE `project_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `notes` text NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;




DROP TABLE IF EXISTS projects;

CREATE TABLE `projects` (
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

INSERT INTO projects VALUES("1","5952952","5298258528","1","1494885600","","60","0","","on-schedule","1494893050","0","0");
INSERT INTO projects VALUES("2","nova","11111111","1","1494885600","","100","0","","on-schedule","1494893172","0","0");
INSERT INTO projects VALUES("3","jbjjhj","hjhjhjhj","1","1494885600","","100","0","","","1494894262","1","0");



DROP TABLE IF EXISTS role_user;

CREATE TABLE `role_user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `created` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

INSERT INTO role_user VALUES("1","1","1","0");



DROP TABLE IF EXISTS roles;

CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `created` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

INSERT INTO roles VALUES("1","admin","0");
INSERT INTO roles VALUES("2","client","0");
INSERT INTO roles VALUES("3","agent","0");



DROP TABLE IF EXISTS sessions;

CREATE TABLE `sessions` (
  `session_id` varchar(40) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(255) NOT NULL,
  `ip_address` varchar(16) NOT NULL,
  `user_agent` varchar(50) NOT NULL,
  `last_activity` int(10) unsigned NOT NULL,
  PRIMARY KEY (`session_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

INSERT INTO sessions VALUES("9jtkv4kpjjtec8bm06ughvks61","1","admin","::1","c804c5de4c818209cbbc308ed95f22a5","1494894265");



DROP TABLE IF EXISTS settings;

CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `section` varchar(100) DEFAULT NULL,
  `name` varchar(50) NOT NULL,
  `value` varchar(1000) NOT NULL,
  `type` varchar(10) NOT NULL,
  `description` text NOT NULL,
  `default_value` varchar(1000) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8;

INSERT INTO settings VALUES("1","","enable_debugging","","boolean","","");
INSERT INTO settings VALUES("2","","base_url","http://localhost/solo/","string","","");
INSERT INTO settings VALUES("3","","language","en","string","","");
INSERT INTO settings VALUES("4","","datepicker_format","mm/dd/yy","string","","");
INSERT INTO settings VALUES("5","","invoice_date_format","MM/DD/YYYY","string","","");
INSERT INTO settings VALUES("6","company","name","","string","","");
INSERT INTO settings VALUES("7","company","address1","","string","","");
INSERT INTO settings VALUES("8","company","address2","","string","","");
INSERT INTO settings VALUES("9","company","email","napoliana.sl@gmail.com","string","","");
INSERT INTO settings VALUES("10","company","phone","","string","","");
INSERT INTO settings VALUES("11","company","website","","string","","");
INSERT INTO settings VALUES("12","company","logo","http://localhost/solo/client/images/sample-logo.png","string","","");
INSERT INTO settings VALUES("13","email","use_smtp","","boolean","","");
INSERT INTO settings VALUES("14","email","host","","string","","");
INSERT INTO settings VALUES("15","email","port","587","number","","");
INSERT INTO settings VALUES("16","email","enable_authentication","1","boolean","","");
INSERT INTO settings VALUES("17","email","username","","string","","");
INSERT INTO settings VALUES("18","email","password","","string","","");
INSERT INTO settings VALUES("19","email","enable_encryption","","string","","");
INSERT INTO settings VALUES("20","email","smtp_debug","","boolean","","");
INSERT INTO settings VALUES("21","email","debug_templates","1","boolean","","");
INSERT INTO settings VALUES("22","email","send_client_emails","1","boolean","","");
INSERT INTO settings VALUES("23","email","use_plugin","","boolean","","");
INSERT INTO settings VALUES("24","invoice","base_invoice_number","201000","number","","");
INSERT INTO settings VALUES("25","invoice","default_rate","0","number","","");
INSERT INTO settings VALUES("26","invoice","attach_pdf_to_emails","1","boolean","","");
INSERT INTO settings VALUES("27","task","at_risk_timeframe","2","number","","");
INSERT INTO settings VALUES("28","task","clients_can_complete_tasks","","boolean","","");
INSERT INTO settings VALUES("29","task","clients_can_create_tasks","","boolean","","");
INSERT INTO settings VALUES("30","task","default_view","cards","string","","");
INSERT INTO settings VALUES("31","","theme","refresh","string","","");
INSERT INTO settings VALUES("32","uploads","max_file_size","200000000","number","","");
INSERT INTO settings VALUES("33","uploads","allow_client_uploads","1","boolean","","");
INSERT INTO settings VALUES("34","","currency_symbol","$","string","","");
INSERT INTO settings VALUES("35","payments","method","none","string","","");
INSERT INTO settings VALUES("36","payments","is_sandbox","1","boolean","","");
INSERT INTO settings VALUES("37","payments.stripe","publishable_key","","string","","");
INSERT INTO settings VALUES("38","payments.stripe","secret_key","","string","","");
INSERT INTO settings VALUES("39","payments.stripe","currency_code","usd","string","","");
INSERT INTO settings VALUES("40","payments.paypal","business_email","","string","","");
INSERT INTO settings VALUES("41","payments.paypal","language_code","","string","","");
INSERT INTO settings VALUES("42","payments.paypal","currency_code","","string","","");
INSERT INTO settings VALUES("43","payments.paypal","log_ipn_results","","boolean","","");
INSERT INTO settings VALUES("44","calendar","first_day","0","number","","");
INSERT INTO settings VALUES("45","","disable_client_access","","boolean","","");
INSERT INTO settings VALUES("46","auto_logout","is_enabled","","boolean","","");
INSERT INTO settings VALUES("47","auto_logout","max_inactivity","1800","number","","");
INSERT INTO settings VALUES("48","","modules_to_hide","","string","","");
INSERT INTO settings VALUES("49","","default_route_controller","portal","string","","");
INSERT INTO settings VALUES("50","","default_route_action","home","string","","");
INSERT INTO settings VALUES("51","","default_action","get","string","","");
INSERT INTO settings VALUES("52","referrals","log","1","boolean","","");
INSERT INTO settings VALUES("53","","log_queries","","boolean","","");
INSERT INTO settings VALUES("54","","force_disable_mysql_strict_mode","","boolean","","");
INSERT INTO settings VALUES("55","","purchase_code","","string","","");
INSERT INTO settings VALUES("56","","timezone","US/Eastern","string","","");
INSERT INTO settings VALUES("57","incoming_email","email_address","","string","","");
INSERT INTO settings VALUES("58","incoming_email","host","","string","","");
INSERT INTO settings VALUES("59","incoming_email","port","993","number","","");
INSERT INTO settings VALUES("60","incoming_email","password","","string","","");
INSERT INTO settings VALUES("61","estimates","post_processing","none","string","","");
INSERT INTO settings VALUES("62","scheduled_tasks","code","566180","string","","");
INSERT INTO settings VALUES("63","","enable_debugging","","boolean","","");
INSERT INTO settings VALUES("64","","base_url","http://localhost/solo/","string","","");
INSERT INTO settings VALUES("65","company","name","","string","","");
INSERT INTO settings VALUES("66","company","address1","","string","","");
INSERT INTO settings VALUES("67","company","address2","","string","","");
INSERT INTO settings VALUES("68","company","email","napoliana.sl@gmail.com","string","","");
INSERT INTO settings VALUES("69","company","phone","","string","","");
INSERT INTO settings VALUES("70","company","website","","string","","");
INSERT INTO settings VALUES("71","company","logo","http://localhost/solo/client/images/sample-logo.png","string","","");
INSERT INTO settings VALUES("72","email","use_smtp","","boolean","","");
INSERT INTO settings VALUES("73","email","host","","string","","");
INSERT INTO settings VALUES("74","email","username","","string","","");
INSERT INTO settings VALUES("75","email","password","","string","","");
INSERT INTO settings VALUES("76","email","enable_encryption","","string","","");
INSERT INTO settings VALUES("77","email","smtp_debug","","boolean","","");
INSERT INTO settings VALUES("78","email","use_plugin","","boolean","","");
INSERT INTO settings VALUES("79","invoice","default_rate","0","number","","");
INSERT INTO settings VALUES("80","task","clients_can_complete_tasks","","boolean","","");
INSERT INTO settings VALUES("81","task","clients_can_create_tasks","","boolean","","");
INSERT INTO settings VALUES("82","payments.stripe","publishable_key","","string","","");
INSERT INTO settings VALUES("83","payments.stripe","secret_key","","string","","");
INSERT INTO settings VALUES("84","payments.paypal","business_email","","string","","");
INSERT INTO settings VALUES("85","payments.paypal","language_code","","string","","");
INSERT INTO settings VALUES("86","payments.paypal","currency_code","","string","","");
INSERT INTO settings VALUES("87","payments.paypal","log_ipn_results","","boolean","","");
INSERT INTO settings VALUES("88","calendar","first_day","0","number","","");
INSERT INTO settings VALUES("89","","disable_client_access","","boolean","","");
INSERT INTO settings VALUES("90","auto_logout","is_enabled","","boolean","","");
INSERT INTO settings VALUES("91","","modules_to_hide","","string","","");
INSERT INTO settings VALUES("92","","log_queries","","boolean","","");
INSERT INTO settings VALUES("93","","force_disable_mysql_strict_mode","","boolean","","");
INSERT INTO settings VALUES("94","","purchase_code","","string","","");
INSERT INTO settings VALUES("95","incoming_email","email_address","","string","","");
INSERT INTO settings VALUES("96","incoming_email","host","","string","","");
INSERT INTO settings VALUES("97","incoming_email","password","","string","","");
INSERT INTO settings VALUES("98","scheduled_tasks","code","566180","string","","");



DROP TABLE IF EXISTS task_sections;

CREATE TABLE `task_sections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(500) NOT NULL,
  `list_id` int(11) NOT NULL,
  `position` int(11) NOT NULL,
  `action_mark_tasks_complete` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;

INSERT INTO task_sections VALUES("1","Ã§.Ã§;.","1","1","0");
INSERT INTO task_sections VALUES("2","Ã§Â´Ã§..Ã§","1","2","0");
INSERT INTO task_sections VALUES("3","mkomk","2","1","0");
INSERT INTO task_sections VALUES("4","yyyt","3","1","0");



DROP TABLE IF EXISTS tasks;

CREATE TABLE `tasks` (
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;

INSERT INTO tasks VALUES("1","Ã§Â´Ã§Â´Ã§","","1","2","0","1","1","1","1","","0","","0","0","0","","1","1494893072","1494893071","0","0","0");
INSERT INTO tasks VALUES("2","~Â´~Â´~Â´~Â´","","1","1","0","1","1","1","1","","0","","0","0","0","","1","1494893078","1494893077","0","0","0");
INSERT INTO tasks VALUES("3","5456656","","1","2","0","0","1","1","1","","0","","0","0","0","","0","","1494893083","0","0","0");
INSERT INTO tasks VALUES("4","54545454","","1","2","0","0","1","1","2","","0","","0","0","0","","0","","1494893085","0","0","0");
INSERT INTO tasks VALUES("5","546464","","1","2","0","1","1","1","3","","0","","0","0","0","","1","1494894249","1494893087","0","0","0");



DROP TABLE IF EXISTS time_entries;

CREATE TABLE `time_entries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `time` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `start_date` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;




DROP TABLE IF EXISTS user_project;

CREATE TABLE `user_project` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;




DROP TABLE IF EXISTS users;

CREATE TABLE `users` (
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

INSERT INTO users VALUES("1","0","Sample","Admin","admin","","","","42e8e8061bd17e8d1b5b7220251d0d396a1250d962796199050307107f85b2e7","312ffb9033bc186578bc085954a7894df47f591a7f760c69df35ff878a8006a9","");



