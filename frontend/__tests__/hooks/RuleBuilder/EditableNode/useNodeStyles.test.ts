import { renderHook } from '@testing-library/react';
import { useNodeStyles } from '../../../../src/hooks/RuleBuilder/EditableNode/useNodeStyles';
import * as nodeTemplateService from '../../../../src/utils/Flow/nodeTemplateService';

jest.mock('../../../../src/utils/Flow/nodeTemplateService');

const mockedTemplateService = nodeTemplateService as jest.Mocked<typeof nodeTemplateService>;

describe('useNodeStyles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should return default blue colors when no template found', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue(undefined);

      const { result } = renderHook(() => useNodeStyles('UnknownNode'));

      expect(result.current).toEqual({
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
      });
    });

    it('should return default blue colors when template has no bgColor', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({} as any);

      const { result } = renderHook(() => useNodeStyles('TestNode'));

      expect(result.current).toEqual({
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
      });
    });
  });

  describe('Color Mapping', () => {
    it('should return green colors for green bgColor', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({
        bgColor: 'bg-green-100',
      } as any);

      const { result } = renderHook(() => useNodeStyles('StartNode'));

      expect(result.current).toEqual({
        backgroundColor: '#e8f5e9',
        borderColor: '#4caf50',
      });
    });

    it('should return blue colors for blue bgColor', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({
        bgColor: 'bg-blue-100',
      } as any);

      const { result } = renderHook(() => useNodeStyles('ProcessNode'));

      expect(result.current).toEqual({
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
      });
    });

    it('should return yellow colors for yellow bgColor', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({
        bgColor: 'bg-yellow-100',
      } as any);

      const { result } = renderHook(() => useNodeStyles('WarningNode'));

      expect(result.current).toEqual({
        backgroundColor: '#fff9c4',
        borderColor: '#ffeb3b',
      });
    });

    it('should return purple colors for purple bgColor', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({
        bgColor: 'bg-purple-100',
      } as any);

      const { result } = renderHook(() => useNodeStyles('SpecialNode'));

      expect(result.current).toEqual({
        backgroundColor: '#f3e5f5',
        borderColor: '#9c27b0',
      });
    });

    it('should return red colors for red bgColor', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({
        bgColor: 'bg-red-100',
      } as any);

      const { result } = renderHook(() => useNodeStyles('ErrorNode'));

      expect(result.current).toEqual({
        backgroundColor: '#ffebee',
        borderColor: '#f44336',
      });
    });

    it('should return orange colors for orange bgColor', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({
        bgColor: 'bg-orange-100',
      } as any);

      const { result } = renderHook(() => useNodeStyles('AlertNode'));

      expect(result.current).toEqual({
        backgroundColor: '#fff3e0',
        borderColor: '#ff9800',
      });
    });

    it('should return pink colors for pink bgColor', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({
        bgColor: 'bg-pink-100',
      } as any);

      const { result } = renderHook(() => useNodeStyles('PinkNode'));

      expect(result.current).toEqual({
        backgroundColor: '#fce4ec',
        borderColor: '#e91e63',
      });
    });

    it('should return gray colors for gray bgColor', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({
        bgColor: 'bg-gray-100',
      } as any);

      const { result } = renderHook(() => useNodeStyles('DisabledNode'));

      expect(result.current).toEqual({
        backgroundColor: '#f5f5f5',
        borderColor: '#9e9e9e',
      });
    });
  });

  describe('Color Variations', () => {
    it('should handle different green shades', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({
        bgColor: 'bg-green-50',
      } as any);

      const { result } = renderHook(() => useNodeStyles('Node1'));

      expect(result.current.backgroundColor).toBe('#e8f5e9');
      expect(result.current.borderColor).toBe('#4caf50');
    });

    it('should handle greenish variations', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({
        bgColor: 'green-light',
      } as any);

      const { result } = renderHook(() => useNodeStyles('Node2'));

      expect(result.current.backgroundColor).toBe('#e8f5e9');
      expect(result.current.borderColor).toBe('#4caf50');
    });
  });

  describe('useMemo Optimization', () => {
    it('should memoize result when nodeType does not change', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({
        bgColor: 'bg-green-100',
      } as any);

      const { result, rerender } = renderHook(
        ({ type }) => useNodeStyles(type),
        { initialProps: { type: 'StartNode' } }
      );

      const firstResult = result.current;

      rerender({ type: 'StartNode' });

      expect(result.current).toBe(firstResult);
      expect(mockedTemplateService.getNodeTemplate).toHaveBeenCalledTimes(1);
    });

    it('should recompute when nodeType changes', () => {
      mockedTemplateService.getNodeTemplate
        .mockReturnValueOnce({ bgColor: 'bg-green-100' } as any)
        .mockReturnValueOnce({ bgColor: 'bg-red-100' } as any);

      const { result, rerender } = renderHook(
        ({ type }) => useNodeStyles(type),
        { initialProps: { type: 'StartNode' } }
      );

      expect(result.current.backgroundColor).toBe('#e8f5e9');

      rerender({ type: 'ErrorNode' });

      expect(result.current.backgroundColor).toBe('#ffebee');
      expect(mockedTemplateService.getNodeTemplate).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty nodeType', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue(undefined);

      const { result } = renderHook(() => useNodeStyles(''));

      expect(result.current).toEqual({
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
      });
    });

    it('should handle nodeType with mixed case color names', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({
        bgColor: 'bg-Green-100',
      } as any);

      const { result } = renderHook(() => useNodeStyles('Node'));

      // Color matching is case-sensitive, so this should fallback to blue
      expect(result.current.backgroundColor).toBe('#e3f2fd');
    });

    it('should fallback to blue for unrecognized colors', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({
        bgColor: 'bg-teal-100',
      } as any);

      const { result } = renderHook(() => useNodeStyles('Node'));

      expect(result.current).toEqual({
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
      });
    });

    it('should handle bgColor without bg- prefix', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({
        bgColor: 'red',
      } as any);

      const { result } = renderHook(() => useNodeStyles('Node'));

      expect(result.current.backgroundColor).toBe('#ffebee');
      expect(result.current.borderColor).toBe('#f44336');
    });

    it('should call getNodeTemplate with correct nodeType', () => {
      mockedTemplateService.getNodeTemplate.mockReturnValue({
        bgColor: 'bg-blue-100',
      } as any);

      renderHook(() => useNodeStyles('CustomNode'));

      expect(mockedTemplateService.getNodeTemplate).toHaveBeenCalledWith('CustomNode');
    });
  });
});
