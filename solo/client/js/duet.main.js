var DUET = DUET || {};

DUET.config = {};

DUET.panelOne = {};

DUET.panelTwo = {};

DUET.sidebar = {};

DUET.layoutMgr = {};

DUET.options.defaultProjectTab = 'details';

DUET.$appWrapper = false;

DUET.$window = false;


//todo:is this used? we have addTo...
DUET.addView = function (options) {

    var view = new DUET[options.view](options.data);

    options.$anchor.append(view.$get());

    if (view.postRenderProcessing)
        view.postRenderProcessing();
};


DUET.ContextManager = function () {
    var context;

    DUET.router.on('all', function () {
        var fragmentParts, modelType, modelId, secondaryModelType, secondaryModelId, additionalContextData;

        fragmentParts = DUET.history.fragment.split('/');

        modelType = fragmentParts[0];

        //if this is actually a model, it will be plural, we need to remove the s
        if (modelType.slice(-1) == 's')
            modelType = modelType.slice(0, -1);

        modelId = fragmentParts[1];

        //if there is a secondary model, then the secondary model is the context
        //i.w. projects/2/files/4 would yield a context of file, 4
        if (fragmentParts[2] && fragmentParts[3]) {
            secondaryModelType = fragmentParts[2].slice(0, -1);
            secondaryModelId = fragmentParts[3];

            if (modelType == 'project') {
                additionalContextData = {projectId:fragmentParts[1]};
            }

            DUET.context(secondaryModelType, secondaryModelId, additionalContextData);
        }
        else if (modelId) {
            //there is no secondary model, so the primary model is the context
            DUET.context(modelType, modelId, null);
        }
        else {
            DUET.context(null, null);
            //the url is in the format '#projects' a list with no specific model id, and therefore no context
        }


    });

    DUET.history.on('beforeRoute', function () {
        //DUET.clearContext();
    });
};

/****************************************
 Modules
 ****************************************/
//Base Module
//todo:get rid of this in favor of views
DUET.Module = function () {
    this.cssSelectors = {};

    this.$element = {};

    this.evtMgr = DUET.evtMgr;


};

DUET.Module.prototype.cssSelector = function (selectorName) {
    var self = this;

    if (self.cssSelectors[selectorName])
        return self.cssSelectors[selectorName];
    else return false;
};

DUET.Module.prototype.cssClass = function (selectorName) {
    var self = this;

    if (self.cssSelectors[selectorName])
        return self.cssSelectors[selectorName].substr(1);
    else return false;
};

DUET.Module.prototype.initialize = function () {
    if (this.load)
        this.load();

    if (this.render)
        this.render();
};

DUET.Module.prototype.debugMessage = function () {
    DUET.utils.debugMessage.apply(this);
};

DUET.Module.prototype.run = function (callback) {
    DUET.utils.run.apply(this, arguments);
};

