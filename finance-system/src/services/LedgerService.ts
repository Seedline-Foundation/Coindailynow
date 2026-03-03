import db from '../database/connection';
import { JournalEntry, JournalLine } from '../types';

export class LedgerService {

  async createJournalEntry(data: {
    description: string;
    reference_type?: string;
    reference_id?: string;
    created_by: string;
    lines: { account_code: string; debit: number; credit: number; currency?: string; description?: string }[];
    metadata?: Record<string, any>;
  }): Promise<JournalEntry> {
    // Validate double-entry: total debits must equal total credits
    const totalDebits = data.lines.reduce((sum, l) => sum + l.debit, 0);
    const totalCredits = data.lines.reduce((sum, l) => sum + l.credit, 0);
    if (Math.abs(totalDebits - totalCredits) > 0.000001) {
      throw new Error(`Journal entry unbalanced: Debits ${totalDebits} != Credits ${totalCredits}`);
    }

    return db.transaction(async (client) => {
      const entryId = db.generateId();
      const entryResult = await client.query<JournalEntry>(
        `INSERT INTO journal_entries (id, description, reference_type, reference_id, created_by, status, metadata)
         VALUES ($1, $2, $3, $4, $5, 'POSTED', $6)
         RETURNING *`,
        [entryId, data.description, data.reference_type || null, data.reference_id || null, data.created_by, JSON.stringify(data.metadata || {})]
      );

      const lines: JournalLine[] = [];
      for (const line of data.lines) {
        const lineResult = await client.query<JournalLine>(
          `INSERT INTO journal_lines (id, journal_entry_id, account_code, debit, credit, currency, description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [db.generateId(), entryId, line.account_code, line.debit, line.credit, line.currency || 'JY', line.description || null]
        );
        lines.push(lineResult.rows[0]);
      }

      return { ...entryResult.rows[0], lines };
    });
  }

  async getJournalEntry(entryId: string): Promise<JournalEntry | null> {
    const entryResult = await db.query<JournalEntry>('SELECT * FROM journal_entries WHERE id = $1', [entryId]);
    if (!entryResult.rows[0]) return null;
    const linesResult = await db.query<JournalLine>('SELECT * FROM journal_lines WHERE journal_entry_id = $1', [entryId]);
    return { ...entryResult.rows[0], lines: linesResult.rows };
  }

  async getTrialBalance(): Promise<{ account_code: string; total_debit: number; total_credit: number; net: number }[]> {
    const result = await db.query(
      `SELECT jl.account_code, 
              SUM(jl.debit) as total_debit, 
              SUM(jl.credit) as total_credit,
              SUM(jl.debit) - SUM(jl.credit) as net
       FROM journal_lines jl
       JOIN journal_entries je ON je.id = jl.journal_entry_id
       WHERE je.status = 'POSTED'
       GROUP BY jl.account_code
       ORDER BY jl.account_code`
    );
    return result.rows;
  }

  async getProfitAndLoss(startDate: string, endDate: string): Promise<{ revenue: number; expenses: number; net: number; details: any[] }> {
    const result = await db.query(
      `SELECT a.type, a.code, a.name, 
              SUM(jl.credit) - SUM(jl.debit) as net
       FROM journal_lines jl
       JOIN journal_entries je ON je.id = jl.journal_entry_id
       JOIN accounts a ON a.code = jl.account_code
       WHERE je.status = 'POSTED' AND je.date BETWEEN $1 AND $2
       AND a.type IN ('REVENUE', 'EXPENSE')
       GROUP BY a.type, a.code, a.name
       ORDER BY a.type, a.code`,
      [startDate, endDate]
    );

    let revenue = 0;
    let expenses = 0;
    for (const row of result.rows) {
      if (row.type === 'REVENUE') revenue += parseFloat(row.net);
      else expenses += Math.abs(parseFloat(row.net));
    }

    return { revenue, expenses, net: revenue - expenses, details: result.rows };
  }

  async getBalanceSheet(): Promise<{ assets: number; liabilities: number; equity: number; details: any[] }> {
    const result = await db.query(
      `SELECT a.type, a.code, a.name,
              SUM(jl.debit) - SUM(jl.credit) as net
       FROM journal_lines jl
       JOIN journal_entries je ON je.id = jl.journal_entry_id
       JOIN accounts a ON a.code = jl.account_code
       WHERE je.status = 'POSTED'
       AND a.type IN ('ASSET', 'LIABILITY', 'EQUITY')
       GROUP BY a.type, a.code, a.name
       ORDER BY a.type, a.code`
    );

    let assets = 0, liabilities = 0, equity = 0;
    for (const row of result.rows) {
      const val = parseFloat(row.net);
      if (row.type === 'ASSET') assets += val;
      else if (row.type === 'LIABILITY') liabilities += Math.abs(val);
      else equity += Math.abs(val);
    }

    return { assets, liabilities, equity, details: result.rows };
  }
}

export const ledgerService = new LedgerService();
