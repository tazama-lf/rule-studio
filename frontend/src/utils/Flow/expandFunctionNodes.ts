import type { NodeTemplate } from '../../hooks/RuleBuilder/useNodePalette';

interface ApiNodeJson {
  node_type: string;
  type: string;
  label: string;
  color: string;
  description?: string | null;
  category: string;
  isPredefined?: boolean;
  inputs?: unknown[];
  handles?: { source: boolean; target: boolean };
  code_template?: string;
  function_name?: string;
  modes?: {
    definition?: {
      visible_on_canvas: string[];
      label: string;
      inputs: unknown[];
      handles: { source: boolean; target: boolean };
      code_template: string;
      parameters?: Array<{ name: string; type: string; label: string }>;
    };
    call?: {
      visible_on_canvas: string[];
      label: string;
      inputs: unknown[];
      handles: { source: boolean; target: boolean };
      call_template: string;
      useDefinitionParameters?: boolean;
    };
  };
}

interface ApiNode {
  id: number;
  node_json: ApiNodeJson;
  tenant_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const expandFunctionNodes = (apiNodes: ApiNode[]): NodeTemplate[] => {
  const expanded: NodeTemplate[] = [];

  apiNodes.forEach((apiNode) => {
    const nodeJson = apiNode.node_json;

    if (nodeJson.type === 'function' && nodeJson.modes) {
      if (nodeJson.modes.definition) {
        const defMode = nodeJson.modes.definition;
        expanded.push({
          type: nodeJson.node_type,
          nodeType: nodeJson.node_type,
          label: defMode.label,
          displayName: defMode.label,
          description: nodeJson.description || '',
          color: nodeJson.color,
          bgColor: getBgColorFromHex(nodeJson.color),
          isFunction: true,
          mode: 'definition',
          generation_type: 'definition',
          visible_on_canvas: defMode.visible_on_canvas,
          function_name: nodeJson.function_name,
          inputs: defMode.inputs as NodeTemplate['inputs'],
          handles: defMode.handles,
          code_template: defMode.code_template,
          parameters: defMode.parameters,
        });
      }

      if (nodeJson.modes.call) {
        const callMode = nodeJson.modes.call;
        expanded.push({
          type: nodeJson.node_type,
          nodeType: nodeJson.node_type,
          label: callMode.label,
          displayName: callMode.label,
          description: nodeJson.description || '',
          color: nodeJson.color,
          bgColor: getBgColorFromHex(nodeJson.color),
          isFunction: true,
          mode: 'call',
          generation_type: 'call',
          visible_on_canvas: callMode.visible_on_canvas,
          function_name: nodeJson.function_name,
          inputs: callMode.inputs as NodeTemplate['inputs'],
          handles: callMode.handles,
          call_template: callMode.call_template,
          useDefinitionParameters: callMode.useDefinitionParameters,
        });
      }
    } else {
      // Determine visible_on_canvas based on type and category
      let visibleOn: string[];
      if (nodeJson.type === 'function') {
        // Function nodes in test_case_generation should be visible on main canvas
        if (nodeJson.category === 'test_case_generation') {
          visibleOn = ['main', 'nested'];
        } else {
          visibleOn = ['nested'];
        }
      } else {
        visibleOn = ['main', 'nested'];
      }

      expanded.push({
        type: nodeJson.node_type,
        nodeType: nodeJson.node_type,
        label: nodeJson.label,
        displayName: nodeJson.label,
        description: nodeJson.description || '',
        color: nodeJson.color,
        bgColor: getBgColorFromHex(nodeJson.color),
        isFunction: nodeJson.type === 'function',
        isPredefined: nodeJson.isPredefined || false,
        visible_on_canvas: visibleOn,
        inputs: nodeJson.inputs as NodeTemplate['inputs'],
        handles: nodeJson.handles || { source: true, target: true },
        code_template: nodeJson.code_template,
      });
    }
  });

  return expanded;
};

const getBgColorFromHex = (hexColor: string): string => {
  const colorMap: Record<string, string> = {
    '#4CAF50': 'bg-green-50 border-green-400',
    '#F44336': 'bg-red-50 border-red-400',
    '#2196F3': 'bg-blue-50 border-blue-400',
    '#FF9800': 'bg-yellow-50 border-yellow-400',
    '#FFC107': 'bg-amber-50 border-amber-400',
    '#9C27B0': 'bg-purple-50 border-purple-400',
    '#00BCD4': 'bg-cyan-50 border-cyan-400',
    '#607D8B': 'bg-slate-50 border-slate-400',
    '#E91E63': 'bg-pink-50 border-pink-400',
    '#3F51B5': 'bg-indigo-50 border-indigo-400',
    '#009688': 'bg-teal-50 border-teal-400',
    '#795548': 'bg-amber-50 border-amber-400',
    '#673AB7': 'bg-purple-50 border-purple-400',
    '#FF5722': 'bg-orange-50 border-orange-400',
    '#8BC34A': 'bg-lime-50 border-lime-400',
    '#9E9E9E': 'bg-gray-50 border-gray-400',
  };

  return colorMap[hexColor] || 'bg-gray-50 border-gray-400';
};
