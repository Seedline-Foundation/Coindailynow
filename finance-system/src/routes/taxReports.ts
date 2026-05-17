import { Router, Request, Response } from 'express';
import { taxReportService } from '../services/TaxReportService';

const router = Router();

/**
 * GAP-1-3: Tax report export from live CFIS transactions ledger.
 */
router.get('/export', async (req: Request, res: Response) => {
  const format = String(req.query.format || 'csv');
  const year = parseInt(String(req.query.year || new Date().getFullYear()), 10);

  try {
    const rows = await taxReportService.getRowsForYear(year);

    if (format === 'json') {
      res.json({ success: true, year, count: rows.length, transactions: rows });
      return;
    }

    const csv = taxReportService.toCsv(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="cfis-tax-${year}.csv"`);
    res.send(csv);
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

export default router;
