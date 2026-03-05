import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import FormattedJsonSection from '../../../src/components/JsonFormatter';
import EditableJsonPayload from '../../../src/components/JsonFormatter/EditableJsonPayload';

/* ------------------------------------------------------------------ */
/*  Mock @microlink/react-json-view                                    */
/* ------------------------------------------------------------------ */
// eslint-disable-next-line react-hooks/immutability
let capturedProps: Record<string, unknown> = {};

jest.mock('@microlink/react-json-view', () => {
  const MockReactJson = (props: Record<string, unknown>) => {
    capturedProps = props;
    return <div data-testid="react-json-view">{JSON.stringify(props.src)}</div>;
  };
  MockReactJson.displayName = 'ReactJson';
  return { __esModule: true, default: MockReactJson };
});

/* ------------------------------------------------------------------ */
/*  Theme + helpers                                                    */
/* ------------------------------------------------------------------ */
const theme = createTheme({
  palette: {
    text: { primary: '#000', secondary: '#666' },
    static: {
      primary: '#000',
      secondary: '#666',
      skyBlue: '#87CEEB',
      ternary: '#999',
      black: '#000',
      white: '#fff',
      lightBlue: '#ADD8E6',
      border: '#ddd',
      grey: '#ccc',
      lightGrey: '#f5f5f5',
    },
  },
});

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);


