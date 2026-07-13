import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'cypress/**',
      'vite.config.js',
      'cypress.config.js',
    ],
  },
  ...compat.extends(
    'airbnb',
    'airbnb/hooks',
    'plugin:jsx-a11y/recommended'
  ),
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        URL: 'readonly',
        Image: 'readonly',
        FileReader: 'readonly',
        ResizeObserver: 'readonly',
        HTMLElement: 'readonly',
      },
    },
    rules: {
      // React 17+ – no need to import React in scope
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      // Allow .jsx extension
      'react/jsx-filename-extension': ['warn', { extensions: ['.jsx', '.js'] }],
      // Prop types – JS project (not TS), skip
      'react/prop-types': 'off',
      // Allow default exports
      'import/prefer-default-export': 'off',
      // Allow named functions as default exports
      'react/function-component-definition': 'off',
      // Allow spreading props (we use it intentionally with RHF register)
      'react/jsx-props-no-spreading': 'off',
      // Allow for..of
      'no-restricted-syntax': 'off',
      // Allow ++
      'no-plusplus': 'off',
      // Allow param reassign for events
      'no-param-reassign': ['error', { props: false }],
      // Imports
      'import/extensions': ['error', 'ignorePackages', { js: 'never', jsx: 'never' }],
      // Allow TODO warnings
      'no-warning-comments': 'warn',
      // Allow console only in dev
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      // Accessible interactive elements
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      // Allow label with onClick
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    },
  },
];
