var DUET = DUET || {};


//Button Set
DUET.ButtonSetView = function (data) {
    this.template = 'button-set';

    this.initialize(data);
};

DUET.ButtonSetView.prototype = new DUET.View();

DUET.ButtonSetView.prototype.setAction = function (action) {
    var self = this;

    self.$element.on('click', 'li', function () {
        self.setSelected($(this).attr('id'));

        //run the action associated with this button set
        DUET.utils.run.apply(this, [action, this]); //todo:add to base view if this is used often. See usage on DUET.Module
    });
};

DUET.ButtonSetView.prototype.setSelected = function (id) {
    //mark the current button as selected
    this.$element.find('#' + id).addClass('selected').siblings().removeClass('selected');
};

//Info panel
DUET.InfoPanelView = function () {
    this.template = 'info-panel';

    this.domElements = {
        $close: '.close',
        $content: '.content',
        $buttonSpace: '.button-space',
        $overlay:'#info-panel-overlay'
    };

    this.buttonViews = [];

    this.activeView = false;

    this.initialize();
};

DUET.InfoPanelView.prototype = new DUET.View();

DUET.InfoPanelView.prototype.clearCurrentView = function () {
    if (this.activeView) {
        this.activeView.unload();
    }
};
DUET.InfoPanelView.prototype.show = function (view) {

    DUET.$window.addClass('info-showing');
    this.clearMenu();

    this.clearCurrentView();

    if (view) {
        view.addTo({$anchor: this.$content});
    }


    this.$element.nanoScroller();

    $(window).trigger('resize');

};

DUET.InfoPanelView.prototype.hide = function () {
    DUET.$window.removeClass('info-showing');

    $(window).trigger('resize');
};

DUET.InfoPanelView.prototype.bindEvents = function () {
    var self = this;

    this.$close.on('click', function () {
        self.hide();
    });

    this.$overlay.on('click', function(){
        self.hide();
    });
};

DUET.InfoPanelView.prototype.addToMenu = function ($content) {
    if ($content instanceof DUET.View) {
        $content.addTo({$anchor: this.$buttonSpace, position: 'append'});
        this.buttonViews.push($content);
    }
    else this.$buttonSpace.append($content);
};

DUET.InfoPanelView.prototype.clearMenu = function () {
    if (this.buttonViews.length) {
        $.each(this.buttonViews, function (i, view) {
            view.unload();
        });
    }

    this.buttonViews = [];
    this.$buttonSpace.find('.panel-actions').html('');
};


//Panel View
DUET.PanelView = function (options) {
    options = options || {};

    this.template = options.isPrimary ? 'panel' : 'panel-two';

    this.domElements = {
        $scrollable: '.nano',
        $notification: '.notification',
        $title: '.panel-title',
        $inner: '.inner',
        $innerMenu: '.inner-menu',
        $panelInfo: '.panel-info',
        $innerContentWrapper: '.inner-content-wrapper',
        $innerContent: '.inner-content',
        $discussProject: '#discuss-project-button',
        $panelActionsWrapper: '.panel-actions-wrapper',
        $titleWidgetSpace: '.panel-title-widget',
        $disableInteractionOverlay: '.disable-interaction-overlay'
    };

    this.scrollbar = false;

    this.isPrimary = options.isPrimary;

    this.buttonViews = [];

    this.initialize(options);

    //we need to save a reference to the current content, so we can trigger "remove" functionality when it is removed from the dom
    this.innerContent = {};

    this.notificationTimout = false;

    if (!options.isPrimary) {
        this.scrollbar = true;
        this.$element.find('.nano').nanoScroller();
    }
};

DUET.PanelView.prototype = new DUET.View();

DUET.PanelView.prototype.setContent = function (content) {

    this.setInnerContent(content, false);
};

DUET.PanelView.prototype.clearContent = function (view) {
    //clear the secondary inner menu
    this.clearSecondaryMenu();
    this.$innerMenu.css('display', 'none');


    this.$title.html('');

    this.$innerContent.empty();

    if (view)
        view.addTo({
            $anchor: this.$innerContent
        });
};

DUET.PanelView.prototype.setTitleWidget = function (view) {
    this.hasTitleWidget = true;
    view.addTo({$anchor: this.$titleWidgetSpace});
};


DUET.PanelView.prototype.hidePanelInfo = function () {
    if (this.panelInfoHidden !== true) {
        this.panelInfoHidden = true;
        this.$element.addClass('panel-info-hidden');
    }

};
DUET.PanelView.prototype.showPanelInfo = function () {
    if (this.panelInfoHidden === true) {
        this.panelInfoHidden = false;
        this.$element.removeClass('panel-info-hidden');
    }
};
DUET.PanelView.prototype.setInnerContent = function (content, showMenu) {
    var display = showMenu !== false ? 'block' : 'none';

    //clear the secondary inner menu
    this.clearSecondaryMenu();

    //show the inner menu
    this.$innerMenu.css('display', display);

    //set the content
    if (content instanceof DUET.View) {
        content.addTo({
            $anchor: this.$innerContent
        });

        this.$element.attr('data-template', content.template);

        if (content.hidePanelInfo && content.hidePanelInfo === true) {
            this.hidePanelInfo();
        }
        else this.showPanelInfo();
    }
    else {
        this.$innerContent.html(content);
        this.showPanelInfo();
    }

    //we need to call resize, otherwise the height might be wrong (if the inner menu was previously showing)
    this.resize();

    this.updateScrollbar();
};

DUET.PanelView.prototype.addContent = function (content) {
    if (content instanceof DUET.View) {
        content.addTo({
            $anchor: this.$innerContentWrapper.find('.inner-content'),
            position: 'append'
        });
    }
    else this.$innerContentWrapper.find('.inner-content').append(content);
};

DUET.PanelView.prototype.updateScrollbar = function () {
    this.$scrollable.nanoScroller({scroll: 'top'});
};

DUET.PanelView.prototype.addToMainMenu = function ($content, isLeftSide) {
    this.$innerMenu.find('.left-menu').first().append($content);
};

DUET.PanelView.prototype.clearMainMenu = function () {
    this.$innerMenu.find('.left-menu').first().empty();
};

DUET.PanelView.prototype.addToPrimaryMenu = function(view){
    var $anchor = this.$element.find('.panel-info-left-inner');

    if(view instanceof DUET.View){
       this.primaryMenuView = view;
        view.addTo({$anchor:$anchor});
    }
    else $anchor.html(view);

};

DUET.PanelView.prototype.clearPrimaryMenu = function(){
    if(this.primaryMenuView)
        this.primaryMenuView.unload();
    else this.$element.find('.panel-info-left-inner').empty();
};

DUET.PanelView.prototype.addToSecondaryMenu = function ($content) {
    var $anchor = this.$panelInfo.find('.panel-actions');

    if ($content instanceof DUET.View) {
        $content.addTo({$anchor: $anchor, position: 'append'});
        this.buttonViews.push($content);
    }
    else $anchor.append($content);

};

DUET.PanelView.prototype.clearSecondaryMenu = function () {
    //todo:this needs to unload the view


    if (this.buttonViews) {
        $.each(this.buttonViews, function (i, view) {
            view.unload();
        });


    }

    this.buttonViews = [];
    this.$panelInfo.find('.panel-actions').html('');
};

DUET.PanelView.prototype.resize = function () {
    var innerMenuHeight = this.$innerMenu.css('display') != 'none' ? this.$innerMenu.outerHeight(true) : 0;

    //todo:where is the 10 on the end from?

    var panelInfoHeight = 0;

    if (!this.panelInfoHidden)
        panelInfoHeight = this.$panelInfo.outerHeight(true);

    this.$scrollable.height(this.$element.outerHeight(true) - panelInfoHeight - innerMenuHeight);

    this.$scrollable.nanoScroller();
};

DUET.PanelView.prototype.setTitle = function (title) {
    this.$title.html(DUET.utils.html_entity_decode(title));
};

DUET.PanelView.prototype.notify = function (message, timeout) {
    var self = this,
        notificationTimeout;


    //if notification timeout is set to false, then this notifcation will persist
    if (timeout !== false) {
        notificationTimeout = timeout || 3000;
    }

    if (message) {
        this.$notification.text(message);
        this.$notification.show();

        clearTimeout(this.notificationTimeout);

        if (notificationTimeout) {
            this.notificationTimeout = setTimeout(function () {
                self.$notification.fadeOut();
            }, notificationTimeout);
        }
    }
};

DUET.PanelView.prototype.hideNotification = function () {
    this.$notification.css('display', 'none');
};

DUET.PanelView.prototype.bindEvents = function () {
    var self = this;

    this.$notification.on('click', '.close', function () {
        self.hideNotification();
    });


};


DUET.PanelView.prototype.disableInteraction = function () {
    this.$disableInteractionOverlay.addClass('showing');
};

DUET.PanelView.prototype.enableInteraction = function () {
    this.$disableInteractionOverlay.removeClass('showing');
};


DUET.SlideOutPanelView = function () {
    this.template = 'slide-out-panel';

    this.$neighbor = $('.window-outer');

    this.isShowing = false;

    this.initialize();
};

DUET.SlideOutPanelView.prototype = new DUET.View();

DUET.SlideOutPanelView.prototype.show = function () {
    var self = this;

    function show() {
        self.$element.addClass('showing');

        if (!self.isShowing) {
            self.$neighbor.on('click.slide-out-panel', function (e) {
                self.hide(true);
            });
        }

        self.isShowing = true;


        self.$element.stop().animate({left: self.$element.children().first().outerWidth()}, {
            duration: 200,

            step: function (now) {

                self.$neighbor.css({left: now});
            },
            queue:false
        });




    }

    show();

//    if(this.isShowing){
//        $.when(this.hide()).done(function(){
//            show();
//        })
//    }
//    else show();


    DUET.evtMgr.publish('slideOutPanelOpen');
};

DUET.SlideOutPanelView.prototype.hide = function () {
    var self = this,
        deferred = $.Deferred();

    //nothing to do if the panel isn't open
    if (!this.isShowing)
        return false;

    this.isShowing = false;

    this.$element.stop().animate({left: 0}, {
        duration: 200,
        step: function (now) {
            self.$neighbor.css({left: now});
        },
        complete: function () {
            self.isShowing = false;
            deferred.resolve();
        }
    });

    self.$neighbor.off('.slide-out-panel');

    DUET.evtMgr.publish('slideOutPanelClosed');

    return deferred;
};

DUET.SlideOutPanelView.prototype.setList = function (modelType, parameterString) {
    var self = this;
    //todo:enitylistview not entitylist

    var entityList = new DUET.EntityList(modelType, parameterString);
    entityList.load();

    this.$element.html(entityList.$element);

//    entityList.$element.on('click', 'li', function () {
//        self.hide();
//    });
    this.show();
};

DUET.SlideOutPanelView.prototype.setContent = function (view) {
    view.addTo({$anchor: this.$element});
    this.show();
};



DUET.CurrentUserView = function () {
    this.template = 'current-user';

    this.initialize({
        userName: DUET.my.first_name,
        userRole: ut.ucFirst(DUET.my.role)
    });

    this.$element.find('.user-image').append('<img src="' + DUET.my.image + '"/>');
};

DUET.CurrentUserView.prototype = new DUET.View();

DUET.GlobalSearchView = function () {
    this.template = 'global-search-input';

    this.domElements = {
        $search: '#global-search'
    };

    this.initialize();
};

DUET.GlobalSearchView.prototype = new DUET.View();

DUET.GlobalSearchView.prototype.bindEvents = function () {
    var self = this;

    this.$search.on('keyup', function (e) {
        var query;

        if (e.which == 13) {
            query = $(this).val();

            if (query.length) {
                //we need to force a reload if the current search is the same as the previous search
                if (DUET.history.fragment != 'search/' + query)
                    DUET.navigate('search/' + query);
                else DUET.reload();
            }

            self.$search.val('');
        }

        e.preventDefault();
    });
};


DUET.SmartSizeMenuView = function (buttons, options) {
    var data = !(buttons instanceof jQuery) ? buttons : null,
        useExistingButtons = data === null;

    if (useExistingButtons) {
        this.$buttons = buttons.clone(true);


    }

    this.options = options || {};

    this.template = 'smart-menu';

    this.domElements = {
        $itemsWrapper: '.smart-menu-items',
        $items: '.smart-menu-items li',
        $more: '.more',
        $moreMenu: '.smart-menu-overflow'
    };

    this.$window = $(window);

    this.initialize(data);



};

DUET.SmartSizeMenuView.prototype = new DUET.View();

DUET.SmartSizeMenuView.prototype.setExistingButtons = function () {
    var self = this;
    this.$itemsWrapper.html(this.$buttons);
    this.$items = this.$buttons;

    this.$items.each(function (i) {
        var $this = $(this),
            $wrap;

        //if the markup isn't correct, we need to correct it
        if (!$this.is('li')) {
            $wrap = $('<li class="has-button"></li>');
            $wrap.append($this.clone(true));
            $this.replaceWith($wrap);
        }
    });

    //since we may have manipulated the Dom elements above, we need to re-fetch the $items
    this.$items = this.$itemsWrapper.children();
};

DUET.SmartSizeMenuView.prototype.postRenderProcessing = function () {
    if (this.$buttons)
        this.setExistingButtons();

    this.$parent = this.$element.parent();

    this.resize();
};

DUET.SmartSizeMenuView.prototype.resize = function () {
    var parentWidth = this.$parent.width() - parseInt(this.$parent.css('padding-right'), 10) - parseInt(this.$parent.css('padding-left'), 10) - 100,
        buttonWidth = 0,
        maxVisible = this.$items.length,
        $hidden,
        isMini = this.$window.width() <= 1024;


    //reomve the hidden Class from all items so they appear in the dom and we can get proper widths
    this.$items.removeClass('hidden');

    if(!isMini){
        //loop through all items, calculate the width of this item and determine if it will fit
        this.$items.each(function (i, el) {
            buttonWidth += $(this).outerWidth(true);

            //if adding this button will make the menu wider than the parent we need to break out of this loop
            if (buttonWidth > parentWidth) {
                maxVisible = i;
                return false;
            }
        });
    }
    else maxVisible = 0;



    //we dont' want to show more than user defined max, if there is a user defined max
    if (maxVisible > this.options.maxVisible) {
        maxVisible = this.options.maxVisible;
    }

    //hide the buttons that will be in the more menu
    this.$items.each(function (index, el) {
        if (index < maxVisible)
            $(el).removeClass('hidden');
        else $(el).addClass('hidden');
    });

    //get copies of the hidden buttons
    $hidden = this.$items.filter('.hidden').clone(true).removeClass('hidden');

    //managew whether the More button is shown
    if ($hidden.length > 0) {
        this.$more.css('display', 'inline-block');
        this.$moreMenu.html($hidden);
    }
    else this.$more.css('display', 'none');

    if ($hidden.length == this.$items.length) {
        this.$element.addClass('showing-none');
    }
    else this.$element.removeClass('showing-none');
};

DUET.SmartSizeMenuView.prototype.bindEvents = function () {
    var self = this;


   this.$window.on('resize.' + this.id, function () {
        self.resize();
    });

    this.$more.on('click', function (e) {
        self.$moreMenu.addClass('active');

        //id we don't stop propagation, the $element level click handler will add the active class, keeping the filter
        //visible
        if (!$(e.target).is('li'))
            e.stopPropagation();

    });

    $('html').on('click.' + self.id, function () {
        self.$moreMenu.removeClass('active');
    });
};

DUET.SmartSizeMenuView.prototype.setAction = function (action) {
    var self = this;

    self.$element.on('click', 'li', function () {
        self.setSelected($(this).attr('id'));

        //run the action associated with this button set
        DUET.utils.run.apply(this, [action, this]);
    });
};
DUET.SmartSizeMenuView.prototype.setSelected = function (id) {
    //mark the current button as selected

    this.$element.find('#' + id).addClass('selected').siblings().removeClass('selected');
};


DUET.SmartSizeMenuView.prototype.unloadProcessing = function () {
    $('html').off(this.id);
    $(window).off('resize.' + this.id);
}


//

DUET.DropdownButtonView = function (text, buttons, options) {
    this.template = 'dropdown-button';

    this.domElements = {
        $button: '.main-button',
        $dropdown: '.dropdown-button-dropdown'
    };


    var views = {};
    var hasViews = false;

    $.each(buttons, function (i, button) {
        if (button.view) {
            hasViews = true;
            views[button.id] = button.view;
            button.view = null;
        }
    });

    this.options = options || {};

    this.initialize({buttonText: text, buttons: buttons, classes: this.options.classes});
    var self = this;

    if (hasViews) {
        $.each(views, function (id, view) {
            self.$element.find('#' + id).html(view.$element.attr('class', ''));
        });
    }


};

DUET.DropdownButtonView.prototype = new DUET.View();

DUET.DropdownButtonView.prototype.bindEvents = function () {
    var self = this;

    this.$button.on('click', function (e) {
        self.$dropdown.toggleClass('active');
        e.stopPropagation();
    });

    $('html').on('click.' + self.id, function () {
        self.$dropdown.removeClass('active');
    });
};

DUET.DropdownButtonView.prototype.setAction = function (selector, action) {
    var self = this;

    var callback = function (e) {
        var $this = $(this);

        if (self.options.updateButtonOnClick === true)
            self.$button.text($this.text());

        action.apply(this, [$this, e]);
    };

    this.$element.on('click', selector, callback);
};

DUET.DropdownButtonView.prototype.unloadProcessing = function () {
    $('html').off(this.id);
};


DUET.ButtonView = function (data) {
    this.template = 'button';

    this.initialize(data);
};

DUET.ButtonView.prototype = new DUET.View();

DUET.ButtonView.prototype.setAction = function (action) {
    this.$element.on('click', action);
};



//Item List View for projects
DUET.ProjectListView = function (type, modelOrCollection) {
    var self = this;

    this.template = 'project-' + type + '-list';

    this.type = type;

    if (modelOrCollection)
        this.initialize(modelOrCollection);

    return this;
}; //TODO: the arguments list for all views should be standardized

DUET.ProjectListView.prototype = new DUET.View();


DUET.KanbanView = function (list, project) {
    this.template = 'cards';

    this.domElements = {
        $newSection: '.new-section',
        $newSectionInput: '#new-section-input',
        $cardViewComplete: '#card-view-complete',
        $cardViewIncomplete: '#card-view-incomplete'
    };

    this.list = list;

    this.project = project;

    this.needsUnloading();

    //the list view will add an empty uncategorized section, but the kanban view doesn't need it.
    this.list.removeEmptyUncategorizedSection();

    list.decodeParams();

    this.initialize({list: list.orderedAndOrganized, complete: list.complete});
};

DUET.KanbanView.prototype = new DUET.View();

DUET.KanbanView.prototype.postRenderProcessing = function () {
    var self = this,
        $columns = this.$element.find('.card-column'),
        numColumns = $columns.length;

    this.resize();

    this.initColumnSortable();

    this.initColumnDroppable();

    this.$element.sortable({
        items: '.named-section',
        placeholder: 'column-placeholder',
        delay: 100,
        update: function (e, ui) {
            self.list.moveSection(ui.item.data('id'), ui.item.index() + 1);
            //self.list.moveSectoin()
        }
    });

};