describe('FormattedJsonSection', () => {
  beforeEach(() => {
    capturedProps = {};
  });

  describe('Valid JSON', () => {
    it('should render ReactJson viewer for valid JSON', () => {
      renderWithTheme(<FormattedJsonSection value='{"name":"John"}' />);
      expect(screen.getByTestId('react-json-view')).toBeInTheDocument();
    });

    it('should parse and pass JSON object to ReactJson', () => {
      renderWithTheme(<FormattedJsonSection value='{"a":1}' />);
      expect(capturedProps.src).toEqual({ a: 1 });
    });

    it('should render label when provided', () => {
      renderWithTheme(<FormattedJsonSection value='{}' label="Payload" />);
      expect(screen.getByText('Payload :')).toBeInTheDocument();
    });

    it('should not render label when not provided', () => {
      renderWithTheme(<FormattedJsonSection value='{}' />);
      expect(screen.queryByText(':')).not.toBeInTheDocument();
    });

    it('should treat empty string as empty object', () => {
      renderWithTheme(<FormattedJsonSection value="" />);
      expect(screen.getByTestId('react-json-view')).toBeInTheDocument();
      expect(capturedProps.src).toEqual({});
    });

    it('should handle JSON arrays', () => {
      renderWithTheme(<FormattedJsonSection value='[1,2,3]' />);
      expect(capturedProps.src).toEqual([1, 2, 3]);
    });

    it('should handle nested JSON objects', () => {
      const nested = JSON.stringify({ a: { b: { c: 1 } } });
      renderWithTheme(<FormattedJsonSection value={nested} />);
      expect(capturedProps.src).toEqual({ a: { b: { c: 1 } } });
    });
  });

  /* ---------- ReactJson config ---------- */
  describe('ReactJson Configuration', () => {
    it('should set name to false', () => {
      renderWithTheme(<FormattedJsonSection value='{}' />);
      expect(capturedProps.name).toBe(false);
    });

    it('should set displayDataTypes to false', () => {
      renderWithTheme(<FormattedJsonSection value='{}' />);
      expect(capturedProps.displayDataTypes).toBe(false);
    });

    it('should set enableClipboard to false', () => {
      renderWithTheme(<FormattedJsonSection value='{}' />);
      expect(capturedProps.enableClipboard).toBe(false);
    });

    it('should set collapsed to false', () => {
      renderWithTheme(<FormattedJsonSection value='{}' />);
      expect(capturedProps.collapsed).toBe(false);
    });

    it('should use rjv-default theme', () => {
      renderWithTheme(<FormattedJsonSection value='{}' />);
      expect(capturedProps.theme).toBe('rjv-default');
    });

    it('should set displayObjectSize to true', () => {
      renderWithTheme(<FormattedJsonSection value='{}' />);
      expect(capturedProps.displayObjectSize).toBe(true);
    });
  });

  /* ---------- onChange callbacks ---------- */
  describe('onChange Callbacks', () => {
    it('should enable onEdit when onChange is provided', () => {
      const onChange = jest.fn();
      renderWithTheme(<FormattedJsonSection value='{}' onChange={onChange} />);
      expect(capturedProps.onEdit).toBeDefined();
    });

    it('should enable onAdd when onChange is provided', () => {
      const onChange = jest.fn();
      renderWithTheme(<FormattedJsonSection value='{}' onChange={onChange} />);
      expect(capturedProps.onAdd).toBeDefined();
    });

    it('should enable onDelete when onChange is provided', () => {
      const onChange = jest.fn();
      renderWithTheme(<FormattedJsonSection value='{}' onChange={onChange} />);
      expect(capturedProps.onDelete).toBeDefined();
    });

    it('should not enable onEdit when onChange is not provided', () => {
      renderWithTheme(<FormattedJsonSection value='{}' />);
      expect(capturedProps.onEdit).toBeUndefined();
    });

    it('should not enable onAdd when onChange is not provided', () => {
      renderWithTheme(<FormattedJsonSection value='{}' />);
      expect(capturedProps.onAdd).toBeUndefined();
    });

    it('should not enable onDelete when onChange is not provided', () => {
      renderWithTheme(<FormattedJsonSection value='{}' />);
      expect(capturedProps.onDelete).toBeUndefined();
    });

    it('should call onChange with stringified JSON on edit', () => {
      const onChange = jest.fn();
      renderWithTheme(<FormattedJsonSection value='{"a":1}' onChange={onChange} />);
      const onEdit = capturedProps.onEdit as (e: { updated_src: unknown }) => void;
      onEdit({ updated_src: { a: 2 } });
      expect(onChange).toHaveBeenCalledWith(JSON.stringify({ a: 2 }, null, 2));
    });

    it('should call onChange with stringified JSON on add', () => {
      const onChange = jest.fn();
      renderWithTheme(<FormattedJsonSection value='{}' onChange={onChange} />);
      const onAdd = capturedProps.onAdd as (e: { updated_src: unknown }) => void;
      onAdd({ updated_src: { newKey: 'val' } });
      expect(onChange).toHaveBeenCalledWith(JSON.stringify({ newKey: 'val' }, null, 2));
    });

    it('should call onChange with stringified JSON on delete', () => {
      const onChange = jest.fn();
      renderWithTheme(<FormattedJsonSection value='{"a":1,"b":2}' onChange={onChange} />);
      const onDelete = capturedProps.onDelete as (e: { updated_src: unknown }) => void;
      onDelete({ updated_src: { b: 2 } });
      expect(onChange).toHaveBeenCalledWith(JSON.stringify({ b: 2 }, null, 2));
    });
  });

  /* ---------- invalid JSON ---------- */
  describe('Invalid JSON', () => {
    it('should show error state for invalid JSON', () => {
      renderWithTheme(<FormattedJsonSection value="not json" />);
      expect(screen.getByText('Invalid JSON format')).toBeInTheDocument();
    });

    it('should show error icon for invalid JSON', () => {
      const { container } = renderWithTheme(<FormattedJsonSection value="{{bad" />);
      const errorIcon = container.querySelector('[data-testid="ErrorOutlineIcon"]');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should show helper text for invalid JSON', () => {
      renderWithTheme(<FormattedJsonSection value="invalid" />);
      expect(screen.getByText('Enter valid JSON to see preview')).toBeInTheDocument();
    });

    it('should not render ReactJson for invalid JSON', () => {
      renderWithTheme(<FormattedJsonSection value="{invalid}" />);
      expect(screen.queryByTestId('react-json-view')).not.toBeInTheDocument();
    });
  });
});

