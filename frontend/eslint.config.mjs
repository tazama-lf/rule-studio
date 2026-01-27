// SPDX-License-Identifier: Apache-2.0
import eslintPluginEslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import stylistic from '@stylistic/eslint-plugin';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import eslintStandard from 'eslint-config-love';
import eslintConfigPrettier from 'eslint-config-prettier';
export default [
  eslintConfigPrettier,
  {
    ignores: [
      '**/coverage/**',
      '**/build/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/__tests__/**',
      '**/test/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      ...eslintStandard.plugins,
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      '@eslint-community/eslint-comments': eslintPluginEslintComments,
      '@stylistic': stylistic,
      '@typescript-eslint': tsEslint,
    },
    languageOptions: {
      ...eslintStandard.languageOptions,
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...eslintStandard.rules,
      ...eslintPluginEslintComments.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/init-declarations': 'off',
      '@typescript-eslint/max-params': ['warn', { max: 6 }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-magic-numbers': 'warn',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/prefer-destructuring': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@stylistic/quotes': ['error', 'single'],
      complexity: ['warn', { max: 15 }],
      'no-console': 'error',
      'no-unneeded-ternary': 'off',
      '@eslint-community/eslint-comments/require-description': [
        'error',
        { ignore: ['eslint-enable'] },
      ],
      '@eslint-community/eslint-comments/disable-enable-pair': 'error',
      'eslint-comments/require-description': 'off',
      'eslint-comments/disable-enable-pair': 'off',
      'eslint-comments/no-aggregating-enable': 'off',
      'eslint-comments/no-duplicate-disable': 'off',
      'eslint-comments/no-unlimited-disable': 'off',
      'eslint-comments/no-unused-enable': 'off',
    },
  },
];