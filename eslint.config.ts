import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
    // Base config
    {
        ignores: [
            'dist',
            'build',
            'node_modules',
            '.wrangler/**/*',
            '.react-router/**/*',
        ],
    },

    // TypeScript + React setup
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: './tsconfig.json',
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooks,
            'jsx-a11y': jsxA11y,
        },
        rules: {
            // React rules
            ...reactPlugin.configs.recommended.rules,
            ...reactHooks.configs.recommended.rules,
            ...jsxA11y.configs.recommended.rules,

            // ✅ Disable old JSX transform rules
            'react/react-in-jsx-scope': 'off',
            'react/jsx-uses-react': 'off',

            // Optional stricter rules
            'react/prop-types': 'off', // TS handles props validation
            'react/jsx-uses-vars': 'error',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
);
