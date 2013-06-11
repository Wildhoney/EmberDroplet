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
     * @method removeFile
     * @param file
     * Removes a file from the collection.
     * @return {Object}
     */
    removeFile: function(file) {
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
     * Uploads all of the files that haven't been uploaded yet, or you can optionally
     * specify a list of specific files to be uploaded.
     * @return {void}
     */
    uploadAllFiles: function(files) {

        // If we've not specified the `files`, then we need to get a list of valid files.
        files = (files || Ember.get(this, 'validFiles'));

        // Iterate over each file, and upload it.
        Ember.EnumerableUtils.forEach(files, function(file) {
            this.uploadFile(file);
        }, this);

    },

    /**
     * @method uploadFile
     * @param file {File}
     * Uploads a single file.
     * @return {void}
     */
    uploadFile: function(file) {

        var url = Ember.get(this, 'dropletUrl');

        // Assert that we have the URL specified in the controller that implements the mixin.
        Ember.assert('You must specify the `dropletUrl` parameter in order to upload files.', !!url);

        // Create a new XHR request object.
        var request = new XMLHttpRequest();
        request.open('post', url, true);

        // Specify what we're after inside of the file object.
        var fileObject = file.file;

        request.addEventListener('load', function() {

            // Set the `uploaded` parameter to true once we've successfully
            // uploaded the file.
            Ember.set(file, 'uploaded', true);

        }.bind(file), false);

        // Set all of the necessary request headers.
        request.setRequestHeader('X-File-Name', fileObject.name);
        request.setRequestHeader('X-File-Size', fileObject.size);
        request.setRequestHeader('X-File-Type', fileObject.type);

        // Finally we can send the file!
        var formData = new FormData();
        formData.append('file', fileObject);
        request.send(formData);

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