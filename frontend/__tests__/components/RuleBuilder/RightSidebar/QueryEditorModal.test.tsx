import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import QueryEditorModal from '../../../../src/components/RuleBuilder/RightSidebar/components/QueryEditorModal/QueryEditorModal';

const mockGetValue = jest.fn(() => 'SELECT * FROM table');
const mockSetValue = jest.fn();

jest.mock('../../../../src/components/RuleBuilder/RightSidebar/components/QueryEditorModal/EditorSection', () => {
  const React = require('react') as typeof import('react');

  return {
    __esModule: true,
    default: React.forwardRef((props: { initialValue: string; displayError?: string }, ref: React.ForwardedRef<{ getValue: () => string; setValue: (value: string) => void }>) => {
      React.useImperativeHandle(ref, () => ({
        getValue: mockGetValue,
        setValue: mockSetValue,
      }));

      return (
        <div data-testid="editor-section">
          <div>{props.initialValue}</div>
          {props.displayError ? <span>{props.displayError}</span> : null}
        </div>
      );
    }),
  };
});

jest.mock('../../../../src/components/RuleBuilder/RightSidebar/components/QueryEditorModal/VariablesPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="variables-panel">variables</div>,
}));

const mockHandleDrop = jest.fn();
const mockHandleDragOver = jest.fn();
const mockHandleDragEnter = jest.fn();
const mockHandleDragLeave = jest.fn();
const mockHandleEditorMount = jest.fn();
const mockVariableData = {
  localVarsTree: [],
  loopVarsTree: [],
  loopContext: { isInLoopScope: false, loopNames: [] },
  ruleRequestTree: [],
  ruleConfigTree: [],
  ruleResultTree: [],
};

jest.mock('../../../../src/hooks/RuleBuilder', () => ({
  useDragDropEditor: () => ({
    handleDrop: mockHandleDrop,
    handleDragOver: mockHandleDragOver,
    handleDragEnter: mockHandleDragEnter,
    handleDragLeave: mockHandleDragLeave,
    handleEditorMount: mockHandleEditorMount,
  }),
  useVariableData: () => mockVariableData,
}));

describe('QueryEditorModal', () => {
  const baseProps = {
    open: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    onExecute: jest.fn(),
    dbName: 'main',
    initialValue: 'SELECT 1',
    isExecuting: false,
    executionError: null,
    ruleId: 'r1',
    allNodes: [],
    edges: [],
    selectedNodeId: 'n1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetValue.mockReturnValue('SELECT * FROM table');
  });

  it('renders sections and saves query', () => {
    render(<QueryEditorModal {...baseProps} />);

    expect(screen.getByText('SQL Query Editor')).toBeInTheDocument();
    expect(screen.getByTestId('editor-section')).toBeInTheDocument();
    expect(screen.getByTestId('variables-panel')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /save query/i }));
    expect(baseProps.onSave).toHaveBeenCalledWith('SELECT * FROM table');
  });

  it('executes query with dbName and shows empty validation error', () => {
    render(<QueryEditorModal {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /execute & test/i }));
    expect(baseProps.onExecute).toHaveBeenCalledWith('SELECT * FROM table', 'main');

    mockGetValue.mockReturnValue('   ');
    fireEvent.click(screen.getByRole('button', { name: /execute & test/i }));

    expect(screen.getByText('Query cannot be empty')).toBeInTheDocument();
  });

  it('handles cancel and executing state', () => {
    const { rerender } = render(<QueryEditorModal {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(baseProps.onClose).toHaveBeenCalled();

    rerender(<QueryEditorModal {...baseProps} isExecuting />);
    expect(screen.getByText('Executing...')).toBeInTheDocument();
  });
});
