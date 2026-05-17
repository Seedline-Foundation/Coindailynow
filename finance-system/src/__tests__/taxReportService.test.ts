import { TaxReportService } from '../services/TaxReportService';

describe('TaxReportService', () => {
  it('toCsv escapes quotes', () => {
    const svc = new TaxReportService();
    const csv = svc.toCsv([
      {
        date: '2025-06-01',
        type: 'FEE',
        asset: 'JY',
        amount: '1',
        usdValue: '',
        fee: '0',
        txHash: '0xabc',
        source: 'Test "quoted"',
      },
    ]);
    expect(csv).toContain('""');
    expect(csv.split('\n').length).toBeGreaterThanOrEqual(2);
  });
});
