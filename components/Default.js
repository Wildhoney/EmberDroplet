/**
 * @constant STATUS_TYPES
 * @type {Object}
 */
const STATUS_TYPES = { VALID: 1, INVALID: 2, DELETED: 4, UPLOADED: 8, FAILED: 16 };

/**
 * @module EmberDroplet
 * @author Adam Timberlake
 * @see https://github.com/Wildhoney/EmberDroplet
 */
window.Droplet = Ember.Mixin.create({

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
    statusTypes: STATUS_TYPES,

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

            console.log('x');

            const defaults = { fileSizeHeader: true, useArray: true, method: 'POST' };
            const url      = typeof getUrl === 'function' ? getUrl.apply(this) : getUrl;

            return new Promise((resolve, reject) => {

            });

        },

        /**
         * @method addFile
         * @param {DropletModel} file
         * @return {Boolean}
         */
        addFile(file) {
            return !!this.files.push(file);
        },

        /**
         * @method deleteFile
         * @param {DropletModel} file
         * @return {Boolean}
         */
        deleteFile(file) {
            const index = file instanceof Model && this.files.indexOf(file);
            return ~index && this.files.splice(index) || false;
        },

        /**
         * @method clearFiles
         * @return {Boolean}
         */
        clearFiles() {
            return !(this.files.length = 0);
        },

        /**
         * @method getFiles
         * @param {Number} statusType
         * @return {void}
         */
        getFiles: statusType => {
            return this.files.filter(file => file & statusType);
        }

    }

});

export default Droplet;