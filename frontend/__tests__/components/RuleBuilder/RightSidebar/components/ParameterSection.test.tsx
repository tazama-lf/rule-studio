import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import ParameterSection from '../../../../../src/components/RuleBuilder/RightSidebar/components/ParameterSection';

const mockExecuteQuery = jest.fn();
const mockCloseResults = jest.fn();
const mockClearError = jest.fn();
const mockShouldRenderInput = jest.fn(() => true);
const mockGetCurrentValue = jest.fn((input: { key: string }) => input.key === 'name' ? '{{ var }}' : 'value');
const mockGetHelperText = jest.fn(() => 'helper');
const mockGetMinRows = jest.fn(() => 3);

jest.mock('../../../../../src/hooks/RuleBuilder', () => ({
  useVariableData: jest.fn(() => ({ variables: [] })),
  useQueryExecution: jest.fn(() => ({
    executeQuery: mockExecuteQuery,
    closeResults: mockCloseResults,
    clearError: mockClearError,
    isExecuting: false,
    queryResults: [{ id: 1 }],
    totalCount: 1,
    displayCount: 1,
    executionError: null,
    resultsModalOpen: true,
  })),
}));

jest.mock('../../../../../src/components/RuleBuilder/RightSidebar/components/ParameterFields', () => ({
  DropdownField: (props: { input: { key: string } }) => <div data-testid={`dropdown-${props.input.key}`}>dropdown</div>,
  CodeTemplateButton: (props: { input: { key: string; label: string }; currentValue: string; onOpenCodeModal: (k: string, l: string, v: string) => void }) => (
    <button data-testid={`code-template-${props.input.key}`} onClick={() => props.onOpenCodeModal(props.input.key, props.input.label, props.currentValue)}>
      open-code-template
    </button>
  ),
  FetchDBQueryField: (props: { onOpenQueryEditor: () => void; onExecuteQuery: (q: string, d?: string) => void; dbName?: string }) => (
    <div>
      <button data-testid="open-query" onClick={props.onOpenQueryEditor}>open-query</button>
      <button data-testid="exec-query" onClick={() => props.onExecuteQuery('select 1', props.dbName)}>exec-query</button>
    </div>
  ),
  CodeEditorField: (props: { input: { key: string } }) => <div data-testid={`code-field-${props.input.key}`}>code-field</div>,
  TextInputField: (props: { input: { key: string }; onInputRef: (k: string, el: HTMLInputElement | HTMLTextAreaElement | null) => void }) => {
    React.useEffect(() => {
      props.onInputRef(props.input.key, document.createElement('input'));
    }, [props]);
    return <div data-testid={`text-field-${props.input.key}`}>text-field</div>;
  },
}));

jest.mock('../../../../../src/components/RuleBuilder/RightSidebar/components/CodeEditorModal', () => {
  return function MockCodeEditorModal(props: { open: boolean; onSave: (value: string) => void; onClose: () => void }) {
    if (!props.open) return null;
    return (
      <div data-testid="code-editor-modal">
        <button data-testid="save-code" onClick={() => props.onSave('saved code')}>save-code</button>
        <button data-testid="close-code" onClick={props.onClose}>close-code</button>
      </div>
    );
  };
});

jest.mock('../../../../../src/components/RuleBuilder/RightSidebar/components/QueryEditorModal/QueryEditorModal', () => {
  return function MockQueryEditorModal(props: { open: boolean; onSave: (query: string) => void; onClose: () => void; onExecute: (q: string, d?: string) => void; dbName?: string }) {
    if (!props.open) return null;
    return (
      <div data-testid="query-editor-modal">
        <button data-testid="save-query" onClick={() => props.onSave('SELECT * FROM t')}>save-query</button>
        <button data-testid="close-query" onClick={props.onClose}>close-query</button>
        <button data-testid="execute-query" onClick={() => props.onExecute('SELECT NOW()', props.dbName)}>execute-query</button>
      </div>
    );
  };
});

jest.mock('../../../../../src/components/RuleBuilder/RightSidebar/components/QueryExecutionResultModal', () => {
  return function MockQueryExecutionResultModal(props: { open: boolean; onClose: () => void }) {
    if (!props.open) return null;
    return <button data-testid="close-results" onClick={props.onClose}>close-results</button>;
  };
});

jest.mock('../../../../../src/components/RuleBuilder/RightSidebar/components/ParameterFields/hooks/useInputVisibility', () => ({
  useInputVisibility: jest.fn(() => ({ shouldRenderInput: mockShouldRenderInput })),
}));

jest.mock('../../../../../src/components/RuleBuilder/RightSidebar/components/ParameterFields/hooks/useInputHelpers', () => ({
  useInputHelpers: jest.fn(() => ({
    getCurrentValue: mockGetCurrentValue,
    getHelperText: mockGetHelperText,
    getMinRows: mockGetMinRows,
  })),
}));

