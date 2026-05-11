import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import RuleEditor from '../../../src/pages/RuleEditor';
import { claims, Status } from '../../../src/utils/Constants/data';

const mockSearchParams = new URLSearchParams('mode=edit&tab=overview');
const mockSetSearchParams = jest.fn();
const mockRenderComponent = jest.fn(() => <div>Rendered Component</div>);

jest.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

jest.mock('../../../src/pages/RuleEditor/useRuleEditorController', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    values: {
      isLoading: false,
      mode: 'edit',
      data: {
        id: '123',
        rule_name: 'Test Rule',
        status: Status.STATUS_01_IN_PROGRESS,
        comments: 'Test comment',
      },
      user: { claims: claims.editor },
    },
    functions: {
      renderComponent: mockRenderComponent,
    },
  })),
}));

jest.mock('../../../src/components/SuspenseLoader', () => ({
  __esModule: true,
  default: () => <div data-testid="suspense-loader">Loading...</div>,
}));

jest.mock('../../../src/components/Tabs', () => ({
  __esModule: true,
  default: () => <div data-testid="tabs-component">Tabs</div>,
}));

jest.mock('../../../src/components/Cards/CommentCard', () => ({
  __esModule: true,
  default: ({ success, message }: { success: boolean; message: string }) => (
    <div data-testid="comment-card" data-success={success}>
      {message}
    </div>
  ),
}));

jest.mock('../../../src/contexts/TabContext/TabProvider', () => ({
  TabProvider: ({ children, mode }: { children: React.ReactNode; mode: string | null }) => (
    <div data-testid="tab-provider" data-mode={mode}>
      {children}
    </div>
  ),
}));

jest.mock('../../../src/contexts/TabContext/useTab', () => ({
  useTab: () => ({
    tabs: [],
    selectedTab: 0,
    enableNextTab: jest.fn(),
    enablePreviousTab: jest.fn(),
  }),
}));

jest.mock('../../../src/components/Wrappers/BoxWrapper', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="box-wrapper">{children}</div>
  ),
}));

