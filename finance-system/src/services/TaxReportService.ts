import db from '../database/connection';

export interface TaxRow {
  date: string;
  type: string;
  asset: string;
  amount: string;
  usdValue: string;
  fee: string;
  txHash: string;
  source: string;
}

export class TaxReportService {
  async getRowsForYear(year: number): Promise<TaxRow[]> {
    const start = `${year}-01-01`;
    const end = `${year}-12-31T23:59:59.999Z`;

    const result = await db.query<{
      created_at: Date;
      tx_type: string;
      currency: string;
      amount: string;
      fee: string;
      tx_hash: string | null;
      description: string | null;
    }>(
      `SELECT t.created_at, t.tx_type::text, t.currency, t.amount, t.fee, t.tx_hash, t.description
       FROM transactions t
       WHERE t.status = 'COMPLETED'
         AND t.created_at >= $1::timestamptz
         AND t.created_at <= $2::timestamptz
       ORDER BY t.created_at ASC`,
      [start, end],
    );

    return result.rows.map((row) => ({
      date: row.created_at.toISOString().slice(0, 10),
      type: row.tx_type,
      asset: row.currency,
      amount: String(row.amount),
      usdValue: row.currency === 'USD' ? String(row.amount) : '',
      fee: String(row.fee || 0),
      txHash: row.tx_hash || '',
      source: row.description || 'CFIS',
    }));
  }

  toCsv(rows: TaxRow[]): string {
    const header = ['Date', 'Type', 'Asset', 'Amount', 'USD Value', 'Fee', 'TxHash', 'Source'];
    const lines = [header, ...rows.map((r) => [r.date, r.type, r.asset, r.amount, r.usdValue, r.fee, r.txHash, r.source])];
    return lines.map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  }
}

export const taxReportService = new TaxReportService();
