/** @type {import('jest').Config} */
const config = {
  projects: ['<rootDir>/backend'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};

module.exports = config;