/* ================================================================== */
/*  EditableJsonPayload                                                */
/* ================================================================== */
describe('EditableJsonPayload', () => {
  beforeEach(() => {
    capturedProps = {};
  });

  /* ---------- valid JSON ---------- */
  describe('Valid JSON', () => {
    it('should render ReactJson viewer for valid JSON', () => {
      renderWithTheme(<EditableJsonPayload value='{"x":1}' />);
      expect(screen.getByTestId('react-json-view')).toBeInTheDocument();
    });

    it('should parse and pass JSON object to ReactJson', () => {
      renderWithTheme(<EditableJsonPayload value='{"key":"val"}' />);
      expect(capturedProps.src).toEqual({ key: 'val' });
    });

    it('should render label when provided', () => {
      renderWithTheme(<EditableJsonPayload value='{}' label="Request Body" />);
      expect(screen.getByText('Request Body')).toBeInTheDocument();
    });

    it('should not render label when not provided', () => {
      const { container } = renderWithTheme(<EditableJsonPayload value='{}' />);
      const typography = container.querySelectorAll('.MuiTypography-body2');
      // Only the ReactJson mock text should exist, no label typography
      const labelTexts = Array.from(typography).filter(
        (el) => el.getAttribute('style')?.includes('fontWeight') || el.textContent === ''
      );
      expect(labelTexts.length).toBe(0);
    });

    it('should treat empty string as empty object', () => {
      renderWithTheme(<EditableJsonPayload value="" />);
      expect(screen.getByTestId('react-json-view')).toBeInTheDocument();
      expect(capturedProps.src).toEqual({});
    });

    it('should handle JSON arrays', () => {
      renderWithTheme(<EditableJsonPayload value='["a","b"]' />);
      expect(capturedProps.src).toEqual(['a', 'b']);
    });
  });

  /* ---------- ReactJson config ---------- */
  describe('ReactJson Configuration', () => {
    it('should set name to false', () => {
      renderWithTheme(<EditableJsonPayload value='{}' />);
      expect(capturedProps.name).toBe(false);
    });

    it('should set displayDataTypes to false', () => {
      renderWithTheme(<EditableJsonPayload value='{}' />);
      expect(capturedProps.displayDataTypes).toBe(false);
    });

    it('should enable clipboard', () => {
      renderWithTheme(<EditableJsonPayload value='{}' />);
      expect(capturedProps.enableClipboard).toBe(true);
    });

    it('should set collapsed to false', () => {
      renderWithTheme(<EditableJsonPayload value='{}' />);
      expect(capturedProps.collapsed).toBe(false);
    });

    it('should use rjv-default theme', () => {
      renderWithTheme(<EditableJsonPayload value='{}' />);
      expect(capturedProps.theme).toBe('rjv-default');
    });

    it('should set indentWidth to 2', () => {
      renderWithTheme(<EditableJsonPayload value='{}' />);
      expect(capturedProps.indentWidth).toBe(2);
    });

    it('should use triangle icon style', () => {
      renderWithTheme(<EditableJsonPayload value='{}' />);
      expect(capturedProps.iconStyle).toBe('triangle');
    });

    it('should disable quotes on keys', () => {
      renderWithTheme(<EditableJsonPayload value='{}' />);
      expect(capturedProps.quotesOnKeys).toBe(false);
    });

    it('should disable onAdd', () => {
      renderWithTheme(<EditableJsonPayload value='{}' />);
      expect(capturedProps.onAdd).toBe(false);
    });

    it('should disable onDelete', () => {
      renderWithTheme(<EditableJsonPayload value='{}' />);
      expect(capturedProps.onDelete).toBe(false);
    });
  });

  /* ---------- Edit (validateEdit) ---------- */
  describe('Edit Behavior', () => {
    it('should enable onEdit when onChange is provided', () => {
      const onChange = jest.fn();
      renderWithTheme(<EditableJsonPayload value='{}' onChange={onChange} />);
      expect(capturedProps.onEdit).toBeDefined();
    });

    it('should not enable onEdit when onChange is not provided', () => {
      renderWithTheme(<EditableJsonPayload value='{}' />);
      expect(capturedProps.onEdit).toBeUndefined();
    });

    it('should call onChange when existing_value is defined', () => {
      const onChange = jest.fn();
      renderWithTheme(<EditableJsonPayload value='{"a":1}' onChange={onChange} />);
      const onEdit = capturedProps.onEdit as (e: {
        existing_value: unknown;
        updated_src: unknown;
        name: string | null;
        namespace: (string | null)[];
      }) => boolean;

      const result = onEdit({
        existing_value: 1,
        updated_src: { a: 2 },
        name: 'a',
        namespace: [],
      });

      expect(onChange).toHaveBeenCalledWith(JSON.stringify({ a: 2 }, null, 2));
      expect(result).toBe(true);
    });

    it('should return false and not call onChange when existing_value is undefined', () => {
      const onChange = jest.fn();
      renderWithTheme(<EditableJsonPayload value='{"a":1}' onChange={onChange} />);
      const onEdit = capturedProps.onEdit as (e: {
        existing_value: unknown;
        updated_src: unknown;
        name: string | null;
        namespace: (string | null)[];
      }) => boolean;

      const result = onEdit({
        existing_value: undefined,
        updated_src: { a: 1, newKey: 'x' },
        name: 'newKey',
        namespace: [],
      });

      expect(onChange).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should accept falsy existing_value like 0', () => {
      const onChange = jest.fn();
      renderWithTheme(<EditableJsonPayload value='{"a":0}' onChange={onChange} />);
      const onEdit = capturedProps.onEdit as (e: {
        existing_value: unknown;
        updated_src: unknown;
        name: string | null;
        namespace: (string | null)[];
      }) => boolean;

      const result = onEdit({
        existing_value: 0,
        updated_src: { a: 5 },
        name: 'a',
        namespace: [],
      });

      expect(onChange).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should accept falsy existing_value like empty string', () => {
      const onChange = jest.fn();
      renderWithTheme(<EditableJsonPayload value='{"a":""}' onChange={onChange} />);
      const onEdit = capturedProps.onEdit as (e: {
        existing_value: unknown;
        updated_src: unknown;
        name: string | null;
        namespace: (string | null)[];
      }) => boolean;

      const result = onEdit({
        existing_value: '',
        updated_src: { a: 'hello' },
        name: 'a',
        namespace: [],
      });

      expect(onChange).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should accept null existing_value', () => {
      const onChange = jest.fn();
      renderWithTheme(<EditableJsonPayload value='{"a":null}' onChange={onChange} />);
      const onEdit = capturedProps.onEdit as (e: {
        existing_value: unknown;
        updated_src: unknown;
        name: string | null;
        namespace: (string | null)[];
      }) => boolean;

      const result = onEdit({
        existing_value: null,
        updated_src: { a: 'hello' },
        name: 'a',
        namespace: [],
      });

      expect(onChange).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  /* ---------- Error handling ---------- */
  describe('Error Display', () => {
    it('should display error message below valid JSON', () => {
      renderWithTheme(<EditableJsonPayload value='{}' error="Values are required" />);
      expect(screen.getByText('Values are required')).toBeInTheDocument();
    });

    it('should not display error when no error prop on valid JSON', () => {
      renderWithTheme(<EditableJsonPayload value='{}' />);
      expect(screen.queryByText('Values are required')).not.toBeInTheDocument();
    });

    it('should display error in invalid JSON state', () => {
      renderWithTheme(<EditableJsonPayload value="bad" error="Fix JSON" />);
      expect(screen.getByText('Fix JSON')).toBeInTheDocument();
    });

    it('should show default helper text when invalid JSON and no error', () => {
      renderWithTheme(<EditableJsonPayload value="bad" />);
      expect(screen.getByText('Enter valid JSON to see preview')).toBeInTheDocument();
    });
  });

  /* ---------- invalid JSON ---------- */
  describe('Invalid JSON', () => {
    it('should show error state for invalid JSON', () => {
      renderWithTheme(<EditableJsonPayload value="not json" />);
      expect(screen.getByText('Invalid JSON format')).toBeInTheDocument();
    });

    it('should show error icon for invalid JSON', () => {
      const { container } = renderWithTheme(<EditableJsonPayload value="{{bad" />);
      const errorIcon = container.querySelector('[data-testid="ErrorOutlineIcon"]');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should not render ReactJson for invalid JSON', () => {
      renderWithTheme(<EditableJsonPayload value="{invalid}" />);
      expect(screen.queryByTestId('react-json-view')).not.toBeInTheDocument();
    });
  });
});