DUET.KanbanView.prototype.initColumnDroppable = function(){
    var self = this;
    //dropabble is really only relevant when this is an empty column. The droppabled drop callback
    //only handles the empty column case. Everything else is handled by the sortable recieve callback
    this.$element.find('.card-column').not('.ui-droppable').droppable({
        accept:'.card',
        over: function (e, ui) {
            var $this = $(this),
                hasCards = $this.find('.card').length ? true : false;

            if (!hasCards) {
                $this.addClass('no-cards');
            }

        },
        out: function () {
            $(this).removeClass('no-cards');
        },
        hoverClass: "ui-state-hover",
        drop: function (e, ui) {
            var $column = $(this),
                columnId = $column.data('id'),
                $cards = $column.find('.cards');

            $(this).removeClass('no-cards');

            if (!self.list.organized[columnId].tasks.length) {
                var $tempCard = ui.draggable,
                    $card = $tempCard.clone().removeAttr('style').removeClass('ui-sortable-helper'),
                    senderId = self.list.tasksById[$card.data('id')].sectionId;

                $cards.append($card);

                $tempCard.remove();

                self.list.moveItem($card.data('id'), columnId, senderId, 1);

                self.handleColumnToColumnMove($card);
            }
        }
    });
};

DUET.KanbanView.prototype.initColumnSortable = function(){
    var self = this;

    this.$element.find('.cards').not('.ui-sortable-handle').sortable({
        connectWith: '.connected-cards',
        placeholder: 'card-placeholder',
        items: '.card',
        delay: 10,
        receive: function (e, ui) {
            self.manageMove(ui.item, ui.sender);
        },
        update: function (e, ui) {
            //when items are moved between lists, this event will fire twice, once for each list. It will also fire for
            //intra list sorts. We have processing code that we need to run for both types of sorts, but we need to be
            // able to tell which type of sort happened (intra list or list-to-list). There is no way to do this cleanly
            // with the update function alone. The only viable solution is to only run the processing code from the update
            //function IF this is a intra list sort. Otherwise we will rely on the receive callback
            // http://forum.jquery.com/topic/sortables-update-callback-and-connectwith
            //http://stackoverflow.com/questions/5586558/jquery-ui-sortable-disable-update-function-before-receive
            if (!ui.sender && this === ui.item.parent()[0]) {
                self.manageMove(ui.item);
            }
        }
    });
};

DUET.KanbanView.prototype.manageMove = function ($item, $sender) {
    var newSectionId = $item.closest('.card-column').data('id'),
        originalSectionId = $sender ? $sender.closest('.card-column').data('id') : newSectionId;

    //if a column is moved from uncategorized to an empty section, then there will be no newSeciton
    //id because of hte way the droppable drop callback handles the code
    if(typeof newSectionId !== 'undefined'){

        this.list.moveItem($item.data('id'), newSectionId, originalSectionId, $item.index() + 1);

        //this is a list to list sort
        if ($sender) {
            this.handleColumnToColumnMove($item);
        }
    }

};

DUET.KanbanView.prototype.handleColumnToColumnMove = function ($card) {
    var sectionId = $card.closest('.card-column').data('id');

    if (this.list.doesSectionHaveAction(sectionId, 'action_mark_tasks_complete')) {
        $card.addClass('complete');
    }
};
DUET.KanbanView.prototype.resize = function () {
    if (!this.showingComplete == true) {
        var numColumns = this.list.sections.length,
            columnWidth = this.$element.find('.card-column').first().outerWidth(true),
            newSectionWidth = this.$element.find('.new-section').outerWidth(true);

        if (this.list.hasUncategorized() == true) {
            numColumns++;
        }

        this.$element.width((numColumns * columnWidth) + newSectionWidth);
        var height = this.$element.height() - this.$element.find('.card-column-header').first().height() - this.$element.find('.new-card').first().outerHeight(true) - 16;
        this.$element.find('.viewport').css('max-height', height);
    }
    else {
        this.$cardViewComplete.width(this.$element.parent().width());
     //   this.$element.width('100%');
        this.$element.find('.viewport').css('max-height', 'auto');
    }

};



DUET.KanbanView.prototype.bindEvents = function () {
    var self = this;

    function redraw(){
        self.list.organize();

        DUET.evtMgr.publish('taskListUpdated');
    }
    this.$newSectionInput.on('keydown', function (e) {
        if (e.keyCode == 13) {
            var section = new DUET.TaskSection();

            section.name = self.$newSectionInput.val();

            section.listId = self.project.id;
            section.on('saved', function () {
                self.addSection(section);
            });

            section.save();


            self.$newSectionInput.val('');

        }
    });

    this.$element.on('keydown', '.new-task-input', function (e) {

        if (e.keyCode == 13) {

            var $this = $(this);

            self.newTask($this);

        }
    });

    this.$cardViewIncomplete.on('click', '.is-task-completed', function (e) {
        var $card = $(this).closest('.card'),
            id = $card.data('id');

        $card.toggleClass('complete');
        e.stopPropagation();
        var task = self.list.getTask(id);

        $.when(task.toggleComplete()).done(function(){
            if(task.isComplete == true)
                $card.fadeOut({
                    complete:redraw
                });
        });


    });

    this.$cardViewComplete.on('click', '.is-task-completed', function(e){

        var $item = $(this).closest('li'),
            id = $item.data('id');
        e.stopPropagation();
        var task = self.list.getTask(id);

        $.when(task.toggleComplete()).done(function(){
            if(task.isComplete != true)
                $item.fadeOut({
                    complete:redraw
                });
        });

    });

    this.$element.on('click', '.card, li.completed', function () {
        var taskView = new DUET.TaskView(self.list.tasksById[$(this).data('id')], true);
        DUET.infoPanel.show(taskView);
    });

    this.$element.on('click', '.named-section .card-column-header', function () {
        var $section = $(this).closest('.card-column'),
            id = $section.data('id');

        var sectionOptions = new DUET.SectionOptionsView(self, id, $section);
        DUET.infoPanel.show(sectionOptions);
    });

    $(window).on('resize.kanban-view', function () {
        self.resize();
    });
};


DUET.KanbanView.prototype.newTask = function ($input) {
    var task, $card,  sectionId, projectId, saving;


    //create the new task
    task = $input.val();
    sectionId = $input.data('section-id');

    projectId = this.project.id;

    this.list.addItem(task, sectionId, function (task) {
        $card.attr('data-id', task.id);
    });

    //clear the input field of the task value
    $input.val('');

    $card = this.createCardElement(task);

    this.addCard($input, $card);

};

DUET.KanbanView.prototype.createCardElement = function(task){
    var data;

    //create the new card for this task
    if(!(task instanceof DUET.Task))
        data = {task: task};
    else data = task;

    return DUET.templateManager.$get('kanban-card', $.extend(data, DUET.viewCommonParams));

}

DUET.KanbanView.prototype.addCard = function($input, $card){
    var $cards;
    //add the new task to the section, scroll to bottom
    $cards = $input.closest('.card-column').find('.cards');
    $cards.append($card);
    $cards.get(0).scrollTop = $cards.get(0).scrollHeight;
}

DUET.KanbanView.prototype.unloadProcessing = function () {
    $(window).off('.kanban-view');
};

DUET.KanbanView.prototype.showIncomplete = function () {
    this.showingComplete = false;
    this.resize();
    this.$cardViewIncomplete.css('display', 'block');
    this.$cardViewComplete.css('display', 'none');
    this.$element.attr('data-filter', 'incomplete');

};

DUET.KanbanView.prototype.showComplete = function () {
    this.showingComplete = true;
    this.resize();
    this.$cardViewIncomplete.css('display', 'none');
    this.$cardViewComplete.css('display', 'block');
    this.$element.attr('data-filter', 'complete');
};

DUET.KanbanView.prototype.showAll = function(){
    this.showingComplete = true;
    this.resize();
    this.$cardViewIncomplete.css('display', 'block');
    this.$cardViewComplete.css('display', 'block');
    this.$element.attr('data-filter', 'all');
};

DUET.KanbanView.prototype.addSection = function (section) {
    section.name = ut.decode(section.name, 'ENT_QUOTES');

    this.list.addSection(section);

    var $section = DUET.templateManager.$get('card-column', $.extend(section.modelParams(), DUET.viewCommonParams));

    this.$newSection.before($section); //.before(this.$newSection);

    this.resize();

    this.initColumnDroppable();

    this.initColumnSortable();
};

DUET.KanbanView.prototype.addUncategorizedSection = function(){
    var section = this.list.addUncategorizedSection();
    section.id = section.section.id;
    section.name = section.section.name;
    var $uncategorized = DUET.templateManager.$get('card-column', $.extend({}, section, DUET.viewCommonParams));

    this.$cardViewIncomplete.prepend($uncategorized);



    this.initColumnDroppable();
    this.initColumnSortable();
    this.resize();
    return $uncategorized;
};


DUET.KanbanView.prototype.addToUncategorizedSection = function(task){
    var $uncategorized = this.$cardViewIncomplete.find('[data-id=0]');

    if(!$uncategorized.length){
        $uncategorized = this.addUncategorizedSection();
    }

    this.list.addTask(task, 0);
    var $input = $uncategorized.find('.new-task-input');
    var $card = this.createCardElement(task);

    this.addCard($input, $card);
    this.resize();
};

DUET.SectionOptionsView = function (kanbanView, sectionId, $section) {
    this.template = 'section-options';

    this.domElements = {
        $name: '#set_section_name',
        $delete: '#delete_section',
        $markTasksComplete: '#mark-tasks-complete'
    };

    this.$section = $section;

    this.$header = $section.find('.card-column-header');
    this.list = kanbanView.list;

    this.section = this.list.getSection(sectionId);

    this.kanbanView = kanbanView;

    this.list = kanbanView.list;

    this.initialize(this.section);
};

DUET.SectionOptionsView.prototype = new DUET.View();

DUET.SectionOptionsView.prototype.bindEvents = function () {
    var self = this;

    this.$name.on('keyup', function () {
        self.$header.text(self.$name.val());
    });

    this.$name.on('blur', function () {
        self.list.setSectionName(self.section.section.id, self.$name.val());
    });

    this.$delete.on('click', function () {
        DUET.confirm({
            actionName: 'Delete section', //todo:lang
            message: 'Are you sure you would like to delete this section? Any tasks in this section will be moved to the Uncategorized section',
            callback: function () {
                //return

                var $uncategorized = $('.card-column[data-id=0]');

                if (!$uncategorized.length) {
                    self.list.addUncategorizedSection();
                    //todo:seems like the kanban should handle adding the section itself....
                   $uncategorized = self.kanbanView.addUncategorizedSection();
                }

                var $cards = self.$section.find('.card');
                var toSection = 0,
                    fromSection = self.$section.data('id');

                $cards.each(function () {
                    self.list.moveItemToNewSection($(this).data('id'), toSection, fromSection, null, true);
                });

                self.list.completeMove(fromSection, toSection);

                $uncategorized.find('.cards').append($cards);

                self.$section.fadeOut(function () {
                    self.$section.remove();
                });

                DUET.infoPanel.hide();

                var result =  self.list.deleteSection(self.section.section.id);

                return result;
            }
        });

    });

    this.$markTasksComplete.on('change', function () {
        var value = self.$markTasksComplete.is(':checked');
        self.list.setSectionAction(self.section.section.id, 'action_mark_tasks_complete', value);

    });


};

DUET.EmptyTaskListView = function(){
    this.template = 'empty-task-list';

    this.initialize();
};

DUET.EmptyTaskListView.prototype = new DUET.View();

DUET.TaskListView = function (data, project) {
    this.template = 'project-task-list-wrapper';

    this.project = project;

    this.initialize();

    this.list = data;

    this.tasks = this.list.tasks;



    if (DUET.config.clients_can_complete_tasks == 1) {
        this.$element.addClass('clients-complete-tasks');
    }


    this.viewType = DUET.config.default_task_view || 'list';
    //  this.drawList(data, project);
    this.needsUnloading();



};

DUET.TaskListView.prototype = new DUET.View();

DUET.TaskListView.prototype.unloadProcessing = function(){

    DUET.evtMgr.unsubscribe('taskListUpdated');
};
DUET.TaskListView.prototype.drawList = function () {

    if (this.taskListITemsView)
        this.taskListItemsView.unload();

    this.taskListITemsView = false;


    if(!DUET.isMobile){
        if (this.viewType == 'list') {
            if (DUET.userIsAdmin() || DUET.userIsAgent() || DUET.config.clients_can_create_tasks == 1)
                this.taskListItemsView = new DUET.TaskListItemsView(this.list, this.project);
            else this.taskListItemsView = new DUET.TaskListItemsSimpleView(this.list);
        }
        else this.taskListItemsView = new DUET.KanbanView(this.list, this.project);
    }
    else{
        this.taskListItemsView = new DUET.TaskListItemsSimpleView(this.list);
    }


    this.$element.attr('data-type', this.taskListItemsView.template);

    this.taskListItemsView.addTo({$anchor: this.$element});


};

DUET.TaskListView.prototype.postRenderProcessing = function () {
    //clients can't create tasks

    var self = this;



    this.list.organize();
    this.initFilter();

    var viewButton = new DUET.DropdownButtonView(
        'Layout',
        [
            {id: 'list-view', class: 'has-icon', text: 'List'},
            {id: 'kanban-view', class: 'has-icon', text: 'Kanban'}

        ], {
            classes: 'show-indicator hide-on-mobile'
        });


    viewButton.setAction('li', function () {
        self.viewType = $(this).attr('id').split('-')[0];
        self.redraw();
    });

    DUET.panelTwo.panel.addToSecondaryMenu(viewButton);

    //if we move this into postInitProcessing, it will be removed when the task list is created becasue the task list
    //does not use append as the position argument for View.addTo

    if (!this.tasks.models.length && !this.list.sections.length) {
        var view = new DUET.EmptyTaskListView();
        view.addTo({$anchor:this.$element, position:'prepend'});

        this.$element.addClass('empty-list');

        this.$element.find('#new-section-input').on('keydown', function(e){
            if (e.keyCode == 13) {
                self.$element.removeClass('empty-list');
                view.unload();
            }
        });
    }
};

DUET.TaskListView.prototype.newTaskButton = function () {
    var $button, self = this;

    $button = DUET.templateManager.$get('add-project-list-item', {
        buttonText: ut.ucFirst(ut.lang('entityNames.task')),
        type: 'new-entity hide-on-mobile'
    });

    $button.on('click', function () {
        new DUET.NewTaskView({}, function (taskModel) {

            taskModel.assignedTo = DUET.my.id;
            taskModel.userLink = '#users/' + DUET.my.id;

            self.taskListItemsView.addToUncategorizedSection(taskModel);

        });
    });

    DUET.panelTwo.panel.addToSecondaryMenu($button);

    this.taskButton = $button;
};

DUET.TaskListView.prototype.initFilter = function () {
    //todo: Loose coupling. This implementation is terrible
    var filter = new DUET.TaskListFilterView(this);

    DUET.panelTwo.panel.addToSecondaryMenu(filter);
    this.filter = filter;
    this.filter.applyDefault();
};

DUET.TaskListView.prototype.redraw = function (filterToApply) {
    var currentFilters = this.filter.currentFilters(),
        filter = filterToApply || currentFilters.complete,
        ucFirst = DUET.utils.ucFirst;


    //this.taskListItemsView = new DUET.TaskListITemsViewOld(taskCollection, this.project);

    this.drawList();


    if (filter)
    {
        this.taskListItemsView['show' + ucFirst(filter)]();
    } //todo: this  should reapply the current filter, then we can probably get rid of the clear function on the filter
    else this.taskListItemsView.showIncomplete();

    DUET.panelTwo.panel.updateScrollbar();
};

DUET.TaskListView.prototype.showMessage = function (optionsOrMessage) {
    var options = {},
        $message;

    if (typeof optionsOrMessage == 'string') {
        options.message = optionsOrMessage;
    }
    else $.extend(options, optionsOrMessage);

    if (!options.closeButtonText)
        options.noCloseButtonText = true;

    $message = DUET.templateManager.$get('task-list-message', options);

    this.$element.prepend($message);
};

DUET.TaskListView.prototype.bindEvents = function () {
    var self = this;

    this.$element.on('click', '.search-results-message .close', function () {
        self.redraw();
    });

    this.$element.on('click', '.task-list-message .close', function () {
        $(this).closest('.task-list-message').remove();
    });

    DUET.evtMgr.subscribe('taskListUpdated', function(){
        self.redraw();
    });
    DUET.evtMgr.subscribe('mobileViewEnabled.taskListView mobileViewDisabled.taskListView', function () {
        self.drawList()
    });
};

DUET.TaskListView.prototype.postInitProcessing = function(){
    var self = this;

    DUET.BoardButtonsView('tasks', self.project);
};

DUET.BoardButtonsView = function(tab, project){
    var self = this;

    var categories = new DUET.LinkMenuView(tab, {
        template:'board-buttons',
        data:{id:project.id}
    });

    DUET.panelTwo.panel.addToPrimaryMenu(categories); //setInfoRightSide()

    DUET.bottomNavigation.set({
        template:'board-bottom-buttons',
        active:tab,
        data:project
    });
};

DUET.TaskListFilterView = function (taskListView) {
    this.needsUnloading();

    this.template = 'task-filter';

    this.domElements = {
        $searchFilter: '.search-filter'
    };

    this.appliedFilters = {};

    this.taskListView = taskListView;

    this.initialize();
};

DUET.TaskListFilterView.prototype = new DUET.View();

DUET.TaskListFilterView.prototype.applyDefault = function () {
    this.appliedFilters = {complete: 0};
    this.performFilters();
};

DUET.TaskListFilterView.prototype.bindEvents = function () {
    var self = this,
        ucFirst = DUET.utils.ucFirst;

    this.$element.on('click', function (e) {
        $(this).toggleClass('open');
        e.stopPropagation();
    });

    this.$searchFilter.on('click', function (e) {
        e.stopPropagation();
    });

    this.$searchFilter.on('keyup', 'input', function (e) {
        var $this;

        if (e.which == 13) {
            $this = $(this);
            self.searchList($this.val());
            $this.val('');
            self.$element.find('.selected').removeClass('selected');
        }
    });

    $('html').on('click.task-filter', function () {
        self.$element.removeClass('open');
    });

    this.$element.on('click', 'li', function () {
        var $this, type, value;

        $this = $(this);

        if ($this.hasClass('search-filter'))
            return;

        type = $this.data('filter-type');
        value = ucFirst($this.data('filter-value'));

        $this.toggleClass('selected').siblings('[data-filter-type=' + type + ']').removeClass('selected');

        //keep track of the current filters that have been applied
        self.appliedFilters[type] = value;

        //run the function that performs the actual filter
        self.performFilters();

        if ($this.hasClass('selected'))
            DUET.panelTwo.panel.notify(ut.lang('taskFilter.filterNotification', {filterValue: value}));

        DUET.panelTwo.panel.updateScrollbar();
    });

};

DUET.TaskListFilterView.prototype.unloadProcessing = function () {
    $('html').off('click.task-filter');
};

DUET.TaskListFilterView.prototype.setFilters = function () {
    var self = this, filters = {};

    if (self.appliedFilters.complete) {
        var complete = self.appliedFilters.complete;

        if (complete != 'All')
            filters.isComplete = (complete == 'Incomplete') ? 0 : 1;
    }

    //set assigned filter
    //check to see if the assigned filter has been selected
    if (self.appliedFilters.assigned) {
        var assigned = self.appliedFilters.assigned;

        //if we're filtering 'my' tasks then we need to add the current user's id, otherwise we need to remove
        if (assigned == 'Mine')
            filters.assignedTo = DUET.my.id;
    }

    return filters;
};

