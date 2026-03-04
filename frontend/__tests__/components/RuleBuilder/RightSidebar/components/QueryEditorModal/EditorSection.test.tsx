import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import EditorSection, { type EditorSectionHandle } from '../../../../../../src/components/RuleBuilder/RightSidebar/components/QueryEditorModal/EditorSection';

const mockEditor = {
  getValue: jest.fn(() => 'SELECT * FROM table'),
  setValue: jest.fn(),
  updateOptions: jest.fn(),
  getPosition: jest.fn(() => ({ lineNumber: 1, column: 1 })),
  setPosition: jest.fn(),
  executeEdits: jest.fn(),
  addCommand: jest.fn(),
};

const mockMonaco = {
  KeyCode: {
    Space: 32,
  },
  languages: {
    typescript: {
      ScriptTarget: { ESNext: 99 },
      ModuleKind: { ESNext: 99 },
      ModuleResolutionKind: { NodeJs: 2 },
      JsxEmit: { React: 2 },
    },
  },
};

jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ onMount, defaultValue }: { onMount?: (editor: typeof mockEditor, monaco: typeof mockMonaco) => void; defaultValue?: string }) => {
    React.useEffect(() => {
      if (onMount) {
        onMount(mockEditor as never, mockMonaco as never);
      }
    }, [onMount]);
    
    return (
      <div data-testid="monaco-editor">
        <textarea data-testid="monaco-textarea" defaultValue={defaultValue} />
      </div>
    );
  },
}));

