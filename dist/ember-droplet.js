'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

(function main($window, $Ember, $FileReader) {

  "use strict";

  // Extract the commonly accessed Ember methods.
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
   * @constructor
   * @type {Model}
   */

  var Model = (function () {

    /**
     * @constructor
     * @param {File} [file={}]
     */

    function Model() {
      var file = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

      _classCallCheck(this, Model);

      this.file = file;
      this.statusType = STATUS_TYPES.NONE;
    }

    /**
     * @constant MIME_MODE
     * @type {Object}
     */

    /**
     * @method getMIMEType
     * @return {String}
     */

    _createClass(Model, [{
      key: 'getMIMEType',
      value: function getMIMEType() {
        return this.file.type || '';
      }

      /**
       * @method getFileSize
       * @return {Number}
       */
    }, {
      key: 'getFileSize',
      value: function getFileSize() {
        return typeof this.file.size !== 'undefined' ? this.file.size : Infinity;
      }

      /**
       * @method setStatusType
       * @param {Number} statusType
       * @return {void}
       */
    }, {
      key: 'setStatusType',
      value: function setStatusType(statusType) {
        this.statusType = Number(statusType);
      }
    }]);

    return Model;
  })();

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
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/gif', 'image/png', 'image/tiff', 'image/bmp']

  };

  /**
   * @constant COMPUTED_OBSERVER
   * @type {Array}
   */
  var COMPUTED_OBSERVER = String.w('files.length', 'files.@each.statusType');

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
  $window.Droplet = Mixin.create({

    /**
     * @property url
     * @throws {Error}
     * @type {Function}
     */
    url: function url() {
      throw new Error(MESSAGES.URL_REQUIRED);
    },

    /**
     * @property options
     * @type {Object}
     */
    options: {},

    /**
     * @property hooks
     * @type {Object}
     */
    hooks: { didAdd: function didAdd() {}, didDelete: function didDelete() {}, didUpload: function didUpload() {} },

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
      set(this, 'hooks', { didAdd: function didAdd() {}, didDelete: function didDelete() {}, didUpload: function didUpload() {} });

      Object.keys(DEFAULT_OPTIONS).forEach(function (key) {

        // Copy across all of the options into the options map.
        set(_this, 'options.' + key, DEFAULT_OPTIONS[key]);
      });

      this._super();
    },

    /**
     * @method invokeHook
     * @param {String} name
     * @param {Array} args
     * @return {void}
     */
    invokeHook: function invokeHook(name) {
      var method = get(this, 'hooks')[name] || function () {};

      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      method.apply(undefined, args);
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
    validFiles: computed(function () {
      return this.getFiles(STATUS_TYPES.VALID);
    }).property(COMPUTED_OBSERVER),

    /**
     * @property invalidFiles
     * @return {Array}
     */
    invalidFiles: computed(function () {
      return this.getFiles(STATUS_TYPES.INVALID);
    }).property(COMPUTED_OBSERVER),

    /**
     * @property uploadedFiles
     * @return {Array}
     */
    uploadedFiles: computed(function () {
      return this.getFiles(STATUS_TYPES.UPLOADED);
    }).property(COMPUTED_OBSERVER),

    /**
     * @property deletedFiles
     * @return {Array}
     */
    deletedFiles: computed(function () {
      return this.getFiles(STATUS_TYPES.DELETED);
    }).property(COMPUTED_OBSERVER),

    /**
     * @property requestSize
     * @return {Array}
     */
    requestSize: computed(function () {
      return get(this, 'validFiles').reduce(function (size, model) {
        return size + model.getFileSize();
      }, 0);
    }).property(COMPUTED_OBSERVER),

    /**
     * @method getFiles
     * @param {Number} statusType
     * @return {Array}
     */
    getFiles: function getFiles(statusType) {
      return this.files.filter(function (file) {
        return file.statusType & statusType;
      });
    },

    /**
     * @method isValid
     * @param {Model} model
     * @return {Boolean}
     */
    isValid: function isValid(model) {
      var _this2 = this;

      /**
       * @method validMime
       * @param {String} mimeType
       * @return {Function}
       */
      var validMime = function validMime(mimeType) {
        return function () {

          var anyRegExp = _this2.get('options.mimeTypes').some(function (mimeType) {
            return mimeType instanceof RegExp;
          });
          var mimeTypes = get(_this2, 'options.mimeTypes');

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
          return fileSize <= Number(get(_this2, 'options.maximumSize'));
        };
      };

      /**
       * @method composeEvery
       * @param {Function} fns
       * @return {Function}
       */
      var composeEvery = function composeEvery() {
        for (var _len2 = arguments.length, fns = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          fns[_key2] = arguments[_key2];
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
     * @return {Object}
     */
    getFormData: function getFormData() {
      return {};
    },

    /**
     * @method getHeaders
     * @return {Object}
     */
    getHeaders: function getHeaders() {
      return {};
    },

    /**
     * @method addProgressListener
     * @param {Ember.$.ajaxSettings.xhr} xhr
     * @return {void}
     */
    addProgressListener: function addProgressListener(xhr) {},

    /**
     * @method addSuccessListener
     * @param {Ember.$.ajaxSettings.xhr} xhr
     * @return {void}
     */
    addSuccessListener: function addSuccessListener(xhr) {},

    /**
     * @method addErrorListener
     * @param {Ember.$.ajaxSettings.xhr} xhr
     * @return {void}
     */
    addErrorListener: function addErrorListener(xhr) {},

    /**
     * @method getRequest
     * @return {Ember.$.ajax}
     */
    getRequest: function getRequest() {
      var _this3 = this;

      var isFunction = function isFunction(value) {
        return typeof value === 'function';
      };
      var url = isFunction(get(this, 'url')) ? get(this, 'url').apply(this) : get(this, 'url');
      var method = get(this, 'options.requestMethod') || 'POST';
      var data = this.getFormData();
      var headers = this.getHeaders();
      var request = $Ember.$.ajax({ url: url, method: method, headers: headers, data: data, processData: false, contentType: false,

        /**
         * @method xhr
         * @return {Ember.$.ajaxSettings.xhr}
         */
        xhr: function xhr() {

          var xhr = $Ember.$.ajaxSettings.xhr();
          _this3.addProgressListener(xhr.upload);
          _this3.addSuccessListener(xhr.upload);
          _this3.addErrorListener(xhr.upload);
          set(_this3, 'lastRequest', xhr);
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
        var _this4 = this;

        var files = get(this, 'files').filter(function (file) {
          return file.statusType & STATUS_TYPES.VALID;
        });
        var request = this.getRequest();

        set(this, 'uploadStatus.uploading', true);
        set(this, 'uploadStatus.error', false);

        /**
         * @method resolver
         * @param {Function} resolve
         * @param {Function} reject
         * @return {void}
         */
        var resolver = function resolver(resolve, reject) {
          _this4.invokeHook('promiseResolver', resolve, reject, files);
          request.done(resolve).fail(reject);
        };

        /**
         * @method resolved
         * @param {Object} response
         * @return {void}
         */
        var resolved = function resolved(response) {
          _this4.invokeHook.apply(_this4, ['didUpload'].concat(_toConsumableArray(response.files)));
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

          set(_this4, 'uploadStatus.error', { request: request, textStatus: textStatus, errorThrown: errorThrown });
        };

        /**
         * @method always
         * @return {void}
         */
        var always = function always() {
          set(_this4, 'uploadStatus.uploading', false);
          _this4.invokeHook('didComplete');
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
        var _this5 = this;

        for (var _len3 = arguments.length, files = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          files[_key3] = arguments[_key3];
        }

        var addedFiles = files.map(function (file) {

          if (file instanceof Model) {

            file.setStatusType(_this5.isValid(file) ? STATUS_TYPES.VALID : STATUS_TYPES.INVALID);
            get(_this5, 'files').pushObject(file);
            return file;
          }
        }).filter(function (file) {
          return typeof file !== 'undefined';
        });

        addedFiles.length && this.invokeHook.apply(this, ['didAdd'].concat(_toConsumableArray(addedFiles)));
      },

      /**
       * @method deleteFiles
       * @param {Model[]} files
       * @return {void}
       */
      deleteFiles: function deleteFiles() {
        var _this6 = this;

        for (var _len4 = arguments.length, files = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          files[_key4] = arguments[_key4];
        }

        var deletedFiles = files.map(function (file) {

          var contains = !! ~get(_this6, 'files').indexOf(file);

          if (contains && file instanceof Model) {

            file.setStatusType(STATUS_TYPES.DELETED);
            get(_this6, 'files').removeObject(file);
            return file;
          }
        }).filter(function (file) {
          return typeof file !== 'undefined';
        });

        deletedFiles.length && this.invokeHook.apply(this, ['didDelete'].concat(_toConsumableArray(deletedFiles)));
      },

      /**
       * @method clearFiles
       * @return {void}
       */
      clearFiles: function clearFiles() {
        var _this7 = this;

        this.files.forEach(function (file) {
          return _this7.send('deleteFiles', file);
        });
        this.files.length = 0;
      }

    }

  });

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
     * @method parentView
     * @return {Object}
     */
    parentView: function parentView() {
      return this.context.get('parentView') || {};
    },

    /**
     * @method drop
     * @param {Object} event
     * @return {Array}
     */
    drop: function drop(event) {
      squashEvent(event);
      return this.traverseFiles(event.dataTransfer.files);
    },

    /**
     * @method files
     * @param {FileList|Array} files
     * @return {Array}
     */
    traverseFiles: function traverseFiles(files) {

      // Convert the FileList object into an actual array.
      files = Array.from ? Array.from(files) : Array.prototype.slice.call(files);

      var models = files.reduce(function (current, file) {

        var model = new Model(file);
        current.push(model);
        return current;
      }, []);

      // Add the files using the Droplet component.
      this.addFiles(files);
      return models;
    },

    /**
     * @method addFiles
     * @param {Array} models
     * @return {void}
     */
    addFiles: function addFiles(models) {

      if (models.length && this.parentView().send) {

        // Add the models to the parent if the parent exists, otherwise it's a no-op.
        this.parentView().send('addFiles', models);
      }
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
    reader: new $FileReader(),

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
      var _this8 = this;

      var reader = this.get('reader'),
          image = get(this, 'image.file');

      if (!this.isImage(image)) {
        this.destroy();
        return;
      }

      reader.addEventListener('load', run.bind(this, function (event) {
        set(_this8, 'src', event.target.result);
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
     * @method traverseFiles
     * @param {Array} files
     * @return {void}
     */
    traverseFiles: function traverseFiles(files) {
      this.get('parentView').traverseFiles(files);
    },

    /**
     * @method change
     * @return {void}
     */
    change: function change() {
      var files = this.get('element').files;
      this.traverseFiles(Array.isArray(files) ? files : [files]);
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