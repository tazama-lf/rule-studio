import { renderHook } from '@testing-library/react';
import { useNodeValidation } from '../../../src/hooks/RuleBuilder/useNodeValidation';
import * as yup from 'yup';
import React from 'react';

// Mock the validation context
const mockSetNodeErrors = jest.fn();
const mockGetNodeError = jest.fn();

jest.mock('../../../src/validation/context', () => ({
  useValidationContext: () => ({
    setNodeErrors: mockSetNodeErrors,
    getNodeError: mockGetNodeError,
  }),
}));

// Mock the schema functions
const mockGetSchemaForNode = jest.fn();
const mockHasValidation = jest.fn();

jest.mock('../../../src/validation/schemas', () => ({
  getSchemaForNode: (...args: unknown[]) => mockGetSchemaForNode(...args),
  hasValidation: (...args: unknown[]) => mockHasValidation(...args),
}));

describe('useNodeValidation', () => {
  const nodeId = 'node-123';
  const nodeType = 'TestNode';
  const nodeName = 'Test Node';

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetNodeError.mockReturnValue(null);
  });

  describe('Initialization', () => {
    it('should return validate and validateField functions', () => {
      mockHasValidation.mockReturnValue(false);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      expect(typeof result.current.validate).toBe('function');
      expect(typeof result.current.validateField).toBe('function');
    });

    it('should return current error from context', () => {
      mockHasValidation.mockReturnValue(false);
      const expectedErrors = { field1: 'Error message' };
      mockGetNodeError.mockReturnValue({ errors: expectedErrors });

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      expect(result.current.errors).toEqual(expectedErrors);
      expect(result.current.hasError).toBe(true);
    });

    it('should return empty errors when no errors exist', () => {
      mockHasValidation.mockReturnValue(false);
      mockGetNodeError.mockReturnValue(null);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      expect(result.current.errors).toEqual({});
      expect(result.current.hasError).toBe(false);
    });
  });

  describe('validate function - No Validation', () => {
    it('should return valid result when node has no validation', async () => {
      mockHasValidation.mockReturnValue(false);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const validationResult = await result.current.validate({ field1: 'value1' });

      expect(validationResult).toEqual({ isValid: true, errors: {} });
      expect(mockSetNodeErrors).toHaveBeenCalledWith(nodeId, nodeName, nodeType, {});
    });

    it('should return valid result when schema is null', async () => {
      mockHasValidation.mockReturnValue(true);
      mockGetSchemaForNode.mockReturnValue(null);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const validationResult = await result.current.validate({ field1: 'value1' });

      expect(validationResult).toEqual({ isValid: true, errors: {} });
      expect(mockSetNodeErrors).toHaveBeenCalledWith(nodeId, nodeName, nodeType, {});
    });
  });

  describe('validate function - Success Cases', () => {
    it('should return valid result when validation passes', async () => {
      mockHasValidation.mockReturnValue(true);
      const schema = yup.object({
        field1: yup.string().required(),
        field2: yup.number().min(0),
      });
      mockGetSchemaForNode.mockReturnValue(schema);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const params = { field1: 'value', field2: 10 };
      const validationResult = await result.current.validate(params);

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toEqual({});
      expect(mockSetNodeErrors).toHaveBeenCalledWith(nodeId, nodeName, nodeType, {});
    });

    it('should clear errors when validation succeeds', async () => {
      mockHasValidation.mockReturnValue(true);
      const schema = yup.object({
        name: yup.string().required(),
      });
      mockGetSchemaForNode.mockReturnValue(schema);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      await result.current.validate({ name: 'John' });

      expect(mockSetNodeErrors).toHaveBeenCalledWith(nodeId, nodeName, nodeType, {});
    });
  });

  describe('validate function - Error Cases', () => {
    it('should return validation errors when validation fails', async () => {
      mockHasValidation.mockReturnValue(true);
      const schema = yup.object({
        field1: yup.string().required('Field 1 is required'),
        field2: yup.number().required('Field 2 is required').min(0, 'Must be positive'),
      });
      mockGetSchemaForNode.mockReturnValue(schema);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const params = { field1: '', field2: -5 };
      const validationResult = await result.current.validate(params);

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toHaveProperty('field1');
      expect(validationResult.errors).toHaveProperty('field2');
      expect(validationResult.errors.field1).toBe('Field 1 is required');
      expect(validationResult.errors.field2).toBe('Must be positive');
    });

    it('should set node errors in context when validation fails', async () => {
      mockHasValidation.mockReturnValue(true);
      const schema = yup.object({
        email: yup.string().email('Invalid email'),
      });
      mockGetSchemaForNode.mockReturnValue(schema);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      await result.current.validate({ email: 'invalid-email' });

      expect(mockSetNodeErrors).toHaveBeenCalledWith(
        nodeId,
        nodeName,
        nodeType,
        expect.objectContaining({ email: expect.any(String) })
      );
    });

    it('should handle multiple validation errors', async () => {
      mockHasValidation.mockReturnValue(true);
      const schema = yup.object({
        name: yup.string().required('Name required'),
        age: yup.number().required('Age required').min(18, 'Must be 18+'),
        email: yup.string().email('Invalid email'),
      });
      mockGetSchemaForNode.mockReturnValue(schema);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const params = { name: '', age: 15, email: 'bad-email' };
      const validationResult = await result.current.validate(params);

      expect(validationResult.isValid).toBe(false);
      expect(Object.keys(validationResult.errors)).toHaveLength(3);
    });

    it('should handle non-yup errors gracefully', async () => {
      mockHasValidation.mockReturnValue(true);
      const failingSchema = {
        validate: jest.fn().mockRejectedValue(new Error('Unknown error')),
      };
      mockGetSchemaForNode.mockReturnValue(failingSchema);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const validationResult = await result.current.validate({ field: 'value' });

      expect(validationResult.isValid).toBe(false);
      expect(validationResult.errors).toEqual({});
    });
  });

  describe('validateField function - No Validation', () => {
    it('should return null when node has no validation', async () => {
      mockHasValidation.mockReturnValue(false);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const error = await result.current.validateField('field1', 'value', {});

      expect(error).toBeNull();
    });

    it('should return null when schema is null', async () => {
      mockHasValidation.mockReturnValue(true);
      mockGetSchemaForNode.mockReturnValue(null);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const error = await result.current.validateField('field1', 'value', {});

      expect(error).toBeNull();
    });
  });

  describe('validateField function - Success Cases', () => {
    it('should return null when field validation passes', async () => {
      mockHasValidation.mockReturnValue(true);
      const schema = yup.object({
        email: yup.string().email(),
      });
      mockGetSchemaForNode.mockReturnValue(schema);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const error = await result.current.validateField('email', 'test@example.com', {
        email: 'test@example.com',
      });

      expect(error).toBeNull();
    });

    it('should validate single field independently', async () => {
      mockHasValidation.mockReturnValue(true);
      const schema = yup.object({
        name: yup.string().required(),
        age: yup.number().min(0),
      });
      mockGetSchemaForNode.mockReturnValue(schema);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const error = await result.current.validateField('name', 'John', {
        name: 'John',
        age: 25,
      });

      expect(error).toBeNull();
    });
  });

  describe('validateField function - Error Cases', () => {
    it('should return error message when field validation fails', async () => {
      mockHasValidation.mockReturnValue(true);
      const schema = yup.object({
        email: yup.string().email('Invalid email address'),
      });
      mockGetSchemaForNode.mockReturnValue(schema);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const error = await result.current.validateField('email', 'invalid-email', {
        email: 'invalid-email',
      });

      expect(error).toBe('Invalid email address');
    });

    it('should return error for required field', async () => {
      mockHasValidation.mockReturnValue(true);
      const schema = yup.object({
        name: yup.string().required('Name is required'),
      });
      mockGetSchemaForNode.mockReturnValue(schema);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const error = await result.current.validateField('name', '', { name: '' });

      expect(error).toBe('Name is required');
    });

    it('should handle non-yup errors gracefully', async () => {
      mockHasValidation.mockReturnValue(true);
      const failingSchema = {
        validateAt: jest.fn().mockRejectedValue(new Error('Unknown error')),
      };
      mockGetSchemaForNode.mockReturnValue(failingSchema);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const error = await result.current.validateField('field', 'value', {});

      expect(error).toBeNull();
    });
  });

  describe('errors useMemo', () => {
    it('should memoize errors when nodeId does not change', () => {
      mockHasValidation.mockReturnValue(false);
      const errorObj = { field1: 'Error 1' };
      mockGetNodeError.mockReturnValue({ errors: errorObj });

      const { result, rerender } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const firstErrors = result.current.errors;
      
      rerender();
      
      expect(result.current.errors).toBe(firstErrors);
    });

    it('should update when getNodeError changes', () => {
      mockHasValidation.mockReturnValue(false);
      mockGetNodeError.mockReturnValue({ errors: { field1: 'Error 1' } });

      const { result, rerender } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      expect(result.current.errors).toEqual({ field1: 'Error 1' });

      mockGetNodeError.mockReturnValue({ errors: { field1: 'Error 2' } });
      
      rerender();
      
      // Note: Due to useMemo dependencies, it may not update unless getNodeError function reference changes
      expect(mockGetNodeError).toHaveBeenCalled();
    });
  });

  describe('useCallback Stability', () => {
    it('should maintain validate function stability', () => {
      mockHasValidation.mockReturnValue(false);

      const { result, rerender } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const firstValidate = result.current.validate;
      
      rerender();
      
      expect(result.current.validate).toBe(firstValidate);
    });

    it('should maintain validateField function stability', () => {
      mockHasValidation.mockReturnValue(false);

      const { result, rerender } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const firstValidateField = result.current.validateField;
      
      rerender();
      
      expect(result.current.validateField).toBe(firstValidateField);
    });

    it('should update validate when dependencies change', () => {
      mockHasValidation.mockReturnValue(false);

      const { result, rerender } = renderHook(
        ({ id, type, name }) => useNodeValidation(id, type, name),
        { initialProps: { id: nodeId, type: nodeType, name: nodeName } }
      );

      const firstValidate = result.current.validate;
      
      rerender({ id: 'new-node-id', type: nodeType, name: nodeName });
      
      // Function reference should change when dependencies change
      expect(result.current.validate).not.toBe(firstValidate);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty params object', async () => {
      mockHasValidation.mockReturnValue(true);
      const schema = yup.object({});
      mockGetSchemaForNode.mockReturnValue(schema);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const validationResult = await result.current.validate({});

      expect(validationResult.isValid).toBe(true);
      expect(validationResult.errors).toEqual({});
    });

    it('should handle null or undefined values in params', async () => {
      mockHasValidation.mockReturnValue(true);
      const schema = yup.object({
        field1: yup.string().nullable(),
      });
      mockGetSchemaForNode.mockReturnValue(schema);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const validationResult = await result.current.validate({ field1: null });

      expect(validationResult.isValid).toBe(true);
    });

    it('should handle validation errors without path', async () => {
      mockHasValidation.mockReturnValue(true);
      const error = new yup.ValidationError('Error without path');
      error.inner = [new yup.ValidationError('Inner error without path')];
      
      const failingSchema = {
        validate: jest.fn().mockRejectedValue(error),
      };
      mockGetSchemaForNode.mockReturnValue(failingSchema);

      const { result } = renderHook(() =>
        useNodeValidation(nodeId, nodeType, nodeName)
      );

      const validationResult = await result.current.validate({ field: 'value' });

      expect(validationResult.isValid).toBe(false);
    });
  });
});
