import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import TestCases from '../../../../src/pages/RuleEditor/TestCases';

const mockHandleNext = jest.fn();
const mockHandleBack = jest.fn();
const mockHandleCanvas = jest.fn();

const mockStatusConfig = {
    title: 'Test Cases Not Created Yet',
    description: 'Your test cases are in initial mode. Click the button below to start generating test cases.',
    buttonText: 'Open Test Case Generator',
    color: '#FFA726',
    bgColor: '#FFF3E0',
    icon: '🔧'
};

const mockUseTestCasesController = jest.fn();

jest.mock('../../../../src/pages/RuleEditor/TestCases/useTestCasesController', () => ({
    __esModule: true,
    default: (...args: unknown[]) => mockUseTestCasesController(...args),
}));

jest.mock('../../../../src/components/Button', () => ({
    __esModule: true,
    default: ({ text, onClick, type, size, height, width }: {
        text: string;
        onClick: () => void;
        type: string;
        size: string;
        height: string;
        width?: string;
    }) => (
        <button
            data-testid={`button-${text.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={onClick}
            data-type={type}
            data-size={size}
            data-height={height}
            data-width={width}
        >
            {text}
        </button>
    ),
}));

jest.mock('../../../../src/components/Text', () => ({
    Text: ({ children, weight, color, size, sx }: {
        children: React.ReactNode;
        weight?: string;
        color?: string;
        size?: string;
        sx?: Record<string, unknown>;
    }) => (
        <div
            data-testid="text-component"
            data-weight={weight}
            data-color={color}
            data-size={size}
            data-sx={JSON.stringify(sx)}
        >
            {children}
        </div>
    ),
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
    return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('TestCases Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseTestCasesController.mockReturnValue({
            values: {
                flowStatus: 'initial',
                isInitial: true,
                isPassed: false,
                isFailed: false,
                isLoadingFlow: false,
                statusConfig: mockStatusConfig,
            },
            functions: {
                handleNext: mockHandleNext,
                handleBack: mockHandleBack,
                handleCanvas: mockHandleCanvas,
            },
        });
    });

    describe('Component Rendering', () => {
        it('should render TestCases component', () => {
            renderWithTheme(<TestCases />);

            expect(screen.getByText('Generate Test Cases')).toBeInTheDocument();
        });

        it('should render without errors', () => {
            expect(() => renderWithTheme(<TestCases />)).not.toThrow();
        });

        it('should call useTestCasesController hook', () => {
            renderWithTheme(<TestCases />);

            expect(mockUseTestCasesController).toHaveBeenCalled();
        });

        it('should pass props to useTestCasesController', () => {
            const propsData = { id: '123', rule_name: 'Test Rule' };

            renderWithTheme(<TestCases data={propsData} />);

            expect(mockUseTestCasesController).toHaveBeenCalledWith({ data: propsData });
        });
    });

    describe('Header Section', () => {
        it('should display main title', () => {
            renderWithTheme(<TestCases />);

            expect(screen.getByText('Generate Test Cases')).toBeInTheDocument();
        });

        it('should display subtitle', () => {
            renderWithTheme(<TestCases />);

            expect(screen.getByText('Create and manage your test cases')).toBeInTheDocument();
        });
    });

    describe('Loading State', () => {
        it('should show CircularProgress when isLoadingFlow is true', () => {
            mockUseTestCasesController.mockReturnValue({
                values: {
                    flowStatus: 'initial',
                    isInitial: true,
                    isPassed: false,
                    isFailed: false,
                    isLoadingFlow: true,
                    statusConfig: mockStatusConfig,
                },
                functions: {
                    handleNext: mockHandleNext,
                    handleBack: mockHandleBack,
                    handleCanvas: mockHandleCanvas,
                },
            });

            renderWithTheme(<TestCases />);

            expect(screen.getByRole('progressbar')).toBeInTheDocument();
        });

        it('should hide content when loading', () => {
            mockUseTestCasesController.mockReturnValue({
                values: {
                    flowStatus: 'initial',
                    isInitial: true,
                    isPassed: false,
                    isFailed: false,
                    isLoadingFlow: true,
                    statusConfig: mockStatusConfig,
                },
                functions: {
                    handleNext: mockHandleNext,
                    handleBack: mockHandleBack,
                    handleCanvas: mockHandleCanvas,
                },
            });

            renderWithTheme(<TestCases />);

            expect(screen.queryByText(mockStatusConfig.title)).not.toBeInTheDocument();
        });
    });

    describe('Status Card', () => {
        it('should display status title', () => {
            renderWithTheme(<TestCases />);

            expect(screen.getByText(mockStatusConfig.title)).toBeInTheDocument();
        });

        it('should display status description', () => {
            renderWithTheme(<TestCases />);

            expect(screen.getByText(mockStatusConfig.description)).toBeInTheDocument();
        });

        it('should display status icon', () => {
            renderWithTheme(<TestCases />);

            expect(screen.getByText(mockStatusConfig.icon)).toBeInTheDocument();
        });

        it('should display action button with correct text', () => {
            renderWithTheme(<TestCases />);

            const button = screen.getByTestId('button-open-test-case-generator');
            expect(button).toBeInTheDocument();
            expect(button.textContent).toBe(mockStatusConfig.buttonText);
        });
    });

    describe('Initial Status', () => {
        it('should display initial status correctly', () => {
            renderWithTheme(<TestCases />);

            expect(screen.getByText('Test Cases Not Created Yet')).toBeInTheDocument();
            expect(screen.getByText('🔧')).toBeInTheDocument();
        });

        it('should show correct button text for initial status', () => {
            renderWithTheme(<TestCases />);

            const button = screen.getByTestId('button-open-test-case-generator');
            expect(button.textContent).toBe('Open Test Case Generator');
        });
    });

    describe('Pass Status', () => {
        it('should display pass status correctly', () => {
            mockUseTestCasesController.mockReturnValue({
                values: {
                    flowStatus: 'pass',
                    isInitial: false,
                    isPassed: true,
                    isFailed: false,
                    isLoadingFlow: false,
                    statusConfig: {
                        title: 'Test Cases Validated Successfully',
                        description: 'Your test cases have been validated and are ready to use. You can edit them anytime.',
                        buttonText: 'View Test Cases',
                        color: '#66BB6A',
                        bgColor: '#E8F5E9',
                        icon: '✅'
                    },
                },
                functions: {
                    handleNext: mockHandleNext,
                    handleBack: mockHandleBack,
                    handleCanvas: mockHandleCanvas,
                },
            });

            renderWithTheme(<TestCases />);

            expect(screen.getByText('Test Cases Validated Successfully')).toBeInTheDocument();
            expect(screen.getByText('✅')).toBeInTheDocument();
        });
    });

    describe('Fail Status', () => {
        it('should display fail status correctly', () => {
            mockUseTestCasesController.mockReturnValue({
                values: {
                    flowStatus: 'fail',
                    isInitial: false,
                    isPassed: false,
                    isFailed: true,
                    isLoadingFlow: false,
                    statusConfig: {
                        title: 'Validation Failed',
                        description: 'Your test cases contain errors and need to be fixed. Click below to review and correct the issues.',
                        buttonText: 'View Test Cases',
                        color: '#EF5350',
                        bgColor: '#FFEBEE',
                        icon: '⚠️'
                    },
                },
                functions: {
                    handleNext: mockHandleNext,
                    handleBack: mockHandleBack,
                    handleCanvas: mockHandleCanvas,
                },
            });

            renderWithTheme(<TestCases />);

            expect(screen.getByText('Validation Failed')).toBeInTheDocument();
            expect(screen.getByText('⚠️')).toBeInTheDocument();
        });
    });

    describe('Navigation Buttons', () => {
        it('should render Back button', () => {
            renderWithTheme(<TestCases />);

            const backButton = screen.getByTestId('button-back');
            expect(backButton).toBeInTheDocument();
        });

        it('should render Next button', () => {
            renderWithTheme(<TestCases />);

            const nextButton = screen.getByTestId('button-next');
            expect(nextButton).toBeInTheDocument();
        });

        it('should call handleBack when Back button clicked', () => {
            renderWithTheme(<TestCases />);

            const backButton = screen.getByTestId('button-back');
            fireEvent.click(backButton);

            expect(mockHandleBack).toHaveBeenCalled();
        });

        it('should call handleNext when Next button clicked', () => {
            renderWithTheme(<TestCases />);

            const nextButton = screen.getByTestId('button-next');
            fireEvent.click(nextButton);

            expect(mockHandleNext).toHaveBeenCalled();
        });

        it('should have correct props for Back button', () => {
            renderWithTheme(<TestCases />);

            const backButton = screen.getByTestId('button-back');
            expect(backButton.getAttribute('data-type')).toBe('secondary');
            expect(backButton.getAttribute('data-size')).toBe('md');
            expect(backButton.getAttribute('data-height')).toBe('40px');
            expect(backButton.getAttribute('data-width')).toBe('170px');
        });

        it('should have correct props for Next button', () => {
            renderWithTheme(<TestCases />);

            const nextButton = screen.getByTestId('button-next');
            expect(nextButton.getAttribute('data-type')).toBe('secondary');
            expect(nextButton.getAttribute('data-size')).toBe('md');
            expect(nextButton.getAttribute('data-height')).toBe('40px');
            expect(nextButton.getAttribute('data-width')).toBe('170px');
        });
    });

    describe('Canvas Button', () => {
        it('should render canvas button with correct text', () => {
            renderWithTheme(<TestCases />);

            const canvasButton = screen.getByTestId('button-open-test-case-generator');
            expect(canvasButton).toBeInTheDocument();
        });

        it('should call handleCanvas when clicked', () => {
            renderWithTheme(<TestCases />);

            const canvasButton = screen.getByTestId('button-open-test-case-generator');
            fireEvent.click(canvasButton);

            expect(mockHandleCanvas).toHaveBeenCalled();
        });

        it('should have correct props for canvas button', () => {
            renderWithTheme(<TestCases />);

            const canvasButton = screen.getByTestId('button-open-test-case-generator');
            expect(canvasButton.getAttribute('data-type')).toBe('secondary');
            expect(canvasButton.getAttribute('data-size')).toBe('md');
            expect(canvasButton.getAttribute('data-height')).toBe('44px');
            expect(canvasButton.getAttribute('data-width')).toBe('220px');
        });
    });

    describe('Button Interactions', () => {
        it('should call handleBack only once per click', () => {
            renderWithTheme(<TestCases />);

            const backButton = screen.getByTestId('button-back');
            fireEvent.click(backButton);

            expect(mockHandleBack).toHaveBeenCalledTimes(1);
        });

        it('should call handleNext only once per click', () => {
            renderWithTheme(<TestCases />);

            const nextButton = screen.getByTestId('button-next');
            fireEvent.click(nextButton);

            expect(mockHandleNext).toHaveBeenCalledTimes(1);
        });

        it('should call handleCanvas only once per click', () => {
            renderWithTheme(<TestCases />);

            const canvasButton = screen.getByTestId('button-open-test-case-generator');
            fireEvent.click(canvasButton);

            expect(mockHandleCanvas).toHaveBeenCalledTimes(1);
        });

        it('should call handlers multiple times for multiple clicks', () => {
            renderWithTheme(<TestCases />);

            const backButton = screen.getByTestId('button-back');
            fireEvent.click(backButton);
            fireEvent.click(backButton);

            expect(mockHandleBack).toHaveBeenCalledTimes(2);
        });
    });

    describe('Props Handling', () => {
        it('should accept data prop', () => {
            const propsData = { id: '456' };

            expect(() => renderWithTheme(<TestCases data={propsData} />)).not.toThrow();
        });

        it('should work without data prop', () => {
            expect(() => renderWithTheme(<TestCases />)).not.toThrow();
        });

        it('should pass data prop to controller', () => {
            const propsData = { id: '789', rule_name: 'Test' };

            renderWithTheme(<TestCases data={propsData} />);

            expect(mockUseTestCasesController).toHaveBeenCalledWith({ data: propsData });
        });
    });

    describe('Layout Structure', () => {
        it('should have Grid container', () => {
            const { container } = renderWithTheme(<TestCases />);

            expect(container.querySelector('.MuiGrid-container')).toBeInTheDocument();
        });

        it('should display all buttons when not loading', () => {
            renderWithTheme(<TestCases />);

            expect(screen.getByTestId('button-back')).toBeInTheDocument();
            expect(screen.getByTestId('button-next')).toBeInTheDocument();
            expect(screen.getByTestId('button-open-test-case-generator')).toBeInTheDocument();
        });

        it('should display navigation buttons even when loading', () => {
            mockUseTestCasesController.mockReturnValue({
                values: {
                    flowStatus: 'initial',
                    isInitial: true,
                    isPassed: false,
                    isFailed: false,
                    isLoadingFlow: true,
                    statusConfig: mockStatusConfig,
                },
                functions: {
                    handleNext: mockHandleNext,
                    handleBack: mockHandleBack,
                    handleCanvas: mockHandleCanvas,
                },
            });

            renderWithTheme(<TestCases />);

            expect(screen.getByTestId('button-back')).toBeInTheDocument();
            expect(screen.getByTestId('button-next')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle undefined data prop', () => {
            expect(() => renderWithTheme(<TestCases data={undefined} />)).not.toThrow();
        });

        it('should render with minimal controller values', () => {
            mockUseTestCasesController.mockReturnValue({
                values: {
                    flowStatus: 'initial',
                    isInitial: true,
                    isPassed: false,
                    isFailed: false,
                    isLoadingFlow: false,
                    statusConfig: {
                        title: '',
                        description: '',
                        buttonText: 'Test',
                        color: '#000',
                        bgColor: '#FFF',
                        icon: ''
                    },
                },
                functions: {
                    handleNext: jest.fn(),
                    handleBack: jest.fn(),
                    handleCanvas: jest.fn(),
                },
            });

            expect(() => renderWithTheme(<TestCases />)).not.toThrow();
        });
    });

    describe('Component Integration', () => {
        it('should integrate with useTestCasesController', () => {
            renderWithTheme(<TestCases />);

            expect(mockUseTestCasesController).toHaveBeenCalled();
        });

        it('should use values from controller', () => {
            renderWithTheme(<TestCases />);

            expect(screen.getByText(mockStatusConfig.title)).toBeInTheDocument();
            expect(screen.getByText(mockStatusConfig.description)).toBeInTheDocument();
        });

        it('should use functions from controller', () => {
            renderWithTheme(<TestCases />);

            const backButton = screen.getByTestId('button-back');
            fireEvent.click(backButton);

            expect(mockHandleBack).toHaveBeenCalled();
        });
    });

    describe('Component Export', () => {
        it('should export TestCases component as default', () => {
            const TestCasesComponent = require('../../../../src/pages/RuleEditor/TestCases').default;
            expect(TestCasesComponent).toBeDefined();
        });

        it('should be a valid React component', () => {
            const TestCasesComponent = require('../../../../src/pages/RuleEditor/TestCases').default;
            const element = <TestCasesComponent />;
            expect(React.isValidElement(element)).toBe(true);
        });
    });
});
