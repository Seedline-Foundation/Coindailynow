import { Router, Request, Response } from 'express';
import { taxReportService, ExportFormat } from '../services/TaxReportService';

const router = Router();

/**
 * GAP-1-3: Tax report export from live CFIS transactions ledger.
 */
router.get('/export', async (req: Request, res: Response) => {
  const format = String(req.query.format || 'csv').toLowerCase();
  const year = parseInt(String(req.query.year || new Date().getFullYear()), 10);

  try {
    const rows = await taxReportService.getRowsForYear(year);

    if (format === 'json') {
      res.json({ success: true, year, count: rows.length, transactions: rows });
      return;
    }

    let csv: string;
    let filename: string;
    if (format === 'tokentax') {
      csv = taxReportService.toTokenTaxCsv(rows);
      filename = `cfis-tax-${year}-tokentax.csv`;
    } else if (format === 'koinly') {
      csv = taxReportService.toKoinlyCsv(rows);
      filename = `cfis-tax-${year}-koinly.csv`;
    } else {
      csv = taxReportService.toCsv(rows);
      filename = `cfis-tax-${year}.csv`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * W3: GET /api/tax/report/:userId?year=2026&format=tokentax
 * Returns a CSV tax report in the requested format (tokentax, koinly, csv).
 */
router.get('/report/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const year = parseInt(String(req.query.year || new Date().getFullYear()), 10);
  const format = (String(req.query.format || 'csv').toLowerCase()) as ExportFormat;

  if (!userId) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'userId is required' } });
    return;
  }

  const validFormats: ExportFormat[] = ['tokentax', 'koinly', 'csv'];
  if (!validFormats.includes(format)) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Invalid format. Supported: ${validFormats.join(', ')}` } });
    return;
  }

  try {
    const { csv, summary } = await taxReportService.generateTaxReport(userId, year, format);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="tax-report-${userId}-${year}-${format}.csv"`);
    res.send(csv);
  } catch (e: any) {
    console.error('[CFIS] Tax report generation error:', e.message);
    res.status(500).json({ error: { code: 'REPORT_ERROR', message: e.message } });
  }
});

/**
 * W3: GET /api/tax/summary/:userId?year=2026
 * Returns a JSON tax summary (income, expenses, gains, losses).
 */
router.get('/summary/:userId', async (req: Request, res: Response) => {
  const { userId } = req.params;
  const year = parseInt(String(req.query.year || new Date().getFullYear()), 10);

  if (!userId) {
    res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'userId is required' } });
    return;
  }

  try {
    const summary = await taxReportService.generateTaxSummary(userId, year);
    res.json({ success: true, data: summary });
  } catch (e: any) {
    console.error('[CFIS] Tax summary error:', e.message);
    res.status(500).json({ error: { code: 'SUMMARY_ERROR', message: e.message } });
  }
});

export default router;
