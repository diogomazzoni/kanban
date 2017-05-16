<!doctype html>
<!-- paulirish.com/2008/conditional-stylesheets-vs-css-hacks-answer-neither/ -->
<!--[if lt IE 7]> <html class="no-js lt-ie9 lt-ie8 lt-ie7" lang="en"> <![endif]-->
<!--[if IE 7]>    <html class="no-js lt-ie9 lt-ie8" lang="en"> <![endif]-->
<!--[if IE 8]>    <html class="no-js lt-ie9" lang="en"> <![endif]-->
<!-- Consider adding a manifest.appcache: h5bp.com/d/Offline -->
<!--[if gt IE 8]><!-->
<html class="no-js" lang="en"> <!--<![endif]-->
<head>
    <meta charset="utf-8">

    <!-- Use the .htaccess and remove these lines to avoid edge case issues.
 More info: h5bp.com/b/378 -->
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">

    <title> Solo. </title>
    <meta name="description" content="">
    <meta name="author" content="">

    <!-- Mobile viewport optimized: h5bp.com/viewport -->
    <meta name="viewport" content="width=device-width,initial-scale=1">

    <!-- Place favicon.ico and apple-touch-icon.png in the root directory: mathiasbynens.be/notes/touch-icons -->
    <link rel="shortcut icon" href="favicon.ico" />

    <link rel="stylesheet" type="text/css" href="client/css/style.css">


</head>

<body class="full">
<?php

$sn = $step_number;
function is_selected($num, $step_number){
    if($num == $step_number)
        echo "selected";
}

function url($step){
    echo 'index.php?step=' . $step;
}

function step_name($step_name){
    return ucwords(implode(' ', explode('_', $step_name)));
}

?>
<div class="window">
    <div class="sidebar">
        <ul>
            <?php foreach($this->steps as $number => $step): ?>
            <li class="<?php is_selected($number + 1, $sn); ?>" >
                <a href="<?php url($number + 1); ?>"><?php echo step_name($step); ?></a>
            </li>
            <?php endforeach; ?>
        </ul>
    </div>
    <div class="main-content">

        <h3 class="step-title"><?php echo $step_title ?></h3>