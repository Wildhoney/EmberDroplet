(function main($window) {

    "use strict";

    /**
     * @module App
     * @class App
     * @type Ember.Application
     */
    var App = $window.App = Ember.Application.create();

    // Configure the Droplet component by extending the mixin.
    App.XDropletComponent = Ember.Component.extend($window.Droplet, {
        url: $window.location.origin
    });

    App.XDropletAreaComponent    = Ember.Component.extend($window.Droplet.Area);
    App.XDropletPreviewComponent = Ember.Component.extend($window.Droplet.Preview);

})(window);