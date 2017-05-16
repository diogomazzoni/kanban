var DUET = DUET || {};


DUET.Agenda = function () {
    this.type = 'agenda';
};

DUET.Agenda.prototype = new DUET.Model();

DUET.Agenda.prototype.postLoadProcessing = function () {
    var self = this,
        projectsCollection = new DUET.Collection({model: 'project'}),
        tasksCollection = new DUET.Collection({model: 'task'});
    tasksCollection.load(this.tasks);
    projectsCollection.load(this.projects);

    this.tasks = tasksCollection;
    this.projects = projectsCollection;
    this.today = [];
    this.upcoming = [];
    this.other = [];

    var startOfToday = moment().startOf('day').unix();
    var endOfToday = moment().endOf('day').unix();
    var endOfUpcoming = moment().add(3, 'days').endOf('day').unix();

    this.endOfToday = endOfToday;
    this.tomorrowEndOfDay = moment().add(1, 'days').endOf('day').unix();
    this.fourDaysEndOfDay = moment().add(4, 'days').endOf('day').unix();

    $.each(this.tasks.models, function (i, model) {
        var dueDate = model.dueDate;


        if (dueDate) {
            if (dueDate >= 0 && dueDate <= endOfToday) {
                model.dueDateCategory = 'today';
                self.today.push(model);
            }
            else if (dueDate <= endOfUpcoming) {
                model.dueDateCategory = 'upcoming';
                self.upcoming.push(model);
            }
            else {
                model.dueDateCategory = 'other';
                self.other.push(model);
            }
        }
        else {
            model.dueDateCategory = 'other';
            self.other.push(model);
        }


    });

    this.todayHasTasks = this.today.length > 0;
    this.upcomingHasTasks = this.upcoming.length > 0;
    this.otherHasTasks = this.other.length > 0;
};

DUET.Agenda.prototype.prepViewProperties = function () {
    var self = this;


};
DUET.Agenda.prototype.moveTaskToNewCategory = function (task, dueDateCategory) {
    var self = this,
        originalDueDateCategory = task.dueDateCategory;

    function getNewDueDate(dueDateCategory) {
        if (dueDateCategory == 'today')
            return self.endOfToday;
        else if (dueDateCategory == 'upcoming')
            return self.tomorrowEndOfDay;
        else return self.fourDaysEndOfDay;
    }

    this.recordPreviousDate(task);

    task.dueDateCategory = dueDateCategory;
    task.dueDate = getNewDueDate(dueDateCategory);

    this.updateCategoryArrays(task, originalDueDateCategory, dueDateCategory);
    var saving = task.setDueDate();

    return {
        saving: saving,
        task: task
    };
};

DUET.Agenda.prototype.updateCategoryArrays = function (task, fromCategory, toCategory) {
    var index = this[fromCategory].indexOf(task);
    this[fromCategory].splice(index, 1);

    this[toCategory].push(task);
};

DUET.Agenda.prototype.recordPreviousDate = function (task) {
    task.previousCategory = task.dueDateCategory;
    task.previousDate = task.dueDate;
    task.previousFormattedDate = task.formattedDate;
};

DUET.Agenda.prototype.setTaskDueDate = function (task, dueDateMoment) {
    var days, category;

    this.recordPreviousDate(task);

    //get the difference in days between the due date and today
    days = Math.ceil(moment.duration(dueDateMoment.endOf('day').diff(moment().endOf('day'))).asDays());

    if (days <= 0)
        category = 'today';
    else if (days <= 3)
        category = 'upcoming';
    else category = 'other';

    task.dueDate = dueDateMoment.endOf('day').unix();
    task.dueDateCategory = category;

    this.updateCategoryArrays(task, task.previousCategory, category);

    return task.setDueDate();
}


//DUET.List
DUET.List = function (projectId, type) {
    this.type = 'list';

    this.changes = [];

    this.projectId = projectId;

    type = type || 'projects';

    this.loadUrl = type + '/' + projectId + '/tasks';
};

DUET.List.prototype = new DUET.Model();

DUET.List.prototype.postLoadProcessing = function () {
    //right now this.tasks is an array, we need it to be a collection
    this.loadTasksCollection(this.tasks);

    //save a reference to the original collection for when we need to clear filters
    this.allTasks = this.tasks;
};

DUET.List.prototype.search = function (term) {
    var matches = this.allTasks.search(term);
    this.loadTasksCollection(matches);
};

DUET.List.prototype.filter = function (filters) {
    var filtered = this.allTasks.filter(filters);
    this.loadTasksCollection(filtered);
};

DUET.List.prototype.loadTasksCollection = function (tasks) {
    var collection = new DUET.Collection({model: 'task'});
    collection.load(tasks);

    this.tasks = collection;
};

DUET.List.prototype.orderSection = function (sectionId, organized) {
    var sections = organized || this.organized;

    //the tasks are in order in the array, but the position values need to be updated to match the order, since tasks
    //will still have their old position values
    $.each(sections[sectionId].tasks, function (i, idAndOrder) {
        idAndOrder.position = i + 1;
    });
};

DUET.List.prototype.moveToComplete = function (id) {
    var task = this.getTask(id);

    this.removeTaskFromSections(id);

    this.complete[id] = task;


    this.incompleteCount--;
    this.completeCount++;
};

DUET.List.prototype.moveOutOfComplete = function (id) {
    var self = this,
        task = this.getTask(id);

    delete this.complete[id];

    this.organized[task.sectionId].tasks.push(task);

    task.position = this.organized[task.sectionId].tasks.length;

    task.save();

    this.completeCount--;
    this.incompleteCount++;

};

