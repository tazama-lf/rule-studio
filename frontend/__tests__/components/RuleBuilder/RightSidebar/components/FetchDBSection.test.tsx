import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';

import FetchDBSection from '../../../../../src/components/RuleBuilder/RightSidebar/components/FetchDBSection';

// Module-level mock handles referenced before declaration via Jest hoisting
const mockExecuteQuery = jest.fn();
const mockCloseResults = jest.fn();
const mockClearError = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: 'rule-123' }),
}));

jest.mock('../../../../../src/hooks/RuleBuilder', () => ({
  useVariableData: jest.fn(() => ({ variables: [] })),
  useQueryExecution: jest.fn(() => ({
    executeQuery: jest.fn(),
    closeResults: jest.fn(),
    clearError: jest.fn(),
    isExecuting: false,
    queryResults: [] as unknown[],
    totalCount: 0,
    displayCount: 0,
    executionError: null as string | null,
    resultsModalOpen: false,
  })),
}));

// Get mock reference after jest.mock hoisting completes
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mockUseQueryExecution = require('../../../../../src/hooks/RuleBuilder').useQueryExecution as jest.Mock;

jest.mock('../../../../../src/utils/cursorPreservation', () => ({
  withCursorPreservation: (fn: (e: React.ChangeEvent<HTMLInputElement>) => void) => fn,
}));

jest.mock(
  '../../../../../src/components/RuleBuilder/RightSidebar/components/QueryEditorModal',
  () => ({
    __esModule: true,
    default: (props: {
      open: boolean;
      onSave: (q: string) => void;
      onClose: () => void;
      onExecute: (q: string, d?: string) => void;
      dbName?: string;
      initialValue?: string;
    }) => {
      if (!props.open) return null;
      return (
        <div data-testid="query-editor-modal">
          <span data-testid="modal-db-name">{props.dbName}</span>
          <span data-testid="modal-initial-value">{props.initialValue}</span>
          <button data-testid="save-query" onClick={() => props.onSave('SELECT * FROM users')}>
            save-query
          </button>
          <button data-testid="close-query" onClick={props.onClose}>
            close-query
          </button>
          <button data-testid="execute-query" onClick={() => props.onExecute('SELECT 1', props.dbName)}>
            execute-query
          </button>
        </div>
      );
    },
  })
);

