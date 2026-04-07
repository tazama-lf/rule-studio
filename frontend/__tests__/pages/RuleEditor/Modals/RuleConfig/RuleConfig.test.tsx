import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import RuleConfig from '../../../../../src/pages/RuleEditor/Modals/RuleConfig';
import type { DropdownOption } from '../../../../../src/components/DropDown';

const mockHandleRuleValue = jest.fn();
const mockHandleRuleId = jest.fn();
const mockRuleConfigs = [
  { label: 'rule1', value: 'rule1' },
  { label: 'rule2', value: 'rule2' },
  { label: 'rule3', value: 'rule3' },
];
const mockJsonData = { config: 'test', data: { key: 'value' } };

jest.mock('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    values: {
      ruleConfigs: mockRuleConfigs,
      ruleId: { label: 'rule1', value: 'rule1' },
      isLoading: false,
      configLoader: false,
      json: mockJsonData,
      isView: false,
    },
    functions: {
      handleRuleId: mockHandleRuleId,
    },
  })),
}));

jest.mock('../../../../../src/components/Loader', () => ({
  __esModule: true,
  default: ({ center }: { center?: boolean }) => (
    <div data-testid="loader" data-center={center ? 'true' : 'false'}>
      Loading...
    </div>
  ),
}));

jest.mock('../../../../../src/components/DropDown', () => ({
  __esModule: true,
  default: ({
    label,
    value,
    onChange,
    options,
    placeholder,
    searchable,
  }: {
    label: string;
    value: DropdownOption | null;
    onChange: (val: DropdownOption) => void;
    options: DropdownOption[];
    placeholder: string;
    searchable: boolean;
  }) => (
    <div data-testid="dropdown">
      <label>{label}</label>
      <select
        data-testid="dropdown-select"
        value={value?.value || ''}
        onChange={(e) => {
          const selected = options.find(opt => opt.value === e.target.value);
          if (selected) onChange(selected);
        }}
        data-placeholder={placeholder}
        data-searchable={searchable ? 'true' : 'false'}
      >
        <option value="">Select</option>
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value ?? ''}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
}));