DUET.List.prototype.organize = function (models) {
    var self = this;

    this.organized = {};
    var modelsToOrganize = models || self.tasks.models;

    self.tasksById = {};
    self.complete = {};

    this.sections.sort(function (a, b) {
        return a.position - b.position;
    });

    $.each(this.sections, function (i, section) {
        self.addSection(section, true);
    });

    //some tasks might not be in a section, so we create a dummy section for those tasks
    this.addUncategorizedSection();

    this.orderedKeys = [];
    this.completeCount = 0;
    this.incompleteCount = 0;

    $.each(modelsToOrganize, function (i, task) {
        //organized[task.sectionId].tasks[task.id] = task;
        if (task.isComplete == false) {
            self.incompleteCount++;
            self.organized[task.sectionId].tasks.push(task);
        }
        else {
            self.completeCount++;
            self.complete[task.id] = task;
        }

        self.tasksById[task.id] = task;
    });

    $.each(this.organized, function (i, section) {
        self.orderSection(i, self.organized);
    });


    this.orderedAndOrganized = [];

    //if there are no uncategorized tasks, we can get rid of the dummy section we created
    //so it doesn't show up in the view
    if ($.isEmptyObject(this.organized[0].tasks))
        delete this.organized[0];

    if (this.organized[0]) {
        self.orderedAndOrganized.push(self.organized[0]);
    }

    $.each(this.sections, function (i, section) {
        self.orderedAndOrganized.push(self.organized[section.id]);
    });
};

DUET.List.prototype.removeTaskFromSections = function (id) {
    var self = this,
        task = this.tasksById[id],
        section = this.organized[task.sectionId],
        taskIndex;

    $.each(section.tasks, function (i, aTask) {
        if (aTask.id == id) {
            self.organized[task.sectionId].tasks.splice(i, 1);
            taskIndex = i;
            return false;
        }
    });

    //possibly not necessary, since organized and orderedAndOrganzied point to the same objects
    $.each(this.orderedAndOrganized, function (i, section) {
        if (task.sectionId == section.id) {
            self.orderedAndOrganized[i].splice(taskIndex, 1);
            return false;
        }
    });
};
DUET.List.prototype.deleteItem = function (id) {
    var task = this.tasksById[id];

    this.removeTaskFromSections(id);

    delete this.tasksById[id];

    return task.delete();
};


DUET.List.prototype.sectionIndex = function (sectionId) {
    var index = false;

    $.each(this.orderedAndOrganized, function (i, section) {
        if (section.section.id == sectionId) {
            index = i;
            return false;
        }
    });

    return index;
}
DUET.List.prototype.deleteSection = function (sectionId) {

    var self = this,
        section = this.organized[sectionId],
        previousSectionIndex = self.sectionIndex(sectionId) - 1,
        previousSection = this.orderedAndOrganized[previousSectionIndex],
        previousSectionId;

    if (!previousSection) {
        this.addUncategorizedSection();
        previousSectionId = 0;
        previousSection = this.organized[0];
    }


    previousSectionId = previousSection.section.id;

    if (section.tasks.length) {
        self.organized[previousSectionId].tasks = self.organized[previousSectionId].tasks.concat(section.tasks);

    }


    delete self.organized[sectionId];

    self.orderSection(previousSectionId);

    this.addChange('section', {
        action: 'delete',
        id: sectionId,
        data: {newSectionId: previousSectionId}
    });

    this.submitChanges();


};

DUET.List.prototype.addUncategorizedSection = function () {
    if (!this.organized[0]) {
        this.organized[0] = {
            section: {id: 0, name: 'Uncategorized'}, //todo:lang
            tasks: []
        };
    }

    return this.organized[0];
};

DUET.List.prototype.hasUncategorized = function () {
    return this.organized[0] && this.organized[0].tasks.length ? true : false;
};

DUET.List.prototype.removeEmptyUncategorizedSection = function () {
    if (this.organized[0] && !this.organized[0].tasks.length)
        delete this.organized[0];
}

DUET.List.prototype.getSection = function (sectionId, justSection) {
    if (!justSection)
        return this.organized[sectionId];
    else return this.organized[sectionId].section;
};

//DUET.List.prototype.deleteSection = function(sectionId){
//    this.addChange('section', {
//        action: 'delete',
//        id: sectionId,
//        data: null
//    });
//
//    return this.submitChanges();
//};

DUET.List.prototype.setSectionAction = function (sectionId, action, value) {
    this.organized[sectionId].section[action] = value;

    this.addChange('section', {
        action: 'set_action',
        id: sectionId,
        data: {action: action, value: value}
    });

    return this.submitChanges();
};

DUET.List.prototype.doesSectionHaveAction = function (sectionId, action) {
    var value = this.organized[sectionId].section[action];

    return value == true || value == 1;
};

DUET.List.prototype.addItem = function (taskText, sectionId, callback) {
    var position = this.sectionTasks(sectionId).length + 1;

    return this.doAddItem(taskText, sectionId, position, callback);
};

DUET.List.prototype.addItemAtPosition = function (taskText, sectionId, position, callback, doSave) {
    var self = this,
        taskProps = this.doAddItem(taskText, sectionId, position, callback, doSave);


    this.addChange('section', {
        action: 'update_order',
        id: sectionId,
        data: {order: self.getSectionOrder(sectionId)}
    });

    this.submitChanges();

    ;
    return taskProps;
};

DUET.List.prototype.addTask = function (task, sectionId) {
    task.position = this.sectionTasks(sectionId).length + 1;
    this.organized[sectionId].tasks.splice(task.position - 1, 0, task);
    this.orderSection(sectionId);
    this.tasksById[task.id] = task;
};

