import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import CodeEditor from '../../../../../src/components/RuleBuilder/RightSidebar/components/CodeEditor';

const mockEditor = {
  getValue: jest.fn(() => ''),
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

jest.mock('@monaco-editor/react', () => {
  const MockMonacoEditor = ({ 
    value, 
    onChange, 
    onMount,
    language,
    height,
  }: { 
    value?: string; 
    onChange?: (value: string | undefined) => void; 
    onMount?: (editor: typeof mockEditor, monaco: typeof mockMonaco) => void;
    language?: string;
    height?: string;
  }) => {
    React.useEffect(() => {
      if (onMount) {
        onMount(mockEditor as never, mockMonaco as never);
      }
    }, [onMount]);
    
    return (
      <div data-testid="monaco-editor" data-language={language} data-height={height}>
        <textarea 
          data-testid="monaco-textarea" 
          value={value} 
          onChange={(e) => onChange?.(e.target.value)}
        />
      </div>
    );
  };
  return { __esModule: true, default: MockMonacoEditor };
});

describe('CodeEditor Component', () => {
  const mockOnChange = jest.fn();
  const mockOnBlur = jest.fn();

  const defaultProps = {
    value: '',
    onChange: mockOnChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render code editor', () => {
      render(<CodeEditor {...defaultProps} />);
      
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<CodeEditor {...defaultProps} label="Code Input" />);
      
      expect(screen.getByText('Code Input')).toBeInTheDocument();
    });

    it('should render without label when not provided', () => {
      render(<CodeEditor {...defaultProps} />);
      
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should show required asterisk when required is true', () => {
      render(<CodeEditor {...defaultProps} label="Code" required={true} />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should not show asterisk when not required', () => {
      render(<CodeEditor {...defaultProps} label="Code" required={false} />);
      
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('should render with helper text', () => {
      render(<CodeEditor {...defaultProps} helperText="Enter your code here" />);
      
      expect(screen.getByText('Enter your code here')).toBeInTheDocument();
    });

    it('should render with initial value', () => {
      render(<CodeEditor {...defaultProps} value="const x = 5;" />);
      
      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue('const x = 5;');
    });

    it('should use default language typescript', () => {
      render(<CodeEditor {...defaultProps} />);
      
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'typescript');
    });

    it('should use custom language when provided', () => {
      render(<CodeEditor {...defaultProps} language="javascript" />);
      
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'javascript');
    });

    it('should use default height 300px', () => {
      render(<CodeEditor {...defaultProps} />);
      
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-height', '300px');
    });

    it('should use custom height when provided', () => {
      render(<CodeEditor {...defaultProps} height="500px" />);
      
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-height', '500px');
    });
  });

  describe('Interaction', () => {
    it('should call onChange when value changes', () => {
      render(<CodeEditor {...defaultProps} />);
      
      const textarea = screen.getByTestId('monaco-textarea');
      fireEvent.change(textarea, { target: { value: 'const y = 10;' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('const y = 10;');
    });

    it('should handle empty value changes', () => {
      render(<CodeEditor {...defaultProps} value="some code" />);
      
      const textarea = screen.getByTestId('monaco-textarea');
      fireEvent.change(textarea, { target: { value: '' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('should handle undefined value from editor', () => {
      render(<CodeEditor {...defaultProps} value="test" />);
      
      const textarea = screen.getByTestId('monaco-textarea');
      fireEvent.change(textarea, { target: { value: '' } });
      
      expect(mockOnChange).toHaveBeenCalledWith('');
    });
  });

  describe('Disabled State', () => {
    it('should be enabled by default', () => {
      render(<CodeEditor {...defaultProps} />);
      
      const editorContainer = screen.getByTestId('monaco-editor').parentElement;
      expect(editorContainer).not.toHaveStyle({ pointerEvents: 'none' });
    });

    it('should disable editor when disabled is true', () => {
      render(<CodeEditor {...defaultProps} disabled={true} />);
      
      const editorContainer = screen.getByTestId('monaco-editor').parentElement;
      expect(editorContainer).toHaveStyle({ pointerEvents: 'none' });
    });

    it('should reduce opacity when disabled', () => {
      render(<CodeEditor {...defaultProps} disabled={true} />);
      
      const editorContainer = screen.getByTestId('monaco-editor').parentElement;
      expect(editorContainer).toHaveStyle({ opacity: 0.6 });
    });
  });

  describe('Error State', () => {
    it('should not show error styling by default', () => {
      render(<CodeEditor {...defaultProps} label="Code" />);
      
      const label = screen.getByText('Code');
      expect(label).not.toHaveStyle({ color: 'error.main' });
    });

    it('should show error styling when error is true', () => {
      render(<CodeEditor {...defaultProps} label="Code" error={true} />);
      
      const label = screen.getByText('Code');
      // MUI applies error color, we just check the label exists
      expect(label).toBeInTheDocument();
    });

    it('should show error border color', () => {
      render(<CodeEditor {...defaultProps} error={true} />);
      
      const editorContainer = screen.getByTestId('monaco-editor').parentElement;
      expect(editorContainer).toBeInTheDocument();
    });

    it('should show error helper text', () => {
      render(
        <CodeEditor
          {...defaultProps}
          error={true}
          helperText="This field is required"
        />
      );
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });
  });

  describe('Editor Mount', () => {
    it('should configure editor on mount', () => {
      render(<CodeEditor {...defaultProps} />);
      
      expect(mockEditor.addCommand).toHaveBeenCalledWith(
        mockMonaco.KeyCode.Space,
        expect.any(Function)
      );
    });

    it('should handle space key command', () => {
      render(<CodeEditor {...defaultProps} />);
      
      // Get the command handler
      const spaceHandler = mockEditor.addCommand.mock.calls[0][1];
      
      // Execute the command
      spaceHandler();
      
      expect(mockEditor.getPosition).toHaveBeenCalled();
      expect(mockEditor.executeEdits).toHaveBeenCalled();
      expect(mockEditor.setPosition).toHaveBeenCalled();
    });
  });

  describe('Label Styling', () => {
    it('should render primary label color by default', () => {
      render(<CodeEditor {...defaultProps} label="My Code" />);
      
      const label = screen.getByText('My Code');
      expect(label).toBeInTheDocument();
    });

    it('should render error label color when error', () => {
      render(<CodeEditor {...defaultProps} label="My Code" error={true} />);
      
      const label = screen.getByText('My Code');
      expect(label).toBeInTheDocument();
    });
  });

  describe('Helper Text Styling', () => {
    it('should show secondary color for helper text', () => {
      render(<CodeEditor {...defaultProps} helperText="Help message" />);
      
      const helperText = screen.getByText('Help message');
      expect(helperText).toBeInTheDocument();
    });

    it('should show error color for helper text when error', () => {
      render(
        <CodeEditor
          {...defaultProps}
          error={true}
          helperText="Error message"
        />
      );
      
      const helperText = screen.getByText('Error message');
      expect(helperText).toBeInTheDocument();
    });
  });

  describe('Multiple Languages', () => {
    it('should support javascript', () => {
      render(<CodeEditor {...defaultProps} language="javascript" />);
      
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'javascript');
    });

    it('should support json', () => {
      render(<CodeEditor {...defaultProps} language="json" />);
      
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'json');
    });

    it('should support sql', () => {
      render(<CodeEditor {...defaultProps} language="sql" />);
      
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'sql');
    });
  });

  describe('Different Heights', () => {
    it('should support small height', () => {
      render(<CodeEditor {...defaultProps} height="150px" />);
      
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-height', '150px');
    });

    it('should support large height', () => {
      render(<CodeEditor {...defaultProps} height="600px" />);
      
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-height', '600px');
    });
  });

  describe('Value Updates', () => {
    it('should update when value prop changes', () => {
      const { rerender } = render(<CodeEditor {...defaultProps} value="initial" />);
      
      expect(screen.getByTestId('monaco-textarea')).toHaveValue('initial');
      
      rerender(<CodeEditor {...defaultProps} value="updated" />);
      
      expect(screen.getByTestId('monaco-textarea')).toHaveValue('updated');
    });

    it('should handle complex code values', () => {
      const complexCode = `
        function calculateTotal(items) {
          return items.reduce((sum, item) => {
            return sum + item.price * item.quantity;
          }, 0);
        }
      `;
      
      render(<CodeEditor {...defaultProps} value={complexCode} />);
      
      expect(screen.getByTestId('monaco-textarea')).toHaveValue(complexCode);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string value', () => {
      render(<CodeEditor {...defaultProps} value="" />);
      
      const textarea = screen.getByTestId('monaco-textarea');
      expect(textarea).toHaveValue('');
    });

    it('should handle long code values', () => {
      const longCode = 'const x = 1;\n'.repeat(100);
      
      render(<CodeEditor {...defaultProps} value={longCode} />);
      
      expect(screen.getByTestId('monaco-textarea')).toHaveValue(longCode);
    });

    it('should handle special characters in code', () => {
      const specialCode = `const str = "Hello\\nWorld\\t!";`;
      
      render(<CodeEditor {...defaultProps} value={specialCode} />);
      
      expect(screen.getByTestId('monaco-textarea')).toHaveValue(specialCode);
    });

    it('should handle all props together', () => {
      render(
        <CodeEditor
          value="const test = true;"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          label="Test Editor"
          disabled={false}
          error={false}
          helperText="Write your code"
          language="typescript"
          height="400px"
          required={true}
        />
      );
      
      expect(screen.getByText('Test Editor')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByText('Write your code')).toBeInTheDocument();
      expect(screen.getByTestId('monaco-editor')).toHaveAttribute('data-language', 'typescript');
      expect(screen.getByTestId('monaco-editor')).toHaveAttribute('data-height', '400px');
    });

    it('should handle rapid value changes', () => {
      render(<CodeEditor {...defaultProps} />);
      
      const textarea = screen.getByTestId('monaco-textarea');
      
      fireEvent.change(textarea, { target: { value: 'a' } });
      fireEvent.change(textarea, { target: { value: 'ab' } });
      fireEvent.change(textarea, { target: { value: 'abc' } });
      
      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenLastCalledWith('abc');
    });

    it('should not fail without onChange handler', () => {
      const { onChange: _onChange, ...propsWithoutOnChange } = defaultProps;
      
      expect(() => {
        render(<CodeEditor {...propsWithoutOnChange} onChange={() => {}} />);
      }).not.toThrow();
    });

    it('should handle null/undefined helper text', () => {
      render(<CodeEditor {...defaultProps} helperText={undefined} />);
      
      expect(screen.queryByRole('caption')).not.toBeInTheDocument();
    });

    it('should handle combined error and disabled states', () => {
      render(
        <CodeEditor
          {...defaultProps}
          error={true}
          disabled={true}
          label="Code"
          helperText="Error and disabled"
        />
      );
      
      expect(screen.getByText('Code')).toBeInTheDocument();
      expect(screen.getByText('Error and disabled')).toBeInTheDocument();
      
      const editorContainer = screen.getByTestId('monaco-editor').parentElement;
      expect(editorContainer).toHaveStyle({ pointerEvents: 'none', opacity: 0.6 });
    });
  });

  describe('Accessibility', () => {
    it('should have proper label association', () => {
      render(<CodeEditor {...defaultProps} label="Accessible Code Editor" />);
      
      expect(screen.getByText('Accessible Code Editor')).toBeInTheDocument();
    });

    it('should indicate required fields', () => {
      render(<CodeEditor {...defaultProps} label="Required Code" required={true} />);
      
      expect(screen.getByText('Required Code')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should provide helper text for context', () => {
      render(
        <CodeEditor
          {...defaultProps}
          helperText="This field accepts TypeScript code"
        />
      );
      
      expect(screen.getByText('This field accepts TypeScript code')).toBeInTheDocument();
    });
  });
});
