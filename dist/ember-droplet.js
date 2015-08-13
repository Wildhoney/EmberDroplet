'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

(function main($window, $ember) {

  "use strict";

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
        return this.file.type;
      }

      /**
       * @method getFileSize
       * @return {Number}
       */
    }, {
      key: 'getFileSize',
      value: function getFileSize() {
        return this.file.size || 0;
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
   * @constant COMPUTED_OBSERVER
   * @type {Array}
   */
  var COMPUTED_OBSERVER = $ember.String.w('files.length', 'files.@each.statusType');

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
  $window.Droplet = $ember.Mixin.create({

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
    options: { maximumSize: Infinity, includeHeader: true },

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
    init: function init() {
      $ember.set(this, 'files', []);
      this._super();
    },

    /**
     * @property uploadStatus
     * @type {Object}
     */
    uploadStatus: $ember.computed(function () {
      return { uploading: false, percentComplete: 0, error: false };
    }),

    /**
     * @property validFiles
     * @return {Array}
     */
    validFiles: $ember.computed(function () {
      return this.getFiles(STATUS_TYPES.VALID);
    }).property(COMPUTED_OBSERVER),

    /**
     * @property invalidFiles
     * @return {Array}
     */
    invalidFiles: $ember.computed(function () {
      return this.getFiles(STATUS_TYPES.INVALID);
    }).property(COMPUTED_OBSERVER),

    /**
     * @property uploadedFiles
     * @return {Array}
     */
    uploadedFiles: $ember.computed(function () {
      return this.getFiles(STATUS_TYPES.UPLOADED);
    }).property(COMPUTED_OBSERVER),

    /**
     * @property deletedFiles
     * @return {Array}
     */
    deletedFiles: $ember.computed(function () {
      return this.getFiles(STATUS_TYPES.DELETED);
    }).property(COMPUTED_OBSERVER),

    /**
     * @property requestSize
     * @return {Array}
     */
    requestSize: $ember.computed(function () {
      return $ember.get(this, 'validFiles').reduce(function (size, model) {
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
        var _this = this;

        var isFunction = function isFunction(value) {
          return typeof $ember.get(_this, 'url') === 'function';
        };
        var isUndefined = function isUndefined(value) {
          return typeof value !== 'undefined';
        };

        var defaults = { fileSizeHeader: true, useArray: true, method: 'POST' };
        var url = isFunction($ember.get(this, 'url')) ? $ember.get(this, 'url').apply(this) : $ember.get(this, 'url');
        var files = $ember.get(this, 'files').filter(function (file) {
          return file.statusType & STATUS_TYPES.VALID;
        });

        return new $ember.RSVP.Promise(function (resolve, reject) {

          resolve({ files: files });
        }).then(function (response) {
          var _$ember$get;

          (_$ember$get = $ember.get(_this, 'hooks')).didUpload.apply(_$ember$get, _toConsumableArray(response.files));
        }, function (jqXHR, textStatus, error) {});
      },

      /**
       * @method abortUpload
       * @return {void}
       */
      abortUpload: function abortUpload() {},

      /**
       * @method mimeTypes
       * @param {Array} mimeTypes
       * @param {Object} [mode=MIME_MODE.PUSH]
       * @return {void}
       */
      mimeTypes: function mimeTypes(_mimeTypes) {
        var mode = arguments.length <= 1 || arguments[1] === undefined ? MIME_MODE.PUSH : arguments[1];

        mode === MIME_MODE.SET && $ember.set(this, 'mimeTypes', []);
        _mimeTypes = Array.isArray(_mimeTypes) ? _mimeTypes : [_mimeTypes];
        var types = [].concat(_toConsumableArray($ember.get(this, 'mimeTypes')), _toConsumableArray(_mimeTypes));
        $ember.set(this, 'mimeTypes', types);
      },

      /**
       * @method addFiles
       * @param {Model[]} files
       * @return {void}
       */
      addFiles: function addFiles() {
        var _$ember$get2,
            _this2 = this;

        /**
         * @method isAcceptableMIMEType
         * @return {Boolean}
         */
        var isAcceptableMIMEType = function isAcceptableMIMEType(mimeType) {
          return !! ~$ember.get(_this2, 'mimeTypes').indexOf(mimeType);
        };

        for (var _len = arguments.length, files = Array(_len), _key = 0; _key < _len; _key++) {
          files[_key] = arguments[_key];
        }

        var addedFiles = files.map(function (file) {

          if (file instanceof Model) {

            file.setStatusType(isAcceptableMIMEType(file.getMIMEType()) ? STATUS_TYPES.VALID : STATUS_TYPES.INVALID);
            $ember.get(_this2, 'files').pushObject(file);
            return file;
          }
        }).filter(function (file) {
          return typeof file !== 'undefined';
        });

        addedFiles.length && (_$ember$get2 = $ember.get(this, 'hooks')).didAdd.apply(_$ember$get2, _toConsumableArray(addedFiles));
      },

      /**
       * @method deleteFiles
       * @param {Model[]} files
       * @return {void}
       */
      deleteFiles: function deleteFiles() {
        var _$ember$get3,
            _this3 = this;

        for (var _len2 = arguments.length, files = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          files[_key2] = arguments[_key2];
        }

        var deletedFiles = files.map(function (file) {

          var contains = !! ~$ember.get(_this3, 'files').indexOf(file);

          if (contains && file instanceof Model) {

            file.setStatusType(STATUS_TYPES.DELETED);
            $ember.get(_this3, 'files').removeObject(file);
            return file;
          }
        }).filter(function (file) {
          return typeof file !== 'undefined';
        });

        deletedFiles.length && (_$ember$get3 = $ember.get(this, 'hooks')).didDelete.apply(_$ember$get3, _toConsumableArray(deletedFiles));
      },

      /**
       * @method clearFiles
       * @return {void}
       */
      clearFiles: function clearFiles() {
        var _this4 = this;

        this.files.forEach(function (file) {
          return _this4.send('deleteFiles', file);
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
  var squashEvent = $window.Droplet.squashEvent = function (event) {
    event.preventDefault();
    event.stopPropagation();
  };

  /**
   * @module Droplet
   * @submodule Area
   * @author Adam Timberlake
   * @see https://github.com/Wildhoney/EmberDroplet
   */
  $window.DropletArea = $ember.Mixin.create({

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
      return this.context.get('parentView');
    },

    /**
     * @method drop
     * @param {Object} event
     * @return {void}
     */
    drop: function drop(event) {
      squashEvent(event);
      this.traverseFiles(event.dataTransfer.files);
    },

    /**
     * @method files
     * @param {FileList|Array} files
     * @return {void}
     */
    traverseFiles: function traverseFiles(files) {

      // Convert the FileList object into an actual array.
      files = Array.from ? Array.from(files) : Array.prototype.slice.call(files);

      var models = files.reduce(function (current, file) {

        var model = new Model(file);
        //this.isValid(model) && current.push(model);
        return current;
      }, []);

      // Add the files using the Droplet component.
      this.parentView().send('addFiles', models);
    },

    /**
     * @method isValid
     * @param {Model} model
     * @return {void}
     */
    isValid: function isValid(model) {

      var options = this.parentView().get('options');
      var maxSize = Number(options.maximumSize);

      return true;
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
})(window, window.Ember);