import { configureStore } from '@reduxjs/toolkit';

// Create a mock store for testing
export const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      // Add your reducers here
    },
    preloadedState: initialState,
  });
};

// Mock API hooks
export const mockUseGetNodesQuery = {
  data: [],
  isLoading: false,
  error: null,
  refetch: () => Promise.resolve(),
};

export const mockUseSaveFlowMutation = [
  () => Promise.resolve({ data: { success: true } }),
  { isLoading: false },
];

export const mockUseGetGlobalVariablesQuery = {
  data: null,
  isLoading: false,
  error: null,
};

export const mockUseGetFlowQuery = {
  data: null,
  isLoading: false,
  error: null,
};

export const mockUseUpdateMetadataMutation = [
  () => Promise.resolve({ data: { success: true } }),
  { isLoading: false },
];
