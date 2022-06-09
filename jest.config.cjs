/** @type {import('ts-jest').InitialOptionsTsJest} */
module.exports = {
  globals: {
    'ts-jest': {
      useESM: true,
      extensionsToTreatAsEsm: ['.ts'],
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/build/'],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageReporters: ['json', 'lcov', 'text', 'text-summary'],
};
