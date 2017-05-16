
<?php if($this->installer->is_upgrade()): ?>
    <p>The installer will now update your existing database.</p>
<?php else: ?>
    <p>The installer will now create the database. Please enter your database credentials below.</p>
<?php endif; ?>


<br>
<?php if (!isset($result) || $result == 'error'): ?>
    <form method="post">
        <div class="field">
            <label for="">Database Name</label>
            <input type="text" value="<?php echo $this->get_database_name(); ?>" name="database_name"
                   required="required" <?php $this->is_disabled(); ?>>
        </div>

        <input type="hidden" name="is_submitted" value="1">
        <?php if(!$this->installer->is_upgrade()): ?>
        <fieldset>
            <p> The following values are set by
                your hosting provider. If you're not sure what they are, you will need to contact your host.</p></p>

            <?php if (isset($result) && $result == 'error'): ?>
                <p class="step-result error">

                    <?php if (!$this->installer->is_upgrade()): ?>
                        Unable to connect. This means that one of the below parameters in incorrect.
                        Please ask your hosting provider if you are unsure about the correct values for these parameters.
                    <?php else: ?>
                        There was an error upgrading the database
                    <?php endif; ?>

                    <br>
                    <span class="show-error-details button flat tiny">Click here to see error details</span>
                <span class="error-details">
                <?php
                if (is_array($result_data)) {
                    foreach ($result_data as $data) {
                        echo $data . '<br>';
                    }
                } else echo $result_data;
                ?>
                </span>


                </p>
            <?php endif; ?>
            <hr/>
            <div class="field">
                <label for="">Database Hostname</label>
                <input type="text" name="database_hostname" required="required"
                       value="<?php $this->get_config('database.hostname') ?>">
            </div>
            <div class="field">
                <label for="">Database Username</label>
                <input type="text" name="database_username" required="required"
                       value="<?php $this->get_config('database.user') ?>">
            </div>
            <div class="field">
                <label for="">Database Password</label>
                <input type="text" name="database_password"
                       value="<?php $this->get_config('database.password') ?>">
            </div>
        </fieldset>
        <?php endif; ?>


        <!-- If this IS an upgrade, but there's an error -->
        <?php if ($this->installer->is_upgrade()): ?>
            <?php if (isset($result) && $result == 'error'): ?>
                <p class="step-result error">

                    <?php
                    if (is_array($result_data)) {
                        foreach ($result_data as $data) {
                            echo $data . '<br>';
                        }
                    } else echo $result_data;
                    ?>

                </p>
            <?php endif; ?>
        <?php endif; ?>



        <?php if(!$this->installer->is_upgrade()): ?>
            <input class="next-step button dark" type="submit" value="Create Database">
        <?php else: ?>
            <input class="next-step button dark" type="submit" value="Update Database">
        <?php endif; ?>
    </form>

<?php else: ?>
    <p class="step-result success">Database created successfully</p>
    <a class="next-step button dark" href="<?php $this->next_step_url(); ?>">Next Step</a>
<?php endif; ?>

