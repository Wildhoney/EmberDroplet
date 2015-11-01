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
     * @constant REQUEST_METHODS
     * @type {{PATCH: string, POST: string, PUT: string}}
     */
    const REQUEST_METHODS = { PATCH: 'PATCH', POST: 'POST', PUT: 'PUT' };

    /**
     * @constant EVENT_NAME
     * @type {String}
     */
    const EVENT_NAME = 'droplet/add-files';

    /**
     * @method fromArray
     * @param {*} arrayLike
     * @return {Array}
     */
    const fromArray = arrayLike => typeof Array.from === 'function' ? Array.from(arrayLike) : Array.prototype.slice.call(arrayLike);

    /**
     * @property EventBus
     * @type {Ember.Service}
     */
    const EventBus = $Ember.Service.extend($Ember.Evented, {

        /**
         * @method publish
         * @return {void}
         */
        publish: function publish() {
            this.trigger.apply(this, arguments);
        },

        /**
         * @method subscribe
         * @return {void}
         */
        subscribe: function() {
            this.on.apply(this, arguments);
        },

        /**
         * @method unsubscribe
         * @return {void}
         */
        unsubscribe: function() {
            this.off.apply(this, arguments);
        }

    });

    $Ember.Application.initializer({

        /**
         * @property string
         * @type {String}
         */
        name: 'load-services',

        /**
         * @method initialize
         * @param {Object} container
         * @param {Object} application
         * @return {void}
         */
        initialize: function(container, application) {

            const eventBus = EventBus.create();

            application.register('event-bus:current', eventBus, {
                instantiate: false
            });

            application.inject('component', 'DropletEventBus', 'event-bus:current');
            application.inject('controller', 'DropletEventBus', 'event-bus:current');

        }

    });

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
        requestMethod: REQUEST_METHODS.POST,

        /**
         * @property maximumSize
         * @type {Number|Infinity}
         */
        maximumSize: Infinity,

        /**
         * @property maximumValidFiles
         * @type {Number|Infinity}
         */
        maximumValidFiles: Infinity,

        /**
         * @property uploadImmediately
         * @type {Boolean}
         */
        uploadImmediately: false,

        /**
         * @property includeXFileSize
         * @type {Boolean}
         */
        includeXFileSize: true,

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

            const hooks = $Ember.merge({}, this.get('hooks'));
            set(this, 'hooks', hooks);

            const options = $Ember.merge({}, DEFAULT_OPTIONS);
            $Ember.merge(options, this.get('options'));
            set(this, 'options', options);

            this.DropletEventBus && this.DropletEventBus.subscribe(EVENT_NAME, this, (...files) => {
                this.send('prepareFiles', ...files);
            });

            this._super();

        },

        /**
         * @method willDestroy
         * @return {void}
         */
        willDestroy() {

            this._super();
            
            const lastRequest = this.get('lastRequest');

            if (lastRequest) {
                delete lastRequest.upload.onprogress;
                delete lastRequest.upload.onload;
                delete lastRequest.upload.onerror;
                this.send('abortUpload');
            }

        },

        /**
         * @method invokeHook
         * @param {String} name
         * @param {Array} args
         * @return {void}
         */
        invokeHook(name, ...args) {
            const method = get(this, 'hooks')[name] || (() => {});
            $Ember.run(() => method.apply(this, args));
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
         * @property requestSize
         * @return {Array}
         */
        requestSize: computed(function() {
            return get(this, 'validFiles').reduce((size, model) => size + model.getFileSize(), 0);
        }).property(...COMPUTED_OBSERVER),

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

            if (!(model instanceof $Ember.Object)) {
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

            files.forEach(file => {
                formData.append(fieldName, file);
            });

            Object.keys(postData).forEach(key => {
                formData.append(key, postData[key]);
            });

            return formData;
            
        },

        /**
         * @method addProgressListener
         * @param {Ember.$.ajaxSettings.xhr} uploadRequest
         * @return {void}
         */
        addProgressListener(uploadRequest) {

            uploadRequest.addEventListener('progress', (event) => {

                if (event.lengthComputable) {
                    const percentageLoaded = (event.loaded / get(this, 'requestSize')) * 100;
                    set(this, 'uploadStatus.percentComplete', Math.round(percentageLoaded));
                }

            });

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
            const headers    = $Ember.merge({}, this.get('options.requestHeaders'));

            if (get(this, 'options.includeXFileSize')) {
                headers['X-File-Size'] = this.get('requestSize');
            }

            const request = $Ember.$.ajax({ url, method, headers, data, processData: false, contentType: false,

                /**
                 * @method xhr
                 * @return {Ember.$.ajaxSettings.xhr}
                 */
                xhr: () => {

                    const xhr = $Ember.$.ajaxSettings.xhr();
                    this.addProgressListener(xhr.upload);
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

                set(this, 'abortedUpload', false);
                set(this, 'uploadStatus.percentComplete', 0);
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
                    this.invokeHook('didUpload', response);
                    models.map(model => model.setStatusType(STATUS_TYPES.UPLOADED));
                };

                /**
                 * @method rejected
                 * @param {Object} request
                 * @param {String} textStatus
                 * @param {Number} errorThrown
                 */
                const rejected = ({ request, textStatus, errorThrown }) => {

                    if (get(this, 'abortedUpload') !== true) {
                        set(this, 'uploadStatus.error', { request, textStatus, errorThrown });
                    }

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
                    set(this, 'abortedUpload', true);
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

                    const willExceedQuota = this.get('validFiles.length') === this.get('options.maximumValidFiles');

                    if (model instanceof $Ember.Object) {

                        const statusType = this.isValid(model) && !willExceedQuota ? STATUS_TYPES.VALID : STATUS_TYPES.INVALID;
                        run(() => model.setStatusType(statusType));
                        get(this, 'files').pushObject(model);
                        return model;
                    }

                }).filter(model => typeof model !== 'undefined');

                addedModels.length && this.invokeHook('didAdd', ...addedModels);

                if (this.get('options.uploadImmediately')) {
                    this.send('uploadFiles', ...addedModels);
                }

            },

            /**
             * @method prepareFiles
             * @param {FileList|Array} files
             * @return {Array}
             */
            prepareFiles(...files) {

                // Convert the FileList object into an actual array.
                files = fromArray(files);

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
                const files = [...this.get('validFiles'), ...this.get('invalidFiles')];
                files.forEach(file => this.send('deleteFiles', file));
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
            this.DropletEventBus && this.DropletEventBus.publish(EVENT_NAME, ...fromArray(models));
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

                if (this.get('isDestroyed') !== true) {
                    set(this, 'src', event.target.result);
                }

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
            const files = this.get('element').files;
            this.handleFiles(files);
        },

        /**
         * @method handleFiles
         * @param {Model[]} models
         * @return {void}
         */
        handleFiles(models) {
            this.DropletEventBus && this.DropletEventBus.publish(EVENT_NAME, ...fromArray(models));
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

    /**
     * @constant $window.Droplet.METHOD
     * @type {Object}
     */
    $window.Droplet.METHOD = REQUEST_METHODS;

})(window, window.Ember, window.FileReader);
