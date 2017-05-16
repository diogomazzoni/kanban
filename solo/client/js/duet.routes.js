var DUET = DUET || {};


DUET.routes = {

    //todo: add back default route, but dashboard should only run iff language and templates have been loaded - wait for them , '*path':'dashboard'
    routes:{
        ':referenceObjectPlural/:referenceId/discussion':'discussion',
        'boards/:id/tasks':'taskList',
        'boards/:id/:entityType':'projectEntityList',
        'boards/:id/:entityType/:entityId':'projectEntity',
        'boards/:id':'board',
        'boards':'boards',
        'templates/:id/tasks':'templateTaskList',
        'templates/:id/:entityType':'templateEntityList',
        'templates/:id/:entityType/:entityId':'templateEntity',
        'templates/:id':'templateEntityList',
        'templates':'templateEntityList',
        'tasks/:id':'task',
        'tasks':'task',
        'users/:id':'user',
        'users':'user',
        'files':'file',
        'files/:id':'file',
        'login':'login',
        'logout':'logout',
        'profile':'myProfile',
        'search':'search',
        'search/:query':'search',
        'forgot_password':'forgotPassword',
        'settings':'settings',
        'settings/*path':'settings',
        'discussion/:referenceObject/:referenceId':'discussion',
        'link/:slug':'link',
        'help':'help',
        'finish-setup':'finishSetup',
        'agenda':'agenda',
        '':'boards'
    },
    board:function(id){
       DUET.routes.taskList(id);
    },
    boards:function(){
        var boardsList = new DUET.BoardsList();

        boardsList.on('loaded', function(){


            DUET.panelTwo.panel.clearPrimaryMenu();

            var view = new DUET.BoardsListView(boardsList);
            DUET.panelTwo.setTitle('&nbsp;');
            DUET.panelTwo.setContent(view);
        });

        boardsList.load();
    },
    agenda:function(){
        var agenda = new DUET.Agenda();

        agenda.on('loaded', function(){
            DUET.panelTwo.panel.clearPrimaryMenu();

            var agendaView = new DUET.AgendaView(agenda);
            DUET.panelTwo.setTitle(' ');
            DUET.panelTwo.setContent(agendaView);
        });

        agenda.load(1);
    },
    finishSetup:function(){
        var finishView = new DUET.FinishSetupView();
        DUET.panelTwo.setContent(finishView);
    },
    link:function(slug){
        var linkAsset = new DUET.LinkAsset(slug);
        linkAsset.on('loaded', function(){

            $.when(DUET.getInitialInfo()).done(function () {
                if(DUET.isLoggedIn){
                    var type = linkAsset.type;
                    DUET.navigate('#' + type + 's/' + linkAsset[DUET.utils.ucFirst(type)].id);
                }
                else{
                    var linkView = new DUET.LinkView(linkAsset, slug);
                    linkView.addTo({$anchor: $('body')});
                }

            });

        });

        linkAsset.load();


    },
    projectEntityList:function (projectId, entityType, projectType) {
        var args, panelLoaded, params;

        projectType = projectType || 'project';


        if (!projectId)
            panelLoaded = DUET.routeHelpers.initPrimaryPanel(projectType, projectId);
        else {

            DUET.panelTwo.loading();

            args = arguments;

            params = DUET.routeHelpers.initSecondaryPanel(args);

            function collectionHandler() {
                var collection, view, pluralModelName = params.activeModelSingular + 's';

                //because the word 'peoples' makes no sense
                if (pluralModelName == 'peoples')
                    pluralModelName = 'people';

                collection = new DUET.Collection({
                    model:params.activeModelSingular,
                    url:projectType + 's/' + projectId + '/' + pluralModelName
                });

                //todo: maybe some kind of loading text while the collection is loading for slow connections
                //TODO:clicking on any of these list items reloads the entire page. not cool

                collection.on('loaded', function () {
                    $.when(params.project.isLoaded).done(function(){
                        view = new DUET[DUET.utils.ucFirst(params.activeModelSingular) + 'ListView'](collection, params.project);
                        DUET.routeHelpers.panelTwoHandler(params, view);
                    });

                });

                collection.load();
            }

            function modelHandler() {
                var modelName, model, viewNamePrefix, view;

                modelName = params.activeModelName;
                if (DUET[modelName]) {
                    model = new DUET[modelName];
                }
                else {
                    modelName = ut.ucFirst(projectType) + params.activeModelName;
                    model = new DUET[modelName];
                }

                model.on('loaded', function () {
                    viewNamePrefix = DUET.utils.ucFirst(params.activeModelName);

                    $.when(params.project.isLoaded).done(function(){

                        if (DUET[viewNamePrefix + 'View'])
                            view = new DUET[viewNamePrefix + 'View'](model, params.project);
                        else view = new DUET['Project' + viewNamePrefix + 'View'](model, params.project);

                        DUET.routeHelpers.panelTwoHandler(params, view);
                    });

                });

                model.load(projectId);
            }


            if (params.project) {

                $.when(params.project.isLoaded).done(function () {
                    DUET.panelTwo.setTitle(params.project.name);
                    DUET.panelTwo.setModel(params.project);
                });

            }

            if (params.activeModel != 'calendar' && params.activeModel != 'details' && params.activeModel != 'notes' && params.activeModel != 'people') {
                collectionHandler();
            }
            else {
                modelHandler();
            }
        }
    },
    taskList:function(projectId, filter){
        var list = new DUET.List(projectId);

        var params = DUET.routeHelpers.initSecondaryPanel([projectId, 'tasks']);

        list.on('loaded', function(){
            $.when(params.project.isLoaded).done(function(){
                var view = new DUET.TaskListView(list, params.project);
                DUET.routeHelpers.panelTwoHandler(params, view);

                DUET.panelTwo.setModel(params.project);
                DUET.panelTwo.setTitle(params.project.name);
            });

        });

        list.load('');
    },
    templateTaskList:function(templateId){
        var list = new DUET.List(templateId, 'templates');

        var params = DUET.routeHelpers.initSecondaryPanel([templateId, 'tasks']);

        list.on('loaded', function () {
            var view = new DUET.TaskListView(list, params.project);
            DUET.routeHelpers.panelTwoHandler(params, view);
            DUET.panelTwo.setModel(params.project);
            DUET.panelTwo.setTitle(params.project.name);
        });

        list.load('');
    },
    projectEntity:function (projectId, entityType, entityId, projectType) {
        var args, panelLoaded, params;


        projectType = projectType || 'project';

        DUET.panelTwo.loading();

        args = arguments;

        params = DUET.routeHelpers.initSecondaryPanel(args);
        DUET.panelTwo.setModel(params.project);

        $.when(params.project.isLoaded).done(function () {


            var activeModelUppercase = DUET.utils.ucFirst(params.activeModelSingular);
            var model = new DUET[activeModelUppercase];

            model.on('loaded', function () {
                // DUET.context(params.activeModelSingular, model.id);
                var view = new DUET[activeModelUppercase + 'View'](model);
                DUET.panelTwo.setInnerContent(view);
                DUET.panelTwo.buildProjectItemCategories('project-' + params.activeModel);
            });

            model.load(params.activeModelId);
        });

    },
    templateEntityList:function (projectId, entityType) {
        DUET.routes.projectEntityList(projectId, entityType, 'template');
    },
    templateEntity:function (projectId, entityType, entityId) {
        DUET.routes.projectEntity(projectId, entityType, entityId, 'template');
    },
    task:function (id) {
        DUET.baseModelRoute('task', id);
    },
    client:function (id) {
        DUET.baseModelRoute('client', id);
    },
    user:function (id) {
        DUET.baseModelRoute('user', id);
    },
    file:function (id) {
        DUET.baseModelRoute('file', id);
    },
    login:function () {
        DUET.stop();
    },
    logout:function () {
        new DUET.Request({
            url:'app/logout',
            success:function () {
                window.location = '#login';
            }
        });
    },
    myProfile:function () {
        this.user(DUET.my.id);
        DUET.panelOne.hide();

    },
    search:function (query) {

        var searchModel;


        //DUET.context('search', 1);
        DUET.panelTwo.loading();
        DUET.panelTwo.setTitle('Search'); //todo:lang file
        DUET.panelTwo.setModel(searchModel);
        DUET.panelTwo.panel.clearPrimaryMenu();


        function loadView(){
            var searchResultsView = new DUET.SearchResultsView(searchModel);

            DUET.panelTwo.setContent(searchResultsView);
        }

        if(query){
            searchModel = new DUET.Search();

            searchModel.on('loaded', function () {
                loadView();
            });

            searchModel.load(query);
        }
        else loadView();

    },
    forgotPassword:function () {
        var forgotPasswordView = new DUET.ForgotPasswordView();
        forgotPasswordView.addTo({$anchor:$('body')});
    },
    settings:function (tab) {
        if (!DUET.userIsAdmin())
            return false;

        DUET.panelTwo.loading();

        var settings = new DUET.Setting();

        DUET.panelTwo.setTitle(ut.lang('adminSettings.title'));
        DUET.panelTwo.setModel();
        DUET.panelOne.hide();
        DUET.panelTwo.panel.clearPrimaryMenu();
        settings.on('loaded', function () {

            var settingsView = new DUET.SettingsView(settings, tab);
            DUET.panelTwo.setContent(settingsView);
        });

        settings.load(1);
    
    },
    help:function(){
        var helpView = new DUET.HelpView();
        DUET.panelTwo.setContent(helpView);
    }

};