describe('ParameterSection', () => {
  const mockQueryChangeHandler = jest.fn();
  const mockOnParamChange = jest.fn((key: string) => key === 'query' ? mockQueryChangeHandler : jest.fn());
  const mockOnParamBlur = jest.fn();
  const inputRefs = { current: {} as Record<string, HTMLInputElement | HTMLTextAreaElement> };

  const baseProps = {
    inputs: [{ key: 'name', label: 'Name', type: 'text', defaultValue: '' }],
    currentParams: { dbName: 'my_db', query: 'select 1' } as Record<string, string>,
    onParamChange: mockOnParamChange,
    onParamBlur: mockOnParamBlur,
    onDrop: jest.fn(() => jest.fn()),
    onDragOver: jest.fn(),
    inputRefs,
    variableError: null,
    isReadOnly: false,
    viewOnly: false,
    nodeType: 'SetVariable',
    allNodes: [],
    getFieldError: jest.fn(() => undefined),
    ruleId: 'rule-1',
    edges: [],
    selectedNodeId: 'n1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    inputRefs.current = {};
    mockShouldRenderInput.mockReturnValue(true);
    mockGetCurrentValue.mockImplementation((input: { key: string }) => input.key === 'name' ? '{{ var }}' : 'value');
  });

  it('returns null when there are no inputs', () => {
    const { container } = render(<ParameterSection {...baseProps} inputs={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders dropdown branches for options, declarationType and dataType', () => {
    render(
      <ParameterSection
        {...baseProps}
        inputs={[
          { key: 'withOptions', label: 'With Options', type: 'text', options: ['a'], defaultValue: '' },
          { key: 'declarationType', label: 'Declaration', type: 'text', defaultValue: '' },
          { key: 'dataType', label: 'Data Type', type: 'text', defaultValue: '' },
        ]}
      />
    );

    expect(screen.getByTestId('dropdown-withOptions')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-declarationType')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-dataType')).toBeInTheDocument();
  });

  it('renders code template and saves code through modal', () => {
    render(
      <ParameterSection
        {...baseProps}
        currentParams={{ code_template: 'old' }}
        inputs={[{ key: 'code_template', label: 'Code', type: 'code', defaultValue: '' }]}
      />
    );

    fireEvent.click(screen.getByTestId('code-template-code_template'));
    fireEvent.click(screen.getByTestId('save-code'));

    expect(mockOnParamBlur).toHaveBeenCalledWith(true, { code_template: 'saved code' });
  });

  it('renders code editor field for code-like keys', () => {
    render(
      <ParameterSection
        {...baseProps}
        inputs={[{ key: 'function_code', label: 'Function Code', type: 'text', defaultValue: '' }]}
      />
    );

    expect(screen.getByTestId('code-field-function_code')).toBeInTheDocument();
  });

  it('renders text input by default and stores refs', () => {
    render(
      <ParameterSection
        {...baseProps}
        inputs={[{ key: 'plainText', label: 'Plain', type: 'text', defaultValue: '' }]}
      />
    );

    expect(screen.getByTestId('text-field-plainText')).toBeInTheDocument();
    expect(inputRefs.current['plainText']).toBeInstanceOf(HTMLInputElement);
  });

  it('skips rendering when shouldRenderInput returns false', () => {
    mockShouldRenderInput.mockReturnValue(false);
    render(<ParameterSection {...baseProps} inputs={[{ key: 'hidden', label: 'Hidden', type: 'text', defaultValue: '' }]} />);
    expect(screen.queryByTestId('text-field-hidden')).not.toBeInTheDocument();
  });

  it('handles fetchDB query editor and results modal flows', () => {
    render(
      <ParameterSection
        {...baseProps}
        nodeType="FetchDB"
        inputs={[{ key: 'query', label: 'Query', type: 'textarea', defaultValue: '' }]}
      />
    );

    fireEvent.click(screen.getByTestId('open-query'));
    expect(screen.getByTestId('query-editor-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('execute-query'));
    expect(mockExecuteQuery).toHaveBeenCalledWith('SELECT NOW()', 'my_db');

    fireEvent.click(screen.getByTestId('save-query'));
    expect(mockOnParamChange).toHaveBeenCalledWith('query');
    expect(mockQueryChangeHandler).toHaveBeenCalled();
    expect(mockOnParamBlur).toHaveBeenCalledWith(true, { dbName: 'my_db', query: 'SELECT * FROM t' });

    fireEvent.click(screen.getByTestId('close-results'));
    expect(mockCloseResults).toHaveBeenCalled();
  });

  it('clears query errors when closing query editor', () => {
    render(
      <ParameterSection
        {...baseProps}
        nodeType="FetchDB"
        inputs={[{ key: 'query', label: 'Query', type: 'textarea', defaultValue: '' }]}
      />
    );

    fireEvent.click(screen.getByTestId('open-query'));
    fireEvent.click(screen.getByTestId('close-query'));

    expect(mockClearError).toHaveBeenCalled();
  });
});
