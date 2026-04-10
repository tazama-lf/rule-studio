// extractQueryParameters.ts encrypts its output with CryptoJS.
// We decrypt results using the same key ('test-crypto-key') to verify the query text.
import CryptoJS from 'crypto-js';

const CRYPTO_KEY = 'test-crypto-key';

const decryptResult = (encrypted: string): string => {
    const bytes = CryptoJS.AES.decrypt(encrypted, CRYPTO_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
};

import { extractQueryParameters } from '../../../src/utils/Common/extractQueryParameters';

type VariableData = Parameters<typeof extractQueryParameters>[1];

describe('extractQueryParameters (utils/Common/extractQueryParameters)', () => {
    describe('empty / invalid query', () => {
        it('should return an encrypted empty string for an empty query', () => {
            const result = extractQueryParameters('', {});
            expect(decryptResult(result)).toBe('');
        });

        it('should return an encrypted empty string for a non-string query', () => {
            // @ts-expect-error testing runtime path
            const result = extractQueryParameters(null, {});
            expect(decryptResult(result)).toBe('');
        });
    });

    describe('query without placeholders', () => {
        it('should encrypt and return the query unchanged when no {{ }} present', () => {
            const query = 'SELECT * FROM users WHERE id = 1';
            const result = extractQueryParameters(query, {});
            expect(decryptResult(result)).toBe(query);
        });
    });

    describe('query with placeholders', () => {
        const variableData: VariableData = {
            ruleRequestTree: [
                { path: 'transaction.amount', value: 500 },
                { path: 'transaction.currency', value: 'USD' },
                { path: 'transaction.active', value: true },
                { path: 'transaction.nullField', value: null },
                { path: 'transaction.name', value: 'Alice' },
            ],
            ruleConfigTree: [
                { path: 'config.threshold', value: '100' },
            ],
        };

        it('should replace a numeric placeholder', () => {
            const query = 'SELECT * FROM t WHERE amount = {{ transaction.amount }}';
            const result = decryptResult(extractQueryParameters(query, variableData));
            expect(result).toContain('500');
        });

        it('should replace a string placeholder with single-quoted value', () => {
            const query = "SELECT * FROM t WHERE currency = {{ transaction.currency }}";
            const result = decryptResult(extractQueryParameters(query, variableData));
            expect(result).toContain("'USD'");
        });

        it('should replace a boolean placeholder with TRUE', () => {
            const query = 'SELECT * FROM t WHERE active = {{ transaction.active }}';
            const result = decryptResult(extractQueryParameters(query, variableData));
            expect(result).toContain('TRUE');
        });

        it('should replace a null placeholder with NULL', () => {
            const query = 'SELECT * FROM t WHERE field = {{ transaction.nullField }}';
            const result = decryptResult(extractQueryParameters(query, variableData));
            expect(result).toContain('NULL');
        });

        it('should leave unresolved placeholders as-is in the output', () => {
            const query = 'SELECT * FROM t WHERE x = {{ unknown.var }}';
            const result = decryptResult(extractQueryParameters(query, variableData));
            // The placeholder is not resolved — the original text remains
            expect(result).toContain('{{ unknown.var }}');
        });

        it('should replace multiple different placeholders in one query', () => {
            const query = 'SELECT * FROM t WHERE amount = {{ transaction.amount }} AND currency = {{ transaction.currency }}';
            const result = decryptResult(extractQueryParameters(query, variableData));
            expect(result).toContain('500');
            expect(result).toContain("'USD'");
        });

        it('should normalise whitespace (collapse newlines to spaces) when placeholders are present', () => {
            // Whitespace normalisation only runs when the query contains {{ }} placeholders
            const query = 'SELECT *\nFROM t\nWHERE amount = {{ transaction.amount }}';
            const result = decryptResult(extractQueryParameters(query, variableData));
            expect(result).not.toContain('\n');
            expect(result).toContain('500');
        });
    });

    describe('skip placeholder values', () => {
        it('should skip values that are angle-bracket placeholders like <string>', () => {
            const data: VariableData = {
                ruleRequestTree: [{ path: 'x', value: '<string>' }],
            };
            const query = 'SELECT * FROM t WHERE x = {{ x }}';
            const result = decryptResult(extractQueryParameters(query, data));
            // The value is skipped so the placeholder stays
            expect(result).toContain('{{ x }}');
        });

        it('should skip values that are "{ }"', () => {
            const data: VariableData = {
                ruleRequestTree: [{ path: 'obj', value: '{ }' }],
            };
            const query = 'SELECT * FROM t WHERE obj = {{ obj }}';
            const result = decryptResult(extractQueryParameters(query, data));
            expect(result).toContain('{{ obj }}');
        });
    });

    describe('nested trees', () => {
        it('should extract values from ruleResultTree', () => {
            const data: VariableData = {
                ruleResultTree: [{ path: 'result.score', value: 99 }],
            };
            const query = 'SELECT * FROM t WHERE score = {{ result.score }}';
            const result = decryptResult(extractQueryParameters(query, data));
            expect(result).toContain('99');
        });

        it('should extract values from loopVarsTree', () => {
            const data: VariableData = {
                loopVarsTree: [{ path: 'loop.index', value: 7 }],
            };
            const query = 'SELECT * FROM t WHERE idx = {{ loop.index }}';
            const result = decryptResult(extractQueryParameters(query, data));
            expect(result).toContain('7');
        });

        it('should extract values from localVarsTree', () => {
            const data: VariableData = {
                localVarsTree: [{ path: 'local.flag', value: false }],
            };
            const query = 'SELECT * FROM t WHERE flag = {{ local.flag }}';
            const result = decryptResult(extractQueryParameters(query, data));
            expect(result).toContain('FALSE');
        });

        it('should recurse into children nodes', () => {
            const data: VariableData = {
                ruleRequestTree: [
                    {
                        path: 'parent',
                        value: '<object>',
                        children: [{ path: 'parent.child', value: 'deep-val' }],
                    },
                ],
            };
            const query = 'SELECT * FROM t WHERE x = {{ parent.child }}';
            const result = decryptResult(extractQueryParameters(query, data));
            expect(result).toContain("'deep-val'");
        });
    });

    // ─── resolveValue: value itself contains a {{ }} template ───────────────────

    describe('value-in-value template resolution (resolveValue inner branch)', () => {
        it('should resolve a value that is itself a template reference to another variable', () => {
            const data: VariableData = {
                ruleRequestTree: [
                    { path: 'a', value: '{{ b }}' },
                    { path: 'b', value: 'resolved-b' },
                ],
            };
            const query = 'SELECT * FROM t WHERE x = {{ a }}';
            const result = decryptResult(extractQueryParameters(query, data));
            expect(result).toContain("'resolved-b'");
        });

        it('should detect circular reference inside resolveValue and keep the placeholder', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            const data: VariableData = {
                ruleRequestTree: [{ path: 'a', value: '{{ a }}' }], // self-referential
            };
            const query = 'SELECT * FROM t WHERE x = {{ a }}';
            const result = decryptResult(extractQueryParameters(query, data));
            expect(result).toContain('{{ a }}');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Circular reference'));
            consoleSpy.mockRestore();
        });

        it('should JSON-stringify an object resolved within a template-in-value chain', () => {
            const data: VariableData = {
                ruleRequestTree: [
                    { path: 'a', value: '{{ obj }}' },
                    { path: 'obj', value: { x: 1, y: 'hello' } },
                ],
            };
            const query = 'SELECT * FROM t WHERE x = {{ a }}';
            const result = decryptResult(extractQueryParameters(query, data));
            expect(result).toContain('"x":1');
        });

        it('should return the outer placeholder when inner template resolves to null', () => {
            const data: VariableData = {
                ruleRequestTree: [
                    { path: 'a', value: '{{ null_val }}' },
                    { path: 'null_val', value: null },
                ],
            };
            const query = 'SELECT * FROM t WHERE x = {{ a }}';
            const result = decryptResult(extractQueryParameters(query, data));
            // null → returns match inside resolveValue → resolvedValue still has {{ }} → skip
            expect(result).toContain('{{ a }}');
        });

        it('should skip replacement when resolved string value still contains {{ }}', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            // 'a' maps to '{{ nonexistent }}'; resolveValue can't resolve nonexistent → returns it as-is
            const data: VariableData = {
                ruleRequestTree: [{ path: 'a', value: '{{ nonexistent }}' }],
            };
            const query = 'SELECT * FROM t WHERE x = {{ a }}';
            const result = decryptResult(extractQueryParameters(query, data));
            expect(result).toContain('{{ a }}');
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unresolved template'));
            consoleSpy.mockRestore();
        });
    });

    // ─── already-quoted string values ────────────────────────────────────────────

    describe('already-quoted string values', () => {
        it('should use a single-quoted string value as-is without adding extra quotes', () => {
            const data: VariableData = {
                ruleRequestTree: [{ path: 'q', value: "'pre-quoted'" }],
            };
            const query = 'SELECT * FROM t WHERE x = {{ q }}';
            const result = decryptResult(extractQueryParameters(query, data));
            expect(result).toContain("'pre-quoted'");
            expect(result).not.toContain("''pre-quoted''");
        });

        it('should use a double-quoted string value as-is', () => {
            const data: VariableData = {
                ruleRequestTree: [{ path: 'q', value: '"double-quoted"' }],
            };
            const query = 'SELECT * FROM t WHERE x = {{ q }}';
            const result = decryptResult(extractQueryParameters(query, data));
            expect(result).toContain('"double-quoted"');
        });
    });

    // ─── object rawValue serialization ───────────────────────────────────────────

    describe('object rawValue serialization', () => {
        it('should JSON-stringify a plain object value and wrap it in single quotes', () => {
            const data: VariableData = {
                ruleRequestTree: [{ path: 'myObj', value: { x: 1, y: 'hello' } }],
            };
            const query = 'SELECT * FROM t WHERE obj = {{ myObj }}';
            const result = decryptResult(extractQueryParameters(query, data));
            expect(result).toContain('"x":1');
        });

        it('should escape single quotes in JSON when serializing an object', () => {
            const data: VariableData = {
                ruleRequestTree: [{ path: 'myObj', value: { name: "O'Brien" } }],
            };
            const query = 'SELECT * FROM t WHERE obj = {{ myObj }}';
            const result = decryptResult(extractQueryParameters(query, data));
            // The single quote in O'Brien must be escaped to '' in the SQL string literal
            expect(result).toContain("''");
        });
    });

    // ─── max recursion depth protection ─────────────────────────────────────────

    describe('max recursion depth protection (depth > 10)', () => {
        it('should warn and stop recursion when chain depth exceeds 10 levels', () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
            // v0→{{ v1 }}, v1→{{ v2 }}, ..., v11→{{ v12 }}: chain of 12 nodes forces depth=11
            const nodes = Array.from({ length: 12 }, (_, i) => ({
                path: `v${i}`,
                value: `{{ v${i + 1} }}`,
            }));
            const data: VariableData = { ruleRequestTree: nodes };
            const query = 'SELECT * FROM t WHERE x = {{ v0 }}';
            expect(() => extractQueryParameters(query, data)).not.toThrow();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Max recursion depth')
            );
            consoleSpy.mockRestore();
        });
    });
});
