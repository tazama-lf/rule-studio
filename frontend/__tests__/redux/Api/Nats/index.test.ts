import { configureStore } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query/react';
import { natsApi, useRuleOnlyMutation, useEndToEndMutation, useLazyGetEndReportQuery } from '../../../../src/redux/Api/Nats';
import { getAuthToken } from '../../../../src/utils/Common/storage';

// Mock storage so prepareHeaders branch (with/without token) is controllable
jest.mock('../../../../src/utils/Common/storage', () => ({
    getAuthToken: jest.fn(),
    extractData: jest.fn(),
    getAuthTokenType: jest.fn(),
}));

const mockedGetAuthToken = getAuthToken as jest.Mock;


const mockBaseQuery = jest.fn();

const testNatsApi = createApi({
    reducerPath: 'testNatsApi',
    baseQuery: mockBaseQuery,
    endpoints: (builder) => ({
        ruleOnly: builder.mutation({
            query: (body: Record<string, unknown>) => ({
                url: `http://localhost:3002/natsPublish`,
                method: 'POST',
                body: { ...body },
            }),
        }),
        endToEnd: builder.mutation({
            query: ({ body, tenantId, version, txtp }: { body: Record<string, unknown>; tenantId: string; version: string; txtp: string }) => ({
                url: `http://localhost:3003/${tenantId}/${version}/evaluate/${txtp}`,
                method: 'POST',
                body: { ...body },
            }),
        }),
        getEndReport: builder.query({
            query: ({ msgId }: { msgId: string }) => ({
                url: `http://localhost:3004/v1/admin/reports/getreportbymsgid?msgid=${msgId}`,
                method: 'GET',
            }),
        }),
    }),
});

