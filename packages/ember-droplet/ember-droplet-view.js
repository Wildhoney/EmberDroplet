(function($window, $ember) {

    "use strict";

    /**
     * @property MultipleInput
     * @type {Object}
     */
    var MultipleInput = {

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
        attributeBindings: ['disabled', 'name', 'type', 'multiple'],

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
         * Invoked when the content of the INPUT changes.
         *
         * @method change
         * @return {Boolean}
         */
        change: function() {
            var files = this.get('element').files;
            return this.get('parentView').traverseFiles(files);
        }

    };

    /**
     * @property SingleInput
     * @type {Object}
     */
    var SingleInput      = $ember.copy(MultipleInput);
    SingleInput.multiple = false;

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
             * Invoked when the view is inserted into the DOM.
             *
             * @method didInsertElement
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
                reader.onload = $ember.run.bind(this, function (event) {

                    if (this.get('isDestroyed') === true) {
                        // If the view has already been destroyed, then we can't
                        // load in the image preview.
                        return;
                    }

                    // Otherwise we're free to set the SRC attribute to the image's data.
                    $ember.set(this, 'src', event.target.result);

                });

                // Begin the reading of the image.
                reader.readAsDataURL(image);

            }

        }),

        /**
         * @property MultipleInput
         * @type {Ember.View}
         */
        MultipleInput: $ember.View.extend(MultipleInput),

        /**
         * @property SingleInput
         * @type {Ember.View}
         */
        SingleInput: $ember.View.extend(SingleInput),

        /**
         * Invoked when the user drops a file onto the droppable area.
         *
         * @method drop
         * @param event {jQuery.Event}
         * @param [files = []] {Array}
         * @return {Boolean}
         */
        drop: function(event, files) {
            this._preventDefaultBehaviour(event);
            return this.traverseFiles(event.dataTransfer.files || files);
        },

        /**
         * Accepts a FileList object, and traverses them to determine if they're valid, adding them
         * as either valid or invalid.
         *
         * @method traverseFiles
         * @param files {FileList}
         * @return {boolean}
         */
        traverseFiles: function(files) {

            // Find the controller, and the `mimeTypes` and `extensions` property.
            var controller  = $ember.get(this, 'controller'),
                mimeTypes   = $ember.get(controller, 'mimeTypes') || [],
                extensions  = $ember.get(controller, 'extensions'),
                options     = $ember.get(controller, 'dropletOptions') || { limit: Infinity},
                addedFiles  = [];

            for (var index = 0, numFiles = files.length; index < numFiles; index++) {

                if (!files.hasOwnProperty(index) && (!(index in files))) {
                    continue;
                }

                var file        = files[index],
                    fileExt     = file.name.substr((~-file.name.lastIndexOf('.') >>> 0) + 2),
                    assumeValid = $ember.get(controller, 'mimeTypes') === '*';

                // Determine if the file is valid based on its MIME type or extension, and we haven't exceeded
                // the user defined limit for the amount of files to upload in one go.
                var invalidMime   = ($.inArray(file.type, mimeTypes) === -1) && ($.inArray(fileExt, extensions) === -1),
                    currentLength = $ember.get(controller, 'validFiles').length,
                    fileSizeLimit = controller.get('fileSizeLimit');

                if (!assumeValid && (invalidMime || currentLength === options.limit)) {

                    // If it isn't valid, then we'll add it as an invalid file.
                    controller.send('addInvalidFile', file);
                    addedFiles.push(file);
                    continue;

                }

                if (fileSizeLimit != null && file.size >= fileSizeLimit) {
                    controller.send('addInvalidFile', file);
                    continue;
                }

                // Otherwise the file has a valid MIME type or extension, and therefore be added as a good file.
                controller.send('addValidFile', file);
                addedFiles.push(file);

            }

            // Initialise the event for adding files.
            controller.send('addedFiles', addedFiles);

            return true;

        },

        /**
         * Prevents default behaviour and propagation on nodes where it's undesirable.
         *
         * @method _preventDefaultBehaviour
         * @param event {jQuery.Event}
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