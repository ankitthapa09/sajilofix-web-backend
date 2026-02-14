module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/index.ts",
    "!src/app.ts",
    "!src/__tests__/**",
  ],
  setupFiles: ["<rootDir>/jest.setup-env.js"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
};
