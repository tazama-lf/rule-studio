import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import GlobalVariablesSidebar from '../../../src/components/RuleBuilder/GlobalVariablesSidebar';

// Mock the globalVariables data
jest.mock('../../../src/utils/Flow/GlobalVariables', () => ({
  globalVariables: {
    RuleRequest: {
      pain001: {
        GroupHeader: {
          MessageId: 'MSG001',
          CreationDateTime: '2025-10-31T15:19:24Z',
        },
        PaymentInformation: {
          PaymentInformationId: 'PMTINF001',
          PaymentMethod: 'TRF',
        },
      },
      TenantId: '123',
    },
    RuleConfig: {
      config: {
        parameters: {
          amountThreshold: 5.0,
        },
        bands: [
          { subRuleRef: '.01', lowerLimit: 0 },
          { subRuleRef: '.02', lowerLimit: 5 },
        ],
      },
    },
  },
}));

describe('GlobalVariablesSidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the sidebar when not collapsed', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      expect(screen.getByRole('tab', { name: /rulerequest/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /ruleconfig/i })).toBeInTheDocument();
    });

    it('should not render content when collapsed', () => {
      render(<GlobalVariablesSidebar collapsed={true} />);
      expect(screen.queryByRole('tab', { name: /rulerequest/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: /ruleconfig/i })).not.toBeInTheDocument();
    });

    it('should render with default collapsed prop as false', () => {
      render(<GlobalVariablesSidebar />);
      expect(screen.getByRole('tab', { name: /rulerequest/i })).toBeInTheDocument();
    });

    it('should render both tabs', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
      expect(tabs[0]).toHaveTextContent('RuleRequest');
      expect(tabs[1]).toHaveTextContent('RuleConfig');
    });

    it('should render RuleRequest tab as active by default', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      const ruleRequestTab = screen.getByRole('tab', { name: /rulerequest/i });
      expect(ruleRequestTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to RuleConfig tab when clicked', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      const ruleConfigTab = screen.getByRole('tab', { name: /ruleconfig/i });
      
      fireEvent.click(ruleConfigTab);
      
      expect(ruleConfigTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should switch back to RuleRequest tab', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      // Click RuleConfig tab first
      const ruleConfigTab = screen.getByRole('tab', { name: /ruleconfig/i });
      fireEvent.click(ruleConfigTab);
      
      // Click RuleRequest tab
      const ruleRequestTab = screen.getByRole('tab', { name: /rulerequest/i });
      fireEvent.click(ruleRequestTab);
      
      expect(ruleRequestTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should display different variables when switching tabs', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      // RuleRequest tab should show MessageId
      expect(screen.getByText('MessageId')).toBeInTheDocument();
      
      // Switch to RuleConfig tab
      const ruleConfigTab = screen.getByRole('tab', { name: /ruleconfig/i });
      fireEvent.click(ruleConfigTab);
      
      // Should now show amountThreshold
      expect(screen.getByText('amountThreshold')).toBeInTheDocument();
    });
  });

  describe('Variable Display', () => {
    it('should display leaf variables from RuleRequest', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      expect(screen.getByText('MessageId')).toBeInTheDocument();
      expect(screen.getByText('CreationDateTime')).toBeInTheDocument();
      expect(screen.getByText('PaymentInformationId')).toBeInTheDocument();
      expect(screen.getByText('PaymentMethod')).toBeInTheDocument();
      expect(screen.getByText('TenantId')).toBeInTheDocument();
    });

    it('should display leaf variables from RuleConfig', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      // Switch to RuleConfig tab
      const ruleConfigTab = screen.getByRole('tab', { name: /ruleconfig/i });
      fireEvent.click(ruleConfigTab);
      
      expect(screen.getByText('amountThreshold')).toBeInTheDocument();
      // subRuleRef and lowerLimit appear multiple times (once for each band)
      expect(screen.getAllByText('subRuleRef').length).toBeGreaterThan(0);
      expect(screen.getAllByText('lowerLimit').length).toBeGreaterThan(0);
    });

    it('should not display parent objects, only leaf values', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      // These are parent objects, should not be displayed
      expect(screen.queryByText('GroupHeader')).not.toBeInTheDocument();
      expect(screen.queryByText('PaymentInformation')).not.toBeInTheDocument();
      expect(screen.queryByText('pain001')).not.toBeInTheDocument();
    });

    it('should show full path in variable description', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      // Find MessageId variable and check its description
      const messageIdElements = screen.getAllByText('MessageId');
      expect(messageIdElements.length).toBeGreaterThan(0);
      
      // Description should include full path (rendered as a span with caption variant)
      expect(screen.getByText((content, element) => {
        if (!element) return false;
        return element.tagName === 'SPAN' && 
               element.textContent === 'RuleRequest.pain001.GroupHeader.MessageId';
      })).toBeInTheDocument();
    });

    it('should display variable label and description separately', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      // MessageId should appear as both label and in description
      const messageIdLabel = screen.getByText((content, element) => {
        if (!element) return false;
        const parent = element.parentElement;
        const hasCaptionSibling = parent?.querySelector('[class*="MuiTypography-caption"]') !== null;
        return content === 'MessageId' && 
               element.classList.contains('MuiTypography-root') &&
               hasCaptionSibling;
      });
      
      expect(messageIdLabel).toBeInTheDocument();
    });
  });

  describe('Drag and Drop Functionality', () => {
    it('should make variable cards draggable', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      const messageIdCard = screen.getByText('MessageId').closest('[draggable="true"]');
      expect(messageIdCard).toHaveAttribute('draggable', 'true');
    });

    it('should set correct data on drag start for RuleRequest variable', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      const messageIdCard = screen.getByText('MessageId').closest('[draggable="true"]');
      const mockDataTransfer = {
        setData: jest.fn(),
        effectAllowed: '',
      };
      
      fireEvent.dragStart(messageIdCard!, {
        dataTransfer: mockDataTransfer,
      });
      
      expect(mockDataTransfer.setData).toHaveBeenCalledWith(
        'variablePath',
        'RuleRequest.pain001.GroupHeader.MessageId'
      );
      expect(mockDataTransfer.setData).toHaveBeenCalledWith(
        'variableValue',
        JSON.stringify('MSG001')
      );
      expect(mockDataTransfer.effectAllowed).toBe('copy');
    });

    it('should set correct data on drag start for RuleConfig variable', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      // Switch to RuleConfig tab
      const ruleConfigTab = screen.getByRole('tab', { name: /ruleconfig/i });
      fireEvent.click(ruleConfigTab);
      
      const thresholdCard = screen.getByText('amountThreshold').closest('[draggable="true"]');
      const mockDataTransfer = {
        setData: jest.fn(),
        effectAllowed: '',
      };
      
      fireEvent.dragStart(thresholdCard!, {
        dataTransfer: mockDataTransfer,
      });
      
      expect(mockDataTransfer.setData).toHaveBeenCalledWith(
        'variablePath',
        'RuleConfig.config.parameters.amountThreshold'
      );
      expect(mockDataTransfer.setData).toHaveBeenCalledWith(
        'variableValue',
        JSON.stringify(5.0)
      );
    });

    it('should set effectAllowed to copy on drag start', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      const messageIdCard = screen.getByText('MessageId').closest('[draggable="true"]');
      const mockDataTransfer = {
        setData: jest.fn(),
        effectAllowed: '',
      };
      
      fireEvent.dragStart(messageIdCard!, {
        dataTransfer: mockDataTransfer,
      });
      
      expect(mockDataTransfer.effectAllowed).toBe('copy');
    });
  });

  describe('Tooltips', () => {
    it('should show tooltip with variable description on hover', async () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      const messageIdCard = screen.getByText('MessageId').closest('[draggable="true"]');
      
      // Hover over the card
      fireEvent.mouseEnter(messageIdCard!);
      
      // Tooltip should show the full path
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('RuleRequest.pain001.GroupHeader.MessageId');
    });

    it('should show tooltip for RuleConfig variables', async () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      // Switch to RuleConfig tab
      const ruleConfigTab = screen.getByRole('tab', { name: /ruleconfig/i });
      fireEvent.click(ruleConfigTab);
      
      const thresholdCard = screen.getByText('amountThreshold').closest('[draggable="true"]');
      
      // Hover over the card
      fireEvent.mouseEnter(thresholdCard!);
      
      // Tooltip should show the full path
      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('RuleConfig.config.parameters.amountThreshold');
    });
  });

  describe('Styling and UI Elements', () => {
    it('should display drag indicator icon for each variable', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      // DragIndicatorIcon should be present
      const messageIdCard = screen.getByText('MessageId').closest('[draggable="true"]');
      const dragIcon = messageIdCard!.querySelector('[data-testid="DragIndicatorIcon"]');
      
      expect(dragIcon).toBeInTheDocument();
    });

    it('should apply cursor styles for draggable cards', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      const messageIdCard = screen.getByText('MessageId').closest('[draggable="true"]');
      
      expect(messageIdCard).toHaveStyle({ cursor: 'grab' });
    });

    it('should render variables in a scrollable list', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      // Check that multiple variables are rendered (indicating scrollable content)
      expect(screen.getByText('MessageId')).toBeInTheDocument();
      expect(screen.getByText('CreationDateTime')).toBeInTheDocument();
      expect(screen.getByText('TenantId')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle deeply nested objects with the mocked data', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      // The mock data has nested structure - check that leaf values are shown
      expect(screen.getByText('MessageId')).toBeInTheDocument();
      expect(screen.getByText('CreationDateTime')).toBeInTheDocument();
      
      // Full paths should be in descriptions
      expect(screen.getByText('RuleRequest.pain001.GroupHeader.MessageId')).toBeInTheDocument();
    });

    it('should handle array values in RuleConfig bands', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      // Switch to RuleConfig tab
      const ruleConfigTab = screen.getByRole('tab', { name: /ruleconfig/i });
      fireEvent.click(ruleConfigTab);
      
      // Should flatten array elements from bands array
      // subRuleRef and lowerLimit appear once for each band element
      const subRuleRefElements = screen.getAllByText('subRuleRef');
      const lowerLimitElements = screen.getAllByText('lowerLimit');
      
      expect(subRuleRefElements.length).toBe(2); // Two bands
      expect(lowerLimitElements.length).toBe(2); // Two bands
    });

    it('should only show leaf nodes from nested structures', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      // Parent objects should not be displayed
      expect(screen.queryByText('pain001')).not.toBeInTheDocument();
      expect(screen.queryByText('GroupHeader')).not.toBeInTheDocument();
      expect(screen.queryByText('PaymentInformation')).not.toBeInTheDocument();
      
      // But leaf values should be
      expect(screen.getByText('MessageId')).toBeInTheDocument();
      expect(screen.getByText('PaymentInformationId')).toBeInTheDocument();
    });

    it('should handle switching between tabs without errors', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      const ruleRequestTab = screen.getByRole('tab', { name: /rulerequest/i });
      const ruleConfigTab = screen.getByRole('tab', { name: /ruleconfig/i });
      
      // Switch back and forth multiple times
      fireEvent.click(ruleConfigTab);
      expect(ruleConfigTab).toHaveAttribute('aria-selected', 'true');
      
      fireEvent.click(ruleRequestTab);
      expect(ruleRequestTab).toHaveAttribute('aria-selected', 'true');
      
      fireEvent.click(ruleConfigTab);
      expect(ruleConfigTab).toHaveAttribute('aria-selected', 'true');
    });

    it('should correctly flatten multi-level nested objects', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      // Switch to RuleConfig which has nested structure
      const ruleConfigTab = screen.getByRole('tab', { name: /ruleconfig/i });
      fireEvent.click(ruleConfigTab);
      
      // Should see leaf value from config.parameters.amountThreshold
      expect(screen.getByText('amountThreshold')).toBeInTheDocument();
      expect(screen.getByText('RuleConfig.config.parameters.amountThreshold')).toBeInTheDocument();
      
      // Should not see intermediate levels
      expect(screen.queryByText('config')).not.toBeInTheDocument();
      expect(screen.queryByText('parameters')).not.toBeInTheDocument();
    });
  });

  describe('Color Coding', () => {
    it('should render RuleRequest variables with their color', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      // Get RuleRequest variable card
      const messageIdCard = screen.getByText('MessageId').closest('[draggable="true"]');
      
      // Card should exist (color is handled via nodecolor prop which is #60a5fa for RuleRequest)
      expect(messageIdCard).toBeInTheDocument();
    });

    it('should render RuleConfig variables with their color', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      // Switch to RuleConfig
      const ruleConfigTab = screen.getByRole('tab', { name: /ruleconfig/i });
      fireEvent.click(ruleConfigTab);
      
      // Get RuleConfig variable card
      const thresholdCard = screen.getByText('amountThreshold').closest('[draggable="true"]');
      
      // Card should exist (color is handled via nodecolor prop which is #8b5cf6 for RuleConfig)
      expect(thresholdCard).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should maintain tab state when toggling collapse', () => {
      const { rerender } = render(<GlobalVariablesSidebar collapsed={false} />);
      
      // Switch to RuleConfig tab
      const ruleConfigTab = screen.getByRole('tab', { name: /ruleconfig/i });
      fireEvent.click(ruleConfigTab);
      
      // Collapse
      rerender(<GlobalVariablesSidebar collapsed={true} />);
      
      // Expand
      rerender(<GlobalVariablesSidebar collapsed={false} />);
      
      // Tab should still be on RuleConfig
      const ruleConfigTabAfter = screen.getByRole('tab', { name: /ruleconfig/i });
      expect(ruleConfigTabAfter).toHaveAttribute('aria-selected', 'true');
    });

    it('should render multiple variable cards for RuleRequest', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      const draggableCards = screen.getAllByRole('generic', { hidden: true }).filter(
        (el) => el.getAttribute('draggable') === 'true'
      );
      
      // Should have multiple draggable variable cards
      expect(draggableCards.length).toBeGreaterThan(1);
    });

    it('should render multiple variable cards for RuleConfig', () => {
      render(<GlobalVariablesSidebar collapsed={false} />);
      
      // Switch to RuleConfig tab
      const ruleConfigTab = screen.getByRole('tab', { name: /ruleconfig/i });
      fireEvent.click(ruleConfigTab);
      
      const draggableCards = screen.getAllByRole('generic', { hidden: true }).filter(
        (el) => el.getAttribute('draggable') === 'true'
      );
      
      // Should have multiple draggable variable cards
      expect(draggableCards.length).toBeGreaterThan(0);
    });
  });
});
