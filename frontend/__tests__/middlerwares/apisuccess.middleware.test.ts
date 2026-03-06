import { Middleware, isFulfilled } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import successLogger from '../../src/middlerwares/apisuccess.middleware';

jest.mock('@reduxjs/toolkit', () => ({
  ...jest.requireActual('@reduxjs/toolkit'),
  isFulfilled: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

const mockIsFulfilled = isFulfilled as unknown as jest.Mock;
const mockToastSuccess = toast.success as jest.Mock;

describe('ApiSuccess Middleware', () => {
  let store: any;
  let next: jest.Mock;
  let invoke: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock isFulfilled to return true for actions with type containing "fulfilled"
    mockIsFulfilled.mockImplementation((action: any) => {
      return action.type && action.type.includes('/fulfilled');
    });
    
    store = {
      getState: jest.fn(() => ({})),
      dispatch: jest.fn(),
    };
    next = jest.fn();
    invoke = (action: any) => successLogger(store)(next)(action);
  });

  describe('Success Message Display', () => {
    it('should show toast success with message from meta', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            show_success: true,
            message: 'Operation successful',
          },
        },
        payload: {},
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Operation successful');
      expect(next).toHaveBeenCalledWith(action);
    });

    it('should show toast success with message from payload', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            show_success: true,
          },
        },
        payload: {
          message: 'Payload success message',
        },
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Payload success message');
      expect(next).toHaveBeenCalledWith(action);
    });

    it('should prefer meta message over payload message', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            show_success: true,
            message: 'Meta message',
          },
        },
        payload: {
          message: 'Payload message',
        },
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Meta message');
    });

    it('should show success by default when show_success is not specified', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            message: 'Default behavior',
          },
        },
        payload: {},
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Default behavior');
    });

    it('should show success when show_success is explicitly true', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            show_success: true,
            message: 'Success message',
          },
        },
        payload: {},
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Success message');
    });
  });

  describe('Success Message Suppression', () => {
    it('should not show toast when show_success is false', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            show_success: false,
            message: 'Should not show',
          },
        },
        payload: {},
      };

      invoke(action);

      expect(mockToastSuccess).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(action);
    });

    it('should not show toast when message is missing', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            show_success: true,
          },
        },
        payload: {},
      };

      invoke(action);

      expect(mockToastSuccess).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(action);
    });

    it('should not show toast when show_success is false and message is in payload', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            show_success: false,
          },
        },
        payload: {
          message: 'Payload message',
        },
      };

      invoke(action);

      expect(mockToastSuccess).not.toHaveBeenCalled();
    });

    it('should not show toast for empty message', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            show_success: true,
            message: '',
          },
        },
        payload: {},
      };

      invoke(action);

      expect(mockToastSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Non-Fulfilled Actions', () => {
    it('should pass through non-fulfilled actions', () => {
      const action = {
        type: 'test/pending',
        meta: {},
        payload: {},
      };

      invoke(action);

      expect(mockToastSuccess).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(action);
    });

    it('should pass through rejected actions', () => {
      const action = {
        type: 'test/rejected',
        error: { message: 'Error' },
        meta: { rejectedWithValue: true },
        payload: {},
      };

      invoke(action);

      expect(mockToastSuccess).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(action);
    });

    it('should handle actions without meta', () => {
      const action = {
        type: 'test/action',
        payload: {},
      };

      invoke(action);

      expect(mockToastSuccess).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(action);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined meta', () => {
      const action = {
        type: 'test/fulfilled',
        meta: undefined,
        payload: {
          message: 'Test message',
        },
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Test message');
    });

    it('should handle undefined baseQueryMeta', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {},
        payload: {
          message: 'Test message',
        },
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Test message');
    });

    it('should handle undefined payload', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            message: 'Meta message',
          },
        },
        payload: undefined,
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Meta message');
    });

    it('should handle null payload', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            message: 'Meta message',
          },
        },
        payload: null,
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Meta message');
    });

    it('should handle empty payload', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            message: 'Success',
          },
        },
        payload: {},
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Success');
    });

    it('should handle payload without message', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            show_success: true,
          },
        },
        payload: {
          data: 'some data',
        },
      };

      invoke(action);

      expect(mockToastSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Message Priority', () => {
    it('should use meta message when both meta and payload have messages', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            message: 'Meta priority',
          },
        },
        payload: {
          message: 'Payload message',
        },
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Meta priority');
      expect(mockToastSuccess).not.toHaveBeenCalledWith('Payload message');
    });

    it('should fallback to payload message when meta has no message', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            show_success: true,
          },
        },
        payload: {
          message: 'Fallback to payload',
        },
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Fallback to payload');
    });

    it('should use payload message when meta is undefined', () => {
      const action = {
        type: 'test/fulfilled',
        meta: undefined,
        payload: {
          message: 'Only payload message',
        },
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Only payload message');
    });

    it('should not show toast when neither has message', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            show_success: true,
          },
        },
        payload: {},
      };

      invoke(action);

      expect(mockToastSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Show Success Flag Behavior', () => {
    it('should default to true when show_success is undefined', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            message: 'Test message',
          },
        },
        payload: {},
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Test message');
    });

    it('should respect false show_success flag', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            show_success: false,
            message: 'Should not appear',
          },
        },
        payload: {},
      };

      invoke(action);

      expect(mockToastSuccess).not.toHaveBeenCalled();
    });

    it('should show message when show_success is true', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            show_success: true,
            message: 'Should appear',
          },
        },
        payload: {},
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Should appear');
    });

    it('should handle show_success with payload message', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            show_success: true,
          },
        },
        payload: {
          message: 'Payload success',
        },
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Payload success');
    });

    it('should default to true with payload message only', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {},
        payload: {
          message: 'Default true behavior',
        },
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Default true behavior');
    });
  });

  describe('Middleware Chain', () => {
    it('should call next with the same action', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            message: 'Success',
          },
        },
        payload: {},
      };

      invoke(action);

      expect(next).toHaveBeenCalledWith(action);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should return next action result', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {},
        payload: {},
      };

      const nextResult = { type: 'result' };
      next.mockReturnValue(nextResult);

      const result = invoke(action);

      expect(result).toBe(nextResult);
    });

    it('should maintain middleware chain for all actions', () => {
      const action = {
        type: 'test/fulfilled',
        payload: {},
      };

      invoke(action);

      expect(next).toHaveBeenCalledWith(action);
    });

    it('should not interrupt middleware chain', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            message: 'Test',
          },
        },
        payload: {},
      };

      invoke(action);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('Multiple Success Messages', () => {
    it('should handle multiple fulfilled actions', () => {
      const action1 = {
        type: 'test1/fulfilled',
        meta: { baseQueryMeta: { message: 'First success' } },
        payload: {},
      };

      const action2 = {
        type: 'test2/fulfilled',
        meta: { baseQueryMeta: { message: 'Second success' } },
        payload: {},
      };

      invoke(action1);
      invoke(action2);

      expect(mockToastSuccess).toHaveBeenCalledTimes(2);
      expect(mockToastSuccess).toHaveBeenNthCalledWith(1, 'First success');
      expect(mockToastSuccess).toHaveBeenNthCalledWith(2, 'Second success');
    });

    it('should handle mixed show_success flags', () => {
      const action1 = {
        type: 'test1/fulfilled',
        meta: { baseQueryMeta: { show_success: true, message: 'Show this' } },
        payload: {},
      };

      const action2 = {
        type: 'test2/fulfilled',
        meta: { baseQueryMeta: { show_success: false, message: 'Hide this' } },
        payload: {},
      };

      invoke(action1);
      invoke(action2);

      expect(mockToastSuccess).toHaveBeenCalledTimes(1);
      expect(mockToastSuccess).toHaveBeenCalledWith('Show this');
    });
  });

  describe('Complex Payload Structures', () => {
    it('should extract message from nested payload', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {},
        payload: {
          message: 'Success message',
          data: {
            id: 1,
            name: 'Test',
          },
        },
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Success message');
    });

    it('should handle payload with multiple properties', () => {
      const action = {
        type: 'test/fulfilled',
        meta: {
          baseQueryMeta: {
            message: 'Custom message',
          },
        },
        payload: {
          message: 'Payload message',
          result: 'success',
          code: 200,
        },
      };

      invoke(action);

      expect(mockToastSuccess).toHaveBeenCalledWith('Custom message');
    });
  });
});
