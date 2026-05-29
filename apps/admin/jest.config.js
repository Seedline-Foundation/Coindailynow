/** @type {import('jest').Config} */
module.exports = {
  displayName: 'admin',
  preset: 'ts-jest/presets/js-with-ts',
  testEnvironment: 'jsdom',
  rootDir: __dirname,
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js|jsx)', '**/?(*.)+(spec|test).+(ts|tsx|js|jsx)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@coindaily/(.*)$': '<rootDir>/../../packages/$1/src',
  },
  transformIgnorePatterns: ['/node_modules/'],
};