DUET.List.prototype.doAddItem = function (taskText, sectionId, position, callback, doSave) {
    var self = this;

    //create the new task
    var task = DUET.make('Task');
    task.task = taskText;
    task.sectionId = sectionId;
    task.position = position;
    task.projectId = this.projectId;

    this.organized[sectionId].tasks.splice(task.position - 1, 0, task);
    this.orderSection(sectionId);

    if (doSave !== false) {
        task.on('saved', function () {
            self.tasksById[task.id] = task;

            if (callback)
                callback(task);
        });

        var deferred = task.save();
    }


    return {task: task, deferred: deferred};
};

DUET.List.prototype.updateSection = function (sectionId, sectionData) {

    this.addChange('section', {
        action: 'update',
        id: sectionId,
        data: sectionData
    });

    return this.submitChanges();
};

DUET.List.prototype.moveItemToNewSection = function (id, newSectionId, originalSectionId, position, isBatch) {
    var self = this;

    //if there is no position specified, this element will go on the end
    if (!position && position !== 0) {
        position = self.organized[newSectionId].tasks.length + 1;
    }


    function removeFromSection(sectionId, taskIdToRemove) {
        var indexOfRemovedTaskInArray,
            section = self.organized[sectionId];

        $.each(section.tasks, function (i, taskId) {

            if (taskId.id == taskIdToRemove) {
                indexOfRemovedTaskInArray = i;
                return false;
            }
        });

        if (typeof indexOfRemovedTaskInArray != 'undefined')
            section.tasks.splice(indexOfRemovedTaskInArray, 1);
    }

    function addToSection(sectionId, taskIdToAdd, position) {
        var task = self.tasksById[taskIdToAdd];

        task.sectionId = sectionId;

        task.position = position;

        self.organized[sectionId].tasks.splice(position - 1, 0, task);
    }


    addToSection(newSectionId, id, position);
    removeFromSection(originalSectionId, id);
    self.orderSection(newSectionId);
    self.orderSection(originalSectionId);

    this.addChange('section', {
        action: 'add_item',
        id: newSectionId,
        data: {id: id}
    });

    if (!isBatch) {
        this.completeMove(originalSectionId, newSectionId);
    }

    if (this.doesSectionHaveAction(newSectionId, 'action_mark_tasks_complete')) {
        var task = this.tasksById[id];
        task.toggleComplete();
    }
};

DUET.List.prototype.createSectionFromTask = function (sectionId, sectionPosition, taskIds) {
    var self = this;

    if (this.hasUncategorized()) {
        sectionPosition = sectionPosition - 1;
    }

    this.addChange('section', {
        action: 'task_to_section',
        id: sectionId,
        data: {position: sectionPosition, tasks: taskIds}
    });

    var task = this.tasksById[sectionId];

    var submittingChanges = this.submitChanges();

    this.finishSectionCreation(task.task, sectionPosition, taskIds, submittingChanges);

    return submittingChanges;
};

DUET.List.prototype.createSection = function (name, sectionPosition, taskIds) {
    if (this.hasUncategorized()) {
        sectionPosition = sectionPosition - 1;
    }

    this.addChange('section', {
        action: 'new_section',
        id: null,
        data: {name: name, position: sectionPosition, tasks: taskIds, listId: this.projectId}
    });

    var submittingChanges = this.submitChanges();

    this.finishSectionCreation(name, sectionPosition, taskIds, submittingChanges);

    return submittingChanges;
};

DUET.List.prototype.finishSectionCreation = function (name, sectionPosition, taskIds, submittingChanges) {
    var self = this;
    //todo: we should rely on the server for all of this? It would certainly be an easier development effort
    $.when(submittingChanges).done(function (response) {
        var responseData = DUET.parseJSON(response),
            id = responseData.data;

        self.addSection({
            name: name,
            id: id,
            position: sectionPosition
        });

        //todo:need to remove references to these tasks from their old section
        $.each(taskIds, function (i, taskId) {
            self.organized[id].tasks.push(self.tasksById[taskId]);
        });
    });
};

DUET.List.prototype.convertSectionToTask = function (sectionId, parentSectionId, positionInParent) {
    this.addChange('section', {
        action: 'section_to_task',
        id: sectionId,
        data: {sectionId: parentSectionId, position: positionInParent}
    });

    return this.submitChanges();
};

DUET.List.prototype.completeMove = function (fromSection, toSection) {
    this.addChange('section', {
        action: 'update_order',
        id: fromSection,
        data: {order: this.getSectionOrder(fromSection)}
    });

    this.addChange('section', {
        action: 'update_order',
        id: toSection,
        data: {order: this.getSectionOrder(toSection)}
    });

    this.submitChanges();
};

DUET.List.prototype.moveItemWithinSection = function (id, sectionId, position) {
    var self = this,
        section = this.organized[sectionId];
    var currentPosition = this.tasksById[id].position;

    this.organized[sectionId].tasks.splice(position - 1, 0, this.organized[sectionId].tasks.splice(currentPosition - 1, 1)[0]);

    this.orderSection(sectionId);

    this.addChange('section', {
        action: 'update_order',
        id: sectionId,
        data: {order: self.getSectionOrder(sectionId)}
    });

    this.submitChanges();
};

DUET.List.prototype.moveItem = function (id, newSectionId, originalSectionId, position) {

    if (newSectionId != originalSectionId) {
        this.moveItemToNewSection(id, newSectionId, originalSectionId, position);
    }
    else this.moveItemWithinSection(id, newSectionId, position);

};

