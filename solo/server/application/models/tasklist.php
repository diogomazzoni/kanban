<?php


class TaskList extends Model
{

    function change()
    {
        $changes = Request::get('changes');

        $result = false;

        foreach ($changes as $details) {
            $function = $this->change_function($details['entity'], $details['change']['action']);

            if (isset($details['change']['data'])) {
                $data = $details['change']['data'];
            } else $data = null;

            $result = $this->$function($details['change']['id'], $data);
        }

        return $result;
    }

    //section change functions
    function add_item_to_section($section_id, $data)
    {
        $id = $data['id'];
        $sql = "UPDATE tasks SET section_id = $section_id WHERE id = '$id'";

        return $this->execute($sql);
    }

    function remove_item_from_section()
    {
        pre('remove');
    }

    function order_section($section_id, $data)
    {
        $sql = "UPDATE tasks SET position = CASE";
        $ids = '';


        if (!count($data['order']))
            return;

        foreach ($data['order'] as $task_order) {
            $sql .= ' WHEN id = ' . $task_order['id'] . ' THEN ' . $task_order['position'];
            $ids .= $task_order['id'] . ',';
        }

        $sql .= ' END';

        $sql .= ' WHERE id IN (' . rtrim($ids, ',') . ')';

        return $this->execute($sql);

    }

    function set_section_name($section_id, $data)
    {
        $sql = "UPDATE task_sections SET name = '" . $data['name'] . "' WHERE id = $section_id";
        $result = $this->execute($sql);

        return $result;
    }

    function move_tasks_to_new_section($section_id, $new_section_id, $tasks_to_move){
        if (count($tasks_to_move) > 0) {
            //we have to tack on the tasks from the deleted section to the uncategorized section
            //therefore we need to figure out the highest position number from the existing tasks in the uncategorized section
            //and use that to start set the order of the tasks that we will be adding to the uncategorized section
            $sql = "SELECT MAX(position) AS max_position FROM tasks WHERE section_id = 0";
            $max = $this->select($sql);
            $max = is_array($max) && isset($max[0]) ? $max[0]['max_position'] : 0;


            //set their new order values for the uncategorized section
            $new_order = array();

            foreach ($tasks_to_move as $task) {
                $order_details = array();
                $order_details['id'] = $task['id'];
                $order_details['position'] = ++$max;

                $new_order[] = $order_details;
            }

            $this->order_section($section_id, array('order' => $new_order));


            //move the tasks to the uncategorized section
            $sql = "UPDATE tasks SET section_id = $new_section_id WHERE section_id = $section_id";
            return $this->execute($sql);
        }
        else return false;
    }

    function delete_section($section_id, $data)
    {

        $new_section_id = isset($data['newSectionId']) ? $data['newSectionId'] : 0;

        //get the tasks that we're going to be moving
        //this is only relevant for a list move, not a kanban move. In a kanban seciton delete
        //the tasks will have already been moved
        $sql = "SELECT id FROM tasks WHERE section_id = $section_id ORDER BY position ASC";
        $tasks_to_move = $this->select($sql);

        $this->move_tasks_to_new_section($section_id, $new_section_id, $tasks_to_move);


        //finally delete the section
        $sql = "DELETE FROM task_sections WHERE id = $section_id";
        $this->execute($sql);


        return true;
    }

    function set_section_action($section_id, $data)
    {
        $action = $data['action'];
        $value = $data['value'] === 'true' ? 1 : 0;

        $sql = "UPDATE task_sections SET $action = $value WHERE id = $section_id";
        $this->execute($sql);

        return true;
    }

    function multi_update($table, $field, $new_values)
    {
        $sql = "UPDATE $table SET $field = CASE";
        $ids = '';


        if (!count($new_values))
            return;

        foreach ($new_values as $new_value) {
            $sql .= ' WHEN id = ' . $new_value['id'] . ' THEN ' . $new_value[$field];
            $ids .= $new_value['id'] . ',';
        }

        $sql .= ' END';

        $sql .= ' WHERE id IN (' . rtrim($ids, ',') . ')';

        return $this->execute($sql);
    }

