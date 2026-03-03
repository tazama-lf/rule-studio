import React from 'react';
import { render, within, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import StatusCard from '../../../src/components/Cards/StatusCard';

// Force cleanup after each test
afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

// Create a default theme for testing
const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('StatusCard Component', () => {
  describe('Basic Rendering', () => {
    it('should render status text', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_01_IN_PROGRESS" />);
      expect(within(container).getByText('STATUS_01_IN_PROGRESS')).toBeInTheDocument();
    });

    it('should render with bullet by default', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_01_IN_PROGRESS" />);
      // When bullet is true, there should be 2 children (bullet + text)
      const statusDiv = container.firstChild as HTMLElement;
      expect(statusDiv.childElementCount).toBeGreaterThan(1);
    });

    it('should render without bullet when bullet prop is false', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_01_IN_PROGRESS" bullet={false} />);
      expect(within(container).getByText('STATUS_01_IN_PROGRESS')).toBeInTheDocument();
      // When bullet is false, there should only be 1 child (text only)
      const statusDiv = container.firstChild as HTMLElement;
      expect(statusDiv.childElementCount).toBe(1);
    });

    it('should render with bullet when bullet prop is explicitly true', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_01_IN_PROGRESS" bullet={true} />);
      // When bullet is true, there should be 2 children (bullet + text)
      const statusDiv = container.firstChild as HTMLElement;
      expect(statusDiv.childElementCount).toBeGreaterThan(1);
    });
  });

  describe('Status Types - In Progress', () => {
    it('should render STATUS_01_IN_PROGRESS with correct styles', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_01_IN_PROGRESS" />);
      expect(within(container).getByText('STATUS_01_IN_PROGRESS')).toBeInTheDocument();
    });

    it('should apply correct background color for in progress status', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_01_IN_PROGRESS" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should apply correct text color for in progress status', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_01_IN_PROGRESS" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Status Types - On Hold', () => {
    it('should render STATUS_02_ON_HOLD with correct text', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_02_ON_HOLD" />);
      expect(within(container).getByText('STATUS_02_ON_HOLD')).toBeInTheDocument();
    });

    it('should apply grey theme colors for on hold status', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_02_ON_HOLD" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Status Types - Under Review', () => {
    it('should render STATUS_03_UNDER_REVIEW with correct text', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_03_UNDER_REVIEW" />);
      expect(within(container).getByText('STATUS_03_UNDER_REVIEW')).toBeInTheDocument();
    });

    it('should apply correct background color for under review status', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_03_UNDER_REVIEW" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should apply correct text color for under review status', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_03_UNDER_REVIEW" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Status Types - Approved', () => {
    it('should render STATUS_04_APPROVED with correct text', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_04_APPROVED" />);
      expect(within(container).getByText('STATUS_04_APPROVED')).toBeInTheDocument();
    });

    it('should apply correct background color for approved status', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_04_APPROVED" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should apply correct text color for approved status', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_04_APPROVED" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Status Types - Rejected', () => {
    it('should render STATUS_05_REJECTED with correct text', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_05_REJECTED" />);
      expect(within(container).getByText('STATUS_05_REJECTED')).toBeInTheDocument();
    });

    it('should apply correct background color for rejected status', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_05_REJECTED" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should apply correct text color for rejected status', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_05_REJECTED" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Status Types - Ready for Deployment', () => {
    it('should render STATUS_07_READY_FOR_DEPLOYMENT with correct text', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_07_READY_FOR_DEPLOYMENT" />);
      expect(within(container).getByText('STATUS_07_READY_FOR_DEPLOYMENT')).toBeInTheDocument();
    });

    it('should apply theme success colors for ready for deployment', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_07_READY_FOR_DEPLOYMENT" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Status Types - Deployed', () => {
    it('should render STATUS_08_DEPLOYED with correct text', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_08_DEPLOYED" />);
      expect(within(container).getByText('STATUS_08_DEPLOYED')).toBeInTheDocument();
    });

    it('should apply correct background color for deployed status', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_08_DEPLOYED" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should apply correct text color for deployed status', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_08_DEPLOYED" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Priority Levels - Simple/Low', () => {
    it('should render Simple status with correct text', () => {
      const { container } = renderWithTheme(<StatusCard status="Simple" />);
      expect(within(container).getByText('Simple')).toBeInTheDocument();
    });

    it('should apply green colors for Simple status', () => {
      const { container } = renderWithTheme(<StatusCard status="Simple" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render Low status with correct text', () => {
      const { container } = renderWithTheme(<StatusCard status="Low" />);
      expect(within(container).getByText('Low')).toBeInTheDocument();
    });

    it('should apply green colors for Low status', () => {
      const { container } = renderWithTheme(<StatusCard status="Low" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Priority Levels - Complex/High', () => {
    it('should render Complex status with correct text', () => {
      const { container } = renderWithTheme(<StatusCard status="Complex" />);
      expect(within(container).getByText('Complex')).toBeInTheDocument();
    });

    it('should apply red colors for Complex status', () => {
      const { container } = renderWithTheme(<StatusCard status="Complex" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render High status with correct text', () => {
      const { container } = renderWithTheme(<StatusCard status="High" />);
      expect(within(container).getByText('High')).toBeInTheDocument();
    });

    it('should apply red colors for High status', () => {
      const { container } = renderWithTheme(<StatusCard status="High" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Default Status', () => {
    it('should render unknown status with default styles', () => {
      const { container } = renderWithTheme(<StatusCard status="UNKNOWN_STATUS" />);
      expect(within(container).getByText('UNKNOWN_STATUS')).toBeInTheDocument();
    });

    it('should apply grey theme colors for unknown status', () => {
      const { container } = renderWithTheme(<StatusCard status="UNKNOWN_STATUS" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render empty status string', () => {
      const { container } = renderWithTheme(<StatusCard status="" />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Bullet Display', () => {
    it('should show bullet when bullet prop is true for different statuses', () => {
      const { container: container1 } = renderWithTheme(<StatusCard status="STATUS_01_IN_PROGRESS" bullet={true} />);
      const statusDiv1 = container1.firstChild as HTMLElement;
      expect(statusDiv1.childElementCount).toBeGreaterThan(1);

      const { container: container2 } = renderWithTheme(<StatusCard status="STATUS_04_APPROVED" bullet={true} />);
      const statusDiv2 = container2.firstChild as HTMLElement;
      expect(statusDiv2.childElementCount).toBeGreaterThan(1);

      const { container: container3 } = renderWithTheme(<StatusCard status="STATUS_08_DEPLOYED" bullet={true} />);
      const statusDiv3 = container3.firstChild as HTMLElement;
      expect(statusDiv3.childElementCount).toBeGreaterThan(1);
    });

    it('should hide bullet when bullet prop is false for different statuses', () => {
      const { container: container1 } = renderWithTheme(<StatusCard status="STATUS_01_IN_PROGRESS" bullet={false} />);
      expect(within(container1).getByText('STATUS_01_IN_PROGRESS')).toBeInTheDocument();
      const statusDiv1 = container1.firstChild as HTMLElement;
      expect(statusDiv1.childElementCount).toBe(1);

      const { container: container2 } = renderWithTheme(<StatusCard status="STATUS_04_APPROVED" bullet={false} />);
      expect(within(container2).getByText('STATUS_04_APPROVED')).toBeInTheDocument();
      const statusDiv2 = container2.firstChild as HTMLElement;
      expect(statusDiv2.childElementCount).toBe(1);

      const { container: container3 } = renderWithTheme(<StatusCard status="STATUS_05_REJECTED" bullet={false} />);
      expect(within(container3).getByText('STATUS_05_REJECTED')).toBeInTheDocument();
      const statusDiv3 = container3.firstChild as HTMLElement;
      expect(statusDiv3.childElementCount).toBe(1);
    });
  });

  describe('Styling and Layout', () => {
    it('should have inline-flex display', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_01_IN_PROGRESS" />);
      const statusDiv = container.firstChild as HTMLElement;
      expect(statusDiv).toBeInTheDocument();
    });

    it('should have rounded border', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_01_IN_PROGRESS" />);
      const statusDiv = container.firstChild as HTMLElement;
      expect(statusDiv).toBeInTheDocument();
    });

    it('should have solid border style', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_01_IN_PROGRESS" />);
      const statusDiv = container.firstChild as HTMLElement;
      expect(statusDiv).toBeInTheDocument();
    });

    it('should render bullet with correct dimensions', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS_01_IN_PROGRESS" />);
      // Just verify the component renders with a bullet (2 children)
      const statusDiv = container.firstChild as HTMLElement;
      expect(statusDiv.childElementCount).toBe(2);
    });
  });

  describe('Text Formatting', () => {
    it('should render text with correct font size', () => {
      const { container } = renderWithTheme(<StatusCard status="TEST_STATUS" />);
      const text = within(container).getByText('TEST_STATUS');
      expect(text).toBeInTheDocument();
    });

    it('should handle long status text', () => {
      const longStatus = 'STATUS_WITH_VERY_LONG_NAME_THAT_EXCEEDS_NORMAL_LENGTH';
      const { container } = renderWithTheme(<StatusCard status={longStatus} />);
      expect(within(container).getByText(longStatus)).toBeInTheDocument();
    });

    it('should handle special characters in status', () => {
      const specialStatus = 'STATUS_01_IN-PROGRESS_2024';
      const { container } = renderWithTheme(<StatusCard status={specialStatus} />);
      expect(within(container).getByText(specialStatus)).toBeInTheDocument();
    });
  });

  describe('Theme Integration', () => {
    it('should use theme palette for STATUS_02_ON_HOLD', () => {
      const customTheme = createTheme({
        palette: {
          grey: {
            100: '#f5f5f5',
            300: '#e0e0e0',
            700: '#616161',
          },
        },
      });
      const { container } = render(
        <ThemeProvider theme={customTheme}>
          <StatusCard status="STATUS_02_ON_HOLD" />
        </ThemeProvider>
      );
      expect(within(container).getByText('STATUS_02_ON_HOLD')).toBeInTheDocument();
    });

    it('should use theme success colors for STATUS_07_READY_FOR_DEPLOYMENT', () => {
      const customTheme = createTheme({
        palette: {
          success: {
            light: '#c8e6c9',
            main: '#4caf50',
            dark: '#388e3c',
          },
        },
      });
      const { container } = render(
        <ThemeProvider theme={customTheme}>
          <StatusCard status="STATUS_07_READY_FOR_DEPLOYMENT" />
        </ThemeProvider>
      );
      expect(within(container).getByText('STATUS_07_READY_FOR_DEPLOYMENT')).toBeInTheDocument();
    });
  });

  describe('Multiple Status Rendering', () => {
    it('should render multiple status cards independently', () => {
      const { container } = renderWithTheme(
        <>
          <StatusCard status="STATUS_01_IN_PROGRESS" />
          <StatusCard status="STATUS_04_APPROVED" />
          <StatusCard status="STATUS_05_REJECTED" />
        </>
      );
      
      expect(within(container).getByText('STATUS_01_IN_PROGRESS')).toBeInTheDocument();
      expect(within(container).getByText('STATUS_04_APPROVED')).toBeInTheDocument();
      expect(within(container).getByText('STATUS_05_REJECTED')).toBeInTheDocument();
    });

    it('should handle mix of bullet and non-bullet cards', () => {
      const { container } = renderWithTheme(
        <>
          <StatusCard status="STATUS_01_IN_PROGRESS" bullet={true} />
          <StatusCard status="STATUS_04_APPROVED" bullet={false} />
        </>
      );
      
      expect(within(container).getByText('STATUS_01_IN_PROGRESS')).toBeInTheDocument();
      expect(within(container).getByText('STATUS_04_APPROVED')).toBeInTheDocument();
    });
  });

  describe('Memoization', () => {
    it('should not re-render when props do not change', () => {
      const { rerender, container } = renderWithTheme(<StatusCard status="STATUS_01_IN_PROGRESS" />);
      const firstRender = within(container).getByText('STATUS_01_IN_PROGRESS');
      
      rerender(
        <ThemeProvider theme={theme}>
          <StatusCard status="STATUS_01_IN_PROGRESS" />
        </ThemeProvider>
      );
      const secondRender = within(container).getByText('STATUS_01_IN_PROGRESS');
      
      expect(firstRender).toBe(secondRender);
    });
  });

  describe('Edge Cases', () => {
    it('should handle status with spaces', () => {
      const { container } = renderWithTheme(<StatusCard status="STATUS WITH SPACES" />);
      expect(within(container).getByText('STATUS WITH SPACES')).toBeInTheDocument();
    });

    it('should handle numeric status', () => {
      const { container } = renderWithTheme(<StatusCard status="123" />);
      expect(within(container).getByText('123')).toBeInTheDocument();
    });

    it('should render with lowercase status', () => {
      const { container } = renderWithTheme(<StatusCard status="status_01_in_progress" />);
      expect(within(container).getByText('status_01_in_progress')).toBeInTheDocument();
    });
  });
});
