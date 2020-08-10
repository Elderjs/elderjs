module.exports = {
  env: {
    browser: true,
    es2020: true,
    'jest/globals': true,
  },
  extends: ['airbnb-base', 'plugin:jest/recommended', 'prettier/@typescript-eslint', 'plugin:prettier/recommended'],
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
    // allow console logs
    'no-console': ['off'],
  },
};
