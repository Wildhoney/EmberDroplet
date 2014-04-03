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
    dropletUrl: 'http://127.0.0.1:8889/upload',

    /**
     * @property useArray
     * @type {Boolean}
     * @default false
     */
    useArray: false,

    /**
     * @property mimeTypes
     * @type {Array}
     * Specifies the valid MIME types. Can used in an additive fashion by using the
     * property below.
     */
    mimeTypes: ['image/bmp'],

    /**
     * @property concatenatedProperties
     * @type {Array}
     * Apply this property if you want your MIME types above to be appended to the white-list
     * as opposed to replacing the white-list entirely.
     */
    concatenatedProperties: ['mimeTypes'],

    /**
     * @method didUploadFiles
     * @param response {Object}
     * @return {void}
     */
    didUploadFiles: function(response) {
        console.log(response);
    }

});