//Layout Module
DUET.LayoutManager = function () {
    var self = this,
        state, sel, c,
        $domWindow, $appWrapper, $appWindow, $sidebar, verticalMargin, horizontalMargin, headerHeight = 0;

    //the css selectors used by the layout manager
    this.cssSelectors = {
        sidebar:'#sidebar',
        appWindow:'.window'
    };

    //maintains the state of each of the layout components
    state = {
        sidebarWidth:0 //TODO: used?
    };

    //quick access to the cssSelector and cssClass functions
    sel = self.cssSelector.bind(this);

    init_base_layout();

    //save references to each of the dom elements required to manage the layout
    $appWrapper = $('#app-wrapper');
    $domWindow = $(window);
    $appWindow = $(sel('appWindow'));
    $sidebar = $(sel('sidebar'));

    var sidebarWidth = $sidebar.width();

    function initialize() {
        state.sidebarWidth = $sidebar.width();

        verticalMargin = parseInt($appWindow.css('margin-top'), 10) + parseInt($appWindow.css('margin-bottom'), 10);
        headerHeight = $('#header-wrapper').height();
        horizontalMargin = parseInt($appWindow.css('margin-left'), 10) + parseInt($appWindow.css('margin-right'), 10);
        resize();

        $appWindow.animate({'opacity':1});
    }

    function init_base_layout() {
        DUET.$appWrapper = DUET.templateManager.$get('base-layout');
        DUET.$window = DUET.$appWrapper.find('.window');
        $('body').append(DUET.$appWrapper);
    }

    function resize() {
        var height = $domWindow.height() - verticalMargin - headerHeight;
        $appWindow.height(height); //.width($domWindow.width() - sidebarWidth - horizontalMargin);
        $sidebar.height(height);
    }

    function applyTheme(){
        $appWrapper.addClass(DUET.config.theme);
    }


    //event handlers
    $domWindow.resize(resize);

    DUET.evtMgr.subscribe('slideOutPanelOpen', function () {
        DUET.panelTwo.panel.disableInteraction();
        $appWrapper.addClass('slide-out-panel-open');
    });

    DUET.evtMgr.subscribe('slideOutPanelClosed', function () {
        DUET.panelTwo.panel.enableInteraction();
        $appWrapper.removeClass('slide-out-panel-open');
    });

    initialize();

    return{
        resize:resize,
        applyTheme:applyTheme
    }
};


DUET.LayoutManager.prototype = new DUET.Module();

DUET.mobileManager = function () {
    var menuShowing = false,
        $appWrapper = $('#app-wrapper'),
        $sidebar = $('#sidebar'),
        $mobileMenuButton = $('#mobile-menu-button'),
        $html = $('html');

    function showMenu() {
        menuShowing = true;
        $appWrapper.addClass('mobile-menu-showing');
    }

    function hideMenu() {
        menuShowing = false;
        $appWrapper.removeClass('mobile-menu-showing');
    }

    function bindMobileEvents() {
        clearMobileEvents();


        $sidebar.on('click.mobile', 'a', function(){
            hideMenu();
        });

        $mobileMenuButton.on('click.mobile', function (e) {

            if (!menuShowing) {
                showMenu();
            }
            else {
                hideMenu();
            }

            e.stopPropagation();
            //$appWrapper.toggleClass('mobile-menu-showing');
        });

        $html.on('click.mobile', function (e) {
            var $target = $(e.target);

            if (menuShowing && !$target.is('#sidebar') && $target.closest('#sidebar').length == 0)
                hideMenu();
        });
    }

    function clearMobileEvents() {
        //unbind previous mobile handlers if they exist
        $appWrapper.off('.mobile');
        $mobileMenuButton.off('.mobile');
        $sidebar.off('.mobile');
        $html.off('.mobile');
    }

    function clearMobileEventsAndConfig() {
        clearMobileEvents();
        hideMenu();
    }

    function isMobileScreenSize() {
        var oldValueForIsMobile = DUET.isMobile;

        DUET.isMobile = $(window).width() <= 1024;

        if (DUET.isMobile && oldValueForIsMobile == false) {
            DUET.evtMgr.publish('mobileViewEnabled');
        }

        if (!DUET.isMobile && oldValueForIsMobile == true) {
            DUET.evtMgr.publish('mobileViewDisabled');
        }


        return DUET.isMobile;
    }


    //need to set the initial value on load
    if(isMobileScreenSize())
        bindMobileEvents();

    $(window).onThrottled('resize', 500, function () {
        if (isMobileScreenSize())
            bindMobileEvents();
        else clearMobileEventsAndConfig();
    });
};


//TODO: ALl of these are views (button, button set, list) not modules. A module is a collection of views that work together for some purpose

//Button //todo:this should be a veiw
DUET.Button = function (options) {
    this.options = options;

    this.buttonText = options.buttonText; //Make sure there is consistency in there I am setting these values, constructor or load? Perhaps load funciton is replaced entirely by a model?

    this.buttonType = this.options.buttonType || 'flat-button';

    this.buttonId = options.buttonId;

    this.initialize();
}; //TODO: Should I combine button and button set? They are extremely similar in terms of the code that was written