//common functions used throughout the routes
DUET.routeHelpers = {
    initPrimaryPanel:function (projectType) {
        DUET.panelOne.setList(projectType);
    },
    initSecondaryPanel:function (params) {
        var collection, view, activeModel, activeModelSingular, activeModelName, project, params, projectId, activeModelId;

        //secondary panel
        projectId = params[0];
        activeModel = params[1] || DUET.options.defaultProjectTab;
        activeModelName = DUET.utils.ucFirst(activeModel);
        activeModelId = params[2];
        activeModelSingular = DUET.utils.trim(activeModel, 's');

        var project = params[2] !== 'template' ? new DUET.Project() : new DUET.Template();
        project.load(projectId);

        //todo: why is the slide out panel even showing? It needs to be smarter about when it opens
        DUET.panelOne.hide();

        return{
            activeModel:activeModel,
            activeModelName:activeModelName,
            activeModelId:activeModelId,
            activeModelSingular:activeModelSingular,
            project:project
        };
    },
    collectionHandler:function () {
    },
    panelTwoHandler:function (params, view) {
        var context;
        DUET.panelTwo.setInnerContent(view); //TODO: Think about having a DUET.setContent('panelTwo', view.get()), basically an app level set content function?

    }
};

DUET.getModelTitle = function (model) {
    var type = model.type,
        title = ' ';

    switch (type) {
        case 'project':
        case 'client':
        case 'file':
            title = model.name;
            break;
        case 'task':
            title = 'Task: ' + model.task.substr(0, 10) + '...';
            break;
        case 'invoice':
            title = 'Invoice ' + model.number;
            break;
        case 'user':
            title = model.firstName + ' ' + model.lastName;
            break;
        case 'dashboard':
            title = 'Dashboard';
            break;
        case 'recurringinvoice':
            title = 'Recurring Invoice';
            break;
    }

    return title;

};

DUET.baseModelRoute = function (modelType, id) {
    var model, view, modelData, modelTypeCapitalized;



    if(modelType == 'recurringinvoice')
        modelTypeCapitalized = 'RecurringInvoice';
    else modelTypeCapitalized = DUET.utils.ucFirst(modelType);


    if (!id)
        DUET.panelOne.setList(modelType);
    else {

        DUET.panelTwo.loading();

        DUET.panelOne.hide();
        DUET.panelTwo.panel.clearPrimaryMenu();
        modelData = id;

        //secondary panel
        model = new DUET[modelTypeCapitalized];

        model.on('loaded', function () {
            //  DUET.context(modelType, model.id);
            if (DUET[modelTypeCapitalized + 'DetailsView'])
                view = new DUET[modelTypeCapitalized + 'DetailsView'](model);
            else view = new DUET[modelTypeCapitalized + 'View'](model);

            DUET.panelTwo.setTitle(DUET.getModelTitle(model));
            DUET.panelTwo.setContent(view);
            DUET.panelTwo.setModel(model);
        });

        model.load(modelData);
    }

};
