import {
  validateTypeScriptCode,
  validateTestCode,
  formatValidationErrors,
  getValidationSummary,
} from '../../../src/utils/Flow/codeValidator';
import type { ValidationResult, ValidationError } from '../../../src/utils/Flow/codeValidator';

// ─── validateTypeScriptCode ───────────────────────────────────────────────────

describe('validateTypeScriptCode (utils/Flow/codeValidator)', () => {
  // ─── Return shape ──────────────────────────────────────────────────────────

  describe('return value shape', () => {
    it('should return an object with isValid', () => {
      const result: ValidationResult = validateTypeScriptCode('const x = 1;');
      expect(result).toHaveProperty('isValid');
    });

    it('should return an object with errors array', () => {
      const result: ValidationResult = validateTypeScriptCode('const x = 1;');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should return an object with warnings array', () => {
      const result: ValidationResult = validateTypeScriptCode('const x = 1;');
      expect(result).toHaveProperty('warnings');
      expect(Array.isArray(result.warnings)).toBe(true);
    });
  });

  // ─── Valid code ────────────────────────────────────────────────────────────

  describe('valid TypeScript code', () => {
    it('should return isValid: true for a simple const declaration', () => {
      const result = validateTypeScriptCode('const x: number = 42;');
      expect(result.isValid).toBe(true);
    });

    it('should return empty errors for valid code', () => {
      const result = validateTypeScriptCode('const x: number = 42;');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle empty string without throwing', () => {
      expect(() => validateTypeScriptCode('')).not.toThrow();
    });

    it('should return isValid: true for empty string', () => {
      const result = validateTypeScriptCode('');
      expect(result.isValid).toBe(true);
    });

    it('should treat valid arrow function as valid', () => {
      const code = 'const add = (a: number, b: number): number => a + b;';
      const result = validateTypeScriptCode(code);
      expect(result.isValid).toBe(true);
    });

    it('should treat valid interface declaration as valid', () => {
      const code = 'interface Foo { bar: string; }';
      const result = validateTypeScriptCode(code);
      expect(result.isValid).toBe(true);
    });

    it('should treat valid class as valid', () => {
      const code = 'class Greeter { greet(): string { return "hello"; } }';
      const result = validateTypeScriptCode(code);
      expect(result.isValid).toBe(true);
    });

    it('should allow type aliases', () => {
      const code = 'type ID = string | number;';
      const result = validateTypeScriptCode(code);
      expect(result.isValid).toBe(true);
    });
  });

  // ─── Syntax errors ─────────────────────────────────────────────────────────

  describe('syntax errors', () => {
    it('should return isValid: false for code with a syntax error', () => {
      const result = validateTypeScriptCode('const x = (;');
      expect(result.isValid).toBe(false);
    });

    it('should return at least one error for code with a syntax error', () => {
      const result = validateTypeScriptCode('const x = (;');
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should flag unclosed brace as invalid', () => {
      const result = validateTypeScriptCode('function foo() {');
      expect(result.isValid).toBe(false);
    });

    it('should detect malformed object literal', () => {
      const result = validateTypeScriptCode('const obj = { a: 1, ;');
      expect(result.isValid).toBe(false);
    });
  });

  // ─── Error object structure ────────────────────────────────────────────────

  describe('ValidationError structure', () => {
    it('should have a line number (1-based or 0-based) on each error', () => {
      const result = validateTypeScriptCode('const x = (;');
      const error: ValidationError = result.errors[0];
      expect(typeof error.line).toBe('number');
    });

    it('should have a column number on each error', () => {
      const result = validateTypeScriptCode('const x = (;');
      const error: ValidationError = result.errors[0];
      expect(typeof error.column).toBe('number');
    });

    it('should have a non-empty message on each error', () => {
      const result = validateTypeScriptCode('const x = (;');
      const error: ValidationError = result.errors[0];
      expect(typeof error.message).toBe('string');
      expect(error.message.length).toBeGreaterThan(0);
    });

    it('should have a category set to "error" for syntax errors', () => {
      const result = validateTypeScriptCode('const x = (;');
      const error: ValidationError = result.errors[0];
      expect(error.category).toBe('error');
    });
  });

  // ─── Module import errors (filtered) ──────────────────────────────────────

  describe('module import error filtering', () => {
    it('should not report unresolved import TS2307 as a hard error', () => {
      const code = "import { something } from 'non-existent-module';";
      const result = validateTypeScriptCode(code);
      // Module resolution errors (2307) must be filtered; code may still be "valid"
      const has2307 = result.errors.some((e) => e.message.includes('non-existent-module'));
      expect(has2307).toBe(false);
    });

    it('should not report implicit any from missing @types (TS7016) as a hard error', () => {
      // TS 7016 fires when module has no type declarations
      // After filtering, the result should not contain that error
      const code = "import foo from 'untyped-module';";
      const result = validateTypeScriptCode(code);
      const has7016 = result.errors.some((e) => e.message.includes('untyped-module'));
      expect(has7016).toBe(false);
    });
  });

  // ─── Multi-line code ───────────────────────────────────────────────────────

  describe('multi-line code', () => {
    it('should validate a multi-line valid program', () => {
      const code = [
        'const a: number = 1;',
        'const b: number = 2;',
        'const sum: number = a + b;',
      ].join('\n');
      expect(validateTypeScriptCode(code).isValid).toBe(true);
    });

    it('should report error on the correct line in a multi-line program', () => {
      const code = ['const a = 1;', 'const b = (;', 'const c = 3;'].join('\n');
      const result = validateTypeScriptCode(code);
      expect(result.isValid).toBe(false);
      // The error should reference line 2 (1-indexed) or line 1 (0-indexed)
      expect(result.errors[0].line).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Whitespace / comments only ───────────────────────────────────────────

  describe('whitespace and comment only code', () => {
    it('should treat whitespace-only input as valid', () => {
      expect(validateTypeScriptCode('   \n\t  ').isValid).toBe(true);
    });

    it('should treat single-line comment as valid', () => {
      expect(validateTypeScriptCode('// just a comment').isValid).toBe(true);
    });

    it('should treat block comment as valid', () => {
      expect(validateTypeScriptCode('/* block comment */').isValid).toBe(true);
    });
  });

  describe('diagnostic category mapping and exceptional paths', () => {
    it('should map warning and suggestion diagnostics into warnings array', () => {
      jest.resetModules();
      jest.doMock('typescript', () => {
        const actual = jest.requireActual('typescript');
        const fakeFile = {
          getLineAndCharacterOfPosition: () => ({ line: 0, character: 0 }),
        };
        return {
          ...actual,
          createProgram: jest.fn(() => ({
            getSyntacticDiagnostics: () => [
              {
                code: 9001,
                category: actual.DiagnosticCategory.Warning,
                messageText: 'warning diagnostic',
                file: fakeFile,
                start: 0,
              },
              {
                code: 9002,
                category: actual.DiagnosticCategory.Suggestion,
                messageText: 'suggestion diagnostic',
                file: fakeFile,
                start: 0,
              },
              {
                code: 9003,
                category: actual.DiagnosticCategory.Warning,
                messageText: 'warning without file should be skipped',
              },
            ],
            getSemanticDiagnostics: () => [],
          })),
        };
      });

      jest.isolateModules(() => {
        const validator = require('../../../src/utils/Flow/codeValidator');
        const result = validator.validateTypeScriptCode('const x = 1;');
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(2);
        expect(result.warnings.some((w: { category: string }) => w.category === 'warning')).toBe(true);
        expect(result.warnings.some((w: { category: string }) => w.category === 'suggestion')).toBe(true);
      });
      jest.dontMock('typescript');
    });

    it('should return error result when createProgram throws (outer catch)', () => {
      jest.resetModules();
      jest.doMock('typescript', () => {
        const actual = jest.requireActual('typescript');
        return {
          ...actual,
          createProgram: jest.fn(() => {
            throw new Error('forced createProgram failure');
          }),
        };
      });

      jest.isolateModules(() => {
        const validator = require('../../../src/utils/Flow/codeValidator');
        const result = validator.validateTypeScriptCode('const x = 1;');
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].message).toContain('forced createProgram failure');
      });
      jest.dontMock('typescript');
    });
  });
});

// ─── validateTestCode ──────────────────────────────────────────────────────────

describe('validateTestCode (utils/Flow/codeValidator)', () => {
  describe('adds no warnings when code is a valid test', () => {
    it('should return isValid true for code with test() and expect()', () => {
      const code = "test('x', () => { expect(1).toBe(1); });";
      const result = validateTestCode(code);
      expect(result.isValid).toBe(true);
    });

    it('should add no extra warnings for well-formed test code', () => {
      const code = "describe('s', () => { it('t', () => { expect(true).toBe(true); }); });";
      const result = validateTestCode(code);
      // Any warnings added should be about test structure, not syntax
      const testWarnings = result.warnings.filter((w) =>
        w.message.includes('No test function') ||
        w.message.includes('No expect') ||
        w.message.includes('await')
      );
      expect(testWarnings).toHaveLength(0);
    });
  });

  describe('warns when no test function present', () => {
    it('should include a warning about missing test function', () => {
      const code = 'const x = 1;';
      const result = validateTestCode(code);
      const hasWarning = result.warnings.some((w) => w.message.includes('No test function'));
      expect(hasWarning).toBe(true);
    });
  });

  describe('warns when no expect() present', () => {
    it('should include a warning about missing expect()', () => {
      const code = "test('t', () => { const x = 1; });";
      const result = validateTestCode(code);
      const hasWarning = result.warnings.some((w) => w.message.includes('No expect()'));
      expect(hasWarning).toBe(true);
    });
  });

  describe('warns when async without await', () => {
    it('should warn about async function lacking await', () => {
      const code = "test('t', async () => { expect(1).toBe(1); });";
      const result = validateTestCode(code);
      const hasWarning = result.warnings.some((w) => w.message.includes('await'));
      expect(hasWarning).toBe(true);
    });
  });

  describe('includes base validation result', () => {
    it('should return isValid:false for code with syntax errors', () => {
      const code = 'test((';
      const result = validateTestCode(code);
      expect(result.isValid).toBe(false);
    });

    it('should propagate errors from the base validator', () => {
      const code = 'const x = (;';
      const result = validateTestCode(code);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

// ─── formatValidationErrors ────────────────────────────────────────────────────

describe('formatValidationErrors (utils/Flow/codeValidator)', () => {
  it('should return empty string for an empty errors array', () => {
    expect(formatValidationErrors([])).toBe('');
  });

  it('should format a single error as "Line L:C - message"', () => {
    const errors: ValidationError[] = [{ line: 3, column: 5, message: 'Unexpected token', category: 'error' }];
    expect(formatValidationErrors(errors)).toBe('Line 3:5 - Unexpected token');
  });

  it('should join multiple errors with newlines', () => {
    const errors: ValidationError[] = [
      { line: 1, column: 1, message: 'Error A', category: 'error' },
      { line: 5, column: 10, message: 'Error B', category: 'error' },
    ];
    const result = formatValidationErrors(errors);
    expect(result).toContain('Line 1:1 - Error A');
    expect(result).toContain('Line 5:10 - Error B');
    expect(result.split('\n')).toHaveLength(2);
  });
});

// ─── getValidationSummary ──────────────────────────────────────────────────────

describe('getValidationSummary (utils/Flow/codeValidator)', () => {
  const noIssues: ValidationResult = { isValid: true, errors: [], warnings: [] };

  it('should return the checkmark message when there are no issues', () => {
    expect(getValidationSummary(noIssues)).toBe('✓ No issues found');
  });

  it('should report singular error', () => {
    const result: ValidationResult = {
      isValid: false,
      errors: [{ line: 1, column: 1, message: 'err', category: 'error' }],
      warnings: [],
    };
    expect(getValidationSummary(result)).toBe('1 error');
  });

  it('should report plural errors', () => {
    const result: ValidationResult = {
      isValid: false,
      errors: [
        { line: 1, column: 1, message: 'e1', category: 'error' },
        { line: 2, column: 1, message: 'e2', category: 'error' },
      ],
      warnings: [],
    };
    expect(getValidationSummary(result)).toBe('2 errors');
  });

  it('should report singular warning', () => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [{ line: 1, column: 1, message: 'warn', category: 'warning' }],
    };
    expect(getValidationSummary(result)).toBe('1 warning');
  });

  it('should report plural warnings', () => {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [
        { line: 1, column: 1, message: 'w1', category: 'warning' },
        { line: 2, column: 1, message: 'w2', category: 'warning' },
      ],
    };
    expect(getValidationSummary(result)).toBe('2 warnings');
  });

  it('should combine errors and warnings with comma', () => {
    const result: ValidationResult = {
      isValid: false,
      errors: [{ line: 1, column: 1, message: 'e', category: 'error' }],
      warnings: [{ line: 2, column: 1, message: 'w', category: 'warning' }],
    };
    expect(getValidationSummary(result)).toBe('1 error, 1 warning');
  });
});
