import { executeConfiguredFunctions, escapeSqlString } from 'src/utils/execute-functions.util';

describe('execute-functions.util', () => {
  describe('escapeSqlString', () => {
    it('returns the inner content without surrounding quotes', () => {
      expect(escapeSqlString('plain')).toBe('plain');
    });

    it("doubles single quotes inside faker-style names like O'Brien", () => {
      expect(escapeSqlString("O'Brien")).toBe("O''Brien");
    });

    it('returns empty string for null and undefined', () => {
      expect(escapeSqlString(null)).toBe('');
      expect(escapeSqlString(undefined)).toBe('');
    });

    it('coerces non-strings via String()', () => {
      expect(escapeSqlString(42)).toBe('42');
    });
  });

  describe('executeConfiguredFunctions — SQL quoting', () => {
    const baseTxn = { source: 'src', destination: 'dst' } as any;

    it('produces SQL with a single set of quotes per value (regression: no double-wrapping)', () => {
      const sql = executeConfiguredFunctions(
        {},
        [],
        [{ functionName: 'addAccount', params: ['ACC-1', 'TENANT-1', '2026-06-19T00:00:00Z'] }],
        baseTxn,
      );

      // Regression check: previous bug emitted VALUES (''ACC-1'', ''TENANT-1'', ...)
      expect(sql).not.toMatch(/VALUES \(''/);
      expect(sql).toContain("VALUES ('ACC-1', 'TENANT-1', '2026-06-19T00:00:00Z')");
    });

    it("escapes apostrophes in faker-name semantic values (e.g. O'Brien) without breaking SQL", () => {
      const sql = executeConfiguredFunctions(
        {},
        [],
        [
          {
            functionName: 'addAccountHolder',
            params: ["O'Brien", "D'Angelo", '2026-06-19T00:00:00Z', 'TENANT-1'],
          },
        ],
        baseTxn,
      );

      // Apostrophes must be doubled inside a single pair of surrounding quotes.
      expect(sql).toContain("'O''Brien'");
      expect(sql).toContain("'D''Angelo'");
      // And the broken empty-string pattern must not appear.
      expect(sql).not.toMatch(/''O''/);
    });

    it('rejects function names not on the allow-list', () => {
      expect(() =>
        executeConfiguredFunctions({}, [], [{ functionName: 'dropTable', params: [] }], baseTxn),
      ).toThrow(/not in the allowed functions list/);
    });
  });
});
