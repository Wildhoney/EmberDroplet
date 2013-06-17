describe('Ember Crossfilter', function() {
    var controller;

    beforeEach(function() {

        controller = Ember.Controller.extend(EmberDropletController, {

        }).create();

    });

    describe('General', function() {

        it('Files are cleared for each instantiation', function() {
            expect(Ember.get(controller, 'files.length')).toEqual(0);
        });

    });

    describe('Basic File Management', function() {

        it('Can add a valid file to the list', function() {
            var file = { name: 'MyFile.png' };
            controller.addValidFile(file);
            expect(Ember.get(controller, 'validFiles.length')).toEqual(1);
            expect(Ember.get(controller, 'invalidFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'uploadedFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'deletedFiles.length')).toEqual(0);
        });

        it('Can add an invalid file to the list', function() {
            var file = { name: 'MyFile.xml' };
            controller.addInvalidFile(file);
            expect(Ember.get(controller, 'validFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'invalidFiles.length')).toEqual(1);
            expect(Ember.get(controller, 'uploadedFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'deletedFiles.length')).toEqual(0);
        });

        it('Can delete a file from the list', function() {
            var file = controller.addValidFile({ name: 'MyFile.png' });
            controller.deleteFile(file);
            expect(Ember.get(controller, 'validFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'invalidFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'uploadedFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'deletedFiles.length')).toEqual(1);
        });

        it('Can clear all files from the list', function() {
            controller.addValidFile({ name: 'MyFile.png' });
            controller.addValidFile({ name: 'AnotherFile.xml' });
            controller.addValidFile({ name: 'LoveLetter.txt' });
            controller.clearAllFiles();
            expect(Ember.get(controller, 'files.length')).toEqual(0);
            expect(Ember.get(controller, 'validFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'invalidFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'uploadedFiles.length')).toEqual(0);
            expect(Ember.get(controller, 'deletedFiles.length')).toEqual(0);
        });

    });

});