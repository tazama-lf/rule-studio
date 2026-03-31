import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import CodeEditor from '../../../../src/components/RuleBuilder/RightSidebar/components/CodeEditor';

jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: (props: {
    value: string;
    language?: string;
    onChange?: (value: string) => void;
    onMount?: (editor: { addCommand: (key: number, callback: () => void) => void; getPosition: () => { lineNumber: number; column: number }; executeEdits: (_: string, __: unknown[]) => void; setPosition: (_: { lineNumber: number; column: number }) => void }, monaco: { KeyCode: { Space: number } }) => void;
  }) => {
    const editor = {
      addCommand: jest.fn((_: number, callback: () => void) => callback()),
      getPosition: jest.fn(() => ({ lineNumber: 1, column: 1 })),
      executeEdits: jest.fn(),
      setPosition: jest.fn(),
    };

    props.onMount?.(editor, { KeyCode: { Space: 1 } });

    return (
      <textarea
        data-testid="monaco-editor"
        data-language={props.language}
        value={props.value}
        onChange={(e) => props.onChange?.(e.target.value)}
      />
    );
  },
}));

describe('CodeEditor', () => {
  it('renders label, required marker and helper text', () => {
    render(
      <CodeEditor
        value="const a = 1;"
        onChange={jest.fn()}
        label="Code"
        required
        helperText="Helpful text"
      />
    );

    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('Helpful text')).toBeInTheDocument();
  });

  it('calls onChange and uses empty string fallback', () => {
    const onChange = jest.fn();
    render(<CodeEditor value="x" onChange={onChange} />);

    fireEvent.change(screen.getByTestId('monaco-editor'), { target: { value: 'updated' } });
    expect(onChange).toHaveBeenCalledWith('updated');
  });

  it('passes language and keeps helper text color path for error', () => {
    render(
      <CodeEditor
        value="SELECT 1"
        onChange={jest.fn()}
        language="sql"
        error
        helperText="Error text"
      />
    );

    expect(screen.getByTestId('monaco-editor')).toHaveAttribute('data-language', 'sql');
    expect(screen.getByText('Error text')).toBeInTheDocument();
  });
});