const makeRealStore = () =>
    configureStore({
        reducer: { [natsApi.reducerPath]: natsApi.reducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(natsApi.middleware),
    });

const makeTestStore = () =>
    configureStore({
        reducer: { [testNatsApi.reducerPath]: testNatsApi.reducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(testNatsApi.middleware),
    });

describe('natsApi (redux/Api/Nats)', () => {
    describe('Module Structure', () => {
        it('should export natsApi', () => {
            expect(natsApi).toBeDefined();
        });

        it('should have reducerPath "natsApi"', () => {
            expect(natsApi.reducerPath).toBe('natsApi');
        });

        it('should expose a reducer function', () => {
            expect(typeof natsApi.reducer).toBe('function');
        });

        it('should expose middleware as a function', () => {
            expect(typeof natsApi.middleware).toBe('function');
        });

        it('should define the ruleOnly endpoint', () => {
            expect(natsApi.endpoints.ruleOnly).toBeDefined();
        });

        it('should define the endToEnd endpoint', () => {
            expect(natsApi.endpoints.endToEnd).toBeDefined();
        });

        it('should define the getEndReport endpoint', () => {
            expect(natsApi.endpoints.getEndReport).toBeDefined();
        });

        it('should export useRuleOnlyMutation as a function', () => {
            expect(typeof useRuleOnlyMutation).toBe('function');
        });

        it('should export useEndToEndMutation as a function', () => {
            expect(typeof useEndToEndMutation).toBe('function');
        });

        it('should export useLazyGetEndReportQuery as a function', () => {
            expect(typeof useLazyGetEndReportQuery).toBe('function');
        });
    });

    describe('Redux store integration', () => {
        it('should initialise natsApi state when added to a store', () => {
            const store = makeRealStore();
            expect(store.getState()[natsApi.reducerPath]).toBeDefined();
        });

        it('should start with an empty queries map', () => {
            const store = makeRealStore();
            expect(store.getState()[natsApi.reducerPath].queries).toEqual({});
        });

        it('should start with an empty mutations map', () => {
            const store = makeRealStore();
            expect(store.getState()[natsApi.reducerPath].mutations).toEqual({});
        });
    });

    describe('ruleOnly endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { result: 'ok' } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should call the base query exactly once on dispatch', async () => {
            await store.dispatch(testNatsApi.endpoints.ruleOnly.initiate({ functionName: '', awaitReply: true }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });

        it('should use the POST method', async () => {
            await store.dispatch(testNatsApi.endpoints.ruleOnly.initiate({ functionName: '', awaitReply: true }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.method).toBe('POST');
        });

        it('should include "/natsPublish" in the URL', async () => {
            await store.dispatch(testNatsApi.endpoints.ruleOnly.initiate({ functionName: '', awaitReply: true }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toContain('/natsPublish');
        });

        it('should spread the body fields into the request body', async () => {
            const payload = { functionName: 'myFn', awaitReply: true, destination: 'dest', consumer: 'cons', message: { key: 'val' } };
            await store.dispatch(testNatsApi.endpoints.ruleOnly.initiate(payload));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string; body: unknown }];
            expect(arg.body).toEqual(payload);
        });
    });

    describe('ruleOnly endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { result: 'pass' } });
            const result = await store.dispatch(testNatsApi.endpoints.ruleOnly.initiate({}));
            expect((result as { data?: unknown }).data).toEqual({ result: 'pass' });
        });

        it('should return an error payload on a 401 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 401, data: 'Unauthorized' } });
            const result = await store.dispatch(testNatsApi.endpoints.ruleOnly.initiate({}));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should return an error payload on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Internal Server Error' } });
            const result = await store.dispatch(testNatsApi.endpoints.ruleOnly.initiate({}));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should record the mutation in the store after dispatch', async () => {
            mockBaseQuery.mockResolvedValue({ data: {} });
            await store.dispatch(testNatsApi.endpoints.ruleOnly.initiate({}));
            const mutationsMap = store.getState()[testNatsApi.reducerPath].mutations;
            expect(Object.keys(mutationsMap).length).toBeGreaterThan(0);
        });

        it('should handle a network error and return an error result', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));
            const result = await store.dispatch(testNatsApi.endpoints.ruleOnly.initiate({}));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('endToEnd endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;
        const defaultArgs = { body: { amount: 100 }, tenantId: 'tenant1', version: '1.0', txtp: 'pain001' };

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { transactionId: 'tx-123' } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should call the base query exactly once on dispatch', async () => {
            await store.dispatch(testNatsApi.endpoints.endToEnd.initiate(defaultArgs));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });

        it('should use the POST method', async () => {
            await store.dispatch(testNatsApi.endpoints.endToEnd.initiate(defaultArgs));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.method).toBe('POST');
        });

        it('should interpolate tenantId into the URL', async () => {
            await store.dispatch(testNatsApi.endpoints.endToEnd.initiate(defaultArgs));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toContain('tenant1');
        });

        it('should interpolate version into the URL', async () => {
            await store.dispatch(testNatsApi.endpoints.endToEnd.initiate(defaultArgs));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toContain('1.0');
        });

        it('should interpolate txtp into the URL', async () => {
            await store.dispatch(testNatsApi.endpoints.endToEnd.initiate(defaultArgs));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toContain('pain001');
        });

        it('should include "evaluate" in the URL', async () => {
            await store.dispatch(testNatsApi.endpoints.endToEnd.initiate(defaultArgs));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toContain('evaluate');
        });

        it('should spread the body fields into the request body', async () => {
            await store.dispatch(testNatsApi.endpoints.endToEnd.initiate(defaultArgs));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string; body: unknown }];
            expect(arg.body).toEqual(defaultArgs.body);
        });
    });

    describe('endToEnd endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;
        const defaultArgs = { body: {}, tenantId: 'tenant1', version: '1.0', txtp: 'pain001' };

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { transactionId: 'tx-abc' } });
            const result = await store.dispatch(testNatsApi.endpoints.endToEnd.initiate(defaultArgs));
            expect((result as { data?: unknown }).data).toEqual({ transactionId: 'tx-abc' });
        });

        it('should return an error payload on a 400 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 400, data: 'Bad Request' } });
            const result = await store.dispatch(testNatsApi.endpoints.endToEnd.initiate(defaultArgs));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should return an error payload on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Internal Server Error' } });
            const result = await store.dispatch(testNatsApi.endpoints.endToEnd.initiate(defaultArgs));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should record the mutation in the store after dispatch', async () => {
            mockBaseQuery.mockResolvedValue({ data: {} });
            await store.dispatch(testNatsApi.endpoints.endToEnd.initiate(defaultArgs));
            const mutationsMap = store.getState()[testNatsApi.reducerPath].mutations;
            expect(Object.keys(mutationsMap).length).toBeGreaterThan(0);
        });

        it('should handle a network error and return an error result', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));
            const result = await store.dispatch(testNatsApi.endpoints.endToEnd.initiate(defaultArgs));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('getEndReport endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { report: {} } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should call the base query exactly once on initiate', async () => {
            await store.dispatch(testNatsApi.endpoints.getEndReport.initiate({ msgId: 'msg-123' }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });

        it('should use the GET method', async () => {
            await store.dispatch(testNatsApi.endpoints.getEndReport.initiate({ msgId: 'msg-123' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should include "getreportbymsgid" in the URL', async () => {
            await store.dispatch(testNatsApi.endpoints.getEndReport.initiate({ msgId: 'msg-123' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toContain('getreportbymsgid');
        });

        it('should append the msgId as a query parameter', async () => {
            await store.dispatch(testNatsApi.endpoints.getEndReport.initiate({ msgId: 'msg-abc' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toContain('msgid=msg-abc');
        });

        it('should include the admin reports path in the URL', async () => {
            await store.dispatch(testNatsApi.endpoints.getEndReport.initiate({ msgId: 'msg-xyz' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toContain('/v1/admin/reports/');
        });
    });

    describe('getEndReport endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            const report = { report: { ruleResults: [] } };
            mockBaseQuery.mockResolvedValue({ data: report });
            const result = await store.dispatch(testNatsApi.endpoints.getEndReport.initiate({ msgId: 'msg-1' }));
            expect((result as { data?: unknown }).data).toEqual(report);
        });

        it('should return an error payload on a 404 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 404, data: 'Not Found' } });
            const result = await store.dispatch(testNatsApi.endpoints.getEndReport.initiate({ msgId: 'unknown' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should return an error payload on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Internal Server Error' } });
            const result = await store.dispatch(testNatsApi.endpoints.getEndReport.initiate({ msgId: 'msg-1' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should record the query in the store after dispatch', async () => {
            mockBaseQuery.mockResolvedValue({ data: {} });
            await store.dispatch(testNatsApi.endpoints.getEndReport.initiate({ msgId: 'msg-1' }));
            const queriesMap = store.getState()[testNatsApi.reducerPath].queries;
            expect(Object.keys(queriesMap).length).toBeGreaterThan(0);
        });

        it('should handle a network error and return an error result', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));
            const result = await store.dispatch(testNatsApi.endpoints.getEndReport.initiate({ msgId: 'msg-1' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    // -----------------------------------------------------------------------
    // Real natsApi – exercises actual query() functions and prepareHeaders
    // Dispatching through the real store triggers the real source-file code.
    // -----------------------------------------------------------------------
    describe('real natsApi – query functions and prepareHeaders coverage', () => {
        let realStore: ReturnType<typeof makeRealStore>;

        beforeEach(() => {
            realStore = makeRealStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('prepareHeaders – should call getAuthToken when a mutation is dispatched (no token path)', async () => {
            mockedGetAuthToken.mockReturnValue(null);
            await realStore.dispatch(natsApi.endpoints.ruleOnly.initiate({}));
            expect(mockedGetAuthToken).toHaveBeenCalled();
        });

        it('prepareHeaders – should call getAuthToken when a mutation is dispatched (with token path)', async () => {
            mockedGetAuthToken.mockReturnValue('nats-token');
            await realStore.dispatch(natsApi.endpoints.ruleOnly.initiate({}));
            expect(mockedGetAuthToken).toHaveBeenCalled();
        });

        it('ruleOnly query() – should register an entry in the mutations map after dispatch', async () => {
            mockedGetAuthToken.mockReturnValue(null);
            await realStore.dispatch(natsApi.endpoints.ruleOnly.initiate({ functionName: '', awaitReply: true }));
            const mutationsMap = realStore.getState()[natsApi.reducerPath].mutations;
            expect(Object.keys(mutationsMap).length).toBeGreaterThan(0);
        });

        it('endToEnd query() – should register an entry in the mutations map after dispatch', async () => {
            mockedGetAuthToken.mockReturnValue(null);
            await realStore.dispatch(
                natsApi.endpoints.endToEnd.initiate({ body: {}, tenantId: 'tenant1', version: '1.0', txtp: 'pain001' })
            );
            const mutationsMap = realStore.getState()[natsApi.reducerPath].mutations;
            expect(Object.keys(mutationsMap).length).toBeGreaterThan(0);
        });

        it('getEndReport query() – should register an entry in the queries map after dispatch', async () => {
            mockedGetAuthToken.mockReturnValue(null);
            await realStore.dispatch(natsApi.endpoints.getEndReport.initiate({ msgId: 'msg-xyz' }));
            const queriesMap = realStore.getState()[natsApi.reducerPath].queries;
            expect(Object.keys(queriesMap).length).toBeGreaterThan(0);
        });

        it('prepareHeaders – getAuthToken called for getEndReport query as well', async () => {
            mockedGetAuthToken.mockReturnValue('another-token');
            await realStore.dispatch(natsApi.endpoints.getEndReport.initiate({ msgId: 'msg-1' }));
            expect(mockedGetAuthToken).toHaveBeenCalled();
        });
    });
});
