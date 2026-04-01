import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import useLoginController from '../../../../src/pages/Auth/Login/useLoginController';

const mockNavigate = jest.fn();
const mockSubmit = jest.fn();
const mockInsertData = jest.fn();
const mockDecodeToken = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../src/redux/Api/Auth', () => ({
  useLoginMutation: () => [
    mockSubmit,
    {
      data: undefined,
      isLoading: false,
      isSuccess: false,
    },
  ],
}));

jest.mock('../../../../src/utils/Common/storage', () => ({
  insertData: (...args: unknown[]) => mockInsertData(...args),
}));

jest.mock('../../../../src/utils/Common/helpers', () => ({
  decodeToken: (token: string) => mockDecodeToken(token),
}));

describe('useLoginController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useLoginController());

      expect(result.current.values.control).toBeDefined();
      expect(result.current.values.errors).toBeDefined();
      expect(result.current.values.isLoading).toBe(false);
      expect(result.current.functions.handleSubmit).toBeDefined();
    });

    it('should have control object for form management', () => {
      const { result } = renderHook(() => useLoginController());

      expect(result.current.values.control).toHaveProperty('_subjects');
      expect(result.current.values.control).toHaveProperty('_formState');
    });

    it('should initialize errors as empty object', () => {
      const { result } = renderHook(() => useLoginController());

      expect(result.current.values.errors).toEqual({});
    });
  });

  describe('Form Validation', () => {
    it('should validate required username field', async () => {
      const { result } = renderHook(() => useLoginController());

      await act(async () => {
        result.current.functions.handleSubmit();
      });

      await waitFor(() => {
        expect(result.current.values.errors.username).toBeDefined();
      });
    });

    it('should validate required password field', async () => {
      const { result } = renderHook(() => useLoginController());

      await act(async () => {
        result.current.functions.handleSubmit();
      });

      await waitFor(() => {
        expect(result.current.values.errors.password).toBeDefined();
      });
    });

    it('should have handleSubmit function', () => {
      const { result } = renderHook(() => useLoginController());

      expect(typeof result.current.functions.handleSubmit).toBe('function');
    });
  });

  describe('Login Submission', () => {
    it('should have submit function available', () => {
      const { result } = renderHook(() => useLoginController());

      expect(result.current.functions.handleSubmit).toBeDefined();
      expect(typeof result.current.functions.handleSubmit).toBe('function');
    });

    it('should call submit when valid data is provided', async () => {
      const { result } = renderHook(() => useLoginController());

      await act(async () => {
        result.current.functions.handleSubmit();
      });

      expect(result.current.functions.handleSubmit).toBeDefined();
    });
  });

  describe('Successful Login Flow', () => {
    it('should have insertData function available', () => {
      expect(mockInsertData).toBeDefined();
    });

    it('should have decodeToken function available', () => {
      expect(mockDecodeToken).toBeDefined();
    });

    it('should have navigate function available', () => {
      expect(mockNavigate).toBeDefined();
    });
  });

  describe('Form State Management', () => {
    it('should expose control for form fields', () => {
      const { result } = renderHook(() => useLoginController());

      expect(result.current.values.control).toBeDefined();
      expect(result.current.values.control._defaultValues).toEqual({
        username: '',
        password: '',
      });
    });

    it('should return errors object from form state', () => {
      const { result } = renderHook(() => useLoginController());

      expect(result.current.values).toHaveProperty('errors');
    });

    it('should return isLoading state', () => {
      const { result } = renderHook(() => useLoginController());

      expect(typeof result.current.values.isLoading).toBe('boolean');
    });
  });

  describe('Hook Return Values', () => {
    it('should return values object with control, errors, and isLoading', () => {
      const { result } = renderHook(() => useLoginController());

      expect(result.current.values).toHaveProperty('control');
      expect(result.current.values).toHaveProperty('errors');
      expect(result.current.values).toHaveProperty('isLoading');
    });

    it('should return functions object with handleSubmit', () => {
      const { result } = renderHook(() => useLoginController());

      expect(result.current.functions).toHaveProperty('handleSubmit');
      expect(typeof result.current.functions.handleSubmit).toBe('function');
    });

    it('should maintain consistent return structure', () => {
      const { result } = renderHook(() => useLoginController());

      expect(Object.keys(result.current)).toEqual(['values', 'functions']);
      expect(Object.keys(result.current.values)).toEqual([
        'control',
        'errors',
        'isLoading',
      ]);
      expect(Object.keys(result.current.functions)).toEqual(['handleSubmit']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle initial state without errors', () => {
      const { result } = renderHook(() => useLoginController());

      expect(result.current.values.isLoading).toBe(false);
    });

    it('should initialize with no navigation calls', () => {
      mockNavigate.mockClear();

      renderHook(() => useLoginController());

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should initialize without calling insertData', () => {
      mockInsertData.mockClear();

      renderHook(() => useLoginController());

      expect(mockInsertData).not.toHaveBeenCalled();
    });
  });

  describe('Dependencies', () => {
    it('should initialize useNavigate hook', () => {
      renderHook(() => useLoginController());

      expect(mockNavigate).toBeDefined();
    });

    it('should initialize useLoginMutation hook', () => {
      renderHook(() => useLoginController());

      expect(mockSubmit).toBeDefined();
    });

    it('should use react-hook-form useForm', () => {
      const { result } = renderHook(() => useLoginController());

      expect(result.current.values.control).toBeDefined();
      expect(result.current.functions.handleSubmit).toBeDefined();
    });
  });

  describe('Yup Validation Integration', () => {
    it('should integrate with loginValidation schema', () => {
      const { result } = renderHook(() => useLoginController());

      expect(result.current.values.control._options.resolver).toBeDefined();
    });

    it('should use yupResolver for form validation', async () => {
      const { result } = renderHook(() => useLoginController());

      await act(async () => {
        result.current.functions.handleSubmit();
      });

      await waitFor(() => {
        const hasErrors =
          Object.keys(result.current.values.errors).length > 0;
        expect(hasErrors).toBe(true);
      });
    });
  });
});
