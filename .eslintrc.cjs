// eslint-disable-next-line no-undef
module.exports = {
  env: {
    browser: true,
    es2020: true,
    'jest/globals': true,
  },
  extends: [
    'eslint:recommended',
    'plugin:eslint-comments/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:jest/style',
    'plugin:jest/recommended',
    'plugin:import/typescript',
    'prettier',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
  ],
  settings: {
    // "import/resolver": {
    //   "node": {
    //     "extensions": [".js", ".ts"]
    //   }
    // }
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'jest', 'prettier'],
  rules: {
    'prettier/prettier': 'error',

    '@typescript-eslint/no-unused-vars': ['error'],

    'no-param-reassign': ['warn'],

    // -- OVERRIDES by choice --
    '@typescript-eslint/no-explicit-any': 'warn',

    // allow ForOfStatement
    '@typescript-eslint/explicit-module-boundary-types': 'off',
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
