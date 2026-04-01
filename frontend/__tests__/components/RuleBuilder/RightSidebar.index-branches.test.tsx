import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { Node } from '@xyflow/react';
import RightSidebar from '../../../src/components/RuleBuilder/RightSidebar';

let latestTernaryParamChange: ((key: string, value: string) => void) | null = null;

const templates: Record<string, Record<string, unknown>> = {
  SetVariable: {
    displayName: 'Set Variable',
    type: 'SetVariable',
    inputs: [{ key: 'name', label: 'Variable Name', type: 'text', required: true }],
  },
  CustomFunction: {
    displayName: 'Custom Function',
    type: 'CustomFunction',
    inputs: [{ key: 'function_name', label: 'Function Name', type: 'text', required: true }],
  },
  If: {
    displayName: 'If',
    type: 'If',
    inputs: [],
  },
  Ternary: {
    displayName: 'Ternary',
    type: 'Ternary',
    inputs: [],
  },
  RuleRequestFactory: {
    displayName: 'Rule Request Factory',
    type: 'RuleRequestFactory',
    inputs: [{ key: 'factoryName', label: 'Factory Name', type: 'text', required: true }],
  },
  RuleResultFactory: {
    displayName: 'Rule Result Factory',
    type: 'RuleResultFactory',
    inputs: [{ key: 'factoryName', label: 'Factory Name', type: 'text', required: true }],
  },
  BeforeEach: {
    displayName: 'Before Each',
    type: 'BeforeEach',
    inputs: [],
  },
  BeforeAll: {
    displayName: 'Before All',
    type: 'BeforeAll',
    inputs: [],
  },
};

jest.mock('../../../src/redux/Api/Rule-builder', () => ({
  useGetNodesQuery: () => ({ data: [], isLoading: false, error: null, refetch: jest.fn() }),
  useGetFlowQuery: () => ({ data: null, isLoading: false, error: null }),
  useGetGlobalVariablesQuery: () => ({ data: null, isLoading: false, error: null }),
  useSaveFlowMutation: () => [jest.fn(), { isLoading: false }],
  useExecuteQueryMutation: () => [jest.fn(), { isLoading: false }],
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: jest.fn(),
    success: jest.fn(),
    loading: jest.fn(),
    custom: jest.fn(),
  },
}));

jest.mock('../../../src/utils/Flow/nodeTemplateService', () => ({
  getNodeTemplate: (nodeType: string) => templates[nodeType] || null,
}));

jest.mock('../../../src/utils/Flow/functionParameterUtils', () => ({
  usesDynamicParameters: jest.fn(() => false),
}));

jest.mock('../../../src/utils/Flow/transformRuleRequest', () => ({
  transformRuleRequestToCode: (input: unknown) => `request:${JSON.stringify(input)}`,
}));

jest.mock('../../../src/utils/Flow/transformRuleResult', () => ({
  transformRuleResultToCode: (input: unknown) => `result:${JSON.stringify(input)}`,
}));

jest.mock('../../../src/hooks/RuleBuilder/useNodeValidation', () => ({
  __mockValidate: jest.fn(),
  useNodeValidation: () => ({
    validate: (jest.requireMock('../../../src/hooks/RuleBuilder/useNodeValidation') as { __mockValidate: jest.Mock }).__mockValidate,
    getFieldError: () => undefined,
  }),
}));

jest.mock('../../../src/hooks/RuleBuilder/useTernaryConditions', () => ({
  useTernaryConditions: ({
    currentParams,
    onParamChange,
  }: {
    currentParams: Record<string, string>;
    onParamChange: (key: string, value: string) => void;
  }) => {
    latestTernaryParamChange = onParamChange;

    return {
      ternaryTree: currentParams.ternaryTree ? JSON.parse(currentParams.ternaryTree) : { condition: 'base' },
      handleTreeChange: () => onParamChange('ternaryTree', '{"condition":"changed"}'),
      handleStoreResultChange: () => onParamChange('storeResult', 'false'),
      handleResultVarChange: () => onParamChange('resultVar', 'ternaryOutput'),
    };
  },
}));

