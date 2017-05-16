
<p class="step-result error">
    Please complete Step <?php echo "$step_to_complete ($step_name)"; ?> before continuing with the installation.
</p>



<a class="next-step button dark" href="index.php?step=<?php echo $step_to_complete - 1; ?>"> Go To <?php echo $step_name; ?></a>