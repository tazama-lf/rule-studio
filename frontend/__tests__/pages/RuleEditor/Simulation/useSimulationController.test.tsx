import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import toast from 'react-hot-toast';

jest.mock('../../../../src/config/environment', () => ({
    SIMULATION_ENDPOINT: 'http://localhost:3000/simulation',
    CRYPTO_KEY: 'test-crypto-key',
}));

jest.mock('../../../../src/utils/Common/crypto', () => ({
    encrypt: jest.fn((data) => JSON.stringify(data)),
    decrypt: jest.fn((data) => JSON.parse(data)),
}));

import useSimulationController from '../../../../src/pages/RuleEditor/Simulation/useSimulationController';
import { extractData } from '../../../../src/utils/Common/storage';

jest.mock('../../../../src/utils/Common/storage');
jest.mock('react-hot-toast');
jest.mock('../../../../src/contexts/ModalContext', () => ({
    useModal: () => ({
        open: jest.fn(),
    }),
}));
jest.mock('../../../../src/contexts/TabContext/useTab', () => ({
    useTab: () => ({
        enableNextTab: jest.fn(),
        enablePreviousTab: jest.fn(),
    }),
}));
jest.mock('../../../../src/hooks/useToggle', () => ({
    __esModule: true,
    default: () => [false, jest.fn()],
}));
jest.mock('react-router-dom', () => ({
    useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));
jest.mock('react-hook-form', () => ({
    useForm: () => ({
        handleSubmit: (fn: (data: unknown) => void) => (data: unknown) => fn(data),
        formState: { errors: {} },
        control: {},
        setValue: jest.fn(),
    }),
}));

const mockUploadCode = jest.fn();
const mockMergeBranch = jest.fn();
const mockGetReportStatus = jest.fn();
const mockGetOrganization = jest.fn();
const mockGetGlobalVariables = jest.fn();
const mockGetSamplePayload = jest.fn();
const mockRuleOnly = jest.fn();
const mockEndToEnd = jest.fn();
const mockGetEndReport = jest.fn();
const mockUpdateMetadata = jest.fn();
const mockAddLogs = jest.fn();

jest.mock('../../../../src/redux/Api/Simulation', () => ({
    useUploadCodeMutation: () => [mockUploadCode, { isLoading: false }],
    useMergeBranchMutation: () => [mockMergeBranch, { isLoading: false }],
    useLazyGetReportStatusQuery: () => [mockGetReportStatus, { isLoading: false }],
    useLazyGetOrganizationQuery: () => [mockGetOrganization],
}));

jest.mock('../../../../src/redux/Api/Rule-builder', () => ({
    useGetAllFlowQuery: () => ({
        data: {
            result: {
                ts_file_base64_rule_builder: 'base64-rule-code',
                ts_file_base64_test_case: 'base64-test-code',
            },
        },
        isFetching: false,
    }),
    useLazyGetGlobalVariablesQuery: () => [mockGetGlobalVariables, { isFetching: false }],
}));

jest.mock('../../../../src/redux/Api/Config', () => ({
    useLazyGetSamplePayloadQuery: () => [mockGetSamplePayload, { isFetching: false }],
}));

jest.mock('../../../../src/redux/Api/Nats', () => ({
    useRuleOnlyMutation: () => [mockRuleOnly, { isLoading: false }],
    useEndToEndMutation: () => [mockEndToEnd, { isLoading: false }],
    useLazyGetEndReportQuery: () => [mockGetEndReport, { isLoading: false }],
}));

jest.mock('../../../../src/redux/Api/Rules', () => ({
    useUpdateMetadataMutation: () => [mockUpdateMetadata],
}));

jest.mock('../../../../src/redux/Api/SimulationLogs', () => ({
    useAddSimulationlogsMutation: () => [mockAddLogs],
}));

const mockExtractData = extractData as jest.MockedFunction<typeof extractData>;

describe('useSimulationController', () => {
    const mockData = {
        id: 'rule-123',
        rule_config_id: 'config-456@1.0.0',
        status: 'STATUS_01_IN_PROGRESS',
        txtp: 'pacs.002.001.12',
        txtp_version: '1.0',
        tenant_id: 'tenant-001',
        version: '1.0.0',
        rule_name: 'test-rule',
        metadata: {
            test: false,
            sync: true,
            deploy: false,
        },
    };

    const mockUser = {
        claims: 'editor',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockExtractData.mockImplementation((key: string) => {
            if (key === 'trs_rule') return mockData;
            if (key === 'user') return mockUser;
            if (key === 'trs_endpoint_path') return '/pacs/002';
            return null;
        });
        mockUpdateMetadata.mockReturnValue({
            unwrap: jest.fn().mockResolvedValue({}),
        });
        mockGetOrganization.mockReturnValue({
            unwrap: jest.fn().mockResolvedValue({ organization: 'test-org' }),
        });
        mockGetEndReport.mockReturnValue(
            Promise.resolve({ data: null })
        );
    });

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            expect(result.current.values.claim).toBe('editor');
            expect(result.current.values.status).toBe('STATUS_01_IN_PROGRESS');
            expect(result.current.values.uploading).toBe(false);
            expect(result.current.values.deploying).toBe(false);
            expect(result.current.values.selected).toBeNull();
            expect(result.current.values.result).toBeNull();
        });

        it('should extract data from props when provided', () => {
            const propsData = { id: 'prop-rule-456' };
            const { result } = renderHook(() => useSimulationController({ data: propsData }));

            expect(mockExtractData).toHaveBeenCalledWith('trs_rule', expect.anything(), true);
        });

        it('should initialize metadata states from data', () => {
            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            expect(result.current.values.viewReport).toBe(false);
            expect(result.current.values.codeSynced).toBe(true);
            expect(result.current.values.codeDeployed).toBe(false);
        });

        it('should handle missing metadata gracefully', () => {
            mockExtractData.mockImplementation((key: string) => {
                if (key === 'trs_rule') return { id: 'rule-123' };
                if (key === 'user') return mockUser;
                return null;
            });

            const { result } = renderHook(() => useSimulationController({}));

            expect(result.current.values.viewReport).toBe(false);
        });
    });

    describe('handleApproval', () => {
        it('should call modal open with review type', () => {
            const mockOpen = jest.fn();
            jest.spyOn(require('../../../../src/contexts/ModalContext'), 'useModal').mockReturnValue({
                open: mockOpen,
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            act(() => {
                result.current.functions.handleApproval('review');
            });

            expect(mockOpen).toHaveBeenCalledWith(
                'Review Confirmation Required!',
                expect.anything(),
                null,
                { maxWidth: 'sm' }
            );
        });

        it('should call modal open with approve type', () => {
            const mockOpen = jest.fn();
            jest.spyOn(require('../../../../src/contexts/ModalContext'), 'useModal').mockReturnValue({
                open: mockOpen,
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            act(() => {
                result.current.functions.handleApproval('approve');
            });

            expect(mockOpen).toHaveBeenCalledWith(
                'Approval Confirmation Required!',
                expect.anything(),
                null,
                { maxWidth: 'sm' }
            );
        });

        it('should call modal open with reject type', () => {
            const mockOpen = jest.fn();
            jest.spyOn(require('../../../../src/contexts/ModalContext'), 'useModal').mockReturnValue({
                open: mockOpen,
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            act(() => {
                result.current.functions.handleApproval('reject');
            });

            expect(mockOpen).toHaveBeenCalledWith(
                'Rejection Confirmation Required!',
                expect.anything(),
                null,
                { maxWidth: 'sm' }
            );
        });

        it('should call modal open with deploy type', () => {
            const mockOpen = jest.fn();
            jest.spyOn(require('../../../../src/contexts/ModalContext'), 'useModal').mockReturnValue({
                open: mockOpen,
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            act(() => {
                result.current.functions.handleApproval('deploy');
            });

            expect(mockOpen).toHaveBeenCalledWith(
                'Deployment Confirmation Required!',
                expect.anything(),
                null,
                { maxWidth: 'sm' }
            );
        });
    });

    describe('handleNext and handleBack', () => {
        it('should call enableNextTab when handleNext is called', () => {
            const mockEnableNextTab = jest.fn();
            jest.spyOn(require('../../../../src/contexts/TabContext/useTab'), 'useTab').mockReturnValue({
                enableNextTab: mockEnableNextTab,
                enablePreviousTab: jest.fn(),
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            act(() => {
                result.current.functions.handleNext();
            });

            expect(mockEnableNextTab).toHaveBeenCalled();
        });

        it('should call enablePreviousTab when handleBack is called', () => {
            const mockEnablePreviousTab = jest.fn();
            jest.spyOn(require('../../../../src/contexts/TabContext/useTab'), 'useTab').mockReturnValue({
                enableNextTab: jest.fn(),
                enablePreviousTab: mockEnablePreviousTab,
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            act(() => {
                result.current.functions.handleBack();
            });

            expect(mockEnablePreviousTab).toHaveBeenCalled();
        });
    });

    describe('handleUpload', () => {
        it('should upload code successfully', async () => {
            mockUploadCode.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({ success: true }),
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            await act(async () => {
                result.current.functions.handleUpload();
            });

            await waitFor(() => {
                expect(mockUploadCode).toHaveBeenCalledWith({
                    ruleId: 'config-456',
                    ruleCode: 'base64-rule-code',
                    testCode: 'base64-test-code',
                });
            });
        });

        it('should show success toast on successful upload', async () => {
            mockUploadCode.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({ success: true }),
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            await act(async () => {
                result.current.functions.handleUpload();
            });

            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith('Code Uploaded Successfully');
            });
        });

        it('should show error toast on upload failure', async () => {
            mockUploadCode.mockReturnValue({
                unwrap: jest.fn().mockRejectedValue(new Error('Upload failed')),
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            await act(async () => {
                result.current.functions.handleUpload();
            });

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Failed to upload code');
            });
        });

        it('should update metadata after successful upload', async () => {
            mockUploadCode.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({ success: true }),
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            await act(async () => {
                result.current.functions.handleUpload();
            });

            await waitFor(() => {
                expect(mockUpdateMetadata).toHaveBeenCalled();
            });
        });
    });

    describe('handleDeploy', () => {
        it('should call deploy without blocking on sync status', async () => {
            mockMergeBranch.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({ success: true }),
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            await act(async () => {
                result.current.functions.handleDeploy();
            });

            await waitFor(() => {
                expect(mockMergeBranch).toHaveBeenCalledWith({
                    ruleId: 'config-456',
                    branchName: 'dev',
                });
            });
        });

        it('should deploy code successfully', async () => {
            mockMergeBranch.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({ success: true }),
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            await act(async () => {
                result.current.functions.handleDeploy();
            });

            await waitFor(() => {
                expect(mockMergeBranch).toHaveBeenCalledWith({
                    ruleId: 'config-456',
                    branchName: 'dev',
                });
            });
        });

        it('should show success toast on successful deploy', async () => {
            mockMergeBranch.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({ success: true }),
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            await act(async () => {
                result.current.functions.handleDeploy();
            });

            await waitFor(() => {
                expect(toast.success).toHaveBeenCalledWith('Code Deployed Successfully');
            });
        });

        it('should show error toast on deploy failure', async () => {
            mockMergeBranch.mockReturnValue({
                unwrap: jest.fn().mockRejectedValue(new Error('Deploy failed')),
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            await act(async () => {
                result.current.functions.handleDeploy();
            });

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Failed to deploy code');
            });
        });
    });

    describe('handleSelect', () => {
        it('should show error if code not deployed for editor', async () => {
            mockExtractData.mockImplementation((key: string) => {
                if (key === 'trs_rule')
                    return {
                        ...mockData,
                        metadata: { ...mockData.metadata, deploy: false },
                    };
                if (key === 'user') return mockUser;
                return null;
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            await act(async () => {
                result.current.functions.handleSelect(1);
            });

            expect(toast.error).toHaveBeenCalledWith('Deploy rule first to run simulation');
        });

        it('should set selected and fetch rule request for id 1', async () => {
            mockExtractData.mockImplementation((key: string) => {
                if (key === 'trs_rule')
                    return {
                        ...mockData,
                        metadata: { ...mockData.metadata, deploy: true },
                    };
                if (key === 'user') return mockUser;
                return null;
            });

            mockGetGlobalVariables.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({
                    RuleRequest: { test: 'data' },
                }),
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            await act(async () => {
                result.current.functions.handleSelect(1);
            });

            await waitFor(() => {
                expect(mockGetGlobalVariables).toHaveBeenCalledWith('rule-123');
            });
        });

        it('should show error if transaction type not found for id 2', async () => {
            mockExtractData.mockImplementation((key: string) => {
                if (key === 'trs_rule')
                    return {
                        id: 'rule-123',
                        metadata: { deploy: true },
                    };
                if (key === 'user') return mockUser;
                return null;
            });

            const { result } = renderHook(() => useSimulationController({}));

            await act(async () => {
                result.current.functions.handleSelect(2);
            });

            expect(toast.error).toHaveBeenCalledWith('Transaction type not found');
        });

        it('should fetch sample payload for id 2', async () => {
            mockExtractData.mockImplementation((key: string) => {
                if (key === 'trs_rule')
                    return {
                        ...mockData,
                        metadata: { ...mockData.metadata, deploy: true },
                    };
                if (key === 'user') return mockUser;
                return null;
            });

            mockGetSamplePayload.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({ sample: 'payload' }),
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            await act(async () => {
                result.current.functions.handleSelect(2);
            });

            await waitFor(() => {
                expect(mockGetSamplePayload).toHaveBeenCalledWith({
                    type: 'pacs.002.001.12',
                    version: '1.0',
                });
            });
        });

        it('should show error toast on fetch failure', async () => {
            mockExtractData.mockImplementation((key: string) => {
                if (key === 'trs_rule')
                    return {
                        ...mockData,
                        metadata: { ...mockData.metadata, deploy: true },
                    };
                if (key === 'user') return mockUser;
                return null;
            });

            mockGetGlobalVariables.mockReturnValue({
                unwrap: jest.fn().mockRejectedValue(new Error('Fetch failed')),
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            await act(async () => {
                result.current.functions.handleSelect(1);
            });

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Failed to load rule request payload');
            });
        });
    });

    describe('handleSimulation', () => {
        it('should run rule-only simulation for selected 1', async () => {
            mockExtractData.mockImplementation((key: string) => {
                if (key === 'trs_rule')
                    return {
                        ...mockData,
                        metadata: { ...mockData.metadata, deploy: true },
                    };
                if (key === 'user') return mockUser;
                return null;
            });

            mockGetGlobalVariables.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({
                    RuleRequest: { test: 'request' },
                }),
            });

            mockRuleOnly.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({ result: 'success' }),
            });

            mockAddLogs.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({}),
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            await act(async () => {
                await result.current.functions.handleSelect(1);
            });

            await act(async () => {
                result.current.functions.handleSimulation({ payload: '{"test": "data"}' });
            });

            await waitFor(() => {
                expect(mockRuleOnly).toHaveBeenCalledWith(
                    expect.objectContaining({
                        functionName: '',
                        awaitReply: true,
                        destination: 'sub-config-456@1.0.0',
                        consumer: 'pub-config-456@1.0.0',
                        message: { test: 'data' },
                    })
                );
            });
        });

        it('should run end-to-end simulation for selected 2', async () => {
            mockExtractData.mockImplementation((key: string) => {
                if (key === 'trs_rule')
                    return {
                        ...mockData,
                        metadata: { ...mockData.metadata, deploy: true },
                    };
                if (key === 'user') return mockUser;
                if (key === 'trs_endpoint_path') return '/pacs/002';
                return null;
            });

            mockGetSamplePayload.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({ sample: 'payload' }),
            });

            mockEndToEnd.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({ result: 'success' }),
            });

            mockAddLogs.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({}),
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            await act(async () => {
                await result.current.functions.handleSelect(2);
            });

            await act(async () => {
                result.current.functions.handleSimulation({ payload: '{"test": "data"}' });
            });

            await waitFor(() => {
                expect(mockEndToEnd).toHaveBeenCalled();
            });
        });

        it('should show error toast on simulation failure', async () => {
            mockExtractData.mockImplementation((key: string) => {
                if (key === 'trs_rule')
                    return {
                        ...mockData,
                        metadata: { ...mockData.metadata, deploy: true },
                    };
                if (key === 'user') return mockUser;
                return null;
            });

            mockGetGlobalVariables.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({
                    RuleRequest: { test: 'request' },
                }),
            });

            mockRuleOnly.mockReturnValue({
                unwrap: jest.fn().mockRejectedValue(new Error('Simulation failed')),
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            await act(async () => {
                await result.current.functions.handleSelect(1);
            });

            await act(async () => {
                result.current.functions.handleSimulation({ payload: '{"test": "data"}' });
            });

            await waitFor(() => {
                expect(toast.error).toHaveBeenCalledWith('Failed to run simulation. Please try again.');
            });
        });

        it('should parse JSON payload correctly', async () => {
            mockExtractData.mockImplementation((key: string) => {
                if (key === 'trs_rule')
                    return {
                        ...mockData,
                        metadata: { ...mockData.metadata, deploy: true },
                    };
                if (key === 'user') return mockUser;
                return null;
            });

            mockGetGlobalVariables.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({
                    RuleRequest: { test: 'request' },
                }),
            });

            mockRuleOnly.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({ result: 'success' }),
            });

            mockAddLogs.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({}),
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            await act(async () => {
                await result.current.functions.handleSelect(1);
            });

            await act(async () => {
                result.current.functions.handleSimulation({
                    payload: '{"key": "value", "nested": {"data": 123}}',
                });
            });

            await waitFor(() => {
                expect(mockRuleOnly).toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: { key: 'value', nested: { data: 123 } },
                    })
                );
            });
        });

        it('should handle non-string payload', async () => {
            mockExtractData.mockImplementation((key: string) => {
                if (key === 'trs_rule')
                    return {
                        ...mockData,
                        metadata: { ...mockData.metadata, deploy: true },
                    };
                if (key === 'user') return mockUser;
                return null;
            });

            mockGetGlobalVariables.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({
                    RuleRequest: { test: 'request' },
                }),
            });

            mockRuleOnly.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({ result: 'success' }),
            });

            mockAddLogs.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue({}),
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            await act(async () => {
                await result.current.functions.handleSelect(1);
            });

            await act(async () => {
                result.current.functions.handleSimulation({
                    payload: { direct: 'object' },
                });
            });

            await waitFor(() => {
                expect(mockRuleOnly).toHaveBeenCalledWith(
                    expect.objectContaining({
                        message: { direct: 'object' },
                    })
                );
            });
        });
    });

    describe('handleReport', () => {
        it('should open ViewReport modal', () => {
            const mockOpen = jest.fn();
            jest.spyOn(require('../../../../src/contexts/ModalContext'), 'useModal').mockReturnValue({
                open: mockOpen,
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            act(() => {
                result.current.functions.handleReport();
            });

            expect(mockOpen).toHaveBeenCalledWith('Test Report', expect.anything(), null, {
                maxWidth: 'xl',
            });
        });
    });

    describe('handleNetworkMap', () => {
        it('should open ViewNetworkMap modal', () => {
            const mockOpen = jest.fn();
            jest.spyOn(require('../../../../src/contexts/ModalContext'), 'useModal').mockReturnValue({
                open: mockOpen,
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            act(() => {
                result.current.functions.handleNetworkMap();
            });

            expect(mockOpen).toHaveBeenCalledWith('View Network Map', expect.anything(), null, {
                maxWidth: 'md',
            });
        });
    });

    describe('Computed Values', () => {
        it('should compute sentForApproval correctly', () => {
            mockExtractData.mockImplementation((key: string) => {
                if (key === 'trs_rule')
                    return {
                        ...mockData,
                        metadata: {
                            sync: false,
                            deploy: true,
                            test: true,
                            simulation: true,
                        },
                    };
                if (key === 'user') return mockUser;
                return null;
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            expect(result.current.values.sentForApproval).toBe(true);
        });

        it('should return false for sentForApproval when conditions not met', () => {
            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            expect(result.current.values.sentForApproval).toBe(false);
        });

        it('should expose claim from user', () => {
            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            expect(result.current.values.claim).toBe('editor');
        });

        it('should expose status from data', () => {
            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            expect(result.current.values.status).toBe('STATUS_01_IN_PROGRESS');
        });
    });

    describe('Edge Cases', () => {
        it('should handle undefined props data', () => {
            const { result } = renderHook(() => useSimulationController({}));

            expect(result.current.values).toBeDefined();
            expect(result.current.functions).toBeDefined();
        });

        it('should handle missing rule_config_id', () => {
            mockExtractData.mockImplementation((key: string) => {
                if (key === 'trs_rule') return { id: 'rule-123' };
                if (key === 'user') return mockUser;
                return null;
            });

            const { result } = renderHook(() => useSimulationController({}));

            expect(() => result.current.functions.handleUpload()).not.toThrow();
        });

        it('should handle null user claims', () => {
            mockExtractData.mockImplementation((key: string) => {
                if (key === 'trs_rule') return mockData;
                if (key === 'user') return { claims: null };
                return null;
            });

            const { result } = renderHook(() => useSimulationController({ data: mockData }));

            expect(result.current.values.claim).toBeNull();
        });
    });
});
