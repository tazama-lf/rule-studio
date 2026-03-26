import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Node, Edge } from '@xyflow/react';

// --- Module-level mocks ---

const mockUseParams = jest.fn(() => ({ ruleId: 'test-rule-456' }));

jest.mock('react-router-dom', () => ({
    useParams: () => mockUseParams(),
}));

jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: {
        success: jest.fn(),
        error: jest.fn(),
        loading: jest.fn(),
        custom: jest.fn(),
    },
}));

const mockFlowState = {
    jsonModalOpen: false,
    setJsonModalOpen: jest.fn(),
    codeModalOpen: false,
    setCodeModalOpen: jest.fn(),
    jsonOutput: '',
    setJsonOutput: jest.fn(),
    codeOutput: '',
    setCodeOutput: jest.fn(),
    selectedNode: null as Node | null,
    setSelectedNode: jest.fn(),
    sidebarCollapsed: false,
    setSidebarCollapsed: jest.fn(),
    generatedCode: '',
    setGeneratedCode: jest.fn(),
    allNodes: [] as Node[],
    setAllNodes: jest.fn(),
    edges: [] as Edge[],
    setEdges: jest.fn(),
    handleToggleSidebar: jest.fn(),
    handleCloseRightSidebar: jest.fn(),
    handleJsonGenerate: jest.fn(),
    handleCodeGenerate: jest.fn(),
    handleDownload: jest.fn(),
};

jest.mock('../../../src/hooks/RuleBuilder', () => ({
    useFlowState: () => mockFlowState,
}));

jest.mock('../../../src/utils/Common/storage', () => ({
    extractData: jest.fn(() => null),
}));

jest.mock('../../../src/utils/Flow/FlowTransformers', () => ({
    transformApiFlowData: jest.fn(() => ({
        nodes: [],
        edges: [],
    })),
}));

jest.mock('../../../src/utils/Flow/nodeTemplateService', () => ({
    setApiNodes: jest.fn(),
}));

jest.mock('../../../src/utils/Flow/codeValidator', () => ({
    validateTypeScriptCode: jest.fn(() => ({ isValid: true, errors: [] })),
}));

jest.mock('../../../src/utils/Flow/CodeGenerator', () => ({
    generateTestCaseCode: jest.fn(() => 'const x = 1;'),
}));

jest.mock('../../../src/utils/Flow/transformRuleRequest', () => ({
    transformRuleRequestToCode: jest.fn(() => 'const code = {};'),
}));

jest.mock('../../../src/utils/Constants', () => ({
    RESET_TEST_CASE_PAYLOAD: { nodes: [], edges: [] },
}));

const mockUpdateFn = jest.fn(() => ({ unwrap: () => Promise.resolve({ success: true }) }));
jest.mock('../../../src/redux/Api/Rule-builder');

jest.mock('../../../src/redux/Api/Rules', () => ({
    useUpdateMetadataMutation: () => [mockUpdateFn, { isLoading: false }],
}));

jest.mock('../../../src/validation/context', () => ({
    ValidationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useValidationContext: () => ({
        errors: new Map(),
        setNodeErrors: jest.fn(),
        clearNodeErrors: jest.fn(),
        clearAllErrors: jest.fn(),
        hasErrors: false,
        getNodeError: jest.fn(),
        getAllErrors: jest.fn(() => []),
        getErrorCount: jest.fn(() => 0),
    }),
}));

jest.mock('../../../src/components/RuleBuilder/LeftSidebar', () => {
    return function MockLeftSidebar() {
        return <div data-testid="left-sidebar">Left Sidebar</div>;
    };
});

