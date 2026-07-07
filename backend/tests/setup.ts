import 'jest';
import { Blob as NodeBlob } from 'buffer';

// Polyfill for File and Blob in Node 18 environments
// This fixes ReferenceError: File is not defined in tests using cheerio/undici
if (typeof Blob === 'undefined') {
  (global as any).Blob = NodeBlob;
}

if (typeof File === 'undefined') {
  (global as any).File = class File extends NodeBlob {
    name: string;
    lastModified: number;
    constructor(parts: any[], filename: string, options?: any) {
      super(parts, options);
      this.name = filename;
      this.lastModified = options?.lastModified || Date.now();
    }
  };
}

jest.setTimeout(30000);

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