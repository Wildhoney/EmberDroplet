describe('Ember Droplet', () => {

    const exampleUrl = 'http://example.org/send-photos.json';

    let component, Model;

    beforeEach(() => {

        const Component = Ember.Component.extend(Droplet, {
            url: exampleUrl
        });

        component = Component.create();
        Model     = component.get('model');

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

        const mockModels = { first: new Model(), second: new Model(), third: new Model() };
        component.send('addFiles', mockModels.first, mockModels.third);

        expect(component.get('files').length).toEqual(2);
        expect(component.get('files')[0]).toEqual(mockModels.first);
        expect(component.get('files')[1]).toEqual(mockModels.third);

        component.send('deleteFiles', mockModels.first);
        expect(component.get('files').length).toEqual(1);
        expect(component.get('files')[0]).toEqual(mockModels.third);

        component.send('addFiles', mockModels.second);
        component.send('addFiles', mockModels.first);
        expect(component.get('files').length).toEqual(3);
        expect(component.get('files')[0]).toEqual(mockModels.third);
        expect(component.get('files')[1]).toEqual(mockModels.second);
        expect(component.get('files')[2]).toEqual(mockModels.first);

        component.send('deleteFiles', mockModels.first, mockModels.second);
        expect(component.get('files').length).toEqual(1);
        expect(component.get('files')[0]).toEqual(mockModels.third);

        component.send('clearFiles');
        expect(component.get('files').length).toEqual(0);

        // Adding invalid models shouldn't have any effect.
        component.send('addFiles', 'Non-model');
        expect(component.get('files').length).toEqual(0);

    });

    it('Should be able to update the whitelist for MIME types;', () => {

        const defaultMimeTypesLength = component.get('mimeTypes.length');

        // In the default push mode the new item should be appended.
        component.send('mimeTypes', 'application/pdf');
        expect(component.get('mimeTypes.length')).toEqual(defaultMimeTypesLength + 1);
        expect(component.get('mimeTypes')[defaultMimeTypesLength]).toEqual('application/pdf');

        // It should also be able to handle multiple MIME types being sent across.
        component.send('mimeTypes', ['text/json', 'text/html']);
        expect(component.get('mimeTypes.length')).toEqual(defaultMimeTypesLength + 3);
        expect(component.get('mimeTypes')[defaultMimeTypesLength + 1]).toEqual('text/json');
        expect(component.get('mimeTypes')[defaultMimeTypesLength + 2]).toEqual('text/html');

        // In the set mode the added MIME type will entirely replace the current set.
        component.send('mimeTypes', ['text/xml'], 'set');
        expect(component.get('mimeTypes.length')).toEqual(1);
        expect(component.get('mimeTypes')[0]).toEqual('text/xml');

    });

    it('Should be able to handle the callback hooks when performing actions;', () => {

        const mockModels = { first: new Model(), second: new Model(), third: new Model() };

        spyOn(component.hooks, 'didAdd');
        spyOn(component.hooks, 'didDelete');

        component.send('addFiles', mockModels.first, mockModels.second, mockModels.third);
        expect(component.hooks.didAdd.calls.count()).toEqual(3);

        component.send('deleteFiles', mockModels.first, mockModels.second);
        expect(component.hooks.didDelete.calls.count()).toEqual(2);

        // Deleting a non-existent model shouldn't invoke the didAdd callback.
        component.send('deleteFiles', mockModels.first, mockModels.second);
        expect(component.hooks.didDelete.calls.count()).toEqual(2);

    });

    it('Should be able to set the correct status type ID;', () => {

        const statusTypes = component.statusTypes;

        const validMockModel   = new Model({ type: 'image/png' });
        const invalidMockModel = new Model({ type: 'text/pdf' });

        expect(validMockModel.statusType).toEqual(statusTypes.NONE);
        component.send('addFiles', validMockModel);
        expect(validMockModel.statusType).toEqual(statusTypes.VALID);
        component.send('deleteFiles', validMockModel);
        expect(validMockModel.statusType).toEqual(statusTypes.DELETED);

        expect(invalidMockModel.statusType).toEqual(statusTypes.NONE);
        component.send('addFiles', invalidMockModel);
        expect(invalidMockModel.statusType).toEqual(statusTypes.INVALID);
        component.send('clearFiles');
        expect(invalidMockModel.statusType).toEqual(statusTypes.DELETED);

    });

    it('Should be able to read from the computed properties;', () => {

        const validMockModel   = new Model({ type: 'image/png' });
        const invalidMockModel = new Model({ type: 'text/pdf' });

        component.send('addFiles', validMockModel, invalidMockModel);

        expect(component.get('validFiles.length')).toEqual(1);
        expect(component.get('invalidFiles.length')).toEqual(1);

    });

    it('Should be able to upload valid files;', () => {

        const validFiles   = [new Model({ type: 'image/png' }), new Model({ type: 'image/gif' })];
        const invalidFiles = [new Model({ type: 'text/json' }), new Model({ type: 'text/xml' })];

        component.send('addFiles', ...[...validFiles, ...invalidFiles]);

        expect(component.get('validFiles.length')).toEqual(2);
        expect(component.get('invalidFiles.length')).toEqual(2);

    });

});