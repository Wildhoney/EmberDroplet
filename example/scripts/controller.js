/**
 * @module App
 * @class IndexController
 * @uses EmberDropletController
 * @type Ember.Controller
 * @extends Ember.ArrayController
 */
App.IndexController = Ember.Controller.extend(DropletController, {

    /**
     * @property dropletUrl
     * @type {String}
     * Path that handles the file uploads.
     */
    dropletUrl: 'http://127.0.0.1:8888/upload'

});