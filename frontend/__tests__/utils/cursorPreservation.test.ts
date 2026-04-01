import { withCursorPreservation } from '../../src/utils/cursorPreservation';

describe('withCursorPreservation (utils/cursorPreservation)', () => {
    let rafCallback: FrameRequestCallback | null = null;

    beforeEach(() => {
        // Capture the requestAnimationFrame callback synchronously
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
            rafCallback = cb;
            return 1;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
        rafCallback = null;
    });

    const makeEvent = (overrides: Partial<HTMLInputElement> = {}) => {
        const target = {
            selectionStart: 3,
            selectionEnd: 7,
            setSelectionRange: jest.fn(),
            ...overrides,
        } as unknown as HTMLInputElement;

        return { target } as React.ChangeEvent<HTMLInputElement>;
    };

    it('should call the wrapped handler immediately', () => {
        const inner = jest.fn();
        const wrapped = withCursorPreservation(inner);
        const event = makeEvent();

        wrapped(event);

        expect(inner).toHaveBeenCalledWith(event);
        expect(inner).toHaveBeenCalledTimes(1);
    });

    it('should schedule a requestAnimationFrame call', () => {
        const wrapped = withCursorPreservation(jest.fn());
        wrapped(makeEvent());
        expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
    });

    it('should restore the selection range when element is focused', () => {
        const target = {
            selectionStart: 2,
            selectionEnd: 5,
            setSelectionRange: jest.fn(),
        } as unknown as HTMLInputElement;
        const event = { target } as React.ChangeEvent<HTMLInputElement>;

        // Make document.activeElement === target
        Object.defineProperty(document, 'activeElement', { value: target, configurable: true });

        const wrapped = withCursorPreservation(jest.fn());
        wrapped(event);
        rafCallback!(0);

        expect(target.setSelectionRange).toHaveBeenCalledWith(2, 5);
    });

    it('should NOT restore the selection range when element is not focused', () => {
        const target = {
            selectionStart: 2,
            selectionEnd: 5,
            setSelectionRange: jest.fn(),
        } as unknown as HTMLInputElement;
        const event = { target } as React.ChangeEvent<HTMLInputElement>;

        // Make document.activeElement point to something else
        Object.defineProperty(document, 'activeElement', { value: document.body, configurable: true });

        const wrapped = withCursorPreservation(jest.fn());
        wrapped(event);
        rafCallback!(0);

        expect(target.setSelectionRange).not.toHaveBeenCalled();
    });

    it('should default selectionStart/end to 0 when null', () => {
        const target = {
            selectionStart: null,
            selectionEnd: null,
            setSelectionRange: jest.fn(),
        } as unknown as HTMLInputElement;
        const event = { target } as React.ChangeEvent<HTMLInputElement>;

        Object.defineProperty(document, 'activeElement', { value: target, configurable: true });

        const wrapped = withCursorPreservation(jest.fn());
        wrapped(event);
        rafCallback!(0);

        expect(target.setSelectionRange).toHaveBeenCalledWith(0, 0);
    });

    it('should swallow errors thrown by setSelectionRange', () => {
        const target = {
            selectionStart: 1,
            selectionEnd: 3,
            setSelectionRange: jest.fn(() => { throw new Error('not supported'); }),
        } as unknown as HTMLInputElement;
        const event = { target } as React.ChangeEvent<HTMLInputElement>;

        Object.defineProperty(document, 'activeElement', { value: target, configurable: true });

        const wrapped = withCursorPreservation(jest.fn());
        wrapped(event);

        expect(() => rafCallback!(0)).not.toThrow();
    });
});
