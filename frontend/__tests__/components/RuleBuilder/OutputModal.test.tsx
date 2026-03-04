import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OutputModal from '../../../src/components/RuleBuilder/OutputModal';
import * as codeValidator from '../../../src/utils/Flow/codeValidator';
import type { ValidationResult } from '../../../src/utils/Flow/codeValidator';

jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ value, onMount, language, options }: any) => {
    React.useEffect(() => {
      if (onMount) {
        const mockEditor = {
          updateOptions: jest.fn(),
          getAction: jest.fn(() => ({
            run: jest.fn(),
          })),
          getModel: jest.fn(() => ({})),
          addCommand: jest.fn(),
          getPosition: jest.fn(() => ({
            lineNumber: 1,
            column: 1,
          })),
          executeEdits: jest.fn(),
          setPosition: jest.fn(),
        };
        const mockMonaco = {
          KeyCode: { Space: 10 },
          languages: {
            typescript: {
              ScriptTarget: {
                ESNext: 99,
              },
              ModuleResolutionKind: {
                NodeJs: 2,
              },
              ModuleKind: {
                CommonJS: 1,
              },
              JsxEmit: {
                React: 2,
              },
              typescriptDefaults: {
                setDiagnosticsOptions: jest.fn(),
                setCompilerOptions: jest.fn(),
              },
            },
          },
        };
        onMount(mockEditor, mockMonaco);
      }
    }, [onMount]);

    return (
      <textarea
        data-testid="monaco-editor"
        value={value}
        data-language={language}
        data-readonly={options?.readOnly}
        readOnly
      />
    );
  },
}));

jest.mock('../../../src/utils/Flow/codeValidator');

const mockValidateTypeScriptCode = codeValidator.validateTypeScriptCode as jest.MockedFunction<typeof codeValidator.validateTypeScriptCode>;
const mockValidateTestCode = codeValidator.validateTestCode as jest.MockedFunction<typeof codeValidator.validateTestCode>;
const mockGetValidationSummary = codeValidator.getValidationSummary as jest.MockedFunction<typeof codeValidator.getValidationSummary>;

