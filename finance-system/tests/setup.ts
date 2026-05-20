/**
 * CFIS Test Setup — mocks for database and external services.
 *
 * Every service imports `../database/connection` which spins up a real
 * Postgres Pool.  In tests we replace the entire module with a lightweight
 * mock so no database is required.
 */

import { v4 as uuidv4 } from 'uuid';

// ── DB Mock ─────────────────────────────────────────────────────────
export const mockQueryFn = jest.fn();
export const mockTransactionFn = jest.fn();

export function resetDbMocks() {
  mockQueryFn.mockReset();
  mockTransactionFn.mockReset();

  // Default: transaction delegates to the callback with a mock client
  mockTransactionFn.mockImplementation(async (fn: Function) => {
    const client = { query: mockQueryFn };
    return fn(client);
  });
}

jest.mock('../src/database/connection', () => {
  const { v4 } = require('uuid');
  const mod = {
    __esModule: true,
    query: (...args: any[]) => mockQueryFn(...args),
    transaction: (...args: any[]) => mockTransactionFn(...args),
    generateId: () => v4(),
    isConnected: true,
    healthCheck: async () => true,
    close: async () => {},
    default: null as any,
  };
  mod.default = mod;
  return mod;
});

// ── Helper: build a QueryResult-shaped object ───────────────────────
export function queryResult<T>(rows: T[], rowCount?: number) {
  return { rows, rowCount: rowCount ?? rows.length, command: 'SELECT', oid: 0, fields: [] };
}

// ── UUID helper for deterministic test IDs ──────────────────────────
export function testId(): string {
  return uuidv4();
}