DUET.List.prototype.moveSection = function (sectionId, position) {
    var self = this,
        currentSectionPosition = parseInt(this.organized[sectionId].section.position, 10),
        order = [];


    this.orderedAndOrganized.splice(position - 1, 0, this.orderedAndOrganized.splice(currentSectionPosition - 1, 1)[0]);

    $.each(this.orderedAndOrganized, function (i, section) {
        self.orderedAndOrganized[i].section.position = i + 1;
        order.push({id: self.orderedAndOrganized[i].section.id, position: i + 1});
    });

    this.addChange('section', {
        action: 'order_sections',
        id: null,
        data: {order: order}
    });

    this.submitChanges();

};


DUET.List.prototype.sectionTasks = function (sectionId) {
    return this.organized[sectionId].tasks;
};

DUET.List.prototype.getSectionOrder = function (sectionId) {
    var order = [];
    $.each(this.organized[sectionId].tasks, function (i, task) {
        order.push({id: task.id, position: task.position});
    });

    return order;
};

DUET.List.prototype.submitChanges = function () {
    var self = this;


    var request = new DUET.Request({
        url: 'tasklist/change',
        data: {changes: self.changes},
        success: function () {
            self.changes = [];
        }
    });

    return request.isComplete;
};

DUET.List.prototype.setSectionName = function (sectionId, name) {

    this.getSection(sectionId).section.name = name;

    this.addChange('section', {
        action: 'set_name',
        id: sectionId,
        data: {name: name}
    });

    this.submitChanges();


};

DUET.List.prototype.addChange = function (entity, change) {
    this.changes.push({
        entity: entity,
        change: change
    });
};

DUET.List.prototype.addSection = function (section, isInitial) {


    section.type = 'named-section';

    this.organized[section.id] = {
        section: section,
        tasks: []
    };

    if (!isInitial) {
        this.sections.push(section)
    }

    return this.organized[section.id];
};

DUET.List.prototype.getTask = function (id) {
    return this.tasksById[id];
};


DUET.List.prototype.filterAndOrganize = function (filterParams) {
    var models = this.filter(filterParams);
    this.organize(models);
};

DUET.List.prototype.searchAndOrganize = function (searchParams) {

    var models = this.search(searchParams);
    this.organize(models);

};

DUET.List.prototype.decodeParams = function () {
    var self = this;

    $.each(self.orderedAndOrganized, function (i, section) {

        self.orderedAndOrganized[i].section.name = ut.decode(section.section.name, 'ENT_QUOTES');

        $.each(self.orderedAndOrganized[i].tasks, function (j, task) {
            self.orderedAndOrganized[i].tasks[j].task = ut.decode(task.task, 'ENT_QUOTES');
        });
    });
};


DUET.TaskSection = function () {
    this.type = 'task-section';
};

DUET.TaskSection.prototype = new DUET.Model();


//Task Model
DUET.Task = function () {
    this.type = 'task';

    this.rules = {
        task: 'required'
        //rules for maximum weight and minimum weight will be set in the getMaximum wieght function after we get the
        //maximum weight from the server
    };

    this.isComplete = false;

    this.weight = parseInt(this.weight, 10);
};

DUET.Task.prototype = new DUET.Model();

DUET.Task.prototype.getFiles = function () {
    var self = this,
        gettingTasks;

    gettingTasks = new DUET.Request({
        url: 'tasks/' + self.id + '/get_files',
        success: function (response) {
            self.files = response.data;
        }
    });

    return gettingTasks.isComplete;
};

DUET.Task.prototype.getTimeEntries = function () {
    var self = this,
        gettingTimeEntries;

    gettingTimeEntries = new DUET.Request({
        url: 'tasks/' + self.id + '/get_time_entries',
        success: function (response) {
            var timeEntriesCollection = new DUET.Collection({model: 'TimeEntry'});
            timeEntriesCollection.load(response.data);
            timeEntriesCollection.sort('startDate', 'desc');

            //we need to keep track of the collection for adding/deleting time entries
            self.timeEntriesCollection = timeEntriesCollection;

            //we need an array for the initial render (Hogan)
            self.timeEntries = timeEntriesCollection.toArray();
        }
    });

    return gettingTimeEntries.isComplete;
};

DUET.Task.prototype.setDueDate = function () {
    var self = this;

    var request = new DUET.Request({
        url: 'task/set_due_date',
        data: {
            id: self.id,
            dueDate: self.dueDate
        },
        success: function (response) {
            self.statusText = response.data.status_text;
            self.prepViewProperties();
        }
    });

    return request.isComplete;
}

//todo: I have issues with this entire function, perhaps its just the name, but the model shouldn't be prepping anything for the view
DUET.Task.prototype.prepViewProperties = function () {
    var self = this;
    //isComplete will be a string, turn it into a boolean


    if (typeof self.isComplete !== 'boolean')
        self.isComplete = (typeof self.isComplete != 'undefined') && self.isComplete.length && self.isComplete != '0';

    self.isSection = (typeof self.isSection != 'undefined') && (self.isSection != '0') && (self.isSection != '');

    self.completeClass = self.isComplete ? 'complete' : '';

    self.dueDateHumanized = self.humanizedEndOfDay(self.dueDate);

    self.hasDueDate = self.dueDate ? true : false;

    self.hasStatus = self.statusText && self.statusText.length;

    self.dueDateText = self.formatDate(self.dueDate, 'MMM DD, YYYY');

    self.formattedDisplayDate = self.formatDate(self.dueDate, 'MMM Do');
    self.formattedDate = self.dueDateText;

    self.hasTaskWeight = false;

    self.hasNotes = (typeof self.notes !== 'undefined') && self.notes && (self.notes.length > 0);

    self.hasFiles = (typeof self.file !== 'undefined') && self.file && (self.file.length > 0);

    self.hasMeta = self.hasNotes == true || self.hasDueDate == true || self.hasFiles == true;

    self.completedDateText = self.formatDate(self.completedDate, 'MMM DD, YYYY');

    self.assignedTo = typeof self.assignedTo !== 'undefined' ? self.assignedTo : self.assigned_to;

    self.userLink = '#users/' + self.assignedTo;

    if (self.userImage && !self.imageLinkSet === true) {
        self.imageLinkSet = true;
        self.userImage = '<img src="' + self.userImage + '"/>';
    }

    if (self.statusText)
        self.statusClass = self.statusText.toLowerCase().replace(' ', '-');

    if (parseInt(self.totalTime, 10) != 0)
        self.formattedTotalTime = DUET.Timer.prototype.secondsToFormattedTime(self.totalTime);

    if (self.weight == 0)
        self.weightText = '-';
    else self.weightText = self.weight + '%';

    self.isAssignedToMe = self.assignedTo == DUET.my.id;

};

