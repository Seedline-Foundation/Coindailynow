import { mockQueryFn, resetDbMocks, queryResult } from './setup';

import { TaxReportService } from '../src/services/TaxReportService';
import type { TaxRow } from '../src/services/TaxReportService';

describe('TaxReportService', () => {
  let svc: TaxReportService;

  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
    svc = new TaxReportService();
  });

  // =================================================================
  // toCsv
  // =================================================================
  describe('toCsv', () => {
    it('produces header + data rows', () => {
      const rows: TaxRow[] = [
        { date: '2024-06-01', type: 'TOKEN_WITHDRAWAL', asset: 'JY', amount: '100', usdValue: '', fee: '0', txHash: '0xabc', source: 'CFIS' },
      ];
      const csv = svc.toCsv(rows);
      const lines = csv.split('\n');
      expect(lines[0]).toContain('Date');
      expect(lines[0]).toContain('Type');
      expect(lines[0]).toContain('Asset');
      expect(lines[0]).toContain('Amount');
      expect(lines[0]).toContain('USD Value');
      expect(lines[0]).toContain('Fee');
      expect(lines[0]).toContain('TxHash');
      expect(lines[0]).toContain('Source');
      expect(lines).toHaveLength(2);
    });

    it('escapes double-quotes within values', () => {
      const rows: TaxRow[] = [
        { date: '2024-01-01', type: 'FEE', asset: 'JY', amount: '1', usdValue: '', fee: '0', txHash: '', source: 'He said "hello"' },
      ];
      const csv = svc.toCsv(rows);
      expect(csv).toContain('""hello""');
    });

    it('returns only header for empty input', () => {
      const csv = svc.toCsv([]);
      const lines = csv.split('\n');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toContain('Date');
    });

    it('handles multiple rows correctly', () => {
      const rows: TaxRow[] = [
        { date: '2024-01-01', type: 'STAFF_PAYROLL', asset: 'JY', amount: '5000', usdValue: '', fee: '0', txHash: '0x1', source: 'Payroll' },
        { date: '2024-02-01', type: 'BONUS_PAYMENT', asset: 'JY', amount: '500', usdValue: '', fee: '0', txHash: '0x2', source: 'Bonus' },
        { date: '2024-03-15', type: 'FIAT_PAYMENT', asset: 'USD', amount: '100', usdValue: '100', fee: '2', txHash: '', source: 'Stripe' },
      ];
      const csv = svc.toCsv(rows);
      const lines = csv.split('\n');
      expect(lines).toHaveLength(4); // header + 3 data rows
    });

    it('wraps every field in double quotes', () => {
      const rows: TaxRow[] = [
        { date: '2024-01-01', type: 'FEE', asset: 'JY', amount: '1', usdValue: '', fee: '0', txHash: '', source: 'CFIS' },
      ];
      const csv = svc.toCsv(rows);
      const dataLine = csv.split('\n')[1];
      const fields = dataLine.split(',');
      for (const field of fields) {
        expect(field).toMatch(/^".*"$/);
      }
    });
  });

  // =================================================================
  // getRowsForYear
  // =================================================================
  describe('getRowsForYear', () => {
    it('queries completed transactions for the given year', async () => {
      mockQueryFn.mockResolvedValue(queryResult([
        {
          created_at: new Date('2024-03-15T10:00:00Z'),
          tx_type: 'TOKEN_WITHDRAWAL',
          currency: 'JY',
          amount: '500',
          fee: '10',
          tx_hash: '0xabc',
          description: 'Withdrawal',
        },
      ]));

      const rows = await svc.getRowsForYear(2024);

      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining("status = 'COMPLETED'"),
        ['2024-01-01', '2024-12-31T23:59:59.999Z'],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual({
        date: '2024-03-15',
        type: 'TOKEN_WITHDRAWAL',
        asset: 'JY',
        amount: '500',
        usdValue: '',
        fee: '10',
        txHash: '0xabc',
        source: 'Withdrawal',
      });
    });

    it('maps USD currency to usdValue', async () => {
      mockQueryFn.mockResolvedValue(queryResult([
        {
          created_at: new Date('2024-06-01T00:00:00Z'),
          tx_type: 'FIAT_PAYMENT',
          currency: 'USD',
          amount: '250',
          fee: '5',
          tx_hash: null,
          description: 'Stripe payment',
        },
      ]));

      const rows = await svc.getRowsForYear(2024);
      expect(rows[0].usdValue).toBe('250');
    });

    it('leaves usdValue empty for non-USD currencies', async () => {
      mockQueryFn.mockResolvedValue(queryResult([
        {
          created_at: new Date('2024-06-01T00:00:00Z'),
          tx_type: 'TOKEN_WITHDRAWAL',
          currency: 'JY',
          amount: '100',
          fee: '0',
          tx_hash: '0x123',
          description: null,
        },
      ]));

      const rows = await svc.getRowsForYear(2024);
      expect(rows[0].usdValue).toBe('');
      expect(rows[0].source).toBe('CFIS'); // fallback when description is null
    });

    it('handles null tx_hash and null description', async () => {
      mockQueryFn.mockResolvedValue(queryResult([
        {
          created_at: new Date('2024-01-01T00:00:00Z'),
          tx_type: 'FEE',
          currency: 'JY',
          amount: '1',
          fee: null,
          tx_hash: null,
          description: null,
        },
      ]));

      const rows = await svc.getRowsForYear(2024);
      expect(rows[0].txHash).toBe('');
      expect(rows[0].source).toBe('CFIS');
      expect(rows[0].fee).toBe('0');
    });

    it('returns empty array for year with no transactions', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));
      const rows = await svc.getRowsForYear(2020);
      expect(rows).toHaveLength(0);
    });

    it('builds correct date range boundaries', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));
      await svc.getRowsForYear(2025);
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.any(String),
        ['2025-01-01', '2025-12-31T23:59:59.999Z'],
      );
    });
  });
});
