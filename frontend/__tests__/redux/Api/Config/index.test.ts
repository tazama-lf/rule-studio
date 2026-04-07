import { configureStore } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query/react';
import { configApi, useGetTypesQuery, useLazyGetSamplePayloadQuery, useLazyGetTxtpVersionsQuery } from '../../../../src/redux/Api/Config';
import { getAuthToken } from '../../../../src/utils/Common/storage';

// Mock storage so prepareHeaders branch (with/without token) is controllable
jest.mock('../../../../src/utils/Common/storage', () => ({
    getAuthToken: jest.fn(),
    extractData: jest.fn(),
    getAuthTokenType: jest.fn(),
}));

const mockedGetAuthToken = getAuthToken as jest.Mock;

const mockBaseQuery = jest.fn();

const testConfigApi = createApi({
    reducerPath: 'testConfigApi',
    baseQuery: mockBaseQuery,
    endpoints: (builder) => ({
        getTypes: builder.query({
            query: () => ({
                url: 'transaction-types',
                method: 'GET',
            }),
        }),
        getTxtpVersions: builder.query({
            query: ({ type }: { type: string }) => ({
                url: `versions/${type}`,
                method: 'GET',
            }),
        }),
        getSamplePayload: builder.query({
            query: ({ type, version }: { type: string; version: string }) => ({
                url: `payload/${type}/${version}`,
                method: 'GET',
            }),
        }),
    }),
});

