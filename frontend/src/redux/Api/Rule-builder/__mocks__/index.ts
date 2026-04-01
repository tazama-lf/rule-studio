// Manual mock for src/redux/Api/Rule-builder/index.ts
// Used automatically by Jest when a test calls jest.mock('...Rule-builder').
// All hooks are jest.fn() so tests can call .mockReturnValue(), .mockImplementation(), etc.
export const useGetNodesQuery = jest.fn(() => ({
  data: [],
  isLoading: false,
  error: null,
  refetch: () => Promise.resolve(),
}));

export const useGetFlowQuery = jest.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
}));

export const useGetAllFlowQuery = jest.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
}));

export const useSaveFlowMutation = jest.fn(() => [
  () => Promise.resolve({ data: { success: true } }),
  { isLoading: false },
]);

export const useGetGlobalVariablesQuery = jest.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
}));

export const useLazyGetGlobalVariablesQuery = jest.fn(() => [
  () => Promise.resolve({ data: null }),
  { data: null, isLoading: false, error: null },
]);

export const useExecuteQueryMutation = jest.fn(() => [
  () => Promise.resolve({ data: { rows: [], fields: [] } }),
  { isLoading: false, reset: jest.fn() },
]);

export const useGetRuleFlowStatusQuery = jest.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
}));

export const useUpdateMetadataMutation = jest.fn(() => [
  () => Promise.resolve({ data: { success: true } }),
  { isLoading: false },
]);

const initialRuleBuilderState = { queries: {}, mutations: {} };

export const ruleBuilderApi = {
  reducerPath: 'ruleBuilderApi',
  reducer: (state = initialRuleBuilderState) => state,
  middleware: () => (next: (action: unknown) => unknown) => (action: unknown) => next(action),
  endpoints: {
    getNodes: {},
    getFlow: {},
    getAllFlow: {},
    saveFlow: {},
    getGlobalVariables: {},
    executeQuery: {},
    getRuleFlowStatus: {},
  },
};