    function create_section_from_task($task_id, $data)
    {
        $task = new Task($task_id);
        $position = (int)$data['position'];


        $result = $this->create_section(null, array(
            'position' => $position,
            'name' => $task->task,
            'listId' => $task->project_id,
            'tasks' => $data['tasks']
        ));

        if ($result !== false)
            $task->delete();

        return $result;
    }

    function create_section($id, $data)
    {
        $position = (int)$data['position'];
        $list_id = $data['listId'];


        //get other sections to update their order
        $sql = "SELECT id, position FROM task_sections WHERE list_id = $list_id";
        $sections = $this->select($sql);

        // we need to sort the children before we start updating their position elements, so that they remain in order
        usort($sections, function ($a, $b) {
            if ($a['position'] == $b['position']) {
                return 0;
            }

            return ($a['position'] < $b['position']) ? -1 : 1;
        });



        $section = new TaskSection();
        $section->set('name', $data['name']);
        $section->set('position', $position);
        $section->set('list_id', $list_id);
        $section->save();

        //add a dummy array at the position of the new section. We're doing this because we want to update the position
        //elements of all sections and make sure they have the right values. Before we do that though, we have to add
        //a placeholder for the section we're creating
        array_splice($sections, $position - 1, 0, array(array('id' =>$section->id, 'position'=>$position)));


        //build an array for the position update of all sections
        $data_for_section_update = array();
        for ($i = 0; $i < count($sections); $i++){

            $data_for_section_update[] = array(
                'id' => $sections[$i]['id'],
                'position' => $i + 1
            );
        }




        if (isset($section->id)) {

            $task_ids = isset($data['tasks'])? $data['tasks'] : array();
            $data_for_update = array();

            foreach ($task_ids as $task_id) {
                $data_for_update[] = array(
                    'id' => $task_id,
                    'section_id' => $section->id
                );
            }

            $this->multi_update('tasks', 'section_id', $data_for_update);
            $this->multi_update('task_sections', 'position', $data_for_section_update);
            return $section->id;
            //todo:i need to update the positions for all offset tasks
        } else return false;
    }

    function convert_section_to_task($section_id, $data)
    {
        $section = new TaskSection($section_id);
        $position = (int)$data['position'];
        $section_id = isset($data['sectionId']) ? $data['sectionId'] : 0;

        $task = new Task();
        $task->set('task', $section->name);
        $task->set('section_id', $section_id);
        $task->set('position', $position);
        $task->set('project_id', $section->list_id);
        $task->save();

        if (isset($task->id)) {
            $old_section_id = $section->id;

            //get old children
            $sql = "SELECT id, position FROM tasks WHERE section_id = $old_section_id";
            $old_children = $this->select($sql);

            // we need to sort the children before we start updating their position elements, so that they remain in order
            usort($old_children, function ($a, $b) {
                if ($a['position'] == $b['position']) {
                    return 0;
                }

                return ($a['position'] < $b['position']) ? -1 : 1;
            });

            $data_for_update = array();
            $data_for_position_update = array();
            $index = 1;


            foreach ($old_children as $old_child) {
                $data_for_update[] = array(
                    'id' => $old_child['id'],
                    'section_id' => $section_id
                );

                $data_for_position_update[] = array(
                    'id' => $old_child['id'],
                    'position' => $position + $index
                );

                $index++;
            }

            $this->multi_update('tasks', 'section_id', $data_for_update);
            $this->multi_update('tasks', 'position', $data_for_position_update);

            $section->delete();
            return $task->id;
        }
        else return false;
    }

    function update_section($section_id, $data){
        return $this->update($data, 'task_sections', "id = $section_id");
    }

    function order_sections($section_id, $order){

        $this->multi_update('task_sections', 'position', $order['order']);

        return true;
    }

    function change_function($entity, $action)
    {
        $section_functions = array(
            'add_item' => 'add_item_to_section',
            'remove_item' => 'remove_item_from_section',
            'update_order' => 'order_section',
            'set_name' => 'set_section_name',
            'delete' => 'delete_section',
            'set_action' => 'set_section_action',
            'task_to_section' => 'create_section_from_task',
            'section_to_task' => 'convert_section_to_task',
            'new_section' => 'create_section',
            'update' => 'update_section',
            'order_sections' => 'order_sections'
        );

        if ($entity == 'section') {
            return $section_functions[$action];
        } else return '';
    }
}
 
