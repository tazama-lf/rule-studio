import { configureStore } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query/react';
import {
    ruleBuilderApi,
    useGetNodesQuery,
    useGetFlowQuery,
    useSaveFlowMutation,
    useGetGlobalVariablesQuery,
    useLazyGetGlobalVariablesQuery,
    useExecuteQueryMutation,
    useGetRuleFlowStatusQuery,
    useGetAllFlowQuery,
} from '../../../../src/redux/Api/Rule-builder';
import { getAuthToken } from '../../../../src/utils/Common/storage';

type RuleBuilderTestGlobal = typeof global & {
    __ruleBuilderInnerBaseQuery: jest.Mock;
    __ruleBuilderPrepareHeaders: ((headers: Headers) => Headers) | undefined;
};

jest.mock('@reduxjs/toolkit/query/react', () => {
    const actual = jest.requireActual<typeof import('@reduxjs/toolkit/query/react')>('@reduxjs/toolkit/query/react');
    const innerMock = jest.fn();
    (global as RuleBuilderTestGlobal).__ruleBuilderInnerBaseQuery = innerMock;
    return {
        ...actual,
        fetchBaseQuery: jest.fn((config: { prepareHeaders?: (headers: Headers) => Headers }) => {
            (global as RuleBuilderTestGlobal).__ruleBuilderPrepareHeaders = config?.prepareHeaders;
            return innerMock;
        }),
    };
});

jest.mock('../../../../src/utils/Common/storage', () => ({
    getAuthToken: jest.fn(),
    extractData: jest.fn(),
    getAuthTokenType: jest.fn(),
}));

const mockedGetAuthToken = getAuthToken as jest.Mock;

const mockBaseQuery = jest.fn();

const testRuleBuilderApi = createApi({
    reducerPath: 'testRuleBuilderApi',
    baseQuery: mockBaseQuery,
    endpoints: (builder) => ({
        getNodes: builder.query({
            query: (category: string = 'rule_builder') => ({
                url: `nodes?category=${category}`,
                method: 'GET',
            }),
        }),
        getFlow: builder.query({
            query: ({ ruleId, category = 'rule_builder' }: { ruleId: string | number; category?: string }) => ({
                url: `rules/api/${ruleId}/flow?category=${category}`,
                method: 'GET',
            }),
        }),
        getAllFlow: builder.query({
            query: ({ ruleId }: { ruleId: string | number }) => ({
                url: `rules/api/${ruleId}/flow`,
                method: 'GET',
            }),
        }),
        saveFlow: builder.mutation({
            query: ({ ruleId, flowData, category = 'rule_builder' }: { ruleId: string | number; flowData: unknown; category?: string }) => ({
                url: `rules/api/${ruleId}/flow`,
                method: 'PUT',
                body: { ...(flowData as Record<string, unknown>), category },
            }),
        }),
        getGlobalVariables: builder.query({
            query: (ruleId: string) => ({
                url: `rules/api/global-variables/${ruleId}`,
                method: 'GET',
            }),
        }),
        executeQuery: builder.mutation({
            query: (queryData: Record<string, unknown>) => ({
                url: 'nodes/execute-query',
                method: 'POST',
                body: queryData,
            }),
        }),
        getRuleFlowStatus: builder.query({
            query: ({ ruleId, category = 'rule_builder' }: { ruleId: string | number; category?: string }) => ({
                url: `rules/api/${ruleId}/flow/status?category=${category}`,
                method: 'GET',
            }),
        }),
    }),
});

