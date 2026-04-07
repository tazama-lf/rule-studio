import {
    isQueryExecutionError,
    extractErrorMessage,
} from '../../src/types/queryExecution';

// ─── isQueryExecutionError ────────────────────────────────────────────────────

describe('isQueryExecutionError', () => {
    describe('returns true', () => {
        it('should return true for a well-formed error object with only message', () => {
            expect(isQueryExecutionError({ data: { message: 'failed' } })).toBe(true);
        });

        it('should return true when data also has an optional code', () => {
            expect(isQueryExecutionError({ data: { message: 'err', code: 'E001' } })).toBe(true);
        });

        it('should return true when data also has optional details', () => {
            expect(isQueryExecutionError({ data: { message: 'err', details: 'some detail' } })).toBe(true);
        });

        it('should return true when data has all optional fields', () => {
            expect(
                isQueryExecutionError({ data: { message: 'err', code: 'E1', details: 'd' } })
            ).toBe(true);
        });

        it('should return true when message is an empty string', () => {
            expect(isQueryExecutionError({ data: { message: '' } })).toBe(true);
        });
    });

    describe('returns false for non-object inputs', () => {
        it('should return false for null', () => {
            expect(isQueryExecutionError(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(isQueryExecutionError(undefined)).toBe(false);
        });

        it('should return false for a string', () => {
            expect(isQueryExecutionError('error string')).toBe(false);
        });

        it('should return false for a number', () => {
            expect(isQueryExecutionError(42)).toBe(false);
        });

        it('should return false for a boolean', () => {
            expect(isQueryExecutionError(true)).toBe(false);
        });
    });

    describe('returns false for malformed objects', () => {
        it('should return false when the "data" key is missing', () => {
            expect(isQueryExecutionError({ message: 'no data wrapper' })).toBe(false);
        });

        it('should return false when data is null', () => {
            expect(isQueryExecutionError({ data: null })).toBe(false);
        });

        it('should return false when data is a string', () => {
            expect(isQueryExecutionError({ data: 'string data' })).toBe(false);
        });

        it('should return false when data is a number', () => {
            expect(isQueryExecutionError({ data: 123 })).toBe(false);
        });

        it('should return false when data is an array', () => {
            expect(isQueryExecutionError({ data: ['message'] })).toBe(false);
        });

        it('should return false when data object has no "message" field', () => {
            expect(isQueryExecutionError({ data: { code: 'E1' } })).toBe(false);
        });

        it('should return false for an empty object', () => {
            expect(isQueryExecutionError({})).toBe(false);
        });

        it('should return false for an object with an empty data object', () => {
            expect(isQueryExecutionError({ data: {} })).toBe(false);
        });
    });
});

// ─── extractErrorMessage ──────────────────────────────────────────────────────

describe('extractErrorMessage', () => {
    describe('QueryExecutionError-shaped input', () => {
        it('should return the data.message when the error is a QueryExecutionError', () => {
            const error = { data: { message: 'DB connection failed' } };
            expect(extractErrorMessage(error)).toBe('DB connection failed');
        });

        it('should return the data.message even when code and details are present', () => {
            const error = { data: { message: 'Query timeout', code: 'E002', details: 'details' } };
            expect(extractErrorMessage(error)).toBe('Query timeout');
        });
    });

    describe('Error instance input', () => {
        it('should return error.message for a native Error', () => {
            const error = new Error('Something broke');
            expect(extractErrorMessage(error)).toBe('Something broke');
        });

        it('should return error.message for a TypeError', () => {
            const error = new TypeError('Type mismatch');
            expect(extractErrorMessage(error)).toBe('Type mismatch');
        });

        it('should return error.message for a RangeError', () => {
            const error = new RangeError('Out of range');
            expect(extractErrorMessage(error)).toBe('Out of range');
        });
    });

    describe('string input', () => {
        it('should return the string directly', () => {
            expect(extractErrorMessage('plain error string')).toBe('plain error string');
        });

        it('should return an empty string when input is an empty string', () => {
            expect(extractErrorMessage('')).toBe('');
        });
    });

    describe('fallback for unrecognised input', () => {
        it('should return the default fallback for null', () => {
            expect(extractErrorMessage(null)).toBe('An unexpected error occurred');
        });

        it('should return the default fallback for undefined', () => {
            expect(extractErrorMessage(undefined)).toBe('An unexpected error occurred');
        });

        it('should return the default fallback for a number', () => {
            expect(extractErrorMessage(42)).toBe('An unexpected error occurred');
        });

        it('should return the default fallback for a boolean', () => {
            expect(extractErrorMessage(true)).toBe('An unexpected error occurred');
        });

        it('should return the default fallback for a plain object without the expected shape', () => {
            expect(extractErrorMessage({ status: 500 })).toBe('An unexpected error occurred');
        });

        it('should return a custom fallback when provided', () => {
            expect(extractErrorMessage(null, 'Custom fallback message')).toBe('Custom fallback message');
        });

        it('should return a custom fallback for an unrecognised number', () => {
            expect(extractErrorMessage(0, 'My fallback')).toBe('My fallback');
        });
    });

    describe('priority order of checks', () => {
        it('should prefer QueryExecutionError check over Error instance', () => {
            // An object with data.message that is NOT an Error instance
            const error = { data: { message: 'from data.message' } };
            expect(extractErrorMessage(error)).toBe('from data.message');
        });

        it('should prefer Error instance over string return path', () => {
            // Error.message is a string, but it's handled by the Error instanceof branch
            const error = new Error('from Error instance');
            expect(extractErrorMessage(error)).toBe('from Error instance');
        });
    });
});
