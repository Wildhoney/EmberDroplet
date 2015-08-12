'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

(function main($window, $ember) {

  "use strict";

  /**
   * @module EmberDroplet
   * @author Adam Timberlake
   * @see https://github.com/Wildhoney/EmberDroplet
   */

  var _this = this;

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
      uploadFiles: function uploadFiles() {

        var isFunction = function isFunction(value) {
          return typeof $ember.get(_this, 'url') === 'function';
        };
        var isUndefined = function isUndefined(value) {
          return typeof value !== 'undefined';
        };

        var defaults = { fileSizeHeader: true, useArray: true, method: 'POST' };
        var url = isFunction($ember.get(_this, 'url')) ? $ember.get(_this, 'url').apply(_this) : $ember.get(_this, 'url');

        return new Promise(function (resolve, reject) {});
      },

      /**
       * @method addFiles
       * @param {Model[]} files
       * @return {Boolean}
       */
      addFiles: function addFiles(files) {
        var _this2 = this;

        files = Array.isArray(files) ? files : [files];
        return files.every(function (file) {
          return !!_this2.files.push(file);
        });
      },

      /**
       * @method deleteFiles
       * @param {Model[]} files
       * @return {Boolean}
       */
      deleteFiles: function deleteFiles(files) {
        var _this3 = this;

        files = Array.isArray(files) ? files : [files];

        return files.every(function (file) {
          var index = file instanceof Model && _this3.files.indexOf(file);
          return ~index && _this3.files.splice(index) || false;
        });
      },

      /**
       * @method clearFiles
       * @return {Boolean}
       */
      clearFiles: function clearFiles() {
        var _this4 = this;

        this.files.forEach(function (file) {
          return file.setStatusType(_this4.statusTypes.DELETED);
        });
        return !(this.files.length = 0);
      },

      /**
       * @method getFiles
       * @param {Number} statusType
       * @return {Array}
       */
      getFiles: function getFiles(statusType) {
        return _this.files.filter(function (file) {
          return file.statusType & statusType;
        });
      }

    }

  });

  /**
   * @property Model
   * @type {Model}
   */

  var Model = (function () {
    function Model() {
      _classCallCheck(this, Model);
    }

    _createClass(Model, [{
      key: 'setStatusType',

      /**
       * @method setStatusType
       * @param {Number} statusType
       * @return {void}
       */
      value: function setStatusType(statusType) {
        this.statusType = Number(statusType);
      }
    }]);

    return Model;
  })();
})(window, window.Ember);