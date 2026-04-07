/* eslint-disable */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Parser from '../../../../src/pages/RuleEditor/Parser';
import useParserController from '../../../../src/pages/RuleEditor/Parser/useParserController';

jest.mock('../../../../src/pages/RuleEditor/Parser/useParserController', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../../../../src/components/Text', () => ({
  Text: ({ children }: any) => <span>{children}</span>,
}));

jest.mock('../../../../src/components/Wrappers/Section', () => ({
  __esModule: true,
  default: ({ children, header, subHeader }: any) => (
    <div data-testid={`section-${header?.replace(/\s+/g, '-').toLowerCase()}`}>
      <h2>{header}</h2>
      {subHeader && <p>{subHeader}</p>}
      {children}
    </div>
  ),
}));

jest.mock('../../../../src/components/JsonFormatter', () => ({
  __esModule: true,
  default: ({ label, value }: any) => (
    <div data-testid={`json-${label?.replace(/\s+/g, '-').toLowerCase()}`}>
      <span>{label}</span>
      <pre>{value}</pre>
    </div>
  ),
}));

jest.mock('../../../../src/components/Button', () => ({
  __esModule: true,
  default: ({ text, onClick }: any) => (
    <button data-testid={`btn-${text?.toLowerCase()}`} onClick={onClick}>
      {text}
    </button>
  ),
}));

// ─────────────────────────────────────────────────────────────────────────────
const mockedUseParserController = useParserController as jest.MockedFunction<typeof useParserController>;

const mockHandlePrevious = jest.fn();
const mockHandleNext = jest.fn();
const mockFetchJson = jest.fn();

const buildMock = (valuesOverride: Record<string, any> = {}) => ({
  values: {
    payload: null,
    sampleLoader: false,
    txtp: null,
    isEdit: false,
    isView: false,
    ruleRequest: undefined,
    ...valuesOverride,
  },
  functions: {
    handlePrevious: mockHandlePrevious,
    handleNext: mockHandleNext,
    fetchJson: mockFetchJson,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
describe('Parser Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseParserController.mockReturnValue(buildMock() as any);
  });

  const renderParser = (props: { mode?: string | null; data?: Record<string, unknown> } = {}) =>
    render(<Parser mode={props.mode ?? null} {...(props.data ? { data: props.data } : {})} />);

  // ── Static content ─────────────────────────────────────────────────────────
  describe('Static Rendering', () => {
    it('renders the Rule Request heading', () => {
      renderParser();
      expect(screen.getByText('Rule Request')).toBeInTheDocument();
    });

    it('renders the sub-heading text', () => {
      renderParser();
      expect(screen.getByText('View generated Rule Request from selected TxTp')).toBeInTheDocument();
    });

    it('renders the Rule Request Definition section', () => {
      renderParser();
      expect(screen.getByTestId('section-rule-request-definition')).toBeInTheDocument();
    });

    it('renders the section header', () => {
      renderParser();
      expect(screen.getByText('Rule Request Definition')).toBeInTheDocument();
    });

    it('renders the section sub-header', () => {
      renderParser();
      expect(screen.getByText('Generated Rule Request which includes Meta Data, Data Cache, Network Map & Transaction payload')).toBeInTheDocument();
    });

    it('renders Back button', () => {
      renderParser();
      expect(screen.getByTestId('btn-back')).toBeInTheDocument();
    });

    it('renders Next button', () => {
      renderParser();
      expect(screen.getByTestId('btn-next')).toBeInTheDocument();
    });

    it('passes props to the controller hook', () => {
      render(<Parser mode="edit" data={{ id: 'r-1' }} />);
      expect(mockedUseParserController).toHaveBeenCalledWith({ mode: 'edit', data: { id: 'r-1' } });
    });
  });

  // ── Button interactions ────────────────────────────────────────────────────
  describe('Button interactions', () => {
    it('calls handlePrevious on Back click', () => {
      renderParser();
      fireEvent.click(screen.getByTestId('btn-back'));
      expect(mockHandlePrevious).toHaveBeenCalledTimes(1);
    });

    it('calls handleNext on Next click', () => {
      renderParser();
      fireEvent.click(screen.getByTestId('btn-next'));
      expect(mockHandleNext).toHaveBeenCalledTimes(1);
    });
  });

  // ── Conditional: payload ───────────────────────────────────────────────────
  describe('Transaction Payload display', () => {
    it('does NOT render Transaction Payload when payload is null', () => {
      renderParser();
      expect(screen.queryByTestId('json-transaction-payload')).not.toBeInTheDocument();
    });

    it('does NOT render Transaction Payload when payload is falsy empty string', () => {
      mockedUseParserController.mockReturnValue(buildMock({ payload: '' }) as any);
      renderParser();
      expect(screen.queryByTestId('json-transaction-payload')).not.toBeInTheDocument();
    });

    it('renders Transaction Payload when payload has a value', () => {
      mockedUseParserController.mockReturnValue(buildMock({ payload: '{"key":"val"}' }) as any);
      renderParser();
      expect(screen.getByTestId('json-transaction-payload')).toBeInTheDocument();
    });

    it('passes the payload value to FormattedJsonSection', () => {
      mockedUseParserController.mockReturnValue(buildMock({ payload: '{"amount":100}' }) as any);
      renderParser();
      expect(screen.getByText('{"amount":100}')).toBeInTheDocument();
    });
  });

  // ── Conditional: ruleRequest ───────────────────────────────────────────────
  describe('RuleRequest display', () => {
    it('does NOT render RuleRequest when ruleRequest is undefined', () => {
      renderParser();
      expect(screen.queryByTestId('json-rulerequest')).not.toBeInTheDocument();
    });

    it('does NOT render RuleRequest when ruleRequest is null', () => {
      mockedUseParserController.mockReturnValue(buildMock({ ruleRequest: null }) as any);
      renderParser();
      expect(screen.queryByTestId('json-rulerequest')).not.toBeInTheDocument();
    });

    it('renders RuleRequest when ruleRequest has a value', () => {
      mockedUseParserController.mockReturnValue(
        buildMock({ ruleRequest: { id: 'req-1' } }) as any,
      );
      renderParser();
      expect(screen.getByTestId('json-rulerequest')).toBeInTheDocument();
    });

    it('passes JSON.stringify of ruleRequest to FormattedJsonSection', () => {
      const ruleRequest = { id: 'req-1', type: 'rule' };
      mockedUseParserController.mockReturnValue(buildMock({ ruleRequest }) as any);
      renderParser();
      expect(screen.getByText(JSON.stringify(ruleRequest))).toBeInTheDocument();
    });
  });

  // ── Both sections shown together ────────────────────────────────────────────
  describe('Both payload and ruleRequest present', () => {
    it('renders both FormattedJsonSection components', () => {
      mockedUseParserController.mockReturnValue(
        buildMock({ payload: '{"a":1}', ruleRequest: { b: 2 } }) as any,
      );
      renderParser();
      expect(screen.getByTestId('json-transaction-payload')).toBeInTheDocument();
      expect(screen.getByTestId('json-rulerequest')).toBeInTheDocument();
    });
  });
});
