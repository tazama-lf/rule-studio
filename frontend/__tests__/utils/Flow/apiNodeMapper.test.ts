import {
  mapApiNodeToTemplate,
  mapApiNodesToTemplates,
  mapApiNodesToArray,
} from '../../../src/utils/Flow/apiNodeMapper';
import type { ApiNode } from '../../../src/utils/Flow/apiNodeMapper';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const makeApiNode = (overrides: Partial<ApiNode['node_json']> = {}, id = 1): ApiNode => ({
  id,
  tenant_id: 'tenant-1',
  created_by: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  node_json: {
    name: 'my_node',
    node_type: 'SetVariable',
    label: 'Set Variable',
    description: 'Sets a variable',
    type: 'node',
    category: 'data',
    color: '#2196F3',
    handles: { source: true, target: true },
    inputs: [
      { key: 'name', label: 'Variable Name', type: 'text', defaultValue: 'myVar' },
    ],
    code_template: 'const ${params.name} = ${params.value};',
    default_data: {},
    ...overrides,
  },
});

// ─── mapApiNodeToTemplate ─────────────────────────────────────────────────────

describe('mapApiNodeToTemplate', () => {
  describe('Basic field mapping', () => {
    it('should map node_type to type', () => {
      expect(mapApiNodeToTemplate(makeApiNode()).type).toBe('SetVariable');
    });

    it('should map label to displayName', () => {
      expect(mapApiNodeToTemplate(makeApiNode()).displayName).toBe('Set Variable');
    });

    it('should map label to label', () => {
      expect(mapApiNodeToTemplate(makeApiNode()).label).toBe('Set Variable');
    });

    it('should map description when present', () => {
      expect(mapApiNodeToTemplate(makeApiNode()).description).toBe('Sets a variable');
    });

    it('should default description to empty string when null', () => {
      const node = makeApiNode({ description: null });
      expect(mapApiNodeToTemplate(node).description).toBe('');
    });

    it('should map color', () => {
      expect(mapApiNodeToTemplate(makeApiNode()).color).toBe('#2196F3');
    });

    it('should map handles', () => {
      const result = mapApiNodeToTemplate(makeApiNode());
      expect(result.handles).toEqual({ source: true, target: true });
    });

    it('should map code_template', () => {
      expect(mapApiNodeToTemplate(makeApiNode()).code_template).toBeDefined();
    });
  });

  describe('isFunction flag', () => {
    it('should set isFunction to false for type "node"', () => {
      expect(mapApiNodeToTemplate(makeApiNode({ type: 'node' })).isFunction).toBe(false);
    });

    it('should set isFunction to true for type "function"', () => {
      expect(mapApiNodeToTemplate(makeApiNode({ type: 'function' })).isFunction).toBe(true);
    });
  });

  describe('isPredefined flag', () => {
    it('should default isPredefined to false when not set', () => {
      expect(mapApiNodeToTemplate(makeApiNode()).isPredefined).toBe(false);
    });

    it('should honour isPredefined = true', () => {
      expect(mapApiNodeToTemplate(makeApiNode({ isPredefined: true })).isPredefined).toBe(true);
    });
  });

  describe('inputs mapping', () => {
    it('should convert inputs array', () => {
      const result = mapApiNodeToTemplate(makeApiNode());
      expect(result.inputs).toHaveLength(1);
    });

    it('should convert defaultValue to string', () => {
      const result = mapApiNodeToTemplate(makeApiNode());
      expect(result.inputs?.[0]?.defaultValue).toBe('myVar');
    });

    it('should set defaultValue to empty string when null/undefined', () => {
      const node = makeApiNode({
        inputs: [{ key: 'k', label: 'K', type: 'text' }],
      });
      expect(mapApiNodeToTemplate(node).inputs?.[0]?.defaultValue).toBe('');
    });

    it('should set defaultValue to empty string when explicitly null', () => {
      const node = makeApiNode({
        inputs: [{ key: 'k', label: 'K', type: 'text', defaultValue: null as unknown as string }],
      });
      expect(mapApiNodeToTemplate(node).inputs?.[0]?.defaultValue).toBe('');
    });

    it('should default required to false when not specified', () => {
      const result = mapApiNodeToTemplate(makeApiNode());
      expect(result.inputs?.[0]?.required).toBe(false);
    });

    it('should return empty inputs array when inputs undefined', () => {
      const node: ApiNode = {
        ...makeApiNode(),
        node_json: { ...makeApiNode().node_json, inputs: undefined as unknown as [] },
      };
      expect(mapApiNodeToTemplate(node).inputs).toEqual([]);
    });
  });

  describe('bgColor mapping', () => {
    it('should map #2196F3 to blue bg class', () => {
      expect(mapApiNodeToTemplate(makeApiNode({ color: '#2196F3' })).bgColor).toContain('blue');
    });

    it('should map #4CAF50 to green bg class', () => {
      expect(mapApiNodeToTemplate(makeApiNode({ color: '#4CAF50' })).bgColor).toContain('green');
    });

    it('should fall back to gray for unknown colour', () => {
      expect(mapApiNodeToTemplate(makeApiNode({ color: '#000001' })).bgColor).toContain('gray');
    });
  });

  describe('visible_on_canvas', () => {
    it('should use provided visible_on_canvas when set', () => {
      const result = mapApiNodeToTemplate(makeApiNode({ visible_on_canvas: ['main'] }));
      expect(result.visible_on_canvas).toEqual(['main']);
    });

    it('should default non-function nodes to ["main","nested"]', () => {
      const result = mapApiNodeToTemplate(makeApiNode({ type: 'node' }));
      expect(result.visible_on_canvas).toEqual(['main', 'nested']);
    });

    it('should default function nodes to ["nested"] when not in test_case_generation', () => {
      const result = mapApiNodeToTemplate(makeApiNode({ type: 'function', category: 'logic' }));
      expect(result.visible_on_canvas).toEqual(['nested']);
    });

    it('should use ["main","nested"] for test_case_generation function nodes', () => {
      const result = mapApiNodeToTemplate(
        makeApiNode({ type: 'function', category: 'test_case_generation' })
      );
      expect(result.visible_on_canvas).toEqual(['main', 'nested']);
    });
  });
});

