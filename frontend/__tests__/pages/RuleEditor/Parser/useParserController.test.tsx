import { renderHook, waitFor } from '@testing-library/react';
import useParserController, { IParseProps } from '../../../../src/pages/RuleEditor/Parser/useParserController';

// Mock dependencies
jest.mock('../../../../src/contexts/TabContext/useTab', () => ({
    useTab: jest.fn(() => ({
        enablePreviousTab: jest.fn(),
        enableNextTab: jest.fn(),
    })),
}));

jest.mock('../../../../src/redux/Api/Config', () => ({
    useLazyGetSamplePayloadQuery: jest.fn(() => [
        jest.fn(),
        { isFetching: false }
    ]),
}));

jest.mock('../../../../src/redux/Api/Rule-builder', () => ({
    useGetGlobalVariablesQuery: jest.fn(() => ({
        data: null,
        isLoading: false,
        error: null,
    })),
}));

jest.mock('../../../../src/utils/Common/storage', () => ({
    extractData: jest.fn(),
}));

describe('useParserController', () => {
    const mockEnablePreviousTab = jest.fn();
    const mockEnableNextTab = jest.fn();
    const mockGetPayload = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default return value for mockGetPayload
        mockGetPayload.mockReturnValue({
            unwrap: jest.fn().mockResolvedValue({}),
        });

        // Setup useTab mock
        const { useTab } = require('../../../../src/contexts/TabContext/useTab');
        useTab.mockReturnValue({
            enablePreviousTab: mockEnablePreviousTab,
            enableNextTab: mockEnableNextTab,
        });

        // Setup API mocks
        const { useLazyGetSamplePayloadQuery } = require('../../../../src/redux/Api/Config');
        useLazyGetSamplePayloadQuery.mockReturnValue([
            mockGetPayload,
            { isFetching: false }
        ]);

        const { useGetGlobalVariablesQuery } = require('../../../../src/redux/Api/Rule-builder');
        useGetGlobalVariablesQuery.mockReturnValue({
            data: null,
            isLoading: false,
            error: null,
        });

        // Setup storage mock with default return
        const { extractData } = require('../../../../src/utils/Common/storage');
        extractData.mockReturnValue(null);
    });

    describe('Hook Initialization', () => {
        it('should initialize with edit mode', () => {
            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                    txtp_version: '1.0.0',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.values.isEdit).toBe(true);
            expect(result.current.values.isView).toBe(false);
        });

        it('should initialize with view mode', () => {
            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: 'view',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.values.isEdit).toBe(false);
            expect(result.current.values.isView).toBe(true);
        });

        it('should initialize with create mode', () => {
            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: 'create',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.values.isEdit).toBe(false);
            expect(result.current.values.isView).toBe(false);
        });

        it('should initialize with null mode', () => {
            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: null,
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.values.isEdit).toBe(false);
            expect(result.current.values.isView).toBe(false);
        });
    });

    describe('Data Handling', () => {
        it('should use provided data prop', () => {
            const { extractData } = require('../../../../src/utils/Common/storage');
            
            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                    txtp_version: '1.0.0',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.values.txtp).toBe('pacs.002.001.12');
            expect(extractData).not.toHaveBeenCalled();
        });

        it('should extract data from storage when data prop is undefined', () => {
            const { extractData } = require('../../../../src/utils/Common/storage');
            
            extractData.mockReturnValue({
                id: 'rule-456',
                txtp: 'pacs.008.001.08',
                txtp_version: '2.0.0',
            });

            const props: IParseProps = {
                data: undefined,
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(extractData).toHaveBeenCalledWith('trs_rule', 'LocalStorage', true);
            expect(result.current.values.txtp).toBe('pacs.008.001.08');
        });
    });

    describe('RTK Query Integration', () => {
        it('should call useGetGlobalVariablesQuery with rule id', () => {
            const { useGetGlobalVariablesQuery } = require('../../../../src/redux/Api/Rule-builder');

            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: 'edit',
            };

            renderHook(() => useParserController(props));

            expect(useGetGlobalVariablesQuery).toHaveBeenCalledWith(
                'rule-123',
                { skip: false, refetchOnMountOrArgChange: true }
            );
        });

        it('should skip useGetGlobalVariablesQuery when id is missing', () => {
            const { useGetGlobalVariablesQuery } = require('../../../../src/redux/Api/Rule-builder');

            const props: IParseProps = {
                data: {
                    txtp: 'pacs.002.001.12',
                },
                mode: 'edit',
            };

            renderHook(() => useParserController(props));

            expect(useGetGlobalVariablesQuery).toHaveBeenCalledWith(
                undefined,
                { skip: true, refetchOnMountOrArgChange: true }
            );
        });

        it('should return global variables ruleRequest from query', () => {
            const { useGetGlobalVariablesQuery } = require('../../../../src/redux/Api/Rule-builder');
            const mockGlobalVariables = {
                RuleRequest: {
                    transaction: 'sample',
                    metadata: {},
                },
            };

            useGetGlobalVariablesQuery.mockReturnValue({
                data: mockGlobalVariables,
                isLoading: false,
                error: null,
            });

            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.values.ruleRequest).toEqual(mockGlobalVariables.RuleRequest);
        });
    });

    describe('Payload Fetching', () => {
        it('should fetch sample payload on mount when txtp is present', async () => {
            const mockPayloadData = {
                transaction: 'sample transaction',
                amount: 1000,
            };

            mockGetPayload.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue(mockPayloadData),
            });

            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                    txtp_version: '1.0.0',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            await waitFor(() => {
                expect(mockGetPayload).toHaveBeenCalledWith({
                    type: 'pacs.002.001.12',
                    version: '1.0.0',
                });
            });

            await waitFor(() => {
                expect(result.current.values.payload).toBe(JSON.stringify(mockPayloadData, null, 4));
            });
        });

        it('should not fetch sample payload when txtp is missing', () => {
            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                },
                mode: 'edit',
            };

            renderHook(() => useParserController(props));

            expect(mockGetPayload).not.toHaveBeenCalled();
        });

        it('should handle payload fetch error gracefully', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            mockGetPayload.mockReturnValue({
                unwrap: jest.fn().mockRejectedValue(new Error('Network error')),
            });

            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                    txtp_version: '1.0.0',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    'Failed to fetch sample payload:',
                    expect.any(Error)
                );
            });

            await waitFor(() => {
                expect(result.current.values.payload).toBeNull();
            });

            consoleErrorSpy.mockRestore();
        });

        it('should expose fetchJson function that fetches payload', async () => {
            const mockPayloadData = { transaction: 'test' };

            mockGetPayload.mockReturnValue({
                unwrap: jest.fn().mockResolvedValue(mockPayloadData),
            });

            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                    txtp_version: '1.0.0',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            // Clear previous call from useEffect
            mockGetPayload.mockClear();

            // Call fetchJson
            result.current.functions.fetchJson();

            await waitFor(() => {
                expect(mockGetPayload).toHaveBeenCalledWith({
                    type: 'pacs.002.001.12',
                    version: '1.0.0',
                });
            });
        });
    });

    describe('Navigation Functions', () => {
        it('should call enableNextTab when handleNext is invoked', () => {
            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            result.current.functions.handleNext();

            expect(mockEnableNextTab).toHaveBeenCalledTimes(1);
        });

        it('should call enablePreviousTab when handlePrevious is invoked', () => {
            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            result.current.functions.handlePrevious();

            expect(mockEnablePreviousTab).toHaveBeenCalledTimes(1);
        });
    });

    describe('Values Exposure', () => {
        it('should expose payload value', () => {
            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.values).toHaveProperty('payload');
        });

        it('should expose sampleLoader value', () => {
            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.values).toHaveProperty('sampleLoader');
            expect(result.current.values.sampleLoader).toBe(false);
        });

        it('should expose txtp value', () => {
            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.values).toHaveProperty('txtp');
            expect(result.current.values.txtp).toBe('pacs.002.001.12');
        });

        it('should expose isEdit and isView values', () => {
            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.values).toHaveProperty('isEdit');
            expect(result.current.values).toHaveProperty('isView');
        });

        it('should expose ruleRequest value', () => {
            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.values).toHaveProperty('ruleRequest');
        });
    });

    describe('Functions Exposure', () => {
        it('should expose fetchJson function', () => {
            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.functions).toHaveProperty('fetchJson');
            expect(typeof result.current.functions.fetchJson).toBe('function');
        });

        it('should expose handleNext function', () => {
            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.functions).toHaveProperty('handleNext');
            expect(typeof result.current.functions.handleNext).toBe('function');
        });

        it('should expose handlePrevious function', () => {
            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.functions).toHaveProperty('handlePrevious');
            expect(typeof result.current.functions.handlePrevious).toBe('function');
        });
    });

    describe('Edge Cases', () => {
        it('should handle missing data gracefully', () => {
            const { extractData } = require('../../../../src/utils/Common/storage');
            extractData.mockReturnValue(null);

            const props: IParseProps = {
                data: undefined,
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.values.txtp).toBeUndefined();
            expect(mockGetPayload).not.toHaveBeenCalled();
        });

        it('should handle data without txtp', () => {
            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.values.txtp).toBeUndefined();
            expect(mockGetPayload).not.toHaveBeenCalled();
        });

        it('should handle sampleLoader being true', () => {
            const { useLazyGetSamplePayloadQuery } = require('../../../../src/redux/Api/Config');
            useLazyGetSamplePayloadQuery.mockReturnValue([
                mockGetPayload,
                { isFetching: true }
            ]);

            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.values.sampleLoader).toBe(true);
        });

        it('should re-fetch payload when txtp changes', async () => {
            const mockPayloadData1 = { transaction: 'first' };
            const mockPayloadData2 = { transaction: 'second' };

            mockGetPayload
                .mockReturnValueOnce({
                    unwrap: jest.fn().mockResolvedValue(mockPayloadData1),
                })
                .mockReturnValueOnce({
                    unwrap: jest.fn().mockResolvedValue(mockPayloadData2),
                });

            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                    txtp_version: '1.0.0',
                },
                mode: 'edit',
            };

            const { result, rerender } = renderHook(
                ({ data, mode }) => useParserController({ data, mode }),
                { initialProps: props }
            );

            await waitFor(() => {
                expect(result.current.values.payload).toBe(JSON.stringify(mockPayloadData1, null, 4));
            });

            // Change txtp
            const newProps: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.008.001.08',
                    txtp_version: '2.0.0',
                },
                mode: 'edit',
            };

            rerender(newProps);

            await waitFor(() => {
                expect(mockGetPayload).toHaveBeenCalledWith({
                    type: 'pacs.008.001.08',
                    version: '2.0.0',
                });
            });
        });

        it('should handle empty global variables data', () => {
            const { useGetGlobalVariablesQuery } = require('../../../../src/redux/Api/Rule-builder');
            useGetGlobalVariablesQuery.mockReturnValue({
                data: {},
                isLoading: false,
                error: null,
            });

            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.values.ruleRequest).toBeUndefined();
        });

        it('should handle null global variables data', () => {
            const { useGetGlobalVariablesQuery } = require('../../../../src/redux/Api/Rule-builder');
            useGetGlobalVariablesQuery.mockReturnValue({
                data: null,
                isLoading: false,
                error: null,
            });

            const props: IParseProps = {
                data: {
                    id: 'rule-123',
                    txtp: 'pacs.002.001.12',
                },
                mode: 'edit',
            };

            const { result } = renderHook(() => useParserController(props));

            expect(result.current.values.ruleRequest).toBeUndefined();
        });
    });
});
