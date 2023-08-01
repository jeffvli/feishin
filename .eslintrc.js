module.exports = {
    extends: ['erb', 'plugin:typescript-sort-keys/recommended'],
    ignorePatterns: ['.erb/*', 'server'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        createDefaultProgram: true,
        ecmaVersion: 12,
        parser: '@typescript-eslint/parser',
        project: './tsconfig.json',
        sourceType: 'module',
        tsconfigRootDir: './',
    },
    plugins: ['@typescript-eslint', 'import', 'sort-keys-fix'],
    rules: {
        '@typescript-eslint/naming-convention': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-shadow': ['off'],
        '@typescript-eslint/no-unused-vars': ['error'],
        '@typescript-eslint/no-use-before-define': ['error'],
        'default-case': 'off',
        'import/extensions': 'off',
        'import/no-absolute-path': 'off',
        // A temporary hack related to IDE not resolving correct package.json
        'import/no-extraneous-dependencies': 'off',
        'import/no-unresolved': 'error',
        'import/order': [
            'error',
            {
                alphabetize: {
                    caseInsensitive: true,
                    order: 'asc',
                },
                groups: ['builtin', 'external', 'internal', ['parent', 'sibling']],
                'newlines-between': 'never',
                pathGroups: [
                    {
                        group: 'external',
                        pattern: 'react',
                        position: 'before',
                    },
                ],
                pathGroupsExcludedImportTypes: ['react'],
            },
        ],
        'import/prefer-default-export': 'off',
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/interactive-supports-focus': 'off',
        'jsx-a11y/media-has-caption': 'off',
        'no-await-in-loop': 'off',
        'no-console': 'off',
        'no-nested-ternary': 'off',
        'no-restricted-syntax': 'off',
        'no-shadow': 'off',
        'no-underscore-dangle': 'off',
        'no-unused-vars': 'off',
        'no-use-before-define': 'off',
        'prefer-destructuring': 'off',
        'react/function-component-definition': 'off',
        'react/jsx-filename-extension': [2, { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
        'react/jsx-no-useless-fragment': 'off',
        'react/jsx-props-no-spreading': 'off',
        'react/jsx-sort-props': [
            'error',
            {
                callbacksLast: true,
                ignoreCase: false,
                noSortAlphabetically: false,
                reservedFirst: true,
                shorthandFirst: true,
                shorthandLast: false,
            },
        ],
        'react/no-array-index-key': 'off',
        'react/react-in-jsx-scope': 'off',
        'react/require-default-props': 'off',
        'sort-keys-fix/sort-keys-fix': 'warn',
    },
    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
        'import/resolver': {
            // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
            node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx'],
            },
            typescript: {
                alwaysTryTypes: true,
                project: './tsconfig.json',
            },
            webpack: {
                config: require.resolve('./.erb/configs/webpack.config.eslint.ts'),
            },
        },
    },
};
