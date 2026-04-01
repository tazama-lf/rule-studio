import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from '../../../src/layout/Header';

jest.mock('../../../src/utils/Common/storage', () => ({
  extractData: jest.fn(),
}));

jest.mock('../../../src/utils/Common/helpers', () => ({
  capitalize: jest.fn((str: string) => str.charAt(0).toUpperCase() + str.slice(1)),
}));

import { extractData } from '../../../src/utils/Common/storage';
import { capitalize } from '../../../src/utils/Common/helpers';

const mockExtractData = extractData as jest.Mock;
const mockCapitalize = capitalize as jest.Mock;

describe('Header Component', () => {
  let mockSetExpanded: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSetExpanded = jest.fn();
    mockCapitalize.mockImplementation((str: string) => str.charAt(0).toUpperCase() + str.slice(1));
  });

  describe('Basic Rendering', () => {
    it('should render header component', () => {
      mockExtractData.mockReturnValue({});
      render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      expect(screen.getByText('Tazama Rule Studio')).toBeInTheDocument();
    });

    it('should render logo image', () => {
      mockExtractData.mockReturnValue({});
      render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      const logo = screen.getByAltText('Logo');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('src');
    });

    it('should render with correct structure', () => {
      mockExtractData.mockReturnValue({});
      const { container } = render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Sidebar Toggle', () => {
    it('should display MenuIcon when collapsed', () => {
      mockExtractData.mockReturnValue({});
      render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      const button = screen.getByLabelText('Open sidebar');
      expect(button).toBeInTheDocument();
    });

    it('should display CloseIcon when expanded', () => {
      mockExtractData.mockReturnValue({});
      render(<Header expanded={true} setExpanded={mockSetExpanded} />);
      
      const button = screen.getByLabelText('Close sidebar');
      expect(button).toBeInTheDocument();
    });

    it('should call setExpanded with true when collapsed button is clicked', () => {
      mockExtractData.mockReturnValue({});
      render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      const button = screen.getByLabelText('Open sidebar');
      fireEvent.click(button);
      
      expect(mockSetExpanded).toHaveBeenCalledWith(true);
      expect(mockSetExpanded).toHaveBeenCalledTimes(1);
    });

    it('should call setExpanded with false when expanded button is clicked', () => {
      mockExtractData.mockReturnValue({});
      render(<Header expanded={true} setExpanded={mockSetExpanded} />);
      
      const button = screen.getByLabelText('Close sidebar');
      fireEvent.click(button);
      
      expect(mockSetExpanded).toHaveBeenCalledWith(false);
      expect(mockSetExpanded).toHaveBeenCalledTimes(1);
    });

    it('should toggle state correctly', () => {
      mockExtractData.mockReturnValue({});
      const { rerender } = render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      expect(screen.getByLabelText('Open sidebar')).toBeInTheDocument();
      
      rerender(<Header expanded={true} setExpanded={mockSetExpanded} />);
      
      expect(screen.getByLabelText('Close sidebar')).toBeInTheDocument();
    });
  });

  describe('User Information Display', () => {
    it('should display user information when user data exists', () => {
      mockExtractData.mockReturnValue({
        username: 'john.doe',
        claims: 'admin'
      });
      
      render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      expect(screen.getByText('john.doe')).toBeInTheDocument();
      expect(screen.getByText(/Admin/)).toBeInTheDocument();
    });

    it('should not display user information when user data is null', () => {
      mockExtractData.mockReturnValue(null);
      
      render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      expect(screen.queryByText(/john.doe/)).not.toBeInTheDocument();
    });

    it('should not display user information when user is empty object', () => {
      mockExtractData.mockReturnValue({});
      
      render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      expect(screen.queryByText(/-/)).not.toBeInTheDocument();
    });

    it('should not display user information when username is missing', () => {
      mockExtractData.mockReturnValue({
        claims: 'viewer'
      });
      
      render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      expect(screen.queryByText(/viewer/)).not.toBeInTheDocument();
    });

    it('should not display user information when claims is missing', () => {
      mockExtractData.mockReturnValue({
        username: 'jane.smith'
      });
      
      render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      expect(screen.queryByText(/jane.smith/)).not.toBeInTheDocument();
    });

    it('should display both username and claims with correct separator', () => {
      mockExtractData.mockReturnValue({
        username: 'test.user',
        claims: 'editor'
      });
      
      render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      expect(screen.getByText('test.user')).toBeInTheDocument();
      expect(screen.getByText(/- Editor/)).toBeInTheDocument();
    });

    it('should capitalize claims correctly', () => {
      mockExtractData.mockReturnValue({
        username: 'user123',
        claims: 'viewer'
      });
      
      render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      expect(mockCapitalize).toHaveBeenCalledWith('viewer');
    });
  });

  describe('Props Handling', () => {
    it('should handle expanded prop correctly', () => {
      mockExtractData.mockReturnValue({});
      
      const { rerender } = render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      expect(screen.getByLabelText('Open sidebar')).toBeInTheDocument();
      
      rerender(<Header expanded={true} setExpanded={mockSetExpanded} />);
      expect(screen.getByLabelText('Close sidebar')).toBeInTheDocument();
    });

    it('should handle setExpanded callback prop', () => {
      mockExtractData.mockReturnValue({});
      const customCallback = jest.fn();
      
      render(<Header expanded={false} setExpanded={customCallback} />);
      
      const button = screen.getByLabelText('Open sidebar');
      fireEvent.click(button);
      
      expect(customCallback).toHaveBeenCalledWith(true);
    });
  });

  describe('Storage Integration', () => {
    it('should call extractData with "user" key', () => {
      mockExtractData.mockReturnValue({});
      
      render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      expect(mockExtractData).toHaveBeenCalledWith('user');
    });

    it('should handle null response from extractData', () => {
      mockExtractData.mockReturnValue(null);
      
      render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      expect(screen.getByText('Tazama Rule Studio')).toBeInTheDocument();
    });

    it('should handle undefined response from extractData', () => {
      mockExtractData.mockReturnValue(undefined);
      
      render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      expect(screen.getByText('Tazama Rule Studio')).toBeInTheDocument();
    });
  });

  describe('Multiple User Scenarios', () => {
    it('should render different usernames correctly', () => {
      mockExtractData.mockReturnValue({
        username: 'admin.user',
        claims: 'admin'
      });
      
      const { rerender } = render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      expect(screen.getByText('admin.user')).toBeInTheDocument();
      
      mockExtractData.mockReturnValue({
        username: 'viewer.user',
        claims: 'viewer'
      });
      
      rerender(<Header expanded={false} setExpanded={mockSetExpanded} />);
      expect(screen.getByText('viewer.user')).toBeInTheDocument();
    });

    it('should render different claims correctly', () => {
      mockExtractData.mockReturnValue({
        username: 'testuser',
        claims: 'editor'
      });
      
      const { rerender } = render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      expect(screen.getByText(/- Editor/)).toBeInTheDocument();
      
      mockExtractData.mockReturnValue({
        username: 'testuser',
        claims: 'admin'
      });
      
      rerender(<Header expanded={false} setExpanded={mockSetExpanded} />);
      expect(screen.getByText(/- Admin/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      mockExtractData.mockReturnValue({});
      
      render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      const button = screen.getByLabelText('Open sidebar');
      expect(button).toHaveAccessibleName();
    });

    it('should have accessible image alt text', () => {
      mockExtractData.mockReturnValue({});
      
      render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      
      const logo = screen.getByAltText('Logo');
      expect(logo).toHaveAccessibleName();
    });

    it('should toggle aria-label based on expanded state', () => {
      mockExtractData.mockReturnValue({});
      
      const { rerender } = render(<Header expanded={false} setExpanded={mockSetExpanded} />);
      expect(screen.getByLabelText('Open sidebar')).toBeInTheDocument();
      
      rerender(<Header expanded={true} setExpanded={mockSetExpanded} />);
      expect(screen.getByLabelText('Close sidebar')).toBeInTheDocument();
    });
  });
});
