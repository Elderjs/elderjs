module.exports = {
  // setupFiles: ['./config/jestSetup.js'],
  // setupFilesAfterEnv: ['./etc/jestSetupFramework.js'],
  testPathIgnorePatterns: ['/node_modules/', 'mocks'],
  // collectCoverageFrom: ['site/**/*.js', 'workers-site/**/*.js'],
  // coverageReporters: ['json', 'lcov', 'text', 'text-summary'],
  testEnvironment: 'node',
};
