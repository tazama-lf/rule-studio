import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
}

interface ImportMetaEnv {
  VITE_CRYPTO_KEY: string;
  VITE_API_URL: string;
  MODE: string;
  DEV: boolean;
  PROD: boolean;
  SSR: boolean;
}

(global as typeof global & { importMeta: { env: ImportMetaEnv } }).importMeta = {
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
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
  unobserve() {}
} as unknown as typeof global.IntersectionObserver;

global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof global.ResizeObserver;

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