jest.mock('../../../src/components/RuleBuilder/RightSidebar/components', () => {
  const ReactModule = require('react') as typeof React;

  return {
    NodeHeader: ({ templateDisplayName }: { templateDisplayName: string }) => <div>{templateDisplayName}</div>,
    BasicPropertiesSection: ({
      currentLabel,
      onLabelChange,
      onLabelBlur,
    }: {
      currentLabel: string;
      onLabelChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
      onLabelBlur: () => void;
    }) => (
      <div>
        <input aria-label="label" value={currentLabel} onChange={onLabelChange} onBlur={onLabelBlur} readOnly />
      </div>
    ),
    IfConditionEditor: ({
      onConditionChange,
      onAddElseIf,
      onAddElse,
      onRemoveCondition,
      onDragOver,
    }: {
      onConditionChange: (index: number, newCondition: string) => void;
      onAddElseIf: () => void;
      onAddElse: () => void;
      onRemoveCondition: (index: number) => void;
      onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
    }) => (
      <div>
        <button onClick={() => onConditionChange(0, 'amount > 200')}>change-condition</button>
        <button onClick={onAddElseIf}>add-elseif</button>
        <button onClick={onAddElse}>add-else</button>
        <button onClick={() => onRemoveCondition(1)}>remove-condition</button>
        <button
          onClick={() =>
            onDragOver({
              preventDefault: jest.fn(),
              dataTransfer: { dropEffect: 'none' } as unknown as DataTransfer,
            } as unknown as React.DragEvent<HTMLDivElement>)
          }
        >
          drag-over
        </button>
      </div>
    ),
    TernaryConditionEditor: ({
      onTreeChange,
      onStoreResultChange,
      onResultVarChange,
      onDragOver,
    }: {
      onTreeChange: () => void;
      onStoreResultChange: () => void;
      onResultVarChange: () => void;
      onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
    }) => (
      <div>
        <button onClick={onTreeChange}>change-tree</button>
        <button onClick={onStoreResultChange}>change-store-result</button>
        <button onClick={onResultVarChange}>change-result-var</button>
        <button
          onClick={() =>
            onDragOver({
              preventDefault: jest.fn(),
              dataTransfer: { dropEffect: 'none' } as unknown as DataTransfer,
            } as unknown as React.DragEvent<HTMLDivElement>)
          }
        >
          ternary-drag-over
        </button>
      </div>
    ),
    ParameterSection: ({
      onParamChange,
      onParamBlur,
      onDrop,
      onDragOver,
      inputRefs,
    }: {
      onParamChange: (paramKey: string) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
      onParamBlur: (shouldForceSave?: boolean, overrideParams?: Record<string, string>) => void;
      onDrop: (paramKey: string) => (event: React.DragEvent<HTMLDivElement>) => void;
      onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
      inputRefs: React.MutableRefObject<Record<string, HTMLInputElement | HTMLTextAreaElement>>;
    }) => {
      const triggerChange = (value: string, multiUpdate?: string) => {
        const target = {
          value,
          selectionStart: 1,
          selectionEnd: 2,
          dataset: multiUpdate ? { multiUpdate } : undefined,
        } as unknown as HTMLInputElement & { dataset?: { multiUpdate?: string } };

        onParamChange('name')({ target } as React.ChangeEvent<HTMLInputElement>);
      };

      const buildDropEvent = (variablePath: string) => ({
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: () => variablePath,
          dropEffect: 'none',
        } as unknown as DataTransfer,
      }) as unknown as React.DragEvent<HTMLDivElement>;

      return (
        <div>
          <button onClick={() => triggerChange('updated-name')}>param-change</button>
          <button onClick={() => triggerChange('merged-name', '{"name":"merged-name","extra":"extra-value"}')}>param-multi</button>
          <button onClick={() => triggerChange('fallback-name', 'not-json')}>param-multi-invalid</button>
          <button onClick={() => onParamBlur(true, { saved: 'true' })}>param-blur</button>
          <button
            onClick={() => {
              inputRefs.current.name = {
                selectionStart: 1,
                selectionEnd: 3,
                setSelectionRange: jest.fn(),
                focus: jest.fn(),
              } as unknown as HTMLInputElement;
              onDrop('name')(buildDropEvent('{{ RuleRequest.id }}'));
            }}
          >
            drop-with-input
          </button>
          <button
            onClick={() => {
              delete inputRefs.current.name;
              onDrop('name')(buildDropEvent('{{ RuleConfig.value }}'));
            }}
          >
            drop-without-input
          </button>
          <button
            onClick={() =>
              onDragOver({
                preventDefault: jest.fn(),
                dataTransfer: { dropEffect: 'none' } as unknown as DataTransfer,
              } as unknown as React.DragEvent<HTMLDivElement>)
            }
          >
            param-drag-over
          </button>
        </div>
      );
    },
    FunctionCallSection: () => <div>Function Call</div>,
    ParameterConfigSection: ({
      onDirectUpdate,
      onParamBlur,
    }: {
      onDirectUpdate: (updatedParams: Record<string, string>) => void;
      onParamBlur: (shouldForceSave?: boolean, overrideParams?: Record<string, string>) => void;
    }) => (
      <div>
        <button onClick={() => onDirectUpdate({ code_template: 'return 1;', function_name: 'sum' })}>direct-update</button>
        <button onClick={() => onParamBlur(false)}>config-blur</button>
      </div>
    ),
    FetchDBSection: () => <div>FetchDB</div>,
  };
});

