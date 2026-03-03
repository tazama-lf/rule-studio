import '@testing-library/jest-dom';

// Polyfill for TextEncoder/TextDecoder (needed for react-router-dom v7)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock import.meta for Vite
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

// Mock window.matchMedia
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

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock scrollIntoView
Element.prototype.scrollIntoView = function() {};

// Mock HTMLElement.prototype.scrollTo
if (!HTMLElement.prototype.scrollTo) {
  HTMLElement.prototype.scrollTo = function() {};
}

// Suppress console errors in tests (optional)
// global.console = {
//   ...console,
//   error: () => {},
//   warn: () => {},
// };