DUET.Button.prototype = new DUET.Module();

DUET.Button.prototype.render = function () {
    var self = this;

    self.$element = DUET.templateManager.$get('button', {
        buttonId:self.buttonId,
        buttonType:self.buttonType,
        buttonText:self.buttonText
    });
};

DUET.Button.prototype.setAction = function (action) {
    var self = this;

    self.$element.click(function () {
        self.run(action, this);
    });

    if (self.options.action)
        this.setAction(self.options.action);
};

/****************************************
 Panel Managers
 ****************************************/
DUET.PanelManager = function () {
    this.anchor = $('.window');

    this.content = $();

    this.actions = [
        {panelAction:'+', actionUrl:'#'}
    ];

    this.panel = {};

    this.cssSelectors = {};
};

DUET.PanelManager.prototype.buildPanel = function () {
    var self = this;

    self.panel = new DUET.PanelView({
        id:self.id,
        isPrimary:self.isPrimary,
        type:self.isPrimary ? '' : 'secondary',
        title:self.title,
        anchor:self.anchor,
        content:self.content, //TODO: Where is this getting set?
        actions:self.actions
    });

    self.panel.$element.appendTo(self.anchor);
};


//Secondary Panel
DUET.SecondaryPanelManager = function () {
    var self = this, sel, c;

    this.isPrimary = false;

    this.id = 'panel-two';

    this.title = '';

    this.anchor = $('.window');

    this.content = $();

    this.$actions = false;

    this.$actionsWrapper = false;

    this.panel = {};

    //this panel may be based on a specific item(i.e. a project)
    this.item = {};

    this.itemCategories = false;

    this.$runningTimerSpace = false;
    this.$panelInfo = false;
    this.noSelectionView = new DUET.NoSelectionView();

    this.setContent = function ($content) {
        self.panel.hideNotification();

        //todo:this is a hack and shouldn't be here. We just want the infoPanel to close when the route changes
        DUET.infoPanel.hide();

        self.panel.setContent($content);

    };

    this.loading = function () {
        self.panel.notify('Loading', false);
    };

    this.setInnerContent = function ($content) {
        self.panel.hideNotification();
        self.panel.setInnerContent($content);

        //todo:this is a hack and shouldn't be here. We just want the infoPanel to close when the route changes
        DUET.infoPanel.hide();
    };

    this.setTitle = function (title) {
        self.panel.$title.text(DUET.utils.html_entity_decode(title));
    };

    //todo:consider using DUET.context instead of storing reference to the model
    this.setModel = function (model) {
        self.model = model;
    };

    this.setTitleWidget = function (view) {
        self.panel.setTitleWidget(view);
    };



    this.destroy = function () {
        $(window).off('resize.secondaryPanelManager');
    };


    //Not using the SecondaryPanelManager.prototype because there should only be one SecondaryPanelManger
    function initialize() {
        var projectItemCategories;

        self.buildPanel();

        self.$runningTimerSpace = self.panel.$element.find("#running-timer-space");
        self.$panelInfo = self.panel.$panelInfo;

        DUET.evtMgr.subscribe('timerStarted runningTaskTimerStopped', function(){
            self.$panelInfo.toggleClass('timer-started');
        });


        self.panel.addToMainMenu(self.itemCategories.$element, true);

        //initially, there will be nothing selected
        self.panel.clearContent(self.noSelectionView);

        self.panel.resize();
    }




    $(window).on('resize.secondaryPanelManager', function () {
        self.panel.resize();
    });

//    DUET.evtMgr.subscribe('contextChanged', function () {
//        self.setContent(self.loadingView.$get());
//    });

    DUET.evtMgr.subscribe('contextCleared', function () {
        self.panel.clearContent(self.noSelectionView);
    });

    DUET.evtMgr.subscribe('setSecondaryContent', function (e, contentDetails) {
        var view = new DUET[contentDetails.view](contentDetails.data);

        self.setInnerContent(view.$get());
    });

    DUET.evtMgr.subscribe('secondaryContentUpdated', function () {
        self.panel.resize();
    });

    initialize();
};

