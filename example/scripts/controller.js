/**
 * @module App
 * @class IndexController
 * @uses EmberDropletController
 * @type Ember.Controller
 * @extends Ember.ArrayController
 */
App.IndexController = Ember.Controller.extend(EmberDropletController, {

    /**
     * @property dropletUrl
     * @type {String}
     * Path that handles the file uploads.
     */
    dropletUrl: '/'

});