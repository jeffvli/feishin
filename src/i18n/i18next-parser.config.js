// i18next-parser.config.js

module.exports = {
  contextSeparator: '_',
  // Key separator used in your translation keys

  createOldCatalogs: true,

  // Exit with an exit code of 1 when translations are updated (for CI purpose)
  customValueTemplate: null,

  // Save the \_old files
  defaultNamespace: 'translation',

  // Default namespace used in your i18next config
  defaultValue: '',

  // Exit with an exit code of 1 on warnings
  failOnUpdate: false,

  // Display info about the parsing including some stats
  failOnWarnings: false,

  // The locale to compare with default values to determine whether a default value has been changed.
  // If this is set and a default value differs from a translation in the specified locale, all entries
  // for that key across locales are reset to the default value, and existing translations are moved to
  // the `_old` file.
  i18nextOptions: null,

  // Default value to give to empty keys
  // You may also specify a function accepting the locale, namespace, and key as arguments
  indentation: 2,

  // Plural separator used in your translation keys
  // If you want to use plain english keys, separators such as `_` might conflict. You might want to set `pluralSeparator` to a different string that does not occur in your keys.
  input: [
    '../components/**/*.{js,jsx,ts,tsx}',
    '../features/**/*.{js,jsx,ts,tsx}',
    '../layouts/**/*.{js,jsx,ts,tsx}',
    '!../../src/node_modules/**',
    '!../../src/**/*.prod.js',
  ],

  // Indentation of the catalog files
  keepRemoved: false,

  // Keep keys from the catalog that are no longer in code
  keySeparator: '.',

  // Key separator used in your translation keys
  // If you want to use plain english keys, separators such as `.` and `:` will conflict. You might want to set `keySeparator: false` and `namespaceSeparator: false`. That way, `t('Status: Loading...')` will not think that there are a namespace and three separator dots for instance.
  // see below for more details
  lexers: {
    default: ['JavascriptLexer'],
    handlebars: ['HandlebarsLexer'],

    hbs: ['HandlebarsLexer'],
    htm: ['HTMLLexer'],

    html: ['HTMLLexer'],
    js: ['JavascriptLexer'],
    jsx: ['JsxLexer'],

    mjs: ['JavascriptLexer'],
    // if you're writing jsx inside .js files, change this to JsxLexer
    ts: ['JavascriptLexer'],

    tsx: ['JsxLexer'],
  },

  lineEnding: 'auto',

  // Control the line ending. See options at https://github.com/ryanve/eol
  locales: ['en'],

  // An array of the locales in your applications
  namespaceSeparator: false,

  // Namespace separator used in your translation keys
  // If you want to use plain english keys, separators such as `.` and `:` will conflict. You might want to set `keySeparator: false` and `namespaceSeparator: false`. That way, `t('Status: Loading...')` will not think that there are a namespace and three separator dots for instance.
  output: 'src/renderer/i18n/locales/$LOCALE.json',

  // Supports $LOCALE and $NAMESPACE injection
  // Supports JSON (.json) and YAML (.yml) file formats
  // Where to write the locale files relative to process.cwd()
  pluralSeparator: '_',

  // If you wish to customize the value output the value as an object, you can set your own format.
  // ${defaultValue} is the default value you set in your translation function.
  // Any other custom property will be automatically extracted.
  //
  // Example:
  // {
  //   message: "${defaultValue}",
  //   description: "${maxLength}", //
  // }
  resetDefaultValueLocale: 'en',

  // Whether or not to sort the catalog. Can also be a [compareFunction](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#parameters)
  skipDefaultValues: false,

  // An array of globs that describe where to look for source files
  // relative to the location of the configuration file
  sort: true,

  // Whether to ignore default values
  // You may also specify a function accepting the locale and namespace as arguments
  useKeysAsDefaultValue: true,

  // Whether to use the keys as the default value; ex. "Hello": "Hello", "World": "World"
  // This option takes precedence over the `defaultValue` and `skipDefaultValues` options
  // You may also specify a function accepting the locale and namespace as arguments
  verbose: false,
  // If you wish to customize options in internally used i18next instance, you can define an object with any
  // configuration property supported by i18next (https://www.i18next.com/overview/configuration-options).
  // { compatibilityJSON: 'v3' } can be used to generate v3 compatible plurals.
};
