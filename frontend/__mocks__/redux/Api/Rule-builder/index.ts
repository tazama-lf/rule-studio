// Mock for redux/Api/Rule-builder
export const useGetNodesQuery = () => ({
  data: [],
  isLoading: false,
  error: null,
  refetch: () => Promise.resolve(),
});

export const useGetFlowQuery = () => ({
  data: null,
  isLoading: false,
  error: null,
});

export const useGetAllFlowQuery = () => ({
  data: null,
  isLoading: false,
  error: null,
});

export const useSaveFlowMutation = () => [
  () => Promise.resolve({ data: { success: true } }),
  { isLoading: false },
];

export const useGetGlobalVariablesQuery = () => ({
  data: null,
  isLoading: false,
  error: null,
});

export const useExecuteQueryMutation = () => [
  () => Promise.resolve({ data: { rows: [], fields: [] } }),
  { isLoading: false },
];

export const useUpdateMetadataMutation = () => [
  () => Promise.resolve({ data: { success: true } }),
  { isLoading: false },
];

export const useLazyGetGlobalVariablesQuery = () => [
  () => Promise.resolve({ data: null }),
  { data: null, isLoading: false, error: null },
];

export const useGetRuleFlowStatusQuery = () => ({
  data: null,
  isLoading: false,
  error: null,
});

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
