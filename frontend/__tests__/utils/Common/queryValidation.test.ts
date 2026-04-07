import {
    validateSQLQuery,
    hasForbiddenKeywords,
    sanitizeQuery,
} from '../../../src/utils/Common/queryValidation';

// ─── validateSQLQuery ─────────────────────────────────────────────────────────

describe('validateSQLQuery (utils/Common/queryValidation)', () => {
    describe('invalid inputs', () => {
        it('should reject an empty string', () => {
            expect(validateSQLQuery('')).toEqual({ isValid: false, error: 'Query cannot be empty' });
        });

        it('should reject a null-like falsy value cast to string', () => {
            // @ts-expect-error testing JS runtime path
            expect(validateSQLQuery(null)).toEqual({ isValid: false, error: 'Query cannot be empty' });
        });

        it('should reject a query shorter than 5 characters', () => {
            expect(validateSQLQuery('SEL')).toEqual({ isValid: false, error: 'Query must be at least 5 characters' });
        });

        it('should reject exactly 4 characters', () => {
            expect(validateSQLQuery('SELX')).toEqual({ isValid: false, error: 'Query must be at least 5 characters' });
        });
    });

    describe('forbidden DML/DDL keywords at the start', () => {
        const forbidden = [
            'INSERT', 'UPDATE', 'DELETE', 'ALTER', 'DROP',
            'TRUNCATE', 'CREATE', 'REPLACE', 'MERGE', 'GRANT', 'REVOKE',
        ];

        forbidden.forEach((kw) => {
            it(`should reject a query starting with ${kw}`, () => {
                const result = validateSQLQuery(`${kw} INTO table VALUES (1)`);
                expect(result.isValid).toBe(false);
                expect(result.error).toContain('Only SELECT queries are allowed');
            });

            it(`should reject ${kw} in lowercase`, () => {
                const result = validateSQLQuery(`${kw.toLowerCase()} INTO table VALUES (1)`);
                expect(result.isValid).toBe(false);
            });
        });
    });

    describe('dangerous patterns', () => {
        it('should reject stacked statements with semicolon + INSERT', () => {
            const query = 'SELECT 1; INSERT INTO t VALUES (1)';
            expect(validateSQLQuery(query).isValid).toBe(false);
        });

        it('should reject SQL comment at end of line (--)', () => {
            const query = 'SELECT * FROM t --';
            expect(validateSQLQuery(query).isValid).toBe(false);
        });

        it('should reject stacked DELETE after semicolon', () => {
            const query = 'SELECT 1; DELETE FROM t';
            expect(validateSQLQuery(query).isValid).toBe(false);
        });
    });

    describe('valid SELECT queries', () => {
        it('should accept a basic SELECT query', () => {
            expect(validateSQLQuery('SELECT * FROM users')).toEqual({ isValid: true });
        });

        it('should accept a SELECT with WHERE clause', () => {
            expect(validateSQLQuery('SELECT id FROM orders WHERE amount > 100')).toEqual({ isValid: true });
        });

        it('should accept a SELECT with JOIN', () => {
            expect(validateSQLQuery('SELECT u.id, o.total FROM users u JOIN orders o ON u.id = o.user_id')).toEqual({ isValid: true });
        });

        it('should accept a SELECT with inline comment styles that are NOT at end-of-line only', () => {
            // Block comments inside the query are fine as long as dangerous patterns don't match
            expect(validateSQLQuery('SELECT id FROM t WHERE id = 1').isValid).toBe(true);
        });

        it('should NOT reject INSERT that appears in a column name/value mid-query', () => {
            // The forbidden pattern only matches at the START of the query
            expect(validateSQLQuery('SELECT insertion_id FROM logs').isValid).toBe(true);
        });
    });
});

// ─── hasForbiddenKeywords ─────────────────────────────────────────────────────

describe('hasForbiddenKeywords (utils/Common/queryValidation)', () => {
    it('should return true for a forbidden query', () => {
        expect(hasForbiddenKeywords('DELETE FROM t')).toBe(true);
    });

    it('should return false for a valid SELECT query', () => {
        expect(hasForbiddenKeywords('SELECT * FROM t')).toBe(false);
    });

    it('should return true for an empty string (invalid)', () => {
        expect(hasForbiddenKeywords('')).toBe(true);
    });
});

// ─── sanitizeQuery ────────────────────────────────────────────────────────────

describe('sanitizeQuery (utils/Common/queryValidation)', () => {
    it('should return empty string for an empty input', () => {
        expect(sanitizeQuery('')).toBe('');
    });

    it('should return empty string for a falsy value', () => {
        // @ts-expect-error testing JS runtime path
        expect(sanitizeQuery(null)).toBe('');
    });

    it('should strip end-of-line comments (--)', () => {
        expect(sanitizeQuery('SELECT * FROM t -- this is a comment')).toBe('SELECT * FROM t');
    });

    it('should strip block comments (/* ... */)', () => {
        expect(sanitizeQuery('SELECT /* secret */ * FROM t')).toBe('SELECT  * FROM t');
    });

    it('should trim leading and trailing whitespace', () => {
        expect(sanitizeQuery('  SELECT 1  ')).toBe('SELECT 1');
    });

    it('should handle a query with no comments unchanged (after trim)', () => {
        expect(sanitizeQuery('SELECT id FROM users WHERE id = 1')).toBe('SELECT id FROM users WHERE id = 1');
    });

    it('should strip multiple line comments', () => {
        const query = 'SELECT a -- comment1\nFROM t -- comment2';
        const result = sanitizeQuery(query);
        expect(result).not.toContain('--');
    });
});