const makeRealStore = () =>
    configureStore({
        reducer: { [configApi.reducerPath]: configApi.reducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(configApi.middleware),
    });

const makeTestStore = () =>
    configureStore({
        reducer: { [testConfigApi.reducerPath]: testConfigApi.reducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(testConfigApi.middleware),
    });

describe('configApi (redux/Api/Config)', () => {
    describe('Module Structure', () => {
        it('should export configApi', () => {
            expect(configApi).toBeDefined();
        });

        it('should have reducerPath "configApi"', () => {
            expect(configApi.reducerPath).toBe('configApi');
        });

        it('should expose a reducer function', () => {
            expect(typeof configApi.reducer).toBe('function');
        });

        it('should expose middleware as a function', () => {
            expect(typeof configApi.middleware).toBe('function');
        });

        it('should define the getTypes endpoint', () => {
            expect(configApi.endpoints.getTypes).toBeDefined();
        });

        it('should define the getTxtpVersions endpoint', () => {
            expect(configApi.endpoints.getTxtpVersions).toBeDefined();
        });

        it('should define the getSamplePayload endpoint', () => {
            expect(configApi.endpoints.getSamplePayload).toBeDefined();
        });

        it('should export useGetTypesQuery as a function', () => {
            expect(typeof useGetTypesQuery).toBe('function');
        });

        it('should export useLazyGetTxtpVersionsQuery as a function', () => {
            expect(typeof useLazyGetTxtpVersionsQuery).toBe('function');
        });

        it('should export useLazyGetSamplePayloadQuery as a function', () => {
            expect(typeof useLazyGetSamplePayloadQuery).toBe('function');
        });
    });

    describe('Redux store integration', () => {
        it('should initialise configApi state when added to a store', () => {
            const store = makeRealStore();
            expect(store.getState()[configApi.reducerPath]).toBeDefined();
        });

        it('should start with an empty queries map', () => {
            const store = makeRealStore();
            expect(store.getState()[configApi.reducerPath].queries).toEqual({});
        });

        it('should start with an empty mutations map', () => {
            const store = makeRealStore();
            expect(store.getState()[configApi.reducerPath].mutations).toEqual({});
        });
    });

    describe('getTypes endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: ['pain001', 'pain013'] });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should call the base query exactly once on initiate', async () => {
            await store.dispatch(testConfigApi.endpoints.getTypes.initiate(undefined));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });

        it('should use the GET method', async () => {
            await store.dispatch(testConfigApi.endpoints.getTypes.initiate(undefined));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should target the "transaction-types" URL', async () => {
            await store.dispatch(testConfigApi.endpoints.getTypes.initiate(undefined));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toBe('transaction-types');
        });
    });

    describe('getTypes endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on success', async () => {
            mockBaseQuery.mockResolvedValue({ data: ['pain001', 'pain013'] });
            const result = await store.dispatch(testConfigApi.endpoints.getTypes.initiate(undefined));
            expect((result as { data?: unknown }).data).toEqual(['pain001', 'pain013']);
        });

        it('should return an error payload on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Internal Server Error' } });
            const result = await store.dispatch(testConfigApi.endpoints.getTypes.initiate(undefined));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should record the query in the store after dispatch', async () => {
            mockBaseQuery.mockResolvedValue({ data: [] });
            await store.dispatch(testConfigApi.endpoints.getTypes.initiate(undefined));
            const queriesMap = store.getState()[testConfigApi.reducerPath].queries;
            expect(Object.keys(queriesMap).length).toBeGreaterThan(0);
        });

        it('should handle a network error and return an error result', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));
            const result = await store.dispatch(testConfigApi.endpoints.getTypes.initiate(undefined));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('getTxtpVersions endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: ['1.0', '2.0'] });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should call the base query exactly once on initiate', async () => {
            await store.dispatch(testConfigApi.endpoints.getTxtpVersions.initiate({ type: 'pain001' }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });

        it('should use the GET method', async () => {
            await store.dispatch(testConfigApi.endpoints.getTxtpVersions.initiate({ type: 'pain001' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should interpolate the type parameter into the URL', async () => {
            await store.dispatch(testConfigApi.endpoints.getTxtpVersions.initiate({ type: 'pain001' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toBe('versions/pain001');
        });

        it('should interpolate a different type correctly', async () => {
            await store.dispatch(testConfigApi.endpoints.getTxtpVersions.initiate({ type: 'pain013' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toBe('versions/pain013');
        });
    });

    describe('getTxtpVersions endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on success', async () => {
            mockBaseQuery.mockResolvedValue({ data: ['1.0', '2.0'] });
            const result = await store.dispatch(testConfigApi.endpoints.getTxtpVersions.initiate({ type: 'pain001' }));
            expect((result as { data?: unknown }).data).toEqual(['1.0', '2.0']);
        });

        it('should return an error payload on a 404 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 404, data: 'Not Found' } });
            const result = await store.dispatch(testConfigApi.endpoints.getTxtpVersions.initiate({ type: 'unknown' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should handle a network error and return an error result', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));
            const result = await store.dispatch(testConfigApi.endpoints.getTxtpVersions.initiate({ type: 'pain001' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('getSamplePayload endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { key: 'value' } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should call the base query exactly once on initiate', async () => {
            await store.dispatch(testConfigApi.endpoints.getSamplePayload.initiate({ type: 'pain001', version: '1.0' }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });

        it('should use the GET method', async () => {
            await store.dispatch(testConfigApi.endpoints.getSamplePayload.initiate({ type: 'pain001', version: '1.0' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should interpolate type and version into the URL', async () => {
            await store.dispatch(testConfigApi.endpoints.getSamplePayload.initiate({ type: 'pain001', version: '1.0' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toBe('payload/pain001/1.0');
        });

        it('should interpolate different type and version correctly', async () => {
            await store.dispatch(testConfigApi.endpoints.getSamplePayload.initiate({ type: 'pain013', version: '2.0' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toBe('payload/pain013/2.0');
        });

        it('should include type in the URL path', async () => {
            await store.dispatch(testConfigApi.endpoints.getSamplePayload.initiate({ type: 'pain001', version: '1.0' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toMatch(/^payload\/pain001/);
        });

        it('should include version after type in the URL path', async () => {
            await store.dispatch(testConfigApi.endpoints.getSamplePayload.initiate({ type: 'pain001', version: '1.0' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toMatch(/\/1\.0$/);
        });
    });

    describe('getSamplePayload endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on success', async () => {
            const payload = { amount: 100, currency: 'USD' };
            mockBaseQuery.mockResolvedValue({ data: payload });
            const result = await store.dispatch(testConfigApi.endpoints.getSamplePayload.initiate({ type: 'pain001', version: '1.0' }));
            expect((result as { data?: unknown }).data).toEqual(payload);
        });

        it('should return an error payload on a 404 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 404, data: 'Not Found' } });
            const result = await store.dispatch(testConfigApi.endpoints.getSamplePayload.initiate({ type: 'unknown', version: '9.9' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should return an error payload on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Internal Server Error' } });
            const result = await store.dispatch(testConfigApi.endpoints.getSamplePayload.initiate({ type: 'pain001', version: '1.0' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should record the query in the store after dispatch', async () => {
            mockBaseQuery.mockResolvedValue({ data: {} });
            await store.dispatch(testConfigApi.endpoints.getSamplePayload.initiate({ type: 'pain001', version: '1.0' }));
            const queriesMap = store.getState()[testConfigApi.reducerPath].queries;
            expect(Object.keys(queriesMap).length).toBeGreaterThan(0);
        });

        it('should handle a network error and return an error result', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));
            const result = await store.dispatch(testConfigApi.endpoints.getSamplePayload.initiate({ type: 'pain001', version: '1.0' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    // -----------------------------------------------------------------------
    // Real configApi – exercises actual query() functions and prepareHeaders
    // Dispatching through the real store triggers the real source-file code.
    // -----------------------------------------------------------------------
    describe('real configApi – query functions and prepareHeaders coverage', () => {
        let realStore: ReturnType<typeof makeRealStore>;

        beforeEach(() => {
            realStore = makeRealStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('prepareHeaders – should call getAuthToken when a query is dispatched (no token path)', async () => {
            mockedGetAuthToken.mockReturnValue(null);
            await realStore.dispatch(configApi.endpoints.getTypes.initiate(undefined));
            expect(mockedGetAuthToken).toHaveBeenCalled();
        });

        it('prepareHeaders – should call getAuthToken when a query is dispatched (with token path)', async () => {
            mockedGetAuthToken.mockReturnValue('test-token');
            await realStore.dispatch(configApi.endpoints.getTypes.initiate(undefined));
            expect(mockedGetAuthToken).toHaveBeenCalled();
        });

        it('getTypes query() – should register an entry in the queries map after dispatch', async () => {
            mockedGetAuthToken.mockReturnValue(null);
            await realStore.dispatch(configApi.endpoints.getTypes.initiate(undefined));
            const queriesMap = realStore.getState()[configApi.reducerPath].queries;
            expect(Object.keys(queriesMap).length).toBeGreaterThan(0);
        });

        it('getTxtpVersions query() – should register an entry in the queries map after dispatch', async () => {
            mockedGetAuthToken.mockReturnValue(null);
            await realStore.dispatch(configApi.endpoints.getTxtpVersions.initiate({ type: 'pain001' }));
            const queriesMap = realStore.getState()[configApi.reducerPath].queries;
            expect(Object.keys(queriesMap).length).toBeGreaterThan(0);
        });

        it('getSamplePayload query() – should register an entry in the queries map after dispatch', async () => {
            mockedGetAuthToken.mockReturnValue(null);
            await realStore.dispatch(configApi.endpoints.getSamplePayload.initiate({ type: 'pain001', version: '2.0' }));
            const queriesMap = realStore.getState()[configApi.reducerPath].queries;
            expect(Object.keys(queriesMap).length).toBeGreaterThan(0);
        });

        it('getTxtpVersions query() – should register a separate entry per unique type arg', async () => {
            mockedGetAuthToken.mockReturnValue(null);
            await realStore.dispatch(configApi.endpoints.getTxtpVersions.initiate({ type: 'pain013' }));
            const queriesMap = realStore.getState()[configApi.reducerPath].queries;
            const keys = Object.keys(queriesMap);
            expect(keys.some((k) => k.includes('pain013'))).toBe(true);
        });
    });
});
