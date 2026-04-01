import {
  setApiNodes,
  getApiNodes,
  getNodeTemplate,
  getAllNodeTemplates,
  getNodeTemplatesMap,
} from '../../../src/utils/Flow/nodeTemplateService';

// Mock expandFunctionNodes so we control what it returns
jest.mock('../../../src/utils/Flow/expandFunctionNodes', () => ({
  expandFunctionNodes: jest.fn((nodes: unknown[]) =>
    nodes.map((n: unknown) => {
      const node = n as {
        node_json: {
          node_type: string;
          label: string;
          mode?: string;
        };
      };
      return {
        type: node.node_json.node_type,
        nodeType: node.node_json.node_type,
        displayName: node.node_json.label,
        label: node.node_json.label,
        mode: node.node_json.mode,
      };
    })
  ),
}));

// Mock mapApiNodeToTemplate for getNodeTemplatesMap
jest.mock('../../../src/utils/Flow/apiNodeMapper', () => ({
  mapApiNodeToTemplate: jest.fn((node: {
    node_json: { node_type: string; label: string };
  }) => ({
    type: node.node_json?.node_type,
    displayName: node.node_json?.label,
  })),
}));

// ─── fixture ──────────────────────────────────────────────────────────────────

const makeRawNode = (nodeType: string, label: string) => ({
  id: Math.random(),
  tenant_id: 'tenant-1',
  created_by: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  node_json: {
    name: nodeType.toLowerCase(),
    node_type: nodeType,
    label,
    description: null,
    type: 'node',
    category: 'data',
    color: '#2196F3',
    handles: { source: true, target: true },
    inputs: [],
    code_template: '',
    default_data: {},
  },
});

// ─── tests ────────────────────────────────────────────────────────────────────

describe('nodeTemplateService (utils/Flow/nodeTemplateService)', () => {
  beforeEach(() => {
    setApiNodes([]);
  });

  // ─── setApiNodes / getApiNodes ───────────────────────────────────────────────

  describe('setApiNodes / getApiNodes', () => {
    it('should start with empty store', () => {
      expect(getApiNodes()).toEqual([]);
    });

    it('should persist nodes set via setApiNodes', () => {
      const nodes = [makeRawNode('SetVariable', 'Set Variable')];
      setApiNodes(nodes);
      expect(getApiNodes()).toHaveLength(1);
    });

    it('should replace store on each call to setApiNodes', () => {
      setApiNodes([makeRawNode('SetVariable', 'Set Variable')]);
      setApiNodes([makeRawNode('Log', 'Log Node'), makeRawNode('If', 'If Condition')]);
      expect(getApiNodes()).toHaveLength(2);
    });

    it('should return empty array after setApiNodes([])', () => {
      setApiNodes([makeRawNode('SetVariable', 'Set Variable')]);
      setApiNodes([]);
      expect(getApiNodes()).toEqual([]);
    });
  });

  // ─── getAllNodeTemplates ──────────────────────────────────────────────────────

  describe('getAllNodeTemplates', () => {
    it('should return empty array before any nodes are set', () => {
      expect(getAllNodeTemplates()).toEqual([]);
    });

    it('should return templates after nodes are set', () => {
      setApiNodes([makeRawNode('SetVariable', 'Set Variable')]);
      expect(getAllNodeTemplates()).toHaveLength(1);
    });

    it('should return all templates including multiple nodes', () => {
      setApiNodes([
        makeRawNode('SetVariable', 'Set Variable'),
        makeRawNode('Log', 'Log Node'),
      ]);
      expect(getAllNodeTemplates()).toHaveLength(2);
    });
  });

  // ─── getNodeTemplate ─────────────────────────────────────────────────────────

  describe('getNodeTemplate', () => {
    beforeEach(() => {
      setApiNodes([
        makeRawNode('SetVariable', 'Set Variable'),
        makeRawNode('Log', 'Log Node'),
      ]);
    });

    it('should find a template by nodeType', () => {
      const template = getNodeTemplate('SetVariable');
      expect(template).toBeDefined();
      expect(template?.type).toBe('SetVariable');
    });

    it('should return undefined for an unknown nodeType', () => {
      expect(getNodeTemplate('UnknownType')).toBeUndefined();
    });

    it('should find template by type field', () => {
      const template = getNodeTemplate('Log');
      expect(template).toBeDefined();
    });

    it('should find a template when mode is not specified', () => {
      const template = getNodeTemplate('SetVariable');
      expect(template).toBeDefined();
    });

    it('should find a template when mode is provided and matches', () => {
      setApiNodes([
        {
          ...makeRawNode('SetVariable', 'Set Variable'),
          node_json: {
            ...makeRawNode('SetVariable', 'Set Variable').node_json,
            mode: 'definition',
          },
        },
      ]);
      const template = getNodeTemplate('SetVariable', 'definition');
      expect(template).toBeDefined();
      expect(template?.mode).toBe('definition');
    });

    it('should return undefined when mode is provided but does not match', () => {
      setApiNodes([
        {
          ...makeRawNode('SetVariable', 'Set Variable'),
          node_json: {
            ...makeRawNode('SetVariable', 'Set Variable').node_json,
            mode: 'definition',
          },
        },
      ]);
      const template = getNodeTemplate('SetVariable', 'call');
      expect(template).toBeUndefined();
    });
  });

  // ─── getNodeTemplatesMap ──────────────────────────────────────────────────────

  describe('getNodeTemplatesMap', () => {
    it('should return empty object when no nodes set', () => {
      expect(getNodeTemplatesMap()).toEqual({});
    });

    it('should return map keyed by node_type', () => {
      setApiNodes([makeRawNode('SetVariable', 'Set Variable')]);
      const map = getNodeTemplatesMap();
      expect(map).toHaveProperty('SetVariable');
    });

    it('should include all node types', () => {
      setApiNodes([
        makeRawNode('SetVariable', 'Set Variable'),
        makeRawNode('Log', 'Log Node'),
      ]);
      const map = getNodeTemplatesMap();
      expect(Object.keys(map)).toEqual(expect.arrayContaining(['SetVariable', 'Log']));
    });
  });
});
