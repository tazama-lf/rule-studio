import type { Config } from '@jest/types';

// Jest config for NestJS project with tests inside /test folder
const config: Config.InitialOptions = {
  bail: 1,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  preset: 'ts-jest',
  testEnvironment: 'node',

  // 👇 IMPORTANT: You store tests inside /test folder
  roots: ['<rootDir>/test'],

  // Use spec or test convention
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],

  // Transform TS using ts-jest
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // Load .env before all tests
  setupFiles: ['dotenv/config'],

  // Only if you create this file (optional):
  // setupFilesAfterEnv: ['<rootDir>/src/config/jest.setup.ts'],

  // Coverage settings
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/**/index.ts',
    '!src/**/*.module.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageProvider: 'v8',

  coveragePathIgnorePatterns: [
    '/node_modules/',
    // '<rootDir>/test/',
    '.mock.ts',
    '.module.ts',
    '.*utils.*',
    '.*types.*',
    '.*controller.*',
    '.*repository.*',
    '.*dto.*',
    '.*interfaces.*',
    '.*enum.*',
    '/services/',
    '/database/',
  ],

  verbose: true,
};

export default config;
