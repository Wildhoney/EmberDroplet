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
        uploadStatus: Ember.computed(function() {
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
             * Adds a valid file to the collection.
             *
             * @method addValidFile
             * @param file {File}
             * @return {Object}
             */
            addValidFile: function(file) {
                return this._addFile(file, true);
            },

            /**
             * Adds an invalid file to the collection.
             *
             * @method addInvalidFile
             * @param file {File}
             * @return {Object}
             */
            addInvalidFile: function(file) {
                return this._addFile(file, false);
            },

            /**
             * Deletes a file from the collection.
             *
             * @method deleteFile
             * @param file
             * @return {Object}
             */
            deleteFile: function(file) {
                $ember.set(file, 'deleted', true);
                return file;
            },

            /**
             * Clears all of the files from the collection.
             *
             * @method clearAllFiles
             * @return {void}
             */
            clearAllFiles: function() {
                $ember.set(this, 'files', []);
            },

            /**
             * Aborts the current upload
             *
             * @method abortUpload
             * @return {Boolean} returns true if it aborted successfully, return false if there are no files to upload.
             */
            abortUpload: function() {
              var request = $ember.get(this, 'lastRequest');

              if (request && $ember.get(this, 'uploadStatus.uploading')) {
                request.abort();
                $ember.set(this, 'uploadStatus.uploading', false);
              }
            },

            /**
             * Uploads all of the files that haven't been uploaded yet, but are valid files.
             *
             * @method uploadAllFiles
             * @return {Object|Boolean} jQuery promise, or false if there are no files to upload.
             */
            uploadAllFiles: function() {

                /**
                 * @property defaultOptions
                 * @type {Object}
                 */
                var defaultOptions = {
                    fileSizeHeader: true,
                    useArray: true
                };

                if ($ember.get(this, 'validFiles').length === 0) {
                    // Determine if there are even files to upload.
                    return false;
                }

                // Find the URL, set the uploading status, and create our promise.
                var url             = $ember.get(this, 'dropletUrl'),
                    options         = $ember.get(this, 'dropletOptions') || defaultOptions,
                    deferred        = new $jQuery.Deferred(),
                    postData        = this.get('postData'),
                    requestHeaders  = this.get('requestHeaders');

                $ember.set(this, 'uploadStatus.uploading', true);
                $ember.set(this, 'uploadStatus.error', false);

                // Assert that we have the URL specified in the controller that implements the mixin.
                $ember.assert('You must specify the `dropletUrl` parameter in order to upload files.', !!url);

                // Create a new XHR request object.
                var request = new $window.XMLHttpRequest();
                $ember.set(this, 'lastRequest', request);
                request.open('post', url, true);

                // Create a new form data instance.
                var formData = new $window.FormData();

                // Node.js is clever enough to deduce an array of images, whereas Ruby/PHP require the
                // specifying of an array-like name.
                var fieldName = options.useArray ? 'file[]' : 'file';

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

                // Add all of the event listeners.
                this._addProgressListener(request.upload);
                this._addSuccessListener(request.upload, deferred);
                this._addErrorListener(request.upload, deferred);

                // Resolve the promise when we've finished uploading all the files.
                request.onreadystatechange = function() {

                    if (request.readyState === 4 && request.status !== 0) {
                        Ember.run(function() {
                            // Parse the response!
                            var response = $window.JSON.parse(request.responseText);
                            deferred.resolve(response);

                            // Invoke the `didUploadFiles` callback if it exists.
                            $ember.tryInvoke(this, 'didUploadFiles', [response]);
                        }.bind(this));
                    }

                }.bind(this);

                if (options.fileSizeHeader) {

                    // Set the request size, and then we can upload the files!
                    request.setRequestHeader('X-File-Size', this._getSize());

                }

                // Assign any request headers specified in the controller.
                for (index in requestHeaders) {
                    if ((requestHeaders.hasOwnProperty(index)) || (index in requestHeaders)) {
                        request.setRequestHeader(index, requestHeaders[index]);
                    }
                }

                request.send(formData);

                // Return the promise.
                return deferred.promise();

            }

        },

        /**
         * Finds a list of files that aren't deleted, and are of a valid MIME type.
         *
         * @property validFiles
         * @return {Array}
         */
        validFiles: $ember.computed(function() {
            return this._filesByProperties({ valid: true, deleted: false, uploaded: false });
        }).property('files.length', 'files.@each.deleted', 'files.@each.uploaded'),

        /**
         * Finds a list of files that have an unsupported MIME type.
         *
         * @property invalidFiles
         * @return {Array}
         */
        invalidFiles: $ember.computed(function() {
            return this._filesByProperties({ valid: false });
        }).property('files.length', 'files.@each.deleted'),

        /**
         * Finds a list of files that have been successfully uploaded.
         *
         * @property uploadedFiles
         * @return {Array}
         */
        uploadedFiles: $ember.computed(function() {
            return this._filesByProperties({ uploaded: true });
        }).property('files.length', 'files.@each.uploaded'),

        /**
         * Finds a list of files that have been deleted by the user.
         *
         * @property deletedFiles
         * @return {Array}
         */
        deletedFiles: $ember.computed(function() {
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
        _filesByProperties: function(maps) {

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
        _getSize: function() {

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
        _addSuccessListener: function(request) {

            // Once the files have been successfully uploaded.
            request.addEventListener('load', function() {

                Ember.run(function() {
                    // Set the `uploaded` parameter to true once we've successfully // uploaded the files.
                    $ember.EnumerableUtils.forEach($ember.get(this, 'validFiles'), function(file) {
                        $ember.set(file, 'uploaded', true);
                    });

                    // We want to revert the upload status.
                    $ember.set(this, 'uploadStatus.uploading', false);
                }.bind(this));

            }.bind(this), false);

        },

        /**
         * @method _addErrorListener
         * @param request
         * @param [deferred = null]
         * @return {void}
         * @private
         */
        _addErrorListener: function(request, deferred) {

            request.addEventListener('error', function() {

                Ember.run(function() {
                    // As an error occurred, we need to revert everything.
                    $ember.set(this, 'uploadStatus.uploading', false);
                    $ember.set(this, 'uploadStatus.error', true);

                    if (deferred) {
                        // Reject the promise if we have one.
                        deferred.reject();
                    }
                }.bind(this));

            }.bind(this));

        },

        /**
         * @method _addProgressListener
         * @param request
         * @return {void}
         * @private
         */
        _addProgressListener: function(request) {

            request.addEventListener('progress', function (event) {

                Ember.run(function() {
                    if (!event.lengthComputable) {
                        // There's not much we can do if the request is not computable.
                        return;
                    }

                    // Calculate the percentage remaining.
                    var percentageLoaded = (event.loaded / this._getSize()) * 100;
                    $ember.set(this, 'uploadStatus.percentComplete', Math.round(percentageLoaded));
                }.bind(this));

            }.bind(this), false);

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
        _addFile: function(file, valid) {

            // Extract the file's extension which allows us to style accordingly.
            var className = 'extension-%@'.fmt(file.name.match(/\.(.+)$/i)[1]).toLowerCase();

            // Create the record with its default parameters, and then add it to the collection.
            var record = { file: file, valid: valid, uploaded: false, deleted: false, className: className };
            $ember.get(this, 'files').pushObject(record);

            // Voila!
            return record;

        }

    });

})(window, window.Ember, window.jQuery);