DUET.TaskListFilterView.prototype.performFilters = function () {
    var self = this, filtered, collection;

    var filters = this.setFilters();

    self.taskListView.list.filterAndOrganize(filters);

    this.taskListView.redraw();
};

DUET.TaskListFilterView.prototype.searchList = function (searchTerm) {
    var self = this, filtered, collection;

    self.taskListView.list.searchAndOrganize({task: searchTerm});


    this.taskListView.redraw('incomplete');

    this.taskListView.showMessage({
        message: ut.lang('taskFilter.searchNotification', {searchTerm: searchTerm}),
        closeButtonText: ut.lang('taskFilter.closeSearch'),
        type: 'search-results-message'
    });

    this.$element.removeClass('open');
};

DUET.TaskListFilterView.prototype.currentFilters = function () {
    var filters = {};

    this.$element.find('.selected').each(function () {
        var $this = $(this);
        filters[$this.attr('data-filter-type')] = $this.attr('data-filter-value');
    });

    return filters;
};


DUET.TaskListItemsView = function (list) {
    this.template = 'task-list-items';

    this.domElements = {
        $completedTasks: '#completed-tasks-list',
        $incompleteTasks: '#incomplete-tasks-list'
    };


    this.list = list;

    list.decodeParams();


    this.initialize({complete: list.complete, list: list.orderedAndOrganized});

    this.initList();
};


DUET.TaskListItemsView.prototype = new DUET.View();


DUET.TaskListItemsView.prototype.showIncomplete = function () {
};

DUET.TaskListItemsView.prototype.showComplete = function () {
};

DUET.TaskListItemsView.prototype.initList = function () {
    var self = this, currentItem, previousItem, autoSaveTimeout,
        items = {}, sections = {}, $uncategorized = $(), inputDisabled = false;


    this.$element.find('li').each(function () {
        var $this = $(this),
            id = $this.data('id'),
            $input = $this.find('input'),
            task = self.list.getTask(id);

        makeListItem($input, task, $this.hasClass('list-header'));
    });

    this.$incompleteTasks.sortable({
        handle: '.sort-handle',
        start: function (e, ui) {

        },
        stop: function (e, ui) {
            var id = ui.item.attr('data-id'),
                type = ui.item.attr('id').split('-')[0], item;

            if (type == 'task')
                item = items[id];
            else item = sections[id];


            updateItemPosition(item);
        }
    });

    initUncategorizedSection();

    function updateItemPosition(item) {
        var info = getSectionInfo(item.$item);

        self.list.moveItem(item.task.id, info.sectionId, item.task.sectionId, info.position);
        item.task.sectionId = info.sectionId;
    }

    function initUncategorizedSection() {
        if (!self.list.organized[0]) {

            $uncategorized = $('<li id="section-0" class="list-header" data-id="0">Uncategorized</li>');
            self.$element.prepend($uncategorized); //todo:lang
            manageUncategoriezedSection();
        }
    }

    function manageUncategoriezedSection() {
        if (!self.list.organized[0])
            self.list.addUncategorizedSection();

        if (self.list.hasUncategorized()) {
            $uncategorized.removeClass('hidden');

        }
        else {
            $uncategorized.addClass('hidden');
        }
    }

    function handleKeyPress() {
        manageHeaderStatus();

        //handle the autosave
        clearTimeout(autoSaveTimeout);

        //todo: change back to 3000
        autoSaveTimeout = setTimeout(saveCurrentItem, 3000);
    }

    function saveCurrentItem() {
        save(currentItem.$item);

    }

    function keydownBackspaceHandler(e) {
        var val = currentItem.value;

        if (!val.length && !currentItem.isDisabled) {
            //delete this item, set the focus to the previous item. Passing false in the
            focusOnPreviousItem();

            e.preventDefault();
        }
    }

    function focusOnPreviousItem() {

        var $prev = currentItem.$item.prev().find('input');

        deleteCurrentIfEmpty();

        if ($prev.length) {
            setCurrentItem($prev);
        }
    }

    function focusOnNextItem() {
        var $next = currentItem.$item.next().find('input');

        deleteCurrentIfEmpty();

        if ($next.length) {
            setCurrentItem($next);
        }
    }

    function deleteCurrentIfEmpty() {
        if (!currentItem.value.length)
            deleteListItem(currentItem);
    }

    function deleteListItem(item) {
        item.$item.remove();


        if (item.task && item.task.id) {
            self.list.deleteItem(item.task.id);
        }
        else {

            self.list.deleteSection(item.section.id);
            manageUncategoriezedSection();
        }

    }

    function openCurrentItem() {
        if (options.openItemCallback)
            options.openItemCallback(currentItem);
    }

    function addNewItem(silent) {
        //prevent the user from creating a new item if there current item is empty
        if (!currentItem || currentItem.value.length) {
            var newItem,
            //if we're passing in an instance of listItem, then the item has previously been in the list and should be
            // appended to the list or added at the position specified in the ListItem object. Otherwise, it should
            // be added after the current item
                ignoreCurrentPosition = false;

            var $newItem = DUET.templateManager.$get('task-list-line-item');

            if (currentItem && !ignoreCurrentPosition) {
                currentItem.$item.after($newItem);
            }
            else {
                self.$incompleteTasks.append($newItem);
            }


            makeListItem($newItem);

            if (silent !== true)
                setCurrentItem($newItem.find('input'));

        }

    }

    function makeListItem($input, task, isSection) {
        var value,
            $item = $input.closest('li'), theTask, theSection;

        if (!isSection) {
            theTask = task || self.list.getTask($item.data('id'));

            if (!theTask) {
                theTask = DUET.make('Task');
                $input.closest('li').attr('data-id', theTask.getId()).data('id', theTask.getId());
            }
        }
        else {

            theSection = self.list.getSection($item.data('id'), true);
        }


        value = $input.val();

        var item = {
            $input: $input,
            $item: $item,
            originalValue: value,
            value: value,
            isSaving: false,
            savingDeferred: false
        };

        if (!isSection) {
            item.task = theTask;
            items[theTask.getId()] = item;
        }
        else {
            item.isSection = true;
            item.section = theSection;

            sections[theSection.id] = item;
        }

        return item;
    }

    function setCurrentItem($input, task) {

        var resetCurrentItemOnFocus = false,
            value,
            $item = $input.closest('li'),
            id = $item.attr('data-id');

        currentItem = getItem($item, id);


        currentItem.originalValue = currentItem.value;


        setFocusAtEndOfInput($input);

        $input.trigger('focus', resetCurrentItemOnFocus);
        $item.addClass('selected'); //TODO: Maybe this should be a class rather than input.allows for more flexible markup


    }

    function setFocusAtEndOfInput($item) {
        //Without this function, the cursor will be at the beginning of the input in firefox and ie
        //this function must be called before we trigger focus on the element
        //http://stackoverflow.com/a/12654402
        var el = $item.get(0);
        var elemLen = el.value.length;

        if (elemLen) {
            el.selectionStart = elemLen;
            el.selectionEnd = elemLen;
        }
    }

    function manageHeaderStatus() {
        var self = this,
            headerCriteriaOK = headerCriteriaMet();

        if (currentItem.isSection && !headerCriteriaOK) {
            makeRegularItem();
        }
        else if (!currentItem.isSection && headerCriteriaOK) {
            makeHeader();
        }
    }

    function makeRegularItem() {
        //currentItem.$item.removeClass('list-header');
        //convertSectionToTask(currentItem);

    }

    function makeHeader() {
        currentItem.$item.addClass('list-header');
        createSectionFromTask(currentItem);
        manageUncategoriezedSection();
        //todo: need to move this to the sections array, and delete from the tasks array.
        //also need ot change the id in the html for this item to the new section id
    }

    function headerCriteriaMet() {
        return currentItem.value[currentItem.value.length - 1] == ':';
    }


    function createSectionFromTask(item) {
        var creatingSection,
            $section = item.$item,
            $tasks = $section.nextUntil('.list-header'),
            sectionId = $section.data('id'),
            taskIds = [],
            $sections = self.$element.find('.list-header'),
            sectionPosition = $sections.index($section) + 1;


        var $items = $();

        $tasks.each(function () {
            var id = $(this).attr('data-id'),
                item = items[id];

            item.isSaving = true;
            $items = $items.add(item.$item);
            taskIds.push(id);
        });

        $items.addClass('saving');
        $section.addClass('saving');

        //when creating a section, if we don't manually set this, then the tasklist/change and the task/save routes will
        //be called
        item.originalValue = item.value;
        if (item.task.id)
            creatingSection = self.list.createSectionFromTask(sectionId, sectionPosition, taskIds);
        else creatingSection = self.list.createSection(item.value, sectionPosition, taskIds);

        disableInput();
        $.when(creatingSection).done(function (response) {
            enableInput();
            item.isSection = true;
            $items.removeClass('saving');
            $section.removeClass('saving');
            finishSavingItem(item, response);

        });
    }

    function disableInput() {
        inputDisabled = true;
    }

    function enableInput() {
        inputDisabled = false;
    }

    function finishSavingItem(item, response) {
        var id = response.data,
            type = item.isSection ? 'section' : 'task',
            typeId = type + '-' + id;

        item.$item.attr('id', typeId).attr('data-id', id);

        if (item.isSection) {
            item.section = {
                name: item.value,
                id: id
            };
            sections[id] = item;

        }
    }

    function unfocus($input) {
        var $item = $input.closest('li');
        $item.removeClass('selected');

        save($item);
        //self.list.getTask($item.data('id')).save();//currentItem.task.save();
    }


    function getSectionInfo($element) {
        var sectionId,
            previous = $element.prevUntil('.list-header'),
            position = previous.length + 1;

        if (previous.length) {
            sectionId = previous.last().prev().attr('data-id');

        }
        else {
            sectionId = $element.prev('.list-header').attr('data-id');
        }

        return {sectionId: sectionId, position: position}
    }

    function addToList(item) {
        var sectionInfo = getSectionInfo(item.$item),
            sectionId = sectionInfo.sectionId || 0,
            position = sectionInfo.position;

        return self.list.addItemAtPosition(item.value, sectionId, position, null);
    }

    function getItem($item, id) {
        var item;

        if ($item.hasClass('list-header')) {
            item = sections[id];
        }
        else item = items[id];

        return item;
    }

    function save($item) {
        var classes = 'saving error-saving',
            id = $item.attr('data-id');

        var item = getItem($item, id);

        if (item.value.length && hasChanged(item) && item.isSaving == false) {
            var task = item.task;

            $item.removeClass(classes);

            $item.addClass('saving');

            //manually setting isSaving. We want isSaving set as quickly as possible just in case another call to save is
            //initiated before the callback finishes (i.e. if for some reason the callback itself triggers an event
            //that calls save

            //we keep track of whether there is a pending save request to prevent more than one save of the
            //same item at the same time (i.e. quickly focus/unfocus an item before a previous save request has finished)

            item.isSaving = true;

            if (!item.isSection && !task.id) {
                var properties = addToList(item);

                item.savingDeferred = properties.deferred;
                item.task = properties.task;
                item.task.task = item.value;
                $.when(item.savingDeferred).done(function () {
                    delete items[task.getId()];
                    items[item.task.id] = item;

                    $item.attr('id', item.task.id).attr('data-id', item.task.id);
                });
            }
            else {

                if (!item.isSection)
                    item.savingDeferred = task.save();
                else item.savingDeferred = self.list.updateSection(item.section.id, {
                    name: item.value,
                    position: item.section.position
                });
            }


            $.when(item.savingDeferred).done(function () {
                $item.removeClass('saving');

                setNotSaving(item);

            }).fail(function () {
                $item.removeClass(classes);
                $item.addClass('error-saving');

                setNotSaving(item);
            });

            return item.savingDeferred;
        }
        else if (item.isSaving === true) {
            //the list item is already saving, so let's return the deferred from the existing save request
            return item.savingDeferred;
        }
    }

    function setNotSaving(item) {
        item.isSaving = false;
        item.savingDeferred = false;
    }

    function hasChanged(item) {
        return item.originalValue != item.value;
    }

    this.$element.on('keydown.fluidlist', 'input', function (e) {
        var code = e.which;

        if (inputDisabled == true)
            return false;

        switch (code) {
            case 8:
                //backspace
                keydownBackspaceHandler(e);
                break;
            case 13:
                //enter
                e.preventDefault();

                if (e.ctrlKey || e.metaKey) {
                    //ctrl + enter or cmd + enter
                    openCurrentItem();
                }
                else {
                    //just the enter key
                    addNewItem();
                }

                break;
            case 38:
                e.preventDefault();
                focusOnPreviousItem();
                break;
            case 40:
                e.preventDefault();
                focusOnNextItem();
                break;
            case 83:
                //capture Ctrl + S or Cmd + S
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    saveCurrentItem();
                }
                break;
        }
    });

    //handleKeyPress needs to be called on keyup rather than keydown, otherwise neither the input, nor
    //currentItem.value will contain the key that was just pressed.
    this.$element.on('keyup.fluidlist', 'input', function (e) {
        var $this = $(this);

        if (inputDisabled == true)
            return false;

//todo:changes that happen too quickly on imported items(press on key and then enter immediately after) are not getting recored. This next line needs to be in the keydown handler, we should also probably cache the input on the listItem so we don't have to do $(this) every time
        currentItem.value = $this.val();

        if (currentItem.task)
            currentItem.task.task = currentItem.value;

        switch (e.which) {
            case 13:
            case 38:
            case 40:
            case 16:
                //we don't need to take any action on enter, up, down, or shift for the key up event
                break;
            default:
                //the backspace case is handled here as well
                handleKeyPress($(this));
                break;
        }
    });

    this.$element.on('focus.fluidlist', 'input', function (e, resetCurrentItem) {
        //TODO: THis event seems to be firing wayyyy too many times. console.log('yerrrr');

        //this check is needed to prevent infinite recursion (calls to the focus event)
        if (typeof resetCurrentItem == 'undefined')
            setCurrentItem($(this));
    });

    this.$element.on('blur.fluidlist', 'input', function (e) {
        //todo:this sucks for performance. We can't use currentItem, because this (the item blurred) may no longer be the current item, this is because the 'Enter' key handler is bound to keydown, which fires before this blur event. The enter handler resets the currentItem reference, which means this item is no longer the currentItem. Consider moving the 'enter' handler to keyup or some other event that happens after blur??
        unfocus($(this));
    });

    this.$element.on('click.fluidlist', '.save-item', function () {
        $(this).closest('li').data('item').save(true);
    });

    self.$element.on('click', '.is-task-completed', function (e) {
        var $this = $(this),
            $task = $this.closest('li'),
            task = self.list.getTask($task.data('id'));

        task.toggleComplete();


        if (task.isComplete) {
            self.markTaskComplete($task, true);
        }
        else {
            $task.fadeOut(400, function () {

                self.markTaskIncomplete($task);

            });

        }

        return false;
    });

    if (self.list.incompleteCount == 0) {
        addNewItem(true);
    }
};


//Task List Items View
DUET.TaskListItemsSimpleView = function (list, projectId) {
    var tasks;

    this.template = 'task-list-items-simple';

    this.projectId = projectId;

    this.domElements = {
        $completedTasks: '#completed-tasks-list',
        $incompleteTasks: '#incomplete-tasks-list'
    };

    //this.paramsToDecode = ['complete:task', 'incomplete:task'];

    //tasks = DUET.TaskListITemsViewOld.prototype.sortTasks(data);

    this.list = list;

    list.decodeParams();

    this.initialize({complete: list.complete, list: list.orderedAndOrganized});


};

DUET.TaskListItemsSimpleView.prototype = new DUET.View();

DUET.TaskListItemsSimpleView.prototype.bindEvents = function () {
    var self = this;

    this.$element.on('click', 'li:not(.list-header)', function () {

        // DUET.navigate('projects/' + self.projectId + '/tasks/' + $(this).data('id'));
        var id = $(this).data('id');



        DUET.GoToTask(self.list.tasksById[id]);




    });

    self.$element.on('click', '.is-task-completed', function (e) {
        var $this = $(this),
            $task = $this.closest('li'),
            task = self.collection.modelsById[$task.data('id')];

        task.toggleComplete();


        if (task.isComplete) {
            self.markTaskComplete($task, true);
        }
        else {
//            $task.fadeOut(400, function () {
//                $task.remove();
//                self.fluidList.addListItem($task.css('display', 'block'));
//            });

        }

        return false;
    });
};

DUET.TaskListItemsSimpleView.prototype.markTaskComplete = DUET.TaskListItemsView.prototype.markTaskComplete;
DUET.TaskListItemsSimpleView.prototype.markTaskComplete = DUET.TaskListItemsView.prototype.markTaskComplete;
DUET.TaskListItemsSimpleView.prototype.showComplete = DUET.TaskListItemsView.prototype.showComplete;
DUET.TaskListItemsSimpleView.prototype.showIncomplete = DUET.TaskListItemsView.prototype.showIncomplete;
DUET.TaskListItemsSimpleView.prototype.showAll = DUET.TaskListItemsView.prototype.showAll;



DUET.GoToTask = function(task){

    if(!DUET.isMobile)
    {
        var taskView = new DUET.TaskView(task, true);
        DUET.infoPanel.show(taskView);
    }
    else DUET.navigate('boards/' + task.projectId + '/tasks/' + task.id);
};

DUET.TaskListItemsView.prototype.bindEvents = function () {
    var self = this;

    function goToTask(id, isSection) {
        if (isSection !== true) {
           DUET.GoToTask(self.list.tasksById[id]);
        }
    }

    //IMPORTANT: double click handler is defined in the fluid list initialization


    self.$element.on('click', '.delete-task', function () {
        var $this = $(this),
            type = $this.closest('li').hasClass('list-header') ? 'header' : 'task';

        DUET.confirm({
            actionName: ut.lang('taskListItems.deleteTask'),
            message: ut.lang('taskListItems.deleteTaskMessage', {type: type}),
            callback: function () {
                var $listItem = $this.closest('li'),
                    id = $listItem.data('id'),
                    task = new DUET.Task();

                task.id = id;

                task.on('deleted', function () {
                    $listItem.fadeOut(function () {
                        //we need to remove the
                        self.fluidList.removeListItem($listItem);
                        $listItem.remove();
                    });
                });

                task.delete();
            }
        });
    });

    self.$element.on('click', '.task-assigned', function (e) {
        var $assignedToName = $(this),
            $listItem = $(this).closest('li'),
            task = self.list.getTask($listItem.attr('data-id'));

        $listItem.addClass('pseudo-hover');

        var assignTaskView = new DUET.AssignTaskView(task, function (id, name) {
            $assignedToName.find('.tag').text(name);

            popup.close();
        });

        var popup = new DUET.InlinePopupView({
            e: e,
            view: assignTaskView,
            anchor: this,
            closeCallback: function () {
                $listItem.removeClass('pseudo-hover');
            }
        });

    });

    self.$element.on('click', '.start-timer-for-task', function (e) {

        var $listItem = $(this).closest('li'),
            task = $listItem.data('task');

        var startTimerView = new DUET.StartTimerView(task);


        $listItem.addClass('pseudo-hover');

        var popup = new DUET.InlinePopupView({
            e: e,
            view: startTimerView,
            anchor: this,
            closeCallback: function () {
                $listItem.removeClass('pseudo-hover');
            }

        });
    });

    self.$element.on('click', '.discuss-task', function () {
        DUET.navigate('projects/' + DUET.context().id + '/tasks/' + $(this).closest('li').data('id') + '/discussion');
    });

    self.$element.on('click', '.view-task', function () {
        goToTask($(this).closest('li').attr('data-id'));

    });


    self.$element.single_double_click({
        doubleClickCallback: function (e) {
            var $target = $(e.target),
                $li = $target.closest('li');

            //we only want to act on a double click event if the target is an input and the input is actually
            //in a list item
            if ($target.is('input') && $li.length) {

                var isSection = $li.hasClass('list-header');
                goToTask($li.attr('data-id'), isSection);
            }
        }
    });

};