const theme = createTheme({
  palette: {
    text: { primary: '#000', secondary: '#666', black: '#000' },
    static: { grey: '#ccc', border: '#ddd', secondary: '#1976d2' },
  } as any,
});

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('RuleEditor Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRenderComponent.mockReturnValue(<div>Rendered Component</div>);
    
    const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
    useRuleEditorController.mockReturnValue({
      values: {
        isLoading: false,
        mode: 'edit',
        data: {
          id: '123',
          rule_name: 'Test Rule',
          status: Status.STATUS_01_IN_PROGRESS,
          comments: 'Test comment',
        },
        user: { claims: claims.editor },
      },
      functions: {
        renderComponent: mockRenderComponent,
      },
    });
  });

  describe('Component Rendering', () => {
    it('should render RuleEditor component', () => {
      renderWithTheme(<RuleEditor />);

      expect(screen.getByTestId('tab-provider')).toBeInTheDocument();
    });

    it('should render without errors', () => {
      const { container } = renderWithTheme(<RuleEditor />);

      expect(container).toBeInTheDocument();
    });

    it('should render BoxWrapper', () => {
      renderWithTheme(<RuleEditor />);

      expect(screen.getByTestId('box-wrapper')).toBeInTheDocument();
    });

    it('should render TabProvider with mode from searchParams', () => {
      renderWithTheme(<RuleEditor />);

      const tabProvider = screen.getByTestId('tab-provider');
      expect(tabProvider).toHaveAttribute('data-mode', 'edit');
    });
  });

  describe('Header Section', () => {
    it('should render Rule Editor header', () => {
      renderWithTheme(<RuleEditor />);

      expect(screen.getByText('Rule Editor')).toBeInTheDocument();
    });

    it('should render CodeIcon', () => {
      const { container } = renderWithTheme(<RuleEditor />);

      const icon = container.querySelector('[data-testid="CodeIcon"]');
      expect(icon).toBeInTheDocument();
    });

    it('should display header text with bold weight', () => {
      renderWithTheme(<RuleEditor />);

      const headerText = screen.getByText('Rule Editor');
      expect(headerText).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show SuspenseLoader when loading', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: true,
          mode: null,
          data: null,
          user: null,
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      expect(screen.getByTestId('suspense-loader')).toBeInTheDocument();
    });

    it('should not show content when loading', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: true,
          mode: null,
          data: null,
          user: null,
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      expect(screen.queryByTestId('tabs-component')).not.toBeInTheDocument();
    });

    it('should show content when not loading', () => {
      renderWithTheme(<RuleEditor />);

      expect(screen.queryByTestId('suspense-loader')).not.toBeInTheDocument();
      expect(screen.getByTestId('tabs-component')).toBeInTheDocument();
    });
  });

  describe('Tabs Component', () => {
    it('should render Tabs component', () => {
      renderWithTheme(<RuleEditor />);

      expect(screen.getByTestId('tabs-component')).toBeInTheDocument();
    });

    it('should render Tabs when not loading', () => {
      renderWithTheme(<RuleEditor />);

      expect(screen.getByText('Tabs')).toBeInTheDocument();
    });
  });

  describe('Component Rendering Function', () => {
    it('should call renderComponent function', () => {
      renderWithTheme(<RuleEditor />);

      expect(mockRenderComponent).toHaveBeenCalled();
    });

    it('should display component returned by renderComponent', () => {
      renderWithTheme(<RuleEditor />);

      expect(screen.getByText('Rendered Component')).toBeInTheDocument();
    });

    it('should render component from controller', () => {
      mockRenderComponent.mockReturnValue(<div>Custom Component</div>);

      renderWithTheme(<RuleEditor />);

      expect(screen.getByText('Custom Component')).toBeInTheDocument();
    });
  });

  describe('Comment Card for Editor Users', () => {
    it('should not show CommentCard for non-approved/rejected status', () => {
      renderWithTheme(<RuleEditor />);

      expect(screen.queryByTestId('comment-card')).not.toBeInTheDocument();
    });

    it('should show CommentCard when status is approved', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: false,
          mode: 'edit',
          data: {
            status: Status.STATUS_04_APPROVED,
            comments: 'Approved comment',
          },
          user: { claims: claims.editor },
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      expect(screen.getByTestId('comment-card')).toBeInTheDocument();
    });

    it('should show CommentCard when status is rejected', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: false,
          mode: 'edit',
          data: {
            status: Status.STATUS_05_REJECTED,
            comments: 'Rejected comment',
          },
          user: { claims: claims.editor },
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      expect(screen.getByTestId('comment-card')).toBeInTheDocument();
    });

    it('should pass success=true for approved status', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: false,
          mode: 'edit',
          data: {
            status: Status.STATUS_04_APPROVED,
            comments: 'Approved',
          },
          user: { claims: claims.editor },
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      const commentCard = screen.getByTestId('comment-card');
      expect(commentCard).toHaveAttribute('data-success', 'true');
    });

    it('should pass success=false for rejected status', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: false,
          mode: 'edit',
          data: {
            status: Status.STATUS_05_REJECTED,
            comments: 'Rejected',
          },
          user: { claims: claims.editor },
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      const commentCard = screen.getByTestId('comment-card');
      expect(commentCard).toHaveAttribute('data-success', 'false');
    });

    it('should display comment message', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: false,
          mode: 'edit',
          data: {
            status: Status.STATUS_04_APPROVED,
            comments: 'Test approval message',
          },
          user: { claims: claims.editor },
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      expect(screen.getByText('Test approval message')).toBeInTheDocument();
    });

    it('should not show CommentCard for non-editor users', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: false,
          mode: 'edit',
          data: {
            status: Status.STATUS_04_APPROVED,
            comments: 'Approved',
          },
          user: { claims: claims.approver },
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      expect(screen.queryByTestId('comment-card')).not.toBeInTheDocument();
    });
  });

  describe('URL Parameters', () => {
    it('should extract mode from searchParams', () => {
      renderWithTheme(<RuleEditor />);

      const tabProvider = screen.getByTestId('tab-provider');
      expect(tabProvider).toHaveAttribute('data-mode', 'edit');
    });

    it('should use null mode when not in searchParams', () => {
      mockSearchParams.delete('mode');

      renderWithTheme(<RuleEditor />);

      const tabProvider = screen.getByTestId('tab-provider');
      // When mode is null, React doesn't render the data-mode attribute
      expect(tabProvider).not.toHaveAttribute('data-mode');

      mockSearchParams.set('mode', 'edit');
    });

    it('should handle different mode values', () => {
      mockSearchParams.set('mode', 'view');

      renderWithTheme(<RuleEditor />);

      const tabProvider = screen.getByTestId('tab-provider');
      expect(tabProvider).toHaveAttribute('data-mode', 'view');

      mockSearchParams.set('mode', 'edit');
    });
  });

  describe('Layout Structure', () => {
    it('should render header with proper flex layout', () => {
      const { container } = renderWithTheme(<RuleEditor />);

      const boxes = container.querySelectorAll('.MuiBox-root');
      expect(boxes.length).toBeGreaterThan(0);
    });

    it('should have proper component hierarchy', () => {
      renderWithTheme(<RuleEditor />);

      expect(screen.getByTestId('tab-provider')).toBeInTheDocument();
      expect(screen.getByTestId('box-wrapper')).toBeInTheDocument();
    });
  });

  describe('User Claims', () => {
    it('should handle editor claims', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: false,
          mode: 'edit',
          data: {
            status: Status.STATUS_04_APPROVED,
            comments: 'Test',
          },
          user: { claims: claims.editor },
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      expect(screen.getByTestId('comment-card')).toBeInTheDocument();
    });

    it('should handle approver claims', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: false,
          mode: 'edit',
          data: {
            status: Status.STATUS_04_APPROVED,
            comments: 'Test',
          },
          user: { claims: claims.approver },
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      expect(screen.queryByTestId('comment-card')).not.toBeInTheDocument();
    });

    it('should handle publisher claims', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: false,
          mode: 'edit',
          data: {
            status: Status.STATUS_04_APPROVED,
            comments: 'Test',
          },
          user: { claims: claims.publisher },
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      expect(screen.queryByTestId('comment-card')).not.toBeInTheDocument();
    });
  });

  describe('Status Conditions', () => {
    it('should show comment for STATUS_04_APPROVED', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: false,
          mode: 'edit',
          data: {
            status: Status.STATUS_04_APPROVED,
            comments: 'Approved',
          },
          user: { claims: claims.editor },
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      expect(screen.getByTestId('comment-card')).toBeInTheDocument();
    });

    it('should show comment for STATUS_05_REJECTED', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: false,
          mode: 'edit',
          data: {
            status: Status.STATUS_05_REJECTED,
            comments: 'Rejected',
          },
          user: { claims: claims.editor },
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      expect(screen.getByTestId('comment-card')).toBeInTheDocument();
    });

    it('should not show comment for STATUS_01_IN_PROGRESS', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: false,
          mode: 'edit',
          data: {
            status: Status.STATUS_01_IN_PROGRESS,
            comments: 'In progress',
          },
          user: { claims: claims.editor },
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      expect(screen.queryByTestId('comment-card')).not.toBeInTheDocument();
    });

    it('should not show comment for STATUS_02_ON_HOLD', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: false,
          mode: 'edit',
          data: {
            status: 'On Hold',
            comments: 'On hold',
          },
          user: { claims: claims.editor },
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      expect(screen.queryByTestId('comment-card')).not.toBeInTheDocument();
    });

    it('should not show comment for STATUS_03_UNDER_REVIEW', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: false,
          mode: 'edit',
          data: {
            status: 'Under Review',
            comments: 'Under review',
          },
          user: { claims: claims.editor },
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      expect(screen.queryByTestId('comment-card')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null data', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: false,
          mode: 'edit',
          data: null,
          user: { claims: claims.editor },
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      expect(screen.queryByTestId('comment-card')).not.toBeInTheDocument();
    });

    it('should handle null user', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: false,
          mode: 'edit',
          data: {
            status: Status.STATUS_04_APPROVED,
            comments: 'Test',
          },
          user: null,
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      expect(screen.queryByTestId('comment-card')).not.toBeInTheDocument();
    });

    it('should handle missing comments', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;
      useRuleEditorController.mockReturnValue({
        values: {
          isLoading: false,
          mode: 'edit',
          data: {
            status: Status.STATUS_04_APPROVED,
          },
          user: { claims: claims.editor },
        },
        functions: {
          renderComponent: mockRenderComponent,
        },
      });

      renderWithTheme(<RuleEditor />);

      expect(screen.getByTestId('comment-card')).toBeInTheDocument();
    });

    it('should handle empty renderComponent return', () => {
      mockRenderComponent.mockReturnValue(null as unknown as React.ReactElement);

      renderWithTheme(<RuleEditor />);

      expect(screen.getByTestId('tabs-component')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should integrate with useRuleEditorController', () => {
      const useRuleEditorController = require('../../../src/pages/RuleEditor/useRuleEditorController').default;

      renderWithTheme(<RuleEditor />);

      expect(useRuleEditorController).toHaveBeenCalled();
    });

    it('should pass mode to TabProvider', () => {
      renderWithTheme(<RuleEditor />);

      const tabProvider = screen.getByTestId('tab-provider');
      expect(tabProvider).toHaveAttribute('data-mode');
    });

    it('should render children within TabProvider', () => {
      renderWithTheme(<RuleEditor />);

      const tabProvider = screen.getByTestId('tab-provider');
      const boxWrapper = screen.getByTestId('box-wrapper');
      expect(tabProvider).toContainElement(boxWrapper);
    });
  });

  describe('Component Export', () => {
    it('should export RuleEditor as default', () => {
      expect(RuleEditor).toBeDefined();
    });

    it('should be a functional component', () => {
      expect(typeof RuleEditor).toBe('function');
    });
  });

  describe('Accessibility', () => {
    it('should render with proper structure', () => {
      const { container } = renderWithTheme(<RuleEditor />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should have accessible header text', () => {
      renderWithTheme(<RuleEditor />);

      expect(screen.getByText('Rule Editor')).toBeInTheDocument();
    });
  });
});
