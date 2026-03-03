/** @type {import('jest').Config} */
module.exports = {
  // Multi-project Jest config for monorepo
  // Each project runs with its own config and rootDir
  projects: [
    {
      rootDir: '<rootDir>/backend',
      preset: 'ts-jest',
      testEnvironment: 'node',
      testTimeout: 30000,
      roots: ['<rootDir>/src', '<rootDir>/tests'],
      testMatch: [
        '**/__tests__/**/*.ts',
        '**/*.(test|spec).ts'
      ],
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          tsconfig: '<rootDir>/tsconfig.test.json'
        }],
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      displayName: 'backend',
    },
  ],
};
