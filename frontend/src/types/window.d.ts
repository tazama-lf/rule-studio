// Extend Window interface for flow generation methods
declare global {
  interface Window {
    generateFlowJson?: () => string;
    generateFlowCode?: () => string;
    generateNestedFlowJson?: () => void;
    generateNestedFlowCode?: () => void;
    globalVariablesData?: unknown;
  }
}

export {};