const makeRealStore = () =>
    configureStore({
        reducer: { [ruleBuilderApi.reducerPath]: ruleBuilderApi.reducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(ruleBuilderApi.middleware),
    });

const makeTestStore = () =>
    configureStore({
        reducer: { [testRuleBuilderApi.reducerPath]: testRuleBuilderApi.reducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(testRuleBuilderApi.middleware),
    });

const makeRealEndpointStore = () =>
    configureStore({
        reducer: { [ruleBuilderApi.reducerPath]: ruleBuilderApi.reducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(ruleBuilderApi.middleware),
    });

const getRealInnerMock = () =>
    (global as RuleBuilderTestGlobal).__ruleBuilderInnerBaseQuery;

const getCapturedPrepareHeaders = (): ((headers: Headers) => Headers) | undefined =>
    (global as RuleBuilderTestGlobal).__ruleBuilderPrepareHeaders;

describe('ruleBuilderApi (redux/Api/Rule-builder)', () => {
    describe('Module Structure', () => {
        it('should export ruleBuilderApi', () => {
            expect(ruleBuilderApi).toBeDefined();
        });

        it('should have reducerPath "ruleBuilderApi"', () => {
            expect(ruleBuilderApi.reducerPath).toBe('ruleBuilderApi');
        });

        it('should expose a reducer function', () => {
            expect(typeof ruleBuilderApi.reducer).toBe('function');
        });

        it('should expose middleware as a function', () => {
            expect(typeof ruleBuilderApi.middleware).toBe('function');
        });

        it('should define the getNodes endpoint', () => {
            expect(ruleBuilderApi.endpoints.getNodes).toBeDefined();
        });

        it('should define the getFlow endpoint', () => {
            expect(ruleBuilderApi.endpoints.getFlow).toBeDefined();
        });

        it('should define the getAllFlow endpoint', () => {
            expect(ruleBuilderApi.endpoints.getAllFlow).toBeDefined();
        });

        it('should define the saveFlow endpoint', () => {
            expect(ruleBuilderApi.endpoints.saveFlow).toBeDefined();
        });

        it('should define the getGlobalVariables endpoint', () => {
            expect(ruleBuilderApi.endpoints.getGlobalVariables).toBeDefined();
        });

        it('should define the executeQuery endpoint', () => {
            expect(ruleBuilderApi.endpoints.executeQuery).toBeDefined();
        });

        it('should define the getRuleFlowStatus endpoint', () => {
            expect(ruleBuilderApi.endpoints.getRuleFlowStatus).toBeDefined();
        });

        it('should export useGetNodesQuery as a function', () => {
            expect(typeof useGetNodesQuery).toBe('function');
        });

        it('should export useGetFlowQuery as a function', () => {
            expect(typeof useGetFlowQuery).toBe('function');
        });

        it('should export useGetAllFlowQuery as a function', () => {
            expect(typeof useGetAllFlowQuery).toBe('function');
        });

        it('should export useSaveFlowMutation as a function', () => {
            expect(typeof useSaveFlowMutation).toBe('function');
        });

        it('should export useGetGlobalVariablesQuery as a function', () => {
            expect(typeof useGetGlobalVariablesQuery).toBe('function');
        });

        it('should export useLazyGetGlobalVariablesQuery as a function', () => {
            expect(typeof useLazyGetGlobalVariablesQuery).toBe('function');
        });

        it('should export useExecuteQueryMutation as a function', () => {
            expect(typeof useExecuteQueryMutation).toBe('function');
        });

        it('should export useGetRuleFlowStatusQuery as a function', () => {
            expect(typeof useGetRuleFlowStatusQuery).toBe('function');
        });
    });

    describe('Redux store integration', () => {
        it('should initialise ruleBuilderApi state when added to a store', () => {
            const store = makeRealStore();
            expect(store.getState()[ruleBuilderApi.reducerPath]).toBeDefined();
        });

        it('should start with an empty queries map', () => {
            const store = makeRealStore();
            expect(store.getState()[ruleBuilderApi.reducerPath].queries).toEqual({});
        });

        it('should start with an empty mutations map', () => {
            const store = makeRealStore();
            expect(store.getState()[ruleBuilderApi.reducerPath].mutations).toEqual({});
        });
    });

    describe('getNodes endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: [] });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the GET method', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getNodes.initiate('rule_builder'));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should include the category in the URL with default value', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getNodes.initiate('rule_builder'));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('nodes?category=rule_builder');
        });

        it('should include a custom category in the URL', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getNodes.initiate('test_case'));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('nodes?category=test_case');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getNodes.initiate('rule_builder'));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('getNodes endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            const nodes = [{ id: 1, name: 'SetVariable' }];
            mockBaseQuery.mockResolvedValue({ data: nodes });
            const result = await store.dispatch(testRuleBuilderApi.endpoints.getNodes.initiate('rule_builder'));
            expect((result as { data?: unknown }).data).toEqual(nodes);
        });

        it('should return an error payload on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Internal Server Error' } });
            const result = await store.dispatch(testRuleBuilderApi.endpoints.getNodes.initiate('rule_builder'));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should handle a network error', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));
            const result = await store.dispatch(testRuleBuilderApi.endpoints.getNodes.initiate('rule_builder'));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('getFlow endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { nodes: [], edges: [] } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the GET method', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getFlow.initiate({ ruleId: '123' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should include ruleId and default category in the URL', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getFlow.initiate({ ruleId: '123' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('rules/api/123/flow?category=rule_builder');
        });

        it('should interpolate a numeric ruleId correctly', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getFlow.initiate({ ruleId: 42 }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('rules/api/42/flow?category=rule_builder');
        });

        it('should use a custom category when provided', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getFlow.initiate({ ruleId: '5', category: 'test_case' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('rules/api/5/flow?category=test_case');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getFlow.initiate({ ruleId: '1' }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('getFlow endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            const flow = { nodes: [{ id: '1' }], edges: [] };
            mockBaseQuery.mockResolvedValue({ data: flow });
            const result = await store.dispatch(testRuleBuilderApi.endpoints.getFlow.initiate({ ruleId: '1' }));
            expect((result as { data?: unknown }).data).toEqual(flow);
        });

        it('should return an error payload on a 404 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 404, data: 'Not Found' } });
            const result = await store.dispatch(testRuleBuilderApi.endpoints.getFlow.initiate({ ruleId: 'missing' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('getAllFlow endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: [] });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the GET method', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getAllFlow.initiate({ ruleId: '10' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should build the URL without a category query param', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getAllFlow.initiate({ ruleId: '10' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('rules/api/10/flow');
        });

        it('should interpolate a numeric ruleId', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getAllFlow.initiate({ ruleId: 99 }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('rules/api/99/flow');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getAllFlow.initiate({ ruleId: '1' }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('getAllFlow endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return combined flow data on success', async () => {
            const allFlow = [{ category: 'rule_builder', nodes: [] }, { category: 'test_case', nodes: [] }];
            mockBaseQuery.mockResolvedValue({ data: allFlow });
            const result = await store.dispatch(testRuleBuilderApi.endpoints.getAllFlow.initiate({ ruleId: '10' }));
            expect((result as { data?: unknown }).data).toEqual(allFlow);
        });

        it('should return an error on failure', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Error' } });
            const result = await store.dispatch(testRuleBuilderApi.endpoints.getAllFlow.initiate({ ruleId: '10' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('saveFlow endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { success: true } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the PUT method', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.saveFlow.initiate({ ruleId: '1', flowData: {} }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.method).toBe('PUT');
        });

        it('should build the URL with the ruleId', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.saveFlow.initiate({ ruleId: '7', flowData: {} }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('rules/api/7/flow');
        });

        it('should include the default category in the body', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.saveFlow.initiate({ ruleId: '1', flowData: { nodes: [] } }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ body: Record<string, unknown> }];
            expect(arg.body.category).toBe('rule_builder');
        });

        it('should use a custom category in the body when provided', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.saveFlow.initiate({ ruleId: '1', flowData: {}, category: 'test_case' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ body: Record<string, unknown> }];
            expect(arg.body.category).toBe('test_case');
        });

        it('should spread flowData fields into the body', async () => {
            const flowData = { nodes: [{ id: 'n1' }], edges: [{ id: 'e1' }] };
            await store.dispatch(testRuleBuilderApi.endpoints.saveFlow.initiate({ ruleId: '1', flowData }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ body: Record<string, unknown> }];
            expect(arg.body.nodes).toEqual(flowData.nodes);
            expect(arg.body.edges).toEqual(flowData.edges);
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.saveFlow.initiate({ ruleId: '1', flowData: {} }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('saveFlow endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { success: true } });
            const result = await store.dispatch(testRuleBuilderApi.endpoints.saveFlow.initiate({ ruleId: '1', flowData: {} }));
            expect((result as { data?: unknown }).data).toEqual({ success: true });
        });

        it('should return an error payload on a 400 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 400, data: 'Bad Request' } });
            const result = await store.dispatch(testRuleBuilderApi.endpoints.saveFlow.initiate({ ruleId: '1', flowData: {} }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should record the mutation in the store after dispatch', async () => {
            mockBaseQuery.mockResolvedValue({ data: { success: true } });
            await store.dispatch(testRuleBuilderApi.endpoints.saveFlow.initiate({ ruleId: '1', flowData: {} }));
            const mutationsMap = store.getState()[testRuleBuilderApi.reducerPath].mutations;
            expect(Object.keys(mutationsMap).length).toBeGreaterThan(0);
        });
    });

    describe('getGlobalVariables endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: {} });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the GET method', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getGlobalVariables.initiate('rule-42'));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should build the URL with the ruleId', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getGlobalVariables.initiate('rule-42'));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('rules/api/global-variables/rule-42');
        });

        it('should interpolate different ruleIds correctly', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getGlobalVariables.initiate('rule-99'));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('rules/api/global-variables/rule-99');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getGlobalVariables.initiate('rule-1'));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('getGlobalVariables endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            const vars = { RuleRequest: { amount: 0 } };
            mockBaseQuery.mockResolvedValue({ data: vars });
            const result = await store.dispatch(testRuleBuilderApi.endpoints.getGlobalVariables.initiate('rule-1'));
            expect((result as { data?: unknown }).data).toEqual(vars);
        });

        it('should return an error payload on a 404 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 404, data: 'Not Found' } });
            const result = await store.dispatch(testRuleBuilderApi.endpoints.getGlobalVariables.initiate('missing'));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should handle a network error', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));
            const result = await store.dispatch(testRuleBuilderApi.endpoints.getGlobalVariables.initiate('rule-1'));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('executeQuery endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { rows: [], fields: [] } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the POST method', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.executeQuery.initiate({ query: 'SELECT 1' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.method).toBe('POST');
        });

        it('should target the "nodes/execute-query" URL', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.executeQuery.initiate({ query: 'SELECT 1' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('nodes/execute-query');
        });

        it('should include the query data as the body', async () => {
            const queryData = { query: 'SELECT * FROM transactions', params: ['tenant-1'] };
            await store.dispatch(testRuleBuilderApi.endpoints.executeQuery.initiate(queryData));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ body: unknown }];
            expect(arg.body).toEqual(queryData);
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.executeQuery.initiate({ query: 'SELECT 1' }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('executeQuery endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return rows and fields on a successful response', async () => {
            const response = { rows: [{ id: 1 }], fields: [{ name: 'id' }] };
            mockBaseQuery.mockResolvedValue({ data: response });
            const result = await store.dispatch(testRuleBuilderApi.endpoints.executeQuery.initiate({ query: 'SELECT 1' }));
            expect((result as { data?: unknown }).data).toEqual(response);
        });

        it('should return an error payload on a 400 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 400, data: 'Syntax Error' } });
            const result = await store.dispatch(testRuleBuilderApi.endpoints.executeQuery.initiate({ query: 'INVALID SQL' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should return an error payload on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Internal Error' } });
            const result = await store.dispatch(testRuleBuilderApi.endpoints.executeQuery.initiate({ query: 'SELECT 1' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should handle a network error', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));
            const result = await store.dispatch(testRuleBuilderApi.endpoints.executeQuery.initiate({ query: 'SELECT 1' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should record the mutation in the store after dispatch', async () => {
            mockBaseQuery.mockResolvedValue({ data: { rows: [], fields: [] } });
            await store.dispatch(testRuleBuilderApi.endpoints.executeQuery.initiate({ query: 'SELECT 1' }));
            const mutationsMap = store.getState()[testRuleBuilderApi.reducerPath].mutations;
            expect(Object.keys(mutationsMap).length).toBeGreaterThan(0);
        });
    });

    describe('getRuleFlowStatus endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { status: 'passed' } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the GET method', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getRuleFlowStatus.initiate({ ruleId: '5' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should build the URL with ruleId and default category', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getRuleFlowStatus.initiate({ ruleId: '5' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('rules/api/5/flow/status?category=rule_builder');
        });

        it('should use a custom category when provided', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getRuleFlowStatus.initiate({ ruleId: '5', category: 'test_case' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('rules/api/5/flow/status?category=test_case');
        });

        it('should interpolate a numeric ruleId correctly', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getRuleFlowStatus.initiate({ ruleId: 12 }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('rules/api/12/flow/status?category=rule_builder');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRuleBuilderApi.endpoints.getRuleFlowStatus.initiate({ ruleId: '1' }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('getRuleFlowStatus endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return status data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { status: 'passed' } });
            const result = await store.dispatch(testRuleBuilderApi.endpoints.getRuleFlowStatus.initiate({ ruleId: '1' }));
            expect((result as { data?: unknown }).data).toEqual({ status: 'passed' });
        });

        it('should return an error payload on a 404 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 404, data: 'Not Found' } });
            const result = await store.dispatch(testRuleBuilderApi.endpoints.getRuleFlowStatus.initiate({ ruleId: 'missing' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should handle a network error', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));
            const result = await store.dispatch(testRuleBuilderApi.endpoints.getRuleFlowStatus.initiate({ ruleId: '1' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('prepareHeaders – authorization logic', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should set the Authorization header when a token is present', () => {
            const prepareHeaders = getCapturedPrepareHeaders()!;
            mockedGetAuthToken.mockReturnValue('bearer-token-abc');
            const headers = new Headers();
            prepareHeaders(headers);
            expect(headers.get('Authorization')).toBe('Bearer bearer-token-abc');
        });

        it('should not set the Authorization header when no token is returned', () => {
            const prepareHeaders = getCapturedPrepareHeaders()!;
            mockedGetAuthToken.mockReturnValue(null);
            const headers = new Headers();
            prepareHeaders(headers);
            expect(headers.get('Authorization')).toBeNull();
        });

        it('should not set the Authorization header when token is an empty string', () => {
            const prepareHeaders = getCapturedPrepareHeaders()!;
            mockedGetAuthToken.mockReturnValue('');
            const headers = new Headers();
            prepareHeaders(headers);
            expect(headers.get('Authorization')).toBeNull();
        });

        it('should return the same headers object', () => {
            const prepareHeaders = getCapturedPrepareHeaders()!;
            mockedGetAuthToken.mockReturnValue(null);
            const headers = new Headers();
            const result = prepareHeaders(headers);
            expect(result).toBe(headers);
        });

        it('should not overwrite existing headers unrelated to authorization', () => {
            const prepareHeaders = getCapturedPrepareHeaders()!;
            mockedGetAuthToken.mockReturnValue('tok');
            const headers = new Headers({ 'content-type': 'application/json' });
            prepareHeaders(headers);
            expect(headers.get('content-type')).toBe('application/json');
            expect(headers.get('Authorization')).toBe('Bearer tok');
        });
    });

    describe('real endpoint dispatch – source coverage', () => {
        let store: ReturnType<typeof makeRealEndpointStore>;

        beforeEach(() => {
            store = makeRealEndpointStore();
            getRealInnerMock().mockResolvedValue({ data: {} });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('getNodes – query function builds the correct URL', async () => {
            await store.dispatch(ruleBuilderApi.endpoints.getNodes.initiate('rule_builder'));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('nodes?category=rule_builder');
        });

        it('getNodes – uses the default category branch when no arg given', async () => {
            await store.dispatch(ruleBuilderApi.endpoints.getNodes.initiate(undefined as never));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('nodes?category=rule_builder');
        });

        it('getFlow – query function builds the correct URL', async () => {
            await store.dispatch(ruleBuilderApi.endpoints.getFlow.initiate({ ruleId: '1' }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('rules/api/1/flow?category=rule_builder');
        });

        it('getAllFlow – query function builds the correct URL', async () => {
            await store.dispatch(ruleBuilderApi.endpoints.getAllFlow.initiate({ ruleId: '2' }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('rules/api/2/flow');
        });

        it('saveFlow – query function builds the correct URL and method', async () => {
            await store.dispatch(ruleBuilderApi.endpoints.saveFlow.initiate({ ruleId: '3', flowData: { nodes: [] } }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toBe('rules/api/3/flow');
            expect(arg.method).toBe('PUT');
        });

        it('getGlobalVariables – query function builds the correct URL', async () => {
            await store.dispatch(ruleBuilderApi.endpoints.getGlobalVariables.initiate('rule-1'));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('rules/api/global-variables/rule-1');
        });

        it('executeQuery – query function builds the correct URL and method', async () => {
            await store.dispatch(ruleBuilderApi.endpoints.executeQuery.initiate({ query: 'SELECT 1' } as never));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toBe('nodes/execute-query');
            expect(arg.method).toBe('POST');
        });

        it('getRuleFlowStatus – query function builds the correct URL', async () => {
            await store.dispatch(ruleBuilderApi.endpoints.getRuleFlowStatus.initiate({ ruleId: '5' }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('rules/api/5/flow/status?category=rule_builder');
        });
    });
});
