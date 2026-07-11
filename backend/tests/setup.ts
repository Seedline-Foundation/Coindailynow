import 'jest';

jest.setTimeout(30000);

// Define global File polyfill for cheerio/undici compatibility under Jest environments
if (typeof (global as any).File === 'undefined') {
  if (typeof globalThis.File !== 'undefined') {
    (global as any).File = globalThis.File;
  } else {
    try {
      const { File } = require('node:buffer');
      (global as any).File = File;
    } catch (e) {
      class MockFile extends Blob {
        name: string;
        lastModified: number;
        constructor(parts: any[], name: string, options?: any) {
          super(parts, options);
          this.name = name;
          this.lastModified = options?.lastModified || Date.now();
        }
      }
      (global as any).File = MockFile as any;
    }
  }
}

// Configure environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-only';
process.env.DATABASE_URL = 'file:./test.db';
process.env.REDIS_URL = 'redis://localhost:6379/1';

// Global test setup
beforeAll(async () => {
  // Any global setup needed
});

// Global test teardown  
afterAll(async () => {
  // Any global cleanup needed
});