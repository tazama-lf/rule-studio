import { renderHook, act } from '@testing-library/react';
import { useFlowState } from '../../../src/hooks/RuleBuilder/useFlowState';

// Mock console.error to suppress expected errors in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('useFlowState', () => {
  describe('Initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useFlowState());

      expect(result.current.jsonModalOpen).toBe(false);
      expect(result.current.codeModalOpen).toBe(false);
      expect(result.current.jsonOutput).toBe('');
      expect(result.current.codeOutput).toBe('');
      expect(result.current.debugVariables).toEqual({});
      expect(result.current.debugLogs).toEqual([]);
      expect(result.current.currentAnimationNode).toBeUndefined();
      expect(result.current.selectedNode).toBeNull();
      expect(result.current.sidebarCollapsed).toBe(false);
      expect(result.current.generatedCode).toBe('');
      expect(result.current.allNodes).toEqual([]);
      expect(result.current.edges).toEqual([]);
    });

    it('should return all setters', () => {
      const { result } = renderHook(() => useFlowState());

      expect(typeof result.current.setJsonModalOpen).toBe('function');
      expect(typeof result.current.setCodeModalOpen).toBe('function');
      expect(typeof result.current.setJsonOutput).toBe('function');
      expect(typeof result.current.setCodeOutput).toBe('function');
      expect(typeof result.current.setDebugVariables).toBe('function');
      expect(typeof result.current.setDebugLogs).toBe('function');
      expect(typeof result.current.setCurrentAnimationNode).toBe('function');
      expect(typeof result.current.setSelectedNode).toBe('function');
      expect(typeof result.current.setSidebarCollapsed).toBe('function');
      expect(typeof result.current.setGeneratedCode).toBe('function');
      expect(typeof result.current.setAllNodes).toBe('function');
      expect(typeof result.current.setEdges).toBe('function');
    });

    it('should return all handlers', () => {
      const { result } = renderHook(() => useFlowState());

      expect(typeof result.current.handleToggleSidebar).toBe('function');
      expect(typeof result.current.handleCloseRightSidebar).toBe('function');
      expect(typeof result.current.handleJsonGenerate).toBe('function');
      expect(typeof result.current.handleCodeGenerate).toBe('function');
      expect(typeof result.current.handleDownload).toBe('function');
    });
  });

  describe('Modal State', () => {
    it('should open json modal', () => {
      const { result } = renderHook(() => useFlowState());

      act(() => {
        result.current.setJsonModalOpen(true);
      });

      expect(result.current.jsonModalOpen).toBe(true);
    });

    it('should close json modal', () => {
      const { result } = renderHook(() => useFlowState());

      act(() => {
        result.current.setJsonModalOpen(true);
      });

      act(() => {
        result.current.setJsonModalOpen(false);
      });

      expect(result.current.jsonModalOpen).toBe(false);
    });

    it('should open code modal', () => {
      const { result } = renderHook(() => useFlowState());

      act(() => {
        result.current.setCodeModalOpen(true);
      });

      expect(result.current.codeModalOpen).toBe(true);
    });
  });

  describe('Debug State', () => {
    it('should set debug variables', () => {
      const { result } = renderHook(() => useFlowState());
      const variables = { var1: 'value1', var2: 42 };

      act(() => {
        result.current.setDebugVariables(variables);
      });

      expect(result.current.debugVariables).toEqual(variables);
    });

    it('should set debug logs', () => {
      const { result } = renderHook(() => useFlowState());
      const logs = [
        { time: '10:00:00', message: 'Log 1', type: 'info' as const },
        { time: '10:00:01', message: 'Log 2', type: 'error' as const },
      ];

      act(() => {
        result.current.setDebugLogs(logs);
      });

      expect(result.current.debugLogs).toEqual(logs);
    });

    it('should set debug logs with function', () => {
      const { result } = renderHook(() => useFlowState());
      const initialLog = { time: '10:00:00', message: 'Initial', type: 'info' as const };
      const newLog = { time: '10:00:01', message: 'New', type: 'info' as const };

      act(() => {
        result.current.setDebugLogs([initialLog]);
      });

      act(() => {
        result.current.setDebugLogs(prev => [...prev, newLog]);
      });

      expect(result.current.debugLogs).toHaveLength(2);
      expect(result.current.debugLogs[1]).toEqual(newLog);
    });

    it('should set current animation node', () => {
      const { result } = renderHook(() => useFlowState());

      act(() => {
        result.current.setCurrentAnimationNode('node-123');
      });

      expect(result.current.currentAnimationNode).toBe('node-123');
    });

    it('should clear animation node', () => {
      const { result } = renderHook(() => useFlowState());

      act(() => {
        result.current.setCurrentAnimationNode('node-123');
      });

      act(() => {
        result.current.setCurrentAnimationNode(undefined);
      });

      expect(result.current.currentAnimationNode).toBeUndefined();
    });
  });

  describe('Node and Edge State', () => {
    it('should set selected node', () => {
      const { result } = renderHook(() => useFlowState());
      const node = { id: '1', position: { x: 0, y: 0 }, data: {} };

      act(() => {
        result.current.setSelectedNode(node as any);
      });

      expect(result.current.selectedNode).toEqual(node);
    });

    it('should set all nodes', () => {
      const { result } = renderHook(() => useFlowState());
      const nodes = [
        { id: '1', position: { x: 0, y: 0 }, data: {} },
        { id: '2', position: { x: 100, y: 100 }, data: {} },
      ];

      act(() => {
        result.current.setAllNodes(nodes as any);
      });

      expect(result.current.allNodes).toEqual(nodes);
    });

    it('should set edges', () => {
      const { result } = renderHook(() => useFlowState());
      const edges = [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '3' },
      ];

      act(() => {
        result.current.setEdges(edges as any);
      });

      expect(result.current.edges).toEqual(edges);
    });
  });

  describe('Sidebar State', () => {
    it('should toggle sidebar from collapsed to expanded', () => {
      const { result } = renderHook(() => useFlowState());

      expect(result.current.sidebarCollapsed).toBe(false);

      act(() => {
        result.current.handleToggleSidebar();
      });

      expect(result.current.sidebarCollapsed).toBe(true);
    });

    it('should toggle sidebar from expanded to collapsed', () => {
      const { result } = renderHook(() => useFlowState());

      act(() => {
        result.current.setSidebarCollapsed(true);
      });

      act(() => {
        result.current.handleToggleSidebar();
      });

      expect(result.current.sidebarCollapsed).toBe(false);
    });

    it('should close right sidebar by clearing selected node', () => {
      const { result } = renderHook(() => useFlowState());
      const node = { id: '1', position: { x: 0, y: 0 }, data: {} };

      act(() => {
        result.current.setSelectedNode(node as any);
      });

      act(() => {
        result.current.handleCloseRightSidebar();
      });

      expect(result.current.selectedNode).toBeNull();
    });
  });

  describe('Code Generation', () => {
    it('should generate and format valid JSON', () => {
      const { result } = renderHook(() => useFlowState());
      const json = '{"name":"test","value":123}';

      act(() => {
        result.current.handleJsonGenerate(json);
      });

      expect(result.current.jsonOutput).toBe(JSON.stringify(JSON.parse(json), null, 2));
      expect(result.current.jsonModalOpen).toBe(true);
    });

    it('should handle invalid JSON gracefully', () => {
      const { result } = renderHook(() => useFlowState());
      const invalidJson = '{invalid json}';

      act(() => {
        result.current.handleJsonGenerate(invalidJson);
      });

      expect(result.current.jsonOutput).toBe(invalidJson);
      expect(result.current.jsonModalOpen).toBe(true);
    });

    it('should generate code and open modal', () => {
      const { result } = renderHook(() => useFlowState());
      const code = 'const x = 42;';

      act(() => {
        result.current.handleCodeGenerate(code);
      });

      expect(result.current.codeOutput).toBe(code);
      expect(result.current.generatedCode).toBe(code);
      expect(result.current.codeModalOpen).toBe(true);
    });
  });

  describe('Download Handler', () => {
    it('should be a function', () => {
      const { result } = renderHook(() => useFlowState());
      
      expect(typeof result.current.handleDownload).toBe('function');
    });

    it('should show alert when code is empty', () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      const { result } = renderHook(() => useFlowState());

      act(() => {
        result.current.handleDownload('');
      });

      expect(alertSpy).toHaveBeenCalledWith('Generate code first');

      alertSpy.mockRestore();
    });
  });

  describe('useCallback Stability', () => {
    it('should maintain function stability across renders', () => {
      const { result, rerender } = renderHook(() => useFlowState());

      const firstHandlers = {
        setDebugVariables: result.current.setDebugVariables,
        setDebugLogs: result.current.setDebugLogs,
        setCurrentAnimationNode: result.current.setCurrentAnimationNode,
        setAllNodes: result.current.setAllNodes,
        setEdges: result.current.setEdges,
        handleToggleSidebar: result.current.handleToggleSidebar,
        handleCloseRightSidebar: result.current.handleCloseRightSidebar,
        handleJsonGenerate: result.current.handleJsonGenerate,
        handleCodeGenerate: result.current.handleCodeGenerate,
        handleDownload: result.current.handleDownload,
      };

      rerender();

      expect(result.current.setDebugVariables).toBe(firstHandlers.setDebugVariables);
      expect(result.current.setDebugLogs).toBe(firstHandlers.setDebugLogs);
      expect(result.current.setCurrentAnimationNode).toBe(firstHandlers.setCurrentAnimationNode);
      expect(result.current.setAllNodes).toBe(firstHandlers.setAllNodes);
      expect(result.current.setEdges).toBe(firstHandlers.setEdges);
      expect(result.current.handleToggleSidebar).toBe(firstHandlers.handleToggleSidebar);
      expect(result.current.handleCloseRightSidebar).toBe(firstHandlers.handleCloseRightSidebar);
      expect(result.current.handleJsonGenerate).toBe(firstHandlers.handleJsonGenerate);
      expect(result.current.handleCodeGenerate).toBe(firstHandlers.handleCodeGenerate);
      expect(result.current.handleDownload).toBe(firstHandlers.handleDownload);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      const { result } = renderHook(() => useFlowState());

      act(() => {
        result.current.setJsonOutput('');
        result.current.setCodeOutput('');
        result.current.setGeneratedCode('');
      });

      expect(result.current.jsonOutput).toBe('');
      expect(result.current.codeOutput).toBe('');
      expect(result.current.generatedCode).toBe('');
    });

    it('should handle empty arrays', () => {
      const { result } = renderHook(() => useFlowState());

      act(() => {
        result.current.setDebugLogs([]);
        result.current.setAllNodes([]);
        result.current.setEdges([]);
      });

      expect(result.current.debugLogs).toEqual([]);
      expect(result.current.allNodes).toEqual([]);
      expect(result.current.edges).toEqual([]);
    });

    it('should handle empty objects', () => {
      const { result } = renderHook(() => useFlowState());

      act(() => {
        result.current.setDebugVariables({});
      });

      expect(result.current.debugVariables).toEqual({});
    });
  });
});