DUET.TaskListItemsView.prototype.markTaskComplete = function ($task, animate) {
    var self = this;


    function removeTask() {

        self.list.moveToComplete($task.attr('data-id'));

        //the task may have been hidden by the animation, we need to reset it's display property before we add it
        //to the completed tasks list, otherwise it won't show up if we're in the "all tasks" view
        $task.css('display', 'block');

        //move the task to the completed tasks list
        self.$completedTasks.append($task);
    }

    $task.addClass('complete').find('input').attr('disabled', 'disabled');

    if (animate === true) {
        $task.fadeOut(400, function () {
            removeTask();
        });
    }
    else removeTask();
};

DUET.TaskListItemsView.prototype.markTaskIncomplete = function ($task) {
    var self = this;

    $task.remove();
    self.list.moveOutOfComplete(task.id);

    var section = sections[task.sectionId];

    section.$item.nextUntil('.list-header').last().after($task.removeClass('completed').removeAttr('style').find('input').removeAttr('disabled').end());

};

DUET.TaskListItemsView.prototype.showComplete = function () {
    this.$incompleteTasks.css('display', 'none');
    this.$completedTasks.css('display', 'block');
};

DUET.TaskListItemsView.prototype.showIncomplete = function () {
    this.$incompleteTasks.css('display', 'block');
    this.$completedTasks.css('display', 'none');
};

DUET.TaskListItemsView.prototype.showAll = function () {
    this.$incompleteTasks.css('display', 'block');
    this.$completedTasks.css('display', 'block');
};


DUET.LinkMenuView = function(selected, data){
    this.template = 'dashboard-menu';

    if(data && data.template)
        this.template = data.template;

    var viewData = data && data.data;

    this.initialize(viewData);

    this.$element.find('.' + selected + '-tab').addClass('active');

    //major hack to fix a possible chrome rending issue. Clicking on Agenda, letting it render, then clicking the agenda
    //link again, was causing the panel info to shift upwards, breakign the layout. No idea why.
    //probably an issue with the css itself, because the same thing doesn't happen on boards, but I'm not willing to spend 30 mins
    //debugging now. Sorry future Me :(
    this.$element.on('click', 'li', function(e){

        var $this = $(this);
        var hash = DUET.history.getHash();
        var desiredLocation = $this.find('a').attr("href").substr(1);

        if($this.hasClass(selected + '-tab') && desiredLocation == hash) {
            return false;
        }
    });
};

DUET.LinkMenuView.prototype = new DUET.View();


DUET.BoardsListView = function(data){
    this.template = 'boards-list';

    this.domElements = {
        $newBoard:'.new-board',
        $boardSettings:'.board-settings',
        $archivedTitle:'#archived-title',
        $archived:'#archived-boards'
    };



    this.initialize(data);
};

DUET.BoardsListView.prototype = new DUET.View();

DUET.BoardsListView.prototype.bindEvents = function(){
    var self = this;

    this.$newBoard.on('click', function(){
        new DUET.NewProjectView();
    });

    this.$boardSettings.on('click', function(e){
        var $this = $(this);
        var project = self.model.boards.modelsById[$this.closest('li').data('id')];

        var menu = new DUET.BoardMenuView(project);

        new DUET.InlinePopupView({
            e: e,
            view: menu,
            anchor: $this,
            positionAtBottom: true,
            closeCallback: function () {
                //$listItem.removeClass('pseudo-hover');
            }
        });
    });

    this.$archivedTitle.on('click', function(){
        self.$archived.toggleClass('open');
    });

};



DUET.BoardsListView.prototype.postRenderProcessing = function(){
    var categories = new DUET.LinkMenuView('boards');
    DUET.panelTwo.panel.addToPrimaryMenu(categories); //setInfoRightSide()

    var other = DUET.templateManager.$get('secondary-menu');

    DUET.panelTwo.panel.addToSecondaryMenu(other); //setInfoRightSide()

    DUET.bottomNavigation.set({
        template:'main-bottom-buttons',
        active:'boards'
    });


};


DUET.BoardMenuView = function(project){
    this.template = 'board-dropdown';

    this.domElements = {
        $deleteBoard:'#delete-board-button',
        $editBoard:'#edit-board-button',
        $archiveBoard:'#archive-board-button',
        $unarchiveBoard:'#unarchive-board-button'
    };


    this.initialize(project);
};

DUET.BoardMenuView.prototype = new DUET.View();

DUET.BoardMenuView.prototype.bindEvents = function(){
    var self = this;


    this.$deleteBoard.on('click', function(){
        new DUET.DeleteProjectView(self.model);
    });

    this.$editBoard.on('click', function(){
        new DUET.NewProjectView(self.model);
    });

    this.$unarchiveBoard.on('click', function(){
        new DUET.UnarchiveProjectView(self.model);
    });

    this.$archiveBoard.on('click', function(){
        new DUET.ArchiveProjectView(self.model);
    });
};

DUET.AgendaView = function(agenda){
    this.template = 'agenda';

    this.domElements = {
        $today:'.today-tasks',
        $upcoming:'.upcoming-tasks',
        $other:'.other-tasks',
        $agendaTasks:'#agenda-tasks',
        $billingActivity:'#billing-activity',
        $summaryWidgets:'#summary-widgets',
        $tabs:'.agenda-tab',
        $agendaActivity:'#agenda-activity-list',
        $openProjects:'.open-projects',
        $agendaTasksFilterDate: '#agenda-tasks-filter-date'
    };



    this.initialize(agenda);
};

DUET.AgendaView.prototype = new DUET.View();

DUET.AgendaView.prototype.bindEvents = function(){
    var self = this,
        originalDueDate;

    function getId($li){
        return  $li.data('id');
    }
    function getTask(id){
        return self.model.tasks.modelsById[id];
    }

    function getTaskFromHtmlItem($li){
        return getTask(getId($li));
    }

    this.$agendaTasks.on('click', 'li:not(.list-header)', function () {
        DUET.GoToTask(getTaskFromHtmlItem($(this)));
    });

    this.$element.find('.task-list li').draggable({
        start:function(){
            self.$currentTask = $(this);
            self.currentTaskId = getId(self.$currentTask);
            self.currentTask = getTask(self.currentTaskId);
        },
        helper:function(){

            var $this = $(this),
                width = $this.outerWidth(),
                $helper = $('<div class="agenda-drag-helper"></div>').append($this.html()).width(width).data('id', self.currentTaskId);

            $('body').append($helper);

            return $helper;
        }
    });


    this.$openProjects.on('click', 'li', function(){
        var id = $(this).data('id');
        DUET.navigate('boards/' + id);
    });



    self.updateCategories();

    this.$element.find('ul.task-list').droppable({
        hoverClass:'drop-hover',
        drop:function(e, ui){
            var $section = $(this),
                task = self.currentTask,
                toDueDate = $section.data('due-date'),
                fromDueDate = ui.draggable.closest('ul').data('due-date');


            if(fromDueDate != toDueDate){
               var data = self.model.moveTaskToNewCategory(task, toDueDate);
                $section.append(ui.draggable.attr('style', ''));

                $.when(data.saving).done(function(){
                    self.setNewDate(ui.draggable, task);
                    self.updateCalendar(task);
                });

               self.updateCategories();
            }
        }
    });

    self.$element.on('click', '.is-task-completed', function (e) {
        var $this = $(this),
            $task = $this.closest('li'),
            task = self.collection.modelsById[$task.data('id')];

        task.toggleComplete();


        if (task.isComplete) {
            self.markTaskComplete($task, true);
        }

        return false;
    });

    self.$element.on('click', '.project-name', function(e){
        var task = getTaskFromHtmlItem($(this).closest('li'));
        DUET.navigate('boards/' + task.projectId);

        e.stopPropagation();
    });

    self.$summaryWidgets.on('click', 'div', function(){
        var $this = $(this),
            tab = $this.data('tab');

        $this.addClass('active').siblings().removeClass('active');


        self.$tabs.removeClass('showing').filter('#agenda-' + tab).addClass('showing');
    });
};

DUET.AgendaView.prototype.setNewDate = function($task, task){
    $task.removeClass('on-schedule overdue at-risk').addClass(task.statusClass).find('.task-due-date').text(task.dueDateHumanized);
    $task.find('.task-status').find('span').text(task.statusText);
    $task.attr('data-date', task.formattedDate); ///.find('span').text(task.statusText);
};

DUET.AgendaView.prototype.updateCategories = function () {
    var self = this;

    if (self.model.today.length > 0) {
        self.$today.addClass('has-tasks');
    }
    else self.$today.removeClass('has-tasks');

    if (self.model.upcoming.length > 0) {
        self.$upcoming.addClass('has-tasks');
    }
    else self.$upcoming.removeClass('has-tasks');

    if (self.model.other.length > 0) {
        self.$other.addClass('has-tasks');
    }
    else self.$other.removeClass('has-tasks');
};

DUET.AgendaView.prototype.postInitProcessing = function(){

    var categories = new DUET.LinkMenuView('agenda');
    DUET.panelTwo.panel.addToPrimaryMenu(categories);

    var activityView = new DUET.ActivityListView(this.model.activity);

    activityView.on('resized', function () {
        DUET.panelTwo.panel.updateScrollbar();
    });

    this.$agendaActivity.append(activityView.$element);

    DUET.bottomNavigation.set({
        template:'main-bottom-buttons',
        active:'agenda'
    });
};
DUET.AgendaView.prototype.postRenderProcessing = function(){
    this.initCalendar();


};

DUET.AgendaView.prototype.initCalendar = function(){
    var self = this;

    var orderedEvents = {};


    if(this.calendar)
        this.calendar('destroy');

    $.each(this.model.tasks.models, function (i, event) {
        var date = event.date, formattedDate;


        event.moment = moment.unix(event.dueDate);


        formattedDate = event.formattedDate;

        if (!orderedEvents[formattedDate]) {
            orderedEvents[formattedDate] = [];
        }

        orderedEvents[formattedDate].push(event);
    });

    this.calendar = $('#calendar-inner').fullCalendar({
        theme: true,
        height:'auto',
        header: {
            left: '',
            center: '',
            right: ''
        },
        editable: true,
        droppable:true,
        drop:function(dayMoment, e, ui){

            var task = self.currentTask;

            self.$currentTask.addClass('saving');
            var saving = self.model.setTaskDueDate(task, dayMoment);

            self.$element.find("#agenda-" + task.dueDateCategory).find('ul').append(self.$currentTask);

            self.updateCategories();

            $.when(saving).done(function(){
                self.setNewDate(self.$currentTask, task);
                self.updateCalendar(task);
                self.$currentTask.removeClass('saving');
            });


        },
        dayRender: function (date, cell) {
            var formattedDate = date.format('MMM DD, YYYY');

            var selector = cell.data('date');


            if (orderedEvents[formattedDate]) {
                cell.addClass('has-event');

                //the cell and the number are two separate html elements and all this function provides is the cell
                self.$element.find('.fc-day-number[data-date=' + selector + ']').addClass('has-event').attr('data-formatted-date', formattedDate);
            }
        }
    });

    //bind calendar events
    this.$element.on('click', '.has-event', function () {
        var formattedDate = $(this).data('formatted-date');
        self.$agendaTasks.addClass('filtered').find('li').removeClass('filter-match').filter('[data-date="' + formattedDate + '"]').addClass('filter-match');
        self.$agendaTasksFilterDate.text(formattedDate);

        var todayMatchNumber = self.$today.find(".filter-match").length;
        var upcomingMatchNumber = self.$upcoming.find(".filter-match").length;
        var otherMatchNumber = self.$other.find(".filter-match").length;


        if(todayMatchNumber == 0){
            self.$today.addClass('no-matches');
        }
        if(upcomingMatchNumber == 0){
            self.$upcoming.addClass('no-matches');
        }

        if(otherMatchNumber == 0){
            self.$other.addClass('no-matches');
        }
    });

    this.$agendaTasks.on('click', '.close', function () {
        self.$agendaTasks.removeClass('filtered').find('.filter-match').removeClass('filter-match');

        self.$today.removeClass("no-matches");
        self.$upcoming.removeClass("no-matches");
        self.$other.removeClass("no-matches");
    });
};

DUET.AgendaView.prototype.updateCalendar = function(task){
    var date = task.formatDate(task.dueDate, 'YYYY-MM-DD');
    var previousDate = task.formatDate(task.previousDate, 'YYYY-MM-DD');
    var previousDateTasks = this.model.tasks.filter({formattedDate:task.previousFormattedDate});


    this.calendar.find('.fc-content-skeleton').find('[data-date="' + date + '"]').addClass('has-event');
    if(!previousDateTasks.length)
        this.calendar.find('.fc-content-skeleton').find('[data-date="' + previousDate + '"]').removeClass('has-event');

}

DUET.NewTaskView = function (taskModel, callback) {
    var self = this,
        data = taskModel instanceof DUET.Model ? taskModel : {},
        submitAction = typeof callback != 'undefined' ? callback : null,
        context = DUET.context(),
        isProject = context.object == 'project' || context.object == 'template',
        projectId = isProject ? context.id : taskModel.projectId,
        isEdit = taskModel instanceof DUET.Model;

    self.projectId = projectId;

    this.domElements = {
        $addNotes: '.add-notes'
    };

    this.initForm({
        name: 'project-task',
        isModal: true,
        title: isEdit ? ut.lang('taskForm.editTask') : ut.lang('taskForm.newTask'),
        data: data,
        submitAction: submitAction
    });

    this.$element.find('[name=due_date_selection]').change(function (event, date) {
        var timestamp = ut.datepicker_to_timestamp($(this).val());
        self.$element.find('[name=due_date]').val(timestamp);
    });

    this.$element.find('[name=project_id]').val(projectId);

    this.loadUsers = self.loadUsers(this);
};

DUET.NewTaskView.prototype = new DUET.FormView();

DUET.NewTaskView.prototype.loadUsers = function (modalForm) {
    var self = this, request;

    function buildSelect() {
        $.each(self.users, function (i, user) {
            modalForm.$element.find('select').append('<option value="' + user.id + '">' + user.first_name + ' ' + user.last_name + '</option>');

        });

        modalForm.$element.find('select').select2();
    }

    //if we don't already have the list of users, we need to get it before we populate the select.
    if (!self.users) {
        request = new DUET.Request({
            url: '/projects/' + self.projectId + '/assignable_users_for_task',
            success: function (response) {
                self.users = response.data;
                buildSelect();
            }
        });
    }
    else buildSelect();

    return request.isComplete;
};

DUET.NewTaskView.prototype.bindEvents = function () {
    DUET.FormView.prototype.bindEvents.apply(this);

    this.$addNotes.on('click', function () {
        var $this = $(this);
        $this.next('.notes-wrapper').css('display', 'block');
        $this.remove();
    });
};


DUET.StartTimerView = function (task) {
    this.template = 'start-timer-popup';
    this.task = task;
    this.initialize();
};

DUET.StartTimerView.prototype = new DUET.View();

DUET.StartTimerView.prototype.bindEvents = function () {
    var self = this;

    this.$element.on('click', '.submit', function () {
        DUET.startTimer(self.task);
    });


};


DUET.NewProjectView = function (project, isModal) {


    this.project = project;

    this.type = 'board';


    this.initializeForm(isModal);

};

DUET.NewProjectView.prototype = new DUET.FormView();

DUET.NewProjectView.prototype.initializeForm = function (isModal) {
    var self = this, formData, isEdit, isModal, title, langKey;

    formData = this.project ? this.project.modelParams() : false;
    isEdit = this.project instanceof DUET.Model;

    isModal = typeof isModal != 'undefined' ? isModal : true;

    this.typeWord = ut.ucFirst(ut.lang('entityNames.' + this.type));

    //get the title text
    langKey = isEdit ? 'projectForm.editProject' : 'projectForm.newProject';
    title = ut.lang(langKey, {type: this.typeWord});


    this.initForm({
        name: 'project',
        isModal: isModal,
        title: title,
        data: formData,
        model: self.project,
        submitAction: function (project) {
            var notification;

            //if this is a new project, we can just navigate to the project page. If this is an existin, we have
            //to force a reload for the page to refresh.
            if (!isEdit)
                DUET.navigate(self.type + 's/' + project.id);
            else DUET.reload();

            //get the notification text
            langKey = isEdit ? 'projectForm.projectEdited' : 'projectForm.projectCreated';
            notification = ut.lang(langKey, {type: this.typeWord});

            DUET.panelTwo.panel.notify(notification);
        }
    });

    this.$element.find('[name=due_date_selection], [name=start_date_selection]').change(function (event, date) {
        var $this = $(this),
            timestamp = ut.datepicker_to_timestamp($(this).val());

        self.$element.find('[name=' + $this.attr('name').slice(0, -10) + ']').val(timestamp);
    });


    if (this.project) {
        $.when(this.loadingClients).done(function () {
            self.populateCurrentValues();
        });
    }
    else {
        //this is a new project, let's auto populate the start date with today's date
        var startDate = moment().unix();

        this.$element.find('[name=start_date]').val(startDate);
        //this.$element.find('[name=start_date_selection]').data('dateinput').setValue(new Date(DUET.Model.prototype.formatDate(startDate, 'MM/DD/YYYY')));
    }
};


DUET.NewTemplateView = function (project, isModal) {
    this.project = project;

    this.type = 'template';

    this.initializeForm(isModal);

    this.$form.attr('data-model', 'template');
};

DUET.NewTemplateView.prototype = DUET.NewProjectView.prototype;

//File Simple Tiles

DUET.FileListSimpleTilesView = function (filesCollection) {
    this.template = 'file-list-simple-tiles';

    var dv = new DocumentViewer(false, {init: false});

    $.each(filesCollection.models, function (i, fileModel) {
        //todo:the type should really be determined on the server, with this as a backup
        //if(!fileModel.type)
        fileModel.type = dv.getDocumentType(fileModel.name);
    });

    this.initialize(filesCollection);

};

DUET.FileListSimpleTilesView.prototype = new DUET.View();

DUET.FileListSimpleTilesView.prototype.bindEvents = function () {
    this.$element.on('click', 'li', function (e) {
        DUET.navigate('boards/' + DUET.context().id + '/files/' + $(this).data('id'));
    });
};


