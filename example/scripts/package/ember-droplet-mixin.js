(function($window, $ember, $jQuery) {

    "use strict";

    /**
     * @module App
     * @class EmberDropletController
     * @type Ember.Mixin
     * @extends Ember.Mixin
     */
    $window.DropletController = $ember.Mixin.create({

        /**
         * @property mimeTypes
         * @type {Array}
         */
        mimeTypes: ['image/jpeg', 'image/jpg', 'image/gif', 'image/png', 'text/plain'],

        /**
         * @property extensions
         * @type {Array}
         */
        extensions: ['jpeg', 'jpg', 'gif', 'png'],

        /**
         * Contains a list of headers to be included in the request made by
         * uploadAllFiles()
         *
         * @property requestHeaders
         * @type {Object}
         */
        requestHeaders: {},

        /**
         * Contains a dictionary of extra POST data to be included in the
         * request made by uploadAllFiles()
         *
         * @property postData
         * @type {Object}
         */
        postData: {},

        /**
         * Contains a list of files, both valid, deleted, and invalid.
         *
         * @property files
         * @type {Array}
         * @default []
         */
        files: [],

        /**
         * @property uploadStatus
         * @type {Object}
         */
        uploadStatus: $ember.computed(function computedFn() {
            return { uploading: false, percentComplete: 0, error: false };
        }),

        /**
         * Clears the file array for each instantiation.
         *
         * @constructor
         * @method init
         * @return {void}
         */
        init: function() {
            $ember.set(this, 'files', []);
            this._super();
        },

        /**
         * @property actions
         * @type {Object}
         */
        actions: {

            /**
             * @method addedFiles
             * @param fileList {Array}
             * @return {void}
             */
            addedFiles: function addedFiles(fileList) {
                $ember.tryInvoke(this, 'didAddFiles', [fileList]);
            },

            /**
             * Adds a valid file to the collection.
             *
             * @method addValidFile
             * @param file {File}
             * @return {Object}
             */
            addValidFile: function addValidFile(file) {
                return this._addFile(file, true);
            },

            /**
             * Adds an invalid file to the collection.
             *
             * @method addInvalidFile
             * @param file {File}
             * @return {Object}
             */
            addInvalidFile: function addInvalidFile(file) {
                return this._addFile(file, false);
            },

            /**
             * Deletes a file from the collection.
             *
             * @method deleteFile
             * @param file
             * @return {Object}
             */
            deleteFile: function deleteFile(file) {
                $ember.set(file, 'deleted', true);
                return file;
            },

            /**
             * Clears all of the files from the collection.
             *
             * @method clearAllFiles
             * @return {void}
             */
            clearAllFiles: function clearAllFiles() {
                $ember.set(this, 'files', []);
            },

            /**
             * Aborts the current upload
             *
             * @method abortUpload
             * @return {Boolean} returns true if it aborted successfully, return false if there are no files to upload.
             */
            abortUpload: function abortUpload() {
                
                var jqXhr = $ember.get(this, 'lastJqXhr');
                
                if (jqXhr && $ember.get(this, 'uploadStatus.uploading')) {
                    jqXhr.abort();
                    $ember.set(this, 'uploadStatus.uploading', false);
                }
                
            },

            /**
             * Uploads all of the files that haven't been uploaded yet, but are valid files.
             *
             * @method uploadAllFiles
             * @return {Object|Boolean} jQuery promise, or false if there are no files to upload.
             */
            uploadAllFiles: function uploadAllFiles() {

                /**
                 * @property defaultOptions
                 * @type {Object}
                 */
                var defaultOptions = {
                    fileSizeHeader: true,
                    useArray: true,
                    method: 'post'
                };

                if ($ember.get(this, 'validFiles').length === 0) {
                    // Determine if there are even files to upload.
                    return false;
                }

                // Find the URL, set the uploading status, and create our promise.
                var url             = $ember.get(this, 'dropletUrl'),
                    options         = $ember.get(this, 'dropletOptions') || defaultOptions,
                    postData        = this.get('postData'),
                    requestHeaders  = this.get('requestHeaders');

                $ember.set(this, 'uploadStatus.uploading', true);
                $ember.set(this, 'uploadStatus.error', false);

                // Assert that we have the URL specified in the controller that implements the mixin.
                $ember.assert('You must specify the `dropletUrl` parameter in order to upload files.', !!url);

                // Create a new form data instance based on file and postData.
                var formData = this._getFormData(postData, options.useArray);

                var method = options.method || defaultOptions.method;

                var headers = {};

                if (options.fileSizeHeader) {

                    // Set the request size, and then we can upload the files!
                    headers['X-File-Size'] = this._getSize();

                }

                // Assign any request headers specified in the controller.
                for (var index in requestHeaders) {

                    if ((requestHeaders.hasOwnProperty(index)) || (index in requestHeaders)) {
                        headers[index] = requestHeaders[index];
                    }

                }

                var jqXhr = $jQuery.ajax({
                    url: url,
                    method: method,
                    data: formData,
                    headers: headers,
                    processData: false,
                    contentType: false,

                    xhr: function xhrHook() {

                        var xhr = $jQuery.ajaxSettings.xhr();

                        // Add all of the event listeners.
                        this._addProgressListener(xhr.upload);
                        this._addSuccessListener(xhr.upload);
                        this._addErrorListener(xhr.upload);
                        $ember.set(this, 'lastRequest', xhr);

                        return xhr;

                    }.bind(this)
                });

                $ember.set(this, 'lastJqXhr', jqXhr);

                // Return the promise.
                return new $ember.RSVP.Promise(function(resolve, reject) {
                  
                    jqXhr.done(resolve).fail(reject);

                }).then($ember.run.bind(this, function(response) {

                    // Invoke the `didUploadFiles` callback if it exists.
                    $ember.tryInvoke(this, 'didUploadFiles', [response]);
                    return response;

                }), $ember.run.bind(this, function ajaxError(jqXHR, textStatus, errorThrown) {
                  
                    // As an error occurred, we need to revert everything.
                    var args = { jqXHR: jqXHR, textStatus: textStatus, errorThrown: errorThrown};
                    $ember.set(this, 'uploadStatus.uploading', false);
                    $ember.set(this, 'uploadStatus.error', args);
                  
                }));
            }

        },

        /**
        * Creates a FormData object based on the valid files and postData provided.
        *
        * @method _getFormData
        * @param postData {Object}
        * @param useArray {Boolean} If false, use `file` as the field name for files. Otherwise, use `file[]`.
        * @return {FormData}
        * @private
        */
        _getFormData: function _getFormData(postData, useArray) {

            // Create a new form data instance.
            var formData = new $window.FormData();

            // Node.js is clever enough to deduce an array of images, whereas Ruby/PHP require the
            // specifying of an array-like name.
            var fieldName = useArray ? 'file[]' : 'file';

            // Iterate over each file, and append it to the form data.
            $ember.EnumerableUtils.forEach($ember.get(this, 'validFiles'), function(file) {
                formData.append(fieldName, file.file);
            }, this);

            // Add any extra POST data specified in the controller
            for (var index in postData) {
                if (postData.hasOwnProperty(index)) {
                    formData.append(index, postData[index]);
                }
            }

            return formData;

        },

        /**
         * Clears the request event handlers and cancels the upload
         *
         * @property willDestroy
         * @return {void}
         */
        willDestroy: function willDestroy() {

            this._super.apply(this, arguments);
            var lastRequest = this.get('lastRequest');

            if (lastRequest) {
                lastRequest.upload.onprogress = undefined;
                lastRequest.upload.onload = undefined;
                lastRequest.upload.onerror = undefined;
                this.send('abortUpload');
            }

        },

        /**
         * Finds a list of files that aren't deleted, and are of a valid MIME type.
         *
         * @property validFiles
         * @return {Array}
         */
        validFiles: $ember.computed(function computedFn() {
            return this._filesByProperties({ valid: true, deleted: false, uploaded: false });
        }).property('files.length', 'files.@each.deleted', 'files.@each.uploaded'),

        /**
         * Finds a list of files that have an unsupported MIME type.
         *
         * @property invalidFiles
         * @return {Array}
         */
        invalidFiles: $ember.computed(function computedFn() {
            return this._filesByProperties({ valid: false });
        }).property('files.length', 'files.@each.deleted'),

        /**
         * Finds a list of files that have been successfully uploaded.
         *
         * @property uploadedFiles
         * @return {Array}
         */
        uploadedFiles: $ember.computed(function computedFn() {
            return this._filesByProperties({ uploaded: true });
        }).property('files.length', 'files.@each.uploaded'),

        /**
         * Finds a list of files that have been deleted by the user.
         *
         * @property deletedFiles
         * @return {Array}
         */
        deletedFiles: $ember.computed(function computedFn() {
            return this._filesByProperties({ deleted: true });
        }).property('files.length', 'files.@each.deleted'),

        /**
         * Accepts a map of properties that each file must have.
         *
         * @method _filesByProperties
         * @param maps {Object}
         * @return {Array}
         * @private
         */
        _filesByProperties: function _filesByProperties(maps) {

            // Iterate over each of the files.
            return $ember.get(this, 'files').filter(function(file) {

                for (var property in maps) {

                    if ((maps.hasOwnProperty(property)) || (property in maps)) {

                        // If the current property doesn't match what we're after from the map,
                        // then the file is invalid.
                        if (file[property] !== maps[property]) {
                            return false;
                        }

                    }

                }

                // Voila! We have a good file that matches our criteria.
                return true;

            });

        },

        /**
         * Determine the size of the request.
         *
         * @method _getSize
         * @return {Number}
         * @private
         */
        _getSize: function _getSize() {

            var size = 0;

            // Iterate over all of the files to determine the size of all valid files.
            $ember.EnumerableUtils.forEach($ember.get(this, 'validFiles'), function(file) {
                size += file.file.size;
            });

            return size;

        },

        /**
         * @method _addSuccessListener
         * @param request
         * @private
         */
        _addSuccessListener: function _addSuccessListener(request) {

            // Once the files have been successfully uploaded.
            request.onload = $ember.run.bind(this, function() {
                // Set the `uploaded` parameter to true once we've successfully // uploaded the files.
                $ember.EnumerableUtils.forEach($ember.get(this, 'validFiles'), function(file) {
                    $ember.set(file, 'uploaded', true);
                });

                // We want to revert the upload status.
                $ember.set(this, 'uploadStatus.uploading', false);
            });

        },

        /**
         * @method _addErrorListener
         * @param request
         * @return {void}
         * @private
         */
        _addErrorListener: function _addErrorListener(request) {

            request.onerror = $ember.run.bind(this, function() {
                // As an error occurred, we need to revert everything.
                $ember.set(this, 'uploadStatus.uploading', false);
                $ember.set(this, 'uploadStatus.error', true);
            });

        },

        /**
         * @method _addProgressListener
         * @param request
         * @return {void}
         * @private
         */
        _addProgressListener: function _addProgressListener(request) {

            request.onprogress = $ember.run.bind(this, function(event) {

                if (!event.lengthComputable) {

                    // There's not much we can do if the request is not computable.
                    return;

                }

                // Calculate the percentage remaining.
                var percentageLoaded = (event.loaded / this._getSize()) * 100;
                $ember.set(this, 'uploadStatus.percentComplete', Math.round(percentageLoaded));

            });

        },

        /**
         * Adds a file based on whether it's valid or invalid.
         *
         * @method _addFile
         * @param file {File}
         * @param valid {Boolean}
         * @return {Object}
         * @private
         */
        _addFile: function _addFile(file, valid) {

            // Extract the file's extension which allows us to style accordingly.
            var fileExt   = file.name.substr((~-file.name.lastIndexOf(".") >>> 0) + 2),
                className = 'extension-%@'.fmt(fileExt).toLowerCase();

            // Create the record with its default parameters, and then add it to the collection.
            var record = { file: file, valid: valid, uploaded: false, deleted: false, className: className };
            $ember.get(this, 'files').pushObject(record);

            // Voila!
            return record;

        }

    });

})(window, window.Ember, window.jQuery);