DUET.Task.prototype.toggleComplete = function () {
    var isComplete;

    //complete status is currently a string, we need a boolean. String -> Int -> Boolean
    if (typeof this.isComplete != 'boolean') {
        isComplete = parseInt(this.isComplete, 10);
        isComplete = Boolean(isComplete);
    }
    else isComplete = this.isComplete;

    this.isComplete = !isComplete;

    this.prepViewProperties();

    return this.save();
};

DUET.Task.prototype.getMaximumWeight = function () {
    var self = this,
    //can't use the deferred created by the request because it resolves before the success function runs
        isComplete = new $.Deferred();

    //make sure the current weight is set
    self.weight = self.weight || 0;

    new DUET.Request({
        url: 'projects/' + self.projectId + '/get_available_task_weight',
        success: function (response) {
            //the maximum weight for a task is the available weight (1 - 99) + this task
            if (response.isValid()) {
                self.maximumWeight = parseInt(response.data, 10) + parseInt(self.weight, 10);
            }

            //set the validation rules for the maximum value
            self.rules.weight = 'max[' + self.maximumWeight + ']';

            isComplete.resolve();
        }
    });

    return isComplete;
};

DUET.Task.prototype.url = function () {

    return 'projects/' + this.projectId + '/tasks/' + this.id;
};

DUET.Task.prototype.assign = function (data, callback) {
    var self = this;


    var request = new DUET.Request({
        url: 'tasks/assign',
        data: $.extend({task_id: self.id}, data),
        success: function (response) {
            self.assignedTo = data.assignedTo;
            response.userImage = response.data.userImage;
        }
    });

    return request.isComplete;
};

DUET.Task.prototype.assignUser = function () {
    DUET.Project.prototype.addPerson = function (personId) {
        var self = this, addingPerson;

        addingPerson = new DUET.Request({
            url: 'projects/add_person',
            data: {
                projectId: self.id,
                userId: personId
            }
        });

        return addingPerson;
    };
};


DUET.TasksManager = function () {
    this.type = 'tasks-manager';
};

DUET.TasksManager.prototype = new DUET.Model();

DUET.Timer = function (task, callback) {
    var self = this, timer;

    //https://gist.github.com/1185904
    function Interval(duration, callback) {
        this.baseline;

        this.run = function () {
            var end, nextTick;

            if (typeof this.baseline == 'undefined') {
                this.baseline = new Date().getTime();
            }
            callback(this);
            DUET.evtMgr.publish('timeChanged');
            end = new Date().getTime();
            this.baseline += duration;

            nextTick = duration - (end - this.baseline);
            if (nextTick < 0) {
                nextTick = 0;
            }
            (function (i) {
                i.timer = setTimeout(function () {
                    i.run(end);
                }, nextTick);
            }(this));
        };

        this.stop = function () {
            clearTimeout(this.timer);
        }
    }

    this.time = this.secondsToTime(0);
    this.elapsed = 0;

    this.start = function () {
        var self = this;

        this.timeEntry = new DUET.TimeEntry();

        this.timeEntry.taskId = task.id;

        timer = new Interval(1000, function () {
            //get time in hh:mm:ss
            self.time = self.secondsToTime(self.elapsed);
            self.elapsed += 1;

            //if the save interval has been met, save the task
            if (self.elapsed % DUET.config.task_timer_save_interval == 0)
                self.timeEntry.save({time: self.elapsed});

            //run the callback
            if (callback && $.isFunction(callback))
                callback();
        });

        timer.run()
    };

    this.stop = function () {
        var self = this;

        timer.stop();
        this.timeEntry.save({time: self.elapsed});
    };

    this.setCallback = function (newCallback) {
        callback = newCallback;
    };
};

DUET.Timer.prototype.secondsToTime = function (secs) {
    //http://codeaid.net/javascript/convert-seconds-to-hours-minutes-and-seconds-(javascript)
    var hours = Math.floor(secs / (60 * 60));

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    var obj = {
        "h": hours,
        "m": minutes,
        "s": seconds
    };
    return obj;
};

DUET.Timer.prototype.generateTimeText = function (timeObject) {
    var h,
        time = timeObject || this.time;

    function pad(n) {
        return n > 9 ? "" + n : "0" + n;
    }

    //we don't always want to show hours, but we always want to show mins and secs
    h = time.h == 0 ? '' : time.h + ':';

    return h + pad(time.m) + ':' + pad(time.s);
};

