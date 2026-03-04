import '@testing-library/jest-dom';

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
}

(global as any).importMeta = {
  env: {
    VITE_CRYPTO_KEY: 'test-crypto-key',
    VITE_API_URL: 'http://localhost:3000',
    MODE: 'test',
    DEV: false,
    PROD: false,
    SSR: false,
  },
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

Element.prototype.scrollIntoView = function() {};

if (!HTMLElement.prototype.scrollTo) {
  HTMLElement.prototype.scrollTo = function() {};
}

// Suppress console errors in tests (optional)
// global.console = {
//   ...console,
//   error: () => {},
//   warn: () => {},
// };