//File Preview List
DUET.FileListTilesView = function (filesCollection) {
    var self = this, queue, queuePosition = 0, queue = [];

    this.needsUnloading();

    self.$element = $('<ul class="files-preview-list"></ul>'); //TODO: This needs to be in a template file

    self.previews = [];

    self.stopLoading = false;

    self.isLoading = false;

    //add each item in the collection to loading queue
    $.each(filesCollection.models, function (i, file) {
        queue.push(file);
    });

    //todo:all of this needs to move to a document gallery plugin
    //todo:Document Gallery needs to have a signle jPlayer instance. The play button, progress bar will not be directly tied to the jPlayer insance, which will be hidden with size = 0
    function buildTiles() {
        for (var i = 0; i < queue.length; i++) {
            buildTile(queue[i]);
        }
    }

    function buildTile(model) {
        var preview = new DUET.FilePreviewView(model);

        self.previews.push(preview);
        self.$element.append(preview.$element);
    }

    function loadFile(i) {
        return self.previews[i].load();
    }

    function loadNext() {
        if (self.stopLoading)
            return false;

        if (queue[queuePosition]) {
            var promise, isLoaded = loadFile(queuePosition);

            self.isLoading = true;

            promise = $.when(isLoaded);
            promise.queuePosition = queuePosition;

            queuePosition++;

            promise.done(function () {
                loadNext();// loadNext();
            });

            promise.fail(function (type) {
                //todo:add this to the preview view
                self.previews[promise.queuePosition].error(type);
                loadNext();
            });
        }
        else {
            self.isLoading = false;
            //end of queue, resize the panel to make sure the scrollbar includes all the content
            DUET.evtMgr.publish('secondaryContentUpdated');
        }
    }

    buildTiles();

    //todo:loading becomes significantly less reliable when we attempt to increase the number of simultaneous loads. If the first item is a pdf, it will not render 90% of the time. Set i = 3 to test
    for (var i = 0; i < 1; i++) {
        loadNext();
    }


    this.bindEvents();

    DUET.evtMgr.subscribe('addFilePreview', function (e, file) {

        //todo:is this event getting fired more than once, switch to tasks then back is it bound twice?
        var fileModel = filesCollection.add(file);

        //todo:shouldn't this happen automatically somewhere? It seems to only happen when load is called. What about doing it in the add function? or when the model is initialized?
        fileModel.prepViewProperties();

        queue.push(fileModel);

        buildTile(queue[queue.length - 1]);

        self.arrangePreviews();

        $.when(fileModel.getFileUrl()).done(function () {
            //todo:getting called too many times...se above todo
            if (!self.isLoading)
                loadNext();
        });

    });
};

DUET.FileListTilesView.prototype = new DUET.View();

DUET.FileListTilesView.prototype.arrangePreviews = function () {
    var self = this;

    self.colCount = 0;
    self.colWidth = 0;
    self.spaceLeft = 0;
    self.margin = 20;
    self.$filePreviews = self.$element.find('.file-list-preview');

    $(window).on('resize.filelistview', function () {

        //todo:is this getting bound more than once because of multiple calls to arrangePreviews?
        self.setupBlocks();
    });

    // Function to get the Min value in Array
    Array.min = function (array) {
        return Math.min.apply(Math, array);
    };

    self.setupBlocks();
};

DUET.FileListTilesView.prototype.setupBlocks = function () {
    var self = this, windowWidth;

    windowWidth = self.$element.width();
    self.colWidth = self.$filePreviews.first().outerWidth();
    self.blocks = [];

    self.colCount = Math.floor(windowWidth / (self.colWidth + self.margin * 2));
    self.spaceLeft = (windowWidth - ((self.colWidth * self.colCount) + self.margin * 2)) / 2;
    self.spaceLeft -= self.margin;

    for (var i = 0; i < self.colCount; i++) {
        self.blocks.push(self.margin);
    }

    self.positionBlocks();
};

DUET.FileListTilesView.prototype.positionBlocks = function () {
    var self = this;

    self.$filePreviews.each(function () {
        var min = Array.min(self.blocks),
            index = $.inArray(min, self.blocks),
            leftPos = self.margin + (index * (self.colWidth + self.margin)),
            $this = $(this);

        $this.css({
            'left': (leftPos + self.spaceLeft) + 'px',
            'top': min + 'px'
        });

        self.blocks[index] = min + $this.outerHeight() + self.margin;
    });
};

DUET.FileListTilesView.prototype.postRenderProcessing = function () {
    this.arrangePreviews();
};

DUET.FileListTilesView.prototype.bindEvents = function () {
    var self = this;

    DUET.evtMgr.subscribe('arrangePreviews', function () {
        self.arrangePreviews();
    });


};

DUET.FileListTilesView.prototype.unloadProcessing = function () {
    var self = this;
    self.stopLoading = true;

    $.each(self.previews, function (i, preview) {
        var $preview = $(preview), $jPlayer, jPlayer;

        if ($preview.data('type') == 'audio') {
            $jPlayer = $preview.find('.jPlayer-container');

            //todo:it seems like instances that are in the middle of being initialized arent destroyed. Turn on jPlayer debuging to test
            if ($jPlayer && $jPlayer.jPlayer)
                $jPlayer.jPlayer('destroy');
        }
    });

    DUET.evtMgr.unsubscribe('messages-panel-showing.fileTileView messages-panel-hidden.fileTileView');
};

//File Line Items
DUET.FileListLineItemsView = function (filesCollection) {
    var dv = new DocumentViewer(false, {init: false});

    $.each(filesCollection.models, function (i, fileModel) {
        //todo:the type should really be determined on the server, with this as a backup
        //if(!fileModel.type)
        fileModel.type = dv.getDocumentType(fileModel.name);
    });

    this.initialize(filesCollection);
};

DUET.FileListLineItemsView.prototype = new DUET.ProjectListView('file');

DUET.FileListLineItemsView.prototype.bindEvents = function () {
    this.$element.on('click', 'li', function (e) {
        DUET.navigate('boards/' + DUET.context().id + '/files/' + $(this).data('id'));
    });
};

//File List
DUET.FileListView = function (filesCollection, project) {

    this.filesCollection = filesCollection;
    //we need to create a wrapper element that will be added to the DOM. The real view (created above), will be added
    //to this wrapper
    this.$element = $('<div class="file-list-view-wrapper"></div>');

    this.project = project;

    this.bindEvents();

    this.needsUnloading();
};

DUET.FileListView.prototype = new DUET.View();

DUET.FileListView.prototype.postRenderProcessing = function () {
    var self = this,
    //used to map the button ids to their corresponding views
        idMap = {
            'line-items-view': 'LineItems',
            'simple-tiles-view': 'SimpleTiles',
            'tiles-view': 'Tiles'
        },
    //used to map the view names to the button ids
        viewNameMap = {
            'SimpleTiles': 'simple-tiles-view',
            'LineItems': 'line-items-view',
            'Tiles': 'tiles-view'
        };


    //set the default file view
    this.generateView();

    if (DUET.userIsAdmin() || DUET.config.allow_client_uploads == true) {
        //create the button to add new files
        var button = new DUET.AddFileButton();
        DUET.panelTwo.panel.addToSecondaryMenu(button.$get());
    }


    //create the buttons to switch between tile and list view

    var $fileViewType = DUET.templateManager.$get('files-view-type');


    $fileViewType.on('click', 'li', function () {
        var buttonId = $(this).attr('id'),
            viewType = idMap[buttonId];

        $(this).addClass('selected').siblings().removeClass('selected');
        self.generateView(viewType);
    });

    //set the default view as the selected view in the buttonSet we just created
    $fileViewType.find('#' + viewNameMap[DUET.config.default_file_view]).addClass('selected');

    //render the button set
    DUET.panelTwo.panel.addToSecondaryMenu($fileViewType);

    if (!this.filesCollection.models.length)
        this.$element.append('<div class="no-activity">' + ut.lang('fileList.noFiles') + '</div>');
};

DUET.FileListView.prototype.generateView = function (type) {
    var self = this,
        viewType;

    //this view is just a wrapper for the different file type views
    //let's create the specific type of file view that needs to be loaded

    if (typeof type == 'undefined')
        type = DUET.config.default_file_view;

    viewType = type || 'Tiles';

    if (DUET.isMobile)
        viewType = 'LineItems';

    this.view = new DUET['FileList' + viewType + 'View'](self.filesCollection);

    //once' the wrapper has been added to the DOM, we insert the view into this wrapper
    this.view.addTo({
        $anchor: self.$element
    });


    DUET.BoardButtonsView('files', self.project);

};

DUET.FileListView.prototype.bindEvents = function () {
    var self = this;

    DUET.evtMgr.subscribe('mobileViewEnabled.fileListView mobileViewDisabled.fileListView', function () {
        self.generateView();
    });
};

DUET.FileListView.prototype.unloadProcessing = function () {
    DUET.evtMgr.unsubscribe('.fileListView');
};




//File preview
DUET.FilePreviewView = function (data) {
    var self = this, size, type,
        dv = new DocumentViewer(false, {init: false});

    this.template = 'file-list-preview';

    this.downloadUrl = 'files/download/' + data.id;

    this.url = false;

    this.file = data;

    this.filename = data.name;

    this.fileId = data.id;

    this.initialize(data);

    this.$inner = this.$element.find('.file-dv');

    //we want to add the type ass a class to the preview so let's get it now
    type = dv.getDocumentType(this.filename);

    size = dv.getSize({
        type: type,
        width: 258
    });

    this.$inner.css(size).addClass(type);

    this.$inner.data('id', this.fileId);


    //todo:this is downloading the entire file to generate previews.
};

DUET.FilePreviewView.prototype = new DUET.View();

DUET.FilePreviewView.prototype.load = function () {
    var self = this,
        size = {},
        dv, type,
        loading = new $.Deferred();

    function generatePreview() {
        //todo:perhaps the next one shouldn't load until the previous one has finished?
        //todo: IMPORTANT. I don't think i need get contents any more since we know exactly where each file will be
        //we need to pass in the type and extension because we're using a dynamic url that does not include the actual filename
        var loadedDeferred = dv.load(self.file.url, {
            type: type,
            extension: dv.getExtension(self.filename),
            useTextLoaderHelper: false,
            height: size.height,
            width: size.width,
            debug: DUET.config.enable_debugging
        });

        if (type == 'image') {
            //if this is an image, we need to reposition the previews once the image is loaded since there is no way to
            //know the height before hand
            //TODO: Can php send the height?
            $.when(loadedDeferred).done(function () {
                self.$element.find('.preview-placeholder').height(self.$element.find('.file-dv').height());

                DUET.evtMgr.publish('arrangePreviews');
            });
        }

        $.when(loadedDeferred).done(function () {
            self.$element.find('.loading-message').remove();
        });

        return loadedDeferred;
    }

    dv = self.$element.find('.file-dv').documentViewer({
        path: 'client/plugins/document-viewer/',
        autoplay: false,
        scrollbar: false,
        showErrors: false,
        debug: DUET.config.enable_debugging
    });

    //todo:create a wrapper function that returns general types not supported by the document viewer, so that we can set classes for the background images (images seen in tile view and while previews are loading)
    type = dv.getDocumentType(self.filename);

    if (!type) {
        loading.reject(ut.lang('fileView.invalidType'));
        return loading;
    }

    self.$element.attr('data-type', type);

    size.width = 258; //TODO: I really don't like explicitly setting sizes here.

    $.when(self.file.getFileUrl()).done(function () {
        //todo:Too many deferreds...How does this relate to the promise in loadNext function?
        var previewPromise = $.when(generatePreview());

        previewPromise.done(function () {
            loading.resolve();
        });

        previewPromise.fail(function () {
            loading.reject();
        });
    });

    return loading;
};

DUET.FilePreviewView.prototype.error = function (errorType) {
    //todo: displaying errors should really be part of the document viewer plugin and error messages are set with config options
    var $error;

    if (!errorType)
        $error = DUET.templateManager.$get('document-viewer-error');
    else $error = DUET.templateManager.$get('document-viewer-unsupported-type');


    this.$element.find('.file-dv').html($error);
};

DUET.FilePreviewView.prototype.bindEvents = function () {
    this.$element.on('click', function (e) {
        if ($(e.target).closest('.file-meta-wrapper').length == 0)
            DUET.navigate('boards/' + DUET.context().id + '/files/' + $(this).find('.file-dv').data('id'));
    });
};

DUET.FileView = function (data) {
    var self = this, dv;

    this.template = 'file';

    this.domElements = {
        $editButton: '.edit-button',
        $deleteButton: '.delete-button',
        $notes: '.notes-content'
    };

    this.initialize(data);

    this.$inner = this.$element.find('.file-dv');

    this.file = data;

    self.needsUnloading();
};

DUET.FileView.prototype = new DUET.View();

DUET.FileView.prototype.postRenderProcessing = function () {

    this.initMenu();

    this.initDocumentViewer();

    //the smart menu creates new dom elements for the buttons. The events are copied over, but this isn't sufficient for
    //the download button. The download button isn't activated until after the file url is retrieved. Since this is
    //asynchronous, the view hasn't attached the download handler when the smart menu is created. If we get the new
    //reference to the dome elements now, the donwload button will be bound correctly
    this.saveReferencesToDomeElements();


};

DUET.FileView.prototype.initDocumentViewer = function () {
    var self = this, dv, loadedDeferred, type, $anchor, width;

    $anchor = this.$inner;

    width = $anchor.width();

    var options = {
        path: 'client/plugins/document-viewer/',
        autoplay: false,
        scrollbar: false,
        showErrors: false,
        setAudioHeight: false,
        width: width,
        debug: DUET.config.enable_debugging
    };


    dv = $anchor.documentViewer(options);

    self.documentViewer = dv;

    //todo:create a wrapper function that returns general types not supported by the document viewer, so that we can set classes for the background images (images seen in tile view and while previews are loading)
    type = dv.getDocumentType(this.file.name);

    $.when(self.file.getFileUrl()).done(function () {

        self.activateDownloadButton();

        loadedDeferred = dv.load(self.file.url, {
            type: type,
            extension: dv.getExtension(self.file.name),
            useTextLoaderHelper: false,
            width: width
        });

        loadedDeferred.fail(function () {
            //todo:i should be able to just pass an error template to the document viewer
            var $error = DUET.templateManager.$get('document-viewer-error');
            self.$element.find('.document-viewer').html($error);
        })
    });
};

DUET.FileView.prototype.bindEvents = function () {
    var self = this;


    //todo:this needs to be throttled. The page will crash if the page is being resized with a drag
    $(window).onThrottled('resize.' + self.id, 500, function () {
        self.resize();
    });


};

DUET.FileView.prototype.resize = function () {
    this.$element.find('.file-dv').off().empty();
    this.initDocumentViewer();
};

DUET.FileView.prototype.activateDownloadButton = function () {
    var self = this;

    self.$downloadButton.off();
    self.$downloadButton.on('click', function (e) {
        self.download();
        e.preventDefault();
    });
};

DUET.FileView.prototype.download = function () {
    var iframe,
        self = this;

    //http://stackoverflow.com/questions/3749231/download-file-using-javascript-jquery
    var hiddenIFrameID = 'hiddenDownloader';
    iframe = document.getElementById(hiddenIFrameID);
    if (iframe === null) {
        iframe = document.createElement('iframe');
        iframe.id = hiddenIFrameID;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }
    iframe.src = DUET.options.server + DUET.options.urlPrefix + self.file.downloadUrl + '/do';
};

DUET.FileView.prototype.unloadProcessing = function () {
    //unbind the window resize event
    $(window).off('.' + this.id);

    DUET.evtMgr.unsubscribe('messages-panel-showing.fileView messages-panel-hidden.fileView');
};

DUET.FileView.prototype.initMenu = function () {
    var self = this;


    if (DUET.userIsAdmin() || DUET.userIsAgent()) {
        this.initAdminMenu();
    }
    else this.initClientMenu();
};

DUET.FileView.prototype.initClientMenu = function () {
    var self = this;
    var downloadButton = new DUET.ButtonView({
        buttonId: 'download-file',
        buttonText: 'Download', //todo:lang
        buttonType: 'main-action'
    });


    this.$downloadButton = downloadButton.$element;

    DUET.panelTwo.panel.addToSecondaryMenu(downloadButton.$element);


    var discussButton = new DUET.ButtonView({
        buttonId: 'discuss-file',
        buttonText: 'Discuss', //todo:lang

    });

    discussButton.setAction(function () {
        DUET.navigate('boards/' + self.model.projectId + '/files/' + self.model.id + '/discussion');
    });


    DUET.panelTwo.panel.addToSecondaryMenu(discussButton.$element);
};

DUET.FileView.prototype.initAdminMenu = function () {
    var self = this;


    var dropdownButton = new DUET.DropdownButtonView('More', [
        {id: 'edit-notes', text: 'Edit Notes'},
        {id: 'delete-file', text: 'Delete', class: 'danger'}

    ], {classes:'hide-on-mobile'});


    dropdownButton.setAction('#edit-notes', function () {

        var notesForm = new DUET.FormView({
            name: 'edit-file-notes',
            title: ut.lang('fileView.editNotes'),
            model: self.file,
            data: self.file.modelParams(),
            isModal: true
        });

        self.file.once('saved', function () {
            self.$notes.text(self.file.notes);
        });

        e.preventDefault();
    });


    dropdownButton.setAction('#discuss-file', function () {
        DUET.navigate('boards/' + self.model.projectId + '/files/' + self.model.id + '/discussion');

    });

    dropdownButton.setAction('#delete-file', function () {
        DUET.confirm({
            actionName: ut.lang('fileView.deleteFile'),
            message: ut.lang('fileView.deleteFileConfirmation'),
            callback: function () {
                var projectId = self.file.projectId,
                    isDeleted = self.file.delete();
                //todo:this isn't going towork, dile.elete does not return a deferred, use file.once
                $.when(isDeleted).done(function () {
                    DUET.navigate('boards/' + projectId + '/files');
                });

                return isDeleted;
            }
        });



    });


    var downloadButton = new DUET.ButtonView({
        buttonId: 'download-file',
        buttonText: 'Download', //todo:lang
        buttonType: 'main-action hide-on-mobile'
    });


    this.$downloadButton = downloadButton.$element;

    DUET.panelTwo.panel.addToSecondaryMenu(downloadButton.$element);

    DUET.panelTwo.panel.addToSecondaryMenu(dropdownButton.$element);
};


//Add File Button
DUET.AddFileButton = function (opts) {
    var self = this;

    this.options = opts || {};

    this.context = this.options.context || DUET.context();

    //we can either pass in an existing jquery element for the button or we can create it
    if (!this.options.$element) {
        //the button doesn't exist yet so let's create it
        this.template = this.options.template || 'add-file-button';

        var showIcon = typeof self.options.showIcon !== 'undefined' ? self.options.showIcon : false;

        //build the view, passing in the data
        this.initialize({
            buttonText: self.options.buttonText || ut.lang('addFileButton.defaultButtonText'),
            showIcon: showIcon,
            type: 'new-entity hide-on-mobile'
        });
    }
    else {
        //the button does exist, let's use the existing jquery object
        this.$element = this.options.$element;
    }

    this.modalForm = false;

    //holds a list of the successful file uploads
    this.uploadedFiles = [];

    this.initFileUploadScript();
};

DUET.AddFileButton.prototype = new DUET.View();