DUET.Timer.prototype.generateHumanizedTimeText = function (timeObject, includeSeconds) {
    var hoursText, minutesText, secondsText, textArray = [], timeText = '';


    if (timeObject.h !== 0) {
        hoursText = timeObject.h > 1 ? ' hrs' : ' hr';
        textArray.push(timeObject.h + hoursText);
    }

    if (timeObject.m !== 0) {
        minutesText = timeObject.m > 1 ? ' mins' : ' min';
        textArray.push(timeObject.m + minutesText);
    }

    if (timeObject.s !== 0 && includeSeconds !== false) {
        secondsText = timeObject.s > 1 ? ' secs' : ' sec';
        textArray.push(timeObject.s + secondsText);
    }

    return (textArray.length) ? textArray.join(', ') : '-';
};

DUET.Timer.prototype.secondsToFormattedTime = function (secs, includeSeconds) {
    var timeObject = DUET.Timer.prototype.secondsToTime(secs);

    return DUET.Timer.prototype.generateHumanizedTimeText(timeObject, includeSeconds);
};

DUET.TimeEntry = function () {
    this.type = 'timeEntry';

    this.startDate = moment().unix();

    this.userName = DUET.my.first_name + ' ' + DUET.my.last_name;

    //the time in total seconds
    this.time = 0;

    //the time in hours, minutes, and seconds. Only set if this is a manual time entry
    this.hours = 0;
    this.minutes = 0;
    this.seconds = 0;
};

DUET.TimeEntry.prototype = new DUET.Model();

DUET.TimeEntry.prototype.prepViewProperties = function () {
    this.startDateText = this.formatDate(this.startDate, 'M/D/YY h:mm a');
    this.timeText = DUET.Timer.prototype.secondsToFormattedTime(this.time);
};

DUET.TimeEntry.prototype.timeComponentsToSecs = function () {
    var secs = 0;

    secs = parseInt(this.hours, 10) * 3600;
    secs += parseInt(this.minutes, 10) * 60;
    secs += parseInt(this.seconds);

    this.time = secs;

    return secs;
};


DUET.File = function () {
    this.type = 'file';
};

DUET.File.prototype = new DUET.Model();

DUET.File.prototype.prepViewProperties = function () {
    this.downloadUrl = 'files/download/' + this.id;
    this.formattedUploadDate = this.formattedDueDate = this.formatDate(this.created, 'MMM D, YYYY');
    this.sizeKilobytes = Math.round(this.size / 1024);
    this.extension = /(?:\.([^.]+))?$/.exec(this.name)[1];
    //From: Tomalak's answer, http://stackoverflow.com/questions/680929/how-to-extract-extension-from-filename-string-in-javascript
};

DUET.File.prototype.getFileUrl = function () {
    var self = this;

    var request = new DUET.Request({
        url: self.downloadUrl,
        success: function (response) {
            if (response.isValid())
                self.url = response.data;
            else self.url = false;
        }
    });

    return request.isComplete;
};


DUET.Project = function () {
    this.type = 'project';

    //consider removing and just using this.type like we're supposed to. This is added solely so we don't have to
    //change the model name on the backend from Project to Board, as we're trying to minimize differences with the Duet codebase
    this.subType = 'board';
    this.name = '';

    this.client_id = null;

    //this.dueDate = 0;
};

DUET.Project.prototype = new DUET.Model();

DUET.Project.prototype.entityUrl = function (entity) {
    //returns url in the format projects/1/tasks
    return 'projects/' + this.id + '/' + entity + 's';
};

DUET.Project.prototype.calculateProgress = function (tasks) {
    //pulled directly from the server side logic. We don't want to have to wait for the server to update the progress
    //so lets calculate it on the client side as well.
    var unweighted_incomplete_tasks = [],
        weighted_incomplete_tasks = [],

        unweighted_completed_tasks = [],
        weighted_completed_tasks = [],

        total_percentage_for_unweighted_tasks = 100,
        total_percentage_for_weighted_tasks = 0,

        total_unweighted_tasks = 0,
        unweighted_task_implied_weight,
        progress_from_unweighted,
        progress_from_weighted,
        progress = 0;

    //sort the tasks into groups
    $.each(tasks.tasksById, function (i, task) {

        if (task.isSection == false) {
            if (task.isComplete) {
                if (task.weight > 0)
                    weighted_completed_tasks.push(task);
                else unweighted_completed_tasks.push(task);
            }
            else {
                if (task.weight > 0)
                    weighted_incomplete_tasks.push(task);
                else unweighted_incomplete_tasks.push(task);
            }
        }
    });

    //figure out how much of the total project progress should be allocated to unweighted tasks
    $.each(weighted_completed_tasks, function (i, task) {
        total_percentage_for_unweighted_tasks -= task.weight;
    });

    $.each(weighted_incomplete_tasks, function (i, task) {
        total_percentage_for_unweighted_tasks -= task.weight;
    });

    //each unweighted task will have an 'implied' weight that is calculated. Determine that value here
    total_unweighted_tasks = unweighted_completed_tasks.length + unweighted_incomplete_tasks.length;
    unweighted_task_implied_weight = total_percentage_for_unweighted_tasks / total_unweighted_tasks;

    //calculate progress
    progress_from_unweighted = 0;
    progress_from_weighted = 0;

    //determine how much of the project is completed by unweighted tasks
    progress_from_unweighted = unweighted_task_implied_weight * unweighted_completed_tasks.length;

    //determine how much of th project is completed by weighted tasks
    $.each(weighted_completed_tasks, function (i, task) {
        progress_from_weighted += task.weight;
    });

    progress = progress_from_unweighted + progress_from_weighted;

    //we want a whole number for progress
    progress = Math.round(progress);

    //this.progress = progress;
    this.set('progress', progress);

    return progress;
};

