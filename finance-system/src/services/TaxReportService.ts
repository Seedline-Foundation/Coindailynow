import db from '../database/connection';

// ────────────────────────────────────────────────────────────────────
// Basic types
// ────────────────────────────────────────────────────────────────────

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

export type TaxCategory = 'Income' | 'Expenditure' | 'Transfer' | 'Capital Gain/Loss';

export type ExportFormat = 'tokentax' | 'koinly' | 'csv';

export interface CategorizedTransaction {
  date: string;
  txType: string;
  category: TaxCategory;
  asset: string;
  amount: number;
  usdValue: number;
  fee: number;
  txHash: string;
  source: string;
  costBasis: number;
  gainLoss: number;
}

export interface TaxSummary {
  userId: string;
  year: number;
  totalIncome: number;
  totalExpenses: number;
  totalGains: number;
  totalLosses: number;
  netGainLoss: number;
  totalTransactions: number;
  byCategory: Record<TaxCategory, { count: number; totalUsd: number }>;
  generatedAt: string;
}

/** FIFO lot for cost-basis tracking */
interface CostBasisLot {
  date: string;
  quantity: number;
  pricePerUnit: number;
}

// ────────────────────────────────────────────────────────────────────
// Service
// ────────────────────────────────────────────────────────────────────

export class TaxReportService {

  // ── Existing basic export (kept for backwards compatibility) ──

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

  // ── W3: Full tax report generation ──

  /**
   * Generate a full tax report for a user+year, with FIFO cost-basis.
   */
  async generateTaxReport(
    userId: string,
    year: number,
    format: ExportFormat = 'csv',
  ): Promise<{ csv: string; summary: TaxSummary }> {
    const rows = await this.getTransactionsForUser(userId, year);
    const categorized = this.categorizeTransactions(rows);
    const withCostBasis = this.applyFifoCostBasis(categorized);
    const summary = this.buildSummary(userId, year, withCostBasis);

    let csv: string;
    switch (format) {
      case 'tokentax':
        csv = this.toTokenTaxCsv(withCostBasis);
        break;
      case 'koinly':
        csv = this.toKoinlyCsv(withCostBasis);
        break;
      default:
        csv = this.toGenericCsv(withCostBasis);
        break;
    }

    return { csv, summary };
  }

  /**
   * Generate only the JSON summary (no CSV).
   */
  async generateTaxSummary(userId: string, year: number): Promise<TaxSummary> {
    const rows = await this.getTransactionsForUser(userId, year);
    const categorized = this.categorizeTransactions(rows);
    const withCostBasis = this.applyFifoCostBasis(categorized);
    return this.buildSummary(userId, year, withCostBasis);
  }

  // ── Data fetching ──

