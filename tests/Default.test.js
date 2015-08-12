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

    });

});