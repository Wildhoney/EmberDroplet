describe('Ember Droplet: Input', () => {

    let multipleInput, singleInput, imageMock = {};

    beforeEach(() => {

        const MultipleInput = Ember.Component.extend(Droplet.MultipleInput, {
            element: { files: imageMock }
        });

        const SingleInput   = Ember.Component.extend(Droplet.SingleInput, {
            element: { files: [imageMock, imageMock, imageMock] }
        });

        multipleInput = MultipleInput.create();
        singleInput   = SingleInput.create();

    });

    it('Should be able to setup the default attributes;', () => {

        expect(multipleInput.get('tagName')).toEqual('input');
        expect(multipleInput.get('type')).toEqual('file');
        expect(multipleInput.get('multiple')).toEqual('multiple');

        // Single input takes the multiple input's mixin and sets multiple to false.
        expect(singleInput.get('multiple')).toEqual(false);

    });

    it('Should be able to take the files from the properties;', () => {

        spyOn(multipleInput, 'handleFiles');
        multipleInput.change();
        expect(multipleInput.handleFiles).toHaveBeenCalledWith(imageMock);

        spyOn(singleInput, 'handleFiles');
        singleInput.change();
        expect(singleInput.handleFiles).toHaveBeenCalledWith([imageMock, imageMock, imageMock]);

    });

});
