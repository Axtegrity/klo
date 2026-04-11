// eslint-security.standalone.config.js
//
// Standalone wrapper around ./eslint-security.config.js for the SAST workflow.
//
// The rules-only fragment in eslint-security.config.js is imported into the
// project's main eslint.config.mjs, where Next + TypeScript + react-hooks
// configs already supply a parser and register their plugins. When the SAST
// workflow runs ESLint with --config pointing at the security rules alone,
// none of that scaffolding is present, so this file adds:
//
//   1. A TypeScript parser so .ts/.tsx files parse at all.
//   2. Stub registrations for the @next/next, @typescript-eslint, and
//      react-hooks plugins so that inline `// eslint-disable-next-line
//      <plugin>/<rule>` directives in source files resolve cleanly during
//      this isolated pass. No rules from those plugins are enabled — only
//      the security rules from eslint-security.config.js fire.
//   3. reportUnusedDisableDirectives off so the (technically unused, since
//      we don't enable the underlying rules) inline disables don't get
//      re-reported as warnings.
//
// This file is NEVER imported into eslint.config.mjs — keeping it separate
// avoids "Cannot redefine plugin" collisions with the main lint pipeline.

import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import nextPlugin from '@next/eslint-plugin-next'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import securityConfig from './eslint-security.config.js'

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ['src/**/*.{ts,tsx,js,jsx}', 'app/**/*.{ts,tsx,js,jsx}', 'pages/**/*.{ts,tsx,js,jsx}'],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },

    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },

    plugins: {
      '@typescript-eslint': tsPlugin,
      '@next/next': nextPlugin,
      'react-hooks': reactHooksPlugin,
    },
  },
  ...securityConfig,
]
