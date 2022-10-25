module.exports = {
  extends: ['plugin:typescript-sort-keys/recommended'],
  ignorePatterns: [],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    createDefaultProgram: true,
    ecmaVersion: 2020,
    project: './tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import', 'sort-keys-fix'],
  root: true,
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-shadow': ['off'],
    'import/no-cycle': 'error',
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
      },
    ],
    'import/prefer-default-export': 'off',
    'no-await-in-loop': 'off',
    'no-console': 'off',
    'no-nested-ternary': 'off',
    'no-restricted-syntax': 'off',
    'sort-keys-fix/sort-keys-fix': 'warn',
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },
    'import/resolver': {
      // See https://github.com/benmosher/eslint-plugin-import/issues/1396#issuecomment-575727774 for line below
      node: {
        extensions: ['.js', '.ts'],
        paths: ['node_modules/', 'node_modules/@types'],
      },
      typescript: {},
    },
  },
};
