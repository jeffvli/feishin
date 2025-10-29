import json from '@eslint/json';
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier';
import tseslint from '@electron-toolkit/eslint-config-ts';
import perfectionist from 'eslint-plugin-perfectionist';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';

export default tseslint.config(
    { ignores: ['**/node_modules', '**/dist', '**/out'] },
    tseslint.configs.recommended,
    {
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    {
        files: ['**/*.{ts,tsx}'],
        ...perfectionist.configs['recommended-natural'],
        ...eslintPluginReact.configs.flat['jsx-runtime'],
        ...eslintPluginReact.configs.flat.recommended,
        plugins: {
            'react-hooks': eslintPluginReactHooks,
            'react-refresh': eslintPluginReactRefresh,
        },
        rules: {
            ...eslintPluginReactHooks.configs.recommended.rules,
            ...eslintPluginReactRefresh.configs.vite.rules,
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-duplicate-enum-values': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            curly: ['error', 'all'],
            indent: [
                'error',
                'tab',
                {
                    offsetTernaryExpressions: true,
                    SwitchCase: 1,
                },
            ],
            'no-unused-vars': 'off',
            'no-use-before-define': 'off',
            quotes: ['error', 'single'],
            'react-refresh/only-export-components': 'off',
            'react/display-name': 'off',
            semi: ['error', 'always'],
            'single-attribute-per-line': 'off',
        },
    },
    eslintConfigPrettier,
    {
        plugins: {
            json,
        },
        files: ['**/*.json'],
        ignores: ['.stylelintrc.json'],
        language: 'json/json',
        rules: {
            'json/no-duplicate-keys': 'error',
            'no-irregular-whitespace': 'off',
        },
    },
);
