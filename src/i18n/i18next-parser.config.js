// Reference: https://github.com/i18next/i18next-parser#options

module.exports = {
    contextSeparator: '_',
    createOldCatalogs: true,
    customValueTemplate: null,
    defaultNamespace: 'translation',
    defaultValue: function (locale, namespace, key, value) {
        return key;
    },
    failOnUpdate: false,
    failOnWarnings: false,
    i18nextOptions: null,
    indentation: 4,
    input: [
        '../renderer/components/**/*.{js,jsx,ts,tsx}',
        '../renderer/features/**/*.{js,jsx,ts,tsx}',
        '../renderer/layouts/**/*.{js,jsx,ts,tsx}',
        '!../src/node_modules/**',
        '!../src/**/*.prod.js',
    ],
    keepRemoved: false,
    keySeparator: '.',
    lexers: {
        default: ['JavascriptLexer'],
        handlebars: ['HandlebarsLexer'],
        hbs: ['HandlebarsLexer'],
        htm: ['HTMLLexer'],
        html: ['HTMLLexer'],
        js: ['JavascriptLexer'],
        jsx: ['JsxLexer'],
        mjs: ['JavascriptLexer'],
        ts: ['JavascriptLexer'],
        tsx: ['JsxLexer'],
    },
    lineEnding: 'auto',
    locales: ['en'],
    namespaceSeparator: false,
    output: 'src/renderer/i18n/locales/$LOCALE.json',
    pluralSeparator: '_',
    resetDefaultValueLocale: 'en',
    sort: true,
    verbose: false,
};
