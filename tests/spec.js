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

        it('does not attempt to abort when there is no upload', function() {
            var requestSpy = jasmine.createSpyObj('request', ['abort'])
            Ember.set(controller, 'uploadStatus.uploading', false);
            Ember.set(controller, 'lastRequest', requestSpy);
            controller.send('abortUpload');

            expect(Ember.get(controller, 'uploadStatus.uploading')).toEqual(false);
            expect(requestSpy.abort).not.toHaveBeenCalled();
        });

        it('Can abort an upload', function() {
            var requestSpy = jasmine.createSpyObj('request', ['abort'])
            Ember.set(controller, 'uploadStatus.uploading', true);
            Ember.set(controller, 'lastRequest', requestSpy);
            controller.send('abortUpload');

            expect(Ember.get(controller, 'uploadStatus.uploading')).toEqual(false);
            expect(requestSpy.abort).toHaveBeenCalled();
        });

        it('Creates an upload status per instance', function() {
          otherController = Ember.Controller.createWithMixins(DropletController);

          controller.set("uploadStatus.uploading", true)

          expect(otherController.get("uploadStatus.uploading")).toEqual(false);
          expect(controller.get("uploadStatus.uploading")).toEqual(true);
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

    });

});
