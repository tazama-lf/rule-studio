import { configureStore } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query/react';
import {
    simulationApi,
    useCreateRepoMutation,
    useUploadCodeMutation,
    useMergeBranchMutation,
    useLazyGetReportQuery,
    useLazyGetReportStatusQuery,
    useLazyGetOrganizationQuery,
} from '../../../../src/redux/Api/Simulation';
import { getAuthToken } from '../../../../src/utils/Common/storage';

type SimulationTestGlobal = typeof global & {
    __simulationInnerBaseQuery: jest.Mock;
    __simulationPrepareHeaders: ((headers: Headers) => Headers) | undefined;
};

jest.mock('@reduxjs/toolkit/query/react', () => {
    const actual = jest.requireActual<typeof import('@reduxjs/toolkit/query/react')>('@reduxjs/toolkit/query/react');
    const innerMock = jest.fn();
    (global as SimulationTestGlobal).__simulationInnerBaseQuery = innerMock;
    return {
        ...actual,
        fetchBaseQuery: jest.fn((config: { prepareHeaders?: (headers: Headers) => Headers }) => {
            (global as SimulationTestGlobal).__simulationPrepareHeaders = config?.prepareHeaders;
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

const testSimulationApi = createApi({
    reducerPath: 'testSimulationApi',
    baseQuery: mockBaseQuery,
    endpoints: (builder) => ({
        createRepo: builder.mutation({
            query: (body: Record<string, unknown>) => ({
                url: '/api/v1/bootstrap',
                method: 'POST',
                body: { ...body },
            }),
        }),
        uploadCode: builder.mutation({
            query: (body: Record<string, unknown>) => ({
                url: '/api/v1/populate',
                method: 'POST',
                body: { ...body },
            }),
        }),
        mergeBranch: builder.mutation({
            query: (body: Record<string, unknown>) => ({
                url: '/api/v1/promote',
                method: 'POST',
                body: { ...body },
            }),
        }),
        getReport: builder.query({
            query: ({ branchName, ruleId }: { branchName: string; ruleId: string }) => ({
                url: `/api/v1/report?&ruleId=${ruleId}&branchName=${branchName}`,
                method: 'GET',
            }),
        }),
        getReportStatus: builder.query({
            query: ({ branchName, ruleId }: { branchName: string; ruleId: string }) => ({
                url: `/api/v1/unit-tests/status?&ruleId=${ruleId}&branchName=${branchName}`,
                method: 'GET',
            }),
        }),
        getOrganization: builder.query({
            query: () => ({
                url: '/api/v1/organization',
                method: 'GET',
            }),
        }),
    }),
});

const makeRealStore = () =>
    configureStore({
        reducer: { [simulationApi.reducerPath]: simulationApi.reducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(simulationApi.middleware),
    });

const makeTestStore = () =>
    configureStore({
        reducer: { [testSimulationApi.reducerPath]: testSimulationApi.reducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(testSimulationApi.middleware),
    });

const makeRealEndpointStore = () =>
    configureStore({
        reducer: { [simulationApi.reducerPath]: simulationApi.reducer },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(simulationApi.middleware),
    });

const getRealInnerMock = () =>
    (global as SimulationTestGlobal).__simulationInnerBaseQuery;

const getCapturedPrepareHeaders = (): ((headers: Headers) => Headers) | undefined =>
    (global as SimulationTestGlobal).__simulationPrepareHeaders;

describe('simulationApi (redux/Api/Simulation)', () => {
    describe('Module Structure', () => {
        it('should export simulationApi', () => {
            expect(simulationApi).toBeDefined();
        });

        it('should have reducerPath "simulationApi"', () => {
            expect(simulationApi.reducerPath).toBe('simulationApi');
        });

        it('should expose a reducer function', () => {
            expect(typeof simulationApi.reducer).toBe('function');
        });

        it('should expose middleware as a function', () => {
            expect(typeof simulationApi.middleware).toBe('function');
        });

        it('should define the createRepo endpoint', () => {
            expect(simulationApi.endpoints.createRepo).toBeDefined();
        });

        it('should define the uploadCode endpoint', () => {
            expect(simulationApi.endpoints.uploadCode).toBeDefined();
        });

        it('should define the mergeBranch endpoint', () => {
            expect(simulationApi.endpoints.mergeBranch).toBeDefined();
        });

        it('should define the getReport endpoint', () => {
            expect(simulationApi.endpoints.getReport).toBeDefined();
        });

        it('should define the getReportStatus endpoint', () => {
            expect(simulationApi.endpoints.getReportStatus).toBeDefined();
        });

        it('should define the getOrganization endpoint', () => {
            expect(simulationApi.endpoints.getOrganization).toBeDefined();
        });

        it('should export useCreateRepoMutation as a function', () => {
            expect(typeof useCreateRepoMutation).toBe('function');
        });

        it('should export useUploadCodeMutation as a function', () => {
            expect(typeof useUploadCodeMutation).toBe('function');
        });

        it('should export useMergeBranchMutation as a function', () => {
            expect(typeof useMergeBranchMutation).toBe('function');
        });

        it('should export useLazyGetReportQuery as a function', () => {
            expect(typeof useLazyGetReportQuery).toBe('function');
        });

        it('should export useLazyGetReportStatusQuery as a function', () => {
            expect(typeof useLazyGetReportStatusQuery).toBe('function');
        });

        it('should export useLazyGetOrganizationQuery as a function', () => {
            expect(typeof useLazyGetOrganizationQuery).toBe('function');
        });
    });

    describe('Redux store integration', () => {
        it('should initialise simulationApi state when added to a store', () => {
            const store = makeRealStore();
            expect(store.getState()[simulationApi.reducerPath]).toBeDefined();
        });

        it('should start with an empty queries map', () => {
            const store = makeRealStore();
            expect(store.getState()[simulationApi.reducerPath].queries).toEqual({});
        });

        it('should start with an empty mutations map', () => {
            const store = makeRealStore();
            expect(store.getState()[simulationApi.reducerPath].mutations).toEqual({});
        });
    });

    describe('createRepo endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { success: true } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the POST method', async () => {
            await store.dispatch(testSimulationApi.endpoints.createRepo.initiate({ name: 'repo-1' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('POST');
        });

        it('should target the "/api/v1/bootstrap" URL', async () => {
            await store.dispatch(testSimulationApi.endpoints.createRepo.initiate({ name: 'repo-1' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('/api/v1/bootstrap');
        });

        it('should spread body fields into the request body', async () => {
            await store.dispatch(testSimulationApi.endpoints.createRepo.initiate({ name: 'repo-1', ruleId: '42' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ body: Record<string, unknown> }];
            expect(arg.body.name).toBe('repo-1');
            expect(arg.body.ruleId).toBe('42');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testSimulationApi.endpoints.createRepo.initiate({}));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('createRepo endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { repoUrl: 'https://git.example.com/repo' } });
            const result = await store.dispatch(testSimulationApi.endpoints.createRepo.initiate({}));
            expect((result as { data?: unknown }).data).toEqual({ repoUrl: 'https://git.example.com/repo' });
        });

        it('should return an error on a 400 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 400, data: 'Bad Request' } });
            const result = await store.dispatch(testSimulationApi.endpoints.createRepo.initiate({}));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should return an error on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Server Error' } });
            const result = await store.dispatch(testSimulationApi.endpoints.createRepo.initiate({}));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should record the mutation in the store', async () => {
            mockBaseQuery.mockResolvedValue({ data: {} });
            await store.dispatch(testSimulationApi.endpoints.createRepo.initiate({}));
            expect(Object.keys(store.getState()[testSimulationApi.reducerPath].mutations).length).toBeGreaterThan(0);
        });
    });

    describe('uploadCode endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { success: true } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the POST method', async () => {
            await store.dispatch(testSimulationApi.endpoints.uploadCode.initiate({ code: 'const x = 1;' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('POST');
        });

        it('should target the "/api/v1/populate" URL', async () => {
            await store.dispatch(testSimulationApi.endpoints.uploadCode.initiate({ code: 'const x = 1;' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('/api/v1/populate');
        });

        it('should spread body fields into the request body', async () => {
            await store.dispatch(testSimulationApi.endpoints.uploadCode.initiate({ code: 'const x = 1;', ruleId: '5' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ body: Record<string, unknown> }];
            expect(arg.body.code).toBe('const x = 1;');
            expect(arg.body.ruleId).toBe('5');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testSimulationApi.endpoints.uploadCode.initiate({}));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('uploadCode endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { uploaded: true } });
            const result = await store.dispatch(testSimulationApi.endpoints.uploadCode.initiate({}));
            expect((result as { data?: unknown }).data).toEqual({ uploaded: true });
        });

        it('should return an error on a 422 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 422, data: 'Unprocessable Entity' } });
            const result = await store.dispatch(testSimulationApi.endpoints.uploadCode.initiate({}));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should handle a network error', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));
            const result = await store.dispatch(testSimulationApi.endpoints.uploadCode.initiate({}));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('mergeBranch endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { merged: true } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the POST method', async () => {
            await store.dispatch(testSimulationApi.endpoints.mergeBranch.initiate({ branch: 'feature/test' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('POST');
        });

        it('should target the "/api/v1/promote" URL', async () => {
            await store.dispatch(testSimulationApi.endpoints.mergeBranch.initiate({ branch: 'feature/test' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('/api/v1/promote');
        });

        it('should spread body fields into the request body', async () => {
            await store.dispatch(testSimulationApi.endpoints.mergeBranch.initiate({ branch: 'feature/test', ruleId: '7' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ body: Record<string, unknown> }];
            expect(arg.body.branch).toBe('feature/test');
            expect(arg.body.ruleId).toBe('7');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testSimulationApi.endpoints.mergeBranch.initiate({}));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('mergeBranch endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { merged: true, commitSha: 'abc123' } });
            const result = await store.dispatch(testSimulationApi.endpoints.mergeBranch.initiate({}));
            expect((result as { data?: unknown }).data).toEqual({ merged: true, commitSha: 'abc123' });
        });

        it('should return an error on a 409 conflict response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 409, data: 'Conflict' } });
            const result = await store.dispatch(testSimulationApi.endpoints.mergeBranch.initiate({}));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should return an error on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Server Error' } });
            const result = await store.dispatch(testSimulationApi.endpoints.mergeBranch.initiate({}));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('getReport endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: '<html>report</html>' });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the GET method', async () => {
            await store.dispatch(testSimulationApi.endpoints.getReport.initiate({ branchName: 'main', ruleId: '1' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should build the URL with ruleId and branchName query params', async () => {
            await store.dispatch(testSimulationApi.endpoints.getReport.initiate({ branchName: 'main', ruleId: '42' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('/api/v1/report?&ruleId=42&branchName=main');
        });

        it('should interpolate different branchName values', async () => {
            await store.dispatch(testSimulationApi.endpoints.getReport.initiate({ branchName: 'feature/test', ruleId: '7' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('/api/v1/report?&ruleId=7&branchName=feature/test');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testSimulationApi.endpoints.getReport.initiate({ branchName: 'main', ruleId: '1' }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('getReport endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return HTML report data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: '<html>report</html>' });
            const result = await store.dispatch(testSimulationApi.endpoints.getReport.initiate({ branchName: 'main', ruleId: '1' }));
            expect((result as { data?: unknown }).data).toBe('<html>report</html>');
        });

        it('should return an error on a 404 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 404, data: 'Not Found' } });
            const result = await store.dispatch(testSimulationApi.endpoints.getReport.initiate({ branchName: 'missing', ruleId: '0' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should handle a network error', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));
            const result = await store.dispatch(testSimulationApi.endpoints.getReport.initiate({ branchName: 'main', ruleId: '1' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('getReport endpoint – responseHandler', () => {
        it('should pass responseHandler that calls response.text()', async () => {
            const store = makeRealEndpointStore();
            getRealInnerMock().mockResolvedValue({ data: '<html>report</html>' });
            await store.dispatch(simulationApi.endpoints.getReport.initiate({ branchName: 'main', ruleId: '1' }));
            const [queryArg] = getRealInnerMock().mock.calls[0] as [
                { url: string; responseHandler: (r: { text: () => Promise<string> }) => Promise<string> }
            ];
            expect(typeof queryArg.responseHandler).toBe('function');
            const mockResponse = { text: jest.fn().mockResolvedValue('<html>content</html>') };
            const result = await queryArg.responseHandler(mockResponse);
            expect(mockResponse.text).toHaveBeenCalledTimes(1);
            expect(result).toBe('<html>content</html>');
            jest.clearAllMocks();
        });
    });

    describe('getReportStatus endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { status: 'passed' } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the GET method', async () => {
            await store.dispatch(testSimulationApi.endpoints.getReportStatus.initiate({ branchName: 'main', ruleId: '1' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should build the URL with ruleId and branchName query params', async () => {
            await store.dispatch(testSimulationApi.endpoints.getReportStatus.initiate({ branchName: 'main', ruleId: '5' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('/api/v1/unit-tests/status?&ruleId=5&branchName=main');
        });

        it('should interpolate different ruleId values', async () => {
            await store.dispatch(testSimulationApi.endpoints.getReportStatus.initiate({ branchName: 'dev', ruleId: '99' }));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('/api/v1/unit-tests/status?&ruleId=99&branchName=dev');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testSimulationApi.endpoints.getReportStatus.initiate({ branchName: 'main', ruleId: '1' }));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('getReportStatus endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return status data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { status: 'passed', total: 10, passed: 10 } });
            const result = await store.dispatch(testSimulationApi.endpoints.getReportStatus.initiate({ branchName: 'main', ruleId: '1' }));
            expect((result as { data?: unknown }).data).toEqual({ status: 'passed', total: 10, passed: 10 });
        });

        it('should return an error on a 404 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 404, data: 'Not Found' } });
            const result = await store.dispatch(testSimulationApi.endpoints.getReportStatus.initiate({ branchName: 'missing', ruleId: '0' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should handle a network error', async () => {
            mockBaseQuery.mockRejectedValue(new Error('Network failure'));
            const result = await store.dispatch(testSimulationApi.endpoints.getReportStatus.initiate({ branchName: 'main', ruleId: '1' }));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('getOrganization endpoint – request construction', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
            mockBaseQuery.mockResolvedValue({ data: { organization: 'my-org' } });
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should use the GET method', async () => {
            await store.dispatch(testSimulationApi.endpoints.getOrganization.initiate(undefined));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ method: string }];
            expect(arg.method).toBe('GET');
        });

        it('should target the "/api/v1/organization" URL', async () => {
            await store.dispatch(testSimulationApi.endpoints.getOrganization.initiate(undefined));
            const [arg] = mockBaseQuery.mock.calls[0] as [{ url: string }];
            expect(arg.url).toBe('/api/v1/organization');
        });

        it('should call the base query exactly once', async () => {
            await store.dispatch(testSimulationApi.endpoints.getOrganization.initiate(undefined));
            expect(mockBaseQuery).toHaveBeenCalledTimes(1);
        });
    });

    describe('getOrganization endpoint – response handling', () => {
        let store: ReturnType<typeof makeTestStore>;

        beforeEach(() => {
            store = makeTestStore();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should return organization data on a successful response', async () => {
            mockBaseQuery.mockResolvedValue({ data: { organization: 'acme-corp' } });
            const result = await store.dispatch(testSimulationApi.endpoints.getOrganization.initiate(undefined));
            expect((result as { data?: unknown }).data).toEqual({ organization: 'acme-corp' });
        });

        it('should return an error on a 403 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 403, data: 'Forbidden' } });
            const result = await store.dispatch(testSimulationApi.endpoints.getOrganization.initiate(undefined));
            expect((result as { error?: unknown }).error).toBeDefined();
        });

        it('should return an error on a 500 response', async () => {
            mockBaseQuery.mockResolvedValue({ error: { status: 500, data: 'Server Error' } });
            const result = await store.dispatch(testSimulationApi.endpoints.getOrganization.initiate(undefined));
            expect((result as { error?: unknown }).error).toBeDefined();
        });
    });

    describe('prepareHeaders – authorization logic', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should set the authorization header when a token is present', () => {
            const prepareHeaders = getCapturedPrepareHeaders()!;
            mockedGetAuthToken.mockReturnValue('sim-token-xyz');
            const headers = new Headers();
            prepareHeaders(headers);
            expect(headers.get('authorization')).toBe('Bearer sim-token-xyz');
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

        it('createRepo – query function builds the correct URL and method', async () => {
            await store.dispatch(simulationApi.endpoints.createRepo.initiate({ name: 'repo' }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toContain('/api/v1/bootstrap');
            expect(arg.method).toBe('POST');
        });

        it('uploadCode – query function builds the correct URL and method', async () => {
            await store.dispatch(simulationApi.endpoints.uploadCode.initiate({ code: 'x' }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toContain('/api/v1/populate');
            expect(arg.method).toBe('POST');
        });

        it('mergeBranch – query function builds the correct URL and method', async () => {
            await store.dispatch(simulationApi.endpoints.mergeBranch.initiate({ branch: 'main' }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string; method: string }];
            expect(arg.url).toContain('/api/v1/promote');
            expect(arg.method).toBe('POST');
        });

        it('getReport – query function builds the correct URL', async () => {
            await store.dispatch(simulationApi.endpoints.getReport.initiate({ branchName: 'main', ruleId: '1' }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string }];
            expect(arg.url).toContain('/api/v1/report');
            expect(arg.url).toContain('ruleId=1');
            expect(arg.url).toContain('branchName=main');
        });

        it('getReportStatus – query function builds the correct URL', async () => {
            await store.dispatch(simulationApi.endpoints.getReportStatus.initiate({ branchName: 'main', ruleId: '1' }));
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string }];
            expect(arg.url).toContain('/api/v1/unit-tests/status');
            expect(arg.url).toContain('ruleId=1');
        });

        it('getOrganization – query function builds the correct URL', async () => {
            await store.dispatch(simulationApi.endpoints.getOrganization.initiate());
            const [arg] = getRealInnerMock().mock.calls[0] as [{ url: string }];
            expect(arg.url).toContain('/api/v1/organization');
        });
    });
});
