/**
 * Mock Logger Utility for Testing
 */

import { Logger } from 'winston';

export const createMockLogger = (): Logger => {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    silly: jest.fn(),
    log: jest.fn(),
  } as unknown as Logger;
};