// crypto.ts uses VITE_CRYPTO_KEY via import.meta.env (transformed to 'test-crypto-key').
// Both encrypt and decrypt are tested against each other for a round-trip.

import { encrypt, decrypt } from '../../../src/utils/Common/crypto';

describe('encrypt / decrypt (utils/Common/crypto)', () => {
    describe('encrypt', () => {
        it('should return a non-empty string', () => {
            expect(typeof encrypt('hello')).toBe('string');
            expect(encrypt('hello').length).toBeGreaterThan(0);
        });

        it('should return different ciphertext for different inputs', () => {
            // AES-CBC uses a random IV, so even the same input may differ, but
            // different inputs always produce different cipher text in practice.
            const a = encrypt('foo');
            const b = encrypt('bar');
            expect(a).not.toBe(b);
        });

        it('should encrypt objects', () => {
            const obj = { key: 'value', num: 42 };
            const result = encrypt(obj);
            expect(typeof result).toBe('string');
            expect(result.length).toBeGreaterThan(0);
        });
    });

    describe('decrypt', () => {
        it('should round-trip a string', () => {
            const plaintext = 'hello world';
            expect(decrypt<string>(encrypt(plaintext))).toBe(plaintext);
        });

        it('should round-trip a number', () => {
            expect(decrypt<number>(encrypt(99))).toBe(99);
        });

        it('should round-trip an object', () => {
            const obj = { a: 1, b: 'test' };
            expect(decrypt<typeof obj>(encrypt(obj))).toEqual(obj);
        });

        it('should round-trip an array', () => {
            const arr = [1, 'two', 3];
            expect(decrypt<typeof arr>(encrypt(arr))).toEqual(arr);
        });

        it('should round-trip null', () => {
            expect(decrypt<null>(encrypt(null))).toBeNull();
        });

        it('should throw when given an invalid ciphertext', () => {
            expect(() => decrypt('not-valid-cipher')).toThrow();
        });
    });
});