DUET.PanelOneManager = function () {
    var slideOutPanel = new DUET.SlideOutPanelView();


    slideOutPanel.addTo({$anchor:$('#slide-out-panel-wrapper')});


    DUET.evtMgr.subscribe('slideOutPanelClosed', function () {
        var context = DUET.context();

        //when the slide out panel opens, the url will be one of the lists (i.e #projects or #invoices)
        //when it closes, we want the url to go back to the object that was being viewed. If we don't manually do this
        //then it would be impossible to do 1) click projects to open list, don't open a project, but click the seondary
        //panel which will trigger the slide out panel to close, 3) click the projects list again. Without manually
        //setting the url back to the current context, the slide out panel won't open again because the rul will not
        //change from #projects

        //the only time this isn't true is when an entity in the slide out panel is clicked and the click is what
        //initiates the panel to close. In this case, the url will be correct (the item we're loading). That's why we
        //validate desiredUrl against currentUrl

        if (context && context.object && context.id) {
            var desiredUrl = context.object + 's/' + context.id,
                currentUrl = window.location.hash.substr(1);

            if (currentUrl !== desiredUrl) {
                DUET.router.navigate(desiredUrl, {trigger:false});
            }

        }
    });


    this.hide = function () {

        slideOutPanel.hide();
    };

    this.show = function () {
        slideOutPanel.show();
    };

    this.setList = function (content, parameterString) {
        if(!DUET.isMobile)
            slideOutPanel.setList(content, parameterString);
        else{


            var entityList = new DUET.EntityList(content, parameterString);
            entityList.load();
            entityList.hidePanelInfo = true;

            DUET.panelTwo.setTitle(content);

            DUET.panelTwo.panel.clearPrimaryMenu();

            DUET.panelTwo.setContent(entityList);


        }
    };

    this.setContent = function (view) {


        slideOutPanel.setContent(view);
    };
};

DUET.SecondaryPanelManager.prototype = new DUET.PanelManager();


DUET.initModulesToHide = function () {
    var modulesToHide = DUET.config.modules_to_hide.split(',');
    $.each(modulesToHide, function (i, moduleName) {
        modulesToHide[i] = $.trim(moduleName);
    });

    DUET.modulesToHide = modulesToHide;
};

DUET.buildLayout = function () {
    DUET.layoutMgr = new DUET.LayoutManager();
    // DUET.panelOne = new DUET.PrimaryPanelManager();
    DUET.panelTwo = new DUET.SecondaryPanelManager();

    DUET.infoPanel = new DUET.InfoPanelView();
    DUET.infoPanel.addTo({$anchor:$('.window'), position:'append'});

    DUET.panelOne = new DUET.PanelOneManager();

    //DUET.sidebarViewInstance = new DUET.SidebarView();
    //DUET.sidebarViewInstance.addTo({$anchor:$('#sidebar'), position:'append'});


    DUET.pageProgress = new DUET.PageProgressView();
    DUET.pageProgress.addTo({$anchor:$('#page-progress-wrapper'), position:'append'});

    DUET.bottomNavigation = new DUET.BottomNavigationView();
    DUET.bottomNavigation.addTo({$anchor:$('#bottom-navigation-wrapper')});

    DUET.initComplete = true;


};


DUET.loadConfig = function () {
    var configRequest;

    //load the client side config options
    configRequest = new DUET.Request({
        url:'app/config',
        success:function (response) {
            if (response.isValid()) {
                DUET.config = response.data;

            }
        }
    });

    return configRequest;
};

DUET.loadLanguage = function () {
    var langRequest;


    //load the client side config options
    langRequest = new DUET.Request({
        url:'app/language',
        success:function (response) {
            if (response.isValid()) {
                DUET.language = response.data;
            }
        }
    });

    return langRequest;
};

