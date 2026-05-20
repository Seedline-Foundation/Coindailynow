import { mockQueryFn, mockTransactionFn, resetDbMocks, queryResult, testId } from './setup';

import { LedgerService } from '../src/services/LedgerService';

describe('LedgerService', () => {
  let ledger: LedgerService;

  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
    ledger = new LedgerService();
  });

  // =================================================================
  // createJournalEntry
  // =================================================================
  describe('createJournalEntry', () => {
    it('validates that total debits equal total credits', async () => {
      await expect(
        ledger.createJournalEntry({
          description: 'unbalanced entry',
          created_by: 'TEST',
          lines: [
            { account_code: '100001', debit: 100, credit: 0 },
            { account_code: '400001', debit: 0, credit: 50 },
          ],
        }),
      ).rejects.toThrow(/unbalanced/i);
    });

    it('creates a journal entry with balanced lines within a transaction', async () => {
      const entryId = testId();
      const lineId1 = testId();
      const lineId2 = testId();

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({
            rows: [{ id: entryId, description: 'Sale', status: 'POSTED' }],
          })
          .mockResolvedValueOnce({
            rows: [{ id: lineId1, journal_entry_id: entryId, account_code: '100001', debit: 500, credit: 0, currency: 'JY' }],
          })
          .mockResolvedValueOnce({
            rows: [{ id: lineId2, journal_entry_id: entryId, account_code: '400001', debit: 0, credit: 500, currency: 'JY' }],
          }),
      };
      mockTransactionFn.mockImplementation(async (fn: Function) => fn(mockClient));

      const result = await ledger.createJournalEntry({
        description: 'Sale',
        reference_type: 'TOKEN_WITHDRAWAL',
        reference_id: 'tx-1',
        created_by: 'SYSTEM',
        lines: [
          { account_code: '100001', debit: 500, credit: 0 },
          { account_code: '400001', debit: 0, credit: 500 },
        ],
      });

      expect(result.id).toBe(entryId);
      expect(result.lines).toHaveLength(2);
      expect(mockClient.query).toHaveBeenCalledTimes(3);
    });

    it('accepts entries with zero-sum (all zeros)', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [{ id: testId(), description: 'no-op', status: 'POSTED' }] }),
      };
      mockTransactionFn.mockImplementation(async (fn: Function) => fn(mockClient));

      const result = await ledger.createJournalEntry({
        description: 'no-op',
        created_by: 'TEST',
        lines: [],
      });
      expect(result).toBeDefined();
    });

    it('rejects entries where debits exceed credits by more than tolerance', async () => {
      await expect(
        ledger.createJournalEntry({
          description: 'off by a penny',
          created_by: 'TEST',
          lines: [
            { account_code: '100001', debit: 100.01, credit: 0 },
            { account_code: '400001', debit: 0, credit: 100 },
          ],
        }),
      ).rejects.toThrow(/unbalanced/i);
    });

    it('accepts entries within floating-point tolerance', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [{ id: testId(), status: 'POSTED' }] })
          .mockResolvedValueOnce({ rows: [{ id: testId() }] })
          .mockResolvedValueOnce({ rows: [{ id: testId() }] })
          .mockResolvedValueOnce({ rows: [{ id: testId() }] }),
      };
      mockTransactionFn.mockImplementation(async (fn: Function) => fn(mockClient));

      // 0.1 + 0.2 = 0.30000000000000004 in floating point
      const result = await ledger.createJournalEntry({
        description: 'float test',
        created_by: 'TEST',
        lines: [
          { account_code: '100001', debit: 0.1, credit: 0 },
          { account_code: '100002', debit: 0.2, credit: 0 },
          { account_code: '400001', debit: 0, credit: 0.3 },
        ],
      });
      expect(result).toBeDefined();
    });
  });

  // =================================================================
  // getJournalEntry
  // =================================================================
  describe('getJournalEntry', () => {
    it('returns null when entry not found', async () => {
      mockQueryFn.mockResolvedValueOnce(queryResult([]));
      const result = await ledger.getJournalEntry('nonexistent');
      expect(result).toBeNull();
    });

    it('returns entry with lines', async () => {
      const entryId = testId();
      mockQueryFn
        .mockResolvedValueOnce(queryResult([{ id: entryId, description: 'Test', status: 'POSTED' }]))
        .mockResolvedValueOnce(queryResult([
          { id: testId(), journal_entry_id: entryId, account_code: '100001', debit: 100, credit: 0 },
          { id: testId(), journal_entry_id: entryId, account_code: '400001', debit: 0, credit: 100 },
        ]));

      const result = await ledger.getJournalEntry(entryId);
      expect(result).not.toBeNull();
      expect(result!.lines).toHaveLength(2);
      expect(result!.lines![0].account_code).toBe('100001');
    });
  });

  // =================================================================
  // getTrialBalance
  // =================================================================
  describe('getTrialBalance', () => {
    it('returns aggregated account balances', async () => {
      mockQueryFn.mockResolvedValue(queryResult([
        { account_code: '100001', total_debit: 1000, total_credit: 200, net: 800 },
        { account_code: '400001', total_debit: 0, total_credit: 800, net: -800 },
      ]));

      const result = await ledger.getTrialBalance();
      expect(result).toHaveLength(2);
      expect(result[0].net).toBe(800);
    });
  });

  // =================================================================
  // getProfitAndLoss
  // =================================================================
  describe('getProfitAndLoss', () => {
    it('computes revenue, expenses, and net income', async () => {
      mockQueryFn.mockResolvedValue(queryResult([
        { type: 'REVENUE', code: '400001', name: 'Sales', net: '5000' },
        { type: 'EXPENSE', code: '500001', name: 'Payroll', net: '-3000' },
      ]));

      const result = await ledger.getProfitAndLoss('2024-01-01', '2024-12-31');
      expect(result.revenue).toBe(5000);
      expect(result.expenses).toBe(3000);
      expect(result.net).toBe(2000);
      expect(result.details).toHaveLength(2);
    });

    it('handles empty result set', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));
      const result = await ledger.getProfitAndLoss('2024-01-01', '2024-12-31');
      expect(result.revenue).toBe(0);
      expect(result.expenses).toBe(0);
      expect(result.net).toBe(0);
    });
  });

  // =================================================================
  // getBalanceSheet
  // =================================================================
  describe('getBalanceSheet', () => {
    it('computes assets, liabilities, and equity', async () => {
      mockQueryFn.mockResolvedValue(queryResult([
        { type: 'ASSET', code: '100001', name: 'Cash', net: '10000' },
        { type: 'LIABILITY', code: '200001', name: 'Accounts Payable', net: '-3000' },
        { type: 'EQUITY', code: '300001', name: 'Retained Earnings', net: '-7000' },
      ]));

      const result = await ledger.getBalanceSheet();
      expect(result.assets).toBe(10000);
      expect(result.liabilities).toBe(3000);
      expect(result.equity).toBe(7000);
    });

    it('handles empty balance sheet', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));
      const result = await ledger.getBalanceSheet();
      expect(result.assets).toBe(0);
      expect(result.liabilities).toBe(0);
      expect(result.equity).toBe(0);
    });
  });
});
