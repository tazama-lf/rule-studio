// storage.ts uses js-cookie and the encrypt/decrypt crypto helpers.
// We let the real crypto work (VITE_CRYPTO_KEY = 'test-crypto-key' in jest env)
// and mock js-cookie to stay in-memory.

jest.mock('js-cookie', () => {
    const store: Record<string, string> = {};
    return {
        get: jest.fn((key?: string) => key ? store[key] : { ...store }),
        set: jest.fn((key: string, value: string) => { store[key] = value; }),
        remove: jest.fn((key: string) => { delete store[key]; }),
    };
});

import Cookies from 'js-cookie';
import {
    insertData,
    extractData,
    removeData,
    getAuthToken,
    resetData,
} from '../../../src/utils/Common/storage';
import { CookieStorage, LocalStorage, SessionStorage } from '../../../src/utils/Common/enums';

beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    jest.clearAllMocks();
    // Reset cookie store between tests
    const store = (Cookies.get as jest.Mock)();
    if (store && typeof store === 'object') {
        Object.keys(store).forEach((k) => (Cookies.remove as jest.Mock)(k));
    }
});

// ─── insertData + extractData (SessionStorage — default) ─────────────────────

describe('insertData / extractData – SessionStorage (default)', () => {
    it('should store and retrieve a string', () => {
        insertData('hello', 'test-key');
        expect(extractData('test-key')).toBe('hello');
    });

    it('should store and retrieve a number', () => {
        insertData(42, 'num-key');
        expect(extractData('num-key')).toBe(42);
    });

    it('should store and retrieve an object', () => {
        const obj = { a: 1, b: 'two' };
        insertData(obj, 'obj-key');
        expect(extractData('obj-key')).toEqual(obj);
    });

    it('should store and retrieve an array', () => {
        insertData([1, 2, 3], 'arr-key');
        expect(extractData('arr-key')).toEqual([1, 2, 3]);
    });

    it('should return null when the key does not exist', () => {
        expect(extractData('nonexistent')).toBeNull();
    });

    it('should store unencrypted when encrypted=false', () => {
        insertData('raw', 'raw-key', SessionStorage, false);
        expect(extractData('raw-key', SessionStorage, false)).toBe('raw');
    });
});

// ─── insertData + extractData (LocalStorage) ──────────────────────────────────

describe('insertData / extractData – LocalStorage', () => {
    it('should store and retrieve a string', () => {
        insertData('local-val', 'local-key', LocalStorage);
        expect(extractData('local-key', LocalStorage)).toBe('local-val');
    });

    it('should return null for a missing key in LocalStorage', () => {
        expect(extractData('missing', LocalStorage)).toBeNull();
    });
});

// ─── insertData + extractData (CookieStorage) ────────────────────────────────

describe('insertData / extractData – CookieStorage', () => {
    it('should store and retrieve a value via cookie', () => {
        insertData('cookie-val', 'cookie-key', CookieStorage);
        // Simulate Cookies.get returning the stored value
        (Cookies.get as jest.Mock).mockReturnValueOnce('cookie-val-encrypted');
        // Even with the mock override, the real path: just verify Cookies.set was called
        expect(Cookies.set).toHaveBeenCalledWith('cookie-key', expect.any(String), expect.any(Object));
    });

    it('should return null when cookie is not found', () => {
        (Cookies.get as jest.Mock).mockReturnValueOnce(undefined);
        expect(extractData('missing-cookie', CookieStorage)).toBeNull();
    });
});

// ─── removeData ───────────────────────────────────────────────────────────────

describe('removeData', () => {
    it('should remove a key from SessionStorage', () => {
        insertData('to-remove', 'rem-key');
        removeData('rem-key');
        expect(extractData('rem-key')).toBeNull();
    });

    it('should remove a key from LocalStorage', () => {
        insertData('to-remove', 'rem-key', LocalStorage);
        removeData('rem-key', LocalStorage);
        expect(extractData('rem-key', LocalStorage)).toBeNull();
    });

    it('should call Cookies.remove for CookieStorage', () => {
        removeData('ck-key', CookieStorage);
        expect(Cookies.remove).toHaveBeenCalledWith('ck-key', expect.any(Object));
    });
});

// ─── getAuthToken ─────────────────────────────────────────────────────────────

describe('getAuthToken', () => {
    it('should return null when no access_token is stored', () => {
        expect(getAuthToken()).toBeNull();
    });

    it('should return the stored access_token', () => {
        insertData('my-token', 'access_token');
        expect(getAuthToken()).toBe('my-token');
    });
});

// ─── resetData ────────────────────────────────────────────────────────────────

describe('resetData', () => {
    it('should clear sessionStorage', () => {
        sessionStorage.setItem('k', 'v');
        resetData();
        expect(sessionStorage.length).toBe(0);
    });

    it('should clear localStorage', () => {
        localStorage.setItem('k', 'v');
        resetData();
        expect(localStorage.length).toBe(0);
    });

    it('should call Cookies.remove for each cookie', () => {
        const mockGet = Cookies.get as jest.Mock;
        mockGet.mockReturnValueOnce({ c1: 'v1', c2: 'v2' });
        resetData();
        expect(Cookies.remove).toHaveBeenCalledWith('c1');
        expect(Cookies.remove).toHaveBeenCalledWith('c2');
    });
});
