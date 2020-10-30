module.exports = {
  env: {
    browser: true,
    es2020: true,
    'jest/globals': true,
  },
  extends: ['airbnb-base', 'plugin:jest/recommended', 'prettier/@typescript-eslint', 'plugin:prettier/recommended', 'plugin:jest/style'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
      },
    },
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'jest', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    // do not require ext. when importing file
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
      },
    ],

    // avoid having warnings when we import types and they are detected as unused imports
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],

    // <temporarily allowed until fixed>
    'no-param-reassign': ['warn'],
    'global-require': ['warn'],

    // -- OVERRIDES by choice --
    // allow ForOfStatement
    'no-restricted-syntax': [
      // override aribnb config here to allow for (const ... of ...) https://github.com/airbnb/javascript/blob/64b965efe0355c8290996ff5a675cd8fb30bf843/packages/eslint-config-airbnb-base/rules/style.js#L334-L352
      'error',
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    // allow console logs
    'no-console': ['off'],
  },
};
