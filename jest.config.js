module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/src/hookInterface/.ts',
    '<rootDir>/src/index.ts',
  ],
  collectCoverageFrom: ['src/**/*.ts'],
  coverageReporters: ['json', 'lcov', 'text', 'text-summary'],
};
