var DUET = DUET || {};
DUET.ViewHelpers = DUET.ViewHelpers || {};

DUET.ViewHelpers.editEntity = function(){
    new DUET['New' + DUET.utils.ucFirst(this.model.type) + 'View'](this.model);
};

