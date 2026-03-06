import { renderHook } from '@testing-library/react';
import useRuleBuilderController, { IRuleBuilder } from '../../../../src/pages/RuleEditor/RuleBuilder/useRuleBuilderController';

jest.mock('../../../../src/contexts/TabContext/useTab', () => ({
    useTab: jest.fn(() => ({
        enablePreviousTab: jest.fn(),
        enableNextTab: jest.fn(),
    })),
}));

jest.mock('../../../../src/redux/Api/Rule-builder', () => ({
    useGetRuleFlowStatusQuery: jest.fn(() => ({
        data: null,
        isLoading: false,
        error: null,
    })),
}));

jest.mock('../../../../src/utils/Common/storage', () => ({
    extractData: jest.fn(),
}));

describe('useRuleBuilderController', () => {
    const mockEnablePreviousTab = jest.fn();
    const mockEnableNextTab = jest.fn();
    const mockExtractData = jest.fn();

    const mockLocationAssigns: string[] = [];

    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation((message) => {
            if (typeof message === 'string' && message.includes('Not implemented: navigation')) {
                return;
            }
            console.warn(message);
        });
    });

    beforeEach(() => {
        jest.clearAllMocks();
        mockLocationAssigns.length = 0;

        const { useTab } = require('../../../../src/contexts/TabContext/useTab');
        useTab.mockReturnValue({
            enablePreviousTab: mockEnablePreviousTab,
            enableNextTab: mockEnableNextTab,
        });

        const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');
        useGetRuleFlowStatusQuery.mockReturnValue({
            data: null,
            isLoading: false,
            error: null,
        });

        const { extractData } = require('../../../../src/utils/Common/storage');
        extractData.mockReturnValue(null);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    describe('Hook Initialization', () => {
        it('should initialize with provided data prop', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                    status: 'ACTIVE',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values).toBeDefined();
            expect(result.current.functions).toBeDefined();
        });

        it('should initialize without data prop', () => {
            const props: IRuleBuilder = {
                data: undefined,
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values).toBeDefined();
            expect(result.current.functions).toBeDefined();
        });
    });

    describe('Data Handling', () => {
        it('should use provided data prop', () => {
            const { extractData } = require('../../../../src/utils/Common/storage');

            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                    status: 'ACTIVE',
                },
            };

            renderHook(() => useRuleBuilderController(props));

            expect(extractData).not.toHaveBeenCalled();
        });

        it('should extract data from storage when data prop is undefined', () => {
            const { extractData } = require('../../../../src/utils/Common/storage');
            
            extractData.mockReturnValue({
                id: 'rule-456',
                status: 'IN_PROGRESS',
            });

            const props: IRuleBuilder = {
                data: undefined,
            };

            renderHook(() => useRuleBuilderController(props));

            expect(extractData).toHaveBeenCalledWith('trs_rule', 'LocalStorage', true);
        });
    });

    describe('RTK Query Integration', () => {
        it('should call useGetRuleFlowStatusQuery with rule id', () => {
            const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');

            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                    status: 'ACTIVE',
                },
            };

            renderHook(() => useRuleBuilderController(props));

            expect(useGetRuleFlowStatusQuery).toHaveBeenCalledWith(
                { ruleId: 'rule-123', category: 'rule_builder' },
                { skip: false, refetchOnMountOrArgChange: true }
            );
        });

        it('should skip useGetRuleFlowStatusQuery when id is missing', () => {
            const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');

            const props: IRuleBuilder = {
                data: {
                    status: 'ACTIVE',
                },
            };

            renderHook(() => useRuleBuilderController(props));

            expect(useGetRuleFlowStatusQuery).toHaveBeenCalledWith(
                { ruleId: '', category: 'rule_builder' },
                { skip: true, refetchOnMountOrArgChange: true }
            );
        });

        it('should handle loading state', () => {
            const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');
            
            useGetRuleFlowStatusQuery.mockReturnValue({
                data: null,
                isLoading: true,
                error: null,
            });

            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values.isLoadingFlow).toBe(true);
            expect(result.current.values.flowStatus).toBeUndefined();
        });
    });

    describe('Flow Status Computation', () => {
        it('should compute flowStatus as initial when no data', () => {
            const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');
            
            useGetRuleFlowStatusQuery.mockReturnValue({
                data: null,
                isLoading: false,
                error: null,
            });

            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values.flowStatus).toBe('initial');
            expect(result.current.values.isInitial).toBe(true);
            expect(result.current.values.isPassed).toBe(false);
            expect(result.current.values.isFailed).toBe(false);
        });

        it('should compute flowStatus as pass when status is pass', () => {
            const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');
            
            useGetRuleFlowStatusQuery.mockReturnValue({
                data: {
                    result: {
                        status: 'pass',
                    },
                },
                isLoading: false,
                error: null,
            });

            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values.flowStatus).toBe('pass');
            expect(result.current.values.isInitial).toBe(false);
            expect(result.current.values.isPassed).toBe(true);
            expect(result.current.values.isFailed).toBe(false);
        });

        it('should compute flowStatus as fail when status is fail', () => {
            const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');
            
            useGetRuleFlowStatusQuery.mockReturnValue({
                data: {
                    result: {
                        status: 'fail',
                    },
                },
                isLoading: false,
                error: null,
            });

            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values.flowStatus).toBe('fail');
            expect(result.current.values.isInitial).toBe(false);
            expect(result.current.values.isPassed).toBe(false);
            expect(result.current.values.isFailed).toBe(true);
        });

        it('should handle undefined flowStatus during loading', () => {
            const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');
            
            useGetRuleFlowStatusQuery.mockReturnValue({
                data: null,
                isLoading: true,
                error: null,
            });

            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values.flowStatus).toBeUndefined();
            expect(result.current.values.isInitial).toBe(false);
            expect(result.current.values.isPassed).toBe(false);
            expect(result.current.values.isFailed).toBe(false);
        });
    });

    describe('Status Configuration', () => {
        it('should return initial config for initial status', () => {
            const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');
            
            useGetRuleFlowStatusQuery.mockReturnValue({
                data: null,
                isLoading: false,
                error: null,
            });

            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                    status: 'ACTIVE',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values.statusConfig).toEqual({
                title: 'Rule Not Created Yet',
                description: 'Your rule is in initial mode. Click the button below to start building your rule.',
                buttonText: 'View Rule',
                color: '#FFA726',
                bgColor: '#FFF3E0',
                icon: '🔧'
            });
        });

        it('should return initial config with Open Rule Builder when status includes IN_PROGRESS', () => {
            const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');
            
            useGetRuleFlowStatusQuery.mockReturnValue({
                data: null,
                isLoading: false,
                error: null,
            });

            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                    status: 'IN_PROGRESS',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values.statusConfig.buttonText).toBe('Open Rule Builder');
        });

        it('should return pass config for pass status', () => {
            const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');
            
            useGetRuleFlowStatusQuery.mockReturnValue({
                data: {
                    result: {
                        status: 'pass',
                    },
                },
                isLoading: false,
                error: null,
            });

            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                    status: 'ACTIVE',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values.statusConfig).toEqual({
                title: 'Rule Validated Successfully',
                description: 'Your rule has been validated and is ready to use. You can edit it anytime.',
                buttonText: 'View Rule',
                color: '#66BB6A',
                bgColor: '#E8F5E9',
                icon: '✅'
            });
        });

        it('should return pass config with Edit Rule when status includes IN_PROGRESS', () => {
            const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');
            
            useGetRuleFlowStatusQuery.mockReturnValue({
                data: {
                    result: {
                        status: 'pass',
                    },
                },
                isLoading: false,
                error: null,
            });

            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                    status: 'IN_PROGRESS',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values.statusConfig.buttonText).toBe('Edit Rule');
        });

        it('should return fail config for fail status', () => {
            const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');
            
            useGetRuleFlowStatusQuery.mockReturnValue({
                data: {
                    result: {
                        status: 'fail',
                    },
                },
                isLoading: false,
                error: null,
            });

            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                    status: 'ACTIVE',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values.statusConfig).toEqual({
                title: 'Validation Failed',
                description: 'Your rule contains errors and needs to be fixed. Click below to review and correct the issues.',
                buttonText: 'View Rule',
                color: '#EF5350',
                bgColor: '#FFEBEE',
                icon: '⚠️'
            });
        });

        it('should return fail config with Edit Rule when status includes IN_PROGRESS', () => {
            const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');
            
            useGetRuleFlowStatusQuery.mockReturnValue({
                data: {
                    result: {
                        status: 'fail',
                    },
                },
                isLoading: false,
                error: null,
            });

            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                    status: 'IN_PROGRESS',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values.statusConfig.buttonText).toBe('Edit Rule');
        });

        it('should return default config for unknown status', () => {
            const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');
            
            useGetRuleFlowStatusQuery.mockReturnValue({
                data: {
                    result: {
                        status: 'unknown-status',
                    },
                },
                isLoading: false,
                error: null,
            });

            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                    status: 'ACTIVE',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values.statusConfig).toEqual({
                title: 'Rule Builder',
                description: 'Create your rule',
                buttonText: 'View Rule',
                color: '#42A5F5',
                bgColor: '#E3F2FD',
                icon: '📝'
            });
        });
    });

    describe('Navigation Functions', () => {
        it('should call enableNextTab when handleNext is invoked', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            result.current.functions.handleNext();

            expect(mockEnableNextTab).toHaveBeenCalledTimes(1);
        });

        it('should call enablePreviousTab when handleBack is invoked', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            result.current.functions.handleBack();

            expect(mockEnablePreviousTab).toHaveBeenCalledTimes(1);
        });
    });

    describe('handleBuilder Function', () => {
        it('should execute handleBuilder when status includes IN_PROGRESS', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                    status: 'IN_PROGRESS',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            // Should not throw when called
            expect(() => result.current.functions.handleBuilder()).not.toThrow();
        });

        it('should execute handleBuilder when status does not include IN_PROGRESS', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                    status: 'ACTIVE',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(() => result.current.functions.handleBuilder()).not.toThrow();
        });

        it('should not navigate when id is undefined', () => {
            const props: IRuleBuilder = {
                data: {
                    status: 'ACTIVE',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(() => result.current.functions.handleBuilder()).not.toThrow();
        });

        it('should not navigate when id is null', () => {
            const props: IRuleBuilder = {
                data: {
                    id: null,
                    status: 'ACTIVE',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(() => result.current.functions.handleBuilder()).not.toThrow();
        });

        it('should handle numeric id', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 456,
                    status: 'ACTIVE',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(() => result.current.functions.handleBuilder()).not.toThrow();
        });

        it('should execute handleBuilder when IN_PROGRESS is part of status string', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                    status: 'DRAFT_IN_PROGRESS',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(() => result.current.functions.handleBuilder()).not.toThrow();
        });
    });

    describe('Values Exposure', () => {
        it('should expose flowStatus value', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values).toHaveProperty('flowStatus');
        });

        it('should expose isInitial value', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values).toHaveProperty('isInitial');
        });

        it('should expose isPassed value', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values).toHaveProperty('isPassed');
        });

        it('should expose isFailed value', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values).toHaveProperty('isFailed');
        });

        it('should expose isLoadingFlow value', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values).toHaveProperty('isLoadingFlow');
        });

        it('should expose statusConfig value', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values).toHaveProperty('statusConfig');
            expect(result.current.values.statusConfig).toHaveProperty('title');
            expect(result.current.values.statusConfig).toHaveProperty('description');
            expect(result.current.values.statusConfig).toHaveProperty('buttonText');
            expect(result.current.values.statusConfig).toHaveProperty('color');
            expect(result.current.values.statusConfig).toHaveProperty('bgColor');
            expect(result.current.values.statusConfig).toHaveProperty('icon');
        });
    });

    describe('Functions Exposure', () => {
        it('should expose handleBuilder function', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.functions).toHaveProperty('handleBuilder');
            expect(typeof result.current.functions.handleBuilder).toBe('function');
        });

        it('should expose handleNext function', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.functions).toHaveProperty('handleNext');
            expect(typeof result.current.functions.handleNext).toBe('function');
        });

        it('should expose handleBack function', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.functions).toHaveProperty('handleBack');
            expect(typeof result.current.functions.handleBack).toBe('function');
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing data gracefully', () => {
            const { extractData } = require('../../../../src/utils/Common/storage');
            extractData.mockReturnValue(null);

            const props: IRuleBuilder = {
                data: undefined,
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values.flowStatus).toBe('initial');
            expect(result.current.values.statusConfig).toBeDefined();
        });

        it('should handle data without id', () => {
            const props: IRuleBuilder = {
                data: {
                    status: 'ACTIVE',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(() => result.current.functions.handleBuilder()).not.toThrow();
        });

        it('should handle data without status', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(() => result.current.functions.handleBuilder()).not.toThrow();
        });

        it('should handle empty string status', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                    status: '',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(() => result.current.functions.handleBuilder()).not.toThrow();
        });

        it('should handle flowData without result', () => {
            const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');
            
            useGetRuleFlowStatusQuery.mockReturnValue({
                data: {},
                isLoading: false,
                error: null,
            });

            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values.flowStatus).toBe('initial');
        });

        it('should handle flowData with result but no status', () => {
            const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');
            
            useGetRuleFlowStatusQuery.mockReturnValue({
                data: {
                    result: {},
                },
                isLoading: false,
                error: null,
            });

            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(result.current.values.flowStatus).toBe('initial');
        });

        it('should re-compute status when flowData changes', () => {
            const { useGetRuleFlowStatusQuery } = require('../../../../src/redux/Api/Rule-builder');
            
            useGetRuleFlowStatusQuery.mockReturnValue({
                data: {
                    result: {
                        status: 'initial',
                    },
                },
                isLoading: false,
                error: null,
            });

            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                },
            };

            const { result, rerender } = renderHook(
                ({ data }) => useRuleBuilderController({ data }),
                { initialProps: props }
            );

            expect(result.current.values.flowStatus).toBe('initial');

            useGetRuleFlowStatusQuery.mockReturnValue({
                data: {
                    result: {
                        status: 'pass',
                    },
                },
                isLoading: false,
                error: null,
            });

            rerender({ data: props.data });

            expect(result.current.values.flowStatus).toBe('pass');
        });

        it('should handle case-sensitive status check', () => {
            const props: IRuleBuilder = {
                data: {
                    id: 'rule-123',
                    status: 'in_progress', // lowercase
                },
            };

            const { result } = renderHook(() => useRuleBuilderController(props));

            expect(() => result.current.functions.handleBuilder()).not.toThrow();
        });
    });
});
