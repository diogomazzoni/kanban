
<p>Welcome to the <strong>Solo</strong> installation wizard.</p>

<br>

<?php if(!$this->installer->is_upgrade()): ?>

<p>You will need the following to complete this installation:</p>
<ul>
    <li>A server with php 5.3+</li>
    <li>Your MySql database credentials (hostname, username, and password)</li>
</ul>

<?php else: ?>

<p>This wizard will attempt to upgrade Solo to version <?php echo $this->installer->version(); ?></p>

<?php endif; ?>

<p class="step-result">Please be sure to read ALL steps carefully to ensure a successful installation.</p>

<a class="next-step button dark" href="index.php?step=2">Next Step</a>