<?php

class Notification
{
    public $id;
    public $message;
    public $category;
    public $display_type;
    public $read;
    public $is_new;

    private $db;
    private $table_name;


    function __construct()
    {
        $this->db = MySqlDatabase::getInstance();
        $this->table_name = 'notifications';
        $this->is_new = true;
    }


    function init()
    {
        $this->id = 'notification' . time() . floor(rand() * (100000 - 1 + 1)) + 1;
    }


    function validate()
    {
        //make sure the notification has an id
        if (!isset($this->id))
        {
            $this->init();
        }

        //if the notification message is set, it's valid. Otherwise it's not
        return isset($this->message);
    }


    function save()
    {

        //$read and $is_new need to be 1/0 to get stored properly
        $this->read = $this->read ? 1 : 0;
        $this->is_new = $this->is_new ? 1 : 0;

        $result = $this->db->query("
            REPLACE INTO " . $this->table_name . "(
                `notification_id`,
                `message`,
                `category`,
                `type`,
                `read`,
                `is_new`
            )
            VALUES (
                '" . $this->id . "',
                '" . $this->message . "',
                '" . $this->category . "',
                '" . $this->display_type . "',
                '" . $this->read . "',
                '" . $this->is_new . "'
            );
        ");

        return $result;
    }
}

class NotificationCenter
{

    public $notifications_table;

    private $db;



    function __construct($db_host, $db_user, $db_password, $db_name)
    {
        $this->db = MySqlDatabase::getInstance();
        $this->db->connect($db_host, $db_user, $db_password, $db_name);
        $this->notifications_table = 'notifications';
    }


    function save_notification($fields, $is_new = true)
    {
        $notification = new Notification();
        $notification->id = $fields['id'];
        $notification->message = $fields['message'];
        $notification->category = $fields['category'];
        $notification->display_type = $fields['type'];
        $notification->read = $fields['read'];
        $notification->is_new = $is_new;

        $result = $notification->save();

        return $this->status($result);
    }

    function delete_notification($id)
    {
        $query = "DELETE FROM $this->notifications_table WHERE notification_id = '$id'";

        $result = $this->db->query($query);

        return $this->status($result);
    }


    function get($category, $read_status = false)
    {

        if(isset($read_status) && !in_array($read_status, array('unread', 'read', 'all')))
            return $this->status(false, 'Invalid read status');

        if ($this->db)
        {
            if ($category != 'all' && $read_status != 'all')
            {
                $query = "WHERE `category` = '$category' AND `read` = ". $this->get_read_boolean($read_status) ." AND is_new = '0'" ;
            }
            else if ($category == 'all' && $read_status == 'all')
            {
                $query = "WHERE is_new = '0'" ;
            }
            else if ($category == 'all' && $read_status != 'all')
            {
                $query = "WHERE `read` = ". $this->get_read_boolean($read_status) . " AND is_new = '0'" ;
            }
            else if ($category != 'all' && $read_status == 'all')
            {
                $query = "WHERE `category` = '$category'" . " AND is_new = '0'" ;;
            }
            else{
                $query = false;
            }

            if($query !== false)
            {
                $query = "SELECT * FROM $this->notifications_table " . $query;

                $result = $this->db->query($query);

                return $this->prep_notifications($result);
            }
            else return $this->status(false);
        }
    }

    function get_new()
    {
        $query = "SELECT * FROM $this->notifications_table WHERE is_new = '1'";
        $result = $this->db->query($query);

        return $this->prep_notifications($result);

    }

    function prep_notifications($result)
    {
         //if the query finishes without an error but $result is still false, it's because there are no notifications
        $result = ($result != false) ? $result : 'empty';

        //make sure the id field has the correct name
        $result = $this->map_fields($result);

        return $this->status($result);
    }

    function map_fields($notifications){
        //The notification id is stored as notification_id in the database. The client side script needs it to be
        //named 'id'.
        //The client side script also needs the booleans to be true/false not 1/0

        if(is_array($notifications)){
            foreach($notifications as &$notification){
                $notification['id'] = $notification['notification_id'];
                $notification['read'] = ($notification['read'] == 1) ? true : false;
                $notification['is_new'] = ($notification['is_new'] == 1) ? true : false;
                unset($notification['notification_id']);
            }
        }

        return $notifications;
    }

    function get_read_boolean($read_status)
    {

        if($read_status == 'unread')
             return 0;
        else if ($read_status == 'read')
            return 1;
        else return false;
    }



    function status($result, $info = '')
    {

        if ($this->xhr())
        {
            if ($result == false)
            {
                echo json_encode(array('status' => 'error', 'info'=>$info));
            }
            else
            {
                if($result == 'empty')
                    echo json_encode(array('status' => 'success', 'result' => 'empty'));
                else echo json_encode(array('status' => 'success', 'result' => $result));
            }
        }
        else
        {
            return $result;
        }

    }


    function xhr()
    {
        return (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest')
                ? true : false;
    }
}


class MySqlDatabase
{
    /**
     *  The MySQL link identifier created by {@link connect()}
     *
     * @var resource
     */
    public $link;


    /**
     * @var MySqlDatabase
     */
    private static $instance;


    /**
     *  Constructor
     *
     *  Private constructor as part of the singleton pattern implementation.
     */
    private function __construct()
    {
    }


    public function connect($host, $user, $password, $database, $persistent = false)
    {

    
            $this->link = @mysql_connect($host, $user, $password);


        if (!$this->link)
        {
            throw new Exception('Unable to establish database connection: '
                                . mysql_error());
        }

        if (!@mysql_select_db($database, $this->link))
        {
            throw new Exception('Unable to select database: ' . mysql_error($this->link));
        }


        return $this->link;
    }


    /**
     *  Get Instance
     *
     *  Gets the singleton instance for this object. This method should be called
     *  statically in order to use the Database object:
     *
     *  <code>
     *  $db = MySqlDatabase::getInstance();
     *  </code>
     *
     * @return MySqlDatabase
     */
    public static function getInstance()
    {
        if (!isset(self::$instance))
        {
            self::$instance = new MySqlDatabase();
        }

        return self::$instance;
    }


    function query($query)
    {
        if ($this->link)
        {
            $sql_result = mysql_query($query, $this->link);

            if ($sql_result)
            {
                $result = '';
                if (preg_match("/select/i", $query))
                {
                    while ($row = mysql_fetch_assoc($sql_result))
                    {
                        $result[] = $row;
                    }

                    return $result;
                }
                else
                {
                    if (preg_match("/insert/i", $query))
                    {
                        return mysql_insert_id($this->link);
                    }
                    else
                    {
                        return true;
                    }
                }
            }
            else
            {
                throw new Exception("Query Error: " . mysql_error());
            }
        }

    }

}