DUET.Project.prototype.prepViewProperties = function () {
    var progressDifference = this.progress - this.expectedProgress,
    //negative numbers will already have the minus sign, but we need to add the plus sign for positive numbers
        progressDirection = progressDifference < 0 ? '' : '+';

    this.formattedDueDate = this.formatDate(this.dueDate, 'MMM D');

    if (this.statusText) {
        this.formattedStatusText = this.formatStatusText(this.statusText);
    }


    this.isArchived = this.isArchived != "0";

    this.progressDifference = progressDirection + progressDifference.toString();
};

DUET.Project.prototype.formatStatusText = function (statusText) {
    var formattedStatusText;

    if (statusText) {
        //todo:simplify
        formattedStatusText = statusText.replace('-', '_');
        formattedStatusText = DUET.utils.camelCase(formattedStatusText);
        formattedStatusText = ut.lang('projectDetails.' + formattedStatusText);
    }
    else formattedStatusText = '';


    return formattedStatusText;
};

DUET.Project.prototype.archive = function () {
    this.isArchived = true;
    return this.save();
};

DUET.Project.prototype.unarchive = function () {
    this.isArchived = false;
    return this.save();
};

DUET.Project.prototype.addPerson = function (personId) {
    var self = this, addingPerson;

    addingPerson = new DUET.Request({
        url: 'projects/add_person',
        data: {
            projectId: self.id,
            userId: personId
        }
    });

    return addingPerson;
};


DUET.Project.prototype.removePerson = function (personId) {
    var self = this, addingPerson;

    addingPerson = new DUET.Request({
        url: 'projects/remove_person',
        data: {
            projectId: self.id,
            userId: personId
        }
    });

    return addingPerson;
};


DUET.Template = function () {
    this.type = 'template';
};

DUET.Template.prototype = DUET.Project.prototype;

DUET.Template.prototype.createProject = function () {
    var project = new DUET.ProjectFromTemplate();
    project.load(this.modelParams());

    return project;
};

//A dummy model that will allow us to call templates/create_project when the new project (from template) form is submitted
//Without this model, the save request would be sent to temlates/save, which is not what we want.
//
//It may seem like it would be a good idea to populate the form with a project model so that we can call
//projects/save on the server side to create the project, but this is problematic because some values are unique to the
//template, we don't want them saved on the new project. We need to call templates/create_project to process the
//values before the new project is created....
DUET.ProjectFromTemplate = function () {
    this.type = 'project-from-template';

    this.saveUrl = 'template/create_project';
};

DUET.ProjectFromTemplate.prototype = new DUET.Model();


DUET.User = function () {
    this.type = 'user';

    this.rules = {
        first_name: 'required',
        last_name: 'required',
        email: 'required|email'
    };
};

DUET.User.prototype = new DUET.Model();

DUET.User.prototype.prepViewProperties = function () {

    if (this.role == 'admin')
        this.isAdmin = true;

    if (this.role == 'client')
        this.isClient = true;

    if (!this.name)
        this.name = this.firstName + ' ' + this.lastName;
};

DUET.Admin = function () {
    this.type = 'admin';

    this.saveUrl = 'users/new_admin';
};

DUET.Admin.prototype = new DUET.Model();


DUET.Calendar = function () {
    this.type = 'calendar';
};

DUET.Calendar.prototype = new DUET.Model();

DUET.Calendar.prototype.postLoadProcessing = function () {

    var self = this,
        taskCollection = new DUET.Collection({model: 'task'});

    this.taskCollection = taskCollection;

    this.tasksByDate = {};
    taskCollection.on('loaded', function () {
        $.each(taskCollection.models, function (i, task) {
            task.title = task.task;

            //if there is a date, we need to pass in the iso format. If there is no date, pass in a date far into the
            //future so it doesn't show up on the calendar
            if (task.dueDate && task.dueDate.length)
                task.start = self.formatDate(task.dueDate, 'YYYY-MM-DD');
            else task.start = '2099-01-22';

            if (!self.tasksByDate[task.start])
                self.tasksByDate[task.start] = []

            self.tasksByDate[task.start].push(task);
        });
    });

    taskCollection.load(this.tasks.tasks);
};

DUET.StripePayment = function () {
    this.type = "payment";

    this.rules = {
        first_name: 'required',
        last_name: 'required',
        'card_number': 'required',
        'card_cvc': 'required',
        'card_expiry_month': 'required',
        'card_expiry_year': 'required'
    };

    this.cardNumber = false;
    this.cardCvc = false;
    this.cardExpiryMonth = false;
    this.cardExpiryYear = false;
    this.stripeToken = false;
};


DUET.ActivityItem = function () {
    this.type = 'activity-item';

    this.iconMap = {
        task: 'check-box',
        invoice: 'star',
        estimate: 'crown',
        message: 'comment',
        payment: 'money',
        file: 'cloud',
        project: 'briefcase'

    }
};

DUET.ActivityItem.prototype = new DUET.Model();

DUET.ActivityItem.prototype.prepViewProperties = function () {
    this.formattedDate = this.humanizedDate(this.activityDate);

    this.formattedTime = this.formattedTime(this.activityDate);


    this.dateText = this.formatDate(this.activityDate, 'ddd MMM D h:mm a');

    //should the activity text us 'a' or 'an'
    this.article = this.getArticle(this.objectType);

    //need to get the translated object type (i.e. project in spanish if this has been translated to spanish)
    this.objectTypeText = ut.lang('entityNames.' + this.objectType);

    this.hasLinkedObject = typeof this.linkedObjectType != 'undefined' && this.linkedObjectType != '';

    //need to get the translated object type (i.e. project in spanish if this has been translated to spanish)
    if (this.hasLinkedObject)
        this.linkedObjectTypeText = ut.lang('entityNames.' + this.linkedObjectType);

    //should the activity text us 'a' or 'an'
    this.linkedArticle = this.getArticle(this.linkedObjectType);

    if (this.objectType != 'message')
        this.objectLink = this.generateLink(this.projectId, this.objectType, this.objectId);
    else {

        this.objectLink = this.generateLink(this.projectId, this.linkedObjectType, this.linkedObjectId);
    }

    this.linkedObjectLink = this.generateLink(this.projectId, this.linkedObjectType, this.linkedObjectId);

    if (this.userId != 0) {
        this.isUserGenerated = true;
    }


    this.iconName = this.iconMap[this.objectType];
};

