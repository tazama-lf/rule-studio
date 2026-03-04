import { renderHook } from '@testing-library/react';
import { useVariableTree } from '../../../src/hooks/RuleBuilder/useVariableTree';

describe('useVariableTree', () => {
  describe('Initialization', () => {
    it('should return empty array for null object', () => {
      const { result } = renderHook(() => useVariableTree({ obj: null }));

      expect(result.current).toEqual([]);
    });

    it('should return empty array for undefined object', () => {
      const { result } = renderHook(() => useVariableTree({ obj: undefined }));

      expect(result.current).toEqual([]);
    });

    it('should return empty array for primitive values', () => {
      const { result: stringResult } = renderHook(() => useVariableTree({ obj: 'string' }));
      const { result: numberResult } = renderHook(() => useVariableTree({ obj: 123 }));
      const { result: boolResult } = renderHook(() => useVariableTree({ obj: true }));

      expect(stringResult.current).toEqual([]);
      expect(numberResult.current).toEqual([]);
      expect(boolResult.current).toEqual([]);
    });
  });

  describe('Simple Objects', () => {
    it('should build tree for simple object with primitive values', () => {
      const obj = {
        name: 'John',
        age: 30,
        active: true,
      };

      const { result } = renderHook(() => useVariableTree({ obj }));

      expect(result.current).toHaveLength(3);
      expect(result.current[0]).toEqual({
        key: 'name',
        path: 'name',
        value: 'John',
        type: 'string',
        isDraggable: true,
      });
      expect(result.current[1]).toEqual({
        key: 'age',
        path: 'age',
        value: 30,
        type: 'number',
        isDraggable: true,
      });
      expect(result.current[2]).toEqual({
        key: 'active',
        path: 'active',
        value: true,
        type: 'boolean',
        isDraggable: true,
      });
    });

    it('should handle null values in object', () => {
      const obj = {
        name: 'John',
        deletedAt: null,
      };

      const { result } = renderHook(() => useVariableTree({ obj }));

      expect(result.current[1]).toEqual({
        key: 'deletedAt',
        path: 'deletedAt',
        value: null,
        type: 'null',
        isDraggable: true,
      });
    });
  });

  describe('Nested Objects', () => {
    it('should build tree for nested objects', () => {
      const obj = {
        user: {
          name: 'John',
          email: 'john@example.com',
        },
      };

      const { result } = renderHook(() => useVariableTree({ obj }));

      expect(result.current).toHaveLength(1);
      expect(result.current[0].key).toBe('user');
      expect(result.current[0].type).toBe('object');
      expect(result.current[0].children).toHaveLength(2);
      expect(result.current[0].children?.[0]).toEqual({
        key: 'name',
        path: 'user.name',
        value: 'John',
        type: 'string',
        isDraggable: true,
      });
    });

    it('should build tree for deeply nested objects', () => {
      const obj = {
        company: {
          department: {
            team: {
              member: 'Alice',
            },
          },
        },
      };

      const { result } = renderHook(() => useVariableTree({ obj }));

      const company = result.current[0];
      expect(company.children).toBeDefined();
      
      const department = company.children?.[0];
      expect(department?.path).toBe('company.department');
      expect(department?.children).toBeDefined();
      
      const team = department?.children?.[0];
      expect(team?.path).toBe('company.department.team');
      expect(team?.children).toBeDefined();
      
      const member = team?.children?.[0];
      expect(member?.path).toBe('company.department.team.member');
      expect(member?.value).toBe('Alice');
    });
  });

  describe('Arrays', () => {
    it('should build tree for arrays with primitive values', () => {
      const obj = {
        tags: ['javascript', 'typescript', 'react'],
      };

      const { result } = renderHook(() => useVariableTree({ obj }));

      expect(result.current[0].key).toBe('tags');
      expect(result.current[0].type).toBe('array');
      expect(result.current[0].children).toHaveLength(3);
      expect(result.current[0].children?.[0]).toEqual({
        key: '[0]',
        path: 'tags[0]',
        value: 'javascript',
        type: 'string',
        isDraggable: true,
      });
    });

    it('should build tree for arrays with objects', () => {
      const obj = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      };

      const { result } = renderHook(() => useVariableTree({ obj }));

      const users = result.current[0];
      expect(users.type).toBe('array');
      expect(users.children).toHaveLength(2);
      
      const firstUser = users.children?.[0];
      expect(firstUser?.path).toBe('users[0]');
      expect(firstUser?.type).toBe('object');
      expect(firstUser?.children).toHaveLength(2);
      expect(firstUser?.children?.[0].path).toBe('users[0].id');
    });

    it('should handle empty arrays', () => {
      const obj = {
        items: [],
      };

      const { result } = renderHook(() => useVariableTree({ obj }));

      expect(result.current[0].type).toBe('array');
      expect(result.current[0].children).toEqual([]);
    });

    it('should handle nested arrays', () => {
      const obj = {
        matrix: [[1, 2], [3, 4]],
      };

      const { result } = renderHook(() => useVariableTree({ obj }));

      const matrix = result.current[0];
      expect(matrix.type).toBe('array');
      expect(matrix.children).toHaveLength(2);

      const firstRow = matrix.children?.[0];
      expect(firstRow?.path).toBe('matrix[0]');
    });
  });

  describe('Parent Path', () => {
    it('should use parentPath when provided', () => {
      const obj = {
        name: 'John',
      };

      const { result } = renderHook(() => useVariableTree({ obj, parentPath: 'user' }));

      expect(result.current[0].path).toBe('user.name');
    });

    it('should handle empty parentPath', () => {
      const obj = {
        name: 'John',
      };

      const { result } = renderHook(() => useVariableTree({ obj, parentPath: '' }));

      expect(result.current[0].path).toBe('name');
    });

    it('should build nested paths with parentPath', () => {
      const obj = {
        profile: {
          email: 'john@example.com',
        },
      };

      const { result } = renderHook(() => useVariableTree({ obj, parentPath: 'user' }));

      expect(result.current[0].path).toBe('user.profile');
      expect(result.current[0].children?.[0].path).toBe('user.profile.email');
    });
  });

  describe('useMemo Optimization', () => {
    it('should memoize result when obj and parentPath do not change', () => {
      const obj = { name: 'John' };
      
      const { result, rerender } = renderHook(
        ({ data, path }) => useVariableTree({ obj: data, parentPath: path }),
        { initialProps: { data: obj, path: '' } }
      );

      const firstResult = result.current;

      rerender({ data: obj, path: '' });

      expect(result.current).toBe(firstResult);
    });

    it('should recompute when obj changes', () => {
      const { result, rerender } = renderHook(
        ({ data }) => useVariableTree({ obj: data }),
        { initialProps: { data: { name: 'John' } } }
      );

      const firstResult = result.current;

      rerender({ data: { name: 'Jane' } });

      expect(result.current).not.toBe(firstResult);
      expect(result.current[0].value).toBe('Jane');
    });

    it('should recompute when parentPath changes', () => {
      const obj = { name: 'John' };
      
      const { result, rerender } = renderHook(
        ({ path }) => useVariableTree({ obj, parentPath: path }),
        { initialProps: { path: 'user' } }
      );

      expect(result.current[0].path).toBe('user.name');

      rerender({ path: 'admin' });

      expect(result.current[0].path).toBe('admin.name');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty object', () => {
      const { result } = renderHook(() => useVariableTree({ obj: {} }));

      expect(result.current).toEqual([]);
    });

    it('should handle complex mixed structure', () => {
      const obj = {
        id: 1,
        name: 'User',
        settings: {
          theme: 'dark',
          notifications: true,
        },
        roles: ['admin', 'user'],
        metadata: null,
      };

      const { result } = renderHook(() => useVariableTree({ obj }));

      expect(result.current).toHaveLength(5);
      expect(result.current.find(n => n.key === 'id')?.type).toBe('number');
      expect(result.current.find(n => n.key === 'settings')?.type).toBe('object');
      expect(result.current.find(n => n.key === 'roles')?.type).toBe('array');
      expect(result.current.find(n => n.key === 'metadata')?.type).toBe('null');
    });

    it('should set isDraggable to true for all nodes', () => {
      const obj = {
        user: {
          name: 'John',
          tags: ['admin'],
        },
      };

      const { result } = renderHook(() => useVariableTree({ obj }));

      const checkDraggable = (nodes: any[]): boolean => {
        return nodes.every(node => {
          const isDraggable = node.isDraggable === true;
          const childrenDraggable = node.children ? checkDraggable(node.children) : true;
          return isDraggable && childrenDraggable;
        });
      };

      expect(checkDraggable(result.current)).toBe(true);
    });
  });
});