jest.mock(
  '../../../../../src/components/RuleBuilder/RightSidebar/components/QueryExecutionResultModal',
  () => ({
    __esModule: true,
    default: (props: { open: boolean; onClose: () => void }) => {
      if (!props.open) return null;
      return (
        <button data-testid="close-results" onClick={props.onClose}>
          close-results
        </button>
      );
    },
  })
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Props = React.ComponentProps<typeof FetchDBSection>;

function makeProps(overrides: Partial<Props> = {}): Props {
  const inputRefs = { current: {} as Record<string, HTMLInputElement | HTMLTextAreaElement> };
  return {
    currentParams: {} as Record<string, string>,
    onParamChange: jest.fn(() => jest.fn()),
    onParamBlur: jest.fn(),
    onDrop: jest.fn(() => jest.fn()),
    onDragOver: jest.fn(),
    inputRefs,
    isReadOnly: false,
    viewOnly: false,
    allNodes: [],
    edges: [],
    selectedNodeId: null,
    getFieldError: jest.fn(() => undefined),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('FetchDBSection', () => {
  let mockUseQueryExecutionFn: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    const { useQueryExecution } = require('../../../../../src/hooks/RuleBuilder');
    mockUseQueryExecutionFn = useQueryExecution as jest.Mock;
    mockUseQueryExecutionFn.mockReturnValue({
      executeQuery: mockExecuteQuery,
      closeResults: mockCloseResults,
      clearError: mockClearError,
      isExecuting: false,
      queryResults: [],
      totalCount: 0,
      displayCount: 0,
      executionError: null,
      resultsModalOpen: false,
    });
  });

  // ── Rendering basics ──────────────────────────────────────────────────────

  it('renders the "Database Query" section title', () => {
    render(<FetchDBSection {...makeProps()} />);
    expect(screen.getByText('Database Query')).toBeInTheDocument();
  });

  it('renders SQL Query label and Store fields', () => {
    render(<FetchDBSection {...makeProps()} />);
    expect(screen.getByText('SQL Query')).toBeInTheDocument();
    expect(screen.getByText('Store Query In Variable')).toBeInTheDocument();
    expect(screen.getByText('Store Result In')).toBeInTheDocument();
  });

  // ── Default values (fallback branches) ────────────────────────────────────

  it('shows "Write SQL Query" when no query in params', () => {
    render(<FetchDBSection {...makeProps({ currentParams: {} })} />);
    expect(screen.getByText('Write SQL Query')).toBeInTheDocument();
    expect(screen.getByText('Click to open query editor')).toBeInTheDocument();
  });

  it('shows "Edit SQL Query" with line count when query exists', () => {
    render(
      <FetchDBSection
        {...makeProps({ currentParams: { query: 'SELECT 1\nSELECT 2' } })}
      />
    );
    expect(screen.getByText('Edit SQL Query')).toBeInTheDocument();
    expect(screen.getByText('2 lines')).toBeInTheDocument();
  });

  it('shows "1 lines" for a single-line query', () => {
    render(
      <FetchDBSection
        {...makeProps({ currentParams: { query: 'SELECT 1' } })}
      />
    );
    expect(screen.getByText('1 lines')).toBeInTheDocument();
  });

  it('queryVar TextField defaults to "query" when currentParams.queryVar is absent', () => {
    render(<FetchDBSection {...makeProps({ currentParams: {} })} />);
    const queryVarInput = screen.getByPlaceholderText('Variable name (e.g., query)');
    expect(queryVarInput).toHaveValue('query');
  });

  it('resultVar falls back to currentParams.variable when resultVar is absent', () => {
    render(
      <FetchDBSection
        {...makeProps({ currentParams: { variable: 'myVar' } })}
      />
    );
    expect(screen.getByPlaceholderText('Variable name (e.g., dbResult)')).toHaveValue('myVar');
  });

  it('resultVar is empty when neither resultVar nor variable is in params', () => {
    render(<FetchDBSection {...makeProps({ currentParams: {} })} />);
    expect(screen.getByPlaceholderText('Variable name (e.g., dbResult)')).toHaveValue('');
  });

  it('uses currentParams.queryVar and resultVar when present', () => {
    render(
      <FetchDBSection
        {...makeProps({
          currentParams: { queryVar: 'myQueryVar', resultVar: 'myResultVar' },
        })}
      />
    );
    expect(screen.getByPlaceholderText('Variable name (e.g., query)')).toHaveValue('myQueryVar');
    expect(screen.getByPlaceholderText('Variable name (e.g., dbResult)')).toHaveValue('myResultVar');
  });

  // ── Execute button visibility ──────────────────────────────────────────────

  it('hides Execute button when there is no query', () => {
    render(<FetchDBSection {...makeProps({ currentParams: {} })} />);
    expect(screen.queryByRole('button', { name: /execute/i })).not.toBeInTheDocument();
  });

  it('shows Execute button when query exists and not disabled', () => {
    render(
      <FetchDBSection
        {...makeProps({ currentParams: { query: 'SELECT 1' } })}
      />
    );
    expect(screen.getByRole('button', { name: /execute & test query/i })).toBeInTheDocument();
  });

  it('hides Execute button when isReadOnly=true even with a query', () => {
    render(
      <FetchDBSection
        {...makeProps({ currentParams: { query: 'SELECT 1' }, isReadOnly: true })}
      />
    );
    expect(screen.queryByRole('button', { name: /execute/i })).not.toBeInTheDocument();
  });

  it('hides Execute button when viewOnly=true even with a query', () => {
    render(
      <FetchDBSection
        {...makeProps({ currentParams: { query: 'SELECT 1' }, viewOnly: true })}
      />
    );
    expect(screen.queryByRole('button', { name: /execute/i })).not.toBeInTheDocument();
  });

  it('shows "Executing Query..." and disables button when isExecuting=true', () => {
    mockUseQueryExecutionFn.mockReturnValue({
      executeQuery: mockExecuteQuery,
      closeResults: mockCloseResults,
      clearError: mockClearError,
      isExecuting: true,
      queryResults: [],
      totalCount: 0,
      displayCount: 0,
      executionError: null,
      resultsModalOpen: false,
    });
    render(
      <FetchDBSection
        {...makeProps({ currentParams: { query: 'SELECT 1' } })}
      />
    );
    const btn = screen.getByRole('button', { name: /executing query/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toBeDisabled();
  });

  // ── Disabled state ────────────────────────────────────────────────────────

  it('disables the query editor button when isReadOnly=true', () => {
    render(<FetchDBSection {...makeProps({ isReadOnly: true })} />);
    expect(screen.getByRole('button', { name: /sql query/i })).toBeDisabled();
  });

  it('disables the query editor button when viewOnly=true', () => {
    render(<FetchDBSection {...makeProps({ viewOnly: true })} />);
    expect(screen.getByRole('button', { name: /sql query/i })).toBeDisabled();
  });

  // ── Error display branches ─────────────────────────────────────────────────

  it('shows query field error and hides Monaco hint when getFieldError("query") returns a message', () => {
    const getFieldError = jest.fn((field: string) =>
      field === 'query' ? 'Query is required' : undefined
    );
    render(<FetchDBSection {...makeProps({ getFieldError })} />);
    expect(screen.getByText('Query is required')).toBeInTheDocument();
    expect(screen.queryByText(/Use Monaco editor/)).not.toBeInTheDocument();
  });

  it('shows Monaco hint and hides error when getFieldError("query") returns undefined', () => {
    render(<FetchDBSection {...makeProps()} />);
    expect(screen.getByText(/Use Monaco editor/)).toBeInTheDocument();
    expect(screen.queryByText('Query is required')).not.toBeInTheDocument();
  });

  it('shows queryVar field error as TextField helperText', () => {
    const getFieldError = jest.fn((field: string) =>
      field === 'queryVar' ? 'queryVar is required' : undefined
    );
    render(<FetchDBSection {...makeProps({ getFieldError })} />);
    expect(screen.getByText('queryVar is required')).toBeInTheDocument();
  });

  it('shows resultVar field error as TextField helperText', () => {
    const getFieldError = jest.fn((field: string) =>
      field === 'resultVar' ? 'resultVar is required' : undefined
    );
    render(<FetchDBSection {...makeProps({ getFieldError })} />);
    expect(screen.getByText('resultVar is required')).toBeInTheDocument();
  });

  it('shows default queryVar hint when no error', () => {
    render(<FetchDBSection {...makeProps()} />);
    expect(screen.getByText(/Variable name to store the SQL query string/)).toBeInTheDocument();
  });

  it('shows default resultVar hint when no error', () => {
    render(<FetchDBSection {...makeProps()} />);
    expect(screen.getByText(/Variable name to store query results/)).toBeInTheDocument();
  });

  // ── Query editor modal: open / close / save ────────────────────────────────

  it('opens the query editor modal when the SQL Query button is clicked', () => {
    render(<FetchDBSection {...makeProps()} />);
    expect(screen.queryByTestId('query-editor-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /sql query/i }));
    expect(screen.getByTestId('query-editor-modal')).toBeInTheDocument();
  });

  it('passes the current query and dbName to the modal', () => {
    render(
      <FetchDBSection
        {...makeProps({ currentParams: { query: 'SELECT id FROM users', dbName: 'configuration' } })}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /sql query/i }));
    expect(screen.getByTestId('modal-initial-value')).toHaveTextContent('SELECT id FROM users');
    expect(screen.getByTestId('modal-db-name')).toHaveTextContent('configuration');
  });

  it('passes default dbName "_event_history" when not set in params', () => {
    render(<FetchDBSection {...makeProps({ currentParams: { query: 'SELECT 1' } })} />);
    fireEvent.click(screen.getByRole('button', { name: /sql query/i }));
    expect(screen.getByTestId('modal-db-name')).toHaveTextContent('_event_history');
  });

  it('closes the query editor modal and calls clearError on close', () => {
    render(<FetchDBSection {...makeProps()} />);
    fireEvent.click(screen.getByRole('button', { name: /sql query/i }));
    expect(screen.getByTestId('query-editor-modal')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('close-query'));
    expect(screen.queryByTestId('query-editor-modal')).not.toBeInTheDocument();
    expect(mockClearError).toHaveBeenCalled();
  });

  it('calls onParamChange("query") and onParamBlur on save', () => {
    const onParamChangeHandler = jest.fn();
    const onParamChange = jest.fn((key: string) =>
      key === 'query' ? onParamChangeHandler : jest.fn()
    );
    const onParamBlur = jest.fn();

    render(
      <FetchDBSection
        {...makeProps({
          currentParams: { query: 'old query', dbName: 'configuration' },
          onParamChange,
          onParamBlur,
        })}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /sql query/i }));
    fireEvent.click(screen.getByTestId('save-query'));

    expect(onParamChange).toHaveBeenCalledWith('query');
    expect(onParamChangeHandler).toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.objectContaining({ value: 'SELECT * FROM users' }) })
    );
    expect(onParamBlur).toHaveBeenCalledWith(
      true,
      expect.objectContaining({ query: 'SELECT * FROM users' })
    );
    // Modal closes after save
    expect(screen.queryByTestId('query-editor-modal')).not.toBeInTheDocument();
  });

  it('closes modal after save and clearError is called', () => {
    const onParamChange = jest.fn(() => jest.fn());
    render(
      <FetchDBSection
        {...makeProps({ onParamChange, currentParams: { query: 'SELECT 1' } })}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /sql query/i }));
    fireEvent.click(screen.getByTestId('save-query'));
    expect(screen.queryByTestId('query-editor-modal')).not.toBeInTheDocument();
    expect(mockClearError).toHaveBeenCalled();
  });

  // ── Execute query button ───────────────────────────────────────────────────

  it('calls executeQuery with query and dbName when Execute button is clicked', () => {
    render(
      <FetchDBSection
        {...makeProps({ currentParams: { query: 'SELECT 1', dbName: 'configuration' } })}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /execute & test query/i }));
    expect(mockExecuteQuery).toHaveBeenCalledWith('SELECT 1', 'configuration');
  });

  it('uses default dbName "_event_history" when Execute button clicked without dbName in params', () => {
    render(
      <FetchDBSection {...makeProps({ currentParams: { query: 'SELECT 1' } })} />
    );
    fireEvent.click(screen.getByRole('button', { name: /execute & test query/i }));
    expect(mockExecuteQuery).toHaveBeenCalledWith('SELECT 1', '_event_history');
  });

  it('calls executeQuery when execute-query button inside modal is clicked', () => {
    render(<FetchDBSection {...makeProps({ currentParams: { query: 'SELECT 1' } })} />);
    fireEvent.click(screen.getByRole('button', { name: /sql query/i }));
    fireEvent.click(screen.getByTestId('execute-query'));
    expect(mockExecuteQuery).toHaveBeenCalledWith('SELECT 1', '_event_history');
  });

  // ── Results modal ─────────────────────────────────────────────────────────

  it('renders the results modal when resultsModalOpen=true', () => {
    mockUseQueryExecutionFn.mockReturnValue({
      executeQuery: mockExecuteQuery,
      closeResults: mockCloseResults,
      clearError: mockClearError,
      isExecuting: false,
      queryResults: [{ id: 1 }],
      totalCount: 1,
      displayCount: 1,
      executionError: 'boom',
      resultsModalOpen: true,
    });
    render(<FetchDBSection {...makeProps()} />);
    expect(screen.getByTestId('close-results')).toBeInTheDocument();
  });

  it('calls closeResults when the results modal close button is clicked', () => {
    mockUseQueryExecutionFn.mockReturnValue({
      executeQuery: mockExecuteQuery,
      closeResults: mockCloseResults,
      clearError: mockClearError,
      isExecuting: false,
      queryResults: [],
      totalCount: 0,
      displayCount: 0,
      executionError: null,
      resultsModalOpen: true,
    });
    render(<FetchDBSection {...makeProps()} />);
    fireEvent.click(screen.getByTestId('close-results'));
    expect(mockCloseResults).toHaveBeenCalled();
  });

  // ── Database select ────────────────────────────────────────────────────────

  it('calls onParamChange("dbName") when a new database is selected', () => {
    const onParamChangeHandler = jest.fn();
    const onParamChange = jest.fn((key: string) =>
      key === 'dbName' ? onParamChangeHandler : jest.fn()
    );
    render(
      <FetchDBSection
        {...makeProps({ onParamChange, currentParams: { dbName: '_event_history' } })}
      />
    );

    // Open the MUI Select dropdown
    const selectButton = screen.getByRole('combobox');
    fireEvent.mouseDown(selectButton);

    // Click the 'configuration' menu item
    const option = screen.getByRole('option', { name: 'configuration' });
    fireEvent.click(option);

    expect(onParamChange).toHaveBeenCalledWith('dbName');
    expect(onParamChangeHandler).toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.objectContaining({ value: 'configuration' }) })
    );
  });

  it('disables the DB select when isReadOnly=true', () => {
    render(<FetchDBSection {...makeProps({ isReadOnly: true })} />);
    // The combobox should be disabled (aria-disabled or disabled attribute)
    const combo = screen.getByRole('combobox');
    expect(combo).toHaveAttribute('aria-disabled', 'true');
  });

  // ── onParamBlur callbacks ──────────────────────────────────────────────────

  it('calls onParamBlur when queryVar field loses focus', () => {
    const onParamBlur = jest.fn();
    render(<FetchDBSection {...makeProps({ onParamBlur })} />);
    fireEvent.blur(screen.getByPlaceholderText('Variable name (e.g., query)'));
    expect(onParamBlur).toHaveBeenCalled();
  });

  it('calls onParamBlur when resultVar field loses focus', () => {
    const onParamBlur = jest.fn();
    render(<FetchDBSection {...makeProps({ onParamBlur })} />);
    fireEvent.blur(screen.getByPlaceholderText('Variable name (e.g., dbResult)'));
    expect(onParamBlur).toHaveBeenCalled();
  });

  // ── onParamChange callbacks (queryVar / resultVar) ────────────────────────

  it('calls onParamChange("queryVar") when queryVar field changes', () => {
    const onParamChangeHandler = jest.fn();
    const onParamChange = jest.fn((key: string) =>
      key === 'queryVar' ? onParamChangeHandler : jest.fn()
    );
    render(<FetchDBSection {...makeProps({ onParamChange })} />);
    fireEvent.change(screen.getByPlaceholderText('Variable name (e.g., query)'), {
      target: { value: 'newQueryVar' },
    });
    expect(onParamChange).toHaveBeenCalledWith('queryVar');
    expect(onParamChangeHandler).toHaveBeenCalled();
  });

  it('calls onParamChange("resultVar") when resultVar field changes', () => {
    const onParamChangeHandler = jest.fn();
    const onParamChange = jest.fn((key: string) =>
      key === 'resultVar' ? onParamChangeHandler : jest.fn()
    );
    render(<FetchDBSection {...makeProps({ onParamChange })} />);
    fireEvent.change(screen.getByPlaceholderText('Variable name (e.g., dbResult)'), {
      target: { value: 'newResultVar' },
    });
    expect(onParamChange).toHaveBeenCalledWith('resultVar');
    expect(onParamChangeHandler).toHaveBeenCalled();
  });

  // ── onDrop / onDragOver ────────────────────────────────────────────────────

  it('calls onDrop("queryVar") handler when a drop occurs on queryVar field', () => {
    const dropHandler = jest.fn();
    const onDrop = jest.fn((key: string) => (key === 'queryVar' ? dropHandler : jest.fn()));
    render(<FetchDBSection {...makeProps({ onDrop })} />);
    fireEvent.drop(screen.getByPlaceholderText('Variable name (e.g., query)'));
    expect(onDrop).toHaveBeenCalledWith('queryVar');
    expect(dropHandler).toHaveBeenCalled();
  });

  it('calls onDrop("resultVar") handler when a drop occurs on resultVar field', () => {
    const dropHandler = jest.fn();
    const onDrop = jest.fn((key: string) => (key === 'resultVar' ? dropHandler : jest.fn()));
    render(<FetchDBSection {...makeProps({ onDrop })} />);
    fireEvent.drop(screen.getByPlaceholderText('Variable name (e.g., dbResult)'));
    expect(onDrop).toHaveBeenCalledWith('resultVar');
    expect(dropHandler).toHaveBeenCalled();
  });

  it('calls onDragOver when dragging over any field', () => {
    const onDragOver = jest.fn();
    render(<FetchDBSection {...makeProps({ onDragOver })} />);
    fireEvent.dragOver(screen.getByPlaceholderText('Variable name (e.g., query)'));
    expect(onDragOver).toHaveBeenCalled();
  });

  // ── inputRefs registration ────────────────────────────────────────────────

  it('registers queryVar and resultVar in inputRefs', () => {
    const inputRefs = { current: {} as Record<string, HTMLInputElement | HTMLTextAreaElement> };
    render(<FetchDBSection {...makeProps({ inputRefs })} />);
    expect(inputRefs.current['queryVar']).toBeInstanceOf(HTMLInputElement);
    expect(inputRefs.current['resultVar']).toBeInstanceOf(HTMLInputElement);
  });

  // ── Optional props absent ─────────────────────────────────────────────────

  it('renders without crashing when optional props are omitted', () => {
    const { currentParams, onParamChange, onDrop, onDragOver, inputRefs, isReadOnly, viewOnly } =
      makeProps();
    render(
      <FetchDBSection
        currentParams={currentParams}
        onParamChange={onParamChange}
        onDrop={onDrop}
        onDragOver={onDragOver}
        inputRefs={inputRefs}
        isReadOnly={isReadOnly}
        viewOnly={viewOnly}
      />
    );
    expect(screen.getByText('Database Query')).toBeInTheDocument();
  });

  it('handles missing onParamBlur gracefully (does not throw on blur)', () => {
    const props = makeProps();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (props as any).onParamBlur;
    expect(() => {
      render(<FetchDBSection {...props} />);
      fireEvent.blur(screen.getByPlaceholderText('Variable name (e.g., query)'));
    }).not.toThrow();
  });
});
