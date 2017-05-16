<?php
$results = $compatibility->get_data();

?>

<table class="table table-bordered">
    <thead>
    <tr>
        <th>Criteria</th>
        <th>Result</th>
        <th>Notes</th>
    </tr>
    </thead>
    <tbody>
    <tr class="result <?php echo $results['php_version']->get_status() ?>">
        <td>
            <div class="title">Minimum PHP Version of 5.4+</div>
        </td>
        <td>
            <?php if ($results['php_version']->ok()): ?>

            <span class="status">Installed</span>

            <?php else: ?>

            <span class="status">Error</span>
            <?php endif; ?>
        </td>
        <td>
            <?php if (!$results['php_version']->ok()): ?>
            <p>Your php version is <?php echo $results['php_version']->get_data(); ?>  Please contact your host to
                update
                your version of php </p>
            <?php endif; ?>

        </td>
    </tr>

    <tr class="result <?php echo $results['pdo']->get_status() ?>">
        <td>
            <div class="title">PDO (MySql)</div>
        </td>
        <td>

            <?php if ($results['pdo']->ok()): ?>

            <span class="status">Installed</span>

            <?php else: ?>

            <span class="status">Error</span>

            <?php endif; ?>

        </td>
        <td>
            <?php if (!$results['pdo']->ok()): ?>
            <p> This application requires PDO to communicate with your database. Please contact your host to have PDO
                installed on your server</p>

            <?php endif; ?>
        </td>
    </tr>

    <tr class="result <?php echo $results['curl']->get_status() ?>">
        <td>
            <div class="title">cURL</div>
        </td>
        <td>

            <?php if ($results['curl']->ok()): ?>

            <span class="status">Installed</span>

            <?php else: ?>

            <span class="status">Error</span>

            <?php endif; ?>

        </td>
        <td>
            <?php if (!$results['curl']->ok()): ?>
            <p> This application requires cURL to complete the installation. Please contact your host to have cURL
                installed on your server</p>

            <?php endif; ?>
        </td>
    </tr>
    </tbody>
</table>



<?php if ($compatibility->ok()): ?>

<p class="step-result success">Your server meets the minimum requirements for this application.</p>

<a class="next-step button dark" href="<?php $this->next_step_url(); ?>"> Next Step </a>

<?php else: ?>

<p class="step-result error">Your server does not meet the minimum requirements. Please resolve the issues listed above before you can
    continue.</p>

<?php endif; ?>

