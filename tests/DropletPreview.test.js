describe('Ember Droplet: Preview', () => {

    let component, imageData = 'abc', mockLoadEvent = () => {};

    const mockEvent  = { target: { result: imageData } };
    const mockReader = class {
        addEventListener(_, fn) { mockLoadEvent = fn }
        readAsDataURL() {}
    };

    beforeEach(() => {

        spyOn(mockReader.prototype, 'readAsDataURL').and.callThrough();
        spyOn(mockReader.prototype, 'addEventListener').and.callThrough();

        const Component = Ember.Component.extend(Droplet.Preview, {
            reader: mockReader,
            image: { file: { type: 'image/png' } }
        });

        component = Component.create();
        spyOn(component, 'isImage').and.callThrough();

    });

    it('Should be able to load the preview image;', () => {

        component.didInsertElement();
        mockLoadEvent(mockEvent);

        expect(mockReader.prototype.readAsDataURL).toHaveBeenCalled();
        expect(mockReader.prototype.addEventListener).toHaveBeenCalledWith('load', jasmine.any(Function));
        expect(component.get('src')).toEqual(imageData);
        expect(component.isImage).toHaveBeenCalled();

    });

    it('Should be able to validate whether an item is an image or not;', () => {

        const validFirst    = { type: 'image/png' };
        const validSecond   = { type: 'image/gif' };
        const invalidFirst  = { type: 'application/pdf' };
        const invalidSecond = { type: 'text/plain' };

        expect(component.isImage(validFirst)).toBe(true);
        expect(component.isImage(validSecond)).toBe(true);

        expect(component.isImage(invalidFirst)).toBe(false);
        expect(component.isImage(invalidSecond)).toBe(false);

    });

});