DUET.AddFileButton.prototype.initFileUploadScript = function () {
    var self = this,
        numFiles = 0,
        numComplete = 0,
        url = this.options.url || 'server/' + DUET.options.urlPrefix + 'files/upload',
        uploadNotification;

    //todo:this should have a max height with a scrollbar just in case the user tries to upload a ton of files? Or should I just limit the number of simulaneous uploads? Yea, a limit, that's better...
    function createFileProgressBar(filename, id) {
        var $progress = DUET.templateManager.$get('file-progress', {
            fileName: filename,
            id: id
        });

        self.modalForm.$element.prepend($progress);

        return $progress;
    }

    this.jqXHR = {};

    this.numFiles = 0;

    this.numComplete = 0;

    function setProgressBar(data, progress) {
        data.context.find('.progress').find('span').css(
            'width',
            progress + '%'
        ).find('span').html(progress + '%');
    }

    this.$element.find('#fileupload').fileupload({
        dataType: 'json',
        url: url,
        formData: self.context,
        start: function () {
            self.modalForm.$element.addClass('uploading').find('input').remove();
        },
        add: function (e, data) {
            var id = DUET.utils.uniqueId();

            if (self.modalForm == false)
                self.modalForm = self.initModal();

            //create the progress bar, save reference to it
            data.context = createFileProgressBar(data.files[0].name, id);
            data.context.data('id', id);
            self.jqXHR[id] = data.submit();


            self.jqXHR[id].done(function (response) {
                if (response)
                    DUET.evtMgr.publish('addFilePreview', response.data);
            });

            self.numFiles++;
        },
        done: function (e, data) {
            //no need to send an upload notification for a profile pic
            if (!self.options.isProfilePhoto) {
                var fileDetails = {
                    id: data.result.data.id,
                    name: data.result.data.name,
                    project_id: data.result.data.project_id
                };

                self.uploadedFiles.push(fileDetails);
            }

            setProgressBar(data, 100);
            data.context.addClass('complete');
            self.uploadComplete(data);

        },
        progress: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);

            setProgressBar(data, progress);
        },
        progressall: function (e, data) {
            var progress = parseInt(data.loaded / data.total * 100, 10);
            self.modalForm.modal.setTitle('Uploading (' + progress + '%)');
        }
    });
};

DUET.AddFileButton.prototype.uploadComplete = function () {
    var self = this,
        uploadNotification;

    self.numComplete++;

    function reset() {
        //we need to reload the page otherwise the add file button will not function properly anymore
        //DUET.reload();
    }

    function countProperties(obj) {
        var count = 0;

        for (var prop in obj) {
            if (obj.hasOwnProperty(prop))
                ++count;
        }

        return count;
    }

    if (self.numComplete === self.numFiles) {
        self.modalForm.$element.find('#cancel-all').remove();

        setTimeout(function () {
            self.modalForm.close();

            if (self.options.callback)
                self.options.callback();

            //no need to send an upload notification for a profile pic
            if (!self.options.isProfilePhoto) {
                if (self.uploadedFiles.length) {
                    DUET.panelTwo.panel.notify(ut.lang('addFileButton.filesUploadedMessage', {numFiles: self.numFiles}));


                }
            }

            setTimeout(function () {
                reset();
            }, 500);
        }, 1000);
        //todo:there should be a x files uploaded success message (bar notification type?)
    }
};

DUET.AddFileButton.prototype.initModal = function () {
    var self = this;

    function cancel($progressWrapper) {
        var id = $progressWrapper.data('id');

        if (!$progressWrapper.hasClass('complete')) {
            self.jqXHR[id].abort();
            delete self.jqXHR[id];
            $progressWrapper.addClass('cancelled');
            $progressWrapper.find('.status').text(ut.lang('addFileButton.cancelled'));
        }

        self.uploadComplete();
        //todo:notifcation,
    }

    self.modalForm = new DUET.FormView({
        name: 'project-file',
        isModal: true,
        title: ut.lang('addFileButton.modalTitle'),
        data: {}
    });

    if (!self.options.isProfilePhoto)
        self.modalForm.$element.find('[name=project_id]').val(DUET.context().id);

    self.modalForm.$element.on('click', '.cancel', function (e) {
        var $progress = $(this).closest('.progress-bar-wrapper');
        cancel($progress);

        e.preventDefault();
    });

    self.modalForm.$element.find('#cancel-all').click(function (e) {

        //todo:there should be an inline confirmation messages. Are you sure?
        $.each(self.modalForm.$element.find('.progress-bar-wrapper'), function (i, progress) {
            cancel($(progress));
        });

        e.preventDefault();
    });

    //we need to get rid of the default submit handler, it's useless here
    self.modalForm.$element.unbind('submit');

    self.modalForm.$element.submit(function (e) {
        return false;
    });

    return self.modalForm;
};


//Task Details View
DUET.TaskView = function (data, isAlternateTemplate) {
    var self = this, timer, timerInterval, $time;

    this.isAlternateTemplate = true;
    this.template = 'task-details-alternate';

    this.domElements = {
        $tabs: '.tabs',
        $tabsContent: '.tabs-content',
        $attachmentTab: '#task-attachment-tab',
        $attachmentCount: '.attachment-count',
        $attachmentList: '.attachment-list',
        $edit: '#task-edit',
        $delete: '#task-delete',
        $addFile: '#task-add-file',
        $isTaskCompleted: '.is-task-completed',
        $changeTaskWeight: '#change-task-weight',
        $startTimer: '#start-timer',
        $stopTimer: '#stop-timer',
        $inactiveTimer: '#inactive-timer',
        $elapsedTime: '#elapsed-time',
        $timeEntries: '#task-time-entries',
        $enterTime: '#enter-time',
        $userImage: '.user-image',
        $userImageWrapper: '.user-image-wrapper'
    };

    this.paramsToDecode = ['task', 'notes'];


    this.initialize(data);

    this.$element.on('click', 'dd a', function (e) {
        var $this = $(this),
            tab = $this.attr('href');

        $this.parent().addClass('active').siblings().removeClass('active');
        self.$tabsContent.find(tab).addClass('active').siblings().removeClass('active');
        //todo:this needs to update scrollbar because height of content will change
        e.preventDefault();
    });

    this.needsUnloading();


//todo: this generates way too many ajax requests. At least four
};

DUET.TaskView.prototype = new DUET.View();

DUET.TaskView.prototype.initMenu = function () {


    if (DUET.viewCommonParams.userCanCreateTasks) {
        this.initMenuForUserWithEditingPrivileges();
    }
    else this.initMenuForUserWithoutEditingPrivileges();
};

DUET.TaskView.prototype.initMenuForUserWithEditingPrivileges = function () {
    var self = this;

    var button = new DUET.AddFileButton({
        template: 'task-add-file-button',
        buttonText: ut.lang('taskDetails.addFile'),
        context: {
            object: 'task',
            id: self.model.id
        },
        callback: function () {
            //reload the page so that the file appears in the attachments list
            DUET.reload();
        }
    });


    var dropdownButton = new DUET.DropdownButtonView('More', [
        {id: 'add-file-to-task', text: 'Add File', view: button},
        //{id: 'assign-task', text: 'Reassign'},
        //{id: 'change-due-date-task', text: 'Change Due Date'},
        {id: 'delete-task', text: 'Delete', class: 'danger'}
    ]);


    dropdownButton.setAction('#change-due-date-task', function () {
        editTask();
    });
    dropdownButton.setAction('#edit-task', function () {
        DUET.navigate('#projects/' + self.model.projectId + '/invoices/' + self.model.id + '/discussion');
    });

    dropdownButton.setAction('#assign-task', function (dropdownItem, e) {
        var assignTaskView = new DUET.AssignTaskView(self.model, function (user) {
            var data = {
                userLink: '#users/' + user.id,
                userImage: '<img src="' + user.profile_image + '"/>'
            };

            var $userImage = DUET.templateManager.$get('user-image', data);
            self.$userImage.replaceWith($userImage);
            self.$userImage = $userImage;
            popup.close();
        });

        var popup = new DUET.InlinePopupView({
            e: e,
            view: assignTaskView,
            anchor: self.$userImageWrapper,
            positionAtBottom: true,
            closeCallback: function () {
                //$listItem.removeClass('pseudo-hover');
            }
        });
    });

    dropdownButton.setAction('#delete-task', function () {
        DUET.confirm({
            actionName: ut.lang('taskDetails.deleteTaskButton'),
            message: ut.lang('taskDetails.deleteTaskConfirmationMessage'),
            callback: function () {
                var url, deletingTask = self.model.destroy();

                $.when(deletingTask.isComplete).done(function () {
                    if (self.model.projectId)
                        url = 'boards/' + self.model.projectId + '/tasks';
                    else url = 'tasks/x';

                    DUET.navigate(url);
                });

                return deletingTask.isComplete;
            }
        });
    });

    dropdownButton.setAction('#discuss-task', function () {
        DUET.navigate('projects/' + self.model.projectId + '/tasks/' + self.model.id + '/discussion');

    });


    function editTask() {
        var formView = new DUET.NewTaskView(self.model);

        $.when(formView.loadUsers).done(function () {
            formView.populateCurrentValues();
        });

        self.model.once('saved', function () {
            DUET.reload();
        });
    }

    var editButton = new DUET.ButtonView({
        buttonId: 'edit-task',
        buttonText: 'Edit', //todo:lang
        buttonType: 'main-action'
    });


    editButton.setAction(function () {
        editTask();
    });




    if (!this.isAlternateTemplate) {
        DUET.panelTwo.panel.addToSecondaryMenu(editButton);

        DUET.panelTwo.panel.addToSecondaryMenu(dropdownButton);
    }
    else {
        DUET.infoPanel.addToMenu(editButton);

        DUET.infoPanel.addToMenu(dropdownButton);

    }
};
DUET.TaskView.prototype.initMenuForUserWithoutEditingPrivileges = function () {
    var self = this;

    var discussButton = new DUET.ButtonView({
        buttonId: 'discuss-task',
        buttonText: 'Discuss', //todo:lang
        buttonType: 'main-action'
    });

    discussButton.setAction(function () {
        DUET.navigate('projects/' + self.model.projectId + '/tasks/' + self.model.id + '/discussion');

    });

    if (!this.isAlternateTemplate) {
        DUET.panelTwo.panel.addToSecondaryMenu(discussButton);

    }
    else {
        DUET.infoPanel.addToMenu(discussButton);


    }
};
DUET.TaskView.prototype.addTimeEntryToList = function (timeEntry) {
    var $newEntry;

    //add the new entry to the list
    timeEntry.prepViewProperties();
    $newEntry = DUET.templateManager.$get('task-time-entry', timeEntry.modelParams());
    this.$timeEntries.removeClass('hidden').find('.header').after($newEntry);

    this.model.timeEntriesCollection.add(timeEntry);
};

DUET.TaskView.prototype.bindEvents = function () {
    var self = this,
        $time;


    // $time = self.$element.find('#elapsed-time');

    this.$startTimer.on('click', function () {
        DUET.startTimer(self.model, function () {
            self.updateElapsedTime();
        });

        self.startTimerManageViewState();


    });

    this.$stopTimer.on('click', function () {
        var timeEntry = DUET.stopTimer();

        self.addTimeEntryToList(timeEntry);
        self.stopTimerManageViewState();

        self.manageTimeEntriesStatus(true);
    });

    this.$enterTime.on('click', function () {
        new DUET.TaskTimeEntryView(self.model.id, self);
    });

    this.$element.on('click', '.time-entry-delete', function () {
        var $timeEntry = $(this).closest('li');

        //todo: this won't work if the initial time entry save hasn't completed
        DUET.confirm({
            actionName: ut.lang('taskDetails.deleteTimeEntryButton'),
            message: ut.lang('taskDetails.deleteTimeEntryConfirmationMessage'),
            callback: function () {
                var id = $timeEntry.data('id'),
                    deletingTimeEntry = self.model.timeEntriesCollection.modelsById[id].destroy();

                $.when(deletingTimeEntry.isComplete).done(function () {
                    $timeEntry.fadeOut(function () {
                        $timeEntry.remove();
                    });
                });

                return deletingTimeEntry.isComplete;
            }
        });
    });

    this.$edit.on('click', function () {

    });

    this.$delete.on('click', function () {

    });

    this.$isTaskCompleted.on('click', function () {

        self.model.toggleComplete();

        if (self.model.isComplete) {
            self.$element.addClass('complete');
        }
        else {
            self.$element.removeClass('complete');
        }
    });

    this.$changeTaskWeight.on('click', function () {
        new DUET.TaskWeightView(self.model);
    });

    this.$element.on('click', 'h6', function(){
        $(this).toggleClass('showing').next('div').toggleClass('hidden');
    });


    DUET.evtMgr.subscribe('runningTaskTimerStopped.' + this.id, function () {
        self.stopTimerManageViewState();
        //we only want this to happen once.
        DUET.evtMgr.unsubscribe('runningTaskTimerStopped.' + self.id);
    });
};

DUET.TaskView.prototype.updateElapsedTime = function () {

    this.$elapsedTime.html(DUET.runningTimer.generateTimeText());
};

DUET.TaskView.prototype.startTimerManageViewState = function () {
    this.$startTimer.hide();
    this.$stopTimer.show();
    this.$inactiveTimer.hide();
    this.$elapsedTime.show();
};

DUET.TaskView.prototype.stopTimerManageViewState = function () {
    this.$startTimer.show();
    this.$stopTimer.hide();
    this.$inactiveTimer.show();
    this.$elapsedTime.hide();
};

DUET.TaskView.prototype.postInitProcessing = function () {
    var button = new DUET.AddFileButton({
        template: 'task-add-file-button',
        buttonText: ut.lang('taskDetails.addFile'),
        callback: function () {
            //reload the page so that the file appears in the attachments list
            DUET.reload();
        }
    });
    this.$addFile.replaceWith(button.$element);
    this.$addFile = button.$element;
};

DUET.TaskView.prototype.postRenderProcessing = function () {
    this.initMenu();

    this.getTaskFiles();
    this.getTimeEntries();

    if (this.isThisTaskTimerRunning())
        this.bindRunningTimer();
};

DUET.TaskView.prototype.isThisTaskTimerRunning = function () {
    return DUET.runningTimer && DUET.runningTimerView && (DUET.runningTimerView.model.id == this.model.id);
};

DUET.TaskView.prototype.bindRunningTimer = function () {
    var self = this;

    DUET.evtMgr.subscribe('timeChanged.' + this.id, function () {
        self.updateElapsedTime();
    });

    this.startTimerManageViewState();

};

DUET.TaskView.prototype.getTaskFiles = function () {
    var self = this,
        $list;

    $.when(self.model.getFiles()).done(function (request) {

        self.$attachmentCount.text(self.model.files.length);

        if(self.model.files.length > 0){
            $list = DUET.templateManager.$get('task-attachment', {files: self.model.files});

            self.$attachmentList.replaceWith($list);
            self.$attachmentList = $list;
        }
        else self.$attachmentList.remove();

    });
};

DUET.TaskView.prototype.getTimeEntries = function () {
    var self = this,
        $list;

    //todo: this could probably be combined into one request (combine with getFiles)
    $.when(self.model.getTimeEntries()).done(function (request) {
        $list = DUET.templateManager.$get('task-time-entries', {timeEntries: self.model.timeEntries});
        self.$timeEntries.html($list);

        //if (self.model.timeEntries.length)
        //    self.$timeEntries.removeClass('hidden');

        self.manageTimeEntriesStatus();
    });
};

DUET.TaskView.prototype.manageTimeEntriesStatus = function (force) {
    if (this.model.timeEntries.length || force === true)
        this.$element.addClass('has-time-entries');
};
DUET.TaskView.prototype.unloadProcessing = function () {
    DUET.evtMgr.unsubscribe('runningTaskTimerStopped.' + this.id);

    if (DUET.runningTimer)
        DUET.evtMgr.unsubscribe('.' + this.id);

};

DUET.TaskView.prototype.userBasedProcessing = function () {
    if (DUET.userIsClient() && DUET.config.clients_can_create_tasks != 1) {
        this.$tabs.find("a[href=#task-timer-tab]").parent().remove();
        this.$tabsContent.find("#task-timer-tab").remove();
    }
};

//Task Weight
DUET.TaskWeightView = function (taskModel) {
    var self = this;

    this.domElements = {
        $weight: '.task-maximum-weight'
    };

    this.initForm({
        name: 'task-weight',
        title: ut.lang('taskWeightForm.taskWeight'),
        model: taskModel,
        data: taskModel.modelParams(),
        isModal: true,
        submitAction: function () {
            DUET.reload();
        }
    });

    $.when(taskModel.getMaximumWeight()).done(function () {
        self.$weight.html(taskModel.maximumWeight);
        self.$element.find('.notification').fadeOut();
    });
};

DUET.TaskWeightView.prototype = new DUET.FormView();

DUET.TaskWeightView.prototype.processFormValues = function (values) {
    if (!values['weight'])
        values['weight'] = 0;

    return values;
};

//Task Time Entry
DUET.TaskTimeEntryView = function (taskId, taskView) {
    var timeEntry = new DUET.TimeEntry();
    timeEntry.taskId = taskId;

    this.initForm({
        name: 'time-entry',
        title: ut.lang('timeEntryForm.title'),
        isModal: true,
        model: timeEntry,
        submitAction: function () {
            timeEntry.timeComponentsToSecs();
            taskView.addTimeEntryToList(timeEntry);
        }
    });
};

DUET.TaskTimeEntryView.prototype = new DUET.FormView();

DUET.UserDetailsView = function (data) {
    this.template = 'user-details';

    this.domElements = {
        $changePhoto: '#change-photo',
        $image: '.user-image-inner',
        $changePassword: '#change-password-button',
        $sendPassword: '#send-password',
        $editUser: '#edit-user',
        $deleteUser: '#delete-user',
        $userActions: '.user-actions'
    };

    this.paramsToDecode = ['firstName', 'lastName', 'email', 'address1', 'address2', 'clientName'];

    this.initialize(data);
};

DUET.UserDetailsView.prototype = new DUET.View();

DUET.UserDetailsView.prototype.bindEvents = function () {
    var self = this;


};

DUET.UserDetailsView.prototype.postInitProcessing = function () {
    if (this.model.profileImage && this.model.profileImage.length) {
        this.$image.html('<img src="' + this.model.profileImage + '"/>');
    }
};

DUET.UserDetailsView.prototype.userBasedProcessing = function (user) {
    var self = this;

    var addFileButton = new DUET.AddFileButton({
        isProfilePhoto: true,
        buttonText:'Change Photo',
        showIcon:false,
        url: 'server/' + DUET.options.urlPrefix + 'users/set_profile_image',
        callback: function () {
            window.location.reload(true);
        }
    });

    var allButtons = [
        {id: 'change-user-photo', text: 'Change Photo', view: addFileButton},
        {id: 'change-user-password', text: 'Change Password'},
        {id: 'send-user-password', text: 'Send User Password'},
        {id: 'edit-user', text: 'Edit User'},
        {id: 'delete-user', text: 'Delete User', 'class': 'danger'}
    ];

    var buttons = [];

    if (user.id == this.model.id) {
        buttons.push(allButtons[0]);
        buttons.push(allButtons[1]);
    }

    if (DUET.userIsAdmin()) {
        if (user.id != this.model.id)
            buttons.push(allButtons[2]);

        buttons.push(allButtons[3]);
        buttons.push(allButtons[4]);
    }
    else {
        buttons.push(allButtons[3]);
    }


    var dropdownButton = new DUET.DropdownButtonView('Actions', buttons, {
        classes: 'show-indicator'
    });

    dropdownButton.setAction('#change-user-password', function () {
        new DUET.ChangePasswordView();
    });

    dropdownButton.setAction('#send-user-password', function () {
        new DUET.SendPasswordView(self.model);
    });

    dropdownButton.setAction('#edit-user', function () {
        new DUET.NewUserView(self.model);
    });

    dropdownButton.setAction('#delete-user', function () {
        new DUET.DeleteUserView(self.model);
    });


    this.$userActions.append(dropdownButton.$element);

};

