/**
 * @module App
 * @class EmberDropletController
 * @type Ember.Mixin
 * @extends Ember.Mixin
 */
window.DropletController = Ember.Mixin.create({

    /**
     * @property mimeTypes
     * @type {Array}
     */
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/gif', 'image/png', 'text/plain'],

    /**
     * @property files
     * @type {Array}
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
        Ember.set(this, 'files', []);
        this._super();
    },

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
        Ember.set(file, 'deleted', true);
        return file;
    },

    /**
     * @method clearAllFiles
     * Clears all of the files from the collection.
     * @return {void}
     */
    clearAllFiles: function() {
        Ember.set(this, 'files', []);
    },

    /**
     * @method uploadAllFiles
     * Uploads all of the files that haven't been uploaded yet, but are valid files.
     * @return {Object} jQuery promise.
     */
    uploadAllFiles: function() {

        // Find the URL, set the uploading status, and create our promise.
        var url         = Ember.get(this, 'dropletUrl'),
            deferred    = new jQuery.Deferred();

        Ember.set(this, 'uploadStatus.uploading', true);
        Ember.set(this, 'uploadStatus.error', false);

        // Assert that we have the URL specified in the controller that implements the mixin.
        Ember.assert('You must specify the `dropletUrl` parameter in order to upload files.', !!url);

        // Create a new XHR request object.
        var request = new XMLHttpRequest();
        request.open('post', url, true);

        // Create a new form data instance.
        var formData = new FormData();

        // Iterate over each file, and upload it.
        Ember.EnumerableUtils.forEach(Ember.get(this, 'validFiles'), function(file) {
            formData.append('file', file.file);
        }, this);

        // Add all of the event listeners.
        this._addProgressListener(request.upload);
        this._addSuccessListener(request.upload, deferred);
        this._addErrorListener(request.upload, deferred);

        // Set the request size, and then we can upload the files!
        request.setRequestHeader('X-File-Size', this._getSize());
        request.send(formData);

        // Return the promise.
        return deferred.promise();

    },

    /**
     * @property validFiles
     * Finds a list of files that aren't deleted, and are of a valid MIME type.
     * @return {Array}
     */
    validFiles: Ember.computed(function() {
        return this._filesByProperties({ valid: true, deleted: false, uploaded: false });
    }).property('files.length', 'files.@each.deleted', 'files.@each.uploaded'),

    /**
     * @property invalidFiles
     * Finds a list of files that have an unsupported MIME type.
     * @return {Array}
     */
    invalidFiles: Ember.computed(function() {
        return this._filesByProperties({ valid: false });
    }).property('files.length', 'files.@each.deleted'),

    /**
     * @property uploadedFiles
     * Finds a list of files that have been successfully uploaded.
     * @return {Array}
     */
    uploadedFiles: Ember.computed(function() {
        return this._filesByProperties({ uploaded: true });
    }).property('files.length', 'files.@each.uploaded'),

    /**
     * @property deletedFiles
     * Finds a list of files that have been deleted by the user.
     * @return {Array}
     */
    deletedFiles: Ember.computed(function() {
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
        return Ember.get(this, 'files').filter(function(file) {

            for (var property in maps) {

                // If the current property doesn't match what we're after from the map,
                // then the file is invalid.
                if (file[property] !== maps[property]) {
                    return false;
                }

            }

            // Voila! We have a good file that matches our criteria.
            return true;

        });
    },

    /**
     * Determine the size of the request.
     * @return {Number}
     * @private
     */
    _getSize: function() {
        var size = 0;
        Ember.EnumerableUtils.forEach(Ember.get(this, 'validFiles'), function(file) {
            size += file.file.size;
        });
        return size;
    },

    /**
     * @method _addSuccessListener
     * @param request
     * @param [deferred = null]
     * @private
     */
    _addSuccessListener: function(request, deferred) {

        // Once the files have been successfully uploaded.
        request.addEventListener('load', function() {

            // Set the `uploaded` parameter to true once we've successfully // uploaded the files.
            Ember.EnumerableUtils.forEach(Ember.get(this, 'validFiles'), function(file) {
                Ember.set(file, 'uploaded', true);
            });

            // We want to revert the upload status.
            Ember.set(this, 'uploadStatus.uploading', false);

            if (deferred) {
                // Last of all we can resolve the promise if it exists!
                deferred.resolve();
            }

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
            Ember.set(this, 'uploadStatus.uploading', false);
            Ember.set(this, 'uploadStatus.error', true);

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
            Ember.set(this, 'uploadStatus.percentComplete', Math.round(percentageLoaded));

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
        var className = 'extension-%@'.fmt(file.name.match(/\.(.+)$/i)[1]);

        // Create the record with its default parameters, and then add it to the collection.
        var record = { file: file, valid: valid, uploaded: false, deleted: false, className: className };
        Ember.get(this, 'files').pushObject(record);

        // Voila!
        return record;

    }

});