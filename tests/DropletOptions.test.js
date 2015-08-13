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

        component.set('options.includeHeader', false);
        expect(component.get('options.includeHeader')).toEqual(false);

    });

    it('Should have reverted all of the options from the previous request;', () => {

        expect(component.get('options.mimeTypes').indexOf('application.pdf')).toEqual(-1);
        expect(component.get('options.requestMethod')).toEqual('POST');
        expect(component.get('options.maximumSize')).toEqual(Infinity);
        expect(component.get('options.useArray')).toEqual(false);
        expect(component.get('options.includeHeader')).toEqual(true);

    });

});