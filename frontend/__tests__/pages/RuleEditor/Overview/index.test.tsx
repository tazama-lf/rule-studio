/* eslint-disable */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Overview from '../../../../src/pages/RuleEditor/Overview';
import useOverviewController from '../../../../src/pages/RuleEditor/Overview/useOverviewController';

// ─── Controller mock with mutable field values ────────────────────────────────
// Kept in module scope so individual tests can inject custom field values.
const mockFieldValues: Record<string, any> = {};
const capturedFieldOnChange: Record<string, jest.Mock> = {};

jest.mock('react-hook-form', () => ({
  Controller: ({ render: renderFn, name }: any) => {
    const fieldOnChange = jest.fn();
    capturedFieldOnChange[name] = fieldOnChange;
    return renderFn({
      field: {
        name,
        value: mockFieldValues[name] ?? '',
        onChange: fieldOnChange,
        onBlur: jest.fn(),
        ref: jest.fn(),
      },
      fieldState: { error: undefined },
    });
  },
}));

// ─── Mock the controller hook ─────────────────────────────────────────────────
jest.mock('../../../../src/pages/RuleEditor/Overview/useOverviewController', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// ─── Component stubs ──────────────────────────────────────────────────────────
jest.mock('../../../../src/components/Loader', () => ({
  __esModule: true,
  default: ({ center }: { center?: boolean }) => (
    <div data-testid="loader" data-center={String(!!center)} />
  ),
}));

jest.mock('../../../../src/components/DropDown', () => ({
  __esModule: true,
  default: ({
    label,
    placeholder,
    error,
    onClick,
    onChange,
    disabled,
    required,
    options,
    value,
  }: any) => (
    <div data-testid={`dropdown-${(label ?? '').replace(/\s+/g, '-').toLowerCase()}`}>
      <label>
        {label}
        {required && ' *'}
      </label>
      <select
        aria-label={label}
        disabled={disabled}
        value={value?.value ?? ''}
        onChange={(e) => {
          const opt = { label: e.target.value, value: e.target.value };
          onClick?.(opt);
          onChange?.(opt);
        }}
      >
        <option value="">{placeholder}</option>
        {(options ?? []).map((o: any) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <span data-testid={`error-${(label ?? '').replace(/\s+/g, '-').toLowerCase()}`}>
          {error}
        </span>
      )}
    </div>
  ),
}));

jest.mock('../../../../src/components/Input', () => ({
  __esModule: true,
  default: ({ label, error, onChange, disabled, required, type, value, maxLength }: any) => (
    <div data-testid={`input-${(label ?? '').replace(/\s+/g, '-').toLowerCase()}`}>
      <label>
        {label}
        {required && ' *'}
      </label>
      {type === 'textarea' ? (
        <textarea
          aria-label={label}
          disabled={disabled}
          value={value ?? ''}
          maxLength={maxLength}
          onChange={onChange}
        />
      ) : (
        <input
          aria-label={label}
          disabled={disabled}
          value={value ?? ''}
          onChange={onChange}
        />
      )}
      {error && (
        <span data-testid={`error-${(label ?? '').replace(/\s+/g, '-').toLowerCase()}`}>
          {error}
        </span>
      )}
    </div>
  ),
}));

jest.mock('../../../../src/components/Button', () => ({
  __esModule: true,
  default: ({ text, onClick, loading }: any) => (
    <button
      data-testid={`btn-${(text ?? '').replace(/\s+/g, '-').toLowerCase()}`}
      onClick={onClick}
      disabled={!!loading}
    >
      {text}
    </button>
  ),
}));

jest.mock('../../../../src/components/Text', () => ({
  Text: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('../../../../src/components/Wrappers/Section', () => ({
  __esModule: true,
  default: ({ children, header, subHeader }: any) => (
    <div data-testid={`section-${(header ?? '').replace(/\s+/g, '-').toLowerCase()}`}>
      <h2>{header}</h2>
      {subHeader && <p>{subHeader}</p>}
      {children}
    </div>
  ),
}));

// ─────────────────────────────────────────────────────────────────────────────
const mockedUseOverviewController = useOverviewController as jest.MockedFunction<
  typeof useOverviewController
>;

const mockHandleRuleConfig = jest.fn();
const mockHandleNetworkMap = jest.fn();
const mockHandleTxTp = jest.fn();
const mockHandleSubmit = jest.fn();
const mockHandleNext = jest.fn();

const ruleTypes = [
  { label: 'Type A', value: 'typeA' },
  { label: 'Type B', value: 'typeB' },
];

const transactions = [
  { label: 'pacs.002', value: 'pacs.002' },
  { label: 'pain.001', value: 'pain.001' },
];

const txtpVersions = [
  { label: '1.0.0', value: '1.0.0' },
  { label: '2.0.0', value: '2.0.0' },
];

const buildMock = (
  valuesOverride: Record<string, any> = {},
  functionsOverride: Record<string, any> = {},
) => ({
  values: {
    isLoading: false,
    isEdit: false,
    createLoading: false,
    control: {},
    errors: {},
    rule_config_id: null,
    ruleTypes,
    transactions,
    txtpVersions,
    ...valuesOverride,
  },
  functions: {
    handleRuleConfig: mockHandleRuleConfig,
    handleNetworkMap: mockHandleNetworkMap,
    handleTxTp: mockHandleTxTp,
    handleSubmit: mockHandleSubmit,
    handleNext: mockHandleNext,
    ...functionsOverride,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Overview Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.keys(mockFieldValues).forEach((k) => delete mockFieldValues[k]);
    Object.keys(capturedFieldOnChange).forEach((k) => delete capturedFieldOnChange[k]);
    mockedUseOverviewController.mockReturnValue(buildMock() as any);
  });

  const renderOverview = (props: { mode?: string | null; data?: Record<string, unknown> } = {}) =>
    render(<Overview mode={props.mode ?? null} {...(props.data ? { data: props.data } : {})} />);

  // ───────────────────────────────────────────────────────────────────────────
  describe('Loading State', () => {
    beforeEach(() => {
      mockedUseOverviewController.mockReturnValue(buildMock({ isLoading: true }) as any);
    });

    it('renders Loader when isLoading is true', () => {
      renderOverview();
      expect(screen.getByTestId('loader')).toBeInTheDocument();
    });

    it('renders Loader with center=true', () => {
      renderOverview();
      expect(screen.getByTestId('loader')).toHaveAttribute('data-center', 'true');
    });

    it('does not render the form when loading', () => {
      renderOverview();
      expect(screen.queryByText('Rule Overview')).not.toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('Form Rendering', () => {
    it('renders Rule Overview heading', () => {
      renderOverview();
      expect(screen.getByText('Rule Overview')).toBeInTheDocument();
    });

    it('renders the sub-heading text', () => {
      renderOverview();
      expect(screen.getByText('Basic information about this rule')).toBeInTheDocument();
    });

    it('renders Configuration Association section', () => {
      renderOverview();
      expect(screen.getByTestId('section-configuration-association')).toBeInTheDocument();
    });

    it('renders Configuration Association section header', () => {
      renderOverview();
      expect(screen.getByText('Configuration Association')).toBeInTheDocument();
    });

    it('renders Configuration Association sub-header', () => {
      renderOverview();
      expect(
        screen.getByText(
          'Associate this rule with transaction flow, network context, and typology definitions',
        ),
      ).toBeInTheDocument();
    });

    it('renders General Information section', () => {
      renderOverview();
      expect(screen.getByTestId('section-general-information')).toBeInTheDocument();
    });

    it('renders General Information section header', () => {
      renderOverview();
      expect(screen.getByText('General Information')).toBeInTheDocument();
    });

    it('renders Rule Config dropdown', () => {
      renderOverview();
      expect(screen.getByTestId('dropdown-rule-config')).toBeInTheDocument();
    });

    it('renders Rule Name input', () => {
      renderOverview();
      expect(screen.getByTestId('input-rule-name')).toBeInTheDocument();
    });

    it('renders Rule Version input', () => {
      renderOverview();
      expect(screen.getByTestId('input-rule-version')).toBeInTheDocument();
    });

    it('renders Rule Type dropdown', () => {
      renderOverview();
      expect(screen.getByTestId('dropdown-rule-type')).toBeInTheDocument();
    });

    it('renders Description textarea', () => {
      renderOverview();
      expect(screen.getByTestId('input-description')).toBeInTheDocument();
    });

    it('renders Transaction Type dropdown', () => {
      renderOverview();
      expect(screen.getByTestId('dropdown-transaction-type')).toBeInTheDocument();
    });

    it('renders Transaction Type Versions dropdown', () => {
      renderOverview();
      expect(screen.getByTestId('dropdown-transaction-type-versions')).toBeInTheDocument();
    });

    it('passes props to the controller hook', () => {
      render(<Overview mode="clone" data={{ id: 'rule-1' }} />);
      expect(mockedUseOverviewController).toHaveBeenCalledWith({
        mode: 'clone',
        data: { id: 'rule-1' },
      });
    });

    it('renders Rule Name input as disabled', () => {
      renderOverview();
      expect(screen.getByRole('textbox', { name: /Rule Name/ })).toBeDisabled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('Dropdown Options', () => {
    it('passes ruleTypes options to Rule Type dropdown', () => {
      renderOverview();
      expect(screen.getByRole('option', { name: 'Type A' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Type B' })).toBeInTheDocument();
    });

    it('passes transactions options to Transaction Type dropdown', () => {
      renderOverview();
      expect(screen.getByRole('option', { name: 'pacs.002' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'pain.001' })).toBeInTheDocument();
    });

    it('passes txtpVersions options to Transaction Type Versions dropdown', () => {
      renderOverview();
      expect(screen.getByRole('option', { name: '1.0.0' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '2.0.0' })).toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('Save & Next Button (isEdit = false)', () => {
    it('renders Save & Next button', () => {
      renderOverview();
      expect(screen.getByTestId('btn-save-&-next')).toBeInTheDocument();
    });

    it('does not render Next button', () => {
      renderOverview();
      expect(screen.queryByTestId('btn-next')).not.toBeInTheDocument();
    });

    it('calls handleSubmit on click', () => {
      renderOverview();
      fireEvent.click(screen.getByTestId('btn-save-&-next'));
      expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
    });

    it('disables Save & Next when createLoading is true', () => {
      mockedUseOverviewController.mockReturnValue(buildMock({ createLoading: true }) as any);
      renderOverview();
      expect(screen.getByTestId('btn-save-&-next')).toBeDisabled();
    });

    it('enables Save & Next when createLoading is false', () => {
      renderOverview();
      expect(screen.getByTestId('btn-save-&-next')).not.toBeDisabled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('Next Button (isEdit = true)', () => {
    beforeEach(() => {
      mockedUseOverviewController.mockReturnValue(buildMock({ isEdit: true }) as any);
    });

    it('renders Next button', () => {
      renderOverview();
      expect(screen.getByTestId('btn-next')).toBeInTheDocument();
    });

    it('does not render Save & Next button', () => {
      renderOverview();
      expect(screen.queryByTestId('btn-save-&-next')).not.toBeInTheDocument();
    });

    it('calls handleNext on click', () => {
      renderOverview();
      fireEvent.click(screen.getByTestId('btn-next'));
      expect(mockHandleNext).toHaveBeenCalledTimes(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('Edit Mode — Disabled Fields', () => {
    beforeEach(() => {
      mockedUseOverviewController.mockReturnValue(buildMock({ isEdit: true }) as any);
    });

    it('disables Rule Version input', () => {
      renderOverview();
      expect(screen.getByRole('textbox', { name: /Rule Version/ })).toBeDisabled();
    });

    it('disables Rule Type dropdown', () => {
      renderOverview();
      expect(screen.getByRole('combobox', { name: /Rule Type/ })).toBeDisabled();
    });

    it('disables Transaction Type dropdown', () => {
      renderOverview();
      expect(screen.getByRole('combobox', { name: /Transaction Type$/ })).toBeDisabled();
    });

    it('disables Transaction Type Versions dropdown', () => {
      renderOverview();
      expect(screen.getByRole('combobox', { name: /Transaction Type Versions/ })).toBeDisabled();
    });

    it('disables Description textarea', () => {
      renderOverview();
      expect(screen.getByRole('textbox', { name: /Description/ })).toBeDisabled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('Rule Config Error Display', () => {
    it('shows error when rule_config_id is null and error message exists', () => {
      mockedUseOverviewController.mockReturnValue(
        buildMock({
          rule_config_id: null,
          errors: { rule_config_id: { message: 'Rule Config is required' } },
        }) as any,
      );
      renderOverview();
      expect(screen.getByText('Rule Config is required')).toBeInTheDocument();
    });

    it('hides error when rule_config_id is set', () => {
      mockedUseOverviewController.mockReturnValue(
        buildMock({
          rule_config_id: { label: 'RC-1', value: 'rc-1' },
          errors: { rule_config_id: { message: 'Rule Config is required' } },
        }) as any,
      );
      renderOverview();
      expect(screen.queryByText('Rule Config is required')).not.toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('Rule Name Error Display', () => {
    it('shows error when rule_name field is empty and error message exists', () => {
      // Controller mock gives value='' → !field.value is true → error shown
      mockedUseOverviewController.mockReturnValue(
        buildMock({ errors: { rule_name: { message: 'Rule Name is required' } } }) as any,
      );
      renderOverview();
      expect(screen.getByText('Rule Name is required')).toBeInTheDocument();
    });

    it('hides rule_name error when field has a value', () => {
      mockFieldValues['rule_name'] = 'tenant-rc-1';
      mockedUseOverviewController.mockReturnValue(
        buildMock({ errors: { rule_name: { message: 'Rule Name is required' } } }) as any,
      );
      renderOverview();
      expect(screen.queryByText('Rule Name is required')).not.toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('Transaction Type Error Display', () => {
    it('shows txtp error when field value is empty and error message exists', () => {
      mockedUseOverviewController.mockReturnValue(
        buildMock({ errors: { txtp: { message: 'Transaction Type is required' } } }) as any,
      );
      renderOverview();
      expect(screen.getByText('Transaction Type is required')).toBeInTheDocument();
    });

    it('hides txtp error when field has a value', () => {
      mockFieldValues['txtp'] = 'pacs.002';
      mockedUseOverviewController.mockReturnValue(
        buildMock({ errors: { txtp: { message: 'Transaction Type is required' } } }) as any,
      );
      renderOverview();
      expect(screen.queryByText('Transaction Type is required')).not.toBeInTheDocument();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('Rule Config Dropdown Interaction', () => {
    it('calls handleRuleConfig when Rule Config dropdown changes', () => {
      renderOverview();
      fireEvent.change(screen.getByRole('combobox', { name: /Rule Config/ }), {
        target: { value: 'rc-1' },
      });
      expect(mockHandleRuleConfig).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('Transaction Type Dropdown Interaction', () => {
    it('calls handleTxTp with the selected option', () => {
      renderOverview();
      fireEvent.change(screen.getByRole('combobox', { name: /Transaction Type$/ }), {
        target: { value: 'pacs.002' },
      });
      expect(mockHandleTxTp).toHaveBeenCalledWith({ label: 'pacs.002', value: 'pacs.002' });
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  describe('Version Input — onChange Validation', () => {
    const changeVersion = (value: string) =>
      fireEvent.change(screen.getByRole('textbox', { name: /Rule Version/ }), {
        target: { value },
      });

    it('calls field.onChange for a single integer ("1")', () => {
      renderOverview();
      const onChange = capturedFieldOnChange['version'];
      changeVersion('1');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('calls field.onChange for empty string', () => {
      mockFieldValues['version'] = '1'; // start non-empty so the change event actually fires
      renderOverview();
      const onChange = capturedFieldOnChange['version'];
      changeVersion('');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('calls field.onChange for version with one dot ("1.0")', () => {
      renderOverview();
      const onChange = capturedFieldOnChange['version'];
      changeVersion('1.0');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('calls field.onChange for version with two dots ("1.0.0")', () => {
      renderOverview();
      const onChange = capturedFieldOnChange['version'];
      changeVersion('1.0.0');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('does NOT call field.onChange for double-dot ("1..0")', () => {
      renderOverview();
      const onChange = capturedFieldOnChange['version'];
      changeVersion('1..0');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does NOT call field.onChange for three dots ("1.0.0.1")', () => {
      renderOverview();
      const onChange = capturedFieldOnChange['version'];
      changeVersion('1.0.0.1');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does NOT call field.onChange for non-numeric input ("abc")', () => {
      renderOverview();
      const onChange = capturedFieldOnChange['version'];
      changeVersion('abc');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does NOT call field.onChange for mixed alpha-numeric ("1a")', () => {
      renderOverview();
      const onChange = capturedFieldOnChange['version'];
      changeVersion('1a');
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
