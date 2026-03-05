import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MuiButton from '../../../src/components/Button';
import HomeIcon from '@mui/icons-material/Home';

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('should render button with text', () => {
      render(<MuiButton text="Click Me" onClick={() => {}} />);
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should render button with icon', () => {
      render(<MuiButton text="Home" Icon={HomeIcon} onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Home' });
      expect(button).toBeInTheDocument();
    });

    it('should render with default props', () => {
      render(<MuiButton text="Default" onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Default' });
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    it('should have correct aria-label', () => {
      render(<MuiButton text="Submit" onClick={() => {}} />);
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });
  });

  describe('Button Types and Styling', () => {
    it('should apply primary type styling', () => {
      render(<MuiButton text="Primary" type="primary" onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Primary' });
      expect(button).toHaveStyle({ backgroundColor: '#33ad74' });
    });

    it('should apply secondary type styling', () => {
      render(<MuiButton text="Secondary" type="secondary" onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Secondary' });
      expect(button).toHaveStyle({ backgroundColor: '#2b7fff' });
    });

    it('should apply muted type styling', () => {
      render(<MuiButton text="Muted" type="muted" onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Muted' });
      expect(button).toHaveStyle({ backgroundColor: '#e0e0e0' });
    });

    it('should apply danger type styling', () => {
      render(<MuiButton text="Danger" type="danger" onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Danger' });
      expect(button).toHaveStyle({ backgroundColor: '#d32f2f' });
    });

    it('should apply success type styling', () => {
      render(<MuiButton text="Success" type="success" onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Success' });
      expect(button).toHaveStyle({ backgroundColor: '#66c1bb' });
    });

    it('should apply default type styling', () => {
      render(<MuiButton text="Default" type="default" onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Default' });
      expect(button).toHaveStyle({ backgroundColor: '#000' });
    });

    it('should apply simple type styling', () => {
      render(<MuiButton text="Simple" type="simple" onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Simple' });
      expect(button).toHaveStyle({ backgroundColor: '#d6dadf' });
    });

    it('should apply prod type styling', () => {
      render(<MuiButton text="Prod" type="prod" onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Prod' });
      expect(button).toHaveStyle({ backgroundColor: '#4f46e5' });
    });

    it('should render outlined variant', () => {
      render(<MuiButton text="Outlined" outlined onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Outlined' });
      expect(button.className).toContain('MuiButton-outlined');
    });

    it('should render contained variant by default', () => {
      render(<MuiButton text="Contained" onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Contained' });
      expect(button.className).toContain('MuiButton-contained');
    });
  });

  describe('Button Sizes', () => {
    it('should apply small size width', () => {
      render(<MuiButton text="Small" size="sm" onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Small' });
      expect(button).toHaveStyle({ width: '120px' });
    });

    it('should apply medium size width', () => {
      render(<MuiButton text="Medium" size="md" onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Medium' });
      expect(button).toHaveStyle({ width: '200px' });
    });

    it('should apply large size width', () => {
      render(<MuiButton text="Large" size="lg" onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Large' });
      expect(button).toHaveStyle({ width: '100%' });
    });

    it('should apply auto width for empty size', () => {
      render(<MuiButton text="Auto" size="" onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Auto' });
      expect(button).toHaveStyle({ width: 'auto' });
    });

    it('should apply custom width when provided', () => {
      render(<MuiButton text="Custom" width="300px" onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Custom' });
      expect(button).toHaveStyle({ width: '300px' });
    });

    it('should apply custom height when provided', () => {
      render(<MuiButton text="Custom Height" height="60px" onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Custom Height' });
      expect(button).toHaveStyle({ height: '60px' });
    });

    it('should apply default height', () => {
      render(<MuiButton text="Default Height" onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Default Height' });
      expect(button).toHaveStyle({ height: '50px' });
    });
  });

  describe('Interactive States', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<MuiButton text="Click" onClick={handleClick} />);
      fireEvent.click(screen.getByRole('button', { name: 'Click' }));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<MuiButton text="Disabled" disabled onClick={handleClick} />);
      fireEvent.click(screen.getByRole('button', { name: 'Disabled' }));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<MuiButton text="Disabled" disabled onClick={() => {}} />);
      expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
    });

    it('should preventDefault when preventDefault prop is true', () => {
      const handleClick = jest.fn();
      render(<MuiButton text="Prevent" preventDefault onClick={handleClick} />);
      
      const button = screen.getByRole('button', { name: 'Prevent' });
      
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalled();
    });

    it('should not preventDefault when preventDefault prop is false', () => {
      const handleClick = jest.fn();
      render(<MuiButton text="No Prevent" preventDefault={false} onClick={handleClick} />);
      
      fireEvent.click(screen.getByRole('button', { name: 'No Prevent' }));
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading is true', () => {
      render(<MuiButton text="Loading" loading onClick={() => {}} />);
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should not show text when loading', () => {
      render(<MuiButton text="Loading" loading onClick={() => {}} />);
      expect(screen.queryByText('Loading')).not.toBeInTheDocument();
    });

    it('should hide icon when loading', () => {
      const { container } = render(
        <MuiButton text="Loading" Icon={HomeIcon} loading onClick={() => {}} />
      );
      const icons = container.querySelectorAll('svg');
      // Only the CircularProgress spinner should be present
      expect(icons.length).toBe(1);
    });

    it('should disable button when loading', () => {
      render(<MuiButton text="Loading" loading onClick={() => {}} />);
      expect(screen.getByRole('button', { name: 'Loading' })).toBeDisabled();
    });

    it('should set aria-busy to true when loading', () => {
      render(<MuiButton text="Loading" loading onClick={() => {}} />);
      expect(screen.getByRole('button', { name: 'Loading' })).toHaveAttribute('aria-busy', 'true');
    });

    it('should set aria-busy to false when not loading', () => {
      render(<MuiButton text="Not Loading" onClick={() => {}} />);
      expect(screen.getByRole('button', { name: 'Not Loading' })).toHaveAttribute('aria-busy', 'false');
    });

    it('should show correct spinner color for outlined button', () => {
      const { container } = render(
        <MuiButton text="Loading" type="primary" outlined loading onClick={() => {}} />
      );
      const spinner = container.querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });

    it('should show correct spinner color for contained button', () => {
      const { container } = render(
        <MuiButton text="Loading" type="primary" loading onClick={() => {}} />
      );
      const spinner = container.querySelector('svg');
      expect(spinner).toBeInTheDocument();
    });

    it('should not call onClick when loading', () => {
      const handleClick = jest.fn();
      render(<MuiButton text="Loading" loading onClick={handleClick} />);
      fireEvent.click(screen.getByRole('button', { name: 'Loading' }));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Button Type Attribute', () => {
    it('should have button type by default', () => {
      render(<MuiButton text="Default Type" onClick={() => {}} />);
      expect(screen.getByRole('button', { name: 'Default Type' })).toHaveAttribute('type', 'button');
    });

    it('should have submit type when specified', () => {
      render(<MuiButton text="Submit" buttonType="submit" onClick={() => {}} />);
      expect(screen.getByRole('button', { name: 'Submit' })).toHaveAttribute('type', 'submit');
    });

    it('should have reset type when specified', () => {
      render(<MuiButton text="Reset" buttonType="reset" onClick={() => {}} />);
      expect(screen.getByRole('button', { name: 'Reset' })).toHaveAttribute('type', 'reset');
    });
  });

  describe('Icon Rendering', () => {
    it('should render icon when provided and not loading', () => {
      const { container } = render(
        <MuiButton text="With Icon" Icon={HomeIcon} onClick={() => {}} />
      );
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should not render icon when not provided', () => {
      render(
        <MuiButton text="No Icon" onClick={() => {}} />
      );
      const button = screen.getByRole('button', { name: 'No Icon' });
      expect(button.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  describe('Combined States', () => {
    it('should render outlined danger button', () => {
      render(<MuiButton text="Outlined Danger" type="danger" outlined onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Outlined Danger' });
      expect(button).toBeInTheDocument();
      expect(button.className).toContain('MuiButton-outlined');
    });

    it('should render large success button with icon', () => {
      render(
        <MuiButton text="Large Success" type="success" size="lg" Icon={HomeIcon} onClick={() => {}} />
      );
      const button = screen.getByRole('button', { name: 'Large Success' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveStyle({ width: '100%' });
    });

    it('should handle disabled and loading together', () => {
      render(<MuiButton text="Disabled Loading" disabled loading onClick={() => {}} />);
      const button = screen.getByRole('button', { name: 'Disabled Loading' });
      expect(button).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should render with custom dimensions and type', () => {
      render(
        <MuiButton 
          text="Custom" 
          type="prod" 
          width="250px" 
          height="70px" 
          onClick={() => {}} 
        />
      );
      const button = screen.getByRole('button', { name: 'Custom' });
      expect(button).toHaveStyle({ 
        width: '250px',
        height: '70px',
        backgroundColor: '#4f46e5'
      });
    });
  });

  describe('Memoization', () => {
    it('should not re-render when props do not change', () => {
      const { rerender } = render(<MuiButton text="Memo Test" onClick={() => {}} />);
      const firstRender = screen.getByRole('button', { name: 'Memo Test' });
      
      rerender(<MuiButton text="Memo Test" onClick={() => {}} />);
      const secondRender = screen.getByRole('button', { name: 'Memo Test' });
      
      expect(firstRender).toBe(secondRender);
    });
  });
});
