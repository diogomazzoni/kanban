<?php

function get_default_sql(){
    $default_sql = array();

    $default_sql[] = "INSERT INTO `roles` (`id`, `name`, `created`) VALUES
(1, 'admin', 0),
(2, 'client', 0),
(3, 'agent', 0);";

    $default_sql[] = "INSERT INTO `role_user` (`id`, `user_id`, `role_id`, `created`) VALUES
(1, 1, 1, 0)";

    $default_sql[] = "INSERT INTO `users` (`id`, `client_id`, `first_name`, `last_name`, `email`, `address1`, `address2`, `phone`, `password`, `salt`, `temp_password`) VALUES
(1, 0, 'Sample', 'Admin', 'admin', '', '', '', '42e8e8061bd17e8d1b5b7220251d0d396a1250d962796199050307107f85b2e7', '312ffb9033bc186578bc085954a7894df47f591a7f760c69df35ff878a8006a9', '');";

    return $default_sql;
}
