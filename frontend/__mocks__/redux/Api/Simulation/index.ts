/* eslint-disable @typescript-eslint/no-explicit-any */
// Mock for Simulation API
const mockFn = () => ({ unwrap: () => Promise.resolve({}) });

export const useMergeBranchMutation = (): any => [
  mockFn,
  {
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: undefined,
    data: undefined,
  },
];

export const useCreateRepoMutation = (): any => [
  mockFn,
  {
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: undefined,
    data: undefined,
  },
];

export const useUploadCodeMutation = (): any => [
  mockFn,
  {
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: undefined,
    data: undefined,
  },
];

export const useLazyGetReportQuery = (): any => [
  mockFn,
  {
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: undefined,
    data: undefined,
  },
];

export const useLazyGetReportStatusQuery = (): any => [
  mockFn,
  {
    isLoading: false,
    isSuccess: false,
    isError: false,
    error: undefined,
    data: undefined,
  },
];
