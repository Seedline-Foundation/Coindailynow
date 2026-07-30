import 'jest';

jest.setTimeout(30000);

// Polyfill global.File for Node 18 compatibility with newer undici/cheerio dependencies
if (typeof (global as any).File === 'undefined') {
  try {
    const { File } = require('node:buffer');
    if (File) {
      (global as any).File = File;
    }
  } catch (e) {
    class FileFallback {
      name: string;
      constructor(parts: any[], name: string, options?: any) {
        this.name = name;
      }
    }
    (global as any).File = FileFallback;
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