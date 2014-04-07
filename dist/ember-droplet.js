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
         * @property requestHeaders
         * @type {Object}
         * Contains a list of headers to be included in the request made by
         * uploadAllFiles()
         */
        requestHeaders: {},

        /**
         * @property postData
         * @type {Object}
         * Contains a dictionary of extra POST data to be included in the
         * request made by uploadAllFiles()
         */
        postData: {},

        /**
         * @property files
         * @type {Array}
         * @default []
         * Contains a list of files, both valid, deleted, and invalid.
         */
        files: [],

        /**
         * @property uploadStatus
         * @type {Object}
         */
        uploadStatus: { uploading: false, percentComplete: 0, error: false },

        /**
         * @constructor
         * @method init
         * Clears the file array for each instantiation.
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
             * @method addValidFile
             * @param file {File}
             * Adds a valid file to the collection.
             * @return {Object}
             */
            addValidFile: function(file) {
                return this._addFile(file, true);
            },

            /**
             * @method addInvalidFile
             * @param file {File}
             * Adds an invalid file to the collection.
             * @return {Object}
             */
            addInvalidFile: function(file) {
                return this._addFile(file, false);
            },

            /**
             * @method deleteFile
             * @param file
             * Deletes a file from the collection.
             * @return {Object}
             */
            deleteFile: function(file) {
                $ember.set(file, 'deleted', true);
                return file;
            },

            /**
             * @method clearAllFiles
             * Clears all of the files from the collection.
             * @return {void}
             */
            clearAllFiles: function() {
                $ember.set(this, 'files', []);
            },

            /**
             * @method uploadAllFiles
             * Uploads all of the files that haven't been uploaded yet, but are valid files.
             * @return {Object|Boolean} jQuery promise, or false if there are no files to upload.
             */
            uploadAllFiles: function() {

                if ($ember.get(this, 'validFiles').length === 0) {
                    // Determine if there are even files to upload.
                    return false;
                }

                // Find the URL, set the uploading status, and create our promise.
                var url             = $ember.get(this, 'dropletUrl'),
                    deferred        = new $jQuery.Deferred(),
                    postData        = this.get('postData'),
                    requestHeaders  = this.get('requestHeaders');

                $ember.set(this, 'uploadStatus.uploading', true);
                $ember.set(this, 'uploadStatus.error', false);

                // Assert that we have the URL specified in the controller that implements the mixin.
                $ember.assert('You must specify the `dropletUrl` parameter in order to upload files.', !!url);

                // Create a new XHR request object.
                var request = new $window.XMLHttpRequest();
                request.open('post', url, true);

                // Create a new form data instance.
                var formData = new $window.FormData();

                // Node.js is clever enough to deduce an array of images, whereas Ruby/PHP require the
                // specifying of an array-like name.
                var fieldName = ($ember.get(this, 'useArray', true)) ? 'file[]' : 'file';

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

                    if (request.readyState === 4) {

                        // Parse the response!
                        var response = $window.JSON.parse(request.responseText);
                        deferred.resolve(response);

                        // Invoke the `didUploadFiles` callback if it exists.
                        $ember.tryInvoke(this, 'didUploadFiles', [response]);

                    }

                }.bind(this);

                // Set the request size, and then we can upload the files!
                request.setRequestHeader('X-File-Size', this._getSize());

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
         * @property validFiles
         * Finds a list of files that aren't deleted, and are of a valid MIME type.
         * @return {Array}
         */
        validFiles: $ember.computed(function() {
            return this._filesByProperties({ valid: true, deleted: false, uploaded: false });
        }).property('files.length', 'files.@each.deleted', 'files.@each.uploaded'),

        /**
         * @property invalidFiles
         * Finds a list of files that have an unsupported MIME type.
         * @return {Array}
         */
        invalidFiles: $ember.computed(function() {
            return this._filesByProperties({ valid: false });
        }).property('files.length', 'files.@each.deleted'),

        /**
         * @property uploadedFiles
         * Finds a list of files that have been successfully uploaded.
         * @return {Array}
         */
        uploadedFiles: $ember.computed(function() {
            return this._filesByProperties({ uploaded: true });
        }).property('files.length', 'files.@each.uploaded'),

        /**
         * @property deletedFiles
         * Finds a list of files that have been deleted by the user.
         * @return {Array}
         */
        deletedFiles: $ember.computed(function() {
            return this._filesByProperties({ deleted: true });
        }).property('files.length', 'files.@each.deleted'),

        /**
         * @method _filesByProperties
         * @param maps {Object}
         * Accepts a map of properties that each file must have.
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
         * @method _getSize
         * Determine the size of the request.
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

                // Set the `uploaded` parameter to true once we've successfully // uploaded the files.
                $ember.EnumerableUtils.forEach($ember.get(this, 'validFiles'), function(file) {
                    $ember.set(file, 'uploaded', true);
                });

                // We want to revert the upload status.
                $ember.set(this, 'uploadStatus.uploading', false);

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

                // As an error occurred, we need to revert everything.
                $ember.set(this, 'uploadStatus.uploading', false);
                $ember.set(this, 'uploadStatus.error', true);

                if (deferred) {
                    // Reject the promise if we have one.
                    deferred.reject();
                }

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

                if (!event.lengthComputable) {
                    // There's not much we can do if the request is not computable.
                    return;
                }

                // Calculate the percentage remaining.
                var percentageLoaded = (event.loaded / this._getSize()) * 100;
                $ember.set(this, 'uploadStatus.percentComplete', Math.round(percentageLoaded));

            }.bind(this), false);

        },

        /**
         * @method _addFile
         * @param file {File}
         * @param valid {Boolean}
         * Adds a file based on whether it's valid or invalid.
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

})(window, window.Ember, window.jQuery);;(function($window, $ember) {

    "use strict";

    /**
     * @module App
     * @class DropletView
     * @type Ember.View
     * @extends Ember.View
     */
    $window.DropletView = $ember.View.extend({

        /**
         * @property classNames
         * @type {Array}
         * @default ['droppable']
         */
        classNames: ['droppable'],

        /**
         * @property ImagePreview
         * @type {Ember.View}
         */
        ImagePreview: $ember.View.extend({

            /**
             * @property tagName
             * @type {String}
             * @default "img"
             */
            tagName: 'img',

            /**
             * @property attributeBindings
             * @type {Array}
             * @default ['src']
             */
            attributeBindings: ['src'],

            /**
             * @property src
             * @type {String}
             * @default null
             */
            src: null,

            /**
             * @property image
             * @type {String}
             * @default null
             */
            image: null,

            /**
             * @method didInsertElement
             * Invoked when the view is inserted into the DOM.
             * @return {void}
             */
            didInsertElement: function() {

                // Initialise the FileReader, and find the image that was passed into
                // the view when instantiating it.
                var reader  = new $window.FileReader(),
                    image   = $ember.get(this, 'image.file');

                // Ensure that the file we're dealing with is an image.
                if (!image.type.match(/^image\//i)) {

                    // If it isn't then we'll need to destroy the view immediately.
                    this.destroy();
                    return;

                }

                // Invoked when the image preview has been loaded.
                reader.onload = function (event) {

                    if (this.get('isDestroyed') === true) {
                        // If the view has already been destroyed, then we can't
                        // load in the image preview.
                        return;
                    }

                    // Otherwise we're free to set the SRC attribute to the image's data.
                    $ember.set(this, 'src', event.target.result);

                }.bind(this);

                // Begin the reading of the image.
                reader.readAsDataURL(image);

            }

        }),

        /**
         * @property MultipleInput
         * @type {Ember.View}
         */
        MultipleInput: $ember.View.extend({

            /**
             * @property tagName
             * @type {String}
             * @default "input"
             */
            tagName: 'input',

            /**
             * @property classNames
             * @type {String}
             * @default "files"
             */
            classNames: 'files',

            /**
             * @property attributeBindings
             * @type {Array}
             */
            attributeBindings: ['type', 'multiple'],

            /**
             * @property file
             * @type {String}
             * @default "file"
             */
            type: 'file',

            /**
             * @property multiple
             * @type {String}
             * @default "multiple"
             */
            multiple: 'multiple',

            /**
             * @method change
             * Invoked when the content of the INPUT changes.
             * @return {Boolean}
             */
            change: function() {
                var files = this.get('element').files;
                return this.get('parentView').traverseFiles(files);
            }

        }),

        /**
         * @method drop
         * @param event {jQuery.Event}
         * @param [files = []] {Array}
         * Invoked when the user drops a file onto the droppable area.
         * @return {Boolean}
         */
        drop: function(event, files) {
            this._preventDefaultBehaviour(event);
            return this.traverseFiles(event.dataTransfer.files || files);
        },

        /**
         * @method traverseFiles
         * @param files {FileList}
         * Accepts a FileList object, and traverses them to determine if they're valid, adding them
         * as either valid or invalid.
         * @return {boolean}
         */
        traverseFiles: function(files) {

            // Find the controller, and the `mimeTypes` and `extensions` property.
            var controller  = $ember.get(this, 'controller'),
                mimeTypes   = $ember.get(controller, 'mimeTypes'),
                extensions = $ember.get(controller, 'extensions');

            // Assert that we have the `mineTypes` property, and that it's an array.
            $ember.assert('`mimeTypes` is undefined. Does your controller implement the `$emberDropletController` mixin?', !!mimeTypes);
            $ember.assert('`mimeTypes` is not an array. It should be an array of valid MIME types.', !!$ember.isArray(mimeTypes));

            for (var index = 0, numFiles = files.length; index < numFiles; index++) {

                if (!files.hasOwnProperty(index)&&(!(index in files))) {
                    continue;
                }

                var file = files[index],
                    fileExt = file.name.split('.').pop();

                // Determine if the file is valid based on its MIME type or extension.
                if (($.inArray(file.type, mimeTypes) === -1)&&($.inArray(fileExt, extensions) === -1)) {
                    // If it isn't valid, then we'll add it as an invalid file.
                    controller.send('addInvalidFile', file);
                    continue;
                }

                // Otherwise the file has a valid MIME type or extension, and therefore be added as a good file.
                controller.send('addValidFile', file);

            }

            return true;

        },

        /**
         * @method _preventDefaultBehaviour
         * @param event {jQuery.Event}
         * Prevents default behaviour and propagation on nodes where it's undesirable.
         * @return {void}
         * @private
         */
        _preventDefaultBehaviour: function(event) {
            event.preventDefault();
            event.stopPropagation();
        },

        /**
         * @method dragOver
         * @param event {jQuery.Event}
         * @return {void}
         */
        dragOver: function(event) {
            this._preventDefaultBehaviour(event);
        },

        /**
         * @method dragEnter
         * @param event {jQuery.Event}
         * @return {void}
         */
        dragEnter: function(event) {
            this._preventDefaultBehaviour(event);
        },

        /**
         * @method dragLeave
         * @param event {jQuery.Event}
         * @return {void}
         */
        dragLeave: function(event) {
            this._preventDefaultBehaviour(event);
        }

    });

})(window, window.Ember);