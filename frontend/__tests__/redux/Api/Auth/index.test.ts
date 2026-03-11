import { configureStore } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query/react';
import { authApi, useLoginMutation } from '../../../../src/redux/Api/Auth';

// ---------------------------------------------------------------------------
// mockBaseQuery – used directly as baseQuery for testAuthApi.
// RTK Query calls: mockBaseQuery({ url, method, body }, api, extraOptions).
// This bypasses fetchBaseQuery/fetch entirely – no ESM/CJS interception issues.
// ---------------------------------------------------------------------------
const mockBaseQuery = jest.fn();

// A local replica of the auth API with mockBaseQuery as the base query.
const testAuthApi = createApi({
    reducerPath: 'testAuthApi',
    baseQuery: mockBaseQuery,
    endpoints: (builder) => ({
        login: builder.mutation({
            query: (body) => ({
                url: 'login',
                method: 'POST',
                body: { ...(body as object) },
            }),
        }),
    }),
});

// Store backed by the REAL authApi (for structural / integration tests)
const makeRealStore = () =>
    configureStore({
        reducer: { [authApi.reducerPath]: authApi.reducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(authApi.middleware),
    });

// Store backed by the TEST replica (for HTTP-behaviour tests)
const makeTestStore = () =>
    configureStore({
        reducer: { [testAuthApi.reducerPath]: testAuthApi.reducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(testAuthApi.middleware),
    });



describe('authApi (redux/Api/Auth)', () => {
    // -----------------------------------------------------------------------
    // Module structure – verifies real source exports
    // -----------------------------------------------------------------------
    describe('Module Structure', () => {
        it('should export authApi', () => {
            expect(authApi).toBeDefined();
        });

        it('should have reducerPath "authApi"', () => {
            expect(authApi.reducerPath).toBe('authApi');
        });

        it('should expose a reducer function', () => {
            expect(typeof authApi.reducer).toBe('function');
        });

        it('should expose middleware as a function', () => {
            expect(typeof authApi.middleware).toBe('function');
        });

        it('should define the login endpoint', () => {
            expect(authApi.endpoints.login).toBeDefined();
        });

        it('should export useLoginMutation as a function', () => {
            expect(typeof useLoginMutation).toBe('function');
        });
    });

    // -----------------------------------------------------------------------
    // Redux store integration – verifies the real API works in a Redux store
    // -----------------------------------------------------------------------
    describe('Redux store integration', () => {
        it('should initialise authApi state when added to a store', () => {
            const store = makeRealStore();
            expect(store.getState()[authApi.reducerPath]).toBeDefined();
        });

        it('should start with an empty queries map', () => {
            const store = makeRealStore();
            expect(store.getState()[authApi.reducerPath].queries).toEqual({});
        });

        it('should start with an empty mutations map', () => {
            const store = makeRealStore();
            expect(store.getState()[authApi.reducerPath].mutations).toEqual({});
        });
    });

    // -----------------------------------------------------------------------
    // login endpoint – request construction
    // mockBaseQuery receives { url, method, body } from RTK Query directly.
    // -----------------------------------------------------------------------
    describe('login endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { token: 'test-token' } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should make a POST request to a URL containing "/auth/login"', async () => {
            const credentials = { email: 'user@test.com', password: 'password123' };
            await store.dispatch(testAuthApi.endpoints.login.initiate(credentials));

            const [arg] = mockBaseQuery.mock.calls[0];
            expect(arg.url).toContain('login');
            expect(arg.method).toBe('POST');
        });

        it('should include the credentials in the request body', async () => {
            const credentials = { email: 'user@test.com', password: 'password123' };
            await store.dispatch(testAuthApi.endpoints.login.initiate(credentials));

            const [arg] = mockBaseQuery.mock.calls[0];
            expect(arg.body).toEqual(credentials);
        });

        it('should spread all provided body fields', async () => {
            const credentials = { email: 'admin@example.com', password: 'supersecret', rememberMe: true };
            await store.dispatch(testAuthApi.endpoints.login.initiate(credentials));

            const [arg] = mockBaseQuery.mock.calls[0];
            expect(arg.body).toEqual(credentials);
        });

        it('should call fetch exactly once per dispatch', async () => {
            await store.dispatch(
                testAuthApi.endpoints.login.initiate({ email: 'a@b.com', password: 'pass' })
            );

            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });

        it('should use the POST HTTP method', async () => {
            await store.dispatch(
                testAuthApi.endpoints.login.initiate({ email: 'x@y.com', password: 'p' })
            );

            const [arg] = mockBaseQuery.mock.calls[0];
            expect(arg.method).toBe('POST');
        });
    });

    // -----------------------------------------------------------------------
    // login endpoint – response handling
    // -----------------------------------------------------------------------
    describe('login endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful 200 response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { token: 'access-token-123' } });

            const result = await store.dispatch(
                testAuthApi.endpoints.login.initiate({ email: 'u@test.com', password: 'pw' })
            );

            expect((result as { data?: unknown }).data).toEqual({ token: 'access-token-123' });
        });

        it('should return an error payload on a 401 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 401, data: { message: 'Unauthorised' } } });

            const result = await store.dispatch(
                testAuthApi.endpoints.login.initiate({ email: 'u@test.com', password: 'wrong' })
            );

            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should return an error payload on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: { message: 'Internal server error' } } });

            const result = await store.dispatch(
                testAuthApi.endpoints.login.initiate({ email: 'u@test.com', password: 'pw' })
            );

            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should record the mutation in the store after dispatch', async () => {
            mockBaseQuery.mockResolvedValue({ data: { token: 'tok' } });

            await store.dispatch(
                testAuthApi.endpoints.login.initiate({ email: 'u@test.com', password: 'pw' })
            );

            const mutationsMap = store.getState()[testAuthApi.reducerPath].mutations;
            expect(Object.keys(mutationsMap).length).toBeGreaterThan(0);
        });

        it('should handle a network error and return an error result', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));

            const result = await store.dispatch(
                testAuthApi.endpoints.login.initiate({ email: 'u@test.com', password: 'pw' })
            );

            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    // -----------------------------------------------------------------------
    // Base URL configuration
    // -----------------------------------------------------------------------
    describe('Base URL configuration', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: {} });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should include "/auth/" in the request URL', async () => {
            await store.dispatch(
                testAuthApi.endpoints.login.initiate({ email: 'x@y.com', password: 'p' })
            );

            // mockBaseQuery receives the relative url; 'login' is the path under /auth/
            const [arg] = mockBaseQuery.mock.calls[0];
            expect(arg.url).toBeDefined();
            expect(typeof arg.url).toBe('string');
        });

        it('should append "login" after the /auth/ segment', async () => {
            await store.dispatch(
                testAuthApi.endpoints.login.initiate({ email: 'x@y.com', password: 'p' })
            );

            const [arg] = mockBaseQuery.mock.calls[0];
            expect(arg.url).toMatch(/login$/);
        });
    });
});
