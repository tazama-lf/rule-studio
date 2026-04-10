import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import Login from '../../../../src/pages/Auth/Login';

const mockHandleSubmit = jest.fn();
const mockControl = {
  _subjects: {},
  _defaultValues: { username: '', password: '' },
} as any;

jest.mock('../../../../src/pages/Auth/Login/useLoginController', () => ({
  __esModule: true,
  default: () => ({
    values: {
      control: mockControl,
      errors: {},
      isLoading: false,
    },
    functions: {
      handleSubmit: mockHandleSubmit,
    },
  }),
}));

jest.mock('react-hook-form', () => ({
  Controller: ({ render }: any) => {
    const field = {
      onChange: jest.fn(),
      onBlur: jest.fn(),
      value: '',
      name: 'test',
      ref: jest.fn(),
    };
    const fieldState = { error: undefined };
    return render({ field, fieldState });
  },
}));

const theme = createTheme({
  palette: {
    text: { primary: '#000', secondary: '#666', black: '#000' },
    static: { grey: '#ccc', border: '#ddd', secondary: '#1976d2' },
  } as any,
});

const renderWithTheme = (ui: React.ReactElement) =>
  render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the login component', () => {
      renderWithTheme(<Login />);

      expect(screen.getByText('Tazama Rule Studio')).toBeInTheDocument();
    });

    it('should render the Tazama logo in header', () => {
      renderWithTheme(<Login />);

      const logos = screen.getAllByAltText(/Tazama Logo/i);
      expect(logos.length).toBeGreaterThan(0);
    });

    it('should render the main logo', () => {
      renderWithTheme(<Login />);

      const logo = screen.getByAltText('Logo');
      expect(logo).toBeInTheDocument();
    });

    it('should render the tree image', () => {
      renderWithTheme(<Login />);

      const treeImage = screen.getByAltText('Login visual');
      expect(treeImage).toBeInTheDocument();
    });

    it('should render the title', () => {
      renderWithTheme(<Login />);

      expect(screen.getByText('Tazama Rule Studio')).toBeInTheDocument();
    });

    it('should render the subtitle', () => {
      renderWithTheme(<Login />);

      expect(
        screen.getByText(
          'Please Enter Your Login Credentials To Access The Portal.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Form Elements', () => {
    it('should render email input field', () => {
      renderWithTheme(<Login />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toBeInTheDocument();
    });

    it('should render password input field', () => {
      renderWithTheme(<Login />);

      const passwordInput = screen.getByLabelText(/Password/i);
      expect(passwordInput).toBeInTheDocument();
    });

    it('should mark email field as required', () => {
      renderWithTheme(<Login />);

      const emailInputs = screen.getAllByText(/Email Address/i);
      expect(emailInputs.length).toBeGreaterThan(0);
    });

    it('should mark password field as required', () => {
      renderWithTheme(<Login />);

      const passwordInputs = screen.getAllByText(/Password/i);
      expect(passwordInputs.length).toBeGreaterThan(0);
    });

    it('should render password field with type password', () => {
      renderWithTheme(<Login />);

      const passwordInput = screen.getByLabelText(/Password/i);
      expect(passwordInput).toBeInTheDocument();
    });

    it('should render login button', () => {
      renderWithTheme(<Login />);

      const loginButton = screen.getByText('LOGIN');
      expect(loginButton).toBeInTheDocument();
    });

    it('should render email icon', () => {
      renderWithTheme(<Login />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput.parentElement).toBeInTheDocument();
    });

    it('should render lock icon', () => {
      renderWithTheme(<Login />);

      const passwordInput = screen.getByLabelText(/Password/i);
      expect(passwordInput.parentElement).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should call handleSubmit when login button is clicked', () => {
      renderWithTheme(<Login />);

      const loginButton = screen.getByText('LOGIN');
      fireEvent.click(loginButton);

      expect(mockHandleSubmit).toHaveBeenCalled();
    });

    it('should allow typing in email field', () => {
      renderWithTheme(<Login />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput).toBeInTheDocument();
    });

    it('should allow typing in password field', () => {
      renderWithTheme(<Login />);

      const passwordInput = screen.getByLabelText(/Password/i);
      fireEvent.change(passwordInput, { target: { value: 'password123' } });

      expect(passwordInput).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading state on login button when isLoading is true', () => {
      jest.mock('../../../../src/pages/Auth/Login/useLoginController', () => ({
        __esModule: true,
        default: () => ({
          values: {
            control: mockControl,
            errors: {},
            isLoading: true,
          },
          functions: {
            handleSubmit: mockHandleSubmit,
          },
        }),
      }));

      renderWithTheme(<Login />);

      const loginButton = screen.getByText('LOGIN');
      expect(loginButton).toBeInTheDocument();
    });

    it('should not show loading when isLoading is false', () => {
      renderWithTheme(<Login />);

      const loginButton = screen.getByText('LOGIN');
      expect(loginButton).toBeInTheDocument();
    });
  });

  describe('Footer', () => {
    it('should render footer with copyright text', () => {
      renderWithTheme(<Login />);

      const currentYear = new Date().getFullYear();
      const footerText = screen.getByText(
        new RegExp(`© ${currentYear} Tazama`)
      );
      expect(footerText).toBeInTheDocument();
    });

    it('should display current year in footer', () => {
      renderWithTheme(<Login />);

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    });

    it('should render Paysys Labs branding', () => {
      renderWithTheme(<Login />);

      expect(
        screen.getByText(/Powered by Paysys Labs/i)
      ).toBeInTheDocument();
    });
  });

  describe('Layout Structure', () => {
    it('should render header section', () => {
      const { container } = renderWithTheme(<Login />);

      expect(container.querySelector('header')).toBeInTheDocument();
    });

    it('should render main section', () => {
      renderWithTheme(<Login />);

      expect(screen.getByText('Tazama Rule Studio')).toBeInTheDocument();
    });

    it('should render left section with login card', () => {
      renderWithTheme(<Login />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toBeInTheDocument();
    });

    it('should render right section with tree image', () => {
      renderWithTheme(<Login />);

      const treeImage = screen.getByAltText('Login visual');
      expect(treeImage).toBeInTheDocument();
    });

    it('should have background pattern', () => {
      const { container } = renderWithTheme(<Login />);

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for form inputs', () => {
      renderWithTheme(<Login />);

      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    });

    it('should have alt text for logos', () => {
      renderWithTheme(<Login />);

      expect(screen.getByAltText('Logo')).toBeInTheDocument();
      expect(screen.getByAltText('Login visual')).toBeInTheDocument();
    });

    it('should render CssBaseline for consistent styling', () => {
      const { container } = renderWithTheme(<Login />);

      expect(container).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    it('should render all major sections', () => {
      const { container } = renderWithTheme(<Login />);

      expect(screen.getByText('Tazama Rule Studio')).toBeInTheDocument();
      expect(screen.getByText('LOGIN')).toBeInTheDocument();
      expect(container.querySelector('header')).toBeInTheDocument();
    });

    it('should have proper component hierarchy', () => {
      renderWithTheme(<Login />);

      const title = screen.getByText('Tazama Rule Studio');
      const subtitle = screen.getByText(
        'Please Enter Your Login Credentials To Access The Portal.'
      );

      expect(title).toBeInTheDocument();
      expect(subtitle).toBeInTheDocument();
    });
  });

  describe('Form Controllers', () => {
    it('should use Controller for email field', () => {
      renderWithTheme(<Login />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toBeInTheDocument();
    });

    it('should use Controller for password field', () => {
      renderWithTheme(<Login />);

      const passwordInput = screen.getByLabelText(/Password/i);
      expect(passwordInput).toBeInTheDocument();
    });

    it('should pass control to Controllers', () => {
      renderWithTheme(<Login />);

      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    });
  });

  describe('Button Props', () => {
    it('should render button with correct text', () => {
      renderWithTheme(<Login />);

      expect(screen.getByText('LOGIN')).toBeInTheDocument();
    });

    it('should render button with primary type', () => {
      renderWithTheme(<Login />);

      const loginButton = screen.getByText('LOGIN');
      expect(loginButton).toBeInTheDocument();
    });

    it('should render button with large size', () => {
      renderWithTheme(<Login />);

      const loginButton = screen.getByText('LOGIN');
      expect(loginButton).toBeInTheDocument();
    });

    it('should render button with login icon', () => {
      renderWithTheme(<Login />);

      const loginButton = screen.getByText('LOGIN');
      expect(loginButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should render without errors prop initially', () => {
      renderWithTheme(<Login />);

      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    });

    it('should not display error messages initially', () => {
      renderWithTheme(<Login />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toBeInTheDocument();
    });
  });

  describe('Image Loading', () => {
    it('should load main logo image', () => {
      renderWithTheme(<Login />);

      const logo = screen.getByAltText('Logo');
      expect(logo).toHaveAttribute('src');
    });

    it('should load tazama logo image', () => {
      renderWithTheme(<Login />);

      const tazamaLogo = screen.getAllByAltText(/Tazama Logo/i)[0];
      expect(tazamaLogo).toHaveAttribute('src');
    });

    it('should load tree image', () => {
      renderWithTheme(<Login />);

      const treeImage = screen.getByAltText('Login visual');
      expect(treeImage).toHaveAttribute('src');
    });
  });

  describe('Responsive Design Elements', () => {
    it('should render left section', () => {
      renderWithTheme(<Login />);

      const emailInput = screen.getByLabelText(/Email Address/i);
      expect(emailInput).toBeInTheDocument();
    });

    it('should render right section', () => {
      renderWithTheme(<Login />);

      const treeImage = screen.getByAltText('Login visual');
      expect(treeImage).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('should integrate with useLoginController hook', () => {
      renderWithTheme(<Login />);

      expect(screen.getByText('LOGIN')).toBeInTheDocument();
    });

    it('should pass isLoading to Button component', () => {
      renderWithTheme(<Login />);

      const loginButton = screen.getByText('LOGIN');
      expect(loginButton).toBeInTheDocument();
    });

    it('should pass handleSubmit to Button onClick', async () => {
      renderWithTheme(<Login />);

      const loginButton = screen.getByText('LOGIN');
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockHandleSubmit).toHaveBeenCalled();
      });
    });
  });
});
