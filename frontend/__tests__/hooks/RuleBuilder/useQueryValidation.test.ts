import { renderHook, act } from '@testing-library/react';
import { useQueryValidation } from '../../../src/hooks/RuleBuilder/useQueryValidation';
import * as queryValidation from '../../../src/utils/Common/queryValidation';

jest.mock('../../../src/utils/Common/queryValidation');

const mockedQueryValidation = queryValidation as jest.Mocked<typeof queryValidation>;

describe('useQueryValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with null validation error', () => {
      mockedQueryValidation.validateSQLQuery.mockReturnValue({ isValid: true });

      const { result } = renderHook(() => useQueryValidation('SELECT * FROM users'));

      expect(result.current.validationError).toBeNull();
    });

    it('should return validateAndSanitize and clearValidationError functions', () => {
      const { result } = renderHook(() => useQueryValidation('SELECT * FROM users'));

      expect(typeof result.current.validateAndSanitize).toBe('function');
      expect(typeof result.current.clearValidationError).toBe('function');
    });
  });

  describe('validateAndSanitize', () => {
    it('should validate and sanitize valid query', () => {
      mockedQueryValidation.validateSQLQuery.mockReturnValue({ isValid: true });
      mockedQueryValidation.sanitizeQuery.mockReturnValue('SELECT * FROM users');

      const { result } = renderHook(() => useQueryValidation('SELECT * FROM users'));

      let validationResult: { isValid: boolean; sanitized: string | null; error: string | null } | undefined;
      act(() => {
        validationResult = result.current.validateAndSanitize();
      });

      expect(validationResult).toEqual({
        isValid: true,
        sanitized: 'SELECT * FROM users',
        error: null,
      });
      expect(result.current.validationError).toBeNull();
    });

    it('should set validation error when query is invalid', () => {
      mockedQueryValidation.validateSQLQuery.mockReturnValue({
        isValid: false,
        error: 'Invalid SQL syntax',
      });

      const { result } = renderHook(() => useQueryValidation('SELECT * FORM users'));

      let validationResult: { isValid: boolean; sanitized: string | null; error: string | null } | undefined;
      act(() => {
        validationResult = result.current.validateAndSanitize();
      });

      expect(validationResult).toEqual({
        isValid: false,
        sanitized: null,
        error: 'Invalid SQL syntax',
      });
      expect(result.current.validationError).toBe('Invalid SQL syntax');
    });

    it('should use default error message when error is not provided', () => {
      mockedQueryValidation.validateSQLQuery.mockReturnValue({ isValid: false });

      const { result } = renderHook(() => useQueryValidation('INVALID QUERY'));

      let validationResult: { isValid: boolean; sanitized: string | null; error: string | null } | undefined;
      act(() => {
        validationResult = result.current.validateAndSanitize();
      });

      expect(validationResult).toEqual({
        isValid: false,
        sanitized: null,
        error: 'Invalid query',
      });
      expect(result.current.validationError).toBe('Invalid query');
    });

    it('should call validateSQLQuery with the query', () => {
      mockedQueryValidation.validateSQLQuery.mockReturnValue({ isValid: true });
      mockedQueryValidation.sanitizeQuery.mockReturnValue('SELECT * FROM users');

      const { result } = renderHook(() => useQueryValidation('SELECT * FROM users'));

      act(() => {
        result.current.validateAndSanitize();
      });

      expect(mockedQueryValidation.validateSQLQuery).toHaveBeenCalledWith('SELECT * FROM users');
    });

    it('should call sanitizeQuery only when validation passes', () => {
      mockedQueryValidation.validateSQLQuery.mockReturnValue({ isValid: true });
      mockedQueryValidation.sanitizeQuery.mockReturnValue('SELECT * FROM users');

      const { result } = renderHook(() => useQueryValidation('SELECT * FROM users'));

      act(() => {
        result.current.validateAndSanitize();
      });

      expect(mockedQueryValidation.sanitizeQuery).toHaveBeenCalledWith('SELECT * FROM users');
    });

    it('should not call sanitizeQuery when validation fails', () => {
      mockedQueryValidation.validateSQLQuery.mockReturnValue({
        isValid: false,
        error: 'Invalid SQL',
      });

      const { result } = renderHook(() => useQueryValidation('INVALID'));

      act(() => {
        result.current.validateAndSanitize();
      });

      expect(mockedQueryValidation.sanitizeQuery).not.toHaveBeenCalled();
    });
  });

  describe('clearValidationError', () => {
    it('should clear validation error', () => {
      mockedQueryValidation.validateSQLQuery.mockReturnValue({
        isValid: false,
        error: 'Invalid SQL',
      });

      const { result } = renderHook(() => useQueryValidation('INVALID'));

      act(() => {
        result.current.validateAndSanitize();
      });

      expect(result.current.validationError).toBe('Invalid SQL');

      act(() => {
        result.current.clearValidationError();
      });

      expect(result.current.validationError).toBeNull();
    });

    it('should maintain null error when called on null error', () => {
      mockedQueryValidation.validateSQLQuery.mockReturnValue({ isValid: true });

      const { result } = renderHook(() => useQueryValidation('SELECT * FROM users'));

      act(() => {
        result.current.clearValidationError();
      });

      expect(result.current.validationError).toBeNull();
    });
  });

  describe('useCallback Stability', () => {
    it('should maintain validateAndSanitize function stability', () => {
      const { result, rerender } = renderHook(
        ({ query }) => useQueryValidation(query),
        { initialProps: { query: 'SELECT * FROM users' } }
      );

      const firstValidate = result.current.validateAndSanitize;

      rerender({ query: 'SELECT * FROM users' });

      expect(result.current.validateAndSanitize).toBe(firstValidate);
    });

    it('should update validateAndSanitize when query changes', () => {
      mockedQueryValidation.validateSQLQuery.mockReturnValue({ isValid: true });
      mockedQueryValidation.sanitizeQuery.mockReturnValue('SELECT * FROM posts');

      const { result, rerender } = renderHook(
        ({ query }) => useQueryValidation(query),
        { initialProps: { query: 'SELECT * FROM users' } }
      );

      rerender({ query: 'SELECT * FROM posts' });

      act(() => {
        result.current.validateAndSanitize();
      });

      expect(mockedQueryValidation.validateSQLQuery).toHaveBeenCalledWith('SELECT * FROM posts');
    });

    it('should maintain clearValidationError function stability', () => {
      const { result, rerender } = renderHook(() => useQueryValidation('SELECT * FROM users'));

      const firstClear = result.current.clearValidationError;

      rerender();

      expect(result.current.clearValidationError).toBe(firstClear);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty query string', () => {
      mockedQueryValidation.validateSQLQuery.mockReturnValue({
        isValid: false,
        error: 'Query cannot be empty',
      });

      const { result } = renderHook(() => useQueryValidation(''));

      let validationResult: { isValid: boolean; sanitized: string | null; error: string | null } | undefined;
      act(() => {
        validationResult = result.current.validateAndSanitize();
      });

      expect(validationResult?.isValid).toBe(false);
    });

    it('should handle whitespace-only query', () => {
      mockedQueryValidation.validateSQLQuery.mockReturnValue({
        isValid: false,
        error: 'Query cannot be empty',
      });

      const { result } = renderHook(() => useQueryValidation('   '));

      let validationResult: { isValid: boolean; sanitized: string | null; error: string | null } | undefined;
      act(() => {
        validationResult = result.current.validateAndSanitize();
      });

      expect(validationResult?.isValid).toBe(false);
    });

    it('should handle complex query validation', () => {
      const complexQuery = 'SELECT u.name, p.title FROM users u JOIN posts p ON u.id = p.user_id WHERE u.active = true';
      mockedQueryValidation.validateSQLQuery.mockReturnValue({ isValid: true });
      mockedQueryValidation.sanitizeQuery.mockReturnValue(complexQuery);

      const { result } = renderHook(() => useQueryValidation(complexQuery));

      let validationResult: { isValid: boolean; sanitized: string | null; error: string | null } | undefined;
      act(() => {
        validationResult = result.current.validateAndSanitize();
      });

      expect(validationResult?.isValid).toBe(true);
      expect(validationResult?.sanitized).toBe(complexQuery);
    });
  });
});
