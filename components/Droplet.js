(function main($window, $ember) {

    "use strict";

    /**
     * @module EmberDroplet
     * @author Adam Timberlake
     * @see https://github.com/Wildhoney/EmberDroplet
     */
    $window.Droplet = $ember.Mixin.create({

        /**
         * @property files
         * @type {Array}
         */
        files: [],

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
            uploadFiles: () => {

                const isFunction  = value => typeof $ember.get(this, 'url') === 'function';
                const isUndefined = value => typeof value !== 'undefined';

                const defaults = { fileSizeHeader: true, useArray: true, method: 'POST' };
                const url      = isFunction($ember.get(this, 'url')) ? $ember.get(this, 'url').apply(this) : $ember.get(this, 'url');

                return new Promise((resolve, reject) => {

                });

            },

            /**
             * @method addFiles
             * @param {Model[]} files
             * @return {Boolean}
             */
            addFiles(files) {
                files = Array.isArray(files) ? files : [files];
                return files.every(file => !!this.files.push(file));
            },

            /**
             * @method deleteFiles
             * @param {Model[]} files
             * @return {Boolean}
             */
            deleteFiles(files) {

                files = Array.isArray(files) ? files : [files];

                return files.every((file) => {
                    const index = file instanceof Model && this.files.indexOf(file);
                    return ~index && this.files.splice(index) || false;
                });

            },

            /**
             * @method clearFiles
             * @return {Boolean}
             */
            clearFiles() {
                this.files.forEach(file => file.setStatusType(this.statusTypes.DELETED));
                return !(this.files.length = 0);
            },

            /**
             * @method getFiles
             * @param {Number} statusType
             * @return {Array}
             */
            getFiles: statusType => {
                return this.files.filter(file => file.statusType & statusType);
            }

        }

    });

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

})(window, window.Ember);