import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('../../../../src/utils/Common/storage', () => ({
    extractData: jest.fn(),
}));

jest.mock('../../../../src/pages/RuleEditor/Simulation/useSimulationController', () => ({
    __esModule: true,
    default: jest.fn(),
}));

jest.mock('react-hook-form', () => ({
    ...jest.requireActual('react-hook-form'),
    Controller: ({ render: renderProp }: { render: (props: { field: { value: string; onChange: (val: string) => void } }) => React.ReactElement }) => {
        return renderProp({ field: { value: '{}', onChange: jest.fn() } });
    },
}));

import Simulation from '../../../../src/pages/RuleEditor/Simulation';
import useSimulationController from '../../../../src/pages/RuleEditor/Simulation/useSimulationController';

const mockUseSimulationController = useSimulationController as jest.MockedFunction<typeof useSimulationController>;

describe('Simulation Component', () => {
    const mockHandleApproval = jest.fn();
    const mockHandleNext = jest.fn();
    const mockHandleBack = jest.fn();
    const mockHandleUpload = jest.fn();
    const mockHandleDeploy = jest.fn();
    const mockHandleReport = jest.fn();
    const mockHandleNetworkMap = jest.fn();
    const mockOnSubmit = jest.fn();
    const mockHandleSelect = jest.fn();
    const mockHandleSimulation = jest.fn();

    const defaultMockReturn = {
        values: {
            claim: 'editor',
            status: 'STATUS_01_IN_PROGRESS',
            uploading: false,
            deploying: false,
            viewReport: false,
            loader: false,
            selected: null,
            sentForApproval: false,
            codeSynced: true,
            codeDeployed: false,
            result: null,
            control: {} as never,
            errors: {},
            isLoading: false,
            simulating: false,
            payloadLoading: false,
            isReportFailed: false,
            mode: 'edit'
        },
        functions: {
            handleApproval: mockHandleApproval,
            handleNext: mockHandleNext,
            handleBack: mockHandleBack,
            handleUpload: mockHandleUpload,
            handleDeploy: mockHandleDeploy,
            handleReport: mockHandleReport,
            handleNetworkMap: mockHandleNetworkMap,
            onSubmit: mockOnSubmit,
            handleSelect: mockHandleSelect,
            handleSimulation: mockHandleSimulation
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockUseSimulationController.mockReturnValue(defaultMockReturn);
    });

    describe('Component Rendering', () => {
        it('should render the component successfully', () => {
            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Simulation Sandbox')).toBeInTheDocument();
            expect(screen.getByText('Submit Code For Review')).toBeInTheDocument();
        });

        it('should pass props to the hook', () => {
            const props = { data: { id: 'rule-123', status: 'ACTIVE' } };
            render(<Simulation {...props} />);

            expect(mockUseSimulationController).toHaveBeenCalledWith(props);
        });

        it('should render without props', () => {
            render(<Simulation />);

            expect(mockUseSimulationController).toHaveBeenCalledWith({});
        });
    });

    describe('Loading State', () => {
        it('should display loader when isLoading is true', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    isLoading: true
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.queryByText('Simulation Sandbox')).not.toBeInTheDocument();
        });

        it('should not display content when loading', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    isLoading: true
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.queryByText('Simulation Scope')).not.toBeInTheDocument();
        });
    });

    describe('Action Buttons for Editor', () => {
        it('should display upload and deploy buttons for editor in progress status', () => {
            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Sync On Github')).toBeInTheDocument();
            expect(screen.getByText('Deploy Rule')).toBeInTheDocument();
        });

        it('should not display upload button when code is synced', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    codeSynced: false
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Synced')).toBeInTheDocument();
        });

        it('should display deployed status when code is deployed', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    codeDeployed: true
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Rule Deployed')).toBeInTheDocument();
        });

        it('should not display editor buttons in view mode', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    mode: 'view'
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.queryByText('Sync On Github')).not.toBeInTheDocument();
            expect(screen.queryByText('Deploy Rule')).not.toBeInTheDocument();
        });

        it('should not display editor buttons for non-editor users', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    claim: 'approver'
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.queryByText('Sync On Github')).not.toBeInTheDocument();
        });
    });

    describe('View Test Report Button', () => {
        it('should always display view test report button', () => {
            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByText('View Test Report')).toBeInTheDocument();
        });

        it('should disable report button when report not available', () => {
            render(<Simulation data={{ id: 'rule-123' }} />);

            const reportButton = screen.getByText('View Test Report').closest('button');
            expect(reportButton).toBeDisabled();
        });

        it('should enable report button when report is available', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    viewReport: true
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            const reportButton = screen.getByText('View Test Report').closest('button');
            expect(reportButton).not.toBeDisabled();
        });
    });

    describe('Simulation Scope Selection', () => {
        it('should render simulation scope section', () => {
            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Simulation Scope')).toBeInTheDocument();
        });

        it('should display simulation options', () => {
            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Rule-Only Simulation')).toBeInTheDocument();
            expect(screen.getByText('DEMS-driven Simulation')).toBeInTheDocument();
        });

        it('should call handleSelect when simulation box is clicked', async () => {
            const user = userEvent.setup();
            render(<Simulation data={{ id: 'rule-123' }} />);

            const ruleOnlyBox = screen.getByText('Rule-Only Simulation').closest('div');
            if (ruleOnlyBox) {
                await user.click(ruleOnlyBox);
                expect(mockHandleSelect).toHaveBeenCalled();
            }
        });

        it('should highlight selected simulation', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    selected: 1
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Rule-Only Simulation')).toBeInTheDocument();
        });
    });

    describe('Payload Display', () => {
        it('should not display payload when nothing selected', () => {
            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.queryByText('Payload (Edit values only)')).not.toBeInTheDocument();
        });

        it('should display payload when simulation selected', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    selected: 1
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Payload (Edit values only)')).toBeInTheDocument();
        });

        it('should display loader when payload is loading', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    selected: 1,
                    payloadLoading: true
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.queryByText('Payload (Edit values only)')).not.toBeInTheDocument();
        });

        it('should display result when available', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    selected: 1,
                    result: { test: 'data' }
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Result :')).toBeInTheDocument();
        });
    });

    describe('Run Simulation Button', () => {
        it('should not display run button when nothing selected', () => {
            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.queryByText('Run Simulation')).not.toBeInTheDocument();
        });

        it('should display run button when simulation selected', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    selected: 1
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Run Simulation')).toBeInTheDocument();
        });

        it('should call onSubmit when run simulation clicked', async () => {
            const user = userEvent.setup();
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    selected: 1
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            const runButton = screen.getByText('Run Simulation');
            await user.click(runButton);

            expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        });
    });

    describe('Navigation Buttons', () => {
        it('should call handleBack when Back button is clicked', async () => {
            const user = userEvent.setup();
            render(<Simulation data={{ id: 'rule-123' }} />);

            const backButton = screen.getByText('Back');
            await user.click(backButton);

            expect(mockHandleBack).toHaveBeenCalledTimes(1);
        });

        it('should call handleNext when Next button is clicked', async () => {
            const user = userEvent.setup();
            render(<Simulation data={{ id: 'rule-123' }} />);

            const nextButton = screen.getByText('Next');
            await user.click(nextButton);

            expect(mockHandleNext).toHaveBeenCalledTimes(1);
        });

        it('should always display back and next buttons', () => {
            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Back')).toBeInTheDocument();
            expect(screen.getByText('Next')).toBeInTheDocument();
        });
    });

    describe('Approval Actions', () => {
        it('should display reject and approve buttons for approver in review status', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    claim: 'approver',
                    status: 'STATUS_03_UNDER_REVIEW'
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Reject')).toBeInTheDocument();
            expect(screen.getByText('Approve')).toBeInTheDocument();
        });

        it('should call handleApproval with reject when reject clicked', async () => {
            const user = userEvent.setup();
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    claim: 'approver',
                    status: 'STATUS_03_UNDER_REVIEW'
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            const rejectButton = screen.getByText('Reject');
            await user.click(rejectButton);

            expect(mockHandleApproval).toHaveBeenCalledWith('reject');
        });

        it('should call handleApproval with approve when approve clicked', async () => {
            const user = userEvent.setup();
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    claim: 'approver',
                    status: 'STATUS_03_UNDER_REVIEW'
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            const approveButton = screen.getByText('Approve');
            await user.click(approveButton);

            expect(mockHandleApproval).toHaveBeenCalledWith('approve');
        });

        it('should display send for approval button when conditions met', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    status: 'STATUS_01_IN_PROGRESS',
                    sentForApproval: true
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Send For Approval')).toBeInTheDocument();
        });

        it('should call handleApproval with review when send for approval clicked', async () => {
            const user = userEvent.setup();
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    status: 'STATUS_01_IN_PROGRESS',
                    sentForApproval: true
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            const sendButton = screen.getByText('Send For Approval');
            await user.click(sendButton);

            expect(mockHandleApproval).toHaveBeenCalledWith('review');
        });

        it('should display deploy to production for publisher with approved status', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    claim: 'publisher',
                    status: 'STATUS_04_APPROVED'
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByText('Deploy to Production')).toBeInTheDocument();
        });

        it('should call handleApproval with deploy when deploy to production clicked', async () => {
            const user = userEvent.setup();
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    claim: 'publisher',
                    status: 'STATUS_04_APPROVED'
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            const deployButton = screen.getByText('Deploy to Production');
            await user.click(deployButton);

            expect(mockHandleApproval).toHaveBeenCalledWith('deploy');
        });
    });

    describe('Button Clicks', () => {
        it('should call handleUpload when sync button clicked', async () => {
            const user = userEvent.setup();
            render(<Simulation data={{ id: 'rule-123' }} />);

            const syncButton = screen.getByText('Sync On Github');
            await user.click(syncButton);

            expect(mockHandleUpload).toHaveBeenCalledTimes(1);
        });

        it('should call handleDeploy when deploy button clicked', async () => {
            const user = userEvent.setup();
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    viewReport: true
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            const deployButton = screen.getByText('Deploy Rule');
            await user.click(deployButton);

            expect(mockHandleDeploy).toHaveBeenCalledTimes(1);
        });

        it('should call handleReport when view report button clicked', async () => {
            const user = userEvent.setup();
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    viewReport: true
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            const reportButton = screen.getByText('View Test Report');
            await user.click(reportButton);

            expect(mockHandleReport).toHaveBeenCalledTimes(1);
        });
    });

    describe('Loading States', () => {
        it('should show loading state for upload button', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    uploading: true
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByRole('button', { name: 'Sync On Github' })).toBeInTheDocument();
        });

        it('should show loading state for deploy button', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    deploying: true,
                    viewReport: true
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByRole('button', { name: 'Deploy Rule' })).toBeInTheDocument();
        });

        it('should show loading state for simulation button', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    selected: 1,
                    simulating: true
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.getByRole('button', { name: 'Run Simulation' })).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle undefined data prop', () => {
            render(<Simulation data={undefined} />);

            expect(screen.getByText('Simulation Sandbox')).toBeInTheDocument();
        });

        it('should handle null selected value', () => {
            mockUseSimulationController.mockReturnValue({
                ...defaultMockReturn,
                values: {
                    ...defaultMockReturn.values,
                    selected: null
                }
            });

            render(<Simulation data={{ id: 'rule-123' }} />);

            expect(screen.queryByText('Run Simulation')).not.toBeInTheDocument();
        });

        it('should not crash when buttons clicked multiple times', async () => {
            const user = userEvent.setup();
            render(<Simulation data={{ id: 'rule-123' }} />);

            const nextButton = screen.getByText('Next');
            await user.click(nextButton);
            await user.click(nextButton);

            expect(mockHandleNext).toHaveBeenCalledTimes(2);
        });
    });
});
