/** @type {import('@commitlint/types').UserConfig} */
const config = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-enum': [
            2,
            'always',
            [
                'api',
                'ci',
                'deps',
                'discover',
                'i18n',
                'library',
                'lyrics',
                'player',
                'radio',
                'release',
                'remote',
                'servers',
                'sharing',
                'tag-editor',
                'theme',
                'ui',
                'visualizer',
                'window',
            ],
        ],
        'scope-case': [2, 'always', 'kebab-case'],
        'subject-case': [2, 'never', ['pascal-case', 'upper-case']],
        'body-max-line-length': [0],
    },
};

export default config;