jest.mock('../../../src/components/RuleBuilder/Header', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function MockHeader(props: any) {
        return (
            <div data-testid="header">
                <span data-testid="header-title">{String(props.title || '')}</span>
                {props.hidePlayControls && <span data-testid="hide-play-controls">hidePlayControls</span>}
                {props.onSave && <button data-testid="save-btn" onClick={props.onSave}>Save</button>}
                {props.onReset && <button data-testid="reset-btn" onClick={props.onReset}>Reset</button>}
                {props.onDisplayJson && <button data-testid="display-json-btn" onClick={props.onDisplayJson}>Display JSON</button>}
                {props.onGenerateCode && <button data-testid="generate-code-btn" onClick={props.onGenerateCode}>Generate Code</button>}
                {props.onViewErrors && <button data-testid="view-errors-btn" onClick={props.onViewErrors}>View Errors</button>}
                {props.viewOnly && <span data-testid="view-only-flag">viewOnly</span>}
                {props.isSaving && <span data-testid="is-saving">isSaving</span>}
            </div>
        );
    };
});

jest.mock('../../../src/components/RuleBuilder/Canvas', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function MockCanvas(props: any) {
        return (
            <div data-testid="rule-builder-canvas">
                <span data-testid="canvas-mode">{String(props.mode || '')}</span>
                {props.viewOnly && <span data-testid="canvas-view-only">viewOnly</span>}
            </div>
        );
    };
});

jest.mock('../../../src/components/RuleBuilder/RightSidebar', () => {
    return function MockRightSidebar() {
        return <div data-testid="right-sidebar">Right Sidebar</div>;
    };
});

jest.mock('../../../src/components/RuleBuilder/OutputModal', () => {
    return function MockOutputModal(props: Record<string, unknown>) {
        if (!props.open) return null;
        return (
            <div data-testid={`output-modal-${String(props.language || 'unknown')}`}>
                <span data-testid="output-modal-title">{String(props.title || '')}</span>
            </div>
        );
    };
});

jest.mock('../../../src/components/RuleBuilder/ValidationErrorModal', () => ({
    ValidationErrorModal: function MockValidationErrorModal(props: Record<string, unknown>) {
        if (!props.open) return null;
        return <div data-testid="validation-error-modal">Validation Errors</div>;
    },
}));

// --- Rule-builder API mock overrides ---
// The moduleNameMapper maps '^.*redux/Api/Rule-builder.*$' to the auto-mock file.
// We mutate exports here so we can control return values per test.
const mockGetNodesQueryReturn = {
    data: [{ id: 'node1' }],
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
};

const mockGetFlowQueryReturn = {
    data: {
        result: { flow_json: { nodes: [], edges: [] } },
    },
    isLoading: false,
    error: null,
};

const mockGetGlobalVariablesQueryReturn = {
    data: null,
    isLoading: false,
    error: null,
};

const mockSaveFlowFn = jest.fn(() => ({
    unwrap: () => Promise.resolve({ data: { success: true } }),
}));

const mockUseGetNodesQuery = jest.fn(() => mockGetNodesQueryReturn);
const mockUseGetFlowQuery = jest.fn(() => mockGetFlowQueryReturn);
const mockUseGetGlobalVariablesQuery = jest.fn(() => mockGetGlobalVariablesQueryReturn);
const mockUseSaveFlowMutation = jest.fn(() => [mockSaveFlowFn, { isLoading: false }]);

beforeAll(() => {
    const ruleBuilderMock = require('../../../src/redux/Api/Rule-builder');
    ruleBuilderMock.useGetNodesQuery = mockUseGetNodesQuery;
    ruleBuilderMock.useGetFlowQuery = mockUseGetFlowQuery;
    ruleBuilderMock.useGetGlobalVariablesQuery = mockUseGetGlobalVariablesQuery;
    ruleBuilderMock.useSaveFlowMutation = mockUseSaveFlowMutation;
});

import React from 'react';
import TestCaseGenerateWithValidation from '../../../src/pages/test-case-generate';
import toast from 'react-hot-toast';
import { extractData } from '../../../src/utils/Common/storage';
import { transformApiFlowData } from '../../../src/utils/Flow/FlowTransformers';
import { setApiNodes } from '../../../src/utils/Flow/nodeTemplateService';
import { generateTestCaseCode } from '../../../src/utils/Flow/CodeGenerator';