DUET.getInitialInfo = function(){
    DUET.startupInfoLoaded = $.Deferred();

    if(!DUET.taxRates){
        var request = new DUET.Request({
            url:'startup/info',
            success:function(response){
                DUET.startupInfo = response.data;


                DUET.startupInfoLoaded.resolve();
            }
        });


        return request.isComplete;
    }
    else return true;

};



DUET.checkForUpdates = function (force) {
    var lastUpdateCheck = 'duet_last_update_check_date',
        updateAvailable = 'duet_update_available',
        updateDismissed = 'duet_update_notification_dismissed';

    //todo: all the logic is on the client side because the version number isn't currently stored anywhere on the server side. We nee to move the version to the server and then move this logic as well
    function supports_html5_storage() {
        try {
            if ('localStorage' in window && window['localStorage'] !== null) {
                //mobile safari in private browsing mode will have localStorage on the window object but it wont work
                //and will throw an error
                //http://stackoverflow.com/questions/21159301/quotaexceedederror-dom-exception-22-an-attempt-was-made-to-add-something-to-st
                //https://github.com/Modernizr/Modernizr/blob/master/feature-detects/storage/localstorage.js
                localStorage.setItem(mod, mod);
                localStorage.removeItem(mod);
                return true;
            }
            else return false;
        } catch (e) {
            return false;
        }
    }


    function isPositiveInteger(x) {
        // http://stackoverflow.com/a/1019526/11236
        return /^\d+$/.test(x);
    }

    //  0 if they're identical
    //  negative if v1 < v2
    //  positive if v1 > v2
    //  Nan if they in the wrong format
    //  assert(version_number_compare("1.7.1", "1.6.10") > 0);
    //  assert(version_number_compare("1.7.1", "1.7.10") < 0);
    // modified version taken from http://stackoverflow.com/a/6832721/11236

    function compareVersionNumbers(v1, v2) {
        if (!v1 || !v2)
            return 0;

        var v1parts = v1.split('.');
        var v2parts = v2.split('.');

        // First, validate both numbers are true version numbers
        function validateParts(parts) {
            for (var i = 0; i < parts.length; ++i) {
                if (!isPositiveInteger(parts[i])) {
                    return false;
                }
            }
            return true;
        }

        if (!validateParts(v1parts) || !validateParts(v2parts)) {
            return NaN;
        }

        for (var i = 0; i < v1parts.length; ++i) {
            if (v2parts.length === i) {
                return 1;
            }

            if (parseInt(v1parts[i], 10) === parseInt(v2parts[i], 10)) {
                continue;
            }
            if (parseInt(v1parts[i], 10) > parseInt(v2parts[i], 10)) {
                return 1;
            }
            return -1;
        }

        if (v1parts.length != v2parts.length) {
            return -1;
        }

        return 0;
    }

    function generateNotification() {
        var updateUrl = 'http://www.duetapp.com/latest',
            html = '<div>An update is available. ' +
                '<a href="' + updateUrl + '" target="_blank">View details</a></div>',
            $notification = $(html);

        $notification.on('click', '.close', function () {
            localStorage[updateDismissed] = 1;

        });


        return $notification;
    }

    function displayNotification() {
        DUET.displayNotification(generateNotification(), function () {
            localStorage[updateDismissed] = 1;
        });

        localStorage[updateAvailable] = 1;
        localStorage[updateDismissed] = 0;
    }

    function doCheckForUpdate() {
        new DUET.Request({
            url:'versions/get_latest',
            success:function (response) {
                if (compareVersionNumbers(response.data.version, DUET.version) > 0) {
                    displayNotification();
                }
                else {
                    localStorage[updateAvailable] = 0;
                    localStorage[updateDismissed] = 0;
                }

            }
        });

        localStorage[lastUpdateCheck] = new Date().getTime();
    }


    if (supports_html5_storage()) {
        var lastUpdateCheckDate = localStorage[lastUpdateCheck],
            checkForUpdate = false;

        if (lastUpdateCheckDate) {
            var differenceInDays = (new Date().getTime() - lastUpdateCheckDate) / 86400000;

            if (differenceInDays > 3)
                checkForUpdate = true;

        }
        else checkForUpdate = true;

    }

    //this will check for an update every three days. If an update is available, the notification will display until it
    //is dismissed.
    if (checkForUpdate || force === true) {
        doCheckForUpdate();
    }
    else if (localStorage[updateAvailable] == 1 && localStorage[updateDismissed] != 1) {
        displayNotification();
    }
};

