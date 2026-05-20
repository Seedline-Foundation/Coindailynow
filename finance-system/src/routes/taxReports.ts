import { Router, Request, Response } from 'express';
import { taxReportService } from '../services/TaxReportService';

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

export default router;
