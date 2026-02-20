import { Router, Request, Response } from 'express';
import { authMiddleware } from '../../middleware/auth';
import {
  calculateTax,
  getDefaultRules,
  type CostBasisMethod,
  type TaxCountryCode,
  type TaxTransactionInput,
  type TaxTxType,
} from '../../services/tax/taxEngine';

const router = Router();

function getPrisma(req: Request): any {
  return (req.app as any).locals.prisma;
}

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function normalizeCountry(code: any): TaxCountryCode {
  const c = String(code || '').toUpperCase().trim();
  if (c === 'NG' || c === 'GH' || c === 'KE') return c;
  return 'NG';
}

function normalizeCostBasis(m: any): CostBasisMethod {
  const v = String(m || '').toUpperCase().trim();
  if (v === 'FIFO' || v === 'LIFO' || v === 'HIFO') return v;
  return 'FIFO';
}

function parseTransactions(input: any): TaxTransactionInput[] {
  if (!Array.isArray(input)) return [];
  const allowed: TaxTxType[] = ['BUY','SELL','TRANSFER','STAKING_REWARD','MINING','AIRDROP','FEE'];

  return input
    .map((t: any) => {
      const txType = String(t.txType || '').toUpperCase().trim() as TaxTxType;
      const asset = String(t.asset || '').toUpperCase().trim();
      const quantity = Number(t.quantity);
      const timestamp = String(t.timestamp || '');

      const priceUsdVal = t.priceUsd !== undefined ? Number(t.priceUsd) : undefined;
      const feeUsdVal = t.feeUsd !== undefined ? Number(t.feeUsd) : undefined;

      const base: TaxTransactionInput = {
        txType,
        asset,
        quantity,
        timestamp,
        ...(priceUsdVal !== undefined ? { priceUsd: priceUsdVal } : {}),
        ...(feeUsdVal !== undefined ? { feeUsd: feeUsdVal } : {}),
      };

      return base;
    })
    .filter((t) => (
      allowed.includes(t.txType) &&
      !!t.asset &&
      Number.isFinite(t.quantity) &&
      t.quantity > 0 &&
      !!t.timestamp
    ));
}

/**
 * GET /api/v1/tax/rules?country=NG&year=2026
 */
router.get('/rules', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const countryCode = normalizeCountry(req.query.country || req.query.countryCode);
  const taxYear = Math.max(2009, Math.min(2100, Number(req.query.year || new Date().getUTCFullYear())));

  const dbRule = await safeQuery(async () => {
    return prisma.taxRule.findUnique({
      where: { countryCode_taxYear: { countryCode, taxYear } },
    });
  }, null as any);

  if (dbRule) {
    return res.json({
      data: {
        countryCode,
        taxYear,
        capitalGainsRate: Number(dbRule.taxRate),
        incomeRate: dbRule.incomeTaxRate ? Number(dbRule.incomeTaxRate) : Number(dbRule.taxRate),
        costBasisDefault: String(dbRule.costBasis || 'FIFO').toUpperCase(),
      }
    });
  }

  return res.json({ data: getDefaultRules(countryCode, taxYear) });
});

/**
 * POST /api/v1/tax/calculate
 * Body: { countryCode, taxYear, costBasis, transactions: [...] }
 */
router.post('/calculate', async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const body = req.body || {};

  const countryCode = normalizeCountry(body.countryCode || body.country);
  const taxYear = Math.max(2009, Math.min(2100, Number(body.taxYear || new Date().getUTCFullYear())));
  const costBasis = normalizeCostBasis(body.costBasis);
  const transactions = parseTransactions(body.transactions);

  if (transactions.length === 0) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'transactions[] is required' } });
  }
  if (transactions.length > 20000) {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'Too many transactions (max 20000)' } });
  }

  const dbRule = await safeQuery(async () => {
    return prisma.taxRule.findUnique({
      where: { countryCode_taxYear: { countryCode, taxYear } },
    });
  }, null as any);

  const rules = dbRule
    ? {
        countryCode,
        taxYear,
        capitalGainsRate: Number(dbRule.taxRate),
        incomeRate: dbRule.incomeTaxRate ? Number(dbRule.incomeTaxRate) : Number(dbRule.taxRate),
        costBasisDefault: normalizeCostBasis(dbRule.costBasis),
      }
    : getDefaultRules(countryCode, taxYear);

  const result = calculateTax(rules as any, transactions as any, costBasis);
  return res.json({ data: result });
});

/**
 * POST /api/v1/tax/report.csv
 * Same body as /calculate; returns CSV download.
 */