// ─── mapApiNodesToTemplates ───────────────────────────────────────────────────

describe('mapApiNodesToTemplates', () => {
  it('should return a record keyed by node_type', () => {
    const result = mapApiNodesToTemplates([makeApiNode()]);
    expect(result).toHaveProperty('SetVariable');
  });

  it('should keep the most recent node when there are duplicates', () => {
    const older = makeApiNode({}, 1);
    const newer: ApiNode = { ...makeApiNode({ label: 'Updated Label' }, 2), updated_at: '2025-01-01T00:00:00Z' };
    const result = mapApiNodesToTemplates([older, newer]);
    expect(result['SetVariable'].displayName).toBe('Updated Label');
  });

  it('should handle multiple distinct node types', () => {
    const node2 = makeApiNode({ node_type: 'Log', label: 'Log Node' });
    const result = mapApiNodesToTemplates([makeApiNode(), node2]);
    expect(Object.keys(result)).toEqual(expect.arrayContaining(['SetVariable', 'Log']));
  });

  it('should return empty object for empty array', () => {
    expect(mapApiNodesToTemplates([])).toEqual({});
  });

  it('should keep existing newer node when an older duplicate appears later in input', () => {
    const newer: ApiNode = { ...makeApiNode({ label: 'Newest Label' }, 1), updated_at: '2025-12-01T00:00:00Z' };
    const older: ApiNode = { ...makeApiNode({ label: 'Older Label' }, 2), updated_at: '2024-01-01T00:00:00Z' };
    const result = mapApiNodesToTemplates([newer, older]);
    expect(result['SetVariable'].displayName).toBe('Newest Label');
  });
});

// ─── mapApiNodesToArray ───────────────────────────────────────────────────────

describe('mapApiNodesToArray', () => {
  it('should return an array of NodeTemplates', () => {
    const result = mapApiNodesToArray([makeApiNode()]);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
  });

  it('should deduplicate by node_type, keeping most recent', () => {
    const older = makeApiNode({ label: 'Old Label' }, 1);
    const newer: ApiNode = {
      ...makeApiNode({ label: 'New Label' }, 2),
      updated_at: '2025-06-01T00:00:00Z',
    };
    const result = mapApiNodesToArray([older, newer]);
    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe('New Label');
  });

  it('should return empty array for empty input', () => {
    expect(mapApiNodesToArray([])).toEqual([]);
  });

  it('should preserve node type info on each template', () => {
    const result = mapApiNodesToArray([makeApiNode()]);
    expect(result[0].type).toBe('SetVariable');
  });

  it('should keep newer template when older duplicate comes after it', () => {
    const newer: ApiNode = { ...makeApiNode({ label: 'Newer First' }, 1), updated_at: '2026-01-01T00:00:00Z' };
    const older: ApiNode = { ...makeApiNode({ label: 'Older Second' }, 2), updated_at: '2023-01-01T00:00:00Z' };
    const result = mapApiNodesToArray([newer, older]);
    expect(result).toHaveLength(1);
    expect(result[0].displayName).toBe('Newer First');
  });
});
