/**
 * @module App
 * @class EmberDropletController
 * @type Ember.Mixin
 * @extends Ember.Mixin
 */
window.EmberDropletController = Ember.Mixin.create({

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

    uploadStatus: { uploading: false, percentComplete: 0 },

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

        // Assert that we have the URL specified in the controller that implements the mixin.
        Ember.assert('You must specify the `dropletUrl` parameter in order to upload files.', !!url);

        // Create a new XHR request object.
        var request = new XMLHttpRequest();
        request.open('post', url, true);

        // Prepare the form data, and the request headers.
        var formData    = new FormData(),
            overallSize = 0;

        // Find the list of valid files to upload.
        var files = Ember.get(this, 'validFiles');

        // Iterate over each file, and upload it.
        Ember.EnumerableUtils.forEach(files, function(file) {
            overallSize += file.file.size;
            formData.append('file', file.file);
        }, this);

        // Once the files have been successfully uploaded.
        request.addEventListener('load', function() {

            // Set the `uploaded` parameter to true once we've successfully // uploaded the files.
            Ember.EnumerableUtils.forEach(files, function(file) {
                Ember.set(file, 'uploaded', true);
            });

            // We want to revert the upload status.
            Ember.set(this, 'uploadStatus.uploading', false);

            // Last of all we can resolve the promise!
            deferred.resolve();

        }.bind(this), false);

        request.upload.addEventListener('progress', function (event) {

            if (!event.lengthComputable) {
                // There's not much we can do if the request is not computable.
                return;
            }

            // Calculate the percentage remaining.
            var percentageLoaded = (event.loaded / overallSize) * 100;
            Ember.set(this, 'uploadStatus.percentComplete', Math.round(percentageLoaded));

        }.bind(this), false);

        // Set the request size, and then we can upload the files!
        request.setRequestHeader('X-File-Size', overallSize);
        request.send(formData);

        // Return the promise.
        return deferred.promise();

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
    }

});