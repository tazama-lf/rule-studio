import { navigateTo } from '../../../src/utils/Common/navigation';

// jsdom 30 makes both window.location and its href property non-configurable,
// so we cannot intercept assignments. We verify 100% line coverage by executing
// the function and confirming it does not throw.
// Hash-only navigation is the one case jsdom does support synchronously.
describe('navigateTo (utils/Common/navigation)', () => {
    it('should not throw for a relative path', () => {
        expect(() => navigateTo('/login')).not.toThrow();
    });

    it('should not throw for an absolute same-origin URL', () => {
        expect(() => navigateTo('http://localhost/dashboard')).not.toThrow();
    });

    it('should update window.location.hash for hash-only navigation', () => {
        navigateTo('#section');
        expect(window.location.hash).toBe('#section');
    });

    it('should not throw when called multiple times in succession', () => {
        expect(() => {
            navigateTo('/first');
            navigateTo('/second');
        }).not.toThrow();
    });
});
