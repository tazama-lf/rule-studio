 
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DebuggerPanel, { type DebugLog } from '../../../src/components/RuleBuilder/DebuggerPanel';

describe('RuleBuilder DebuggerPanel Component', () => {
  const mockVariables = {
    username: 'testuser',
    amount: 100,
    config: { threshold: 50 },
  };

  const mockLogs: DebugLog[] = [
    { time: '10:00:00', message: 'Flow started', type: 'info' },
    { time: '10:00:01', message: 'Processing node 1', type: 'info' },
    { time: '10:00:02', message: 'Error occurred', type: 'error' },
  ];

  const defaultProps = {
    variables: {},
    logs: [],
    currentNodeId: undefined,
    isPlaying: false,
  };

  const renderDebugger = (props = {}) => {
    return render(<DebuggerPanel {...defaultProps} {...props} />);
  };

  describe('Rendering', () => {
    it('should render debugger panel', () => {
      renderDebugger();
      expect(screen.getByText(/STATUS:/i)).toBeInTheDocument();
    });

    it('should show IDLE status when not playing', () => {
      renderDebugger({ isPlaying: false });
      expect(screen.getByText('STATUS: IDLE')).toBeInTheDocument();
    });

    it('should show RUNNING status when playing', () => {
      renderDebugger({ isPlaying: true });
      expect(screen.getByText('STATUS: RUNNING')).toBeInTheDocument();
    });

    it('should display current node ID when playing', () => {
      renderDebugger({ isPlaying: true, currentNodeId: 'node-123' });
      expect(screen.getByText(/Node: node-123/i)).toBeInTheDocument();
    });

    it('should not display node ID when not playing', () => {
      renderDebugger({ isPlaying: false, currentNodeId: 'node-123' });
      expect(screen.queryByText(/Node: node-123/i)).not.toBeInTheDocument();
    });
  });

  describe('Variables Section', () => {
    it('should render variables section header', () => {
      renderDebugger();
      expect(screen.getByText('Variables Scope')).toBeInTheDocument();
    });

    it('should show empty state when no variables', () => {
      renderDebugger({ variables: {} });
      expect(screen.getByText(/No variables captured yet/i)).toBeInTheDocument();
    });

    it('should display variables when present', () => {
      renderDebugger({ variables: mockVariables });
      expect(screen.getByText('username')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('amount')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should format object values as JSON strings', () => {
      renderDebugger({ variables: mockVariables });
      expect(screen.getByText('config')).toBeInTheDocument();
      expect(screen.getByText('{"threshold":50}')).toBeInTheDocument();
    });
  });

  describe('Console Section', () => {
    it('should render console section header', () => {
      renderDebugger();
      expect(screen.getByText('Console Output')).toBeInTheDocument();
    });

    it('should show empty state when no logs', () => {
      renderDebugger({ logs: [] });
      expect(screen.getByText(/Waiting for logs/i)).toBeInTheDocument();
    });

    it('should display logs when present', () => {
      renderDebugger({ logs: mockLogs });
      expect(screen.getByText('Flow started')).toBeInTheDocument();
      expect(screen.getByText('Processing node 1')).toBeInTheDocument();
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });

    it('should display log timestamps', () => {
      renderDebugger({ logs: mockLogs });
      expect(screen.getByText('[10:00:00]')).toBeInTheDocument();
      expect(screen.getByText('[10:00:01]')).toBeInTheDocument();
      expect(screen.getByText('[10:00:02]')).toBeInTheDocument();
    });

    it('should render info logs', () => {
      const infoLog: DebugLog[] = [{ time: '10:00:00', message: 'Info message', type: 'info' }];
      renderDebugger({ logs: infoLog });
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    it('should render error logs', () => {
      const errorLog: DebugLog[] = [{ time: '10:00:00', message: 'Error message', type: 'error' }];
      renderDebugger({ logs: errorLog });
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  describe('Combined States', () => {
    it('should display both variables and logs together', () => {
      renderDebugger({ 
        variables: mockVariables, 
        logs: mockLogs,
        isPlaying: true,
        currentNodeId: 'node-1'
      });
      
      // Variables
      expect(screen.getByText('username')).toBeInTheDocument();
      expect(screen.getByText('testuser')).toBeInTheDocument();
      
      // Logs
      expect(screen.getByText('Flow started')).toBeInTheDocument();
      
      // Status
      expect(screen.getByText('STATUS: RUNNING')).toBeInTheDocument();
      expect(screen.getByText(/Node: node-1/i)).toBeInTheDocument();
    });
  });
});
