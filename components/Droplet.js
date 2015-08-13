(function main($window, $Ember, $FileReader) {

    "use strict";

    // Extract the commonly accessed Ember methods.
    const { Mixin, String, computed, get, set, run } = $Ember;

    /**
     * @constant STATUS_TYPES
     * @type {Object}
     */
    const STATUS_TYPES = { NONE: 0, VALID: 1, INVALID: 2, DELETED: 4, UPLOADED: 8, FAILED: 16 };

    /**
     * @property Model
     * @type {Ember.Object}
     */
    const Model = $Ember.Object.extend({

        /**
         * @method init
         * @return {void}
         */
        init: function() {
            this.statusType = STATUS_TYPES.NONE;
        },

        /**
         * @method getMIMEType
         * @return {String}
         */
        getMIMEType: function() {
            return this.file.type || '';
        },

        /**
         * @method getFileSize
         * @return {Number}
         */
        getFileSize: function() {
            return typeof this.file.size !== 'undefined' ? this.file.size : Infinity;
        },

        /**
         * @method setStatusType
         * @param {Number} statusType
         * @return {void}
         */
        setStatusType: function(statusType) {
            this.set('statusType', Number(statusType));
        }

    });

    /**
     * @constant MIME_MODE
     * @type {Object}
     */
    const MIME_MODE = { PUSH: 'push', SET: 'set' };

    /**
     * @constant DEFAULT_OPTIONS
     * @type {Object}
     */
    const DEFAULT_OPTIONS = {

        /**
         * @property requestMethod
         * @type {String}
         */
        requestMethod: 'POST',

        /**
         * @property maximumSize
         * @type {Number|Infinity}
         */
        maximumSize: Infinity,

        /**
         * @property includeHeader
         * @type {Boolean}
         */
        includeHeader: true,

        /**
         * @property useArray
         * @type {Boolean}
         */
        useArray: false,

        /**
         * @property mimeTypes
         * @type {Array}
         */
        mimeTypes: ['image/jpeg', 'image/jpg', 'image/gif', 'image/png', 'image/tiff', 'image/bmp'],

        /**
         * @property requestHeaders
         * @type {Object}
         */
        requestHeaders: {},

        /**
         * @property requestPostData
         * @type {Object}
         */
        requestPostData: {}

    };

    /**
     * @constant COMPUTED_OBSERVER
     * @type {Array}
     */
    const COMPUTED_OBSERVER = String.w('files.length files.@each.statusType');

    /**
     * @constant MESSAGES
     * @type {Object}
     */
    const MESSAGES = {
        URL_REQUIRED: 'Droplet: You must specify the URL parameter when constructing your component.'
    };

    /**
     * @module Droplet
     * @author Adam Timberlake
     * @see https://github.com/Wildhoney/EmberDroplet
     */
    $window.Droplet = Mixin.create({

        /**
         * @property url
         * @throws {Error}
         * @type {Function}
         */
        url: () => { throw new Error(MESSAGES.URL_REQUIRED); },

        /**
         * @property model
         * @type {Ember.Object}
         */
        model: Model,

        /**
         * @property options
         * @type {Object}
         */
        options: {},

        /**
         * @property hooks
         * @type {Object}
         */
        hooks: {},

        /**
         * @property files
         * @type {Array}
         */
        files: [],

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

            set(this, 'files', []);
            set(this, 'hooks', {});

            Object.keys(DEFAULT_OPTIONS).forEach(key => {

                // Copy across all of the options into the options map.
                set(this, `options.${key}`, DEFAULT_OPTIONS[key]);

            });

            this._super();

        },

        /**
         * @method invokeHook
         * @param {String} name
         * @param {Array} args
         * @return {void}
         */
        invokeHook(name, ...args) {
            const method = get(this, 'hooks')[name] || (() => {});
            method(...args);
        },

        /**
         * @property uploadStatus
         * @type {Object}
         */
        uploadStatus: computed(function() {
            return { uploading: false, percentComplete: 0, error: false };
        }),

        /**
         * @property validFiles
         * @return {Array}
         */
        validFiles: computed(function() {
            return this.getFiles(STATUS_TYPES.VALID);
        }).property(...COMPUTED_OBSERVER),

        /**
         * @property invalidFiles
         * @return {Array}
         */
        invalidFiles: computed(function() {
            return this.getFiles(STATUS_TYPES.INVALID);
        }).property(...COMPUTED_OBSERVER),

        /**
         * @property uploadedFiles
         * @return {Array}
         */
        uploadedFiles: computed(function() {
            return this.getFiles(STATUS_TYPES.UPLOADED);
        }).property(...COMPUTED_OBSERVER),

        /**
         * @property deletedFiles
         * @return {Array}
         */
        deletedFiles: computed(function() {
            return this.getFiles(STATUS_TYPES.DELETED);
        }).property(...COMPUTED_OBSERVER),

        /**
         * @property deletedModels
         * @return {Array}
         */
        deletedModels: computed(function() {
            return this.getFiles(STATUS_TYPES.DELETED);
        }).property(...COMPUTED_OBSERVER),

        /**
         * @property requestSize
         * @return {Array}
         */
        requestSize: computed(function() {
            return get(this, 'validFiles').reduce((size, model) => size + model.getFileSize(), 0);
        }).property(COMPUTED_OBSERVER),

        /**
         * @method getFiles
         * @param {Number} statusType
         * @return {Array}
         */
        getFiles(statusType) {
            return statusType ? this.files.filter(file => file.statusType & statusType) : this.files;
        },

        /**
         * @method isValid
         * @param {Model} model
         * @return {Boolean}
         */
        isValid(model) {

            if (!(model instanceof Ember.Object)) {
                return false;
            }

            /**
             * @method validMime
             * @param {String} mimeType
             * @return {Function}
             */
            const validMime = mimeType => () => {

                const anyRegExp = this.get('options.mimeTypes').some(mimeType => mimeType instanceof RegExp);
                const mimeTypes = get(this, 'options.mimeTypes');

                if (!anyRegExp) {

                    // Simply indexOf check because none of the MIME types are regular expressions.
                    return !!~mimeTypes.indexOf(mimeType);

                }

                // Otherwise we'll need to iterate and validate individually.
                return mimeTypes.some(validMimeType => {

                    const isExact  = validMimeType === mimeType;
                    const isRegExp = !!mimeType.match(validMimeType);

                    return isExact || isRegExp;

                });

            };

            /**
             * @method validSize
             * @param {Number} fileSize
             * @return {Function}
             */
            const validSize = fileSize => () => fileSize <= Number(get(this, 'options.maximumSize'));

            /**
             * @method composeEvery
             * @param {Function} fns
             * @return {Function}
             */
            const composeEvery = (...fns) => model => fns.reverse().every(fn => fn(model));

            /**
             * @method isValid
             * @type {Function}
             */
            const isValid = composeEvery(
                validMime(model.getMIMEType()),
                validSize(model.getFileSize())
            );

            return isValid(model);

        },

        /**
         * @method getFormData
         * @return {FormData}
         */
        getFormData() {

            const formData  = new $window.FormData();
            const fieldName = this.get('options.useArray') ? 'file[]' : 'file';
            const postData  = this.get('options.requestPostData');
            const files     = get(this, 'validFiles').map(model => model.file);

            formData.append(fieldName, files);

            Object.keys(postData).forEach(key => {
                formData.append(key, postData[key]);
            });

            return formData;
            
        },

        /**
         * @method addProgressListener
         * @param {Ember.$.ajaxSettings.xhr} xhr
         * @return {void}
         */
        addProgressListener(xhr) {
            return void xhr;
        },

        /**
         * @method addSuccessListener
         * @param {Ember.$.ajaxSettings.xhr} xhr
         * @return {void}
         */
        addSuccessListener(xhr) {
            return void xhr;
        },

        /**
         * @method addErrorListener
         * @param {Ember.$.ajaxSettings.xhr} xhr
         * @return {void}
         */
        addErrorListener(xhr) {
            return void xhr;
        },

        /**
         * @method getRequest
         * @return {Ember.$.ajax}
         */
        getRequest() {

            const isFunction = value => typeof value === 'function';
            const url        = isFunction(get(this, 'url')) ? get(this, 'url').apply(this) : get(this, 'url');
            const method     = get(this, 'options.requestMethod') || 'POST';
            const data       = this.getFormData();
            const headers    = this.get('requestHeaders');
            const request    = $Ember.$.ajax({ url, method, headers, data, processData: false, contentType: false,

                /**
                 * @method xhr
                 * @return {Ember.$.ajaxSettings.xhr}
                 */
                xhr: () => {

                    const xhr = $Ember.$.ajaxSettings.xhr();
                    this.addProgressListener(xhr.upload);
                    this.addSuccessListener(xhr.upload);
                    this.addErrorListener(xhr.upload);
                    set(this, 'lastRequest', xhr);
                    return xhr;

                }
            });

            set(this, 'lastResolver', request);
            return request;

        },

        /**
         * @property actions
         * @type {Object}
         * @return {void}
         */
        actions: {

            /**
             * @method uploadFiles
             * @return {Ember.RSVP.Promise}
             */
            uploadFiles() {

                const models  = get(this, 'files').filter(file => file.statusType & STATUS_TYPES.VALID);
                const request = this.getRequest();

                set(this, 'uploadStatus.uploading', true);
                set(this, 'uploadStatus.error', false);

                /**
                 * @method resolver
                 * @param {Function} resolve
                 * @param {Function} reject
                 * @return {void}
                 */
                const resolver = (resolve, reject) => {
                    this.invokeHook('promiseResolver', resolve, reject, models);
                    request.done(resolve).fail(reject);
                };

                /**
                 * @method resolved
                 * @param {Object} response
                 * @return {void}
                 */
                const resolved = response => {
                    this.invokeHook('didUpload', ...response.files);
                    models.map(model => model.setStatusType(STATUS_TYPES.UPLOADED));
                };

                /**
                 * @method rejected
                 * @param {Object} request
                 * @param {String} textStatus
                 * @param {Number} errorThrown
                 */
                const rejected = ({ request, textStatus, errorThrown }) => {
                    set(this, 'uploadStatus.error', { request, textStatus, errorThrown });
                };

                /**
                 * @method always
                 * @return {void}
                 */
                const always = () => {
                    set(this, 'uploadStatus.uploading', false);
                    this.invokeHook('didComplete');
                };

                return new $Ember.RSVP.Promise(resolver).then(resolved, rejected).finally(always);

            },

            /**
             * @method abortUpload
             * @return {void}
             */
            abortUpload() {

                const request = get(this, 'lastResolver');

                if (request && get(this, 'uploadStatus.uploading')) {
                    request.abort();
                    set(this, 'uploadStatus.uploading', false);
                }

            },

            /**
             * @method mimeTypes
             * @param {Array} mimeTypes
             * @param {Object} [mode=MIME_MODE.PUSH]
             * @return {void}
             */
            mimeTypes(mimeTypes, mode = MIME_MODE.PUSH) {
                mode === MIME_MODE.SET && set(this, 'options.mimeTypes', []);
                mimeTypes = Array.isArray(mimeTypes) ? mimeTypes : [mimeTypes];
                const types = [...get(this, 'options.mimeTypes'), ...mimeTypes];
                set(this, 'options.mimeTypes', types);
            },

            /**
             * @method addFiles
             * @param {Model[]} files
             * @return {void}
             */
            addFiles(...files) {

                const addedModels = files.map(model => {

                    if (model instanceof Ember.Object) {
                        model.setStatusType(this.isValid(model) ? STATUS_TYPES.VALID : STATUS_TYPES.INVALID);
                        get(this, 'files').pushObject(model);
                        return model;
                    }

                }).filter(model => typeof model !== 'undefined');

                addedModels.length && this.invokeHook('didAdd', ...addedModels);

            },

            /**
             * @method prepareFiles
             * @param {FileList|Array} files
             * @return {Array}
             */
            prepareFiles(...files) {

                // Convert the FileList object into an actual array.
                files = Array.from ? Array.from(files) : Array.prototype.slice.call(files);

                const models = files.reduce((current, file) => {

                    const model = Model.create({
                        file: file
                    });

                    current.push(model);
                    return current;

                }, []);

                // Add the files using the Droplet component.
                this.send('addFiles', ...models);
                return models;

            },

            /**
             * @method deleteFiles
             * @param {Model[]} files
             * @return {void}
             */
            deleteFiles(...files) {

                const deletedModels = files.map(model => {

                    const contains = !!~get(this, 'files').indexOf(model);

                    if (contains) {
                        model.setStatusType(STATUS_TYPES.DELETED);
                        return model;
                    }

                }).filter(model => typeof model !== 'undefined');

                deletedModels.length && this.invokeHook('didDelete', ...deletedModels);

            },

            /**
             * @method clearFiles
             * @return {void}
             */
            clearFiles() {
                this.files.forEach(file => this.send('deleteFiles', file));
            }

        }

    });

    /**
     * @method squashEvent
     * @param {Object} event
     * @return {void}
     */
    const squashEvent = event => {
        event.preventDefault();
        event.stopPropagation();
    };

    /**
     * @module Droplet
     * @submodule Area
     * @author Adam Timberlake
     * @see https://github.com/Wildhoney/EmberDroplet
     */
    $window.Droplet.Area = Mixin.create({

        /**
         * @property classNames
         * @type {Array}
         */
        classNames: ['droppable'],

        /**
         * @method getParent
         * @return {Object}
         */
        getParent() {
            return this.context.get('parentView') || {};
        },

        /**
         * @method drop
         * @param {Object} event
         * @return {Array}
         */
        drop(event) {
            squashEvent(event);
            return this.handleFiles(event.dataTransfer.files);
        },

        /**
         * @method handleFiles
         * @param {Array} models
         * @return {Model[]}
         */
        handleFiles(models) {

            if (models.length && this.getParent().send) {

                // Add the models to the parent if the parent exists, otherwise it's a no-op.
                this.getParent().send('prepareFiles', ...models);

            }

            return models;

        },

        /**
         * @method dragEnter
         * @param {Object} event
         * @return {void}
         */
        dragEnter: squashEvent,

        /**
         * @method dragOver
         * @param {Object} event
         * @return {void}
         */
        dragOver: squashEvent,

        /**
         * @method dragLeave
         * @param {Object} event
         * @return {void}
         */
        dragLeave: squashEvent

    });

    /**
     * @module Droplet
     * @submodule Preview
     * @author Adam Timberlake
     * @see https://github.com/Wildhoney/EmberDroplet
     */
    $window.Droplet.Preview = Mixin.create({

        /**
         * @property tagName
         * @type {String}
         */
        tagName: 'img',

        /**
         * @property attributeBindings
         * @type {Array}
         */
        attributeBindings: ['src'],

        /**
         * @method reader
         * @type {FileReader|Object}
         */
        reader: $FileReader,

        /**
         * @property image
         * @type {File|Object}
         */
        image: { file: { type: '' } },

        /**
         * @method isImage
         * @type {File|Object} image
         * @return {Boolean}
         */
        isImage(image) {
            return !!image.type.match(/^image\//i);
        },

        /**
         * @method didInsertElement
         * @return {void}
         */
        didInsertElement() {

            const Reader = this.get('reader');
            const reader = new Reader();
            const image  = get(this, 'image.file');

            if (!this.isImage(image)) {
                this.destroy();
                return;
            }

            reader.addEventListener('load', run.bind(this, event => {
                set(this, 'src', event.target.result);
            }));

            reader.readAsDataURL(image);

        }

    });

    /**
     * @module Droplet
     * @submodule MultipleInput
     * @author Adam Timberlake
     * @see https://github.com/Wildhoney/EmberDroplet
     */
    $window.Droplet.MultipleInput = Mixin.create({

        /**
         * @property tagName
         * @type {String}
         */
        tagName: 'input',

        /**
         * @property classNames
         * @type {String}
         */
        classNames: 'files',

        /**
         * @property attributeBindings
         * @type {Array}
         */
        attributeBindings: ['disabled', 'name', 'type', 'multiple'],

        /**
         * @property file
         * @type {String}
         */
        type: 'file',

        /**
         * @property multiple
         * @type {String}
         */
        multiple: 'multiple',

        /**
         * @method change
         * @return {void}
         */
        change() {
            const element = this.get('element');
            const files   = Array.isArray(element.files) ? element.files : [element.files];
            this.handleFiles(files);
        },

        /**
         * @method handleFiles
         * @param {Model[]} files
         * @return {void}
         */
        handleFiles(files) {
            this.get('parentView').send('prepareFiles', ...files);
        }
        
    });

    /**
     * @module Droplet
     * @submodule SingleInput
     * @author Adam Timberlake
     * @see https://github.com/Wildhoney/EmberDroplet
     */
    $window.Droplet.SingleInput = Mixin.create($window.Droplet.MultipleInput, {
        multiple: false
    });

})(window, window.Ember, window.FileReader);