DUET.ActivityItem.prototype.generateLink = function (projectId, objectType, objectId) {
    if (objectType == 'project')
        return '#' + objectType + 's/' + objectId;
    else return '#projects/' + projectId + '/' + objectType + 's/' + objectId;
};

DUET.ActivityItem.prototype.generateMessageLink = function (projectId, objectType, objectId) {
    return '#projects/' + projectId + '/' + objectType + '/' + objectId;
};

DUET.ActivityItem.prototype.getArticle = function (objectType) {
    //determine whether to use 'a' or 'an'. This isn't 100% acurate because the rule is to an for a vowel sound, but we're
    //checking against actual vowels. (i.e. it's possible to get a vowel sound even if the first letter isn't a vowel
    //e.g. 'hour'
    return $.inArray(objectType[0], ['a', 'e', 'i', 'o', 'u']) == -1 ? ut.lang('articles.a') : ut.lang('articles.an');
};

DUET.ProjectNotes = function () {
    this.type = 'project-notes';


};

DUET.ProjectNotes.prototype = new DUET.Model();

DUET.ProjectNotes.prototype.prepViewProperties = function () {
    if (!this.notes)
        this.notes = '';
};

DUET.TemplateNotes = DUET.ProjectNotes;

DUET.Search = function () {
    this.type = 'search';

    this.loadUrl = 'search/get/';
};

DUET.Search.prototype = new DUET.Model();

DUET.Search.prototype.postLoadProcessing = function () {
    if (this.projects.length) {
        this.initSearchEntity('project');
    }

    if (this.tasks.length) {
        this.initSearchEntity('task');
    }

    if (this.files.length) {
        this.initSearchEntity('file');
    }
};

DUET.Search.prototype.initSearchEntity = function (entityType) {
    //this.hasMessages = true;
    this['has' + DUET.utils.ucFirst(entityType) + 's'] = true;

    //this.messagesCollection = new DUET.Collection({model:'message'});
    this[entityType + 'sCollection'] = new DUET.Collection({model: entityType});

    //this.messagesCollection.load(this.messages);
    this[entityType + 'sCollection'].load(this[entityType + 's']);

    //this.messages = this.messagesCollection.modelParams();
    this[entityType + 's'] = this[entityType + 'sCollection'].modelParams();
};

DUET.Search.prototype.getEntityUrl = function (entityType, id) {
    var url = '', projectId, message;

    if ($.inArray(entityType, ['task', 'file', 'invoice']) !== -1) {
        projectId = this[entityType + 'sCollection'].modelsById[id].projectId;
        url = 'projects/' + projectId + '/' + entityType + 's/' + id;
    }
    else if (entityType == 'message') {
        message = this.messagesCollection.modelsById[id];
        url = message.referenceObject + 's/' + message.referenceId;
    }
    else url = entityType + 's/' + id;

    return url;
};


DUET.ForgotPassword = function () {
    this.type = 'forgot-password';

    this.saveUrl = 'user/forgot_password';
};

DUET.ForgotPassword.prototype = new DUET.Model();

DUET.ChangePassword = function () {
    this.type = 'change-password';

    this.saveUrl = 'user/change_password';
};

DUET.ChangePassword.prototype = new DUET.Model();

DUET.FileUploadNotification = function () {
    this.type = 'file-upload-notification';

    this.saveUrl = 'file/upload_notification';
};

DUET.FileUploadNotification.prototype = new DUET.Model();


DUET.SendPassword = function () {
    this.type = 'send-password';

    this.saveUrl = 'users/send_password';
};

DUET.SendPassword.prototype = new DUET.Model();


DUET.Setting = function () {
    this.type = 'setting';


};

DUET.Setting.prototype = new DUET.Model();


DUET.ConfigSetting = function (data) {
    this.saveUrl = 'setting/save';

    this.isBoolean = data.type == 'boolean';
    this.isString = data.type == 'string';
    this.isNumber = data.type == 'number';
    this.name = data.name;
    this.type = data.type;
    this.description = data.description;
    this.value = data.value;
    this.hasInfo = data.info && data.info.length > 0;
    this.info = data.info;
};

DUET.ConfigSetting.prototype = new DUET.Model();


DUET.HelpContact = function () {
    this.type = 'help-contact';
};

DUET.HelpContact.prototype = new DUET.Model();

DUET.BoardsList = function () {
    this.type = 'project';
};

DUET.BoardsList.prototype = new DUET.Model();

DUET.BoardsList.prototype.load = function () {
    var self = this,
        boards = new DUET.Collection({model: 'project'});


    boards.on('loaded', function () {
        self.archivedBoards = [];
        self.currentBoards = [];

        $.each(boards.models, function (i, board) {
            if (board.isArchived) {
                self.archivedBoards.push(board);
            }
            else self.currentBoards.push(board);

        });

        if (self.currentBoards[2]) {
            self.noThird = false;
            self.currentBoards[2].third = true;
        }
        else self.noThird = true;

        self.archivedCount = self.archivedBoards.length;

        if(self.archivedCount > 0){
            self.hasArchived = true;
        }

        self.boards = boards;
        self.publish('loaded');
    });

    return boards.load();
};




