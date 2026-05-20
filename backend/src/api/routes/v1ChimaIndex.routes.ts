import { Router, Request, Response } from 'express';
import chimaIndexService from '../../services/chimaIndexService';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const indices = await chimaIndexService.getAllIndices();
    res.json({ success: true, data: indices });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:symbol', async (req: Request, res: Response) => {
  try {
    const index = await chimaIndexService.getIndex(req.params.symbol.toUpperCase());
    if (!index) return res.status(404).json({ error: 'Index not found' });
    res.json({ success: true, data: index });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:symbol/history', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const history = await chimaIndexService.getIndexHistory(req.params.symbol.toUpperCase(), days);
    if (!history) return res.status(404).json({ error: 'Index not found' });
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:symbol/api', async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as string) === 'csv' ? 'csv' : 'json';
    const data = await chimaIndexService.getIndexAPIData(req.params.symbol.toUpperCase(), format);
    if (!data) return res.status(404).json({ error: 'Index not found' });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${req.params.symbol}-data.csv`);
      return res.send(data);
    }

    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/initialize', async (_req: Request, res: Response) => {
  try {
    const results = await chimaIndexService.initializeIndices();
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:symbol/calculate', async (req: Request, res: Response) => {
  try {
    const { countryInputs } = req.body;
    const result = await chimaIndexService.calculateIndex(req.params.symbol.toUpperCase(), countryInputs);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