jest.mock('../../../../../src/components/JsonFormatter', () => ({
  __esModule: true,
  default: ({ value }: { value: string }) => (
    <div data-testid="json-formatter">
      <pre data-testid="json-content">{value}</pre>
    </div>
  ),
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('RuleConfig Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset the controller mock
    const useRuleConfigController = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController').default;
    useRuleConfigController.mockReturnValue({
      values: {
        ruleConfigs: mockRuleConfigs,
        ruleId: { label: 'rule1', value: 'rule1' },
        isLoading: false,
        configLoader: false,
        json: mockJsonData,
        isView: false,
      },
      functions: {
        handleRuleId: mockHandleRuleId,
      },
    });
  });

  describe('Component Rendering', () => {
    it('should render RuleConfig component', () => {
      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
    });

    it('should render without errors', () => {
      expect(() =>
        renderWithTheme(
          <RuleConfig
            handleRuleValue={mockHandleRuleValue}
            ruleConfigId={undefined}
            mode={null}
          />
        )
      ).not.toThrow();
    });

    it('should call useRuleConfigController hook', () => {
      const useRuleConfigController = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController').default;

      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId="rule1"
          mode="view"
        />
      );

      expect(useRuleConfigController).toHaveBeenCalledWith({
        handleRuleValue: mockHandleRuleValue,
        ruleConfigId: 'rule1',
        mode: 'view',
      });
    });

    it('should pass all props to controller', () => {
      const useRuleConfigController = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController').default;

      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId="rule2"
          mode="edit"
        />
      );

      expect(useRuleConfigController).toHaveBeenCalledWith({
        handleRuleValue: mockHandleRuleValue,
        ruleConfigId: 'rule2',
        mode: 'edit',
      });
    });
  });

  describe('Loading State', () => {
    it('should show Loader when isLoading is true', () => {
      const useRuleConfigController = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController').default;
      useRuleConfigController.mockReturnValue({
        values: {
          ruleConfigs: [],
          ruleId: null,
          isLoading: true,
          configLoader: false,
          json: null,
          isView: false,
        },
        functions: {
          handleRuleId: mockHandleRuleId,
        },
      });

      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('should show centered Loader', () => {
      const useRuleConfigController = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController').default;
      useRuleConfigController.mockReturnValue({
        values: {
          ruleConfigs: [],
          ruleId: null,
          isLoading: true,
          configLoader: false,
          json: null,
          isView: false,
        },
        functions: {
          handleRuleId: mockHandleRuleId,
        },
      });

      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      const loader = screen.getByTestId('loader');
      expect(loader.getAttribute('data-center')).toBe('true');
    });

    it('should not show content when loading', () => {
      const useRuleConfigController = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController').default;
      useRuleConfigController.mockReturnValue({
        values: {
          ruleConfigs: [],
          ruleId: null,
          isLoading: true,
          configLoader: false,
          json: null,
          isView: false,
        },
        functions: {
          handleRuleId: mockHandleRuleId,
        },
      });

      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      expect(screen.queryByTestId('dropdown')).not.toBeInTheDocument();
      expect(screen.queryByTestId('json-formatter')).not.toBeInTheDocument();
    });

    it('should show content when not loading', () => {
      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      expect(screen.queryByTestId('loader')).not.toBeInTheDocument();
      expect(screen.getByTestId('json-formatter')).toBeInTheDocument();
    });
  });

  describe('DropDown Rendering', () => {
    it('should render DropDown when isView is false', () => {
      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    });

    it('should not render DropDown when isView is true', () => {
      const useRuleConfigController = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController').default;
      useRuleConfigController.mockReturnValue({
        values: {
          ruleConfigs: mockRuleConfigs,
          ruleId: { label: 'rule1', value: 'rule1' },
          isLoading: false,
          configLoader: false,
          json: mockJsonData,
          isView: true,
        },
        functions: {
          handleRuleId: mockHandleRuleId,
        },
      });

      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId="rule1"
          mode="view"
        />
      );

      expect(screen.queryByTestId('dropdown')).not.toBeInTheDocument();
    });

    it('should display correct label', () => {
      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      expect(screen.getByText('Rule Configurations')).toBeInTheDocument();
    });

    it('should have placeholder text', () => {
      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      const select = screen.getByTestId('dropdown-select');
      expect(select.getAttribute('data-placeholder')).toBe('Select Transaction type');
    });

    it('should be searchable', () => {
      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      const select = screen.getByTestId('dropdown-select');
      expect(select.getAttribute('data-searchable')).toBe('true');
    });

    it('should pass ruleId value to DropDown', () => {
      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      const select = screen.getByTestId('dropdown-select') as HTMLSelectElement;
      expect(select.value).toBe('rule1');
    });

    it('should pass ruleConfigs options to DropDown', () => {
      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      const options = screen.getAllByRole('option');
      expect(options.length).toBe(mockRuleConfigs.length + 1); // +1 for "Select" option
    });
  });

  describe('DropDown Interaction', () => {
    it('should call handleRuleId when dropdown value changes', () => {
      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      const select = screen.getByTestId('dropdown-select');
      fireEvent.change(select, { target: { value: 'rule2' } });

      expect(mockHandleRuleId).toHaveBeenCalledWith({ label: 'rule2', value: 'rule2' });
    });

    it('should handle multiple dropdown changes', () => {
      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      const select = screen.getByTestId('dropdown-select');

      fireEvent.change(select, { target: { value: 'rule2' } });
      fireEvent.change(select, { target: { value: 'rule3' } });

      expect(mockHandleRuleId).toHaveBeenCalledTimes(2);
    });
  });

  describe('JSON Formatter Rendering', () => {
    it('should render FormattedJsonSection', () => {
      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      expect(screen.getByTestId('json-formatter')).toBeInTheDocument();
    });

    it('should display JSON content', () => {
      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      const jsonContent = screen.getByTestId('json-content');
      expect(jsonContent.textContent).toContain(JSON.stringify(mockJsonData));
    });

    it('should display empty object when json is null', () => {
      const useRuleConfigController = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController').default;
      useRuleConfigController.mockReturnValue({
        values: {
          ruleConfigs: mockRuleConfigs,
          ruleId: null,
          isLoading: false,
          configLoader: false,
          json: null,
          isView: false,
        },
        functions: {
          handleRuleId: mockHandleRuleId,
        },
      });

      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      const jsonContent = screen.getByTestId('json-content');
      expect(jsonContent.textContent).toBe(JSON.stringify({}));
    });

    it('should display empty object when json is undefined', () => {
      const useRuleConfigController = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController').default;
      useRuleConfigController.mockReturnValue({
        values: {
          ruleConfigs: mockRuleConfigs,
          ruleId: null,
          isLoading: false,
          configLoader: false,
          json: undefined,
          isView: false,
        },
        functions: {
          handleRuleId: mockHandleRuleId,
        },
      });

      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      const jsonContent = screen.getByTestId('json-content');
      expect(jsonContent.textContent).toBe(JSON.stringify({}));
    });

    it('should render JSON formatter in both view and edit modes', () => {
      const useRuleConfigController = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController').default;
      useRuleConfigController.mockReturnValue({
        values: {
          ruleConfigs: mockRuleConfigs,
          ruleId: { label: 'rule1', value: 'rule1' },
          isLoading: false,
          configLoader: false,
          json: mockJsonData,
          isView: true,
        },
        functions: {
          handleRuleId: mockHandleRuleId,
        },
      });

      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId="rule1"
          mode="view"
        />
      );

      expect(screen.getByTestId('json-formatter')).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should render Grid container', () => {
      const { container } = renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      const grid = container.querySelector('.MuiGrid-root');
      expect(grid).toBeInTheDocument();
    });

    it('should render JSON formatter inside a Box', () => {
      const { container } = renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      const box = container.querySelector('.MuiBox-root');
      expect(box).toBeInTheDocument();
    });
  });

  describe('Props Variations', () => {
    it('should work with undefined ruleConfigId', () => {
      expect(() =>
        renderWithTheme(
          <RuleConfig
            handleRuleValue={mockHandleRuleValue}
            ruleConfigId={undefined}
            mode={null}
          />
        )
      ).not.toThrow();
    });

    it('should work with ruleConfigId provided', () => {
      expect(() =>
        renderWithTheme(
          <RuleConfig
            handleRuleValue={mockHandleRuleValue}
            ruleConfigId="rule1"
            mode={null}
          />
        )
      ).not.toThrow();
    });

    it('should work with null mode', () => {
      expect(() =>
        renderWithTheme(
          <RuleConfig
            handleRuleValue={mockHandleRuleValue}
            ruleConfigId={undefined}
            mode={null}
          />
        )
      ).not.toThrow();
    });

    it('should work with view mode', () => {
      expect(() =>
        renderWithTheme(
          <RuleConfig
            handleRuleValue={mockHandleRuleValue}
            ruleConfigId="rule1"
            mode="view"
          />
        )
      ).not.toThrow();
    });

    it('should work with edit mode', () => {
      expect(() =>
        renderWithTheme(
          <RuleConfig
            handleRuleValue={mockHandleRuleValue}
            ruleConfigId="rule1"
            mode="edit"
          />
        )
      ).not.toThrow();
    });
  });

  describe('Mode-based Rendering', () => {
    it('should show dropdown in create mode', () => {
      const useRuleConfigController = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController').default;
      useRuleConfigController.mockReturnValue({
        values: {
          ruleConfigs: mockRuleConfigs,
          ruleId: null,
          isLoading: false,
          configLoader: false,
          json: null,
          isView: false,
        },
        functions: {
          handleRuleId: mockHandleRuleId,
        },
      });

      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode="create"
        />
      );

      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    });

    it('should hide dropdown in view mode', () => {
      const useRuleConfigController = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController').default;
      useRuleConfigController.mockReturnValue({
        values: {
          ruleConfigs: mockRuleConfigs,
          ruleId: { label: 'rule1', value: 'rule1' },
          isLoading: false,
          configLoader: false,
          json: mockJsonData,
          isView: true,
        },
        functions: {
          handleRuleId: mockHandleRuleId,
        },
      });

      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId="rule1"
          mode="view"
        />
      );

      expect(screen.queryByTestId('dropdown')).not.toBeInTheDocument();
    });

    it('should hide dropdown in edit mode', () => {
      const useRuleConfigController = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController').default;
      useRuleConfigController.mockReturnValue({
        values: {
          ruleConfigs: mockRuleConfigs,
          ruleId: { label: 'rule1', value: 'rule1' },
          isLoading: false,
          configLoader: false,
          json: mockJsonData,
          isView: true,
        },
        functions: {
          handleRuleId: mockHandleRuleId,
        },
      });

      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId="rule1"
          mode="edit"
        />
      );

      expect(screen.queryByTestId('dropdown')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty ruleConfigs array', () => {
      const useRuleConfigController = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController').default;
      useRuleConfigController.mockReturnValue({
        values: {
          ruleConfigs: [],
          ruleId: null,
          isLoading: false,
          configLoader: false,
          json: null,
          isView: false,
        },
        functions: {
          handleRuleId: mockHandleRuleId,
        },
      });

      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    });

    it('should handle null ruleId', () => {
      const useRuleConfigController = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController').default;
      useRuleConfigController.mockReturnValue({
        values: {
          ruleConfigs: mockRuleConfigs,
          ruleId: null,
          isLoading: false,
          configLoader: false,
          json: null,
          isView: false,
        },
        functions: {
          handleRuleId: mockHandleRuleId,
        },
      });

      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      const select = screen.getByTestId('dropdown-select') as HTMLSelectElement;
      expect(select.value).toBe('');
    });

    it('should handle complex JSON data', () => {
      const complexJson = {
        nested: { data: [1, 2, 3] },
        array: ['a', 'b', 'c'],
        boolean: true,
        number: 42,
      };

      const useRuleConfigController = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController').default;
      useRuleConfigController.mockReturnValue({
        values: {
          ruleConfigs: mockRuleConfigs,
          ruleId: { label: 'rule1', value: 'rule1' },
          isLoading: false,
          configLoader: false,
          json: complexJson,
          isView: false,
        },
        functions: {
          handleRuleId: mockHandleRuleId,
        },
      });

      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      const jsonContent = screen.getByTestId('json-content');
      expect(jsonContent.textContent).toBe(JSON.stringify(complexJson));
    });
  });

  describe('Component Integration', () => {
    it('should integrate with useRuleConfigController', () => {
      const useRuleConfigController = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig/useRuleConfigController').default;

      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      expect(useRuleConfigController).toHaveBeenCalled();
    });

    it('should use values from controller', () => {
      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      expect(screen.getByTestId('json-formatter')).toBeInTheDocument();
    });

    it('should use functions from controller', () => {
      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      const select = screen.getByTestId('dropdown-select');
      fireEvent.change(select, { target: { value: 'rule2' } });

      expect(mockHandleRuleId).toHaveBeenCalled();
    });
  });

  describe('Component Export', () => {
    it('should export RuleConfig component as default', () => {
      const RuleConfigComponent = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig').default;
      expect(RuleConfigComponent).toBeDefined();
    });

    it('should be a valid React component', () => {
      const RuleConfigComponent = require('../../../../../src/pages/RuleEditor/Modals/RuleConfig').default;
      const element = (
        <RuleConfigComponent
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );
      expect(React.isValidElement(element)).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper label for dropdown', () => {
      renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      expect(screen.getByText('Rule Configurations')).toBeInTheDocument();
    });

    it('should render content in proper structure', () => {
      const { container } = renderWithTheme(
        <RuleConfig
          handleRuleValue={mockHandleRuleValue}
          ruleConfigId={undefined}
          mode={null}
        />
      );

      expect(container.querySelector('.MuiGrid-root')).toBeInTheDocument();
    });
  });
});
