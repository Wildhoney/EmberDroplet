(function main($window) {

    "use strict";

    /**
     * @module App
     * @class App
     * @type Ember.Application
     */
    var App = $window.App = Ember.Application.create();

    App.XDropletComponent = Ember.Component.extend($window.Droplet, {
        url: $window.location.origin + '/upload'
    });

    App.XDropletAreaComponent    = Ember.Component.extend($window.Droplet.Area);
    App.XDropletPreviewComponent = Ember.Component.extend($window.Droplet.Preview);
    App.XDropletInputComponent   = Ember.Component.extend($window.Droplet.MultipleInput);

})(window);