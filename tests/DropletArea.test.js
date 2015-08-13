describe('Ember Droplet: Area', () => {

    let component, Model;

    beforeEach(() => {

        const Component = Ember.Component.extend(DropletArea);
        component = Component.create();

    });

    it('Should be able to squash events to prevent the browser loading the files;', () => {

        const mockEvent = { stopPropagation: () => {}, preventDefault: () => {}, dataTransfer: { files: [] } };
        spyOn(mockEvent, 'stopPropagation');
        spyOn(mockEvent, 'preventDefault');

        component.dragEnter(mockEvent);
        expect(mockEvent.stopPropagation.calls.count()).toEqual(1);
        expect(mockEvent.preventDefault.calls.count()).toEqual(1);

        component.dragOver(mockEvent);
        expect(mockEvent.stopPropagation.calls.count()).toEqual(2);
        expect(mockEvent.preventDefault.calls.count()).toEqual(2);

        component.dragLeave(mockEvent);
        expect(mockEvent.stopPropagation.calls.count()).toEqual(3);
        expect(mockEvent.preventDefault.calls.count()).toEqual(3);

        component.drop(mockEvent);
        expect(mockEvent.stopPropagation.calls.count()).toEqual(4);
        expect(mockEvent.preventDefault.calls.count()).toEqual(4);

    });

    it('Should be able to a handful of valid and invalid models to the file list;', () => {

        const mockEvent    = { stopPropagation: () => {}, preventDefault: () => {}, dataTransfer: { files: [] } };
        const validFiles   = [{ size: 100, type: 'image/png' }, { size: 500,   type: 'image/gif' }];
        const invalidFiles = [{ size: 55,  type: 'text/json' }, { size: 15000, type: 'image/png' }];

        mockEvent.dataTransfer.files = [...validFiles, ...invalidFiles];

        spyOn(component, 'addFiles').and.callFake(files => {
            expect(files.length).toEqual(4);
        });

        const addedModels = component.drop(mockEvent);
        expect(addedModels.length).toEqual(4);
        expect(component.addFiles).toHaveBeenCalled();

    });

});