/* eslint-disable */
// Mock validation context
export const mockHasErrors = false;
export const mockErrorCount = 0;
export const mockErrors = new Map();

export const useValidationContext = () => ({
  hasErrors: mockHasErrors,
  getErrorCount: () => mockErrorCount,
  errors: mockErrors,
  setNodeErrors: () => {},
  clearNodeErrors: () => {},
  clearAllErrors: () => {},
  getNodeError: () => undefined,
  getAllErrors: () => [],
});

export const ValidationProvider = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);
