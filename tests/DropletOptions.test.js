describe('Ember Droplet: Options', () => {

    let component, Model;

    beforeEach(() => {

        const Component = Ember.Component.extend(Droplet);
        component = Component.create();
        Model     = component.get('model');

    });

    it('Should be able to define a handful of options;', () => {

        const defaultMimeTypesLength = component.get('options.mimeTypes.length');

        // In the default push mode the new item should be appended.
        component.send('mimeTypes', 'application/pdf');
        expect(component.get('options.mimeTypes.length')).toEqual(defaultMimeTypesLength + 1);
        expect(component.get('options.mimeTypes')[defaultMimeTypesLength]).toEqual('application/pdf');

        component.set('options.requestMethod', 'GET');
        expect(component.get('options.requestMethod')).toEqual('GET');

        component.set('options.maximumSize', 4000);
        expect(component.get('options.maximumSize')).toEqual(4000);

        component.set('options.useArray', true);
        expect(component.get('options.useArray')).toEqual(true);

        component.set('options.includeXFileSize', false);
        expect(component.get('options.includeXFileSize')).toEqual(false);

        component.set('options.requestHeaders', 'abc');
        expect(component.get('options.requestHeaders')).toEqual('abc');

        component.set('options.requestPostData', '123');
        expect(component.get('options.requestPostData')).toEqual('123');

        component.set('options.maximumValidFiles', 100);
        expect(component.get('options.maximumValidFiles')).toEqual(100);

        component.set('options.uploadImmediately', true);
        expect(component.get('options.uploadImmediately')).toEqual(true);

    });

    it('Should have reverted all of the options from the previous request;', () => {

        expect(component.get('options.mimeTypes').indexOf('application.pdf')).toEqual(-1);
        expect(component.get('options.requestMethod')).toEqual('POST');
        expect(component.get('options.maximumSize')).toEqual(Infinity);
        expect(component.get('options.useArray')).toEqual(false);
        expect(component.get('options.includeXFileSize')).toEqual(true);
        expect(component.get('options.requestHeaders')).toEqual({});
        expect(component.get('options.requestPostData')).toEqual({});
        expect(component.get('options.maximumValidFiles')).toEqual(Infinity);
        expect(component.get('options.uploadImmediately')).toEqual(false);

    });

    it('Should be able to reject files when the quota has been met;', () => {

        const models = [Model.create({ file: { size: 0, type: 'image/jpg' } }),
                        Model.create({ file: { size: 0, type: 'image/png' } }),
                        Model.create({ file: { size: 0, type: 'image/tiff' } }),
                        Model.create({ file: { size: 0, type: 'image/gif' } })];

        component.set('options.maximumValidFiles', 3);
        component.send('addFiles', ...models);

        expect(component.get('validFiles.length')).toEqual(3);
        expect(component.get('invalidFiles.length')).toEqual(1);

    });

    it('Should be able to upload files immediately;', done => {

        const models = [Model.create({ file: { size: 0, type: 'image/jpg' } }),
                        Model.create({ file: { size: 0, type: 'image/png' } }),
                        Model.create({ file: { size: 0, type: 'image/tiff' } }),
                        Model.create({ file: { size: 0, type: 'image/gif' } })];

        component.set('url', 'http://example.org/');
        component.set('options.uploadImmediately', true);

        component.hooks.promiseResolver = (resolve, reject, files) => {
            resolve({ files });
        };

        component.hooks.didComplete = () => {
            expect(component.get('uploadedFiles.length')).toEqual(4);
            done();
        };

        spyOn(component.actions, 'uploadFiles').and.callThrough();
        component.send('addFiles', ...models);
        expect(component.actions.uploadFiles).toHaveBeenCalled();

    });

});
