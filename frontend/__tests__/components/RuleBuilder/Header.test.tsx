import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Header from '../../../src/components/RuleBuilder/Header';
import { useValidationContext } from '../../../src/validation/context';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../../../src/validation/context', () => ({
  useValidationContext: jest.fn(),
}));

const mockUseNavigate = jest.fn();
const mockUseValidationContext = useValidationContext as jest.MockedFunction<typeof useValidationContext>;

describe('RuleBuilder Header Component', () => {
  const defaultProps = {
    onPlayClick: jest.fn(),
    onStopClick: jest.fn(),
    onDisplayJson: jest.fn(),
    onGenerateCode: jest.fn(),
    title: 'Rule Builder',
    backUrl: '/editor',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { useNavigate } = require('react-router-dom');
    useNavigate.mockReturnValue(mockUseNavigate);
    
    mockUseValidationContext.mockReturnValue({
      hasErrors: false,
      getErrorCount: jest.fn(() => 0),
      errors: new Map(),
      setNodeErrors: jest.fn(),
      clearNodeErrors: jest.fn(),
      clearAllErrors: jest.fn(),
      getNodeError: jest.fn(),
      getAllErrors: jest.fn(() => []),
    });
  });

  const renderHeader = (props = {}) => {
    return render(
      <BrowserRouter>
        <Header {...defaultProps} {...props} />
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('should render header with title', () => {
      renderHeader();
      expect(screen.getByText('Rule Builder')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      renderHeader({ title: 'Test Cases Generation' });
      expect(screen.getByText('Test Cases Generation')).toBeInTheDocument();
    });

    it('should render view only mode', () => {
      renderHeader({ viewOnly: true });
      expect(screen.getByText(/\(View Only\)/)).toBeInTheDocument();
    });

    it('should render back button', () => {
      renderHeader();
      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderHeader();
      expect(screen.getByRole('button', { name: /display json/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate code/i })).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onDisplayJson when Display JSON button is clicked', () => {
      renderHeader();
      const displayJsonButton = screen.getByRole('button', { name: /display json/i });
      fireEvent.click(displayJsonButton);
      expect(defaultProps.onDisplayJson).toHaveBeenCalledTimes(1);
    });

    it('should call onGenerateCode when Generate Code button is clicked', () => {
      renderHeader();
      const generateCodeButton = screen.getByRole('button', { name: /generate code/i });
      fireEvent.click(generateCodeButton);
      expect(defaultProps.onGenerateCode).toHaveBeenCalledTimes(1);
    });

    it('should navigate back when back button is clicked', () => {
      renderHeader();
      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);
      expect(mockUseNavigate).toHaveBeenCalledWith('/editor');
    });

    it('should call onPlayClick when play button is clicked', () => {
      renderHeader({ hidePlayControls: false });
      const playButton = screen.getByRole('button', { name: 'Play' });
      fireEvent.click(playButton);
      expect(defaultProps.onPlayClick).toHaveBeenCalledTimes(1);
    });

    it('should call onStopClick when stop button is clicked', () => {
      renderHeader({ isPlaying: true, hidePlayControls: false });
      const stopButton = screen.getByRole('button', { name: /stop/i });
      fireEvent.click(stopButton);
      expect(defaultProps.onStopClick).toHaveBeenCalledTimes(1);
    });

    it('should call onSave when save button is clicked', () => {
      const onSave = jest.fn();
      renderHeader({ onSave });
      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('should call onReset when reset button is clicked', () => {
      const onReset = jest.fn();
      const onSave = jest.fn();
      renderHeader({ onSave, onReset });
      const resetButton = screen.getByRole('button', { name: /reset/i });
      fireEvent.click(resetButton);
      expect(onReset).toHaveBeenCalledTimes(1);
    });

    it('should call onViewErrors when view errors button is clicked', () => {
      const onViewErrors = jest.fn();
      mockUseValidationContext.mockReturnValue({
        hasErrors: true,
        getErrorCount: jest.fn(() => 3),
        errors: new Map(),
        setNodeErrors: jest.fn(),
        clearNodeErrors: jest.fn(),
        clearAllErrors: jest.fn(),
        getNodeError: jest.fn(),
        getAllErrors: jest.fn(() => []),
      });
      
      renderHeader({ onViewErrors });
      const errorsButton = screen.getByRole('button', { name: /errors/i });
      fireEvent.click(errorsButton);
      expect(onViewErrors).toHaveBeenCalledTimes(1);
    });
  });

  describe('Validation Errors', () => {
    it('should display error count badge when there are errors', () => {
      mockUseValidationContext.mockReturnValue({
        hasErrors: true,
        getErrorCount: jest.fn(() => 5),
        errors: new Map(),
        setNodeErrors: jest.fn(),
        clearNodeErrors: jest.fn(),
        clearAllErrors: jest.fn(),
        getNodeError: jest.fn(),
        getAllErrors: jest.fn(() => []),
      });

      renderHeader({ onViewErrors: jest.fn() });
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should disable play button when there are validation errors', () => {
      mockUseValidationContext.mockReturnValue({
        hasErrors: true,
        getErrorCount: jest.fn(() => 2),
        errors: new Map(),
        setNodeErrors: jest.fn(),
        clearNodeErrors: jest.fn(),
        clearAllErrors: jest.fn(),
        getNodeError: jest.fn(),
        getAllErrors: jest.fn(() => []),
      });

      renderHeader({ hidePlayControls: false });
      const playButton = screen.getByRole('button', { name: 'Play' });
      expect(playButton).toBeDisabled();
    });
  });

  describe('Save and Reset buttons visibility', () => {
    it('should not render save button when onSave is not provided', () => {
      renderHeader({ onSave: undefined });
      expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    });

    it('should not render reset button when onReset is not provided', () => {
      renderHeader({ onReset: undefined });
      expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();
    });

    it('should show saving state', () => {
      renderHeader({ onSave: jest.fn(), isSaving: true });
      expect(screen.getByText(/saving/i)).toBeInTheDocument();
    });
  });

  describe('Play Controls', () => {
    it('should hide play controls when hidePlayControls is true', () => {
      renderHeader({ hidePlayControls: true });
      expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
    });

    it('should show pause button when playing', () => {
      renderHeader({ isPlaying: true, hidePlayControls: false, onPauseClick: jest.fn() });
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument();
    });

    it('should show resume button when paused', () => {
      renderHeader({ 
        isPlaying: true, 
        isPaused: true, 
        hidePlayControls: false, 
        onResumeClick: jest.fn() 
      });
      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
    });

    it('should call onPauseClick when pause button is clicked', () => {
      const onPauseClick = jest.fn();
      renderHeader({ isPlaying: true, hidePlayControls: false, onPauseClick });
      const pauseButton = screen.getByRole('button', { name: /pause/i });
      fireEvent.click(pauseButton);
      expect(onPauseClick).toHaveBeenCalledTimes(1);
    });

    it('should call onResumeClick when resume button is clicked', () => {
      const onResumeClick = jest.fn();
      renderHeader({ 
        isPlaying: true, 
        isPaused: true, 
        hidePlayControls: false, 
        onResumeClick 
      });
      const resumeButton = screen.getByRole('button', { name: /resume/i });
      fireEvent.click(resumeButton);
      expect(onResumeClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('View Only Mode', () => {
    it('should disable all action buttons in view only mode', () => {
      renderHeader({ viewOnly: true, onSave: jest.fn(), onReset: jest.fn() });
      
      // Save and view errors buttons should not be present in view only
      expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();
    });
  });
});
