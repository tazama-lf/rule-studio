import { renderHook } from '@testing-library/react';
import { act } from 'react';
import useTestCasesController from '../../../../src/pages/RuleEditor/TestCases/useTestCasesController';

const mockEnableNextTab = jest.fn();
const mockEnablePreviousTab = jest.fn();

jest.mock('../../../../src/contexts/TabContext/useTab', () => ({
    useTab: () => ({
        enableNextTab: mockEnableNextTab,
        enablePreviousTab: mockEnablePreviousTab,
    }),
}));

jest.mock('../../../../src/utils/Common/storage', () => ({
    extractData: jest.fn(),
}));

jest.mock('../../../../src/redux/Api/Rule-builder', () => ({
    useGetRuleFlowStatusQuery: jest.fn(),
}));

const { extractData } = require('../../../../src/utils/Common/storage');
const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');

describe('useTestCasesController Hook', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (extractData as jest.Mock).mockReturnValue({
            id: '123',
            rule_name: 'Test Rule',
        });
        (useGetRuleFlowStatusQuery as jest.Mock).mockReturnValue({
            data: {
                data: {
                    statusInProgress: true,
                    flowStatus: 'initial',
                },
            },
            isLoading: false,
        });
    });

    describe('Hook Initialization', () => {
        it('should initialize without errors', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            expect(result.current).toBeDefined();
        });

        it('should return values and functions objects', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            expect(result.current.values).toBeDefined();
            expect(result.current.functions).toBeDefined();
        });

        it('should call extractData to get rule data', () => {
            renderHook(() => useTestCasesController({}));

            expect(extractData).toHaveBeenCalledWith('rule');
        });

        it('should use data from props if provided', () => {
            const propsData = { id: '456', rule_name: 'Props Rule' };

            renderHook(() => useTestCasesController({ data: propsData }));

            expect(extractData).not.toHaveBeenCalled();
        });

        it('should call useGetRuleFlowStatusQuery with correct params', () => {
            renderHook(() => useTestCasesController({}));

            expect(useGetRuleFlowStatusQuery).toHaveBeenCalledWith(
                {
                    id: '123',
                },
                {
                    skip: false,
                }
            );
        });

        it('should skip query if no id available', () => {
            (extractData as jest.Mock).mockReturnValue({});

            renderHook(() => useTestCasesController({}));

            expect(useGetRuleFlowStatusQuery).toHaveBeenCalledWith(
                {
                    id: undefined,
                },
                {
                    skip: true,
                }
            );
        });
    });

    describe('Flow Status - Initial', () => {
        beforeEach(() => {
            (useGetRuleFlowStatusQuery as jest.Mock).mockReturnValue({
                data: {
                    data: {
                        statusInProgress: true,
                        flowStatus: 'initial',
                    },
                },
                isLoading: false,
            });
        });

        it('should return initial status config', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            expect(result.current.values.flowStatus).toBe('initial');
            expect(result.current.values.isInitial).toBe(true);
            expect(result.current.values.isPassed).toBe(false);
            expect(result.current.values.isFailed).toBe(false);
        });

        it('should return correct initial status config', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            const config = result.current.values.statusConfig;
            expect(config.title).toBe('Test Cases Not Created Yet');
            expect(config.description).toBe('Your test cases are in initial mode. Click the button below to start generating test cases.');
            expect(config.buttonText).toBe('Open Test Case Generator');
            expect(config.color).toBe('#FFA726');
            expect(config.bgColor).toBe('#FFF3E0');
            expect(config.icon).toBe('🔧');
        });
    });

    describe('Flow Status - Pass', () => {
        beforeEach(() => {
            (useGetRuleFlowStatusQuery as jest.Mock).mockReturnValue({
                data: {
                    data: {
                        statusInProgress: false,
                        flowStatus: 'pass',
                    },
                },
                isLoading: false,
            });
        });

        it('should return pass status config', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            expect(result.current.values.flowStatus).toBe('pass');
            expect(result.current.values.isInitial).toBe(false);
            expect(result.current.values.isPassed).toBe(true);
            expect(result.current.values.isFailed).toBe(false);
        });

        it('should return correct pass status config', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            const config = result.current.values.statusConfig;
            expect(config.title).toBe('Test Cases Validated Successfully');
            expect(config.description).toBe('Your test cases have been validated and are ready to use. You can edit them anytime.');
            expect(config.buttonText).toBe('View Test Cases');
            expect(config.color).toBe('#66BB6A');
            expect(config.bgColor).toBe('#E8F5E9');
            expect(config.icon).toBe('✅');
        });
    });

    describe('Flow Status - Fail', () => {
        beforeEach(() => {
            (useGetRuleFlowStatusQuery as jest.Mock).mockReturnValue({
                data: {
                    data: {
                        statusInProgress: false,
                        flowStatus: 'fail',
                    },
                },
                isLoading: false,
            });
        });

        it('should return fail status config', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            expect(result.current.values.flowStatus).toBe('fail');
            expect(result.current.values.isInitial).toBe(false);
            expect(result.current.values.isPassed).toBe(false);
            expect(result.current.values.isFailed).toBe(true);
        });

        it('should return correct fail status config', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            const config = result.current.values.statusConfig;
            expect(config.title).toBe('Validation Failed');
            expect(config.description).toBe('Your test cases contain errors and need to be fixed. Click below to review and correct the issues.');
            expect(config.buttonText).toBe('View Test Cases');
            expect(config.color).toBe('#EF5350');
            expect(config.bgColor).toBe('#FFEBEE');
            expect(config.icon).toBe('⚠️');
        });
    });

    describe('Flow Status - Default', () => {
        beforeEach(() => {
            (useGetRuleFlowStatusQuery as jest.Mock).mockReturnValue({
                data: {
                    data: {
                        statusInProgress: true,
                        flowStatus: 'unknown',
                    },
                },
                isLoading: false,
            });
        });

        it('should return default status config for unknown status', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            expect(result.current.values.flowStatus).toBe('unknown');
            expect(result.current.values.isInitial).toBe(false);
            expect(result.current.values.isPassed).toBe(false);
            expect(result.current.values.isFailed).toBe(false);
        });

        it('should return correct default status config', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            const config = result.current.values.statusConfig;
            expect(config.title).toBe('Test Cases Status');
            expect(config.description).toBe('Click below to view or edit your test cases.');
            expect(config.buttonText).toBe('View Test Cases');
            expect(config.color).toBe('#42A5F5');
            expect(config.bgColor).toBe('#E3F2FD');
            expect(config.icon).toBe('📝');
        });
    });

    describe('Loading State', () => {
        it('should return isLoadingFlow as true when query is loading', () => {
            (useGetRuleFlowStatusQuery as jest.Mock).mockReturnValue({
                data: undefined,
                isLoading: true,
            });

            const { result } = renderHook(() => useTestCasesController({}));

            expect(result.current.values.isLoadingFlow).toBe(true);
        });

        it('should return isLoadingFlow as false when query is not loading', () => {
            (useGetRuleFlowStatusQuery as jest.Mock).mockReturnValue({
                data: {
                    data: {
                        statusInProgress: true,
                        flowStatus: 'initial',
                    },
                },
                isLoading: false,
            });

            const { result } = renderHook(() => useTestCasesController({}));

            expect(result.current.values.isLoadingFlow).toBe(false);
        });
    });

    describe('handleNext Function', () => {
        it('should call enableNextTab when invoked', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            act(() => {
                result.current.functions.handleNext();
            });

            expect(mockEnableNextTab).toHaveBeenCalled();
        });

        it('should call enableNextTab only once', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            act(() => {
                result.current.functions.handleNext();
            });

            expect(mockEnableNextTab).toHaveBeenCalledTimes(1);
        });

        it('should call enableNextTab multiple times for multiple invocations', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            act(() => {
                result.current.functions.handleNext();
                result.current.functions.handleNext();
            });

            expect(mockEnableNextTab).toHaveBeenCalledTimes(2);
        });
    });

    describe('handleBack Function', () => {
        it('should call enablePreviousTab when invoked', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            act(() => {
                result.current.functions.handleBack();
            });

            expect(mockEnablePreviousTab).toHaveBeenCalled();
        });

        it('should call enablePreviousTab only once', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            act(() => {
                result.current.functions.handleBack();
            });

            expect(mockEnablePreviousTab).toHaveBeenCalledTimes(1);
        });

        it('should call enablePreviousTab multiple times for multiple invocations', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            act(() => {
                result.current.functions.handleBack();
                result.current.functions.handleBack();
            });

            expect(mockEnablePreviousTab).toHaveBeenCalledTimes(2);
        });
    });

    describe.skip('handleCanvas Function - Edit Mode', () => {
        beforeEach(() => {
            (useGetRuleFlowStatusQuery as jest.Mock).mockReturnValue({
                data: {
                    data: {
                        statusInProgress: true,
                        flowStatus: 'initial',
                    },
                },
                isLoading: false,
            });
        });

        it('should redirect to edit page when statusInProgress is true', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            act(() => {
                result.current.functions.handleCanvas();
            });

            expect(window.location.href).toBe('/test-case-generate/123');
        });

        it('should use id from extracted data', () => {
            (extractData as jest.Mock).mockReturnValue({
                id: '456',
                rule_name: 'Test Rule',
            });

            const { result } = renderHook(() => useTestCasesController({}));

            act(() => {
                result.current.functions.handleCanvas();
            });

            expect(window.location.href).toBe('/test-case-generate/456');
        });

        it('should use id from props data', () => {
            const propsData = { id: '789', rule_name: 'Props Rule' };

            const { result } = renderHook(() => useTestCasesController({ data: propsData }));

            act(() => {
                result.current.functions.handleCanvas();
            });

            expect(window.location.href).toBe('/test-case-generate/789');
        });
    });

    describe.skip('handleCanvas Function - View Mode', () => {
        beforeEach(() => {
            (useGetRuleFlowStatusQuery as jest.Mock).mockReturnValue({
                data: {
                    data: {
                        statusInProgress: false,
                        flowStatus: 'pass',
                    },
                },
                isLoading: false,
            });
        });

        it('should redirect to view page when statusInProgress is false', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            act(() => {
                result.current.functions.handleCanvas();
            });

            expect(window.location.href).toBe('/test-case-generate/view/123');
        });

        it('should use correct route for view mode with different id', () => {
            (extractData as jest.Mock).mockReturnValue({
                id: '999',
                rule_name: 'Test Rule',
            });

            const { result } = renderHook(() => useTestCasesController({}));

            act(() => {
                result.current.functions.handleCanvas();
            });

            expect(window.location.href).toBe('/test-case-generate/view/999');
        });
    });

    describe('Data Prop Handling', () => {
        it('should use data from props when provided', () => {
            const propsData = { id: '555', rule_name: 'Props Rule' };

            renderHook(() => useTestCasesController({ data: propsData }));

            expect(useGetRuleFlowStatusQuery).toHaveBeenCalledWith(
                {
                    id: '555',
                },
                {
                    skip: false,
                }
            );
        });

        it('should extract data when no props provided', () => {
            renderHook(() => useTestCasesController({}));

            expect(extractData).toHaveBeenCalledWith('rule');
        });

        it('should handle empty props data', () => {
            renderHook(() => useTestCasesController({ data: {} }));

            expect(extractData).not.toHaveBeenCalled();
        });

        it('should handle undefined props', () => {
            renderHook(() => useTestCasesController({ data: undefined }));

            expect(extractData).toHaveBeenCalledWith('rule');
        });
    });

    describe('Query Skip Logic', () => {
        it('should not skip query when id is available', () => {
            (extractData as jest.Mock).mockReturnValue({
                id: '123',
                rule_name: 'Test Rule',
            });

            renderHook(() => useTestCasesController({}));

            expect(useGetRuleFlowStatusQuery).toHaveBeenCalledWith(
                expect.anything(),
                {
                    skip: false,
                }
            );
        });

        it('should skip query when id is missing', () => {
            (extractData as jest.Mock).mockReturnValue({
                rule_name: 'Test Rule',
            });

            renderHook(() => useTestCasesController({}));

            expect(useGetRuleFlowStatusQuery).toHaveBeenCalledWith(
                expect.anything(),
                {
                    skip: true,
                }
            );
        });

        it('should skip query when data is empty', () => {
            (extractData as jest.Mock).mockReturnValue({});

            renderHook(() => useTestCasesController({}));

            expect(useGetRuleFlowStatusQuery).toHaveBeenCalledWith(
                expect.anything(),
                {
                    skip: true,
                }
            );
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing query data', () => {
            (useGetRuleFlowStatusQuery as jest.Mock).mockReturnValue({
                data: undefined,
                isLoading: false,
            });

            const { result } = renderHook(() => useTestCasesController({}));

            expect(result.current.values.flowStatus).toBeUndefined();
        });

        it('should handle missing nested data', () => {
            (useGetRuleFlowStatusQuery as jest.Mock).mockReturnValue({
                data: {
                    data: undefined,
                },
                isLoading: false,
            });

            const { result } = renderHook(() => useTestCasesController({}));

            expect(result.current.values.flowStatus).toBeUndefined();
        });

        it('should handle empty string flowStatus', () => {
            (useGetRuleFlowStatusQuery as jest.Mock).mockReturnValue({
                data: {
                    data: {
                        statusInProgress: true,
                        flowStatus: '',
                    },
                },
                isLoading: false,
            });

            const { result } = renderHook(() => useTestCasesController({}));

            expect(result.current.values.flowStatus).toBe('');
        });

        it('should handle null flowStatus', () => {
            (useGetRuleFlowStatusQuery as jest.Mock).mockReturnValue({
                data: {
                    data: {
                        statusInProgress: true,
                        flowStatus: null,
                    },
                },
                isLoading: false,
            });

            const { result } = renderHook(() => useTestCasesController({}));

            expect(result.current.values.flowStatus).toBeNull();
        });
    });

    describe('Return Structure', () => {
        it('should return correct values structure', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            expect(result.current.values).toHaveProperty('flowStatus');
            expect(result.current.values).toHaveProperty('isInitial');
            expect(result.current.values).toHaveProperty('isPassed');
            expect(result.current.values).toHaveProperty('isFailed');
            expect(result.current.values).toHaveProperty('isLoadingFlow');
            expect(result.current.values).toHaveProperty('statusConfig');
        });

        it('should return correct functions structure', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            expect(result.current.functions).toHaveProperty('handleNext');
            expect(result.current.functions).toHaveProperty('handleBack');
            expect(result.current.functions).toHaveProperty('handleCanvas');
        });

        it('should have function types for all handlers', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            expect(typeof result.current.functions.handleNext).toBe('function');
            expect(typeof result.current.functions.handleBack).toBe('function');
            expect(typeof result.current.functions.handleCanvas).toBe('function');
        });
    });

    describe('Context Integration', () => {
        it('should call useTab hook', () => {
            const useTab = require('../../../../src/contexts/TabContext/useTab').useTab;

            renderHook(() => useTestCasesController({}));

            expect(useTab).toHaveBeenCalled();
        });

        it('should use enableNextTab from context', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            act(() => {
                result.current.functions.handleNext();
            });

            expect(mockEnableNextTab).toHaveBeenCalled();
        });

        it('should use enablePreviousTab from context', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            act(() => {
                result.current.functions.handleBack();
            });

            expect(mockEnablePreviousTab).toHaveBeenCalled();
        });
    });

    describe('Status Configuration', () => {
        it('should return statusConfig with all required properties', () => {
            const { result } = renderHook(() => useTestCasesController({}));

            const config = result.current.values.statusConfig;
            expect(config).toHaveProperty('title');
            expect(config).toHaveProperty('description');
            expect(config).toHaveProperty('buttonText');
            expect(config).toHaveProperty('color');
            expect(config).toHaveProperty('bgColor');
            expect(config).toHaveProperty('icon');
        });

        it('should have different configs for different statuses', () => {
            (useGetRuleFlowStatusQuery as jest.Mock).mockReturnValue({
                data: {
                    data: {
                        statusInProgress: true,
                        flowStatus: 'initial',
                    },
                },
                isLoading: false,
            });

            const { result: result1 } = renderHook(() => useTestCasesController({}));
            const initialConfig = result1.current.values.statusConfig;

            (useGetRuleFlowStatusQuery as jest.Mock).mockReturnValue({
                data: {
                    data: {
                        statusInProgress: false,
                        flowStatus: 'pass',
                    },
                },
                isLoading: false,
            });

            const { result: result2 } = renderHook(() => useTestCasesController({}));
            const passConfig = result2.current.values.statusConfig;

            expect(initialConfig.title).not.toBe(passConfig.title);
            expect(initialConfig.color).not.toBe(passConfig.color);
        });
    });
});
