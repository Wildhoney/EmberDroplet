'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

(function main($window, $Ember, $FileReader) {

  "use strict";

  // Extract the commonly accessed Ember methods.

  var _computed, _computed2, _computed3, _computed4, _computed5;

  var Mixin = $Ember.Mixin;
  var String = $Ember.String;
  var computed = $Ember.computed;
  var get = $Ember.get;
  var set = $Ember.set;
  var run = $Ember.run;

  /**
   * @constant STATUS_TYPES
   * @type {Object}
   */
  var STATUS_TYPES = { NONE: 0, VALID: 1, INVALID: 2, DELETED: 4, UPLOADED: 8, FAILED: 16 };

  /**
   * @constant REQUEST_METHODS
   * @type {{PATCH: string, POST: string, PUT: string}}
   */
  var REQUEST_METHODS = { PATCH: 'PATCH', POST: 'POST', PUT: 'PUT' };

  /**
   * @constant EVENT_NAME
   * @type {String}
   */
  var EVENT_NAME = 'droplet/add-files';

  /**
   * @method fromArray
   * @param {*} arrayLike
   * @return {Array}
   */
  var fromArray = function fromArray(arrayLike) {
    return typeof Array.from === 'function' ? Array.from(arrayLike) : Array.prototype.slice.call(arrayLike);
  };

  /**
   * @property EventBus
   * @type {Ember.Service}
   */
  var EventBus = $Ember.Service.extend($Ember.Evented, {

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
    subscribe: function subscribe() {
      this.on.apply(this, arguments);
    },

    /**
     * @method unsubscribe
     * @return {void}
     */
    unsubscribe: function unsubscribe() {
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
     * @param {Object} application
     * @return {void}
     */
    initialize: function initialize(application) {

      var eventBus = EventBus.create();

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
  var Model = $Ember.Object.extend({

    /**
     * @method init
     * @return {void}
     */
    init: function init() {
      this.statusType = STATUS_TYPES.NONE;
    },

    /**
     * @method getMIMEType
     * @return {String}
     */
    getMIMEType: function getMIMEType() {
      return this.file.type || '';
    },

    /**
     * @method getFileSize
     * @return {Number}
     */
    getFileSize: function getFileSize() {
      return typeof this.file.size !== 'undefined' ? this.file.size : Infinity;
    },

    /**
     * @method setStatusType
     * @param {Number} statusType
     * @return {void}
     */
    setStatusType: function setStatusType(statusType) {
      this.set('statusType', Number(statusType));
    }

  });

  /**
   * @constant MIME_MODE
   * @type {Object}
   */
  var MIME_MODE = { PUSH: 'push', SET: 'set' };

  /**
   * @constant DEFAULT_OPTIONS
   * @type {Object}
   */
  var DEFAULT_OPTIONS = {

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
  var COMPUTED_OBSERVER = String.w('files.length files.@each.statusType');

  /**
   * @constant MESSAGES
   * @type {Object}
   */
  var MESSAGES = {
    URL_REQUIRED: 'Droplet: You must specify the URL parameter when constructing your component.'
  };

  /**
   * @module Droplet
   * @author Adam Timberlake
   * @see https://github.com/Wildhoney/EmberDroplet
   */
  $window.Droplet = {

    /**
     * @property url
     * @throws {Error}
     * @type {Function}
     */
    url: function url() {
      throw new Error(MESSAGES.URL_REQUIRED);
    },

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
    init: function init() {
      var _this = this;

      set(this, 'files', []);

      var hooks = $Ember.merge({}, this.get('hooks'));
      set(this, 'hooks', hooks);

      var options = $Ember.merge({}, DEFAULT_OPTIONS);
      $Ember.merge(options, this.get('options'));
      set(this, 'options', options);

      this.DropletEventBus && this.DropletEventBus.subscribe(EVENT_NAME, this, function (ctx) {
        for (var _len = arguments.length, files = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          files[_key - 1] = arguments[_key];
        }

        if (!ctx || ctx === _this) {
          _this.send.apply(_this, ['prepareFiles'].concat(files));
        }
      });

      this._super();
    },

    /**
     * @method willDestroy
     * @return {void}
     */
    willDestroy: function willDestroy() {

      this._super();

      this.DropletEventBus && this.DropletEventBus.unsubscribe(EVENT_NAME, this);

      var lastRequest = this.get('lastRequest');

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
    invokeHook: function invokeHook(name) {
      var _this2 = this;

      for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      var method = get(this, 'hooks')[name] || function () {};
      $Ember.run(function () {
        return method.apply(_this2, args);
      });
    },

    /**
     * @property uploadStatus
     * @type {Object}
     */
    uploadStatus: computed(function () {
      return { uploading: false, percentComplete: 0, error: false };
    }),

    /**
     * @property validFiles
     * @return {Array}
     */
    validFiles: (_computed = computed(function () {
      return this.getFiles(STATUS_TYPES.VALID);
    })).property.apply(_computed, _toConsumableArray(COMPUTED_OBSERVER)),

    /**
     * @property invalidFiles
     * @return {Array}
     */
    invalidFiles: (_computed2 = computed(function () {
      return this.getFiles(STATUS_TYPES.INVALID);
    })).property.apply(_computed2, _toConsumableArray(COMPUTED_OBSERVER)),

    /**
     * @property uploadedFiles
     * @return {Array}
     */
    uploadedFiles: (_computed3 = computed(function () {
      return this.getFiles(STATUS_TYPES.UPLOADED);
    })).property.apply(_computed3, _toConsumableArray(COMPUTED_OBSERVER)),

    /**
     * @property deletedFiles
     * @return {Array}
     */
    deletedFiles: (_computed4 = computed(function () {
      return this.getFiles(STATUS_TYPES.DELETED);
    })).property.apply(_computed4, _toConsumableArray(COMPUTED_OBSERVER)),

    /**
     * @property requestSize
     * @return {Array}
     */
    requestSize: (_computed5 = computed(function () {
      return get(this, 'validFiles').reduce(function (size, model) {
        return size + model.getFileSize();
      }, 0);
    })).property.apply(_computed5, _toConsumableArray(COMPUTED_OBSERVER)),

    /**
     * @method getFiles
     * @param {Number} statusType
     * @return {Array}
     */
    getFiles: function getFiles(statusType) {
      return statusType ? this.files.filter(function (file) {
        return file.statusType & statusType;
      }) : this.files;
    },

    /**
     * @method isValid
     * @param {Model} model
     * @return {Boolean}
     */
    isValid: function isValid(model) {
      var _this3 = this;

      if (!(model instanceof $Ember.Object)) {
        return false;
      }

      /**
       * @method validMime
       * @param {String} mimeType
       * @return {Function}
       */
      var validMime = function validMime(mimeType) {
        return function () {

          var anyRegExp = _this3.get('options.mimeTypes').some(function (mimeType) {
            return mimeType instanceof RegExp;
          });
          var mimeTypes = get(_this3, 'options.mimeTypes');

          if (!anyRegExp) {

            // Simply indexOf check because none of the MIME types are regular expressions.
            return !! ~mimeTypes.indexOf(mimeType);
          }

          // Otherwise we'll need to iterate and validate individually.
          return mimeTypes.some(function (validMimeType) {

            var isExact = validMimeType === mimeType;
            var isRegExp = !!mimeType.match(validMimeType);

            return isExact || isRegExp;
          });
        };
      };

      /**
       * @method validSize
       * @param {Number} fileSize
       * @return {Function}
       */
      var validSize = function validSize(fileSize) {
        return function () {
          return fileSize <= Number(get(_this3, 'options.maximumSize'));
        };
      };

      /**
       * @method composeEvery
       * @param {Function} fns
       * @return {Function}
       */
      var composeEvery = function composeEvery() {
        for (var _len3 = arguments.length, fns = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          fns[_key3] = arguments[_key3];
        }

        return function (model) {
          return fns.reverse().every(function (fn) {
            return fn(model);
          });
        };
      };

      /**
       * @method isValid
       * @type {Function}
       */
      var isValid = composeEvery(validMime(model.getMIMEType()), validSize(model.getFileSize()));

      return isValid(model);
    },

    /**
     * @method getFormData
     * @return {FormData}
     */
    getFormData: function getFormData() {

      var formData = new $window.FormData();
      var fieldName = this.get('options.useArray') ? 'file[]' : 'file';
      var postData = this.get('options.requestPostData');
      var files = get(this, 'validFiles').map(function (model) {
        return model.file;
      });

      files.forEach(function (file) {
        formData.append(fieldName, file);
      });

      Object.keys(postData).forEach(function (key) {
        formData.append(key, postData[key]);
      });

      return formData;
    },

    /**
     * @method addProgressListener
     * @param {Ember.$.ajaxSettings.xhr} uploadRequest
     * @return {void}
     */
    addProgressListener: function addProgressListener(uploadRequest) {
      var _this4 = this;

      uploadRequest.addEventListener('progress', function (event) {

        if (event.lengthComputable) {
          var percentageLoaded = event.loaded / get(_this4, 'requestSize') * 100;
          set(_this4, 'uploadStatus.percentComplete', Math.round(percentageLoaded));
        }
      });
    },

    /**
     * @method getRequest
     * @return {Ember.$.ajax}
     */
    getRequest: function getRequest() {
      var _this5 = this;

      var isFunction = function isFunction(value) {
        return typeof value === 'function';
      };
      var url = isFunction(get(this, 'url')) ? get(this, 'url').apply(this) : get(this, 'url');
      var method = get(this, 'options.requestMethod') || 'POST';
      var data = this.getFormData();
      var headers = $Ember.merge({}, this.get('options.requestHeaders'));

      if (get(this, 'options.includeXFileSize')) {
        headers['X-File-Size'] = this.get('requestSize');
      }

      var request = $Ember.$.ajax({ url: url, method: method, headers: headers, data: data, processData: false, contentType: false,

        /**
         * @method xhr
         * @return {Ember.$.ajaxSettings.xhr}
         */
        xhr: function xhr() {

          var xhr = $Ember.$.ajaxSettings.xhr();
          _this5.addProgressListener(xhr.upload);
          set(_this5, 'lastRequest', xhr);
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
      uploadFiles: function uploadFiles() {
        var _this6 = this;

        var models = get(this, 'files').filter(function (file) {
          return file.statusType & STATUS_TYPES.VALID;
        });
        var request = this.getRequest();

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
        var resolver = function resolver(resolve, reject) {
          _this6.invokeHook('promiseResolver', resolve, reject, models);
          request.done(resolve).fail(reject);
        };

        /**
         * @method resolved
         * @param {Object} response
         * @return {void}
         */
        var resolved = function resolved(response) {
          _this6.invokeHook('didUpload', response);
          models.map(function (model) {
            return model.setStatusType(STATUS_TYPES.UPLOADED);
          });
        };

        /**
         * @method rejected
         * @param {Object} request
         * @param {String} textStatus
         * @param {Number} errorThrown
         */
        var rejected = function rejected(_ref) {
          var request = _ref.request;
          var textStatus = _ref.textStatus;
          var errorThrown = _ref.errorThrown;

          if (get(_this6, 'abortedUpload') !== true) {
            set(_this6, 'uploadStatus.error', { request: request, textStatus: textStatus, errorThrown: errorThrown });
          }
        };

        /**
         * @method always
         * @return {void}
         */
        var always = function always() {
          set(_this6, 'uploadStatus.uploading', false);
          _this6.invokeHook('didComplete');
        };

        return new $Ember.RSVP.Promise(resolver).then(resolved, rejected)['finally'](always);
      },

      /**
       * @method abortUpload
       * @return {void}
       */
      abortUpload: function abortUpload() {

        var request = get(this, 'lastResolver');

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
      mimeTypes: function mimeTypes(_mimeTypes) {
        var mode = arguments.length <= 1 || arguments[1] === undefined ? MIME_MODE.PUSH : arguments[1];

        mode === MIME_MODE.SET && set(this, 'options.mimeTypes', []);
        _mimeTypes = Array.isArray(_mimeTypes) ? _mimeTypes : [_mimeTypes];
        var types = [].concat(_toConsumableArray(get(this, 'options.mimeTypes')), _toConsumableArray(_mimeTypes));
        set(this, 'options.mimeTypes', types);
      },

      /**
       * @method addFiles
       * @param {Model[]} files
       * @return {void}
       */
      addFiles: function addFiles() {
        var _this7 = this;

        for (var _len4 = arguments.length, files = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          files[_key4] = arguments[_key4];
        }

        var addedModels = files.map(function (model) {

          var willExceedQuota = _this7.get('validFiles.length') === _this7.get('options.maximumValidFiles');

          if (model instanceof $Ember.Object) {
            var _ret = (function () {

              var statusType = _this7.isValid(model) && !willExceedQuota ? STATUS_TYPES.VALID : STATUS_TYPES.INVALID;
              run(function () {
                return model.setStatusType(statusType);
              });
              get(_this7, 'files').pushObject(model);
              return {
                v: model
              };
            })();

            if (typeof _ret === 'object') return _ret.v;
          }
        }).filter(function (model) {
          return typeof model !== 'undefined';
        });

        addedModels.length && this.invokeHook.apply(this, ['didAdd'].concat(_toConsumableArray(addedModels)));

        if (this.get('options.uploadImmediately') && this.getFiles(STATUS_TYPES.VALID).length > 0) {
          this.send.apply(this, ['uploadFiles'].concat(_toConsumableArray(addedModels)));
        }
      },

      /**
       * @method prepareFiles
       * @param {FileList|Array} files
       * @return {Array}
       */
      prepareFiles: function prepareFiles() {
        for (var _len5 = arguments.length, files = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
          files[_key5] = arguments[_key5];
        }

        // Convert the FileList object into an actual array.
        files = fromArray(files);

        var models = files.reduce(function (current, file) {

          var model = Model.create({
            file: file
          });

          current.push(model);
          return current;
        }, []);

        // Add the files using the Droplet component.
        this.send.apply(this, ['addFiles'].concat(_toConsumableArray(models)));
        return models;
      },

      /**
       * @method deleteFiles
       * @param {Model[]} files
       * @return {void}
       */
      deleteFiles: function deleteFiles() {
        var _this8 = this;

        for (var _len6 = arguments.length, files = Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
          files[_key6] = arguments[_key6];
        }

        var deletedModels = files.map(function (model) {

          var contains = !! ~get(_this8, 'files').indexOf(model);

          if (contains) {
            model.setStatusType(STATUS_TYPES.DELETED);
            return model;
          }
        }).filter(function (model) {
          return typeof model !== 'undefined';
        });

        deletedModels.length && this.invokeHook.apply(this, ['didDelete'].concat(_toConsumableArray(deletedModels)));
      },

      /**
       * @method clearFiles
       * @return {void}
       */
      clearFiles: function clearFiles() {
        var _this9 = this;

        var files = [].concat(_toConsumableArray(this.get('validFiles')), _toConsumableArray(this.get('invalidFiles')));
        files.forEach(function (file) {
          return _this9.send('deleteFiles', file);
        });
      }

    }

  };

  /**
   * @method squashEvent
   * @param {Object} event
   * @return {void}
   */
  var squashEvent = function squashEvent(event) {
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
    drop: function drop(event) {
      squashEvent(event);
      return this.handleFiles(event.dataTransfer.files);
    },

    /**
     * @method handleFiles
     * @param {Array} models
     * @return {Model[]}
     */
    handleFiles: function handleFiles(models) {
      var _DropletEventBus;

      this.DropletEventBus && (_DropletEventBus = this.DropletEventBus).publish.apply(_DropletEventBus, [EVENT_NAME, this.get('ctx')].concat(_toConsumableArray(fromArray(models))));
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
    isImage: function isImage(image) {
      return !!image.type.match(/^image\//i);
    },

    /**
     * @method didInsertElement
     * @return {void}
     */
    didInsertElement: function didInsertElement() {
      var _this10 = this;

      var Reader = this.get('reader');
      var reader = new Reader();
      var image = get(this, 'image.file');

      if (!this.isImage(image)) {
        this.destroy();
        return;
      }

      reader.addEventListener('load', run.bind(this, function (event) {

        if (_this10.get('isDestroyed') !== true) {
          set(_this10, 'src', event.target.result);
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
    change: function change() {
      var files = this.get('element').files;
      this.handleFiles(files);
    },

    /**
     * @method handleFiles
     * @param {Model[]} models
     * @return {void}
     */
    handleFiles: function handleFiles(models) {
      var _DropletEventBus2;

      this.DropletEventBus && (_DropletEventBus2 = this.DropletEventBus).publish.apply(_DropletEventBus2, [EVENT_NAME, this.get('ctx')].concat(_toConsumableArray(fromArray(models))));
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