jest.mock('../../../src/components/RuleBuilder/RightSidebar/components/CodeEditorDialog', () => ({
  CodeEditorDialog: ({
    open,
    title,
    value,
    onChange,
    onSave,
    onClose,
  }: {
    open: boolean;
    title: string;
    value: string;
    onChange: (value: string) => void;
    onSave: () => void;
    onClose: () => void;
  }) =>
    open ? (
      <div role="dialog">
        <div>{title}</div>
        <div>{value}</div>
        <button onClick={() => onChange(`${value}// edited`)}>change-dialog-code</button>
        <button onClick={onSave}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

jest.mock('../../../src/components/RuleBuilder/RightSidebar/components/NodeSections', () => ({
  BeforeEachSection: ({ onEdit }: { onEdit: () => void }) => <button onClick={onEdit}>edit-before-each</button>,
  BeforeAllSection: ({ onEdit }: { onEdit: () => void }) => <button onClick={onEdit}>edit-before-all</button>,
}));

describe('RightSidebar index branches', () => {
  const mockValidate = (jest.requireMock('../../../src/hooks/RuleBuilder/useNodeValidation') as { __mockValidate: jest.Mock }).__mockValidate;
  const mockToastError = (jest.requireMock('react-hot-toast') as { default: { error: jest.Mock } }).default.error;

  const baseNode: Node = {
    id: 'node-1',
    type: 'editableNode',
    position: { x: 0, y: 0 },
    data: {
      label: 'Base Node',
      nodeType: 'SetVariable',
      params: { name: 'initial-name' },
    },
  };

  const defaultProps = {
    selectedNode: baseNode,
    onClose: jest.fn(),
    onUpdateNode: jest.fn(),
    allNodes: [],
    viewOnly: false,
    ruleId: 'rule-1',
    edges: [],
    updateNodeInternals: jest.fn(),
  };

  const renderSidebar = (props: Partial<typeof defaultProps> = {}) => render(<RightSidebar {...defaultProps} {...props} />);

  beforeEach(() => {
    jest.clearAllMocks();
    latestTernaryParamChange = null;
    window.globalVariablesData = undefined;
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('handles direct updates and explicit param blur from ParameterConfigSection', () => {
    const onUpdateNode = jest.fn();
    const functionNode: Node = {
      ...baseNode,
      data: {
        label: 'Function Definition',
        nodeType: 'CustomFunction',
        mode: 'definition',
        params: { function_name: 'sum' },
      },
    };

    renderSidebar({ selectedNode: functionNode, onUpdateNode });

    fireEvent.click(screen.getByRole('button', { name: 'direct-update' }));
    fireEvent.click(screen.getByRole('button', { name: 'config-blur' }));

    expect(onUpdateNode).toHaveBeenCalledWith('node-1', {
      params: { code_template: 'return 1;', function_name: 'sum' },
    });
    expect(mockValidate).toHaveBeenCalledWith({ code_template: 'return 1;', function_name: 'sum' });
  });

  it('handles parameter changes, blur, drag over, and both drop paths', () => {
    const onUpdateNode = jest.fn();
    renderSidebar({ onUpdateNode });

    fireEvent.click(screen.getByRole('button', { name: 'param-change' }));
    fireEvent.click(screen.getByRole('button', { name: 'param-multi' }));
    fireEvent.click(screen.getByRole('button', { name: 'param-multi-invalid' }));
    fireEvent.click(screen.getByRole('button', { name: 'param-blur' }));
    fireEvent.click(screen.getByRole('button', { name: 'param-drag-over' }));
    fireEvent.click(screen.getByRole('button', { name: 'drop-with-input' }));
    fireEvent.click(screen.getByRole('button', { name: 'drop-without-input' }));

    act(() => {
      jest.runAllTimers();
    });

    expect(onUpdateNode).toHaveBeenCalledWith('node-1', { params: { saved: 'true' } }, true);
    expect(onUpdateNode).toHaveBeenCalledWith('node-1', {
      params: expect.objectContaining({ name: expect.stringContaining('RuleConfig.value') }),
    });
  });

  it('flushes scheduled param updates and validation when changes are not interrupted', () => {
    const onUpdateNode = jest.fn();

    renderSidebar({ onUpdateNode });

    fireEvent.click(screen.getByRole('button', { name: 'param-change' }));

    act(() => {
      jest.runAllTimers();
    });

    expect(onUpdateNode).toHaveBeenCalledWith('node-1', {
      params: expect.objectContaining({ name: 'updated-name' }),
    });
    expect(mockValidate).toHaveBeenCalledWith(expect.objectContaining({ name: 'updated-name' }));
  });

  it('clears pending param timers before a direct update on the same node id', () => {
    const onUpdateNode = jest.fn();
    const { rerender } = renderSidebar({ onUpdateNode });

    fireEvent.click(screen.getByRole('button', { name: 'param-change' }));

    rerender(
      <RightSidebar
        {...defaultProps}
        onUpdateNode={onUpdateNode}
        selectedNode={{
          ...baseNode,
          data: {
            label: 'Function Definition',
            nodeType: 'CustomFunction',
            mode: 'definition',
            params: { function_name: 'sum' },
          },
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'direct-update' }));

    act(() => {
      jest.runAllTimers();
    });

    expect(onUpdateNode).toHaveBeenCalledWith('node-1', {
      params: { code_template: 'return 1;', function_name: 'sum' },
    });
    expect(mockValidate).toHaveBeenCalledWith({ code_template: 'return 1;', function_name: 'sum' });
  });

  it('clears scheduled updates when the selected node changes', () => {
    const onUpdateNode = jest.fn();
    const { rerender } = renderSidebar({ onUpdateNode });

    fireEvent.click(screen.getByRole('button', { name: 'param-change' }));

    rerender(
      <RightSidebar
        {...defaultProps}
        onUpdateNode={onUpdateNode}
        selectedNode={{
          ...baseNode,
          id: 'node-2',
          data: { label: 'Second Node', nodeType: 'SetVariable', params: { name: 'second' } },
        }}
      />
    );

    act(() => {
      jest.runAllTimers();
    });

    expect(onUpdateNode).not.toHaveBeenCalledWith('node-1', { params: expect.objectContaining({ name: 'updated-name' }) });
  });

  it('handles if condition updates, else insertion, else-if insertion, and removal', () => {
    const onUpdateNode = jest.fn();
    const updateNodeInternals = jest.fn();
    const ifNode: Node = {
      ...baseNode,
      data: {
        label: 'If Node',
        nodeType: 'If',
        params: {
          conditions: JSON.stringify([
            { type: 'if', condition: 'x > 1' },
            { type: 'else', condition: '' },
          ]),
        },
      },
    };

    renderSidebar({ selectedNode: ifNode, onUpdateNode, updateNodeInternals });

    fireEvent.click(screen.getByRole('button', { name: 'change-condition' }));
    fireEvent.click(screen.getByRole('button', { name: 'add-elseif' }));
    fireEvent.click(screen.getByRole('button', { name: 'add-else' }));
    fireEvent.click(screen.getByRole('button', { name: 'remove-condition' }));
    fireEvent.click(screen.getByRole('button', { name: 'drag-over' }));

    act(() => {
      jest.runAllTimers();
    });

    expect(onUpdateNode).toHaveBeenCalled();
    expect(updateNodeInternals).toHaveBeenCalledWith('node-1');
    expect(mockValidate).toHaveBeenCalled();
  });

  it('runs scheduled if-condition updates after replacing pending timeouts', () => {
    const onUpdateNode = jest.fn();
    const ifNode: Node = {
      ...baseNode,
      data: {
        label: 'If Node',
        nodeType: 'If',
        params: {
          conditions: JSON.stringify([{ type: 'if', condition: 'x > 1' }]),
        },
      },
    };

    renderSidebar({ selectedNode: ifNode, onUpdateNode });

    fireEvent.click(screen.getByRole('button', { name: 'change-condition' }));
    fireEvent.click(screen.getByRole('button', { name: 'change-condition' }));

    act(() => {
      jest.runAllTimers();
    });

    expect(onUpdateNode).toHaveBeenCalled();
    expect(mockValidate).toHaveBeenCalled();
  });

  it('handles adding else when no else exists', () => {
    const onUpdateNode = jest.fn();
    const updateNodeInternals = jest.fn();
    const ifNode: Node = {
      ...baseNode,
      data: {
        label: 'If Node',
        nodeType: 'If',
        params: {
          conditions: JSON.stringify([{ type: 'if', condition: 'x > 1' }]),
        },
      },
    };

    renderSidebar({ selectedNode: ifNode, onUpdateNode, updateNodeInternals });

    fireEvent.click(screen.getByRole('button', { name: 'change-condition' }));
    fireEvent.click(screen.getByRole('button', { name: 'add-else' }));

    act(() => {
      jest.runAllTimers();
    });

    expect(onUpdateNode).toHaveBeenCalled();
    expect(updateNodeInternals).toHaveBeenCalledWith('node-1');
  });

  it('handles adding else-if when no else exists', () => {
    const onUpdateNode = jest.fn();
    const ifNode: Node = {
      ...baseNode,
      data: {
        label: 'If Node',
        nodeType: 'If',
        params: {
          conditions: JSON.stringify([{ type: 'if', condition: 'x > 1' }]),
        },
      },
    };

    renderSidebar({ selectedNode: ifNode, onUpdateNode });

    fireEvent.click(screen.getByRole('button', { name: 'add-elseif' }));

    act(() => {
      jest.runAllTimers();
    });

    expect(onUpdateNode).toHaveBeenCalled();
    expect(mockValidate).toHaveBeenCalled();
  });

  it('handles ternary updates through the hook callbacks', () => {
    const onUpdateNode = jest.fn();
    const ternaryNode: Node = {
      ...baseNode,
      data: {
        label: 'Ternary Node',
        nodeType: 'Ternary',
        params: { ternaryTree: '{"condition":"initial"}', resultVar: 'initialResult' },
      },
    };

    renderSidebar({ selectedNode: ternaryNode, onUpdateNode });

    expect(latestTernaryParamChange).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'change-tree' }));
    fireEvent.click(screen.getByRole('button', { name: 'change-store-result' }));
    fireEvent.click(screen.getByRole('button', { name: 'change-result-var' }));
    fireEvent.click(screen.getByRole('button', { name: 'ternary-drag-over' }));

    act(() => {
      jest.runAllTimers();
    });

    expect(onUpdateNode).toHaveBeenCalled();
    expect(mockValidate).toHaveBeenCalledWith(expect.objectContaining({ resultVar: 'ternaryOutput' }));
  });

  it('opens and closes the mock request dialog without saving', () => {
    window.globalVariablesData = { RuleRequest: { id: 'req-1' } };
    const onUpdateNode = jest.fn();
    const requestNode: Node = {
      ...baseNode,
      data: {
        label: 'Request Factory',
        nodeType: 'RuleRequestFactory',
        params: { factoryName: 'getMockRequest' },
      },
    };

    renderSidebar({ selectedNode: requestNode, onUpdateNode });

    fireEvent.click(screen.getByRole('button', { name: /Edit Mock Rule Request/i }));
    expect(screen.getByText('request:{"id":"req-1"}')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onUpdateNode).not.toHaveBeenCalled();
    expect(mockToastError).not.toHaveBeenCalled();
  });

  it('reuses existing rule result code when it is already code', () => {
    const onUpdateNode = jest.fn();
    const resultNode: Node = {
      ...baseNode,
      data: {
        label: 'Rule Result',
        nodeType: 'RuleResultFactory',
        params: {
          ruleResultData: 'const ruleResult = { status: "ok" };',
        },
      },
    };

    renderSidebar({ selectedNode: resultNode, onUpdateNode });

    fireEvent.click(screen.getByRole('button', { name: /Edit Rule Result/i }));
    expect(screen.getByText('const ruleResult = { status: "ok" };')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onUpdateNode).toHaveBeenCalledWith('node-1', {
      params: expect.objectContaining({ ruleResultData: 'const ruleResult = { status: "ok" };' }),
    });
  });

  it('falls back to raw rule result data when parsing fails', () => {
    const onUpdateNode = jest.fn();
    const resultNode: Node = {
      ...baseNode,
      data: {
        label: 'Rule Result',
        nodeType: 'RuleResultFactory',
        params: {
          ruleResultData: 'not-json-content',
        },
      },
    };

    renderSidebar({ selectedNode: resultNode, onUpdateNode });

    fireEvent.click(screen.getByRole('button', { name: /Edit Rule Result/i }));
    expect(screen.getByText('not-json-content')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onUpdateNode).toHaveBeenCalledWith('node-1', {
      params: expect.objectContaining({ ruleResultData: 'not-json-content' }),
    });
  });
});