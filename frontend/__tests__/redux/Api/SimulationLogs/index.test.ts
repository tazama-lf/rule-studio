import { configureStore } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query/react';
import {
    logsApi,
    useGetSimulationLogsQuery,
    useAddSimulationlogsMutation,
} from '../../../../src/redux/Api/SimulationLogs';
import { getAuthToken } from '../../../../src/utils/Common/storage';

type LogsTestGlobal = typeof global & {
    __logsInnerBaseQuery: jest.Mock;
    __logsPrepareHeaders: ((headers: Headers) => Headers) | undefined;
};

jest.mock('@reduxjs/toolkit/query/react', () => {
    const actual = jest.requireActual<typeof import('@reduxjs/toolkit/query/react')>('@reduxjs/toolkit/query/react');
    const innerMock = jest.fn();
    (global as LogsTestGlobal).__logsInnerBaseQuery = innerMock;
    return {
        ...actual,
        fetchBaseQuery: jest.fn((config: { prepareHeaders?: (headers: Headers) => Headers }) => {
            (global as LogsTestGlobal).__logsPrepareHeaders = config?.prepareHeaders;
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

const testLogsApi = createApi({
    reducerPath: 'testLogsApi',
    baseQuery: mockBaseQuery,
    endpoints: (builder) => ({
        getSimulationLogs: builder.query({
            query: ({ ruleId }: { ruleId: string }) => ({
                url: `/simulation-logs/${ruleId}`,
                method: 'GET',
            }),
        }),
        addSimulationlogs: builder.mutation({
            query: ({ body, id }: { body: Record<string, unknown>; id: string }) => ({
                url: `/simulation-logs/insert/${id}`,
                method: 'POST',
                body: { ...body },
            }),
        }),
    }),
});

const makeTestStore = () =>
    configureStore({
        reducer: { [testLogsApi.reducerPath]: testLogsApi.reducer },
        middleware: (gDM) => gDM().concat(testLogsApi.middleware),
    });

const makeRealStore = () =>
    configureStore({
        reducer: { [logsApi.reducerPath]: logsApi.reducer },
        middleware: (gDM) => gDM().concat(logsApi.middleware),
    });

const makeRealEndpointStore = () =>
    configureStore({
        reducer: { [logsApi.reducerPath]: logsApi.reducer },
        middleware: (gDM) => gDM().concat(logsApi.middleware),
    });

const getRealInnerMock = () =>
    (global as LogsTestGlobal).__logsInnerBaseQuery;

const getCapturedPrepareHeaders = (): ((headers: Headers) => Headers) | undefined =>
    (global as LogsTestGlobal).__logsPrepareHeaders;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('logsApi (redux/Api/SimulationLogs)', () => {

    describe('Module Structure', () => {
        it('should export logsApi', () => {
            expect(logsApi).toBeDefined();
        });

        it('should have reducerPath "logsApi"', () => {
            expect(logsApi.reducerPath).toBe('logsApi');
        });

        it('should expose a reducer function', () => {
            expect(typeof logsApi.reducer).toBe('function');
        });

        it('should expose middleware as a function', () => {
            expect(typeof logsApi.middleware).toBe('function');
        });

        it('should define the getSimulationLogs endpoint', () => {
            expect(logsApi.endpoints.getSimulationLogs).toBeDefined();
        });

        it('should define the addSimulationlogs endpoint', () => {
            expect(logsApi.endpoints.addSimulationlogs).toBeDefined();
        });

        it('should export useGetSimulationLogsQuery as a function', () => {
            expect(typeof useGetSimulationLogsQuery).toBe('function');
        });

        it('should export useAddSimulationlogsMutation as a function', () => {
            expect(typeof useAddSimulationlogsMutation).toBe('function');
        });
    });

    describe('Redux store integration', () => {
        it('should initialise logsApi state when added to a store', () => {
            const store = makeRealStore();
            expect(store.getState()[logsApi.reducerPath]).toBeDefined();
        });

        it('should start with an empty queries map', () => {
            const store = makeRealStore();
            expect(store.getState()[logsApi.reducerPath].queries).toEqual({});
        });

        it('should start with an empty mutations map', () => {
            const store = makeRealStore();
            expect(store.getState()[logsApi.reducerPath].mutations).toEqual({});
        });
    });

    describe('getSimulationLogs endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: [] });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the GET method', async () => {
            await store.dispatch(testLogsApi.endpoints.getSimulationLogs.initiate({ ruleId: 'r1' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should build the URL with the ruleId path segment', async () => {
            await store.dispatch(testLogsApi.endpoints.getSimulationLogs.initiate({ ruleId: 'r1' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('/simulation-logs/r1');
        });

        it('should interpolate different ruleId values correctly', async () => {
            await store.dispatch(testLogsApi.endpoints.getSimulationLogs.initiate({ ruleId: 'rule-42' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('/simulation-logs/rule-42');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testLogsApi.endpoints.getSimulationLogs.initiate({ ruleId: 'r1' }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('getSimulationLogs endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            const logs = [{ id: '1', event: 'start' }];
            mockBaseQuery.mockResolvedValue({ data: logs });
            const result = await store.dispatch(testLogsApi.endpoints.getSimulationLogs.initiate({ ruleId: 'r1' }));
            expect((result as { data?: unknown }).data).toEqual(logs);
        });

        it('should return an error on a 404 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 404, data: 'Not Found' } });
            const result = await store.dispatch(testLogsApi.endpoints.getSimulationLogs.initiate({ ruleId: 'missing' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should return an error on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Server Error' } });
            const result = await store.dispatch(testLogsApi.endpoints.getSimulationLogs.initiate({ ruleId: 'r1' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should handle a network error', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));
            const result = await store.dispatch(testLogsApi.endpoints.getSimulationLogs.initiate({ ruleId: 'r1' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('addSimulationlogs endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { success: true } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the POST method', async () => {
            await store.dispatch(testLogsApi.endpoints.addSimulationlogs.initiate({ body: {}, id: 'id1' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('POST');
        });

        it('should build the URL with the id path segment', async () => {
            await store.dispatch(testLogsApi.endpoints.addSimulationlogs.initiate({ body: {}, id: 'id1' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('/simulation-logs/insert/id1');
        });

        it('should interpolate different id values correctly', async () => {
            await store.dispatch(testLogsApi.endpoints.addSimulationlogs.initiate({ body: {}, id: 'abc-99' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('/simulation-logs/insert/abc-99');
        });

        it('should spread the body fields into the request body', async () => {
            const body = { event: 'run', status: 'pass' };
            await store.dispatch(testLogsApi.endpoints.addSimulationlogs.initiate({ body, id: 'id1' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ body: Record<string, unknown> }];
            expect(arg.body.event).toBe('run');
            expect(arg.body.status).toBe('pass');
        });

        it('should handle an empty body', async () => {
            await store.dispatch(testLogsApi.endpoints.addSimulationlogs.initiate({ body: {}, id: 'id1' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ body: Record<string, unknown> }];
            expect(arg.body).toEqual({});
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testLogsApi.endpoints.addSimulationlogs.initiate({ body: {}, id: 'id1' }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('addSimulationlogs endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { success: true } });
            const result = await store.dispatch(testLogsApi.endpoints.addSimulationlogs.initiate({ body: {}, id: 'id1' }));
            expect((result as { data?: unknown }).data).toEqual({ success: true });
        });

        it('should return an error on a 400 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 400, data: 'Bad Request' } });
            const result = await store.dispatch(testLogsApi.endpoints.addSimulationlogs.initiate({ body: {}, id: 'id1' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should return an error on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Server Error' } });
            const result = await store.dispatch(testLogsApi.endpoints.addSimulationlogs.initiate({ body: {}, id: 'id1' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should record the mutation in the store', async () => {
            mockBaseQuery.mockResolvedValue({ data: { success: true } });
            await store.dispatch(testLogsApi.endpoints.addSimulationlogs.initiate({ body: {}, id: 'id1' }));
            expect(Object.keys(store.getState()[testLogsApi.reducerPath].mutations).length).toBeGreaterThan(0);
        });
    });

    describe('prepareHeaders – authorization and content-type logic', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should set the authorization header when a token is present', () => {
            const prepareHeaders = getCapturedPrepareHeaders()!;
            mockedGetAuthToken.mockReturnValue('my-token');
            const headers = new Headers();
            prepareHeaders(headers);
            expect(headers.get('authorization')).toBe('Bearer my-token');
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

        it('should always set Content-Type to application/json', () => {
            const prepareHeaders = getCapturedPrepareHeaders()!;
            mockedGetAuthToken.mockReturnValue(null);
            const headers = new Headers();
            prepareHeaders(headers);
            expect(headers.get('content-type')).toBe('application/json');
        });

        it('should always set Accept to application/json', () => {
            const prepareHeaders = getCapturedPrepareHeaders()!;
            mockedGetAuthToken.mockReturnValue(null);
            const headers = new Headers();
            prepareHeaders(headers);
            expect(headers.get('accept')).toBe('application/json');
        });

        it('should return the same headers object', () => {
            const prepareHeaders = getCapturedPrepareHeaders()!;
            mockedGetAuthToken.mockReturnValue(null);
            const headers = new Headers();
            const result = prepareHeaders(headers);
            expect(result).toBe(headers);
        });

        it('should set both authorization and content headers when token is present', () => {
            const prepareHeaders = getCapturedPrepareHeaders()!;
            mockedGetAuthToken.mockReturnValue('tok123');
            const headers = new Headers();
            prepareHeaders(headers);
            expect(headers.get('authorization')).toBe('Bearer tok123');
            expect(headers.get('content-type')).toBe('application/json');
            expect(headers.get('accept')).toBe('application/json');
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

        it('getSimulationLogs – query function builds the correct URL and method', async () => {
            await store.dispatch(logsApi.endpoints.getSimulationLogs.initiate({ ruleId: 'r1' }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toContain('/simulation-logs/r1');
            expect(arg.method).toBe('GET');
        });

        it('addSimulationlogs – query function builds the correct URL and method', async () => {
            await store.dispatch(logsApi.endpoints.addSimulationlogs.initiate({ body: {}, id: 'id1' }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toContain('/simulation-logs/insert/id1');
            expect(arg.method).toBe('POST');
        });
    });
});