  private async getTransactionsForUser(userId: string, year: number): Promise<TaxRow[]> {
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
         AND (t.requested_by = $3 OR t.requested_by = $4)
       ORDER BY t.created_at ASC`,
      [start, end, userId, `BACKEND:${userId}`],
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

  // ── Categorization ──

  categorizeTransactions(rows: TaxRow[]): CategorizedTransaction[] {
    return rows.map((row) => {
      const amount = parseFloat(row.amount) || 0;
      const usdValue = parseFloat(row.usdValue) || amount;
      const fee = parseFloat(row.fee) || 0;
      const category = this.classifyCategory(row.type);

      return {
        date: row.date,
        txType: row.type,
        category,
        asset: row.asset,
        amount,
        usdValue,
        fee,
        txHash: row.txHash,
        source: row.source,
        costBasis: 0,
        gainLoss: 0,
      };
    });
  }

  private classifyCategory(txType: string): TaxCategory {
    const upper = txType.toUpperCase();

    const incomeTypes = [
      'POINT_EARN', 'AIRDROP_DISTRIBUTE', 'STAFF_PAYROLL', 'STAFF_BONUS',
      'BONUS_PAYMENT', 'SUBSCRIPTION_PAYMENT',
    ];
    if (incomeTypes.includes(upper)) return 'Income';

    const expenditureTypes = [
      'FIAT_PAYMENT', 'FIAT_WITHDRAWAL', 'PRESS_ESCROW_IN',
      'FEE', 'TAX', 'GAS_FEE_COLLECTION', 'AIRDROP_FUND',
      'PARTNERSHIP_PAYMENT', 'SUBSCRIPTION_REFUND',
    ];
    if (expenditureTypes.includes(upper)) return 'Expenditure';

    const transferTypes = [
      'TOKEN_TRANSFER', 'TOKEN_DEPOSIT', 'TOKEN_WITHDRAWAL',
      'POINT_REDEEM', 'POINT_TO_TOKEN',
      'PRESS_ESCROW_RELEASE', 'PRESS_ESCROW_REFUND',
    ];
    if (transferTypes.includes(upper)) return 'Transfer';

    if (upper === 'WALLET_SWAP' || upper === 'PAYOUT') return 'Capital Gain/Loss';

    return 'Transfer';
  }

  // ── FIFO cost-basis calculation ──

  applyFifoCostBasis(txs: CategorizedTransaction[]): CategorizedTransaction[] {
    const lots: Map<string, CostBasisLot[]> = new Map();

    return txs.map((tx) => {
      const result = { ...tx };

      if (tx.category === 'Income' || tx.txType.includes('DEPOSIT') || tx.txType.includes('EARN')) {
        const assetLots = lots.get(tx.asset) || [];
        assetLots.push({
          date: tx.date,
          quantity: tx.amount,
          pricePerUnit: tx.amount > 0 ? tx.usdValue / tx.amount : 0,
        });
        lots.set(tx.asset, assetLots);
        result.costBasis = tx.usdValue;
        result.gainLoss = 0;
      } else if (tx.category === 'Capital Gain/Loss' || tx.txType.includes('SWAP') || tx.txType.includes('WITHDRAWAL')) {
        const assetLots = lots.get(tx.asset) || [];
        let remaining = tx.amount;
        let totalCostBasis = 0;

        while (remaining > 0 && assetLots.length > 0) {
          const lot = assetLots[0];
          const used = Math.min(remaining, lot.quantity);
          totalCostBasis += used * lot.pricePerUnit;
          lot.quantity -= used;
          remaining -= used;
          if (lot.quantity <= 0.000001) {
            assetLots.shift();
          }
        }

        result.costBasis = round2(totalCostBasis);
        result.gainLoss = round2(tx.usdValue - totalCostBasis - tx.fee);
      } else {
        result.costBasis = tx.usdValue;
        result.gainLoss = 0;
      }

      return result;
    });
  }

  // ── Summary builder ──

  buildSummary(userId: string, year: number, txs: CategorizedTransaction[]): TaxSummary {
    const byCategory: TaxSummary['byCategory'] = {
      Income: { count: 0, totalUsd: 0 },
      Expenditure: { count: 0, totalUsd: 0 },
      Transfer: { count: 0, totalUsd: 0 },
      'Capital Gain/Loss': { count: 0, totalUsd: 0 },
    };

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalGains = 0;
    let totalLosses = 0;

    for (const tx of txs) {
      byCategory[tx.category].count++;
      byCategory[tx.category].totalUsd += tx.usdValue;

      if (tx.category === 'Income') totalIncome += tx.usdValue;
      if (tx.category === 'Expenditure') totalExpenses += tx.usdValue;
      if (tx.gainLoss > 0) totalGains += tx.gainLoss;
      if (tx.gainLoss < 0) totalLosses += Math.abs(tx.gainLoss);
    }

    return {
      userId,
      year,
      totalIncome: round2(totalIncome),
      totalExpenses: round2(totalExpenses),
      totalGains: round2(totalGains),
      totalLosses: round2(totalLosses),
      netGainLoss: round2(totalGains - totalLosses),
      totalTransactions: txs.length,
      byCategory,
      generatedAt: new Date().toISOString(),
    };
  }

  // ── CSV Formatters ──

  toGenericCsv(txs: CategorizedTransaction[]): string {
    const header = ['Date', 'Type', 'Category', 'Asset', 'Amount', 'USD Value', 'Fee', 'Cost Basis', 'Gain/Loss', 'TxHash', 'Source'];
    const lines = [header.join(',')];
    for (const tx of txs) {
      lines.push([
        tx.date, tx.txType, tx.category, tx.asset,
        String(tx.amount), String(tx.usdValue), String(tx.fee),
        String(tx.costBasis), String(tx.gainLoss),
        tx.txHash, tx.source,
      ].map(escapeCsvField).join(','));
    }
    return lines.join('\n');
  }

  toTokenTaxCsv(txs: CategorizedTransaction[]): string {
    const header = ['Type', 'BuyAmount', 'BuyCurrency', 'SellAmount', 'SellCurrency', 'FeeAmount', 'FeeCurrency', 'Exchange', 'Group', 'Comment', 'Date'];
    const lines = [header.join(',')];
    for (const tx of txs) {
      const ttType = mapToTokenTaxType(tx);
      const isBuy = tx.category === 'Income' || tx.txType.includes('DEPOSIT');
      lines.push([
        ttType,
        isBuy ? String(tx.amount) : '',
        isBuy ? tx.asset : '',
        !isBuy ? String(tx.amount) : '',
        !isBuy ? tx.asset : '',
        String(tx.fee),
        tx.asset,
        'CoinDaily CFIS',
        tx.category,
        tx.source,
        tx.date,
      ].map(escapeCsvField).join(','));
    }
    return lines.join('\n');
  }

  toKoinlyCsv(txs: CategorizedTransaction[]): string {
    const header = ['Date', 'Sent Amount', 'Sent Currency', 'Received Amount', 'Received Currency', 'Fee Amount', 'Fee Currency', 'Net Worth Amount', 'Net Worth Currency', 'Label', 'Description', 'TxHash'];
    const lines = [header.join(',')];
    for (const tx of txs) {
      const isSend = tx.category === 'Expenditure' || tx.txType.includes('WITHDRAWAL');
      lines.push([
        tx.date,
        isSend ? String(tx.amount) : '',
        isSend ? tx.asset : '',
        !isSend ? String(tx.amount) : '',
        !isSend ? tx.asset : '',
        String(tx.fee),
        tx.asset,
        String(tx.usdValue),
        'USD',
        mapToKoinlyLabel(tx),
        tx.source,
        tx.txHash,
      ].map(escapeCsvField).join(','));
    }
    return lines.join('\n');
  }
}

// ── Helpers ──

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function mapToTokenTaxType(tx: CategorizedTransaction): string {
  switch (tx.category) {
    case 'Income': return 'Income';
    case 'Expenditure': return 'Spend';
    case 'Transfer': return 'Transfer';
    case 'Capital Gain/Loss': return 'Trade';
    default: return 'Other';
  }
}

function mapToKoinlyLabel(tx: CategorizedTransaction): string {
  switch (tx.category) {
    case 'Income': return 'reward';
    case 'Expenditure': return 'cost';
    case 'Transfer': return '';
    case 'Capital Gain/Loss': return 'realized gain';
    default: return '';
  }
}

export const taxReportService = new TaxReportService();