const mockExtractData = extractData as jest.MockedFunction<typeof extractData>;
const mockTransformApiFlowData = transformApiFlowData as jest.MockedFunction<typeof transformApiFlowData>;
const mockSetApiNodes = setApiNodes as jest.MockedFunction<typeof setApiNodes>;
const mockGenerateTestCaseCode = generateTestCaseCode as jest.MockedFunction<typeof generateTestCaseCode>;

describe('TestCaseGenerateWithValidation (test-case-generate page)', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();

        mockUseGetNodesQuery.mockReturnValue(mockGetNodesQueryReturn);
        mockUseGetFlowQuery.mockReturnValue(mockGetFlowQueryReturn);
        mockUseGetGlobalVariablesQuery.mockReturnValue(mockGetGlobalVariablesQueryReturn);
        mockSaveFlowFn.mockImplementation(() => ({
            unwrap: () => Promise.resolve({ data: { success: true } }),
        }));
        mockUseSaveFlowMutation.mockReturnValue([mockSaveFlowFn, { isLoading: false }]);

        mockTransformApiFlowData.mockReturnValue({
            nodes: [],
            edges: [],
        } as unknown as ReturnType<typeof transformApiFlowData>);

        mockGenerateTestCaseCode.mockReturnValue('const x = 1;');

        mockFlowState.jsonModalOpen = false;
        mockFlowState.codeModalOpen = false;
        mockFlowState.jsonOutput = '';
        mockFlowState.codeOutput = '';
        mockFlowState.selectedNode = null;
        mockFlowState.sidebarCollapsed = false;
        mockFlowState.allNodes = [];
        mockFlowState.edges = [];

        mockExtractData.mockReturnValue(null);
        mockUseParams.mockReturnValue({ ruleId: 'test-rule-456' });

        delete (window as unknown as Record<string, unknown>).generateFlowJson;
        delete (window as unknown as Record<string, unknown>).generateFlowCode;

        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // -------------------------------------------------------
    // Rendering
    // -------------------------------------------------------
    describe('Rendering', () => {
        it('should render the component successfully', () => {
            render(<TestCaseGenerateWithValidation />);
            expect(screen.getByTestId('header')).toBeInTheDocument();
        });

        it('should render the header with title "Test Cases Generation"', () => {
            render(<TestCaseGenerateWithValidation />);
            expect(screen.getByTestId('header-title')).toHaveTextContent('Test Cases Generation');
        });

        it('should pass hidePlayControls to header', () => {
            render(<TestCaseGenerateWithValidation />);
            expect(screen.getByTestId('hide-play-controls')).toBeInTheDocument();
        });

        it('should render with viewOnly prop hiding the left sidebar', () => {
            render(<TestCaseGenerateWithValidation viewOnly />);
            expect(screen.getByTestId('view-only-flag')).toBeInTheDocument();
            expect(screen.queryByTestId('left-sidebar')).not.toBeInTheDocument();
        });

        it('should render left sidebar when not in viewOnly mode', () => {
            render(<TestCaseGenerateWithValidation />);
            expect(screen.getByTestId('left-sidebar')).toBeInTheDocument();
        });

        it('should hide save and reset buttons for static rule id "21"', () => {
            mockUseParams.mockReturnValue({ ruleId: '21' });
            render(<TestCaseGenerateWithValidation />);
            expect(screen.queryByTestId('save-btn')).not.toBeInTheDocument();
            expect(screen.queryByTestId('reset-btn')).not.toBeInTheDocument();
        });

        it('should show save and reset buttons for non-static rule ids', () => {
            render(<TestCaseGenerateWithValidation />);
            expect(screen.getByTestId('save-btn')).toBeInTheDocument();
            expect(screen.getByTestId('reset-btn')).toBeInTheDocument();
        });

        it('should render canvas with mode "test-case-generate"', () => {
            render(<TestCaseGenerateWithValidation />);
            expect(screen.getByTestId('canvas-mode')).toHaveTextContent('test-case-generate');
        });
    });

    // -------------------------------------------------------
    // Loading States
    // -------------------------------------------------------
    describe('Loading States', () => {
        it('should show loading text when nodes are loading', () => {
            mockUseGetNodesQuery.mockReturnValue({
                data: undefined,
                isLoading: true,
                error: null,
                refetch: () => Promise.resolve(),
            } as unknown as typeof mockGetNodesQueryReturn);

            render(<TestCaseGenerateWithValidation />);
            expect(screen.getByText('Loading...')).toBeInTheDocument();
            expect(screen.getByText('Fetching available nodes from server')).toBeInTheDocument();
        });

        it('should show "Setting up canvas..." when nodes loaded but not initialized', () => {
            mockUseGetNodesQuery.mockReturnValue({
                data: null,
                isLoading: false,
                error: null,
                refetch: () => Promise.resolve(),
            } as unknown as typeof mockGetNodesQueryReturn);

            render(<TestCaseGenerateWithValidation />);
            expect(screen.getByText('Setting up canvas...')).toBeInTheDocument();
        });

        it('should show "Preparing canvas..." when apiNodesInitialized but no flow data', () => {
            mockUseGetFlowQuery.mockReturnValue({
                data: null,
                isLoading: false,
                error: null,
            } as unknown as typeof mockGetFlowQueryReturn);

            render(<TestCaseGenerateWithValidation />);
            expect(screen.getByText('Preparing canvas...')).toBeInTheDocument();
        });

        it('should show error state when nodesError is truthy', () => {
            mockUseGetNodesQuery.mockReturnValue({
                data: undefined,
                isLoading: false,
                error: { status: 500, error: 'Server Error' },
                refetch: () => Promise.resolve(),
            } as unknown as typeof mockGetNodesQueryReturn);

            render(<TestCaseGenerateWithValidation />);
            expect(screen.getByText('Error loading test case builder')).toBeInTheDocument();
            expect(screen.getByText('Failed to load node templates')).toBeInTheDocument();
        });
    });

    // -------------------------------------------------------
    // Header Controls
    // -------------------------------------------------------
    describe('Header Controls', () => {
        it('should call window.generateFlowJson when Display JSON is clicked', async () => {
            const mockGenJson = jest.fn(() => '{"nodes":[],"edges":[]}');
            (window as unknown as Record<string, unknown>).generateFlowJson = mockGenJson;

            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('display-json-btn'));
            expect(mockGenJson).toHaveBeenCalled();
        });

        it('should call window.generateFlowCode when Generate Code is clicked', async () => {
            const mockGenCode = jest.fn(() => 'const x = 1;');
            (window as unknown as Record<string, unknown>).generateFlowCode = mockGenCode;

            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('generate-code-btn'));
            expect(mockGenCode).toHaveBeenCalled();
        });

        it('should not throw when window.generateFlowJson is undefined', async () => {
            render(<TestCaseGenerateWithValidation />);
            await expect(user.click(screen.getByTestId('display-json-btn'))).resolves.not.toThrow();
        });

        it('should not throw when window.generateFlowCode is undefined', async () => {
            render(<TestCaseGenerateWithValidation />);
            await expect(user.click(screen.getByTestId('generate-code-btn'))).resolves.not.toThrow();
        });
    });

    // -------------------------------------------------------
    // Validation Error Modal
    // -------------------------------------------------------
    describe('Validation Error Modal', () => {
        it('should not render validation error modal by default', () => {
            render(<TestCaseGenerateWithValidation />);
            expect(screen.queryByTestId('validation-error-modal')).not.toBeInTheDocument();
        });

        it('should show validation error modal when view errors is clicked', async () => {
            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('view-errors-btn'));
            expect(screen.getByTestId('validation-error-modal')).toBeInTheDocument();
        });
    });

    // -------------------------------------------------------
    // Output Modals
    // -------------------------------------------------------
    describe('Output Modals', () => {
        it('should not render JSON output modal when jsonModalOpen is false', () => {
            render(<TestCaseGenerateWithValidation />);
            expect(screen.queryByTestId('output-modal-json')).not.toBeInTheDocument();
        });

        it('should render JSON output modal when jsonModalOpen is true', () => {
            mockFlowState.jsonModalOpen = true;
            render(<TestCaseGenerateWithValidation />);
            expect(screen.getByTestId('output-modal-json')).toBeInTheDocument();
        });

        it('should render JSON modal with correct title', () => {
            mockFlowState.jsonModalOpen = true;
            render(<TestCaseGenerateWithValidation />);
            expect(screen.getByTestId('output-modal-title')).toHaveTextContent('JSON Output');
        });

        it('should not render Code output modal when codeModalOpen is false', () => {
            render(<TestCaseGenerateWithValidation />);
            expect(screen.queryByTestId('output-modal-typescript')).not.toBeInTheDocument();
        });

        it('should render Code output modal when codeModalOpen is true', () => {
            mockFlowState.codeModalOpen = true;
            render(<TestCaseGenerateWithValidation />);
            expect(screen.getByTestId('output-modal-typescript')).toBeInTheDocument();
        });

        it('should render Code modal with correct title', () => {
            mockFlowState.codeModalOpen = true;
            render(<TestCaseGenerateWithValidation />);
            expect(screen.getByTestId('output-modal-title')).toHaveTextContent('Generated Test Code');
        });
    });

    // -------------------------------------------------------
    // Save Flow
    // -------------------------------------------------------
    describe('Save Flow', () => {
        it('should show error toast when ruleId is missing', async () => {
            mockUseParams.mockReturnValue({ ruleId: undefined } as unknown as { ruleId: string });
            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('save-btn'));
            expect(toast.error).toHaveBeenCalledWith('Rule ID not found');
        });

        it('should show error toast when generateFlowJson returns falsy', async () => {
            (window as unknown as Record<string, unknown>).generateFlowJson = jest.fn(() => null);

            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('save-btn'));
            expect(toast.error).toHaveBeenCalledWith('Failed to generate flow data');
        });

        it('should show error toast when generateFlowCode returns falsy', async () => {
            (window as unknown as Record<string, unknown>).generateFlowJson = jest.fn(() => '{"nodes":[],"edges":[]}');
            (window as unknown as Record<string, unknown>).generateFlowCode = jest.fn(() => null);

            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('save-btn'));
            expect(toast.error).toHaveBeenCalledWith('Failed to generate TypeScript code');
        });

        it('should show error toast when flow JSON is invalid', async () => {
            (window as unknown as Record<string, unknown>).generateFlowJson = jest.fn(() => 'invalid-json{');
            (window as unknown as Record<string, unknown>).generateFlowCode = jest.fn(() => 'const x = 1;');

            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('save-btn'));
            expect(toast.error).toHaveBeenCalledWith('Failed to parse flow data: Invalid JSON format');
        });

        it('should call saveFlow with category "test_case_generation" on successful save', async () => {
            (window as unknown as Record<string, unknown>).generateFlowJson = jest.fn(() => '{"nodes":[],"edges":[]}');
            (window as unknown as Record<string, unknown>).generateFlowCode = jest.fn(() => 'const x = 1;');

            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('save-btn'));

            await waitFor(() => {
                expect(mockSaveFlowFn).toHaveBeenCalledWith(
                    expect.objectContaining({
                        ruleId: 'test-rule-456',
                        category: 'test_case_generation',
                        flowData: expect.objectContaining({
                            flow_json: { nodes: [], edges: [] },
                            ts_file_base64: expect.any(String),
                            status: 'pass',
                        }),
                    })
                );
            });
        });

        it('should show save success dialog after successful save', async () => {
            (window as unknown as Record<string, unknown>).generateFlowJson = jest.fn(() => '{"nodes":[],"edges":[]}');
            (window as unknown as Record<string, unknown>).generateFlowCode = jest.fn(() => 'const x = 1;');

            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('save-btn'));

            await waitFor(() => {
                expect(screen.getByText('Test Cases Saved Successfully')).toBeInTheDocument();
            });
        });

        it('should use "fail" status when TypeScript validation fails', async () => {
            const { validateTypeScriptCode } = require('../../../src/utils/Flow/codeValidator');
            (validateTypeScriptCode as jest.Mock).mockReturnValueOnce({ isValid: false, errors: ['error'] });

            (window as unknown as Record<string, unknown>).generateFlowJson = jest.fn(() => '{"nodes":[],"edges":[]}');
            (window as unknown as Record<string, unknown>).generateFlowCode = jest.fn(() => 'const x = 1;');

            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('save-btn'));

            await waitFor(() => {
                expect(mockSaveFlowFn).toHaveBeenCalledWith(
                    expect.objectContaining({
                        flowData: expect.objectContaining({ status: 'fail' }),
                    })
                );
            });
        });

        it('should show error toast when saveFlow rejects with data.message', async () => {
            mockSaveFlowFn.mockImplementation(() => ({
                unwrap: () => Promise.reject({ data: { message: 'Server error occurred' } }),
            }));

            (window as unknown as Record<string, unknown>).generateFlowJson = jest.fn(() => '{"nodes":[],"edges":[]}');
            (window as unknown as Record<string, unknown>).generateFlowCode = jest.fn(() => 'const x = 1;');

            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('save-btn'));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Server error occurred');
            });
        });

        it('should show fallback error toast when saveFlow rejects without data.message', async () => {
            mockSaveFlowFn.mockImplementation(() => ({
                unwrap: () => Promise.reject({}),
            }));

            (window as unknown as Record<string, unknown>).generateFlowJson = jest.fn(() => '{"nodes":[],"edges":[]}');
            (window as unknown as Record<string, unknown>).generateFlowCode = jest.fn(() => 'const x = 1;');

            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('save-btn'));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Failed to save test case');
            });
        });
    });

    // -------------------------------------------------------
    // Save Success Dialog Actions
    // -------------------------------------------------------
    describe('Save Success Dialog', () => {
        const setupSaveSuccess = async () => {
            (window as unknown as Record<string, unknown>).generateFlowJson = jest.fn(() => '{"nodes":[],"edges":[]}');
            (window as unknown as Record<string, unknown>).generateFlowCode = jest.fn(() => 'const x = 1;');

            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('save-btn'));
            await waitFor(() => {
                expect(screen.getByText('Test Cases Saved Successfully')).toBeInTheDocument();
            });
        };

        it('should close dialog when "Stay on Editor" is clicked', async () => {
            await setupSaveSuccess();
            await user.click(screen.getByText('Stay on Editor'));

            await waitFor(() => {
                expect(screen.queryByText('Test Cases Saved Successfully')).not.toBeInTheDocument();
            });
        });

        it('should close dialog and call setCodeModalOpen(false) when "Proceed to Next Step" is clicked', async () => {
            await setupSaveSuccess();
            await user.click(screen.getByText('Proceed to Next Step'));

            await waitFor(() => {
                expect(screen.queryByText('Test Cases Saved Successfully')).not.toBeInTheDocument();
            });
            expect(mockFlowState.setCodeModalOpen).toHaveBeenCalledWith(false);
        });
    });

    // -------------------------------------------------------
    // Reset Flow
    // -------------------------------------------------------
    describe('Reset Flow', () => {
        it('should open reset confirmation dialog when reset button is clicked', async () => {
            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('reset-btn'));

            expect(screen.getByText('Reset Test Case Flow Confirmation')).toBeInTheDocument();
            expect(screen.getByText('Are you sure? All changes will be lost and the test case flow will be reset to the default template.')).toBeInTheDocument();
        });

        it('should close reset dialog when Cancel is clicked', async () => {
            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('reset-btn'));
            await user.click(screen.getByText('Cancel'));

            await waitFor(() => {
                expect(screen.queryByText('Reset Test Case Flow Confirmation')).not.toBeInTheDocument();
            });
        });

        it('should show error toast when ruleId is missing during reset', async () => {
            mockUseParams.mockReturnValue({ ruleId: undefined } as unknown as { ruleId: string });
            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('reset-btn'));
            await user.click(screen.getByText('Yes, Reset'));

            expect(toast.error).toHaveBeenCalledWith('Rule ID not found');
        });

        it('should call saveFlow with category "test_case_generation" when reset is confirmed', async () => {
            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('reset-btn'));
            await user.click(screen.getByText('Yes, Reset'));

            await waitFor(() => {
                expect(mockSaveFlowFn).toHaveBeenCalledWith(
                    expect.objectContaining({
                        ruleId: 'test-rule-456',
                        category: 'test_case_generation',
                    })
                );
            });
        });

        it('should show success toast after successful reset', async () => {
            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('reset-btn'));
            await user.click(screen.getByText('Yes, Reset'));

            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith('Test case flow reset to default template successfully');
            });
        });

        it('should show error toast when reset saveFlow rejects with Error instance', async () => {
            mockSaveFlowFn.mockImplementation(() => ({
                unwrap: () => Promise.reject(new Error('Reset failed')),
            }));

            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('reset-btn'));
            await user.click(screen.getByText('Yes, Reset'));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Reset failed');
            });
        });

        it('should show fallback error toast when reset fails with non-Error value', async () => {
            mockSaveFlowFn.mockImplementation(() => ({
                unwrap: () => Promise.reject({ code: 500 }),
            }));

            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('reset-btn'));
            await user.click(screen.getByText('Yes, Reset'));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Failed to reset test case flow');
            });
        });

        it('should show error toast when generateTestCaseCode returns falsy during reset', async () => {
            mockGenerateTestCaseCode.mockReturnValueOnce('');

            render(<TestCaseGenerateWithValidation />);
            await user.click(screen.getByTestId('reset-btn'));
            await user.click(screen.getByText('Yes, Reset'));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Failed to generate TypeScript code');
            });
        });
    });

    // -------------------------------------------------------
    // Global Variables Enrichment
    // -------------------------------------------------------
    describe('Global Variables Enrichment', () => {
        it('should enrich RuleConfigFactory nodes with global RuleConfig data', () => {
            mockUseGetGlobalVariablesQuery.mockReturnValue({
                data: { RuleConfig: { threshold: 100 } },
                isLoading: false,
                error: null,
            } as unknown as typeof mockGetGlobalVariablesQueryReturn);

            const ruleConfigNode = {
                id: 'rcf-1',
                position: { x: 0, y: 0 },
                data: { nodeType: 'RuleConfigFactory', label: 'Config', params: {} },
            } as Node;

            mockTransformApiFlowData.mockReturnValue({
                nodes: [ruleConfigNode],
                edges: [],
            } as unknown as ReturnType<typeof transformApiFlowData>);

            expect(() => render(<TestCaseGenerateWithValidation />)).not.toThrow();
        });

        it('should enrich RuleRequestFactory nodes with global RuleRequest data', () => {
            mockUseGetGlobalVariablesQuery.mockReturnValue({
                data: { RuleRequest: { transaction: {}, networkMap: {}, DataCache: {} } },
                isLoading: false,
                error: null,
            } as unknown as typeof mockGetGlobalVariablesQueryReturn);

            const ruleRequestNode = {
                id: 'rrf-1',
                position: { x: 0, y: 0 },
                data: { nodeType: 'RuleRequestFactory', label: 'Request', params: {} },
            } as Node;

            mockTransformApiFlowData.mockReturnValue({
                nodes: [ruleRequestNode],
                edges: [],
            } as unknown as ReturnType<typeof transformApiFlowData>);

            expect(() => render(<TestCaseGenerateWithValidation />)).not.toThrow();
        });

        it('should not crash when globalVariablesData is null', () => {
            mockUseGetGlobalVariablesQuery.mockReturnValue({
                data: null,
                isLoading: false,
                error: null,
            });

            expect(() => render(<TestCaseGenerateWithValidation />)).not.toThrow();
        });
    });

    // -------------------------------------------------------
    // API Nodes Initialization
    // -------------------------------------------------------
    describe('API Nodes Initialization', () => {
        it('should call setApiNodes when nodes data is available', () => {
            const nodesData = [{ id: 'node1', type: 'CustomFunction' }];
            mockUseGetNodesQuery.mockReturnValue({
                data: nodesData,
                isLoading: false,
                error: null,
                refetch: () => Promise.resolve(),
            } as unknown as typeof mockGetNodesQueryReturn);

            render(<TestCaseGenerateWithValidation />);
            expect(mockSetApiNodes).toHaveBeenCalledWith(nodesData);
        });

        it('should not call setApiNodes when nodes data is undefined', () => {
            mockUseGetNodesQuery.mockReturnValue({
                data: undefined,
                isLoading: false,
                error: null,
                refetch: () => Promise.resolve(),
            } as unknown as typeof mockGetNodesQueryReturn);

            render(<TestCaseGenerateWithValidation />);
            expect(mockSetApiNodes).not.toHaveBeenCalled();
        });

        it('should pass "test_case_generation" as type to useGetNodesQuery', () => {
            render(<TestCaseGenerateWithValidation />);
            expect(mockUseGetNodesQuery).toHaveBeenCalledWith('test_case_generation');
        });
    });

    // -------------------------------------------------------
    // Back URL
    // -------------------------------------------------------
    describe('Back URL', () => {
        it('should read mode from LocalStorage via extractData', () => {
            render(<TestCaseGenerateWithValidation />);
            expect(mockExtractData).toHaveBeenCalledWith('mode', 'LocalStorage');
        });

        it('should render without error in view mode', () => {
            mockExtractData.mockReturnValue('view');
            expect(() => render(<TestCaseGenerateWithValidation />)).not.toThrow();
        });
    });

    // -------------------------------------------------------
    // Edge Cases
    // -------------------------------------------------------
    describe('Edge Cases', () => {
        it('should handle undefined ruleId gracefully', () => {
            mockUseParams.mockReturnValue({ ruleId: undefined } as unknown as { ruleId: string });
            expect(() => render(<TestCaseGenerateWithValidation />)).not.toThrow();
        });

        it('should render the canvas when data is fully loaded', async () => {
            render(<TestCaseGenerateWithValidation />);
            expect(await screen.findByTestId('rule-builder-canvas')).toBeInTheDocument();
        });

        it('should render canvas in viewOnly mode without left sidebar', () => {
            render(<TestCaseGenerateWithValidation viewOnly />);
            expect(screen.getByTestId('rule-builder-canvas')).toBeInTheDocument();
            expect(screen.queryByTestId('left-sidebar')).not.toBeInTheDocument();
        });

        it('should render right sidebar alongside canvas', () => {
            render(<TestCaseGenerateWithValidation />);
            expect(screen.getByTestId('right-sidebar')).toBeInTheDocument();
        });

        it('should skip useGetGlobalVariablesQuery when ruleId is undefined', () => {
            mockUseParams.mockReturnValue({ ruleId: undefined } as unknown as { ruleId: string });
            render(<TestCaseGenerateWithValidation />);
            // Query is skipped due to !ruleId — no crash expected
            expect(mockUseGetGlobalVariablesQuery).toHaveBeenCalledWith(
                '',
                expect.objectContaining({ skip: true })
            );
        });
    });
});
