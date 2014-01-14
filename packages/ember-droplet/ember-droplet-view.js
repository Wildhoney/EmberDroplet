(function($window, $ember) {

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

            // Find the controller, and the `mimeTypes` property.
            var controller  = $ember.get(this, 'controller'),
                mimeTypes   = $ember.get(controller, 'mimeTypes');

            // Assert that we have the `mineTypes` property, and that it's an array.
            $ember.assert('`mimeTypes` is undefined. Does your controller implement the `$emberDropletController` mixin?', !!mimeTypes);
            $ember.assert('`mimeTypes` is not an array. It should be an array of valid MIME types.', !!$ember.isArray(mimeTypes));

            for (var index = 0, numFiles = files.length; index < numFiles; index++) {

                if (!files.hasOwnProperty(index)) {
                    continue;
                }

                var file = files[index];

                // Determine if the file is valid based on its MIME type.
                if ($.inArray(file.type, mimeTypes) === -1) {
                    // If it isn't valid, then we'll add it as an invalid file.
                    controller.send('addInvalidFile', file);
                    continue;
                }

                // Otherwise the file has a valid MIME type, and therefore be added as a good file.
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