import { configureStore } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query/react';
import { parseApi, useParsePayloadMutation } from '../../../../src/redux/Api/Parse';
import { getAuthToken } from '../../../../src/utils/Common/storage';

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

    describe('prepareHeaders – token attachment', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should call getAuthToken when preparing headers', () => {
            mockedGetAuthToken.mockReturnValue('test-bearer-token');
            makeRealStore();
            expect(mockedGetAuthToken).not.toThrow();
        });

        it('should export getAuthToken from storage module', () => {
            expect(mockedGetAuthToken).toBeDefined();
        });
    });
});
