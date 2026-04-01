import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import ParameterConfigSection from '../../../../../src/components/RuleBuilder/RightSidebar/components/ParameterConfigSection';

jest.mock('../../../../../src/utils/cursorPreservation', () => ({
  withCursorPreservation: (fn: (e: React.ChangeEvent<HTMLInputElement>) => void) => fn,
}));

jest.mock('../../../../../src/components/RuleBuilder/RightSidebar/components/CodeEditorModal', () => {
  return function MockCodeEditorModal(props: { open: boolean; onSave: (code: string) => void; onClose: () => void; title: string; initialValue: string }) {
    if (!props.open) return null;
    return (
      <div data-testid="code-editor-modal">
        <div data-testid="code-editor-title">{props.title}</div>
        <div data-testid="code-editor-initial">{props.initialValue}</div>
        <button data-testid="code-save" onClick={() => props.onSave('export const saved = () => true;')}>save</button>
        <button data-testid="code-close" onClick={props.onClose}>close</button>
      </div>
    );
  };
});

describe('ParameterConfigSection', () => {
  const onParamBlur = jest.fn();
  const onDirectUpdate = jest.fn();
  const onParamChangeHandler = jest.fn();
  const onParamChange = jest.fn((key: string) => {
    if (key === 'parameters' || key === 'code_template' || key === 'function_name') {
      return onParamChangeHandler;
    }
    return jest.fn();
  });

  const baseProps = {
    currentParams: {
      function_name: 'computeTotal',
      parameters: JSON.stringify([
        { name: 'amount', type: 'number', label: 'Amount', required: true },
      ]),
      code_template: '// Write your function code here',
    } as Record<string, string>,
    onParamChange,
    onParamBlur,
    onDirectUpdate,
    isReadOnly: false,
    viewOnly: false,
    getFieldError: jest.fn(() => undefined),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders with fallback signature when function name is missing', () => {
    render(
      <ParameterConfigSection
        {...baseProps}
        currentParams={{ parameters: '[]', code_template: '' }}
      />
    );

    expect(screen.getByText('export const [functionName] = (...params) => { ... }')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /edit function code/i }));
    expect(screen.getByTestId('code-editor-initial')).toHaveTextContent('// Please enter a function name first');
  });

  it('falls back to empty parameter list when parameters JSON is invalid', () => {
    render(
      <ParameterConfigSection
        {...baseProps}
        currentParams={{ ...baseProps.currentParams, parameters: '{bad json' }}
      />
    );

    expect(screen.getByText(/No parameters defined/i)).toBeInTheDocument();
  });

  it('adds a parameter and syncs parent with delayed update', async () => {
    render(<ParameterConfigSection {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /add parameter/i }));

    jest.runAllTimers();

    await waitFor(() => {
      expect(onParamChange).toHaveBeenCalledWith('parameters');
      expect(onParamChangeHandler).toHaveBeenCalled();
      expect(onParamBlur).toHaveBeenCalled();
    });

    const eventArg = onParamChangeHandler.mock.calls[0][0] as { target: { value: string; dataset: { multiUpdate: string } } };
    const parsed = JSON.parse(eventArg.target.value) as Array<{ name: string }>;
    expect(parsed).toHaveLength(2);
    expect(parsed[1].name).toBe('param2');
    expect(eventArg.target.dataset.multiUpdate).toContain('parameter_count');
  });

  it('updates and removes parameters', async () => {
    render(<ParameterConfigSection {...baseProps} />);

    fireEvent.change(screen.getByDisplayValue('amount'), { target: { value: 'newAmount' } });
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'string' }));
    fireEvent.change(screen.getByDisplayValue('Amount'), { target: { value: 'Amount Label' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Required/i }));
    fireEvent.click(screen.getByTestId('DeleteIcon').closest('button') as HTMLElement);

    jest.runAllTimers();

    await waitFor(() => {
      expect(onParamChange).toHaveBeenCalledWith('parameters');
    });
  });

  it('saves code via onDirectUpdate when provided', () => {
    render(<ParameterConfigSection {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /edit function code/i }));
    expect(screen.getByTestId('code-editor-title')).toHaveTextContent('Edit Function Code: computeTotal');

    fireEvent.click(screen.getByTestId('code-save'));

    expect(onDirectUpdate).toHaveBeenCalledWith({
      ...baseProps.currentParams,
      code_template: 'export const saved = () => true;',
    });
  });

  it('falls back to onParamChange for code save when onDirectUpdate is absent', async () => {
    render(<ParameterConfigSection {...baseProps} onDirectUpdate={undefined} />);

    fireEvent.click(screen.getByRole('button', { name: /edit function code/i }));
    fireEvent.click(screen.getByTestId('code-save'));

    expect(onParamChange).toHaveBeenCalledWith('code_template');

    jest.advanceTimersByTime(60);

    await waitFor(() => {
      expect(onParamBlur).toHaveBeenCalled();
    });
  });

  it('uses existing non-default code template content and displays field errors', () => {
    const getFieldError = jest.fn((field: string) => {
      if (field === 'function_name') return 'Function name required';
      if (field === 'code_template') return 'Code is required';
      return undefined;
    });

    render(
      <ParameterConfigSection
        {...baseProps}
        getFieldError={getFieldError}
        currentParams={{
          ...baseProps.currentParams,
          code_template: 'export const computeTotal = (amount: number) => amount * 2;',
        }}
      />
    );

    expect(screen.getByText('Function name required')).toBeInTheDocument();
    expect(screen.getByText('Code is required')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /edit function code/i }));
    expect(screen.getByTestId('code-editor-initial')).toHaveTextContent('export const computeTotal = (amount: number) => amount * 2;');
  });

  it('disables editing controls in readonly and view-only modes', () => {
    const { rerender } = render(<ParameterConfigSection {...baseProps} isReadOnly={true} />);

    expect(screen.getByRole('button', { name: /add parameter/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /edit function code/i })).toBeDisabled();

    rerender(<ParameterConfigSection {...baseProps} isReadOnly={false} viewOnly={true} />);

    expect(screen.getByRole('button', { name: /add parameter/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /edit function code/i })).toBeDisabled();
  });
});
