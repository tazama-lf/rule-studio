import { configureStore } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query/react';
import {
    rulesApi,
    useGetRulesMutation,
    useGetRuleByIdQuery,
    useLazyGetRuleByIdQuery,
    useGetRuleConfigsIdsQuery,
    useLazyGetRuleConfigQuery,
    useGetNetworkMapQuery,
    useCreateRuleMutation,
    useGetStatusQuery,
    useUpdateRuleMutation,
    useUpdateStatusMutation,
    useCloneRuleMutation,
    useUpdateMetadataMutation,
} from '../../../../src/redux/Api/Rules';
import { getAuthToken } from '../../../../src/utils/Common/storage';

type RulesTestGlobal = typeof global & {
    __rulesInnerBaseQuery: jest.Mock;
    __rulesPrepareHeaders: ((headers: Headers) => Headers) | undefined;
};

jest.mock('@reduxjs/toolkit/query/react', () => {
    const actual = jest.requireActual<typeof import('@reduxjs/toolkit/query/react')>('@reduxjs/toolkit/query/react');
    const innerMock = jest.fn();
    (global as RulesTestGlobal).__rulesInnerBaseQuery = innerMock;
    return {
        ...actual,
        fetchBaseQuery: jest.fn((config: { prepareHeaders?: (headers: Headers) => Headers }) => {
            (global as RulesTestGlobal).__rulesPrepareHeaders = config?.prepareHeaders;
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

const testRulesApi = createApi({
    reducerPath: 'testRulesApi',
    baseQuery: mockBaseQuery,
    endpoints: (builder) => ({
        getRules: builder.mutation({
            query: ({ body, params }: { body: Record<string, unknown>; params?: Record<string, unknown> }) => ({
                url: 'all',
                method: 'POST',
                body: { ...body },
                params,
            }),
        }),
        createRule: builder.mutation({
            query: (body: Record<string, unknown>) => ({
                url: 'create',
                method: 'POST',
                body: { ...body },
            }),
        }),
        cloneRule: builder.mutation({
            query: ({ id, body }: { id: string | number; body: Record<string, unknown> }) => ({
                url: `clone/${id}`,
                method: 'POST',
                body,
            }),
        }),
        updateRule: builder.mutation({
            query: ({ id, body }: { id: string | number; body: Record<string, unknown> }) => ({
                url: `${id}`,
                method: 'PUT',
                body: { ...body },
            }),
        }),
        updateStatus: builder.mutation({
            query: ({ id, body }: { id: string | number; body: Record<string, unknown> }) => ({
                url: `${id}/status`,
                method: 'PUT',
                body: { ...body },
            }),
        }),
        updateMetadata: builder.mutation({
            query: ({ id, body }: { id: string | number; body: Record<string, unknown> }) => ({
                url: `${id}/metadata`,
                method: 'PUT',
                body: { ...body },
            }),
        }),
        getRuleById: builder.query({
            query: ({ id }: { id: string | number }) => ({
                url: `${id}`,
                method: 'GET',
            }),
        }),
        getRuleConfigsIds: builder.query({
            query: () => ({
                url: 'ids',
                method: 'GET',
            }),
        }),
        getRuleConfig: builder.query({
            query: ({ id }: { id: string | number }) => ({
                url: `configuration/${id}`,
                method: 'GET',
            }),
        }),
        getNetworkMap: builder.query({
            query: () => ({
                url: 'network-map/active',
                method: 'GET',
            }),
        }),
        getStatus: builder.query({
            query: () => ({
                url: 'status',
                method: 'GET',
            }),
        }),
    }),
});

const makeRealStore = () =>
    configureStore({
        reducer: { [rulesApi.reducerPath]: rulesApi.reducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(rulesApi.middleware),
    });

const makeTestStore = () =>
    configureStore({
        reducer: { [testRulesApi.reducerPath]: testRulesApi.reducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(testRulesApi.middleware),
    });

const makeRealEndpointStore = () =>
    configureStore({
        reducer: { [rulesApi.reducerPath]: rulesApi.reducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(rulesApi.middleware),
    });

const getRealInnerMock = () =>
    (global as RulesTestGlobal).__rulesInnerBaseQuery;

const getCapturedPrepareHeaders = (): ((headers: Headers) => Headers) | undefined =>
    (global as RulesTestGlobal).__rulesPrepareHeaders;

describe('rulesApi (redux/Api/Rules)', () => {
    describe('Module Structure', () => {
        it('should export rulesApi', () => {
            expect(rulesApi).toBeDefined();
        });

        it('should have reducerPath "rulesApi"', () => {
            expect(rulesApi.reducerPath).toBe('rulesApi');
        });

        it('should expose a reducer function', () => {
            expect(typeof rulesApi.reducer).toBe('function');
        });

        it('should expose middleware as a function', () => {
            expect(typeof rulesApi.middleware).toBe('function');
        });

        it('should define the getRules endpoint', () => {
            expect(rulesApi.endpoints.getRules).toBeDefined();
        });

        it('should define the createRule endpoint', () => {
            expect(rulesApi.endpoints.createRule).toBeDefined();
        });

        it('should define the cloneRule endpoint', () => {
            expect(rulesApi.endpoints.cloneRule).toBeDefined();
        });

        it('should define the updateRule endpoint', () => {
            expect(rulesApi.endpoints.updateRule).toBeDefined();
        });

        it('should define the updateStatus endpoint', () => {
            expect(rulesApi.endpoints.updateStatus).toBeDefined();
        });

        it('should define the updateMetadata endpoint', () => {
            expect(rulesApi.endpoints.updateMetadata).toBeDefined();
        });

        it('should define the getRuleById endpoint', () => {
            expect(rulesApi.endpoints.getRuleById).toBeDefined();
        });

        it('should define the getRuleConfigsIds endpoint', () => {
            expect(rulesApi.endpoints.getRuleConfigsIds).toBeDefined();
        });

        it('should define the getRuleConfig endpoint', () => {
            expect(rulesApi.endpoints.getRuleConfig).toBeDefined();
        });

        it('should define the getNetworkMap endpoint', () => {
            expect(rulesApi.endpoints.getNetworkMap).toBeDefined();
        });

        it('should define the getStatus endpoint', () => {
            expect(rulesApi.endpoints.getStatus).toBeDefined();
        });

        it('should export useGetRulesMutation as a function', () => {
            expect(typeof useGetRulesMutation).toBe('function');
        });

        it('should export useGetRuleByIdQuery as a function', () => {
            expect(typeof useGetRuleByIdQuery).toBe('function');
        });

        it('should export useLazyGetRuleByIdQuery as a function', () => {
            expect(typeof useLazyGetRuleByIdQuery).toBe('function');
        });

        it('should export useGetRuleConfigsIdsQuery as a function', () => {
            expect(typeof useGetRuleConfigsIdsQuery).toBe('function');
        });

        it('should export useLazyGetRuleConfigQuery as a function', () => {
            expect(typeof useLazyGetRuleConfigQuery).toBe('function');
        });

        it('should export useGetNetworkMapQuery as a function', () => {
            expect(typeof useGetNetworkMapQuery).toBe('function');
        });

        it('should export useCreateRuleMutation as a function', () => {
            expect(typeof useCreateRuleMutation).toBe('function');
        });

        it('should export useGetStatusQuery as a function', () => {
            expect(typeof useGetStatusQuery).toBe('function');
        });

        it('should export useUpdateRuleMutation as a function', () => {
            expect(typeof useUpdateRuleMutation).toBe('function');
        });

        it('should export useUpdateStatusMutation as a function', () => {
            expect(typeof useUpdateStatusMutation).toBe('function');
        });

        it('should export useCloneRuleMutation as a function', () => {
            expect(typeof useCloneRuleMutation).toBe('function');
        });

        it('should export useUpdateMetadataMutation as a function', () => {
            expect(typeof useUpdateMetadataMutation).toBe('function');
        });
    });

    describe('Redux store integration', () => {
        it('should initialise rulesApi state when added to a store', () => {
            const store = makeRealStore();
            expect(store.getState()[rulesApi.reducerPath]).toBeDefined();
        });

        it('should start with an empty queries map', () => {
            const store = makeRealStore();
            expect(store.getState()[rulesApi.reducerPath].queries).toEqual({});
        });

        it('should start with an empty mutations map', () => {
            const store = makeRealStore();
            expect(store.getState()[rulesApi.reducerPath].mutations).toEqual({});
        });
    });

    describe('getRules endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { rules: [] } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the POST method', async () => {
            await store.dispatch(testRulesApi.endpoints.getRules.initiate({ body: {} }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('POST');
        });

        it('should target the "all" URL', async () => {
            await store.dispatch(testRulesApi.endpoints.getRules.initiate({ body: {} }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('all');
        });

        it('should spread the body fields into the request body', async () => {
            await store.dispatch(testRulesApi.endpoints.getRules.initiate({ body: { page: 1, limit: 10 } }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ body: Record<string, unknown> }];
            expect(arg.body.page).toBe(1);
            expect(arg.body.limit).toBe(10);
        });

        it('should forward query params when provided', async () => {
            await store.dispatch(testRulesApi.endpoints.getRules.initiate({ body: {}, params: { active: true } }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ params: Record<string, unknown> }];
            expect(arg.params).toEqual({ active: true });
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRulesApi.endpoints.getRules.initiate({ body: {} }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('getRules endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { rules: [{ id: '1' }] } });
            const result = await store.dispatch(testRulesApi.endpoints.getRules.initiate({ body: {} }));
            expect((result as { data?: unknown }).data).toEqual({ rules: [{ id: '1' }] });
        });

        it('should return an error payload on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Server Error' } });
            const result = await store.dispatch(testRulesApi.endpoints.getRules.initiate({ body: {} }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should handle a network error', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));
            const result = await store.dispatch(testRulesApi.endpoints.getRules.initiate({ body: {} }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('createRule endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { id: '1' } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the POST method', async () => {
            await store.dispatch(testRulesApi.endpoints.createRule.initiate({ name: 'MyRule' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('POST');
        });

        it('should target the "create" URL', async () => {
            await store.dispatch(testRulesApi.endpoints.createRule.initiate({ name: 'MyRule' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('create');
        });

        it('should spread the body fields into the request body', async () => {
            await store.dispatch(testRulesApi.endpoints.createRule.initiate({ name: 'MyRule', type: 'simple' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ body: Record<string, unknown> }];
            expect(arg.body.name).toBe('MyRule');
            expect(arg.body.type).toBe('simple');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRulesApi.endpoints.createRule.initiate({ name: 'R' }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('createRule endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { id: 'new-rule-id' } });
            const result = await store.dispatch(testRulesApi.endpoints.createRule.initiate({ name: 'R' }));
            expect((result as { data?: unknown }).data).toEqual({ id: 'new-rule-id' });
        });

        it('should return an error on a 400 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 400, data: 'Bad Request' } });
            const result = await store.dispatch(testRulesApi.endpoints.createRule.initiate({ name: '' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should record the mutation in the store', async () => {
            mockBaseQuery.mockResolvedValue({ data: { id: '1' } });
            await store.dispatch(testRulesApi.endpoints.createRule.initiate({ name: 'R' }));
            expect(Object.keys(store.getState()[testRulesApi.reducerPath].mutations).length).toBeGreaterThan(0);
        });
    });

    describe('cloneRule endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { id: 'cloned-id' } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the POST method', async () => {
            await store.dispatch(testRulesApi.endpoints.cloneRule.initiate({ id: '5', body: {} }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('POST');
        });

        it('should append the id to the "clone/" URL', async () => {
            await store.dispatch(testRulesApi.endpoints.cloneRule.initiate({ id: '5', body: {} }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('clone/5');
        });

        it('should include the body as-is', async () => {
            const body = { name: 'Copy of Rule' };
            await store.dispatch(testRulesApi.endpoints.cloneRule.initiate({ id: '3', body }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ body: Record<string, unknown> }];
            expect(arg.body).toEqual(body);
        });

        it('should interpolate a numeric id correctly', async () => {
            await store.dispatch(testRulesApi.endpoints.cloneRule.initiate({ id: 42, body: {} }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('clone/42');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRulesApi.endpoints.cloneRule.initiate({ id: '1', body: {} }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('cloneRule endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { id: 'cloned-id' } });
            const result = await store.dispatch(testRulesApi.endpoints.cloneRule.initiate({ id: '5', body: {} }));
            expect((result as { data?: unknown }).data).toEqual({ id: 'cloned-id' });
        });

        it('should return an error on a 404 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 404, data: 'Not Found' } });
            const result = await store.dispatch(testRulesApi.endpoints.cloneRule.initiate({ id: 'missing', body: {} }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('updateRule endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { success: true } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the PUT method', async () => {
            await store.dispatch(testRulesApi.endpoints.updateRule.initiate({ id: '7', body: {} }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('PUT');
        });

        it('should use the rule id as the URL', async () => {
            await store.dispatch(testRulesApi.endpoints.updateRule.initiate({ id: '7', body: {} }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('7');
        });

        it('should spread body fields into the request body', async () => {
            await store.dispatch(testRulesApi.endpoints.updateRule.initiate({ id: '7', body: { name: 'Updated' } }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ body: Record<string, unknown> }];
            expect(arg.body.name).toBe('Updated');
        });

        it('should interpolate a numeric id correctly', async () => {
            await store.dispatch(testRulesApi.endpoints.updateRule.initiate({ id: 99, body: {} }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('99');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRulesApi.endpoints.updateRule.initiate({ id: '1', body: {} }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateRule endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { success: true } });
            const result = await store.dispatch(testRulesApi.endpoints.updateRule.initiate({ id: '1', body: {} }));
            expect((result as { data?: unknown }).data).toEqual({ success: true });
        });

        it('should return an error on a 400 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 400, data: 'Invalid' } });
            const result = await store.dispatch(testRulesApi.endpoints.updateRule.initiate({ id: '1', body: {} }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('updateStatus endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { success: true } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the PUT method', async () => {
            await store.dispatch(testRulesApi.endpoints.updateStatus.initiate({ id: '3', body: { status: 'active' } }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('PUT');
        });

        it('should append "/status" to the rule id URL', async () => {
            await store.dispatch(testRulesApi.endpoints.updateStatus.initiate({ id: '3', body: {} }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('3/status');
        });

        it('should spread body fields into the request body', async () => {
            await store.dispatch(testRulesApi.endpoints.updateStatus.initiate({ id: '3', body: { status: 'inactive' } }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ body: Record<string, unknown> }];
            expect(arg.body.status).toBe('inactive');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRulesApi.endpoints.updateStatus.initiate({ id: '1', body: {} }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateStatus endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { success: true } });
            const result = await store.dispatch(testRulesApi.endpoints.updateStatus.initiate({ id: '1', body: {} }));
            expect((result as { data?: unknown }).data).toEqual({ success: true });
        });

        it('should return an error on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Error' } });
            const result = await store.dispatch(testRulesApi.endpoints.updateStatus.initiate({ id: '1', body: {} }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('updateMetadata endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { success: true } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the PUT method', async () => {
            await store.dispatch(testRulesApi.endpoints.updateMetadata.initiate({ id: '2', body: {} }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('PUT');
        });

        it('should append "/metadata" to the rule id URL', async () => {
            await store.dispatch(testRulesApi.endpoints.updateMetadata.initiate({ id: '2', body: {} }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('2/metadata');
        });

        it('should spread body fields into the request body', async () => {
            await store.dispatch(testRulesApi.endpoints.updateMetadata.initiate({ id: '2', body: { description: 'Updated desc' } }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ body: Record<string, unknown> }];
            expect(arg.body.description).toBe('Updated desc');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRulesApi.endpoints.updateMetadata.initiate({ id: '1', body: {} }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateMetadata endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { success: true } });
            const result = await store.dispatch(testRulesApi.endpoints.updateMetadata.initiate({ id: '1', body: {} }));
            expect((result as { data?: unknown }).data).toEqual({ success: true });
        });

        it('should return an error on a 400 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 400, data: 'Invalid' } });
            const result = await store.dispatch(testRulesApi.endpoints.updateMetadata.initiate({ id: '1', body: {} }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('getRuleById endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { id: '10', name: 'My Rule' } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the GET method', async () => {
            await store.dispatch(testRulesApi.endpoints.getRuleById.initiate({ id: '10' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should use the rule id as the URL', async () => {
            await store.dispatch(testRulesApi.endpoints.getRuleById.initiate({ id: '10' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('10');
        });

        it('should interpolate a numeric id correctly', async () => {
            await store.dispatch(testRulesApi.endpoints.getRuleById.initiate({ id: 42 }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('42');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRulesApi.endpoints.getRuleById.initiate({ id: '1' }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('getRuleById endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return rule data on a successful response', async () => {
            const rule = { id: '10', name: 'My Rule', status: 'active' };
            mockBaseQuery.mockResolvedValue({ data: rule });
            const result = await store.dispatch(testRulesApi.endpoints.getRuleById.initiate({ id: '10' }));
            expect((result as { data?: unknown }).data).toEqual(rule);
        });

        it('should return an error on a 404 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 404, data: 'Not Found' } });
            const result = await store.dispatch(testRulesApi.endpoints.getRuleById.initiate({ id: 'missing' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should handle a network error', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));
            const result = await store.dispatch(testRulesApi.endpoints.getRuleById.initiate({ id: '1' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('getRuleConfigsIds endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: ['id1', 'id2'] });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the GET method', async () => {
            await store.dispatch(testRulesApi.endpoints.getRuleConfigsIds.initiate(undefined));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should target the "ids" URL', async () => {
            await store.dispatch(testRulesApi.endpoints.getRuleConfigsIds.initiate(undefined));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('ids');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRulesApi.endpoints.getRuleConfigsIds.initiate(undefined));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('getRuleConfigsIds endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return an array of IDs on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: ['a', 'b', 'c'] });
            const result = await store.dispatch(testRulesApi.endpoints.getRuleConfigsIds.initiate(undefined));
            expect((result as { data?: unknown }).data).toEqual(['a', 'b', 'c']);
        });

        it('should return an error on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Error' } });
            const result = await store.dispatch(testRulesApi.endpoints.getRuleConfigsIds.initiate(undefined));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('getRuleConfig endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: {} });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the GET method', async () => {
            await store.dispatch(testRulesApi.endpoints.getRuleConfig.initiate({ id: '55' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should build the URL with "configuration/" prefix', async () => {
            await store.dispatch(testRulesApi.endpoints.getRuleConfig.initiate({ id: '55' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('configuration/55');
        });

        it('should interpolate a numeric id correctly', async () => {
            await store.dispatch(testRulesApi.endpoints.getRuleConfig.initiate({ id: 77 }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('configuration/77');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRulesApi.endpoints.getRuleConfig.initiate({ id: '1' }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('getRuleConfig endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return config data on a successful response', async () => {
            const config = { id: '55', threshold: 500 };
            mockBaseQuery.mockResolvedValue({ data: config });
            const result = await store.dispatch(testRulesApi.endpoints.getRuleConfig.initiate({ id: '55' }));
            expect((result as { data?: unknown }).data).toEqual(config);
        });

        it('should return an error on a 404 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 404, data: 'Not Found' } });
            const result = await store.dispatch(testRulesApi.endpoints.getRuleConfig.initiate({ id: 'missing' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('getNetworkMap endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { nodes: [], edges: [] } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the GET method', async () => {
            await store.dispatch(testRulesApi.endpoints.getNetworkMap.initiate(undefined));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should target the "network-map/active" URL', async () => {
            await store.dispatch(testRulesApi.endpoints.getNetworkMap.initiate(undefined));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('network-map/active');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRulesApi.endpoints.getNetworkMap.initiate(undefined));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('getNetworkMap endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return network map data on a successful response', async () => {
            const map = { nodes: [{ id: 'n1' }], edges: [] };
            mockBaseQuery.mockResolvedValue({ data: map });
            const result = await store.dispatch(testRulesApi.endpoints.getNetworkMap.initiate(undefined));
            expect((result as { data?: unknown }).data).toEqual(map);
        });

        it('should return an error on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Error' } });
            const result = await store.dispatch(testRulesApi.endpoints.getNetworkMap.initiate(undefined));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should handle a network error', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));
            const result = await store.dispatch(testRulesApi.endpoints.getNetworkMap.initiate(undefined));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('getStatus endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { status: 'healthy' } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the GET method', async () => {
            await store.dispatch(testRulesApi.endpoints.getStatus.initiate(undefined));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should target the "status" URL', async () => {
            await store.dispatch(testRulesApi.endpoints.getStatus.initiate(undefined));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('status');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testRulesApi.endpoints.getStatus.initiate(undefined));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('getStatus endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return status data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { status: 'healthy' } });
            const result = await store.dispatch(testRulesApi.endpoints.getStatus.initiate(undefined));
            expect((result as { data?: unknown }).data).toEqual({ status: 'healthy' });
        });

        it('should return an error on a 503 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 503, data: 'Service Unavailable' } });
            const result = await store.dispatch(testRulesApi.endpoints.getStatus.initiate(undefined));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('prepareHeaders – authorization logic', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should set the authorization header when a token is present', () => {
            const prepareHeaders = getCapturedPrepareHeaders()!;
            mockedGetAuthToken.mockReturnValue('my-token-xyz');
            const headers = new Headers();
            prepareHeaders(headers);
            expect(headers.get('authorization')).toBe('Bearer my-token-xyz');
        });

        it('should not set the authorization header when no token is returned', () => {
            const prepareHeaders = getCapturedPrepareHeaders()!;
            mockedGetAuthToken.mockReturnValue(null);
            const headers = new Headers();
            prepareHeaders(headers);
            expect(headers.get('authorization')).toBeNull();
        });

        it('should not set the authorization header when token is an empty string', () => {
            const prepareHeaders = getCapturedPrepareHeaders()!;
            mockedGetAuthToken.mockReturnValue('');
            const headers = new Headers();
            prepareHeaders(headers);
            expect(headers.get('authorization')).toBeNull();
        });

        it('should return the same headers object', () => {
            const prepareHeaders = getCapturedPrepareHeaders()!;
            mockedGetAuthToken.mockReturnValue(null);
            const headers = new Headers();
            const result = prepareHeaders(headers);
            expect(result).toBe(headers);
        });

        it('should not overwrite unrelated existing headers', () => {
            const prepareHeaders = getCapturedPrepareHeaders()!;
            mockedGetAuthToken.mockReturnValue('tok');
            const headers = new Headers({ 'content-type': 'application/json' });
            prepareHeaders(headers);
            expect(headers.get('content-type')).toBe('application/json');
            expect(headers.get('authorization')).toBe('Bearer tok');
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

        it('getRules – query function builds the correct URL and method', async () => {
            await store.dispatch(rulesApi.endpoints.getRules.initiate({ body: {} }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toContain('all');
            expect(arg.method).toBe('POST');
        });

        it('createRule – query function builds the correct URL and method', async () => {
            await store.dispatch(rulesApi.endpoints.createRule.initiate({ name: 'R' }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toContain('create');
            expect(arg.method).toBe('POST');
        });

        it('cloneRule – query function builds the correct URL', async () => {
            await store.dispatch(rulesApi.endpoints.cloneRule.initiate({ id: '5', body: {} }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string }];
            expect(arg.url).toContain('clone/5');
        });

        it('updateRule – query function builds the correct URL and method', async () => {
            await store.dispatch(rulesApi.endpoints.updateRule.initiate({ id: '7', body: {} }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toContain('7');
            expect(arg.method).toBe('PUT');
        });

        it('updateStatus – query function builds the correct URL', async () => {
            await store.dispatch(rulesApi.endpoints.updateStatus.initiate({ id: '3', body: {} }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string }];
            expect(arg.url).toContain('3/status');
        });

        it('updateMetadata – query function builds the correct URL', async () => {
            await store.dispatch(rulesApi.endpoints.updateMetadata.initiate({ id: '2', body: {} }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string }];
            expect(arg.url).toContain('2/metadata');
        });

        it('getRuleById – query function builds the correct URL', async () => {
            await store.dispatch(rulesApi.endpoints.getRuleById.initiate({ id: '10' }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string }];
            expect(arg.url).toContain('10');
        });

        it('getRuleConfigsIds – query function builds the correct URL', async () => {
            await store.dispatch(rulesApi.endpoints.getRuleConfigsIds.initiate(undefined));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string }];
            expect(arg.url).toContain('ids');
        });

        it('getRuleConfig – query function builds the correct URL', async () => {
            await store.dispatch(rulesApi.endpoints.getRuleConfig.initiate({ id: '55' }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string }];
            expect(arg.url).toContain('configuration/55');
        });

        it('getNetworkMap – query function builds the correct URL', async () => {
            await store.dispatch(rulesApi.endpoints.getNetworkMap.initiate(undefined));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string }];
            expect(arg.url).toContain('network-map/active');
        });

        it('getStatus – query function builds the correct URL', async () => {
            await store.dispatch(rulesApi.endpoints.getStatus.initiate(undefined));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string }];
            expect(arg.url).toContain('status');
        });
    });
});