describe('EditorSection Component', () => {
  const mockOnDrop = jest.fn();
  const mockOnDragOver = jest.fn();
  const mockOnDragEnter = jest.fn();
  const mockOnDragLeave = jest.fn();
  const mockOnEditorMount = jest.fn();

  const defaultProps = {
    initialValue: 'SELECT * FROM users',
    displayError: null,
    onDrop: mockOnDrop,
    onDragOver: mockOnDragOver,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render editor section', () => {
      render(<EditorSection {...defaultProps} />);
      
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should render tips alert', () => {
      render(<EditorSection {...defaultProps} />);
      
      expect(screen.getByText(/tips:/i)).toBeInTheDocument();
      expect(screen.getByText(/write your select query here/i)).toBeInTheDocument();
    });

    it('should render security note', () => {
      render(<EditorSection {...defaultProps} />);
      
      expect(screen.getByText(/note:/i)).toBeInTheDocument();
      expect(screen.getByText(/only select queries are allowed/i)).toBeInTheDocument();
    });

    it('should render with initial value', () => {
      render(<EditorSection {...defaultProps} initialValue="SELECT id FROM products" />);
      
      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue('SELECT id FROM products');
    });

    it('should render error alert when displayError is provided', () => {
      render(
        <EditorSection
          {...defaultProps}
          displayError="Invalid SQL query"
        />
      );
      
      expect(screen.getByText('Invalid SQL query')).toBeInTheDocument();
      const alerts = screen.getAllByRole('alert');
      const errorAlert = alerts.find(alert => alert.className.includes('Error'));
      expect(errorAlert).toBeDefined();
      expect(errorAlert?.className).toContain('MuiAlert');
    });

    it('should not render error alert when displayError is null', () => {
      render(<EditorSection {...defaultProps} displayError={null} />);
      
      const alerts = screen.getAllByRole('alert');
      // Should only have the info alert, not error alert
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toHaveClass('MuiAlert-outlinedInfo');
    });
  });

  describe('Drag and Drop', () => {
    it('should handle drop events', () => {
      render(<EditorSection {...defaultProps} />);
      
      const editor = screen.getByTestId('monaco-editor').parentElement;
      const dropEvent = new Event('drop', { bubbles: true });
      
      fireEvent.drop(editor!, dropEvent);
      
      expect(mockOnDrop).toHaveBeenCalled();
    });

    it('should handle dragOver events', () => {
      render(<EditorSection {...defaultProps} />);
      
      const editor = screen.getByTestId('monaco-editor').parentElement;
      const dragOverEvent = new Event('dragover', { bubbles: true });
      
      fireEvent.dragOver(editor!, dragOverEvent);
      
      expect(mockOnDragOver).toHaveBeenCalled();
    });

    it('should handle dragEnter events when provided', () => {
      render(
        <EditorSection
          {...defaultProps}
          onDragEnter={mockOnDragEnter}
        />
      );
      
      const editor = screen.getByTestId('monaco-editor').parentElement;
      const dragEnterEvent = new Event('dragenter', { bubbles: true });
      
      fireEvent.dragEnter(editor!, dragEnterEvent);
      
      expect(mockOnDragEnter).toHaveBeenCalled();
    });

    it('should handle dragLeave events when provided', () => {
      render(
        <EditorSection
          {...defaultProps}
          onDragLeave={mockOnDragLeave}
        />
      );
      
      const editor = screen.getByTestId('monaco-editor').parentElement;
      const dragLeaveEvent = new Event('dragleave', { bubbles: true });
      
      fireEvent.dragLeave(editor!, dragLeaveEvent);
      
      expect(mockOnDragLeave).toHaveBeenCalled();
    });
  });

  describe('Editor Configuration', () => {
    it('should configure editor with correct options on mount', () => {
      render(<EditorSection {...defaultProps} />);
      
      expect(mockEditor.updateOptions).toHaveBeenCalledWith({
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
        acceptSuggestionOnCommitCharacter: false,
        acceptSuggestionOnEnter: 'off',
        tabCompletion: 'off',
        wordBasedSuggestions: 'off',
        parameterHints: { enabled: false },
        formatOnType: false,
        autoIndent: 'none',
      });
    });

    it('should call onEditorMount callback when provided', () => {
      render(
        <EditorSection
          {...defaultProps}
          onEditorMount={mockOnEditorMount}
        />
      );
      
      expect(mockOnEditorMount).toHaveBeenCalledWith(mockEditor, mockMonaco);
    });

    it('should not fail when onEditorMount is not provided', () => {
      expect(() => {
        render(<EditorSection {...defaultProps} />);
      }).not.toThrow();
    });
  });

  describe('Ref Methods', () => {
    it('should expose getValue method via ref', () => {
      const ref = React.createRef<EditorSectionHandle>();
      
      render(<EditorSection {...defaultProps} ref={ref} />);
      
      mockEditor.getValue.mockReturnValue('SELECT * FROM orders');
      
      const value = ref.current?.getValue();
      expect(value).toBe('SELECT * FROM orders');
      expect(mockEditor.getValue).toHaveBeenCalled();
    });

    it('should return empty string when editor is not mounted', () => {
      const ref = React.createRef<EditorSectionHandle>();
      const LocalEditorSection = EditorSection as React.ForwardRefExoticComponent<{
        initialValue: string;
        displayError: string | null;
        onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
        onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
      } & React.RefAttributes<EditorSectionHandle>>;
      
      mockEditor.getValue.mockReturnValue('' as any);
      
      render(<LocalEditorSection {...defaultProps} ref={ref} />);
      
      const value = ref.current?.getValue();
      expect(value).toBe('');
    });

    it('should expose setValue method via ref', () => {
      const ref = React.createRef<EditorSectionHandle>();
      
      render(<EditorSection {...defaultProps} ref={ref} />);
      
      ref.current?.setValue('SELECT name FROM customers');
      
      expect(mockEditor.setValue).toHaveBeenCalledWith('SELECT name FROM customers');
    });

    it('should expose editor instance via ref', () => {
      const ref = React.createRef<EditorSectionHandle>();
      
      render(<EditorSection {...defaultProps} ref={ref} />);

      expect(ref.current).toBeTruthy();
      expect(ref.current?.getValue).toBeDefined();
      expect(ref.current?.setValue).toBeDefined();
    });

    it('should handle setValue when editor is null', () => {
      const ref = React.createRef<EditorSectionHandle>();
      
      render(<EditorSection {...defaultProps} ref={ref} />);

      if (ref.current) {
        (ref.current as { editor: unknown }).editor = null;
      }
      
      expect(() => ref.current?.setValue('test')).not.toThrow();
    });
  });

  describe('Display Name', () => {
    it('should have correct display name', () => {
      expect(EditorSection.displayName).toBe('EditorSection');
    });
  });

  describe('Error Handling', () => {
    it('should display multiple types of errors', () => {
      const { rerender } = render(
        <EditorSection
          {...defaultProps}
          displayError="Syntax error"
        />
      );
      
      expect(screen.getByText('Syntax error')).toBeInTheDocument();
      
      rerender(
        <EditorSection
          {...defaultProps}
          displayError="Connection timeout"
        />
      );
      
      expect(screen.getByText('Connection timeout')).toBeInTheDocument();
    });

    it('should clear error when displayError becomes null', () => {
      const { rerender } = render(
        <EditorSection
          {...defaultProps}
          displayError="Error message"
        />
      );
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
      
      rerender(
        <EditorSection
          {...defaultProps}
          displayError={null}
        />
      );
      
      expect(screen.queryByText('Error message')).not.toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should render editor in dark theme', () => {
      render(<EditorSection {...defaultProps} />);
      
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toBeInTheDocument();
    });

    it('should use SQL language mode', () => {
      render(<EditorSection {...defaultProps} />);
      
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should re-render when initialValue changes', () => {
      const { rerender } = render(
        <EditorSection {...defaultProps} initialValue="SELECT * FROM table1" />
      );
      
      expect(screen.getByTestId('monaco-textarea')).toHaveValue('SELECT * FROM table1');
      
      rerender(
        <EditorSection {...defaultProps} initialValue="SELECT * FROM table2" />
      );
      
      expect(screen.getByTestId('monaco-textarea')).toHaveValue('SELECT * FROM table2');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty initial value', () => {
      render(<EditorSection {...defaultProps} initialValue="" />);
      
      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue('');
    });

    it('should handle long error messages', () => {
      const longError = 'A'.repeat(500);
      
      render(
        <EditorSection
          {...defaultProps}
          displayError={longError}
        />
      );
      
      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it('should handle complex SQL queries', () => {
      const complexQuery = `
        SELECT 
          u.id, 
          u.name, 
          COUNT(o.id) as order_count
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.created_at > '2024-01-01'
        GROUP BY u.id, u.name
        HAVING COUNT(o.id) > 5
        ORDER BY order_count DESC
        LIMIT 100
      `;
      
      render(<EditorSection {...defaultProps} initialValue={complexQuery} />);
      
      expect(screen.getByTestId('monaco-textarea')).toHaveValue(complexQuery);
    });
  });
});
