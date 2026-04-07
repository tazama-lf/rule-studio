import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import CodeEditorModal from '../../../../src/components/RuleBuilder/RightSidebar/components/CodeEditorModal';

jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: (props: {
    value: string;
    language?: string;
    onChange?: (value: string) => void;
    onMount?: (editor: { addCommand: (key: number, callback: () => void) => void; getPosition: () => { lineNumber: number; column: number } | null; executeEdits: (_: string, __: unknown[]) => void; setPosition: (_: { lineNumber: number; column: number }) => void }, monaco: { KeyCode: { Space: number } }) => void;
  }) => {
    const editor = {
      addCommand: jest.fn((_: number, callback: () => void) => callback()),
      getPosition: jest.fn(() => ({ lineNumber: 2, column: 4 })),
      executeEdits: jest.fn(),
      setPosition: jest.fn(),
    };

    props.onMount?.(editor, { KeyCode: { Space: 1 } });

    return (
      <textarea
        data-testid="modal-editor"
        data-language={props.language}
        value={props.value}
        onChange={(e) => props.onChange?.(e.target.value)}
      />
    );
  },
}));

describe('CodeEditorModal', () => {
  const baseProps = {
    open: true,
    onClose: jest.fn(),
    onSave: jest.fn(),
    initialValue: 'const x = 1;',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and initial value', () => {
    render(<CodeEditorModal {...baseProps} title="Edit Query" language="sql" />);

    expect(screen.getByText('Edit Query')).toBeInTheDocument();
    expect(screen.getByTestId('modal-editor')).toHaveAttribute('data-language', 'sql');
    expect(screen.getByDisplayValue('const x = 1;')).toBeInTheDocument();
  });

  it('saves changed code and closes', () => {
    render(<CodeEditorModal {...baseProps} />);

    fireEvent.change(screen.getByTestId('modal-editor'), { target: { value: 'const x = 2;' } });
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }));

    expect(baseProps.onSave).toHaveBeenCalledWith('const x = 2;');
    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('cancels and closes without saving', () => {
    render(<CodeEditorModal {...baseProps} />);

    fireEvent.change(screen.getByTestId('modal-editor'), { target: { value: 'changed' } });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(baseProps.onSave).not.toHaveBeenCalled();
    expect(baseProps.onClose).toHaveBeenCalled();
  });
});
