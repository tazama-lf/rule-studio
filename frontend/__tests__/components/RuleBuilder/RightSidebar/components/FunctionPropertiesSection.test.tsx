import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FunctionPropertiesSection from '../../../../../src/components/RuleBuilder/RightSidebar/components/FunctionPropertiesSection';

describe('FunctionPropertiesSection', () => {
  describe('Rendering', () => {
    it('should render the component with description', () => {
      const template = {
        description: 'This function calculates the sum of two numbers',
      };

      render(<FunctionPropertiesSection template={template} />);

      expect(screen.getByText('Function Properties')).toBeInTheDocument();
      expect(screen.getByText('This function calculates the sum of two numbers')).toBeInTheDocument();
    });

    it('should not render when description is undefined', () => {
      const template = {};

      const { container } = render(<FunctionPropertiesSection template={template} />);

      expect(container.firstChild).toBeNull();
    });

    it('should not render when description is empty string', () => {
      const template = {
        description: '',
      };

      const { container } = render(<FunctionPropertiesSection template={template} />);

      expect(container.firstChild).toBeNull();
    });

    it('should render divider when description exists', () => {
      const template = {
        description: 'Test description',
      };

      const { container } = render(<FunctionPropertiesSection template={template} />);

      const divider = container.querySelector('hr');
      expect(divider).toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('should display long description correctly', () => {
      const longDescription = 'This is a very long description that explains in detail what this function does. It can handle multiple lines and provides comprehensive information about the function behavior and usage.';
      const template = {
        description: longDescription,
      };

      render(<FunctionPropertiesSection template={template} />);

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('should display description with special characters', () => {
      const template = {
        description: 'Function with special chars: @, #, $, %, &, *, (, ), [, ], {, }',
      };

      render(<FunctionPropertiesSection template={template} />);

      expect(screen.getByText('Function with special chars: @, #, $, %, &, *, (, ), [, ], {, }')).toBeInTheDocument();
    });

    it('should display description with numbers', () => {
      const template = {
        description: 'Calculates result based on formula: x^2 + 2x + 1',
      };

      render(<FunctionPropertiesSection template={template} />);

      expect(screen.getByText('Calculates result based on formula: x^2 + 2x + 1')).toBeInTheDocument();
    });

    it('should render section title correctly', () => {
      const template = {
        description: 'Test description',
      };

      render(<FunctionPropertiesSection template={template} />);

      const title = screen.getByText('Function Properties');
      expect(title).toBeInTheDocument();
    });
  });

  describe('Typography and Styling', () => {
    it('should render description with correct typography variant', () => {
      const template = {
        description: 'Test description',
      };

      render(<FunctionPropertiesSection template={template} />);

      const descriptionElement = screen.getByText('Test description');
      expect(descriptionElement).toHaveClass('MuiTypography-body2');
    });

    it('should render description as Typography component', () => {
      const template = {
        description: 'Test description',
      };

      render(<FunctionPropertiesSection template={template} />);

      const descriptionElement = screen.getByText('Test description');
      expect(descriptionElement).toHaveClass('MuiTypography-root');
      expect(descriptionElement.tagName).toBe('P');
    });
  });

  describe('Component Structure', () => {
    it('should have correct component hierarchy', () => {
      const template = {
        description: 'Test description',
      };

      const { container } = render(<FunctionPropertiesSection template={template} />);

      // Check for Divider
      expect(container.querySelector('hr.MuiDivider-root')).toBeInTheDocument();
      
      // Check for section title
      expect(screen.getByText('Function Properties')).toBeInTheDocument();
      
      // Check for description
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should render PropertyRow container', () => {
      const template = {
        description: 'Test description',
      };

      const { container } = render(<FunctionPropertiesSection template={template} />);

      const descriptionElement = screen.getByText('Test description');
      expect(descriptionElement.parentElement).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle template with only description property', () => {
      const template = {
        description: 'Only description',
      };

      render(<FunctionPropertiesSection template={template} />);

      expect(screen.getByText('Only description')).toBeInTheDocument();
    });

    it('should handle template with additional properties', () => {
      const template = {
        description: 'Main description',
        name: 'testFunction',
        parameters: [],
        returnType: 'string',
      };

      render(<FunctionPropertiesSection template={template as any} />);

      expect(screen.getByText('Main description')).toBeInTheDocument();
      expect(screen.queryByText('testFunction')).not.toBeInTheDocument();
    });

    it('should handle null description gracefully', () => {
      const template = {
        description: null as any,
      };

      const { container } = render(<FunctionPropertiesSection template={template} />);

      expect(container.firstChild).toBeNull();
    });

    it('should handle whitespace-only description', () => {
      const template = {
        description: '   ',
      };

      render(<FunctionPropertiesSection template={template} />);

      // Whitespace is rendered as it's truthy
      expect(screen.getByText('Function Properties')).toBeInTheDocument();
    });
  });

  describe('Multiple Renders', () => {
    it('should update when description changes', () => {
      const template1 = {
        description: 'First description',
      };

      const { rerender } = render(<FunctionPropertiesSection template={template1} />);

      expect(screen.getByText('First description')).toBeInTheDocument();

      const template2 = {
        description: 'Second description',
      };

      rerender(<FunctionPropertiesSection template={template2} />);

      expect(screen.queryByText('First description')).not.toBeInTheDocument();
      expect(screen.getByText('Second description')).toBeInTheDocument();
    });

    it('should unmount when description is removed', () => {
      const template1 = {
        description: 'Initial description',
      };

      const { rerender, container } = render(<FunctionPropertiesSection template={template1} />);

      expect(screen.getByText('Initial description')).toBeInTheDocument();

      const template2 = {};

      rerender(<FunctionPropertiesSection template={template2} />);

      expect(container.firstChild).toBeNull();
    });

    it('should mount when description is added', () => {
      const template1 = {};

      const { rerender, container } = render(<FunctionPropertiesSection template={template1} />);

      expect(container.firstChild).toBeNull();

      const template2 = {
        description: 'New description',
      };

      rerender(<FunctionPropertiesSection template={template2} />);

      expect(screen.getByText('New description')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render description text as typography element', () => {
      const template = {
        description: 'Accessible description',
      };

      render(<FunctionPropertiesSection template={template} />);

      const description = screen.getByText('Accessible description');
      expect(description.tagName).toBe('P');
    });

    it('should have readable text content', () => {
      const template = {
        description: 'This description should be readable by screen readers',
      };

      const { container } = render(<FunctionPropertiesSection template={template} />);

      expect(container.textContent).toContain('This description should be readable by screen readers');
    });
  });

  describe('Integration', () => {
    it('should render correctly with typical function template', () => {
      const template = {
        description: 'Returns the absolute value of a number. Takes a single numeric parameter and returns its absolute value.',
      };

      render(<FunctionPropertiesSection template={template} />);

      expect(screen.getByText('Function Properties')).toBeInTheDocument();
      expect(screen.getByText(/Returns the absolute value of a number/)).toBeInTheDocument();
    });

    it('should work with multiline description', () => {
      const template = {
        description: `Line 1: First line of description
Line 2: Second line of description
Line 3: Third line of description`,
      };

      render(<FunctionPropertiesSection template={template} />);

      expect(screen.getByText(/Line 1: First line of description/)).toBeInTheDocument();
    });

    it('should handle description with HTML entities', () => {
      const template = {
        description: 'Function returns value < 100 and > 0',
      };

      render(<FunctionPropertiesSection template={template} />);

      expect(screen.getByText('Function returns value < 100 and > 0')).toBeInTheDocument();
    });
  });
});
