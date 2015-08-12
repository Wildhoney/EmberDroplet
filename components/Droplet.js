(function main($window, $ember) {

    "use strict";

    /**
     * @property Model
     * @type {Model}
     */
    class Model {

        /**
         * @method setStatusType
         * @param {Number} statusType
         * @return {void}
         */
        setStatusType(statusType) {
            this.statusType = Number(statusType);
        }

    }

    /**
     * @constant MIME_MODE
     * @type {Object}
     */
    const MIME_MODE = { PUSH: 'push', SET: 'set' };

    /**
     * @constant MESSAGES
     * @type {Object}
     */
    const MESSAGES = {
        URL_REQUIRED: 'Droplet: You must specify the URL parameter when constructing your component.'
    };

    /**
     * @module EmberDroplet
     * @author Adam Timberlake
     * @see https://github.com/Wildhoney/EmberDroplet
     */
    $window.Droplet = $ember.Mixin.create({

        /**
         * @property url
         * @throws {Error}
         * @type {Function}
         */
        url: () => { throw new Error(MESSAGES.URL_REQUIRED) },

        /**
         * @property hooks
         * @type {Object}
         */
        hooks: { didAdd: () => {}, didDelete: () => {} },

        /**
         * @property files
         * @type {Array}
         */
        files: [],

        /**
         * @property model
         * @type {Model}
         */
        model: Model,

        /**
         * @property mimeTypes
         * @type {Array}
         */
        mimeTypes: ['image/jpeg', 'image/jpg', 'image/gif', 'image/png', 'image/tiff', 'image/bmp'],

        /**
         * @property statusTypes
         * @type {Object}
         */
        statusTypes: { VALID: 1, INVALID: 2, DELETED: 4, UPLOADED: 8, FAILED: 16 },

        /**
         * @property actions
         * @type {Object}
         * @return {void}
         */
        actions: {

            /**
             * @method uploadFiles
             * @return {Promise}
             */
            uploadFiles() {

                const isFunction  = value => typeof $ember.get(this, 'url') === 'function';
                const isUndefined = value => typeof value !== 'undefined';

                const defaults = { fileSizeHeader: true, useArray: true, method: 'POST' };
                const url      = isFunction($ember.get(this, 'url')) ? $ember.get(this, 'url').apply(this) : $ember.get(this, 'url');

                return new Promise((resolve, reject) => {

                });

            },

            /**
             * @method mimeTypes
             * @param {Array} mimeTypes
             * @param {Object} [mode=MIME_MODE.PUSH]
             * @return {void}
             */
            mimeTypes(mimeTypes, mode = MIME_MODE.PUSH) {
                mode === MIME_MODE.SET && this.set('mimeTypes', []);
                const types = this.get('mimeTypes').concat(mimeTypes);
                this.set('mimeTypes', types);
            },

            /**
             * @method addFiles
             * @param {Model[]} files
             * @return {void}
             */
            addFiles(...files) {

                files.forEach(file => {
                    this.get('hooks').didAdd(file);
                    this.get('files').pushObject(file);
                });

            },

            /**
             * @method deleteFiles
             * @param {Model[]} files
             * @return {void}
             */
            deleteFiles(...files) {

                files.forEach((file) => {

                    const index = file instanceof Model && this.get('files').indexOf(file);
                    file.setStatusType(this.statusTypes.DELETED);

                    if (~index) {
                        this.get('hooks').didDelete(file);
                        this.get('files').splice(index, 1);
                    }

                });

            },

            /**
             * @method clearFiles
             * @return {void}
             */
            clearFiles() {
                this.files.forEach(file => this.sendAction('deleteFiles', file));
                this.files.length = 0;
            },

            /**
             * @method getFiles
             * @param {Number} statusType
             * @return {Array}
             */
            getFiles(statusType) {
                return this.files.filter(file => file.statusType & statusType);
            }

        }

    });

})(window, window.Ember);