DUET.displayNotification = function ($message, callback) {
    var $notification = DUET.templateManager.$get('notification');

    $notification.find('.notification-inner').prepend($message);

    $('#notification-space').html($notification);

    $notification.animate({opacity:1});

    $notification.on('click', '.close', function () {

        $notification.animate({opacity:0}, function () {
            $notification.remove();

            if (callback)
                callback();
        });
    });
};

DUET.start = function (newLogin) {
    var self = this,
        continueStart = false,
        loginCheckRequest, appStarted = $.Deferred();

    function doStart() {
        loginCheckRequest = new DUET.Request({
            url:'app/logged_in',
            success:function (response) {
                if (response.auth != 'not_logged_in')
                    continueStart = true;
            }
        });

        $.when(loginCheckRequest.isComplete).done(function () {
            if (continueStart) {


                $.when(DUET.getInitialInfo()).done(function(){
                    DUET.misc();

                    DUET.applyLocalization();

                    DUET.initViewCommonParams();

                    DUET.initModulesToHide();

                    DUET.buildLayout();

                    DUET.mobileManager();

                    DUET.contextMgr = new DUET.ContextManager();

                    //we need to manually call the resize function once the main components have been built
                    DUET.layoutMgr.resize();

                    DUET.layoutMgr.applyTheme();

                    appStarted.resolve();

                    if (!DUET.history || !DUET.history.started)
                        DUET.history.start();

                    if (DUET.userIsAdmin())
                        DUET.checkForUpdates();
                });

                //todo: i probably should't show the screen until after the layout manager is finished loading?
            }
            else if (DUET.isPublicRoute()) {
                if (!DUET.history || !DUET.history.started)
                    DUET.history.start();

            }

            //todo:it would be great if this waited until the initial views were loaded. A lot of that is asynchrynous since models need to be loaded from the server
            $('#app-loading-screen').fadeOut();


        });
    }

    //we can't do anything without the router, so lets make sure it's initialized
    if (!DUET.router) {
        //start the history and the app router
        DUET.history = new DUET.History();
        DUET.router = new DUET.Router(DUET.routes);
    }

    DUET.templateManager = new DUET.TemplateManager();

    //todo:

    $.when(DUET.templateManager.loadingTemplatesPromise).done(function () {
        $.when(DUET.loadConfig().isComplete).done(function () {
            $.when(DUET.loadLanguage().isComplete).done(function () {
                doStart();
            });
        });
    });
//    $.when(DUET.templateManager.loadingTemplatesPromise, DUET.loadConfig(), DUET.loadLanguage()).done(function() { //TODO: I should have some kind of global on function
//
//    });

    return appStarted;
};

DUET.stop = function (message) {
    if (!DUET.history || !DUET.history.started)
        DUET.history.start();

    if (DUET.sidebarViewInstance)
        DUET.sidebarViewInstance.unload();

    //todo:unload slide out panel


    if (DUET.$appWrapper)
        DUET.$appWrapper.remove();

    //todo:this should stop history or the router or both
    if (!$('.login-window').length) {
        DUET.addView({
            view:'LoginView',
            data:{message:message},
            $anchor:$('body')
        }); //todo: replace with the view.addTo funciton
    }
};

DUET.error = function (message) {
    var error = DUET.templateManager.$get('error');
    return error.prepend(message);
};

DUET.notice = function (message) {
    var error = DUET.templateManager.$get('notice');
    return error.prepend(message);
};

