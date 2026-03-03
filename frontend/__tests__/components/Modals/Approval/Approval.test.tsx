import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Approval from '../../../../src/components/Modals/Approval';
import type { IApproval } from '../../../../src/components/Modals/Approval/useApprovalController';

const mockClose = jest.fn();
const mockNavigate = jest.fn();
const mockSubmitUnwrap = jest.fn();
const mockDeployUnwrap = jest.fn();
const mockSubmit = jest.fn(() => ({ unwrap: mockSubmitUnwrap }));
const mockDeploy = jest.fn(() => ({ unwrap: mockDeployUnwrap }));
let mockSubmitLoading = false;
let mockDeployLoading = false;

jest.mock('../../../../src/contexts/ModalContext', () => ({
  useModal: () => ({ close: mockClose }),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../src/redux/Api/Rules', () => ({
  useUpdateStatusMutation: () => [mockSubmit, { isLoading: mockSubmitLoading }],
}));

jest.mock('../../../../src/redux/Api/Simulation', () => ({
  useMergeBranchMutation: () => [mockDeploy, { isLoading: mockDeployLoading }],
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

const theme = createTheme({
  palette: {
    text: { primary: '#000', secondary: '#666' },
    static: { grey: '#ccc', border: '#ddd', secondary: '#1976d2' },
  } as any,
});

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

const defaultProps: IApproval = { type: 'approve', id: 'rule-1' };

describe('Approval Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitLoading = false;
    mockDeployLoading = false;
    mockSubmitUnwrap.mockResolvedValue({});
    mockDeployUnwrap.mockResolvedValue({});
  });

  describe('Header Text', () => {
    it('should show approve header', () => {
      renderWithTheme(<Approval type="approve" id="1" />);
      expect(screen.getByText('Are you sure you want to approve this rule?')).toBeInTheDocument();
    });

    it('should show reject header', () => {
      renderWithTheme(<Approval type="reject" id="1" />);
      expect(screen.getByText('Are you sure you want to reject this rule?')).toBeInTheDocument();
    });

    it('should show review header', () => {
      renderWithTheme(<Approval type="review" id="1" />);
      expect(screen.getByText('Are you sure you want to send this rule for review?')).toBeInTheDocument();
    });

    it('should show pause header', () => {
      renderWithTheme(<Approval type="pause" id="1" />);
      expect(screen.getByText('Are you sure you want to pause this rule?')).toBeInTheDocument();
    });

    it('should show resume header', () => {
      renderWithTheme(<Approval type="resume" id="1" />);
      expect(screen.getByText('Are you sure you want to resume this rule?')).toBeInTheDocument();
    });

    it('should show deploy header', () => {
      renderWithTheme(<Approval type="deploy" id="1" />);
      expect(screen.getByText('Are you sure you want to deploy this rule?')).toBeInTheDocument();
    });
  });

  describe('Warning Message', () => {
    it('should show approve message', () => {
      renderWithTheme(<Approval type="approve" id="1" />);
      expect(screen.getByText(/This will approve the rule/)).toBeInTheDocument();
    });

    it('should show reject message', () => {
      renderWithTheme(<Approval type="reject" id="1" />);
      expect(screen.getByText(/This will reject the rule/)).toBeInTheDocument();
    });

    it('should show review message', () => {
      renderWithTheme(<Approval type="review" id="1" />);
      expect(screen.getByText(/This will submit the rule for approval/)).toBeInTheDocument();
    });

    it('should show pause message', () => {
      renderWithTheme(<Approval type="pause" id="1" />);
      expect(screen.getByText(/This will put the rule on hold/)).toBeInTheDocument();
    });

    it('should show resume message', () => {
      renderWithTheme(<Approval type="resume" id="1" />);
      expect(screen.getByText(/This will change the rule status back to IN PROGRESS/)).toBeInTheDocument();
    });

    it('should show deploy message', () => {
      renderWithTheme(<Approval type="deploy" id="1" />);
      expect(screen.getByText(/This will deploy the rule to production/)).toBeInTheDocument();
    });
  });

  describe('Warning Icon', () => {
    it('should render warning icon', () => {
      const { container } = renderWithTheme(<Approval {...defaultProps} />);
      expect(container.querySelector('[data-testid="WarningRoundedIcon"]')).toBeInTheDocument();
    });
  });

  describe('Button Titles', () => {
    it('should show "Approve" for approve type', () => {
      renderWithTheme(<Approval type="approve" id="1" />);
      expect(screen.getByText('Approve')).toBeInTheDocument();
    });

    it('should show "Reject" for reject type', () => {
      renderWithTheme(<Approval type="reject" id="1" />);
      expect(screen.getByText('Reject')).toBeInTheDocument();
    });

    it('should show "Submit For Approval" for review type', () => {
      renderWithTheme(<Approval type="review" id="1" />);
      expect(screen.getByText('Submit For Approval')).toBeInTheDocument();
    });

    it('should show "Yes, Pause Rule" for pause type', () => {
      renderWithTheme(<Approval type="pause" id="1" />);
      expect(screen.getByText('Yes, Pause Rule')).toBeInTheDocument();
    });

    it('should show "Yes, Resume Rule" for resume type', () => {
      renderWithTheme(<Approval type="resume" id="1" />);
      expect(screen.getByText('Yes, Resume Rule')).toBeInTheDocument();
    });

    it('should show "Yes, Deploy Rule" for deploy type', () => {
      renderWithTheme(<Approval type="deploy" id="1" />);
      expect(screen.getByText('Yes, Deploy Rule')).toBeInTheDocument();
    });

    it('should always show Cancel button', () => {
      renderWithTheme(<Approval {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });
  describe('Comments Field', () => {
    it('should show comments field for approve type', () => {
      renderWithTheme(<Approval type="approve" id="1" />);
      expect(screen.getByLabelText(/Comments/)).toBeInTheDocument();
    });

    it('should show comments field for reject type', () => {
      renderWithTheme(<Approval type="reject" id="1" />);
      expect(screen.getByLabelText(/Comments/)).toBeInTheDocument();
    });

    it('should NOT show comments field for review type', () => {
      renderWithTheme(<Approval type="review" id="1" />);
      expect(screen.queryByLabelText(/Comments/)).not.toBeInTheDocument();
    });

    it('should NOT show comments field for pause type', () => {
      renderWithTheme(<Approval type="pause" id="1" />);
      expect(screen.queryByLabelText(/Comments/)).not.toBeInTheDocument();
    });

    it('should NOT show comments field for resume type', () => {
      renderWithTheme(<Approval type="resume" id="1" />);
      expect(screen.queryByLabelText(/Comments/)).not.toBeInTheDocument();
    });

    it('should NOT show comments field for deploy type', () => {
      renderWithTheme(<Approval type="deploy" id="1" />);
      expect(screen.queryByLabelText(/Comments/)).not.toBeInTheDocument();
    });

    it('should make comment required for reject type', async () => {
      renderWithTheme(<Approval type="reject" id="1" />);

      await act(async () => {
        fireEvent.click(screen.getByText('Reject'));
      });

      await waitFor(() => {
        expect(screen.getByText('Comment is required')).toBeInTheDocument();
      });
    });

    it('should NOT require comment for approve type', async () => {
      renderWithTheme(<Approval type="approve" id="1" />);

      await act(async () => {
        fireEvent.click(screen.getByText('Approve'));
      });

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Cancel Action', () => {
    it('should call modal close on Cancel click', () => {
      renderWithTheme(<Approval {...defaultProps} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('should not trigger submit on Cancel click', () => {
      renderWithTheme(<Approval {...defaultProps} />);
      fireEvent.click(screen.getByText('Cancel'));
      expect(mockSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Submit Actions', () => {
    it('should call updateStatus with approve status', async () => {
      renderWithTheme(<Approval type="approve" id="rule-1" />);

      await act(async () => {
        fireEvent.click(screen.getByText('Approve'));
      });

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          id: 'rule-1',
          body: { comment: '', status: 'STATUS_04_APPROVED' },
        });
      });
    });

    it('should call updateStatus with reject status and comment', async () => {
      renderWithTheme(<Approval type="reject" id="rule-1" />);

      const commentInput = screen.getByLabelText(/Comments/);
      fireEvent.change(commentInput, { target: { value: 'Needs changes' } });

      await act(async () => {
        fireEvent.click(screen.getByText('Reject'));
      });

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          id: 'rule-1',
          body: { comment: 'Needs changes', status: 'STATUS_05_REJECTED' },
        });
      });
    });

    it('should call updateStatus with review status (no comment in body)', async () => {
      renderWithTheme(<Approval type="review" id="rule-1" />);

      await act(async () => {
        fireEvent.click(screen.getByText('Submit For Approval'));
      });

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          id: 'rule-1',
          body: { status: 'STATUS_03_UNDER_REVIEW' },
        });
      });
    });

    it('should call updateStatus with pause status', async () => {
      renderWithTheme(<Approval type="pause" id="rule-1" />);

      await act(async () => {
        fireEvent.click(screen.getByText('Yes, Pause Rule'));
      });

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          id: 'rule-1',
          body: { status: 'STATUS_02_ON_HOLD' },
        });
      });
    });

    it('should call updateStatus with resume status', async () => {
      renderWithTheme(<Approval type="resume" id="rule-1" />);

      await act(async () => {
        fireEvent.click(screen.getByText('Yes, Resume Rule'));
      });

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          id: 'rule-1',
          body: { status: 'STATUS_01_IN_PROGRESS' },
        });
      });
    });

    it('should close modal and navigate on successful submit', async () => {
      renderWithTheme(<Approval type="approve" id="rule-1" />);

      await act(async () => {
        fireEvent.click(screen.getByText('Approve'));
      });

      await waitFor(() => {
        expect(mockClose).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });
    });

    it('should call onSuccess for pause type instead of navigate', async () => {
      const onSuccess = jest.fn();
      renderWithTheme(<Approval type="pause" id="rule-1" onSuccess={onSuccess} />);

      await act(async () => {
        fireEvent.click(screen.getByText('Yes, Pause Rule'));
      });

      await waitFor(() => {
        expect(mockClose).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should call onSuccess for resume type instead of navigate', async () => {
      const onSuccess = jest.fn();
      renderWithTheme(<Approval type="resume" id="rule-1" onSuccess={onSuccess} />);

      await act(async () => {
        fireEvent.click(screen.getByText('Yes, Resume Rule'));
      });

      await waitFor(() => {
        expect(mockClose).toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should show error toast on submit failure', async () => {
      const toast = require('react-hot-toast');
      mockSubmitUnwrap.mockRejectedValueOnce(new Error('fail'));

      renderWithTheme(<Approval type="approve" id="rule-1" />);

      await act(async () => {
        fireEvent.click(screen.getByText('Approve'));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to update rule status');
      });
    });
  });

  describe('Deploy Flow', () => {
    it('should call deploy then updateStatus for deploy type', async () => {
      renderWithTheme(<Approval type="deploy" id="rule-1" />);

      await act(async () => {
        fireEvent.click(screen.getByText('Yes, Deploy Rule'));
      });

      await waitFor(() => {
        expect(mockDeploy).toHaveBeenCalledWith({
          ruleId: 'rule-1',
          branchName: 'prod',
        });
      });

      await waitFor(() => {
        expect(mockSubmit).toHaveBeenCalledWith({
          id: 'rule-1',
          body: { status: 'STATUS_08_DEPLOYED' },
        });
      });
    });

    it('should show success toast and navigate on successful deploy', async () => {
      const toast = require('react-hot-toast');

      renderWithTheme(<Approval type="deploy" id="rule-1" />);

      await act(async () => {
        fireEvent.click(screen.getByText('Yes, Deploy Rule'));
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Code Deployed Successfully');
        expect(mockClose).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });
    });

    it('should show error toast when deploy fails', async () => {
      const toast = require('react-hot-toast');
      mockDeployUnwrap.mockRejectedValueOnce(new Error('deploy fail'));

      renderWithTheme(<Approval type="deploy" id="rule-1" />);

      await act(async () => {
        fireEvent.click(screen.getByText('Yes, Deploy Rule'));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to deploy code');
      });
    });

    it('should show error toast when deploy succeeds but status update fails', async () => {
      const toast = require('react-hot-toast');
      mockSubmitUnwrap.mockRejectedValueOnce(new Error('status fail'));

      renderWithTheme(<Approval type="deploy" id="rule-1" />);

      await act(async () => {
        fireEvent.click(screen.getByText('Yes, Deploy Rule'));
      });

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Deployment succeeded but updating status failed');
      });
    });
  });

  describe('Theme Styles', () => {
    it('should render with outlined paper variant', () => {
      const { container } = renderWithTheme(<Approval {...defaultProps} />);
      expect(container.querySelector('.MuiPaper-outlined')).toBeInTheDocument();
    });

    it('should render approve, reject, review, pause, resume, deploy without errors', () => {
      const types: IApproval['type'][] = ['approve', 'reject', 'review', 'pause', 'resume', 'deploy'];
      types.forEach((type) => {
        const { unmount } = renderWithTheme(<Approval type={type} id="1" />);
        expect(screen.getByText('Cancel')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('Memoization', () => {
    it('should not re-render when props do not change', () => {
      const { rerender, container } = renderWithTheme(<Approval {...defaultProps} />);
      const first = container.firstChild;

      rerender(
        <ThemeProvider theme={theme}>
          <Approval {...defaultProps} />
        </ThemeProvider>
      );
      const second = container.firstChild;

      expect(first).toBe(second);
    });
  });
});
