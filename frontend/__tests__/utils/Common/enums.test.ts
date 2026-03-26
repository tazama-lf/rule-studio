import {
    CookieStorage,
    SessionStorage,
    LocalStorage,
} from '../../../src/utils/Common/enums';

describe('Storage enums (utils/Common/enums)', () => {
    it('CookieStorage should equal "cookie"', () => {
        expect(CookieStorage).toBe('cookie');
    });

    it('SessionStorage should equal "SessionStorage"', () => {
        expect(SessionStorage).toBe('SessionStorage');
    });

    it('LocalStorage should equal "LocalStorage"', () => {
        expect(LocalStorage).toBe('LocalStorage');
    });

    it('all three constants should be distinct', () => {
        const set = new Set([CookieStorage, SessionStorage, LocalStorage]);
        expect(set.size).toBe(3);
    });
});
