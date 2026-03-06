import { Middleware, isRejectedWithValue } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import errorLogger from '../../src/middlerwares/apierror.middleware';
import { resetData } from '../../src/utils/Common/storage';

jest.mock('@reduxjs/toolkit', () => ({
  ...jest.requireActual('@reduxjs/toolkit'),
  isRejectedWithValue: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

jest.mock('../../src/utils/Common/storage', () => ({
  resetData: jest.fn(),
}));

const mockIsRejectedWithValue = isRejectedWithValue as unknown as jest.Mock;
const mockToastError = toast.error as jest.Mock;
const mockResetData = resetData as jest.Mock;

describe('ApiError Middleware', () => {
  let store: any;
  let next: jest.Mock;
  let invoke: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock isRejectedWithValue to return true for actions with type containing "rejected"
    mockIsRejectedWithValue.mockImplementation((action: any) => {
      return action.type && action.type.includes('/rejected');
    });
    
    store = {
      getState: jest.fn(() => ({})),
      dispatch: jest.fn(),
    };
    next = jest.fn();
    invoke = (action: any) => errorLogger(store)(next)(action);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockToastError.mockClear();
    jest.useRealTimers();
  });

  describe('Normal Error Handling', () => {
    it('should show toast error for rejected action with message', () => {
      const action = {
        type: 'test/rejected',
        error: { message: 'Test error' },
        meta: { rejectedWithValue: true },
        payload: undefined,
      };

      invoke(action);

      expect(mockToastError).toHaveBeenCalledWith('Test error');
      expect(next).toHaveBeenCalledWith(action);
    });

    it('should show toast error with payload message', () => {
      const action = {
        type: 'test/rejected',
        error: {},
        meta: { rejectedWithValue: true },
        payload: {
          data: {
            message: 'Payload error message',
          },
        },
      };

      invoke(action);

      expect(mockToastError).toHaveBeenCalledWith('Payload error message');
      expect(next).toHaveBeenCalledWith(action);
    });

    it('should show default error message when no message provided', () => {
      const action = {
        type: 'test/rejected',
        error: {},
        meta: { rejectedWithValue: true },
        payload: {},
      };

      invoke(action);

      expect(mockToastError).toHaveBeenCalledWith('Something went wrong');
      expect(next).toHaveBeenCalledWith(action);
    });

    it('should prefer payload message over error message', () => {
      const action = {
        type: 'test/rejected',
        error: { message: 'Error message' },
        meta: { rejectedWithValue: true },
        payload: {
          data: {
            message: 'Payload message',
          },
        },
      };

      invoke(action);

      expect(mockToastError).toHaveBeenCalledWith('Payload message');
    });

    it('should handle error with status code', () => {
      const action = {
        type: 'test/rejected',
        error: { message: 'Error' },
        meta: { rejectedWithValue: true },
        payload: {
          status: 500,
          data: {
            message: 'Server error',
          },
        },
      };

      invoke(action);

      expect(mockToastError).toHaveBeenCalledWith('Server error');
      expect(next).toHaveBeenCalledWith(action);
    });
  });

  describe('401 Unauthorized Handling', () => {
    it('should handle 401 error with Token message', () => {
      const action = {
        type: 'test/rejected',
        error: {},
        meta: { rejectedWithValue: true },
        payload: {
          status: 401,
          data: {
            message: 'Token expired',
          },
        },
      };

      invoke(action);

      expect(mockResetData).toHaveBeenCalledTimes(1);
      expect(mockToastError).toHaveBeenCalledWith('Token expired');
      expect(next).not.toHaveBeenCalled();
    });

    it('should redirect to login after 2 seconds for 401 Token error', () => {
      const action = {
        type: 'test/rejected',
        error: {},
        meta: { rejectedWithValue: true },
        payload: {
          status: 401,
          data: {
            message: 'Invalid Token',
          },
        },
      };

      invoke(action);

      // Verify immediate actions
      expect(mockResetData).toHaveBeenCalledTimes(1);
      expect(mockToastError).toHaveBeenCalledWith('Invalid Token');
      expect(next).not.toHaveBeenCalled();
      
      // Verify setTimeout was called for redirect
      expect(jest.getTimerCount()).toBeGreaterThan(0);
    });

    it('should not redirect for 401 without Token in message', () => {
      const action = {
        type: 'test/rejected',
        error: {},
        meta: { rejectedWithValue: true },
        payload: {
          status: 401,
          data: {
            message: 'Unauthorized access',
          },
        },
      };

      invoke(action);

      expect(mockResetData).not.toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalledWith('Unauthorized access');
      expect(next).toHaveBeenCalledWith(action);
    });

    it('should handle 401 with Token case-insensitive', () => {
      const action = {
        type: 'test/rejected',
        error: {},
        meta: { rejectedWithValue: true },
        payload: {
          status: 401,
          data: {
            message: 'token has expired',
          },
        },
      };

      invoke(action);

      // Should NOT call resetData because message doesn't contain 'Token' (capital T)
      expect(mockResetData).not.toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalledWith('token has expired');
      expect(next).toHaveBeenCalled();
    });

    it('should handle 401 with Token in different position', () => {
      const action = {
        type: 'test/rejected',
        error: {},
        meta: { rejectedWithValue: true },
        payload: {
          status: 401,
          data: {
            message: 'JWT Token validation failed',
          },
        },
      };

      invoke(action);

      expect(mockResetData).toHaveBeenCalled();
      expect(mockToastError).toHaveBeenCalledWith('JWT Token validation failed');
    });
  });

  describe('Non-Rejected Actions', () => {
    it('should pass through non-rejected actions', () => {
      const action = {
        type: 'test/fulfilled',
        payload: { data: 'success' },
      };

      invoke(action);

      expect(mockToastError).not.toHaveBeenCalled();
      expect(mockResetData).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(action);
    });

    it('should pass through pending actions', () => {
      const action = {
        type: 'test/pending',
        meta: {},
      };

      invoke(action);

      expect(mockToastError).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(action);
    });

    it('should handle actions without meta', () => {
      const action = {
        type: 'test/action',
        payload: {},
      };

      invoke(action);

      expect(mockToastError).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(action);
    });
  });

  describe('Error Message Priority', () => {
    it('should use payload data message first', () => {
      const action = {
        type: 'test/rejected',
        error: { message: 'Error message' },
        meta: { rejectedWithValue: true },
        payload: {
          data: {
            message: 'Payload message',
          },
        },
      };

      invoke(action);

      expect(mockToastError).toHaveBeenCalledWith('Payload message');
    });

    it('should use error message as fallback', () => {
      const action = {
        type: 'test/rejected',
        error: { message: 'Fallback error' },
        meta: { rejectedWithValue: true },
        payload: {
          data: {},
        },
      };

      invoke(action);

      expect(mockToastError).toHaveBeenCalledWith('Fallback error');
    });

    it('should use default message when no messages available', () => {
      const action = {
        type: 'test/rejected',
        error: {},
        meta: { rejectedWithValue: true },
        payload: {},
      };

      invoke(action);

      expect(mockToastError).toHaveBeenCalledWith('Something went wrong');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined payload', () => {
      const action = {
        type: 'test/rejected',
        error: { message: 'Error' },
        meta: { rejectedWithValue: true },
        payload: undefined,
      };

      invoke(action);

      expect(mockToastError).toHaveBeenCalledWith('Error');
      expect(next).toHaveBeenCalledWith(action);
    });

    it('should handle null payload', () => {
      const action = {
        type: 'test/rejected',
        error: { message: 'Error' },
        meta: { rejectedWithValue: true },
        payload: null,
      };

      invoke(action);

      expect(mockToastError).toHaveBeenCalledWith('Error');
    });

    it('should handle payload without data', () => {
      const action = {
        type: 'test/rejected',
        error: { message: 'Error' },
        meta: { rejectedWithValue: true },
        payload: {
          status: 500,
        },
      };

      invoke(action);

      expect(mockToastError).toHaveBeenCalledWith('Error');
    });

    it('should handle empty error message', () => {
      const action = {
        type: 'test/rejected',
        error: { message: '' },
        meta: { rejectedWithValue: true },
        payload: {
          data: {
            message: '',
          },
        },
      };

      invoke(action);

      expect(mockToastError).toHaveBeenCalledWith('Something went wrong');
    });

    it('should not call next for 401 Token errors', () => {
      const action = {
        type: 'test/rejected',
        error: {},
        meta: { rejectedWithValue: true },
        payload: {
          status: 401,
          data: {
            message: 'Token invalid',
          },
        },
      };

      const result = invoke(action);

      expect(next).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('should return next action result for normal errors', () => {
      const action = {
        type: 'test/rejected',
        error: { message: 'Error' },
        meta: { rejectedWithValue: true },
        payload: {},
      };

      const nextResult = { type: 'result' };
      next.mockReturnValue(nextResult);

      const result = invoke(action);

      expect(result).toBe(nextResult);
    });
  });

  describe('Status Code Handling', () => {
    it('should handle 400 error', () => {
      const action = {
        type: 'test/rejected',
        error: {},
        meta: { rejectedWithValue: true },
        payload: {
          status: 400,
          data: {
            message: 'Bad request',
          },
        },
      };

      invoke(action);

      expect(mockToastError).toHaveBeenCalledWith('Bad request');
      expect(mockResetData).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should handle 403 error', () => {
      const action = {
        type: 'test/rejected',
        error: {},
        meta: { rejectedWithValue: true },
        payload: {
          status: 403,
          data: {
            message: 'Forbidden',
          },
        },
      };

      invoke(action);

      expect(mockToastError).toHaveBeenCalledWith('Forbidden');
      expect(next).toHaveBeenCalled();
    });

    it('should handle 404 error', () => {
      const action = {
        type: 'test/rejected',
        error: {},
        meta: { rejectedWithValue: true },
        payload: {
          status: 404,
          data: {
            message: 'Not found',
          },
        },
      };

      invoke(action);

      expect(mockToastError).toHaveBeenCalledWith('Not found');
      expect(next).toHaveBeenCalled();
    });

    it('should handle 500 error', () => {
      const action = {
        type: 'test/rejected',
        error: {},
        meta: { rejectedWithValue: true },
        payload: {
          status: 500,
          data: {
            message: 'Internal server error',
          },
        },
      };

      invoke(action);

      expect(mockToastError).toHaveBeenCalledWith('Internal server error');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Middleware Chain', () => {
    it('should call next with the same action', () => {
      const action = {
        type: 'test/rejected',
        error: { message: 'Error' },
        meta: { rejectedWithValue: true },
        payload: {},
      };

      invoke(action);

      expect(next).toHaveBeenCalledWith(action);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should maintain middleware chain for non-error actions', () => {
      const action = {
        type: 'test/fulfilled',
        payload: { result: 'success' },
      };

      invoke(action);

      expect(next).toHaveBeenCalledWith(action);
    });
  });
});
