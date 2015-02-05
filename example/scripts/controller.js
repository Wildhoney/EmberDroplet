/**
 * @module App
 * @class IndexController
 * @uses EmberDropletController
 * @type Ember.Controller
 * @extends Ember.ArrayController
 */
App.IndexController = Ember.Controller.extend(DropletController, {

    /**
     * Path that handles the file uploads.
     *
     * @property dropletUrl
     * @type {String}
     */
    dropletUrl: 'upload',

    /**
     * @property dropletOptions
     * @type {Object}
     */
    dropletOptions: {
        fileSizeHeader: true,
        useArray: false
    },

    /**
     * Specifies the valid MIME types. Can used in an additive fashion by using the
     * property below.
     *
     * @property mimeTypes
     * @type {Array}
     */
    mimeTypes: ['image/bmp'],

    /**
     * Apply this property if you want your MIME types above to be appended to the white-list
     * as opposed to replacing the white-list entirely.
     *
     * @property concatenatedProperties
     * @type {Array}
     */
    concatenatedProperties: ['mimeTypes'],

    /**
     * @method didUploadFiles
     * @param response {Object}
     * @return {void}
     */
    didUploadFiles: function didUploadFiles(response) {
        console.log(response);
    },

    /**
     * @method didAddFiles
     * @param fileList {Array}
     * @return {void}
     */
    didAddFiles: function didAddFiles(fileList) {
        //this.send('uploadAllFiles');
        console.log(fileList);
    }

});