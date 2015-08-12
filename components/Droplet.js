(function main($window, $ember) {

    "use strict";

    /**
     * @constant STATUS_TYPES
     * @type {Object}
     */
    const STATUS_TYPES = { NONE: 0, VALID: 1, INVALID: 2, DELETED: 4, UPLOADED: 8, FAILED: 16 };

    /**
     * @property Model
     * @type {Model}
     */
    class Model {

        /**
         * @constructor
         * @param {File} [file={}]
         */
        constructor(file = {}) {
            this.file       = file;
            this.statusType = STATUS_TYPES.NONE;
        }

        /**
         * @method getMIMEType
         * @return {String}
         */
        getMIMEType() {
            return this.file.type;
        }

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
     * @constant COMPUTED_OBSERVER
     * @type {Array}
     */
    const COMPUTED_OBSERVER = $ember.String.w('files.length', 'files.@each.statusType');

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
        hooks: { didAdd: () => {}, didDelete: () => {}, didUpload: () => {} },

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
        statusTypes: STATUS_TYPES,

        /**
         * @method init
         * @return {void}
         */
        init() {
            $ember.set(this, 'files', []);
            this._super();
        },

        /**
         * @property uploadStatus
         * @type {Object}
         */
        uploadStatus: $ember.computed(function computedFn() {
            return { uploading: false, percentComplete: 0, error: false };
        }),

        /**
         * @property validFiles
         * @return {Array}
         */
        validFiles: $ember.computed(function computedFn() {
            return this.getFiles(STATUS_TYPES.VALID);
        }).property(COMPUTED_OBSERVER),

        /**
         * @property invalidFiles
         * @return {Array}
         */
        invalidFiles: $ember.computed(function computedFn() {
            return this.getFiles(STATUS_TYPES.INVALID);
        }).property(COMPUTED_OBSERVER),

        /**
         * @property deleteFiles
         * @return {Array}
         */
        deleteFiles: $ember.computed(function computedFn() {
            return this.getFiles(STATUS_TYPES.DELETED);
        }).property(COMPUTED_OBSERVER),

        /**
         * @method getFiles
         * @param {Number} statusType
         * @return {Array}
         */
        getFiles(statusType) {
            return this.files.filter(file => file.statusType & statusType);
        },

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
                mode === MIME_MODE.SET && $ember.set(this, 'mimeTypes', []);
                mimeTypes = Array.isArray(mimeTypes) ? mimeTypes : [mimeTypes];
                const types = [...$ember.get(this, 'mimeTypes'), ...mimeTypes];
                $ember.set(this, 'mimeTypes', types);
            },

            /**
             * @method addFiles
             * @param {Model[]} files
             * @return {void}
             */
            addFiles(...files) {

                /**
                 * @method isAcceptableMIMEType
                 * @return {Boolean}
                 */
                const isAcceptableMIMEType = mimeType => !!~$ember.get(this, 'mimeTypes').indexOf(mimeType);

                files.forEach(file => {

                    if (file instanceof Model) {

                        file.setStatusType(isAcceptableMIMEType(file.getMIMEType()) ? STATUS_TYPES.VALID : STATUS_TYPES.INVALID);

                        $ember.get(this, 'hooks').didAdd(file);
                        $ember.get(this, 'files').pushObject(file);

                    }

                });

            },

            /**
             * @method deleteFiles
             * @param {Model[]} files
             * @return {void}
             */
            deleteFiles(...files) {

                files.forEach((file) => {

                    const contains = !!~$ember.get(this, 'files').indexOf(file);

                    if (contains && file instanceof Model) {

                        file.setStatusType(STATUS_TYPES.DELETED);
                        $ember.get(this, 'files').removeObject(file);
                        $ember.get(this, 'hooks').didDelete(file);

                    }

                });

            },

            /**
             * @method clearFiles
             * @return {void}
             */
            clearFiles() {
                this.files.forEach(file => this.send('deleteFiles', file));
                this.files.length = 0;
            }

        }

    });

})(window, window.Ember);
