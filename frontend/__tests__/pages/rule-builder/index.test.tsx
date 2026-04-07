import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Node, Edge } from '@xyflow/react';

// --- Module-level mocks ---

const mockUseParams = jest.fn(() => ({ id: 'test-rule-123' }));
const mockSearchParams = new URLSearchParams();
const mockUseSearchParams = jest.fn(() => [mockSearchParams]);

jest.mock('react-router-dom', () => ({
    useParams: () => mockUseParams(),
    useSearchParams: () => mockUseSearchParams(),
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

const mockOpen = jest.fn();
const mockClose = jest.fn();
jest.mock('../../../src/contexts/ModalContext', () => ({
    useModal: () => ({ open: mockOpen, close: mockClose }),
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
    debugVariables: {},
    setDebugVariables: jest.fn(),
    debugLogs: [] as unknown[],
    setDebugLogs: jest.fn(),
    currentAnimationNode: undefined as string | undefined,
    setCurrentAnimationNode: jest.fn(),
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

const mockNestedCanvasManager = {
    activeNestedCanvas: null as string | null,
    setActiveNestedCanvas: jest.fn(),
    activeNestedCanvasLabel: '',
    setActiveNestedCanvasLabel: jest.fn(),
    nestedCanvasData: {} as Record<string, { nodes: Node[]; edges: Edge[] }>,
    setNestedCanvasData: jest.fn(),
    handleNestedCanvasBack: jest.fn(),
    handleNestedCanvasSave: jest.fn(),
    openNestedCanvas: jest.fn(),
    isTransitioning: false,
};

const mockFlowAnimation = {
    playFlowAnimation: jest.fn(),
    stopAnimation: jest.fn(),
    pauseAnimation: jest.fn(),
    resumeAnimation: jest.fn(),
    updateFlowState: jest.fn(),
    animationTimeoutRef: { current: null },
};

jest.mock('../../../src/hooks/RuleBuilder', () => ({
    useFlowState: () => mockFlowState,
    useFlowAnimation: () => mockFlowAnimation,
    useNestedCanvasManager: () => mockNestedCanvasManager,
}));

jest.mock('../../../src/utils/Common/storage', () => ({
    extractData: jest.fn(() => null),
}));

jest.mock('../../../src/utils/Flow/FlowTransformers', () => ({
    transformApiFlowData: jest.fn(() => ({
        nodes: [],
        edges: [],
        nestedFlows: {},
    })),
}));

jest.mock('../../../src/utils/Flow/nodeTemplateService', () => ({
    setApiNodes: jest.fn(),
}));

jest.mock('../../../src/utils/Flow/codeValidator', () => ({
    validateTypeScriptCode: jest.fn(() => ({ isValid: true, errors: [] })),
}));

jest.mock('../../../src/utils/Flow/CodeGenerator', () => ({
    generateTypeScriptCode: jest.fn(() => 'const x = 1;'),
}));

jest.mock('../../../src/utils/Constants', () => ({
    RESET_FLOW_PAYLOAD: { nodes: [], edges: [] },
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
                {props.onSave && <button data-testid="save-btn" onClick={props.onSave}>Save</button>}
                {props.onReset && <button data-testid="reset-btn" onClick={props.onReset}>Reset</button>}
                {props.onPlayClick && <button data-testid="play-btn" onClick={props.onPlayClick}>Play</button>}
                {props.onPauseClick && <button data-testid="pause-btn" onClick={props.onPauseClick}>Pause</button>}
                {props.onResumeClick && <button data-testid="resume-btn" onClick={props.onResumeClick}>Resume</button>}
                {props.onStopClick && <button data-testid="stop-btn" onClick={props.onStopClick}>Stop</button>}
                {props.onDisplayJson && <button data-testid="display-json-btn" onClick={props.onDisplayJson}>Display JSON</button>}
                {props.onGenerateCode && <button data-testid="generate-code-btn" onClick={props.onGenerateCode}>Generate Code</button>}
                {props.onViewErrors && <button data-testid="view-errors-btn" onClick={props.onViewErrors}>View Errors</button>}
                {props.viewOnly && <span data-testid="view-only-flag">viewOnly</span>}
            </div>
        );
    };
});

jest.mock('../../../src/components/RuleBuilder/Canvas', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function MockCanvas(props: any) {
        return (
            <div data-testid="rule-builder-canvas">
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

jest.mock('../../../src/components/RuleBuilder/NestedCanvas', () => {
    return function MockNestedCanvas(props: Record<string, unknown>) {
        return (
            <div data-testid="nested-canvas">
                <span data-testid="nested-canvas-label">{String(props.nodeLabel || '')}</span>
            </div>
        );
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

// The auto-mock in __mocks__/redux/Api/Rule-builder provides plain functions.
// We wrap them with jest.fn() here so we can call .mockReturnValue() per test.
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

const mockSaveFlowFn = jest.fn(() => ({
    unwrap: () => Promise.resolve({ data: { success: true } }),
}));

const mockUseGetNodesQuery = jest.fn(() => mockGetNodesQueryReturn);
const mockUseGetFlowQuery = jest.fn(() => mockGetFlowQueryReturn);
const mockUseSaveFlowMutation = jest.fn(() => [mockSaveFlowFn, { isLoading: false }]);

// Override the auto-mock hooks via require mutation in beforeAll.
// jest.mock() (above) loads the adjacent __mocks__ file; we then
// replace specific exports with jest.fn() spies at runtime.
beforeAll(() => {
    const ruleBuilderMock = require('../../../src/redux/Api/Rule-builder');
    ruleBuilderMock.useGetNodesQuery = mockUseGetNodesQuery;
    ruleBuilderMock.useGetFlowQuery = mockUseGetFlowQuery;
    ruleBuilderMock.useSaveFlowMutation = mockUseSaveFlowMutation;
});

import React from 'react';
import RuleBuilderWithValidation from '../../../src/pages/rule-builder';
import toast from 'react-hot-toast';
import { extractData } from '../../../src/utils/Common/storage';
import { transformApiFlowData } from '../../../src/utils/Flow/FlowTransformers';
import { setApiNodes } from '../../../src/utils/Flow/nodeTemplateService';

const mockExtractData = extractData as jest.MockedFunction<typeof extractData>;
const mockTransformApiFlowData = transformApiFlowData as jest.MockedFunction<typeof transformApiFlowData>;
const mockSetApiNodes = setApiNodes as jest.MockedFunction<typeof setApiNodes>;

describe('RuleBuilderWithValidation (rule-builder page)', () => {
    const user = userEvent.setup();

    beforeEach(() => {
        jest.clearAllMocks();

        // Reset hook return values to defaults
        mockUseGetNodesQuery.mockReturnValue(mockGetNodesQueryReturn);
        mockUseGetFlowQuery.mockReturnValue(mockGetFlowQueryReturn);
        mockSaveFlowFn.mockImplementation(() => ({
            unwrap: () => Promise.resolve({ data: { success: true } }),
        }));
        mockUseSaveFlowMutation.mockReturnValue([mockSaveFlowFn, { isLoading: false }]);

        // Reset transformApiFlowData to default (previous test may have set it to null)
        mockTransformApiFlowData.mockReturnValue({
            nodes: [],
            edges: [],
            nestedFlows: {},
        } as unknown as ReturnType<typeof transformApiFlowData>);

        mockFlowState.jsonModalOpen = false;
        mockFlowState.codeModalOpen = false;
        mockFlowState.jsonOutput = '';
        mockFlowState.codeOutput = '';
        mockFlowState.currentAnimationNode = undefined;
        mockFlowState.selectedNode = null;
        mockFlowState.sidebarCollapsed = false;
        mockFlowState.allNodes = [];
        mockFlowState.edges = [];
        mockFlowState.debugVariables = {};
        mockFlowState.debugLogs = [];

        mockNestedCanvasManager.activeNestedCanvas = null;
        mockNestedCanvasManager.nestedCanvasData = {};

        mockExtractData.mockReturnValue(null);
        mockUseParams.mockReturnValue({ id: 'test-rule-123' });

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
            render(<RuleBuilderWithValidation />);
            expect(screen.getByTestId('header')).toBeInTheDocument();
        });

        it('should render with viewOnly prop', () => {
            render(<RuleBuilderWithValidation viewOnly />);
            expect(screen.getByTestId('view-only-flag')).toBeInTheDocument();
            expect(screen.queryByTestId('left-sidebar')).not.toBeInTheDocument();
        });

        it('should render the header with title "Rule Builder"', () => {
            render(<RuleBuilderWithValidation />);
            expect(screen.getByTestId('header-title')).toHaveTextContent('Rule Builder');
        });

        it('should hide save and reset buttons for static rule id "21"', () => {
            mockUseParams.mockReturnValue({ id: '21' });
            render(<RuleBuilderWithValidation />);
            expect(screen.queryByTestId('save-btn')).not.toBeInTheDocument();
            expect(screen.queryByTestId('reset-btn')).not.toBeInTheDocument();
        });

        it('should show save and reset buttons for non-static rule ids', () => {
            render(<RuleBuilderWithValidation />);
            expect(screen.getByTestId('save-btn')).toBeInTheDocument();
            expect(screen.getByTestId('reset-btn')).toBeInTheDocument();
        });
    });

    // -------------------------------------------------------
    // Loading States
    // -------------------------------------------------------
    describe('Loading States', () => {
        it('should show loading when nodes are loading', () => {
            mockUseGetNodesQuery.mockReturnValue({
                data: undefined,
                isLoading: true,
                error: null,
                refetch: () => Promise.resolve(),
            } as any);

            render(<RuleBuilderWithValidation />);
            expect(screen.getByText('Loading node templates...')).toBeInTheDocument();
        });

        it('should show loading when flow is loading', () => {
            mockUseGetFlowQuery.mockReturnValue({
                data: null,
                isLoading: true,
                error: null,
            } as any);

            render(<RuleBuilderWithValidation />);
            expect(screen.getByText('Loading rule flow...')).toBeInTheDocument();
        });

        it('should show "Preparing canvas..." when flow data is not transformed yet', () => {
            mockTransformApiFlowData.mockReturnValue(null as unknown as ReturnType<typeof transformApiFlowData>);

            render(<RuleBuilderWithValidation />);
            expect(screen.getByText('Preparing canvas...')).toBeInTheDocument();
        });
    });

    // -------------------------------------------------------
    // Error States
    // -------------------------------------------------------
    describe('Error States', () => {
        it('should display error when node loading fails', () => {
            mockUseGetNodesQuery.mockReturnValue({
                data: undefined,
                isLoading: false,
                error: { status: 500 },
                refetch: () => Promise.resolve(),
            } as any);

            render(<RuleBuilderWithValidation />);
            expect(screen.getByText('Error loading rule builder')).toBeInTheDocument();
            expect(screen.getByText('Failed to load node templates')).toBeInTheDocument();
        });

        it('should display error when flow loading fails', () => {
            mockUseGetFlowQuery.mockReturnValue({
                data: null,
                isLoading: false,
                error: { status: 500 },
            } as any);

            render(<RuleBuilderWithValidation />);
            expect(screen.getByText('Error loading rule builder')).toBeInTheDocument();
            expect(screen.getByText('Failed to load rule flow')).toBeInTheDocument();
        });
    });

    // -------------------------------------------------------
    // Canvas Rendering
    // -------------------------------------------------------
    describe('Canvas Rendering', () => {
        it('should render canvas, left sidebar and right sidebar when data is loaded', async () => {
            render(<RuleBuilderWithValidation />);
            expect(await screen.findByTestId('rule-builder-canvas')).toBeInTheDocument();
            expect(screen.getByTestId('left-sidebar')).toBeInTheDocument();
            expect(screen.getByTestId('right-sidebar')).toBeInTheDocument();
        });

        it('should not render NestedCanvas when no nested canvas is active', () => {
            render(<RuleBuilderWithValidation />);
            expect(screen.queryByTestId('nested-canvas')).not.toBeInTheDocument();
        });

        it('should render NestedCanvas when an active nested canvas exists', async () => {
            mockNestedCanvasManager.activeNestedCanvas = 'node-1';
            mockNestedCanvasManager.activeNestedCanvasLabel = 'Handle Transaction';
            mockNestedCanvasManager.nestedCanvasData = {
                'node-1': { nodes: [], edges: [] },
            };

            render(<RuleBuilderWithValidation />);
            expect(await screen.findByTestId('nested-canvas')).toBeInTheDocument();
            expect(screen.getByTestId('nested-canvas-label')).toHaveTextContent('Handle Transaction');
        });

        it('should not render left sidebar in viewOnly mode', () => {
            render(<RuleBuilderWithValidation viewOnly />);
            expect(screen.queryByTestId('left-sidebar')).not.toBeInTheDocument();
        });
    });

    // -------------------------------------------------------
    // Play / Pause / Resume / Stop Controls
    // -------------------------------------------------------
    describe('Animation Controls', () => {
        it('should call playFlowAnimation on play click', async () => {
            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('play-btn'));
            expect(mockFlowAnimation.playFlowAnimation).toHaveBeenCalled();
        });

        it('should close nested canvas before playing when nested canvas is active', async () => {
            mockNestedCanvasManager.activeNestedCanvas = 'node-1';
            mockNestedCanvasManager.nestedCanvasData = {
                'node-1': { nodes: [], edges: [] },
            };

            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('play-btn'));

            expect(mockNestedCanvasManager.setActiveNestedCanvas).toHaveBeenCalledWith(null);
            expect(mockFlowState.setSelectedNode).toHaveBeenCalledWith(null);
        });

        it('should call pauseAnimation on pause click', async () => {
            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('pause-btn'));
            expect(mockFlowAnimation.pauseAnimation).toHaveBeenCalled();
        });

        it('should call resumeAnimation on resume click', async () => {
            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('resume-btn'));
            expect(mockFlowAnimation.resumeAnimation).toHaveBeenCalled();
        });

        it('should call stopAnimation and reset debug state on stop click', async () => {
            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('stop-btn'));

            expect(mockFlowAnimation.stopAnimation).toHaveBeenCalled();
            expect(mockFlowState.setDebugLogs).toHaveBeenCalledWith([]);
            expect(mockFlowState.setDebugVariables).toHaveBeenCalledWith({});
        });
    });

    // -------------------------------------------------------
    // Display JSON / Generate Code
    // -------------------------------------------------------
    describe('Display JSON / Generate Code', () => {
        it('should call window.generateFlowJson on display json click', async () => {
            const mockGenJson = jest.fn();
            (window as unknown as Record<string, unknown>).generateFlowJson = mockGenJson;

            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('display-json-btn'));
            expect(mockGenJson).toHaveBeenCalled();
        });

        it('should call window.generateFlowCode on generate code click', async () => {
            const mockGenCode = jest.fn();
            (window as unknown as Record<string, unknown>).generateFlowCode = mockGenCode;

            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('generate-code-btn'));
            expect(mockGenCode).toHaveBeenCalled();
        });

        it('should not throw when window.generateFlowJson is undefined', async () => {
            render(<RuleBuilderWithValidation />);
            await expect(user.click(screen.getByTestId('display-json-btn'))).resolves.not.toThrow();
        });

        it('should not throw when window.generateFlowCode is undefined', async () => {
            render(<RuleBuilderWithValidation />);
            await expect(user.click(screen.getByTestId('generate-code-btn'))).resolves.not.toThrow();
        });
    });

    // -------------------------------------------------------
    // View Errors Modal
    // -------------------------------------------------------
    describe('Validation Error Modal', () => {
        it('should not render validation error modal by default', () => {
            render(<RuleBuilderWithValidation />);
            expect(screen.queryByTestId('validation-error-modal')).not.toBeInTheDocument();
        });

        it('should show validation error modal when view errors is clicked', async () => {
            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('view-errors-btn'));
            expect(screen.getByTestId('validation-error-modal')).toBeInTheDocument();
        });
    });

    // -------------------------------------------------------
    // Output Modals
    // -------------------------------------------------------
    describe('Output Modals', () => {
        it('should not render JSON output modal when jsonModalOpen is false', () => {
            render(<RuleBuilderWithValidation />);
            expect(screen.queryByTestId('output-modal-json')).not.toBeInTheDocument();
        });

        it('should render JSON output modal when jsonModalOpen is true', () => {
            mockFlowState.jsonModalOpen = true;
            render(<RuleBuilderWithValidation />);
            expect(screen.getByTestId('output-modal-json')).toBeInTheDocument();
        });

        it('should not render Code output modal when codeModalOpen is false', () => {
            render(<RuleBuilderWithValidation />);
            expect(screen.queryByTestId('output-modal-typescript')).not.toBeInTheDocument();
        });

        it('should render Code output modal when codeModalOpen is true', () => {
            mockFlowState.codeModalOpen = true;
            render(<RuleBuilderWithValidation />);
            expect(screen.getByTestId('output-modal-typescript')).toBeInTheDocument();
        });
    });

    // -------------------------------------------------------
    // Save Flow
    // -------------------------------------------------------
    describe('Save Flow', () => {
        it('should show error toast when ruleId is missing', async () => {
            mockUseParams.mockReturnValue({ id: undefined } as any);
            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('save-btn'));

            expect(toast.error).toHaveBeenCalledWith('Rule ID not found');
        });

        it('should show error toast when generateFlowJson returns falsy', async () => {
            (window as unknown as Record<string, unknown>).generateFlowJson = jest.fn(() => null);

            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('save-btn'));

            expect(toast.error).toHaveBeenCalledWith('Failed to generate flow data');
        });

        it('should show error toast when generateFlowCode returns falsy', async () => {
            (window as unknown as Record<string, unknown>).generateFlowJson = jest.fn(() => '{"nodes":[],"edges":[]}');
            (window as unknown as Record<string, unknown>).generateFlowCode = jest.fn(() => null);

            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('save-btn'));

            expect(toast.error).toHaveBeenCalledWith('Failed to generate TypeScript code');
        });

        it('should show error toast when flow JSON is invalid', async () => {
            (window as unknown as Record<string, unknown>).generateFlowJson = jest.fn(() => 'invalid-json{');
            (window as unknown as Record<string, unknown>).generateFlowCode = jest.fn(() => 'const x = 1;');

            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('save-btn'));

            expect(toast.error).toHaveBeenCalledWith('Failed to parse flow data: Invalid JSON format');
        });

        it('should call saveFlow with correct payload on successful save', async () => {
            (window as unknown as Record<string, unknown>).generateFlowJson = jest.fn(() => '{"nodes":[],"edges":[]}');
            (window as unknown as Record<string, unknown>).generateFlowCode = jest.fn(() => 'const x = 1;');

            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('save-btn'));

            await waitFor(() => {
                expect(mockSaveFlowFn).toHaveBeenCalledWith(
                    expect.objectContaining({
                        ruleId: 'test-rule-123',
                        category: 'rule_builder',
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

            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('save-btn'));

            await waitFor(() => {
                expect(screen.getByText('Flow Saved Successfully')).toBeInTheDocument();
            });
        });

        it('should show error toast when saveFlow rejects', async () => {
            mockSaveFlowFn.mockImplementation(() => ({
                unwrap: () => Promise.reject({ data: { message: 'Server error' } }),
            }));

            (window as unknown as Record<string, unknown>).generateFlowJson = jest.fn(() => '{"nodes":[],"edges":[]}');
            (window as unknown as Record<string, unknown>).generateFlowCode = jest.fn(() => 'const x = 1;');

            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('save-btn'));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Server error');
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

            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('save-btn'));
            await waitFor(() => {
                expect(screen.getByText('Flow Saved Successfully')).toBeInTheDocument();
            });
        };

        it('should close dialog when "Stay on Editor" is clicked', async () => {
            await setupSaveSuccess();
            await user.click(screen.getByText('Stay on Editor'));

            await waitFor(() => {
                expect(screen.queryByText('Flow Saved Successfully')).not.toBeInTheDocument();
            });
        });

        it('should close dialog and navigate when "Proceed to Next Step" is clicked', async () => {
            await setupSaveSuccess();

            await user.click(screen.getByText('Proceed to Next Step'));
            await waitFor(() => {
                expect(screen.queryByText('Flow Saved Successfully')).not.toBeInTheDocument();
            });
            expect(mockFlowState.setCodeModalOpen).toHaveBeenCalledWith(false);
        });
    });

    // -------------------------------------------------------
    // Reset Flow
    // -------------------------------------------------------
    describe('Reset Flow', () => {
        it('should open reset confirmation dialog when reset button is clicked', async () => {
            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('reset-btn'));

            expect(screen.getByText('Reset Flow Confirmation')).toBeInTheDocument();
            expect(screen.getByText('Are you sure? All changes will be lost and the rule will be updated.')).toBeInTheDocument();
        });

        it('should close reset dialog when cancel is clicked', async () => {
            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('reset-btn'));

            expect(screen.getByText('Reset Flow Confirmation')).toBeInTheDocument();

            await user.click(screen.getByText('Cancel'));

            await waitFor(() => {
                expect(screen.queryByText('Reset Flow Confirmation')).not.toBeInTheDocument();
            });
        });

        it('should show error toast when ruleId is missing during reset', async () => {
            mockUseParams.mockReturnValue({ id: undefined } as any);
            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('reset-btn'));

            await user.click(screen.getByText('Yes, Reset'));
            expect(toast.error).toHaveBeenCalledWith('Rule ID not found');
        });

        it('should call saveFlow with reset payload when confirmed', async () => {
            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('reset-btn'));
            await user.click(screen.getByText('Yes, Reset'));

            await waitFor(() => {
                expect(mockSaveFlowFn).toHaveBeenCalledWith(
                    expect.objectContaining({
                        ruleId: 'test-rule-123',
                        category: 'rule_builder',
                    })
                );
            });
        });

        it('should show success toast after successful reset', async () => {
            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('reset-btn'));
            await user.click(screen.getByText('Yes, Reset'));

            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith('Flow reset to default template successfully');
            });
        });

        it('should show error toast when reset saveFlow fails', async () => {
            mockSaveFlowFn.mockImplementation(() => ({
                unwrap: () => Promise.reject(new Error('Reset failed')),
            }));

            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('reset-btn'));
            await user.click(screen.getByText('Yes, Reset'));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Reset failed');
            });
        });
    });

    // -------------------------------------------------------
    // Node Selection
    // -------------------------------------------------------
    describe('Node Selection Callbacks', () => {
        it('should set selectedNode to null for Start node type', () => {
            render(<RuleBuilderWithValidation />);

            const mockNode = {
                id: 'start-1',
                position: { x: 0, y: 0 },
                data: { nodeType: 'Start', label: 'Start' },
            } as Node;

            expect(mockFlowState.setSelectedNode).not.toHaveBeenCalledWith(mockNode);
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
            });

            render(<RuleBuilderWithValidation />);
            expect(mockSetApiNodes).toHaveBeenCalledWith(nodesData);
        });

        it('should not call setApiNodes when nodes data is undefined', () => {
            mockUseGetNodesQuery.mockReturnValue({
                data: undefined,
                isLoading: false,
                error: null,
                refetch: () => Promise.resolve(),
            } as any);

            render(<RuleBuilderWithValidation />);
            expect(mockSetApiNodes).not.toHaveBeenCalled();
        });
    });

    // -------------------------------------------------------
    // Back URL
    // -------------------------------------------------------
    describe('Back URL', () => {
        it('should use view mode back URL when mode is "view"', () => {
            mockExtractData.mockReturnValue('view');
            render(<RuleBuilderWithValidation />);
            expect(mockExtractData).toHaveBeenCalledWith('mode', 'LocalStorage');
        });

        it('should use default back URL when mode is not "view"', () => {
            mockExtractData.mockReturnValue(null);
            render(<RuleBuilderWithValidation />);
            expect(mockExtractData).toHaveBeenCalledWith('mode', 'LocalStorage');
        });
    });

    // -------------------------------------------------------
    // Edge Cases
    // -------------------------------------------------------
    describe('Edge Cases', () => {
        it('should handle undefined ruleId gracefully', () => {
            mockUseParams.mockReturnValue({ id: undefined } as any);
            expect(() => render(<RuleBuilderWithValidation />)).not.toThrow();
        });

        it('should render correctly with empty flow data', async () => {
            render(<RuleBuilderWithValidation />);
            expect(await screen.findByTestId('rule-builder-canvas')).toBeInTheDocument();
        });

        it('should not crash when flowData has no nestedFlows', () => {
            mockTransformApiFlowData.mockReturnValue({
                nodes: [],
                edges: [],
            } as unknown as ReturnType<typeof transformApiFlowData>);

            expect(() => render(<RuleBuilderWithValidation />)).not.toThrow();
        });

        it('should handle saveFlow error without data.message', async () => {
            mockSaveFlowFn.mockImplementation(() => ({
                unwrap: () => Promise.reject({}),
            }));

            (window as unknown as Record<string, unknown>).generateFlowJson = jest.fn(() => '{"nodes":[],"edges":[]}');
            (window as unknown as Record<string, unknown>).generateFlowCode = jest.fn(() => 'const x = 1;');

            render(<RuleBuilderWithValidation />);
            await user.click(screen.getByTestId('save-btn'));

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Failed to save flow');
            });
        });
    });
});