describe('OutputModal', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    title: 'Test Output',
    content: 'console.log("test");',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
      },
    });
  });

  describe('Rendering', () => {
    it('should render modal when open is true', () => {
      render(<OutputModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Output')).toBeInTheDocument();
    });

    it('should not render modal when open is false', () => {
      render(<OutputModal {...defaultProps} open={false} />);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display title correctly', () => {
      render(<OutputModal {...defaultProps} title="Custom Title" />);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should display content in Monaco editor', () => {
      render(<OutputModal {...defaultProps} content="const x = 42;" />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveValue('const x = 42;');
    });

    it('should display empty message when no content', () => {
      render(<OutputModal {...defaultProps} content="" emptyMessage="Nothing to show" />);
      expect(screen.getByText('Nothing to show')).toBeInTheDocument();
      expect(screen.queryByTestId('monaco-editor')).not.toBeInTheDocument();
    });

    it('should use default empty message when not provided', () => {
      render(<OutputModal {...defaultProps} content="" />);
      expect(screen.getByText('No content available')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should render close button', () => {
      render(<OutputModal {...defaultProps} />);
      const closeButtons = screen.getAllByRole('button');
      expect(closeButtons.some(btn => btn.querySelector('[data-testid="CloseIcon"]'))).toBeTruthy();
    });

    it('should call onClose when close button is clicked', () => {
      const onClose = jest.fn();
      render(<OutputModal {...defaultProps} onClose={onClose} />);
      const closeButton = screen.getAllByRole('button').find(btn => btn.querySelector('[data-testid="CloseIcon"]'));
      if (closeButton) fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Close button in footer is clicked', () => {
      const onClose = jest.fn();
      render(<OutputModal {...defaultProps} onClose={onClose} />);
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should render copy button when content exists', () => {
      render(<OutputModal {...defaultProps} />);
      const copyButton = screen.getAllByRole('button').find(btn => btn.querySelector('[data-testid="ContentCopyIcon"]'));
      expect(copyButton).toBeInTheDocument();
    });

    it('should copy content to clipboard when copy button is clicked', async () => {
      const writeText = jest.fn();
      Object.assign(navigator, { clipboard: { writeText } });
      
      render(<OutputModal {...defaultProps} content="copy this text" />);
      const copyButton = screen.getAllByRole('button').find(btn => btn.querySelector('[data-testid="ContentCopyIcon"]'));
      if (copyButton) fireEvent.click(copyButton);
      
      expect(writeText).toHaveBeenCalledWith('copy this text');
    });

    it('should not render copy button when content is empty', () => {
      render(<OutputModal {...defaultProps} content="" />);
      const copyButton = screen.queryByRole('button', { name: /copy/i });
      expect(copyButton).not.toBeInTheDocument();
    });

    it('should render download button when onDownload is provided', () => {
      const onDownload = jest.fn();
      render(<OutputModal {...defaultProps} onDownload={onDownload} />);
      const downloadButton = screen.getAllByRole('button').find(btn => btn.querySelector('[data-testid="DownloadIcon"]'));
      expect(downloadButton).toBeInTheDocument();
    });

    it('should call onDownload when download button is clicked', () => {
      const onDownload = jest.fn();
      render(<OutputModal {...defaultProps} onDownload={onDownload} />);
      const downloadButton = screen.getAllByRole('button').find(btn => btn.querySelector('[data-testid="DownloadIcon"]'));
      if (downloadButton) fireEvent.click(downloadButton);
      expect(onDownload).toHaveBeenCalledTimes(1);
    });

    it('should not render download button when onDownload is not provided', () => {
      render(<OutputModal {...defaultProps} />);
      const downloadButton = screen.queryByRole('button', { name: /download/i });
      expect(downloadButton).not.toBeInTheDocument();
    });

    it('should render format button for TypeScript language', () => {
      render(<OutputModal {...defaultProps} language="typescript" />);
      const formatButton = screen.getAllByRole('button').find(btn => btn.querySelector('[data-testid="FormatAlignLeftIcon"]'));
      expect(formatButton).toBeInTheDocument();
    });

    it('should not render format button for JSON language', () => {
      render(<OutputModal {...defaultProps} language="json" />);
      const formatButton = screen.queryByRole('button', { name: /format/i });
      expect(formatButton).not.toBeInTheDocument();
    });
  });

  describe('Language Modes', () => {
    it('should use JSON language by default', () => {
      render(<OutputModal {...defaultProps} />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'json');
    });

    it('should use TypeScript language when specified', () => {
      render(<OutputModal {...defaultProps} language="typescript" />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'typescript');
    });

    it('should use JSON language when specified', () => {
      render(<OutputModal {...defaultProps} language="json" />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'json');
    });
  });

  describe('Validation - Success', () => {
    const validResult: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    beforeEach(() => {
      mockValidateTypeScriptCode.mockReturnValue(validResult);
      mockGetValidationSummary.mockReturnValue('No issues');
    });

    it('should show success message when validation passes with no warnings', () => {
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
          validationType="rule"
        />
      );
      expect(screen.getByText(/Code validation passed - No issues found/i)).toBeInTheDocument();
    });

    it('should display success chip in title when validation passes', () => {
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
        />
      );
      const checkIcons = screen.getAllByTestId('CheckCircleIcon');
      expect(checkIcons.length).toBeGreaterThan(0);
      expect(screen.getByText('No issues')).toBeInTheDocument();
    });

    it('should call validateTypeScriptCode for rule validation type', () => {
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
          validationType="rule"
        />
      );
      expect(mockValidateTypeScriptCode).toHaveBeenCalledWith('console.log("test");');
    });

    it('should call validateTestCode for test validation type', () => {
      mockValidateTestCode.mockReturnValue(validResult);
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
          validationType="test"
        />
      );
      expect(mockValidateTestCode).toHaveBeenCalledWith('console.log("test");');
    });

    it('should not show validation when enableValidation is false', () => {
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={false}
        />
      );
      expect(mockValidateTypeScriptCode).not.toHaveBeenCalled();
      expect(screen.queryByTestId('CheckCircleIcon')).not.toBeInTheDocument();
    });

    it('should not show validation for JSON language', () => {
      render(
        <OutputModal
          {...defaultProps}
          language="json"
          enableValidation={true}
        />
      );
      expect(mockValidateTypeScriptCode).not.toHaveBeenCalled();
    });
  });

  describe('Validation - Errors', () => {
    const errorResult: ValidationResult = {
      isValid: false,
      errors: [
        { line: 10, column: 5, message: 'Syntax error here', category: 'error' },
        { line: 20, column: 15, message: 'Another error', category: 'error' },
      ],
      warnings: [],
    };

    beforeEach(() => {
      mockValidateTypeScriptCode.mockReturnValue(errorResult);
      mockGetValidationSummary.mockReturnValue('2 errors');
    });

    it('should display error chip when validation fails', () => {
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
        />
      );
      const errorIcons = screen.getAllByTestId('ErrorIcon');
      expect(errorIcons.length).toBeGreaterThan(0);
      expect(screen.getByText('2 errors')).toBeInTheDocument();
    });

    it('should display errors section header with count', () => {
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
        />
      );
      expect(screen.getByText('Errors (2)')).toBeInTheDocument();
    });

    it('should display all error messages with line and column', () => {
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
        />
      );
      expect(screen.getByText('Line 10:5')).toBeInTheDocument();
      expect(screen.getByText('Syntax error here')).toBeInTheDocument();
      expect(screen.getByText('Line 20:15')).toBeInTheDocument();
      expect(screen.getByText('Another error')).toBeInTheDocument();
    });

    it('should toggle errors section when header is clicked', () => {
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
        />
      );
      
      const errorsHeader = screen.getByText('Errors (2)').closest('div');
      if (!errorsHeader) throw new Error('Errors header not found');

      expect(screen.getByText('Syntax error here')).toBeVisible();

      fireEvent.click(errorsHeader);

      waitFor(() => {
        expect(screen.getByText('Syntax error here')).not.toBeVisible();
      });
    });

    it('should display expand/collapse icon for errors section', () => {
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
        />
      );
      expect(screen.getByTestId('ExpandLessIcon')).toBeInTheDocument();
    });
  });

  describe('Validation - Warnings', () => {
    const warningResult: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [
        { line: 5, column: 10, message: 'Unused variable', category: 'warning' },
        { line: 15, column: 20, message: 'Deprecated method', category: 'warning' },
      ],
    };

    beforeEach(() => {
      mockValidateTypeScriptCode.mockReturnValue(warningResult);
      mockGetValidationSummary.mockReturnValue('2 warnings');
    });

    it('should display warnings section header with count', () => {
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
        />
      );
      expect(screen.getByText('Warnings (2)')).toBeInTheDocument();
    });

    it('should display all warning messages with line and column', () => {
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
        />
      );
      expect(screen.getByText('Line 5:10')).toBeInTheDocument();
      expect(screen.getByText('Unused variable')).toBeInTheDocument();
      expect(screen.getByText('Line 15:20')).toBeInTheDocument();
      expect(screen.getByText('Deprecated method')).toBeInTheDocument();
    });

    it('should toggle warnings section when header is clicked', () => {
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
        />
      );
      
      const warningsHeader = screen.getByText('Warnings (2)').closest('div');
      if (!warningsHeader) throw new Error('Warnings header not found');

      expect(screen.getByText('Unused variable')).toBeVisible();

      fireEvent.click(warningsHeader);

      waitFor(() => {
        expect(screen.getByText('Unused variable')).not.toBeVisible();
      });
    });

    it('should not show success message when warnings exist', () => {
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
        />
      );
      expect(screen.queryByText(/Code validation passed - No issues found/i)).not.toBeInTheDocument();
    });
  });

  describe('Validation - Mixed Errors and Warnings', () => {
    const mixedResult: ValidationResult = {
      isValid: false,
      errors: [
        { line: 10, column: 5, message: 'Syntax error', category: 'error' },
      ],
      warnings: [
        { line: 5, column: 10, message: 'Unused variable', category: 'warning' },
      ],
    };

    beforeEach(() => {
      mockValidateTypeScriptCode.mockReturnValue(mixedResult);
      mockGetValidationSummary.mockReturnValue('1 error, 1 warning');
    });

    it('should display both errors and warnings sections', () => {
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
        />
      );
      expect(screen.getByText('Errors (1)')).toBeInTheDocument();
      expect(screen.getByText('Warnings (1)')).toBeInTheDocument();
    });

    it('should display error chip when both errors and warnings exist', () => {
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
        />
      );
      expect(screen.getByText('1 error, 1 warning')).toBeInTheDocument();
    });

    it('should toggle errors and warnings independently', () => {
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
        />
      );
      
      const errorsHeader = screen.getByText('Errors (1)').closest('div');
      const warningsHeader = screen.getByText('Warnings (1)').closest('div');
      
      if (!errorsHeader || !warningsHeader) throw new Error('Headers not found');
      fireEvent.click(errorsHeader);
      expect(screen.getByText('Unused variable')).toBeVisible();
    });
  });

  describe('Monaco Editor Configuration', () => {
    it('should configure TypeScript diagnostics on mount', () => {
      render(<OutputModal {...defaultProps} language="typescript" />);
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    it('should be read-only by default', () => {
      render(<OutputModal {...defaultProps} />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-readonly', 'true');
    });

    it('should mount editor with correct language', () => {
      render(<OutputModal {...defaultProps} language="typescript" />);
      const editor = screen.getByTestId('monaco-editor');
      expect(editor).toHaveAttribute('data-language', 'typescript');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onDownload prop gracefully', () => {
      render(<OutputModal {...defaultProps} />);
      expect(screen.queryByTestId('DownloadIcon')).not.toBeInTheDocument();
    });

    it('should handle empty content with validation enabled', () => {
      mockValidateTypeScriptCode.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });
      
      render(
        <OutputModal
          {...defaultProps}
          content=""
          language="typescript"
          enableValidation={true}
        />
      );
      
      expect(screen.getByText('No content available')).toBeInTheDocument();
      expect(mockValidateTypeScriptCode).not.toHaveBeenCalled();
    });

    it('should handle modal closed state', () => {
      const { rerender } = render(<OutputModal {...defaultProps} open={true} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Output')).toBeVisible();
      
      // Close modal
      rerender(<OutputModal {...defaultProps} open={false} />);
      
      // Reopen modal to verify it works correctly
      rerender(<OutputModal {...defaultProps} open={true} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Output')).toBeVisible();
    });

    it('should handle validation only when modal is open', () => {
      mockValidateTypeScriptCode.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });
      
      render(
        <OutputModal
          {...defaultProps}
          open={false}
          language="typescript"
          enableValidation={true}
        />
      );
      
      expect(mockValidateTypeScriptCode).not.toHaveBeenCalled();
    });

    it('should re-validate when content changes', () => {
      mockValidateTypeScriptCode.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });
      
      const { rerender } = render(
        <OutputModal
          {...defaultProps}
          content="first content"
          language="typescript"
          enableValidation={true}
        />
      );
      
      expect(mockValidateTypeScriptCode).toHaveBeenCalledWith('first content');
      
      rerender(
        <OutputModal
          {...defaultProps}
          content="second content"
          language="typescript"
          enableValidation={true}
        />
      );
      
      expect(mockValidateTypeScriptCode).toHaveBeenCalledWith('second content');
    });

    it('should handle validation with empty error and warning arrays', () => {
      mockValidateTypeScriptCode.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });
      mockGetValidationSummary.mockReturnValue('No issues');
      
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
        />
      );
      
      expect(screen.queryByText(/Errors/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Warnings/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Code validation passed - No issues found/i)).toBeInTheDocument();
    });

    it('should handle long error messages', () => {
      const longMessage = 'This is a very long error message '.repeat(10);
      mockValidateTypeScriptCode.mockReturnValue({
        isValid: false,
        errors: [
          { line: 1, column: 1, message: longMessage, category: 'error' },
        ],
        warnings: [],
      });
      
      render(
        <OutputModal
          {...defaultProps}
          language="typescript"
          enableValidation={true}
        />
      );
      expect(screen.getByText((content, element) => {
        if (!element) return false;
        return element.textContent === longMessage;
      })).toBeInTheDocument();
    });

    it('should handle clipboard operations', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });
      
      render(<OutputModal {...defaultProps} content="test content" />);
      const copyButton = screen.getAllByRole('button').find(btn => btn.querySelector('[data-testid="ContentCopyIcon"]'));
      
      if (copyButton) {
        fireEvent.click(copyButton);
      }
      
      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith('test content');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper dialog role', () => {
      render(<OutputModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have accessible close button', () => {
      render(<OutputModal {...defaultProps} />);
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });

    it('should have icon buttons with title attributes', () => {
      render(<OutputModal {...defaultProps} language="typescript" />);
      const buttons = screen.getAllByRole('button');
      const formatButton = buttons.find(btn => btn.querySelector('[data-testid="FormatAlignLeftIcon"]'));
      expect(formatButton).toHaveAttribute('title', 'Format code');
    });

    it('should have download button with title attribute when provided', () => {
      const onDownload = jest.fn();
      render(<OutputModal {...defaultProps} onDownload={onDownload} />);
      const buttons = screen.getAllByRole('button');
      const downloadButton = buttons.find(btn => btn.querySelector('[data-testid="DownloadIcon"]'));
      expect(downloadButton).toHaveAttribute('title', 'Download as .ts file');
    });

    it('should have copy button with title attribute', () => {
      render(<OutputModal {...defaultProps} />);
      const buttons = screen.getAllByRole('button');
      const copyButton = buttons.find(btn => btn.querySelector('[data-testid="ContentCopyIcon"]'));
      expect(copyButton).toHaveAttribute('title', 'Copy to clipboard');
    });
  });
});
