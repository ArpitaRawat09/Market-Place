module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/_tests_"],
  collectCoverageFrom: ["src/**/*.js"],
  coveragePathIgnorePatterns: ["/node_modules/"],
  clearMocks: true,
  setupFilesAfterEnv: ["<rootDir>/test/setup.js"]
};