DUET.LoginView = function (data) {
    this.template = 'login';

    if (data)
        data['company'] = DUET.companyName;
    else data = {company: DUET.companyName};


    this.domElements = {
        $window: '.login-window',
        $status: '#login-status'
    };

    this.initialize(data);
};

DUET.LoginView.prototype = new DUET.View();

DUET.LoginView.prototype.bindEvents = function () {
    var self = this;

    this.$element.on('submit', 'form', function (e) {
        var form = $(this);

        //clear any status messages that already existed
        self.$status.html('');

        new DUET.Request({
            url: 'app/login',
            data: form.serialize(),
            success: function (response) {
                //     debugger;
                if (response.auth === 'successful_login') {
                    self.$element.remove();
                    //DUET.navigate('dashboard');
                }
            }
        });

        e.preventDefault();
    });
};

DUET.LoginView.prototype.unsuccessfulLogin = function (response) {
    $('#login-status').html('<span class="error-message">' + response.lang.incorrectLogin + '</span>');
};

DUET.LoginView.prototype.postRenderProcessing = function () {
    this.$window.animate({opacity: 1}, 'fast');
};

DUET.DropdownView = function (data, options) {
    this.options = options || {};

    if (this.options.$element)
        this.$element = this.options.$element;

    this.initialize();

    this.$dropdown = this.$element.find('.dropdown-menu');
};

DUET.DropdownView.prototype = new DUET.View();

DUET.DropdownView.prototype.bindEvents = function () {
    var self = this;

    //todo:delete if not using, getBounds too
    function positionWithinBounds() {
        if (!self.options.$within)
            return;

        var dropdownBounds = getBounds(self.$dropdown),
            withinBounds = getBounds(self.options.$within),
            offset = self.$element.offset(),
            difference;

        //adjust the right side if necessary
        difference = dropdownBounds.topRight[0] - withinBounds.topRight[0] + 10;

        if (difference > 0)
            self.$dropdown.css({left: -difference});

    }

    function getBounds($element) {
        var offset = $element.offset(),
            height = $element.height(),
            width = $element.width(),
            bounds = {};

        bounds.topLeft = [offset.left, offset.top];
        bounds.topRight = [offset.left + width, offset.top];
        bounds.bottomLeft = [offset.left, offset.top + height];
        bounds.bottomRight = [offset.left + width, offset.top + height];

        return bounds;
    }

    this.$element.click(function () {
        self.$element.toggleClass('open');
    });
};

DUET.CalendarView = function (data) {

    this.template = 'calendar';

    this.fullCalendar = {};

    this.headerView = false;

    this.domElements = {
        $calendar: '#calendar'
    };

    this.initialize(data);
};

DUET.CalendarView.prototype = new DUET.View();

DUET.CalendarView.prototype.postRenderProcessing = function () {
    var self = this,
        currentPopupView;

    self.headerView = new DUET.CalendarHeaderView(this.$calendar, self.model.taskCollection);
    DUET.panelTwo.panel.addToSecondaryMenu(self.headerView.$get());


    function getTask(id){
        return self.model.taskCollection.get(id);
    }



    this.$calendar.fullCalendar({
        header: false,
        monthNames: self.prepMonthNames(),
        dayNamesShort: self.prepDayNames(),
        firstDay: DUET.config.calendarFirstDay,
        events: self.model.taskCollection.modelParams(),
        eventRender: function (event, element, view) {

            return new DUET.CalendarEventItemView(getTask(event.id)).$element;
        },
        viewRender: function (view) {
            var titleParts = view.title.split(' '), title;

            if (titleParts[titleParts.length - 1] == new Date().getFullYear()) {
                titleParts.pop();
                title = titleParts.join(' ');
            }
            else title = view.title;

            title = DUET.utils.trim(title, ',');

            self.headerView.setTitle(title);
        },
        eventClick: function (event, a, b) {
            //we only want one of these popup views open at a time, so get rid of the provious one if it exists
            if (currentPopupView)
                currentPopupView.unload();

            var context = DUET.context();


            DUET.GoToTask(getTask(event.id));

        },
        dayRender:function(date, cell){
            var date = cell.data('date'),
                tasks = self.model.tasksByDate[date],
                hasTasks = tasks && tasks.length;

            if(hasTasks)
                cell.addClass('has-tasks');
        }
    });

};



DUET.CalendarView.prototype.prepMonthNames = function () {
    var names = ut.lang('calendar.monthNames').split(',');
    $.each(names, function (i, name) {
        names[i] = $.trim(name);
    });

    return names;
};
DUET.CalendarView.prototype.prepDayNames = function () {
    var names = ut.lang('calendar.dayNames').split(',');
    $.each(names, function (i, name) {
        names[i] = $.trim(name);
    });

    return names;
};

DUET.CalendarHeaderView = function (fullCalendar, collection) {
    this.needsUnloading();

    this.template = 'calendar-header';

    this.$calendar = fullCalendar;

    this.taskCollection = collection;

    this.domElements = {
        $next: '.next-date',
        $today: '.today-date',
        $prev: '.prev-date',
        $name: '.date-name',
        $view: '#calendar-view-selector',
        $filters: '.task-filter',
        $myTasks: '#filter-my-tasks',
        $allTasks: '#filter-all-tasks'
    };

    this.initialize();

    //manaually calling becasue this view isn't added with addTo
    this.initSelects();
};

DUET.CalendarHeaderView.prototype = new DUET.View();

DUET.CalendarHeaderView.prototype.bindEvents = function () {
    var self = this;

    function reRender(collection) {
        self.$calendar.fullCalendar('removeEvents');
        self.$calendar.fullCalendar('addEventSource', collection.modelParams());
    }

    this.$next.on('click', function () {
        self.$calendar.fullCalendar('next');
    });

    this.$prev.on('click', function () {
        self.$calendar.fullCalendar('prev');
    });

    this.$today.on('click', function () {
        self.$calendar.fullCalendar('today');
    });

    this.$view.on('change', function () {
        self.$calendar.fullCalendar('changeView', $(this).val());
    });

    this.$myTasks.on('click', function () {
        var collection, filtered;

        filtered = self.taskCollection.filter({assignedTo: DUET.my.id});
        collection = new DUET.Collection({model: 'task'});
        collection.load(filtered);

        reRender(collection);
    });

    this.$allTasks.on('click', function () {
        reRender(self.taskCollection);
    });

    this.$filters.on('click', function (e) {
        $(this).toggleClass('open');
        e.stopPropagation();
    });

    $('html').on('click.task-filter', function () {
        self.$element.removeClass('open');
    });

    this.$filters.on('click', 'li', function () {
        $(this).toggleClass('selected').siblings().removeClass('selected');
    });

};

DUET.CalendarHeaderView.prototype.setTitle = function (title) {
    this.$name.html(title);
};

DUET.CalendarHeaderView.prototype.unloadProcessing = function () {
    $('html').off('click.task-filter');
};

DUET.CalendarEventItemView = function (task) {
    this.template = 'calendar-event-item';

    this.initialize(task);
};

DUET.CalendarEventItemView.prototype = new DUET.View();

DUET.CalendarEventItemView.bindEvents = function () {
    //todo:should bind a single event at the calendar level rather than on each element
};


DUET.HeaderView = function () {
    this.template = 'header';

    this.domElements = {
        $search: '#global-search',
        $runningTimerSpace: '#running-timer-space'
    };

    this.initialize({
        companyName: DUET.config.company_name,
        userName: DUET.my.first_name + ' ' + DUET.my.last_name
    });

    this.$element.find('.user-image').append('<img src="' + DUET.my.image + '"/>');
};

DUET.HeaderView.prototype = new DUET.View();

DUET.HeaderView.prototype.bindEvents = function () {
    var self = this;

    this.$element.on('click', '#logout', function () {
        DUET.navigate('logout');
    });

    this.$search.on('keyup', function (e) {
        var query;

        if (e.which == 13) {
            query = $(this).val();

            if (query.length) {
                //we need to force a reload if the current search is the same as the previous search
                if (DUET.history.fragment != 'search/' + query)
                    DUET.navigate('search/' + query);
                else DUET.reload();
            }

            self.$search.val('');
        }

        e.preventDefault();
    });
};



DUET.ActivityListView = function (activity) {
    var activityCollection;

    this.template = 'activity-list';

    this.domElements = {
        $showAll: '.activity-show-all'
    };

    if (!(activity instanceof DUET.Collection)) {
        activityCollection = new DUET.Collection({model: 'ActivityItem'});
        activityCollection.load(activity);
    }
    else activityCollection = activity;

    this.paramsToDecode = ['activityItems:linkedObjectTitle,objectTitle'];

    this.activityCollection = activityCollection;

    this.initialize(activityCollection);
};

DUET.ActivityListView.prototype = new DUET.View();

DUET.ActivityListView.prototype.postInitProcessing = function () {
    var self = this;

    if (!this.activityCollection.models.length) {
        this.$showAll.replaceWith('<div class="no-activity">' + ut.lang('activityList.noActivity') + '</div>');
    }
    this.$element.find('li:lt(10)').removeClass('hidden');

    //TODO: I would like to do this in the templates, but it will attempt to load images that don't exist src ={{var}}
    this.$element.find('li').each(function () {
        var $this = $(this),
            id = $this.data('id'),
            activityItem = self.activityCollection.modelsById[id];

        DUET.insertProfileImage($this, activityItem);
    });
};


DUET.ActivityListView.prototype.bindEvents = function () {
    var self = this;

    self.$showAll.on('click', function () {
        self.$showAll.text('loading...');
        self.$element.find('li:gt(10)').removeClass('hidden');

        self.$showAll.remove();
        self.publish('resized');
    });

};



DUET.NotesView = function (notesModel, project) {
    this.needsUnloading();

    this.template = 'project-notes';

    this.domElements = {
        $notes: '#notes-content',
        $noNotes: '.no-activity'
    };
  //  this.paramsToDecode = ['notes'];
	if(notesModel.notes)
		notesModel.notes = ut.decode(notesModel.notes);

    this.project = project;

    this.initialize(notesModel);
};

DUET.NotesView.prototype = new DUET.View();

DUET.NotesView.prototype.postRenderProcessing = function () {
    this.manageNoNotesText();

    if (this.model.notes.length)
        this.$notes.html(this.model.notes);

    if (DUET.userIsAdmin())
        DUET.panelTwo.panel.addToSecondaryMenu(this.enableEditorButton());
};

DUET.NotesView.prototype.enableEditorButton = function () {
    var self = this, $button;

    $button = DUET.templateManager.$get('edit-notes-button', {
        buttonText: ut.lang('projectNotes.editNotes')
    });

    $button.on('click', function () {
        self.startEditor();
        $button.replaceWith(self.disableEditorButton());
    });

    return $button;
};

DUET.NotesView.prototype.disableEditorButton = function () {
    var self = this, $button;

    $button = DUET.templateManager.$get('edit-notes-button', {
        buttonText: ut.lang('projectNotes.doneEditing')
    });

    $button.on('click', function () {
        self.model.notes = $.trim(self.editor.getData());

        DUET.panelTwo.panel.notify(ut.lang('projectNotes.saving'), false);

        self.model.once('saved', function () {
            self.editor.destroy();
            $button.replaceWith(self.enableEditorButton());
            DUET.panelTwo.panel.$notification.fadeOut();
        });
        self.model.save();

        self.manageNoNotesText();

    });

    return $button;
};

DUET.NotesView.prototype.startEditor = function () {
    var ckeditorConfig = {};

    if (this.editor)
        this.editor.destroy();

    ckeditorConfig.uiColor = '#ffffff';

    ckeditorConfig.toolbar = [
        {
            name: 'basicstyles',
            items: ['Bold', 'Italic', 'Underline', 'Strike', '-', 'Font', 'FontSize', '-', 'TextColor', 'BGColor']
        },
        {
            name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent',
            '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock']
        },
        {name: 'links', items: ['Link', 'Unlink', 'Anchor']}
    ];

    //todo:add autogrow
    ckeditorConfig.extraPlugins = 'divarea';

    ckeditorConfig.removeButtons = '';

    ckeditorConfig.height = '300px';
    ckeditorConfig.resize_minHeight = 300;


    CKEDITOR.on('instanceReady', function (e) {
        e.editor.resize('100%', 300);
    });
    this.editor = CKEDITOR.replace(this.$notes.get(0), ckeditorConfig);


    this.manageNoNotesText(true);
};

DUET.NotesView.prototype.unloadProcessing = function () {
    if (this.editor)
        this.editor.destroy();
};

DUET.NotesView.prototype.manageNoNotesText = function (startingEditor) {

    //if the editor is showing (or we're about to start it), there is no reason to show the text saying there are no
    //notes
    if (startingEditor == true || this.model.notes.length)
        this.$noNotes.css('display', 'none');
    else {
        this.$noNotes.css('display', 'block');
    }
};

DUET.NotesView.prototype.postInitProcessing = function(){
    DUET.BoardButtonsView('notes', this.project);
};




DUET.NewUserView = function (user) {
    //todo:where is this view used?
    var isEdit = user instanceof DUET.Model,
        data = user || {};

    this.domElements = {
        $showDetails: '#show-form-details',
        $hideDetails: '#hide-form-details'
    };

    this.initForm({
        name: 'user-edit',
        isModal: true,
        title: isEdit ? 'Edit Client' : 'New-- Client', //todo:lang
        data: data,
        submitAction: function (user) {
            DUET.reload();

            //todo:should be taken care of by routing or reload function
            DUET.panelTwo.setContent('client', 'x');
        }
    });

    this.populateCurrentValues();
};

DUET.NewUserView.prototype = new DUET.FormView();

DUET.NewUserView.prototype.bindEvents = function () {
    var self = this;

    DUET.FormView.prototype.bindEvents.apply(this);

    this.$showDetails.on('click', function () {
        self.$element.addClass('showing-details');
    });

    this.$hideDetails.on('click', function () {
        self.$element.removeClass('showing-details');
    });
};
DUET.ArchiveProjectView = function (project) {
    //double confirm the deletion of projects
    DUET.confirm({
        title: ut.lang('archiveProject.title'),
        message: ut.lang('archiveProject.message', {name: project.name}),
        actionName: ut.lang('archiveProject.button'),
        callback: function () {
            DUET.panelTwo.panel.notify(ut.lang('archiveProject.inProgress'), false);
            $.when(project.archive()).done(function () {
                DUET.panelTwo.panel.$notification.fadeOut();
                DUET.reload();
            });
        }
    });
};

DUET.UnarchiveProjectView = function (project) {
    //double confirm the deletion of projects
    DUET.confirm({
        title: ut.lang('unarchiveProject.title'),
        message: ut.lang('unarchiveProject.message', {name: project.name}),
        actionName: ut.lang('unarchiveProject.button'),
        callback: function () {
            DUET.panelTwo.panel.notify(ut.lang('unarchiveProject.inProgress'), false);
            $.when(project.unarchive()).done(function () {
                DUET.panelTwo.panel.$notification.fadeOut();
                DUET.reload();
            });
        }
    });
};

DUET.DeleteProjectView = function (project) {
    //double confirm the deletion of projects
    DUET.confirm({
        title: ut.lang('deleteProject.title'),
        message: ut.lang('deleteProject.message', {name: project.name}),
        actionName: ut.lang('deleteProject.button'),
        callback: function () {
            DUET.confirm({
                title: ut.lang('deleteProject.secondaryTitle'),
                message: ut.lang('deleteProject.secondaryMessage', {name: project.name}),
                actionName: ut.lang('deleteProject.secondaryButton'),
                callback: function () {
                    DUET.panelTwo.panel.notify(ut.lang('deleteProject.inProgress'), false);
                    $.when(project.destroy()).done(function () {
                        DUET.panelTwo.panel.$notification.fadeOut();
                        DUET.navigate('boards', true);
                    });
                }
            });
        }
    });
};

DUET.DeleteTemplateView = function (project) {
    //double confirm the deletion of projects
    DUET.confirm({
        title: ut.lang('deleteTemplate.title'),
        message: ut.lang('deleteTemplate.message', {name: project.name}),
        actionName: ut.lang('deleteTemplate.button'),
        callback: function () {
            DUET.confirm({
                title: ut.lang('deleteTemplate.secondaryTitle'),
                message: ut.lang('deleteTemplate.secondaryMessage', {name: project.name}),
                actionName: ut.lang('deleteTemplate.secondaryButton'),
                callback: function () {
                    DUET.panelTwo.panel.notify(ut.lang('deleteTemplate.inProgress'), false);
                    $.when(project.destroy()).done(function () {
                        DUET.panelTwo.panel.$notification.fadeOut();
                        DUET.navigate('templates');
                    });
                }
            });
        }
    });
};


DUET.SearchResultsFilterView = function () {
    this.template = 'search-results-filter';

    this.initialize();
};

DUET.SearchResultsFilterView.prototype = new DUET.View();


DUET.SearchResultsView = function (data) {
    this.template = 'global-search';

    this.needsUnloading();

    this.domElements = {
        $filter: '.filter-dropdown',
        $noResults: '#no-results-wrapper',
        $search:'#search-box'
    };

    if(data)
        this.paramsToDecode = ['tasks:task,projectName', 'projects:name', 'files:name,projectName'];

    this.initialize(data);


};

DUET.SearchResultsView.prototype = new DUET.View();

DUET.SearchResultsView.prototype.postRenderProcessing = function () {
    var self = this,
        filter = new DUET.SearchResultsFilterView(),
        $filter = filter.$element.find('.filter-dropdown');

    DUET.panelTwo.panel.addToSecondaryMenu(filter);

    DUET.panelTwo.panel.addToPrimaryMenu("&nbsp;");

    $filter.on('click', function (e) {
        $filter.addClass('open');
        e.stopPropagation();
    });

    $filter.on('click', 'li', function () {
        var $this = $(this);

        $this.addClass('selected').siblings().removeClass('selected');
        self.filter($this.data('filter-value'));

    });

    this.$search.on('keyup', function (e) {
        var query;

        if (e.which == 13) {
            query = $(this).val();

            if (query.length) {
                //we need to force a reload if the current search is the same as the previous search
                if (DUET.history.fragment != 'search/' + query)
                    DUET.navigate('search/' + query);
                else DUET.reload();
            }

            self.$search.val('');
        }

        e.preventDefault();
    });

    $('html').on('click.search-filter', function () {
        $filter.removeClass('open');
    });
};

DUET.SearchResultsView.prototype.bindEvents = function () {
    var self = this;

    this.$element.on('click', '.list li', function () {
        var $this = $(this),
            id = $this.data('id'),
            type = $this.data('type'),
            projectId;

        DUET.navigate(self.model.getEntityUrl(type, id));
    });

    //todo:this (filter functionality) needs to be a separate view, it's used 3 times

};

DUET.SearchResultsView.prototype.filter = function (type) {
    var filterType;

    if (type != 'all') {
        var $typeResults = this.$element.find('#search-' + type + '-results');


        if ($typeResults.length)
            $typeResults.css('display', 'block').siblings().css('display', 'none');
        else this.noResults(type);

        filterType = type + 's';

    }
    else {
        this.$element.find('.search-entity').css('display', 'block');
        filterType = 'all';
    }

    DUET.panelTwo.panel.notify(ut.lang('globalSearch.resultsMessage', {type: filterType}));
};

