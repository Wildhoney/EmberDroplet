Ember Droplet
=============

[![Build Status](https://travis-ci.org/Wildhoney/EmberDroplet.svg?branch=master)](https://travis-ci.org/Wildhoney/EmberDroplet)
&nbsp;
[![NPM version](https://badge.fury.io/js/ember-droplet.svg)](http://badge.fury.io/js/ember-droplet)

**Demo**: http://droplet.wildhoney.io/

Install via npm: `npm install ember-droplet`.

[See this comment](https://github.com/Wildhoney/EmberDroplet/issues/36#issuecomment-50809709) for installing for Ember CLI.

Ember Droplet allows HTML5 drag and drop functionality in Ember straight out-of-the-box. Its philosophy is that it doesn't
impose anything, and instead allows each individual developer to decide how it should work. I've provided a view &ndash; `DropletView`
that you're free to use in your views. However, most of the functionality exists in the controller mixin &ndash; `DropletController`).

For the time being, please refer to the example.

<img src="http://i.imgur.com/D07KQOl.png" alt="EmberDroplet Screenshot" />

Features
-------------

 * Upload with HTML5's drag and drop;
 * MIME type restrictions on permitted file types;
 * Instant image previews upon dropping;
 * Specifies extension in class name to allow for icons for different file types;
 * Allows the deletion of files before they're uploaded;
 * Keeps a track of all files &ndash; even invalid files;

Methods
-------------

The `DropletController` exposes the following public methods:

 * `addValidFile` &ndash; Adds a file that is allowed by its MIME type;
 * `addInvalidFile` &ndash; Same as above, but a file that isn't allowed by its MIME type;
 * `deleteFile` &ndash; Deletes a specified file by its object;
 * `clearAllFiles` &ndash; Clears all files, including uploaded files;
 * `uploadAllFiles` &ndash; Uploads all valid files &ndash; returns a <a href="http://api.jquery.com/deferred.promise/" target="_blank">jQuery promise</a>;

In addition to the methods, `DropletController` also has the following computed properties for convenience:

 * `validFiles` &ndash; Provides a list of valid files;
 * `invalidFiles` &ndash; Provides a list of invalid files;
 * `uploadedFiles` &ndash; All uploaded files;
 * `deletedFiles` &ndash; All deleted files;

Additional computed properties can be added to your controller that implements the mixin. To add additional computed properties,
please refer to the protected `_filesByProperties` method in the mixin.

Getting Started
-------------

In order to begin using EmberDroplet, you need a controller. Within your controller you can implement the `DropletController` mixin, which will give you access to all methods defined in it.

```javascript
App.IndexController = Ember.Controller.extend(DropletController, {

});
```

Properties that can be defined in your controller to interact with the mixin are as follows:

 * `dropletUrl`: URL in which the Node.js <em>(default)</em> or Apache/Nginx server is running on;
 * `mimeTypes`: Enumeration of valid MIME types. Can be appended using `concatenatedProperties` (see example);
 * `dropletOptions.useArray`: Defaults to `true`, which works for Ruby/PHP scripts where you need to specify an array-like name for the field (`file[]`). Set to `false` to use the field name `file` instead;
 * `dropletOptions.fileSizeHeader`: Defaults to `true`. Set to `false` to omit the `X-File-Size` http header;
 * `dropletOptions.method`: Defaults to `post`, but can be set to `put` if needed.

Now that your controller is using the mixin, it's time for your view to interact with your controller and its related mixin. For this we recommend using the in-built view, but it's not essential. In order to create your own, please refer to the example. The simplest way to use the in-built view is to embed it into your template.

```javascript
App.IndexView = Ember.View.extend({

    /**
     * @property DragDrop
     * @type DropletView
     */
    DragDrop: DropletView.extend()

});
```

Once you have the property `DragDrop` defined, the view and all of its related functionality can be output into the DOM using `{{view.DragDrop}}`. It's worth bearing in mind that this view is quite abstract in order to be customisable &ndash; see index.html for an example.

Example
-------------

The example uses the Node.js server to upload files, which is available in `example/node-server`. Simply run: `node server` to create it.

<h3>Vagrant</h3>

As an alternative, if you have Vagrant installed then you can simply issue the `vagrant up` command and the Node.js server will be available on port 8889.

View Mixin
-------------

In order to use `EmberDroplet` it's not necessary for you to implement the `DropletView` mixin into your view. However, if you don't, then you'll need to communicate with the `DropletController` mixin yourself.

There is also `DropletPreview` which allows image uploads to be previewed immediately.

Testing
-------------

All of the related tests are written in Jasmine, and can be run with `grunt test` (assuming you have `grunt` installed &ndash; `npm install grunt-cli -g`). You'll also need to run `npm install` to install the project's dependencies.

<img src="http://nathanleclaire.com/images/unit-test-angularjs-service/jasmine.png" alt="Jasmine" />
