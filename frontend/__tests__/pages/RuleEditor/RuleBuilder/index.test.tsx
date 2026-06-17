import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('../../../../src/pages/RuleEditor/RuleBuilder/useRuleBuilderController', () => ({
    __esModule: true,
    default: jest.fn(),
}));
jest.mock('../../../../src/utils/Common/storage', () => ({
    extractData: jest.fn(),
}));

const RuleBuilder = require('../../../../src/pages/RuleEditor/RuleBuilder').default as typeof import('../../../../src/pages/RuleEditor/RuleBuilder').default;
const useRuleBuilderController = require('../../../../src/pages/RuleEditor/RuleBuilder/useRuleBuilderController').default as typeof import('../../../../src/pages/RuleEditor/RuleBuilder/useRuleBuilderController').default;

const mockUseRuleBuilderController = useRuleBuilderController as jest.MockedFunction<typeof useRuleBuilderController>;

describe('RuleBuilder Component', () => {
    const mockHandleBuilder = jest.fn();
    const mockHandleNext = jest.fn();
    const mockHandleBack = jest.fn();

    const defaultMockReturn = {
        values: {
            flowStatus: 'initial',
            isInitial: true,
            isPassed: false,
            isFailed: false,
            isLoadingFlow: false,
            statusConfig: {
                title: 'Rule Not Created Yet',
                description: 'Your rule is in initial mode. Click the button below to start building your rule.',
                buttonText: 'Open Rule Builder',
                color: '#FFA726',
                bgColor: '#FFF3E0',
                icon: '🔧'
            }
        },
        functions: {
            handleBuilder: mockHandleBuilder,
            handleNext: mockHandleNext,
            handleBack: mockHandleBack
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseRuleBuilderController.mockReturnValue(defaultMockReturn);
    });

    describe('Component Rendering', () => {
        it('should render the component successfully', () => {
            render(<RuleBuilder data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Rule Builder')).toBeInTheDocument();
            expect(screen.getByText('Create and manage your rule flow')).toBeInTheDocument();
        });

        it('should pass props to the hook', () => {
            const props = { data: { id: 'rule-123', status: 'ACTIVE' } };
            render(<RuleBuilder {...props} />);

            expect(mockUseRuleBuilderController).toHaveBeenCalledWith(props);
        });

        it('should render without props', () => {
            render(<RuleBuilder />);

            expect(mockUseRuleBuilderController).toHaveBeenCalledWith({});
        });
    });

    describe('Loading State', () => {
        it('should display loading spinner when isLoadingFlow is true', () => {
            mockUseRuleBuilderController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    isLoadingFlow: true
                }
            });

            render(<RuleBuilder data={{ id: 'rule-123' }} />);

            expect(screen.getByRole('progressbar')).toBeInTheDocument();
            expect(screen.queryByText(defaultMockReturn.values.statusConfig.title)).not.toBeInTheDocument();
        });

        it('should not display status content when loading', () => {
            mockUseRuleBuilderController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    isLoadingFlow: true
                }
            });

            render(<RuleBuilder data={{ id: 'rule-123' }} />);

            expect(screen.queryByText('Open Rule Builder')).not.toBeInTheDocument();
        });
    });

    describe('Status Display', () => {
        it('should display status config when not loading', () => {
            render(<RuleBuilder data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Rule Not Created Yet')).toBeInTheDocument();
            expect(screen.getByText('Your rule is in initial mode. Click the button below to start building your rule.')).toBeInTheDocument();
            expect(screen.getByText('Open Rule Builder')).toBeInTheDocument();
            expect(screen.getByText('🔧')).toBeInTheDocument();
        });

        it('should display pass status config', () => {
            mockUseRuleBuilderController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    flowStatus: 'pass',
                    isPassed: true,
                    isInitial: false,
                    statusConfig: {
                        title: 'Rule Validated Successfully',
                        description: 'Your rule has been validated and is ready to use. You can edit it anytime.',
                        buttonText: 'View Rule',
                        color: '#66BB6A',
                        bgColor: '#E8F5E9',
                        icon: '✅'
                    }
                }
            });

            render(<RuleBuilder data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Rule Validated Successfully')).toBeInTheDocument();
            expect(screen.getByText('Your rule has been validated and is ready to use. You can edit it anytime.')).toBeInTheDocument();
            expect(screen.getByText('View Rule')).toBeInTheDocument();
            expect(screen.getByText('✅')).toBeInTheDocument();
        });

        it('should display fail status config', () => {
            mockUseRuleBuilderController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    flowStatus: 'fail',
                    isFailed: true,
                    isInitial: false,
                    statusConfig: {
                        title: 'Validation Failed',
                        description: 'Your rule contains errors and needs to be fixed. Click below to review and correct the issues.',
                        buttonText: 'Edit Rule',
                        color: '#EF5350',
                        bgColor: '#FFEBEE',
                        icon: '⚠️'
                    }
                }
            });

            render(<RuleBuilder data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Validation Failed')).toBeInTheDocument();
            expect(screen.getByText('Your rule contains errors and needs to be fixed. Click below to review and correct the issues.')).toBeInTheDocument();
            expect(screen.getByText('Edit Rule')).toBeInTheDocument();
            expect(screen.getByText('⚠️')).toBeInTheDocument();
        });

        it('should display icon from status config', () => {
            render(<RuleBuilder data={{ id: 'rule-123' }} />);

            const icon = screen.getByText('🔧');
            expect(icon).toBeInTheDocument();
        });
    });

    describe('Button Interactions', () => {
        it('should call handleBuilder when status button is clicked', async () => {
            const user = userEvent.setup();
            render(<RuleBuilder data={{ id: 'rule-123' }} />);

            const button = screen.getByText('Open Rule Builder');
            await user.click(button);

            expect(mockHandleBuilder).toHaveBeenCalledTimes(1);
        });

        it('should call handleBack when Back button is clicked', async () => {
            const user = userEvent.setup();
            render(<RuleBuilder data={{ id: 'rule-123' }} />);

            const backButton = screen.getByText('Back');
            await user.click(backButton);

            expect(mockHandleBack).toHaveBeenCalledTimes(1);
        });

        it('should call handleNext when Next button is clicked', async () => {
            const user = userEvent.setup();
            render(<RuleBuilder data={{ id: 'rule-123' }} />);

            const nextButton = screen.getByText('Next');
            await user.click(nextButton);

            expect(mockHandleNext).toHaveBeenCalledTimes(1);
        });

        it('should render Back and Next buttons at all times', () => {
            render(<RuleBuilder data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Back')).toBeInTheDocument();
            expect(screen.getByText('Next')).toBeInTheDocument();
        });

        it('should render navigation buttons even when loading', () => {
            mockUseRuleBuilderController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    isLoadingFlow: true
                }
            });

            render(<RuleBuilder data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Back')).toBeInTheDocument();
            expect(screen.getByText('Next')).toBeInTheDocument();
        });
    });

    describe('Status Config Properties', () => {
        it('should render title from status config', () => {
            render(<RuleBuilder data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Rule Not Created Yet')).toBeInTheDocument();
        });

        it('should render description from status config', () => {
            render(<RuleBuilder data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Your rule is in initial mode. Click the button below to start building your rule.')).toBeInTheDocument();
        });

        it('should render button text from status config', () => {
            render(<RuleBuilder data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Open Rule Builder')).toBeInTheDocument();
        });

        it('should update button text based on status config', () => {
            const { rerender } = render(<RuleBuilder data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Open Rule Builder')).toBeInTheDocument();

            mockUseRuleBuilderController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    statusConfig: {
                        ...defaultMockReturn.values.statusConfig,
                        buttonText: 'View Rule'
                    }
                }
            });

            rerender(<RuleBuilder data={{ id: 'rule-123' }} />);

            expect(screen.getByText('View Rule')).toBeInTheDocument();
            expect(screen.queryByText('Open Rule Builder')).not.toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle undefined data prop', () => {
            render(<RuleBuilder data={undefined} />);

            expect(screen.getByText('Rule Builder')).toBeInTheDocument();
        });

        it('should handle empty status config values', () => {
            mockUseRuleBuilderController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    statusConfig: {
                        title: '',
                        description: '',
                        buttonText: '',
                        color: '#FFA726',
                        bgColor: '#FFF3E0',
                        icon: ''
                    }
                }
            });

            render(<RuleBuilder data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Rule Builder')).toBeInTheDocument();
        });

        it('should not crash when functions are called multiple times', async () => {
            const user = userEvent.setup();
            render(<RuleBuilder data={{ id: 'rule-123' }} />);

            const nextButton = screen.getByText('Next');
            await user.click(nextButton);
            await user.click(nextButton);

            expect(mockHandleNext).toHaveBeenCalledTimes(2);
        });
    });
});
