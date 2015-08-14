# Ember Droplet

[![Build Status](https://travis-ci.org/Wildhoney/EmberDroplet.svg?branch=master)](https://travis-ci.org/Wildhoney/EmberDroplet)
&nbsp;
[![NPM version](https://badge.fury.io/js/ember-droplet.svg)](http://badge.fury.io/js/ember-droplet)

**Heroku**: http://ember-droplet.herokuapp.com/

Install via npm: `npm install ember-droplet`.

[See this comment](https://github.com/Wildhoney/EmberDroplet/issues/36#issuecomment-50809709) for installing for Ember CLI.

Ember Droplet allows HTML5 drag and drop functionality in Ember straight out-of-the-box. Its philosophy is that it doesn't
impose anything, and instead allows each individual developer to decide how it should work.

<img src="http://i.imgur.com/D07KQOl.png" alt="EmberDroplet Screenshot" />

## Features

 * Upload with HTML5's drag and drop;
 * MIME type restrictions on permitted file types;
 * Restrictions on the amount of files to be uploaded at any one time;
 * Allow immediate uploading when the user selects a file;
 * Instant image previews upon dropping;
 * Allows the deletion of files before they're uploaded;
 * Keeps a track of all files &ndash; even invalid files;
 * Abort requests after they have been sent to the server;

## Methods

The `DropletMixin` contains the following actions:

 * `addFiles` &ndash; Adds files to the queue;
 * `deleteFile` &ndash; Deletes a specified file by model;
 * `clearFiles` &ndash; Clears all valid and invalid files;
 * `uploadFiles` &ndash; Uploads all valid files;
 * `abortUpload` &ndash; Abort the current request;
 * `mimeTypes` &ndash; Specify acceptable MIME types;
 * `prepareFiles` &ndash; Packages file objects into Droplet models;

In addition to the actions, the mixin also has the following computed properties for convenience:

 * `validFiles` &ndash; Provides a list of valid files;
 * `invalidFiles` &ndash; Provides a list of invalid files;
 * `uploadedFiles` &ndash; All uploaded files;
 * `deletedFiles` &ndash; All deleted files;

## Getting Started

In order to begin using EmberDroplet, you need a to instantiate the necessary `Ember.Component`s:

```javascript
App.XDropletComponent = Ember.Component.extend(Droplet, {
    url: location.origin + '/upload'
});
```

**Note:** Specifying a `url` parameter is mandatory, since no default is assumed.

Properties that can be defined when instantiating the `Ember.Component` are as follows:

 * `requestMethod` &ndash; Changed the request verb from default `POST`;
 * `maximumSize` &ndash; Set the maximum size for each individual file;
 * `maximumValidFiles` &ndash; Amount of valid files permitted to be in the queue;
 * `uploadImmediately` &ndash; Upload files as they're added to the queue;
 * `includeXFileSize` &ndash; Whether to include the `X-File-Size` header for progress;
 * `useArray` &ndash; Changes the `FormData` name of the `file` to either `file[]` or `file`;
 * `mimeTypes` &ndash; List of valid MIME types &ndash; can also be changed with `mimeTypes` method;
 * `requestHeaders` &ndash; Additional request headers to be sent;
 * `requestPostData` &ndash; Additional POST data to be sent;

Once you have instantiated the `Droplet` `Ember.Component` in your application, you can instantiate other provided `Ember.Component` objects for additional functionality:

### Droppable Area

```javascript
App.XDropletAreaComponent = Ember.Component.extend(Droplet.Area);
```

Use as singular or in block form:

```html
{{x-droplet-area}}
```

### Image Preview

```javascript
App.XDropletPreviewComponent = Ember.Component.extend(Droplet.Preview);
```

Use as follows where `file` is derived from iterating over a [computed property](#methods):

```html
{{x-droplet-preview image=file}}
```

### Input Field

```javascript
App.XDropletInputComponent = Ember.Component.extend(Droplet.MultipleInput);
```

Use in its singular form &ndash; can use either `Droplet.MultipleInput` or `Droplet.SingleInput`:

```html
{{x-droplet-input}}
```

Once you have the property `DragDrop` defined, the view and all of its related functionality can be output into the DOM using `{{view.DragDrop}}`. It's worth bearing in mind that this view is quite abstract in order to be customisable &ndash; see index.html for an example.

Example
-------------

The example uses the Node.js server to upload files, which is available in `example/serer`. Simply run: `npm start` &mdash; or `foreman start &mdash; to create it.

Testing
-------------

All of the related tests are written in Jasmine, and can be run with `npm run test`. You'll also need to run `npm i` to install the project's dependencies.

<img src="http://nathanleclaire.com/images/unit-test-angularjs-service/jasmine.png" alt="Jasmine" />
