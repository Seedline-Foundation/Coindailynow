import { ChangeNowProvider } from '../../src/services/providers/changenow.provider';

describe('ChangeNowProvider', () => {
  const OLD = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD };
    delete process.env.CHANGENOW_API_KEY;
  });
  afterAll(() => {
    process.env = OLD;
  });

  it('reports unconfigured when API key missing', () => {
    const p = new ChangeNowProvider();
    expect(p.isConfigured()).toBe(false);
  });

  it('estimate returns a passthrough when not configured', async () => {
    const p = new ChangeNowProvider();
    const result = await p.estimate({
      fromCurrency: 'btc',
      toCurrency: 'usdt',
      fromAmount: 1,
    });
    expect(result.fromAmount).toBe('1');
    expect(result.fromCurrency).toBe('btc');
    expect(result.toCurrency).toBe('usdt');
  });

  it('createExchange throws when not configured', async () => {
    const p = new ChangeNowProvider();
    await expect(
      p.createExchange({
        fromCurrency: 'btc',
        toCurrency: 'usdt',
        fromAmount: 1,
        toAddress: '0xabc',
      }),
    ).rejects.toThrow(/not configured/);
  });

  it('verifyWebhook computes HMAC and rejects bad signatures', () => {
    process.env.CHANGENOW_WEBHOOK_SECRET = 'abc123';
    const body = JSON.stringify({ id: 'tx_1', status: 'finished' });
    const crypto = require('crypto');
    const good = crypto.createHmac('sha256', 'abc123').update(body).digest('hex');
    expect(ChangeNowProvider.verifyWebhook(body, good)).toBe(true);

    const bad = good.slice(0, -2) + 'aa';
    expect(ChangeNowProvider.verifyWebhook(body, bad)).toBe(false);
    expect(ChangeNowProvider.verifyWebhook(body, undefined)).toBe(false);
  });
});
