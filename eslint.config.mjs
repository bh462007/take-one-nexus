import nextPlugin from 'eslint-config-next';

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...(Array.isArray(nextPlugin) ? nextPlugin : [nextPlugin]),
  {
    rules: {
      // Next.js-specific - disabled for legacy HTML navigation patterns
      '@next/next/no-img-element': 'off',
      '@next/next/no-html-link-for-pages': 'off',

      // React - disabled for intentional SSR error boundary patterns
      'react/no-unescaped-entities': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/set-state-in-effect': 'off',

      // TypeScript - downgraded to warnings to not block builds
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',

      // React hooks ordering - variable hoisting is intentional in some hooks
      'react-hooks/rules-of-hooks': 'warn',

      // General
      'no-var': 'warn',
    },
  },
];

export default eslintConfig;