router.post('/report.csv', async (req: Request, res: Response) => {
  const body = req.body || {};
  const countryCode = normalizeCountry(body.countryCode || body.country);
  const taxYear = Math.max(2009, Math.min(2100, Number(body.taxYear || new Date().getUTCFullYear())));
  const costBasis = normalizeCostBasis(body.costBasis);
  const transactions = parseTransactions(body.transactions);

  const result = calculateTax(getDefaultRules(countryCode, taxYear), transactions as any, costBasis);

  const header = ['asset', 'timestamp', 'quantity', 'proceedsUsd', 'costBasisUsd', 'gainUsd', 'feeUsd'];
  const lines = [header.join(',')].concat(
    result.disposals.map(d => header.map(h => {
      const v = String((d as any)[h] ?? '');
      return v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v;
    }).join(','))
  );

  // Summary block
  lines.push('');
  lines.push('summary');
  lines.push(`countryCode,${result.countryCode}`);
  lines.push(`taxYear,${result.taxYear}`);
  lines.push(`costBasis,${result.costBasis}`);
  lines.push(`capitalGainsUsd,${result.totals.capitalGainsUsd}`);
  lines.push(`capitalLossesUsd,${result.totals.capitalLossesUsd}`);
  lines.push(`incomeUsd,${result.totals.incomeUsd}`);
  lines.push(`netCapitalUsd,${result.totals.netCapitalUsd}`);
  lines.push(`taxDueUsd,${result.totals.taxDueUsd}`);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="coindaily-tax-report-${countryCode}-${taxYear}.csv"`);
  return res.send(lines.join('\n'));
});

/**
 * POST /api/v1/tax/report.pdf
 * Same body as /calculate; returns a minimal PDF report.
 */
router.post('/report.pdf', async (req: Request, res: Response) => {
  const body = req.body || {};
  const countryCode = normalizeCountry(body.countryCode || body.country);
  const taxYear = Math.max(2009, Math.min(2100, Number(body.taxYear || new Date().getUTCFullYear())));
  const costBasis = normalizeCostBasis(body.costBasis);
  const transactions = parseTransactions(body.transactions);

  const result = calculateTax(getDefaultRules(countryCode, taxYear), transactions as any, costBasis);

  // pdf-lib is lightweight and safe for server-side generation
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const drawLine = (text: string, y: number, size = 11) => {
    page.drawText(text, { x: 50, y, size, font, color: rgb(0.1, 0.1, 0.1) });
  };

  drawLine('CoinDaily — Crypto Tax Report', 790, 16);
  drawLine(`Country: ${countryCode}   Tax Year: ${taxYear}   Cost Basis: ${result.costBasis}`, 770);
  drawLine(`Capital Gains: $${result.totals.capitalGainsUsd}   Capital Losses: $${result.totals.capitalLossesUsd}`, 745);
  drawLine(`Income: $${result.totals.incomeUsd}   Net Capital: $${result.totals.netCapitalUsd}`, 725);
  drawLine(`Estimated Tax Due (USD): $${result.totals.taxDueUsd}`, 700, 13);

  drawLine('Disposals (first 15):', 670, 12);
  let y = 650;
  for (const d of result.disposals.slice(0, 15)) {
    drawLine(`${d.timestamp.slice(0, 10)} ${d.asset} qty=${d.quantity} gain=$${d.gainUsd}`, y);
    y -= 16;
  }
  if (result.disposals.length > 15) {
    drawLine(`…and ${result.disposals.length - 15} more`, y);
  }

  const bytes = await pdfDoc.save();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="coindaily-tax-report-${countryCode}-${taxYear}.pdf"`);
  return res.send(Buffer.from(bytes));
});

/**
 * POST /api/v1/tax/reports
 * Persists a generated report for authenticated users.
 */
router.post('/reports', authMiddleware, async (req: Request, res: Response) => {
  const prisma = getPrisma(req);
  const body = req.body || {};
  const countryCode = normalizeCountry(body.countryCode || body.country);
  const taxYear = Math.max(2009, Math.min(2100, Number(body.taxYear || new Date().getUTCFullYear())));
  const costBasis = normalizeCostBasis(body.costBasis);
  const transactions = parseTransactions(body.transactions);

  const result = calculateTax(getDefaultRules(countryCode, taxYear), transactions as any, costBasis);

  const created = await safeQuery(async () => {
    return prisma.taxReport.create({
      data: {
        userId: req.user!.id,
        countryCode,
        taxYear,
        costBasis: result.costBasis,
        totalGains: result.totals.netCapitalUsd,
        totalIncome: result.totals.incomeUsd,
        taxDue: result.totals.taxDueUsd,
        currency: 'USD',
        reportJson: result,
      }
    });
  }, null as any);

  if (!created) {
    return res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Tax report persistence unavailable (DB not ready)' } });
  }

  return res.status(201).json({ data: created });
});

export default router;
