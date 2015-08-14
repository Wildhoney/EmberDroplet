describe('Ember Droplet', () => {

    const exampleUrl = 'http://example.org/send-photos.json';
    Ember.debug      = () => {};

    let component, Model;

    beforeEach(() => {

        const Component = Ember.Component.extend(Droplet, {
            url: exampleUrl
        });

        component = Component.create();
        Model     = component.model;

    });

    it('Should be able to override the required URL parameter;', () => {

        expect(component.get('url')).toEqual(exampleUrl);

        expect(() => {

            // Specifying the URL is a requirement for uploading files.
            component = Ember.Component.extend(Droplet).create();
            component.send('uploadFiles');

        }).toThrow(new Error('Droplet: You must specify the URL parameter when constructing your component.'));

    });

    it('Should be able to add, remove, and clear files;', () => {

        const mockModels = { first: {}, second: {}, third: {} };
        component.send('prepareFiles', mockModels.first, mockModels.third);

        expect(component.get('files.length')).toEqual(2);
        expect(component.get('files')[0].file).toEqual(mockModels.first);
        expect(component.get('files')[1].file).toEqual(mockModels.third);

        component.send('deleteFiles', component.get('files')[0]);
        expect(component.get('files').length).toEqual(2);
        expect(component.get('deletedFiles.length')).toEqual(1);

        component.send('prepareFiles', mockModels.second);
        component.send('prepareFiles', mockModels.first);
        expect(component.get('files.length')).toEqual(4);
        expect(component.get('deletedFiles.length')).toEqual(1);
        expect(component.get('invalidFiles.length')).toEqual(3);
        expect(component.get('files')[0].file).toEqual(mockModels.third);
        expect(component.get('files')[1].file).toEqual(mockModels.second);
        expect(component.get('files')[2].file).toEqual(mockModels.first);

        component.send('deleteFiles', component.get('files')[0], component.get('files')[1]);
        expect(component.get('files.length')).toEqual(4);
        expect(component.get('files')[0].file).toEqual(mockModels.third);

        component.send('clearFiles');
        expect(component.get('deletedFiles.length')).toEqual(4);

        // Adding invalid models shouldn't have any effect.
        component.send('addFiles', 'Non-model');
        expect(component.get('files.length')).toEqual(4);

    });

    it('Should be able to update the whitelist for MIME types;', () => {

        const defaultMimeTypesLength = component.get('options.mimeTypes.length');

        // In the default push mode the new item should be appended.
        component.send('mimeTypes', 'application/pdf');
        expect(component.get('options.mimeTypes.length')).toEqual(defaultMimeTypesLength + 1);
        expect(component.get('options.mimeTypes')[defaultMimeTypesLength]).toEqual('application/pdf');

        // It should also be able to handle multiple MIME types being sent across.
        component.send('mimeTypes', ['text/json', 'text/html']);
        expect(component.get('options.mimeTypes.length')).toEqual(defaultMimeTypesLength + 3);
        expect(component.get('options.mimeTypes')[defaultMimeTypesLength + 1]).toEqual('text/json');
        expect(component.get('options.mimeTypes')[defaultMimeTypesLength + 2]).toEqual('text/html');

        // In the set mode the added MIME type will entirely replace the current set.
        component.send('mimeTypes', ['text/xml'], 'set');
        expect(component.get('options.mimeTypes.length')).toEqual(1);
        expect(component.get('options.mimeTypes')[0]).toEqual('text/xml');

    });

    it('Should be able to handle the callback hooks when performing actions;', () => {

        const mockModels = { first: {}, second: {}, third: {} };

        component.hooks.didAdd    = () => {};
        component.hooks.didDelete = () => {};

        spyOn(component.hooks, 'didAdd');
        spyOn(component.hooks, 'didDelete');

        component.send('prepareFiles', mockModels.first, mockModels.second, mockModels.third);
        expect(component.hooks.didAdd.calls.count()).toEqual(1);

        component.send('deleteFiles', component.get('files')[0], component.get('files')[1]);
        expect(component.hooks.didDelete.calls.count()).toEqual(1);

        // Deleting a non-existent model shouldn't invoke the didAdd callback.
        component.send('deleteFiles', {}, {}, {});
        expect(component.hooks.didDelete.calls.count()).toEqual(1);

    });

    it('Should be able to set the correct status type ID;', () => {

        const statusTypes = component.statusTypes;

        const validMockModel   = Model.create({ file: { type: 'image/png' } });
        const invalidMockModel = Model.create({ file: { type: 'text/pdf'  } });

        expect(validMockModel.get('statusType')).toEqual(statusTypes.NONE);
        component.send('addFiles', validMockModel);
        expect(validMockModel.get('statusType')).toEqual(statusTypes.VALID);
        component.send('deleteFiles', validMockModel);
        expect(validMockModel.get('statusType')).toEqual(statusTypes.DELETED);

        expect(invalidMockModel.get('statusType')).toEqual(statusTypes.NONE);
        component.send('addFiles', invalidMockModel);
        expect(invalidMockModel.get('statusType')).toEqual(statusTypes.INVALID);
        component.send('clearFiles');
        expect(invalidMockModel.get('statusType')).toEqual(statusTypes.DELETED);

    });

    it('Should be able to read from the computed properties;', () => {

        const validMockModel   = Model.create({ file: { type: 'image/png' } });
        const invalidMockModel = Model.create({ file: { type: 'text/pdf'  } });

        component.send('addFiles', validMockModel, invalidMockModel);

        expect(component.get('validFiles.length')).toEqual(1);
        expect(component.get('invalidFiles.length')).toEqual(1);

    });

    it('Should be able to upload valid files;', done => {

        const validFiles   = [Model.create({ file: { type: 'image/png' } }), Model.create({ file: { type: 'image/gif' } })];
        const invalidFiles = [Model.create({ file: { type: 'text/json' } }), Model.create({ file: { type: 'text/xml' } })];

        // Resolve the Jasmine test when the hook is invoked.
        component.hooks.didUpload = (...files) => {
            expect(files.length).toEqual(2);
            expect(files[0]).toEqual(validFiles[0]);
            expect(files[1]).toEqual(validFiles[1]);
            expect(component.hooks.didUpload.calls.count()).toEqual(1);
        };

        component.hooks.didComplete = () => {
            expect(component.get('uploadStatus.uploading')).toEqual(false);
            expect(component.get('uploadedFiles.length')).toEqual(2);
            done();
        };

        spyOn(component.hooks, 'didUpload').and.callThrough();

        component.send('addFiles', ...[...validFiles, ...invalidFiles]);
        expect(component.get('validFiles.length')).toEqual(2);
        expect(component.get('invalidFiles.length')).toEqual(2);

        component.hooks.promiseResolver = (resolve, reject, files) => {
            resolve({ files });
        };

        component.send('uploadFiles');

    });

    it('Should be able to set the error messages when the request fails;', done => {

        const request     = {};
        const textStatus  = 'An unknown error was thrown!';
        const errorThrown = 301;

        component.hooks.didComplete = () => {
            expect(component.get('uploadStatus.uploading')).toEqual(false);
            expect(component.get('uploadStatus.error.request')).toEqual(request);
            expect(component.get('uploadStatus.error.textStatus')).toEqual(textStatus);
            expect(component.get('uploadStatus.error.errorThrown')).toEqual(errorThrown);
            done();
        };

        const firstValid  = Model.create({ file: { type: 'image/png' } });
        const secondValid = Model.create({ file: { type: 'image/jpg' } });

        component.hooks.promiseResolver = (resolve, reject) => {
            reject({ request, errorThrown, textStatus });
        };

        component.send('addFiles', firstValid, secondValid);
        component.send('uploadFiles');

    });

    it('Should be able to determine the file size for the X-File-Size header;', () => {

        const files = [Model.create({ file: { type: 'image/png', size: 100 } }),
                       Model.create({ file: { type: 'image/png', size: 1500 } }),
                       Model.create({ file: { type: 'image/png', size: 250 } })];

        component.send('addFiles', ...files);
        expect(component.get('requestSize')).toEqual(1850);

    });

    it('Should be able to determine when a file is valid or invalid;', () => {

        const validFiles   = [Model.create({ file: { size: 100, type: 'image/png' } }),
                              Model.create({ file: { size: 500, type: 'image/gif' } })];

        const invalidFiles = [Model.create({ file: { size: 55,    type: 'text/json' } }),
                              Model.create({ file: { size: 15000, type: 'image/png' } })];

        component.set('options.maximumSize', 14500);

        expect(component.isValid(validFiles[0])).toBe(true);
        expect(component.isValid(validFiles[1])).toBe(true);

        expect(component.isValid(invalidFiles[0])).toBe(false);
        expect(component.isValid(invalidFiles[1])).toBe(false);

        // Checks to validate the file size limitation can be exact.
        const exactSizeModel = Model.create({ file: { size: 14500, type: 'image/png' } });
        expect(component.isValid(exactSizeModel)).toBe(true);

        // Checks to ensure a file without any metadata is considered invalid.
        expect(component.isValid({})).toBe(false);

        // Checks to make sure that only a valid MIME type is not enough.
        expect(component.isValid(Model.create({ file: { type: 'image/gif' } }))).toBe(false);

         // Checks to make sure that only a valid file size is insufficient.
        expect(component.isValid(Model.create({ file: { size: 500 } }))).toBe(false);

    });

    it('Should be able to valid MIME types using regular expressions;', () => {

        const firstValid  = Model.create({ file: { size: 0, type: 'image/first' } });
        const secondValid = Model.create({ file: { size: 0, type: 'image/second' } });
        const thirdValid  = Model.create({ file: { size: 0, type: 'text/plain' } });

        const firstInvalid  = Model.create({ file: { size: 0,  type: 'text/first' } });
        const secondInvalid = Model.create({ file: { size: 0, type: 'application/second' } });

        component.send('mimeTypes', ['text/plain', /image\/+./], 'set');

        expect(component.isValid(firstValid)).toBe(true);
        expect(component.isValid(secondValid)).toBe(true);
        expect(component.isValid(thirdValid)).toBe(true);

        expect(component.isValid(firstInvalid)).toBe(false);
        expect(component.isValid(secondInvalid)).toBe(false);

        // Accept everything!
        component.send('mimeTypes', [/.*/], 'set');
        expect(component.isValid(firstValid)).toBe(true);
        expect(component.isValid(secondValid)).toBe(true);
        expect(component.isValid(thirdValid)).toBe(true);
        expect(component.isValid(firstInvalid)).toBe(true);
        expect(component.isValid(secondInvalid)).toBe(true);

        // Accept none!
        component.send('mimeTypes', [], 'set');
        expect(component.isValid(firstValid)).toBe(false);
        expect(component.isValid(secondValid)).toBe(false);
        expect(component.isValid(thirdValid)).toBe(false);
        expect(component.isValid(firstInvalid)).toBe(false);
        expect(component.isValid(secondInvalid)).toBe(false);

    });

    it('Should be able to abort an existing HTTP request;', () => {

        component.lastResolver = { abort: () => {} };
        spyOn(component.lastResolver, 'abort');
        component.set('uploadStatus.uploading', true);

        component.send('abortUpload');
        expect(component.lastResolver.abort).toHaveBeenCalled();

    });

    it('Should be able to define the lastResolver property;', () => {

        expect(component.lastResolver).toBeUndefined();
        component.getRequest();
        expect(component.lastResolver).not.toBeUndefined();

    });

    it('Should be able to construct the FormData object using additional POST data;', () => {

        component.options.requestPostData = { name: 'Adam', location: 'London' };

        const models = [Model.create({ file: { size: 0, type: 'image/jpg' } }),
                        Model.create({ file: { size: 0, type: 'image/png' } }),
                        Model.create({ file: { size: 0, type: 'image/gif' } })];

        component.send('addFiles', ...models);
        component.send('uploadFiles');

        const formData = component.getFormData();
        expect(formData.get('name')).toEqual('Adam');
        expect(formData.get('location')).toEqual('London');
        expect(formData.get('file')).not.toBeUndefined();

    });

});