DUET.SearchResultsView.prototype.noResults = function (type) {
    var $message = DUET.templateManager.$get('no-search-results', {type: type});

    this.$noResults.html($message).css('display', 'block');

    //hide any search entities that might be showing
    this.$noResults.siblings().css('display', 'none');
};

DUET.SearchResultsView.prototype.unloadProcessing = function () {
    $('html').off('click.search-filter');
};

DUET.ForgotPasswordView = function () {
    var self = this;

    this.needsUnloading();

    this.initForm({
        name: 'forgot-password',
        submitAction: function () {
            self.$element.addClass('submitted');
        }
    });
};

DUET.ForgotPasswordView.prototype = new DUET.FormView();

DUET.ChangePasswordView = function () {
    this.initForm({
        name: 'change-password',
        title: ut.lang('changePassword.title'),
        isModal: true,
        submitAction: function () {
            DUET.panelTwo.panel.notify(ut.lang('changePassword.passwordChanged'));
        }
    });
};

DUET.ChangePasswordView.prototype = new DUET.FormView();

DUET.SendPasswordView = function (user) {
    this.initForm({
        name: 'send-password',
        title: ut.lang('sendPassword.title'),
        isModal: true,
        data: {userId: user.id},
        submitAction: function () {
            DUET.panelTwo.panel.notify(ut.lang('changePassword.passwordSent'));
        }
    });
};

DUET.SendPasswordView.prototype = new DUET.FormView();

DUET.SettingsView = function (data, tab) {
    this.template = 'admin-settings';

    this.domElements = {
        $newAdmin: '#new-admin-button',
        $buildLanguage: '#build-language-button',
        $deleteInvoice: '#delete-invoice',
        $checkForUpdate: '#check-for-update',
        $tabs: '.nav-tabs',
        $referralForm: '#referral-form',
        $feedbackForm: '#feedback-form',
        $editSetting: '.edit-setting',
        $showMoreTasks:'#show-more-tasks',
        $moreTasks:'#more-tasks',
        $cleanMessages:'#clean-messages',
        $stripMessages:'#strip-messages'
    };

    data.version = DUET.version;

    this.initialize(data);

    if (tab) {
        this.$tabs.find('a[href=#admin-' + tab + ']').parent().addClass('active').siblings().removeClass('active');
        this.$element.find('#admin-' + tab).addClass('active').siblings().removeClass('active');
    }
};

DUET.SettingsView.prototype = new DUET.View();

DUET.SettingsView.prototype.postInitProcessing = function () {
    this.$referralForm.find('textarea').text(DUET.templateManager.$get('referral-text').text());
};

DUET.SettingsView.prototype.bindEvents = function () {
    var self = this,
        alert;


    this.$buildLanguage.on('click', function () {
        alert = DUET.alert(ut.lang('adminSettings.buildingTemplates'), false);

        new DUET.Request({
            url: 'language/rebuild/en',
            success: function (response) {

                if (response.isValid()) {
                    location.reload(true);
                }
                else {

                    alert.close();
                    if (response.data.template)
                        DUET.alert(response.data.template[0]);

                }
            }
        });
    });

    this.$deleteInvoice.on('click', function () {
        new DUET.DeleteInvoiceView();
    });

    this.$checkForUpdate.on('click', function () {
        DUET.checkForUpdates(true);
    });



    this.$referralForm.validator({effect: 'labelMate'}).on('submit', function (e) {
        var self = $(this);

        self.find('.alert').remove();

        if (!e.isDefaultPrevented()) {
            var params = $(this).serializeObject();
            params.type = 'referral';

            $.ajax({
                url: DUET.makeUrl('referralsandfeedback/save'),
                data: params,
                type: 'POST',
                success: function (response) {
                    self.prepend('<div class="alert alert-success">Thank you! You successfully sent a referral to ' + params.email + '. Do you know one more person that could benefit from Duet?</div>');
                },
                error: function () {
                    self.prepend('<div class="alert alert-danger">Oops. There was a problem sending the email. You can send the referral manually using your email or you can check Duet\'s email settings in the config file.</div>');
                    //DUET.displayNotification('Oops. There was a problem sending the email. Please check your email settings in the config file');
                }
            });
            //submit
        }

        e.preventDefault();
    });


    this.$feedbackForm.validator({effect: 'labelMate'}).on('submit', function (e) {
        var self = $(this);

        self.find('.alert').remove();

        if (!e.isDefaultPrevented()) {
            var params = $(this).serializeObject();
            params.type = 'feedback';

            $.ajax({
                url: DUET.makeUrl('referralsandfeedback/save'),
                data: params,
                type: 'POST',
                success: function (response) {
                    self.prepend('<div class="alert alert-success">Thank you! Your feedback was successfully sent.</div>');
                },
                error: function () {
                    self.prepend('<div class="alert alert-danger">Oops. There was a problem sending your feedback. You can send the feedback manually using your email or you can check Duet\'s email settings in the config file.</div>');
                    //DUET.displayNotification('Oops. There was a problem sending the email. Please check your email settings in the config file');
                }
            });
        }

        e.preventDefault();
    });

    this.$editSetting.on('click', function () {
        var $this = $(this).closest('li');
        new DUET.ChangeSettingView({
            name: $this.data('setting'),
            description: $this.data('description'),
            info:$this.data('info'),
            type: $this.data('type'),
            value: $this.data('value')
        });
    });

    this.$showMoreTasks.on('click', function(){
        self.$moreTasks.addClass('showing');
        self.$showMoreTasks.remove();
    });

    this.$cleanMessages.on('click', function(){
        alert = DUET.alert(ut.lang('adminSettings.cleaningMessages'), false);

        new DUET.Request({
            url:'discussion/clean_old',
            success:function(){
                alert.close();
            }
        })
    });

    this.$stripMessages.on('click', function(){
        alert = DUET.alert(ut.lang('adminSettings.cleaningMessages'), false);

        new DUET.Request({
            url:'discussion/remove_special_characters',
            success:function(){
                alert.close();
            }
        })
    });
};

DUET.SettingsView.prototype.postRenderProcessing = function(){
   var self = this;

    var menu = new DUET.LinkMenuView('general', {template:"settings-menu"});
    DUET.panelTwo.panel.addToPrimaryMenu(menu);

    menu.$element.on('click', 'a', function (e) {
        var $this = $(this),
            section = $this.attr('href');

        $this.parent().addClass('active').siblings().removeClass('active');

        self.$element.find(section).addClass('active').siblings().removeClass('active');
        e.preventDefault();
    });
};
DUET.AdminSettingsView = function () {
};


DUET.ChangeSettingView = function (data) {

    var setting = new DUET.ConfigSetting(data);


    this.initForm({
        name: 'change-setting',
        data: setting,
        model: setting,
        isModal: true,
        allowEmptyValues:true,
        submitAction: function () {
            DUET.reload();
            DUET.notify('Settings updated');
        }
    });

    if (setting.isBoolean === true) {
        if (data.value == 1)
            this.$element.find(['[value=1]']).attr('checked', 'checked');
        else this.$element.find(['[value=0]']).attr('checked', 'checked');
    }
    else {
        this.$element.find('[type=text], [type=number]').val(data.value);
    }
};

DUET.ChangeSettingView.prototype = new DUET.FormView();



//List
DUET.ListView = function (data, map, selectedId) {

    var self = this, listClass;

    this.map = map;

    this.selectedId = selectedId;

    this.template = 'list';

    this.modelType = data.model.toLowerCase();

    if ($.inArray(this.modelType, ['project', 'task', 'invoice']) == -1) {
        listClass = 'no-status';
    }

    data.models = $.map(data.models, function (item, key) {
        var mappedItem = {};

        $.extend(mappedItem, item.modelParams());

        if (self.map) {
            $.each(self.map, function (key, value) {
                if (item[value])
                    mappedItem[key] = item[value];
            });
        }
        else DUET.utils.debugMessage('List View: no map found for ' + item.type);


        mappedItem.id = item.id;
        mappedItem.statusText = item.statusText;

        return mappedItem;
    });

    this.paramsToDecode = ['listItems:title,meta1,meta2'];

    this.initialize({listItems: data.models, listClass: listClass});

    self.collection = data;

};

DUET.ListView.prototype = new DUET.View();

DUET.ListView.prototype.postRenderProcessing = function () {
    if (this.selectedId)
        this.setSelected(this.selectedId);

    this.$element.nanoScroller();
};

DUET.ListView.prototype.bindEvents = function () {
    var self = this;

    self.$element.on('click', 'li', function () {
        DUET.navigate(self.modelType + 's/' + $(this).data('id'));
    });

    $(window).on('resize.listview', function () {
        self.$element.nanoScroller();
    });
};

DUET.ListView.prototype.unloadProcessing = function () {
    $(window).off('resize.listview');
};

DUET.ListView.prototype.setSelected = function (idOrItem) {
    var self = this, $listItem;

    if (idOrItem instanceof jQuery)
        $listItem = idOrItem;
    else $listItem = self.$element.find('[data-id=' + idOrItem + ']');
    //TODO: I'm going to need to make sure the selected item is in view and if not, scroll

    self.$element.find('.selected').removeClass('selected');
    $listItem.addClass('selected');
};

DUET.PanelLoadingView = function () {
    this.template = 'panel-loading';

    this.initialize();
};

DUET.PanelLoadingView.prototype = new DUET.View();

DUET.NoSelectionView = function () {
    this.template = 'panel-no-selection';

    this.initialize();
};

DUET.NoSelectionView.prototype = new DUET.View();




DUET.RunningTimerView = function (taskModel) {
    //todo: when we leave a task and navigate back, then click the timer tab, the timer should sync with the running timer view
    this.template = 'running-timer';

    this.domElements = {
        $elapsed: '.timer-elapsed',
        $stop: '.timer-stop',
        $timerTask: '.timer-task'
    };

    this.initialize(taskModel);

    this.addTo({
        $anchor: DUET.panelTwo.$runningTimerSpace
    });
};

DUET.RunningTimerView.prototype = new DUET.View();

DUET.RunningTimerView.prototype.setTime = function (time) {
    this.$elapsed.html(time);
};

DUET.RunningTimerView.prototype.bindEvents = function () {
    var self = this;

    this.$timerTask.on('click', function () {
        DUET.navigate(self.model.url());
    });

    this.$stop.on('click', function (e) {
        DUET.runningTimer.stop();

        DUET.runningTimer = null;
        DUET.runningTimerView = null;


        self.blink(self.$elapsed, 3, function () {
            self.$element.fadeOut(400, function () {
                self.unload();

                DUET.evtMgr.publish('runningTaskTimerStopped');
            });
        });




    });
};

DUET.RunningTimerView.prototype.blink = function ($el, times, callback) {
    var self = this;

    //hide the el
    $el.css('opacity', 0);

    //wait 300 ms then show the el
    setTimeout(function () {
        $el.css('opacity', 1);

        //if we're still blinking wait 300ms before hiding the el again
        if (times > 0) {
            setTimeout(function () {
                self.blink($el, times - 1, callback);
            }, 300);
        }
        else setTimeout(callback, 300);
    }, 300);

    //callback();
};

DUET.NewProjectFromTemplateView = function (templateModel) {
    this.initForm({
        name: 'new-project-from-template',
        isModal: true,
        title: ut.lang('newProjectFromTemplateForm.title'),
        data: templateModel.createProject(),
        submitAction: function (project) {

        }
    });
};

DUET.NewProjectFromTemplateView.prototype = new DUET.FormView();

DUET.NewProjectFromTemplateView.prototype.postInitProcessing = function () {
    var self = this,
        form = new DUET.NewProjectView(this.model, false);
    this.$element.find('#template-project-form').append(form.$element);
    form.model.on('saved', function (e, response) {
        //todo:huge hack, getting errors on ckeditor and with primary list loading if I remove this.
        setTimeout(function () {
            DUET.navigate('projects/' + response.data);
            self.close();
        }, 1000);

    });


};





DUET.UserQuickAccessPanel = function () {
    this.template = 'user-quick-access-panel';

    this.domElements = {
        $changePhoto: '#change-photo',
        $image: '.user-image-inner',
        $changePassword: '#change-password',
        $sendPassword: '#send-password',
        $editUser: '#edit-user',
        $deleteUser: '#delete-user'
    };

    this.initialize(DUET.my);
};

DUET.UserQuickAccessPanel.prototype = new DUET.View();

DUET.UserQuickAccessPanel.prototype.postInitProcessing = function () {
    this.$element.find('.user-image').append('<img src="' + DUET.my.image + '"/>');
};

DUET.UserQuickAccessPanel.prototype.bindEvents = function () {
    var self = this;

    var button = new DUET.AddFileButton({
        isProfilePhoto: true,
        $element: self.$element.find('#quick-access-change-photo'),
        url: 'server/' + DUET.options.urlPrefix + 'users/set_profile_image',
        callback: function () {
            window.location.reload(true);
        }
    });

    //  this.$element.append(button.$element);
    this.$changePassword.on('click', function (e) {
        new DUET.ChangePasswordView();
        e.preventDefault();
    });
};



DUET.InlinePopupView = function (options) {
    this.template = 'inline-popup';

    this.$anchor = $(options.anchor);

    this.creationEvent = options.e;

    this.view = options.view;

    this.positionAtBottom = options.positionAtBottom;

    this.closeCallback = options.closeCallback;

    this.selectOptions = this.view.selectOptions;

    //we're keeping track of whether this anchor has a popup already. if it does, we don't want to create another one
    if (this.$anchor.data('has-popup')) {
        this.unload();
        return;
    }

    this.initialize();

    this.addTo({
        $anchor: $('body'),
        position: 'append'
    });
};

DUET.InlinePopupView.prototype = new DUET.View();

DUET.InlinePopupView.prototype.postRenderProcessing = function () {
    var self = this, positionElement, positionAt;

    this.$anchor.data('has-popup', true);

    positionElement = 'center bottom';
    positionAt = 'center top';

    if (this.positionAtBottom === true) {
        positionElement = 'center top';
        positionAt = 'center bottom';
        self.$element.addClass('bottom');
    }
    //jQuery position will not position the element correctly if the call isn't wrapped in a setTimeout.
    //see here for the most likely explanation: http://stackoverflow.com/questions/779379/why-is-settimeoutfn-0-sometimes-useful
    //Do not delete this setTimeout unless you would like to spend another 2-3 hours debugging the positioning issue
    setTimeout(function () {
        self.$element.position({
            my: positionElement,
            at: positionAt,
            of: self.$anchor,
            collision: "fit"
        });

        self.$element.addClass('showing');
    }, 5);


    this.view.addTo({$anchor: this.$element});


};

DUET.InlinePopupView.prototype.bindEvents = function () {
    var self = this;

    $('html').on('click.' + self.id, function (e) {
        //the click event that creates this popop will end up closing the popup immediately if we don't do this check
        //This is because we're binding this handler before the original click event has propagated up to html
        if (e.timeStamp != self.creationEvent.timeStamp)
            self.close();
    });

    //make sure the popup isn't closed when we click within it.
    this.$element.on('click', function (e) {
        e.stopPropagation();
    });

    //we dont' want the popup thats showing to be closed if we re-click the anchor
    this.$anchor.on('click.' + this.id, function (e) {
        e.stopPropagation();
    });

    //close the popup if hte window is resized
    $(window).on('resize.' + this.id, function () {
        self.close();
    });

    this.$element.on('click', '.cancel, .submit', function (e) {
        self.close();
    });
};

DUET.InlinePopupView.prototype.unloadProcessing = function () {
    $(window).off('.' + this.id);
    $('html').off('click.' + this.id);
    this.$anchor.off('click.' + this.id);
    this.$anchor.data('has-popup', false);
    this.$anchor = false;
};

DUET.InlinePopupView.prototype.close = function () {
    this.view.unload();
    this.unload();

    if (this.closeCallback)
        this.closeCallback();
};






DUET.PageProgressView = function () {
    this.template = 'page-progress';

    this.domElements = {
        $bar: '.bar'
    };
    this.initialize();
};

DUET.PageProgressView.prototype = new DUET.View();

DUET.PageProgressView.prototype.bindEvents = function () {
    var self = this,
        timeout;

    DUET.evtMgr.subscribe('requestProgress', function (e, progress) {
        //if(timeout)
        //    clearTimeout(timeout);
        if (progress == 1) {

            setTimeout(function () {
                self.$element.removeClass('showing');
            }, 500);
        }
        setTimeout(function () {
            self.$bar.width(progress * 100 + '%');
        }, 1000);
        self.$element.addClass('showing');

    });
};


DUET.insertProfileImage = function ($element, model) {
    if (model && model.userImage && model.userImage.length) {
        var $imgLink = $element.find('.user-image').append('<img src="' + model.userImage + '"/>');

        if (model.userId != 0)
            $imgLink.attr('href', '#users/' + model.userId);
    }
};

DUET.startTimer = function (task, timeChangeCallback) {

    function startTimer() {
        DUET.runningTimerView = new DUET.RunningTimerView(task);

        DUET.runningTimer = new DUET.Timer(task, function () {
            var timeText = DUET.runningTimer.generateTimeText();


            DUET.runningTimerView.setTime(timeText);
            if (timeChangeCallback)
                timeChangeCallback(timeText);
        });

        DUET.runningTimer.start();

        DUET.evtMgr.publish('timerStarted');

    }

    if (DUET.runningTimer)
        DUET.alert(ut.lang('taskDetails.timerAlreadyRunning'));
    else startTimer();
    // $time = self.$element.find('#elapsed-time');


//    this.$stopTimer.on('click', function () {
//        DUET.runningTimer.stop();
//
//        self.addTimeEntryToList(DUET.runningTimer.timeEntry);
//
//        DUET.runningTimerView.unload();
//
//        self.stopTimerManageViewState();
//
//        DUET.runningTimerView = null;
//        DUET.runningTimer = null;
//    });
};

DUET.stopTimer = function () {
    var timeEntry = DUET.runningTimer.timeEntry;

    DUET.runningTimer.stop();


    DUET.runningTimerView.unload();


    DUET.runningTimerView = null;
    DUET.runningTimer = null;



    return timeEntry;
};

DUET.HelpView = function(){
   // this.template = 'help';
    var self = this;

    this.domElements = {
        $contact:'#contact-us-button'
    };
    this.initForm({
        name:'help',
        submitAction:function(model){
            if(model.sent == 1){
                self.$element.addClass('contact-sent');
                self.$element.find('span.user-email').text(model.email);
            }
            else {
                self.$element.addClass('contact-error');
                self.$element.find('div.user-message').text(model.message);
            }

        }
    });
};

DUET.HelpView.prototype = new DUET.FormView();

DUET.HelpView.prototype.bindEvents = function(){
    var self = this;
    DUET.FormView.prototype.bindEvents.apply(this);
    this.$contact.on('click', function(){
        self.$element.addClass('contact');
    });
};

DUET.FinishSetupView = function(){
    this.template = 'finish-setup';

    this.initialize();
};

DUET.FinishSetupView.prototype = new DUET.View();

DUET.BottomNavigationView = function(){
    this.template = 'bottom-navigation';

    this.initialize();
};

DUET.BottomNavigationView.prototype = new DUET.View();

DUET.BottomNavigationView.prototype.set = function(params){
    var template, data, active;

    template = params.template;
    data = params.data;
    active = params.active;

    var $template = DUET.templateManager.$get(template, data);

    $template.find('.' + active + '-button').addClass('active');

    this.$element.html($template);
};



//TODO: this shouldn't be here...
$(function () {
    DUET.start();
});