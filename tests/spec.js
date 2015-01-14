describe('Ember Crossfilter', function() {

    var controller, view;

    beforeEach(function() {

        controller = Ember.Controller.createWithMixins(DropletController);
        view = DropletView.create({ controller: controller });

    });

    describe('General', function() {

        it('Files are cleared for each instantiation', function() {
            expect(Ember.get(controller, 'files.length')).toEqual(0);
        });
    });

    describe('Controller', function() {

        it('Can add a valid file to the list', function() {
            var file = { name: 'MyFile.png' };
            controller.send('addValidFile', file);
            expect(Ember.get(controller, 'validFiles.length')).toEqual(1);
            expect(Ember.get(controller, 'invalidFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'uploadedFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'deletedFiles.length')).toEqual(0);
        });

        it('Can add an invalid file to the list', function() {
            var file = { name: 'MyFile.xml' };
            controller.send('addInvalidFile', file);
            expect(Ember.get(controller, 'validFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'invalidFiles.length')).toEqual(1);
            expect(Ember.get(controller, 'uploadedFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'deletedFiles.length')).toEqual(0);
        });

        it('Can delete a file from the list', function() {
            controller.send('addValidFile', { name: 'MyFile.png' });
            var file = controller.files[0];
            controller.send('deleteFile', file);
            expect(Ember.get(controller, 'validFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'invalidFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'uploadedFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'deletedFiles.length')).toEqual(1);
        });

        it('Can clear all files from the list', function() {
            controller.send('addValidFile', { name: 'MyFile.png' });
            controller.send('addValidFile', { name: 'AnotherFile.xml' });
            controller.send('addValidFile', { name: 'LoveLetter.txt' });
            controller.send('clearAllFiles');
            expect(Ember.get(controller, 'files.length')).toEqual(0);
            expect(Ember.get(controller, 'validFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'invalidFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'uploadedFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'deletedFiles.length')).toEqual(0);
        });

        it('Creates an upload status per instance', function() {
          otherController = Ember.Controller.createWithMixins(DropletController);

          controller.set("uploadStatus.uploading", true)

          expect(otherController.get("uploadStatus.uploading")).toEqual(false);
          expect(controller.get("uploadStatus.uploading")).toEqual(true);
        });

        describe('Aborting an upload', function() {
          it('Aborts the upload request', function() {
              var jqXhrSpy = jasmine.createSpyObj('jqXhr', ['abort'])
              Ember.set(controller, 'uploadStatus.uploading', true);
              Ember.set(controller, 'lastJqXhr', jqXhrSpy);
              controller.send('abortUpload');

              expect(Ember.get(controller, 'uploadStatus.uploading')).toEqual(false);
              expect(jqXhrSpy.abort).toHaveBeenCalled();
          });

          it('Does not attempt to abort the request when there is no upload', function() {
              var jqXhrSpy = jasmine.createSpyObj('jqXhr', ['abort'])
              Ember.set(controller, 'uploadStatus.uploading', false);
              Ember.set(controller, 'jqXhr', jqXhrSpy);
              controller.send('abortUpload');

              expect(Ember.get(controller, 'uploadStatus.uploading')).toEqual(false);
              expect(jqXhrSpy.abort).not.toHaveBeenCalled();
          });
        });

        describe('Destroy', function() {
          var xhr;

          beforeEach(function() {
            xhr = sinon.useFakeXMLHttpRequest();
          });

          afterEach(function() {
            xhr.restore();
          });

          describe('When a file is uploading', function() {
            beforeEach(function() {
              file = { name: 'art_of_flight.mp4', type: 'video/mp4' };
              controller.set("dropletUrl", "http://localhost")
              controller.send('addValidFile', file);
              controller.send('uploadAllFiles', file);
            });

            it('Clears the readystatechange, progress, load and error event handlers', function() {
              var lastRequest = controller.get('lastRequest');

              Em.run(controller, 'destroy');

              expect(lastRequest.onreadystatechange).toBe(undefined);
              expect(lastRequest.upload.onprogress).toBe(undefined);
              expect(lastRequest.upload.onload).toBe(undefined);
              expect(lastRequest.upload.onerror).toBe(undefined);
            });

            it('Aborts the upload', function() {
              lastRequest = controller.get('lastRequest');
              spyOn(lastRequest, 'abort');

              Em.run(controller, 'destroy');

              expect(lastRequest.abort).toHaveBeenCalled();
            });
          });

          describe('When a file is not uploading', function() {
            it("Doesn't raise an error", function() {
              expect(function() {
                Em.run(controller, 'destroy');
              }).not.toThrow();
            });
          });
        });
    });

    describe('View', function() {

        it('Can drop a valid file into the list', function() {

            var eventMock   = jasmine.createSpyObj('event', ['preventDefault', 'stopPropagation', 'dataTransfer']),
                fileMock    = {name: 'Adam.png', type: 'image/png'};

            view.drop(eventMock, [fileMock]);
            expect(eventMock.preventDefault).toHaveBeenCalled();
            expect(eventMock.stopPropagation).toHaveBeenCalled();
            expect(controller.get('validFiles.length')).toEqual(1);

        });

        it('Can drop a invalid file into the list', function() {

            var eventMock   = jasmine.createSpyObj('event', ['preventDefault', 'stopPropagation', 'dataTransfer']),
                fileMock    = {name: 'Adam.xml', type: 'application/xml'};

            view.drop(eventMock, [fileMock]);
            expect(eventMock.preventDefault).toHaveBeenCalled();
            expect(eventMock.stopPropagation).toHaveBeenCalled();
            expect(controller.get('invalidFiles.length')).toEqual(1);

        });

        it('should return the correct file extension', function () {
            var eventMock   = jasmine.createSpyObj('event', ['preventDefault', 'stopPropagation', 'dataTransfer']),
                fileMock    = {name: 'Screen Shot 2014-11-11 at 09.19.22.png', type: 'image/png'};

            view.drop(eventMock, [fileMock]);
            var files = controller.get('files')
            expect(files[0]['className']).toEqual('extension-png');
        });
    });

});
