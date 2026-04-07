import { configureStore } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query/react';
import { parseApi, useParsePayloadMutation } from '../../../../src/redux/Api/Parse';
import { getAuthToken } from '../../../../src/utils/Common/storage';

type ParseTestGlobal = typeof global & {
    __parseApiInnerBaseQuery: jest.Mock;
    __parseApiPrepareHeaders: ((headers: Headers) => Headers) | undefined;
};

jest.mock('@reduxjs/toolkit/query/react', () => {
    const actual = jest.requireActual<typeof import('@reduxjs/toolkit/query/react')>('@reduxjs/toolkit/query/react');
    const innerMock = jest.fn();
    (global as ParseTestGlobal).__parseApiInnerBaseQuery = innerMock;
    return {
        ...actual,
        fetchBaseQuery: jest.fn((config: { prepareHeaders?: (headers: Headers) => Headers }) => {
            (global as ParseTestGlobal).__parseApiPrepareHeaders = config.prepareHeaders;
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

const testParseApi = createApi({
    reducerPath: 'testParseApi',
    baseQuery: mockBaseQuery,
    endpoints: (builder) => ({
        parsePayload: builder.mutation({
            query: (body: Record<string, unknown>) => ({
                url: 'validatePayload',
                method: 'POST',
                body: { ...body },
            }),
        }),
    }),
});

const makeRealStore = () =>
    configureStore({
        reducer: { [parseApi.reducerPath]: parseApi.reducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(parseApi.middleware),
    });

const makeTestStore = () =>
    configureStore({
        reducer: { [testParseApi.reducerPath]: testParseApi.reducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(testParseApi.middleware),
    });

describe('parseApi (redux/Api/Parse)', () => {
    describe('Module Structure', () => {
        it('should export parseApi', () => {
            expect(parseApi).toBeDefined();
        });

        it('should have reducerPath "parseApi"', () => {
            expect(parseApi.reducerPath).toBe('parseApi');
        });

        it('should expose a reducer function', () => {
            expect(typeof parseApi.reducer).toBe('function');
        });

        it('should expose middleware as a function', () => {
            expect(typeof parseApi.middleware).toBe('function');
        });

        it('should define the parsePayload endpoint', () => {
            expect(parseApi.endpoints.parsePayload).toBeDefined();
        });

        it('should export useParsePayloadMutation as a function', () => {
            expect(typeof useParsePayloadMutation).toBe('function');
        });
    });

    describe('Redux store integration', () => {
        it('should initialise parseApi state when added to a store', () => {
            const store = makeRealStore();
            expect(store.getState()[parseApi.reducerPath]).toBeDefined();
        });

        it('should start with an empty queries map', () => {
            const store = makeRealStore();
            expect(store.getState()[parseApi.reducerPath].queries).toEqual({});
        });

        it('should start with an empty mutations map', () => {
            const store = makeRealStore();
            expect(store.getState()[parseApi.reducerPath].mutations).toEqual({});
        });
    });

    describe('parsePayload endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { valid: true } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should make a POST request to "validatePayload"', async () => {
            await store.dispatch(testParseApi.endpoints.parsePayload.initiate({ txtp: 'pain001' }));

            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toBe('validatePayload');
            expect(arg.method).toBe('POST');
        });

        it('should spread the provided body fields into the request body', async () => {
            const payload = { txtp: 'pain001', data: { amount: 100 } };
            await store.dispatch(testParseApi.endpoints.parsePayload.initiate(payload));

            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string; body: unknown }];
            expect(arg.body).toEqual(payload);
        });

        it('should use the POST HTTP method', async () => {
            await store.dispatch(testParseApi.endpoints.parsePayload.initiate({}));

            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string; method: string }];
            expect(arg.method).toBe('POST');
        });

        it('should call the base query exactly once per dispatch', async () => {
            await store.dispatch(testParseApi.endpoints.parsePayload.initiate({ txtp: 'pain013' }));

            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });

        it('should spread all provided body fields correctly', async () => {
            const payload = { txtp: 'pacs.002', tenantId: 'tenant-1', version: '1.0' };
            await store.dispatch(testParseApi.endpoints.parsePayload.initiate(payload));

            const [arg] = mockBaseQuery.mock.calls[0] as [{ body: unknown }];
            expect(arg.body).toEqual(payload);
        });

        it('should handle an empty body object', async () => {
            await store.dispatch(testParseApi.endpoints.parsePayload.initiate({}));

            const [arg] = mockBaseQuery.mock.calls[0] as [{ body: unknown }];
            expect(arg.body).toEqual({});
        });
    });

    describe('parsePayload endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { valid: true, message: 'Payload is valid' } });

            const result = await store.dispatch(
                testParseApi.endpoints.parsePayload.initiate({ txtp: 'pain001' })
            );

            expect((result as { data?: unknown }).data).toEqual({ valid: true, message: 'Payload is valid' });
        });

        it('should return an error payload on a 400 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 400, data: { message: 'Invalid payload' } } });

            const result = await store.dispatch(
                testParseApi.endpoints.parsePayload.initiate({ txtp: 'pain001' })
            );

            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should return an error payload on a 422 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 422, data: { message: 'Unprocessable entity' } } });

            const result = await store.dispatch(
                testParseApi.endpoints.parsePayload.initiate({ txtp: 'pain001' })
            );

            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should return an error payload on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Internal Server Error' } });

            const result = await store.dispatch(
                testParseApi.endpoints.parsePayload.initiate({ txtp: 'pain001' })
            );

            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should handle a network error and return an error result', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));

            const result = await store.dispatch(
                testParseApi.endpoints.parsePayload.initiate({ txtp: 'pain001' })
            );

            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should record the mutation in the store after dispatch', async () => {
            mockBaseQuery.mockResolvedValue({ data: { valid: true } });

            await store.dispatch(testParseApi.endpoints.parsePayload.initiate({ txtp: 'pain001' }));

            const mutationsMap = store.getState()[testParseApi.reducerPath].mutations;
            expect(Object.keys(mutationsMap).length).toBeGreaterThan(0);
        });
    });

    describe('prepareHeaders – direct invocation', () => {
        const getPrepareHeaders = () =>
            (global as ParseTestGlobal).__parseApiPrepareHeaders as (h: Headers) => Headers;

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should set the Authorization header when a token is present', () => {
            mockedGetAuthToken.mockReturnValue('my-token-123');
            const headers = new Headers();
            const result = getPrepareHeaders()(headers);
            expect(result.get('authorization')).toBe('Bearer my-token-123');
        });

        it('should not set the Authorization header when no token is returned', () => {
            mockedGetAuthToken.mockReturnValue(null);
            const headers = new Headers();
            const result = getPrepareHeaders()(headers);
            expect(result.get('authorization')).toBeNull();
        });

        it('should not set the Authorization header when token is an empty string', () => {
            mockedGetAuthToken.mockReturnValue('');
            const headers = new Headers();
            const result = getPrepareHeaders()(headers);
            expect(result.get('authorization')).toBeNull();
        });

        it('should return the same headers object', () => {
            mockedGetAuthToken.mockReturnValue(null);
            const headers = new Headers();
            const result = getPrepareHeaders()(headers);
            expect(result).toBe(headers);
        });

        it('should not overwrite existing headers unrelated to authorization', () => {
            mockedGetAuthToken.mockReturnValue('tok');
            const headers = new Headers({ 'content-type': 'application/json' });
            const result = getPrepareHeaders()(headers);
            expect(result.get('content-type')).toBe('application/json');
            expect(result.get('authorization')).toBe('Bearer tok');
        });
    });

    describe('parsePayload endpoint – query function via real parseApi', () => {
        const getInnerMock = () => (global as ParseTestGlobal).__parseApiInnerBaseQuery;

        beforeEach(() => {
            getInnerMock().mockResolvedValue({ data: { valid: true } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should call the base query with url "validatePayload"', async () => {
            const store = makeRealStore();
            await store.dispatch(parseApi.endpoints.parsePayload.initiate({ txtp: 'pain001' }));
            const [arg] = getInnerMock().mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toBe('validatePayload');
        });

        it('should call the base query with method POST', async () => {
            const store = makeRealStore();
            await store.dispatch(parseApi.endpoints.parsePayload.initiate({ txtp: 'pain001' }));
            const [arg] = getInnerMock().mock.calls[0] as [{ url: string; method: string }];
            expect(arg.method).toBe('POST');
        });

        it('should spread the body fields into the base query argument', async () => {
            const store = makeRealStore();
            const payload = { txtp: 'pain001', amount: 500 };
            await store.dispatch(parseApi.endpoints.parsePayload.initiate(payload));
            const [arg] = getInnerMock().mock.calls[0] as [{ body: unknown }];
            expect(arg.body).toEqual(payload);
        });

        it('should call the base query exactly once per dispatch', async () => {
            const store = makeRealStore();
            await store.dispatch(parseApi.endpoints.parsePayload.initiate({ txtp: 'pacs.002' }));
            expect(getInnerMock()).toHaveBeenCalledTimes(1);
        });

        it('should handle an empty body via real parseApi', async () => {
            const store = makeRealStore();
            await store.dispatch(parseApi.endpoints.parsePayload.initiate({}));
            const [arg] = getInnerMock().mock.calls[0] as [{ body: unknown }];
            expect(arg.body).toEqual({});
        });
    });
});
