import axios from 'axios';
import { BackendNotifier } from '../services/BackendNotifier';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BackendNotifier (CFIS → backend reverse webhook leg)', () => {
  const OLD = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...OLD };
  });

  afterAll(() => {
    process.env = OLD;
  });

  it('skips silently when not configured', async () => {
    delete process.env.BACKEND_API_URL;
    delete process.env.BACKEND_HMAC_SECRET;
    delete process.env.CFIS_HMAC_SECRET;
    const n = new BackendNotifier();
    await n.emit('PAYMENT_CONFIRMED', 'tx_1', { amount: 1 });
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('signs the payload with HMAC-SHA256 and includes timestamp', async () => {
    process.env.BACKEND_API_URL = 'http://backend.local';
    process.env.BACKEND_HMAC_SECRET = 'shhh';
    mockedAxios.post.mockResolvedValueOnce({ status: 200, data: { ok: true } } as any);

    const n = new BackendNotifier();
    await n.emit(
      'PAYMENT_CONFIRMED',
      'tx_1',
      { amount: 100 },
      { userId: 'user_1', backendReferenceId: 'sub_1' },
    );

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    const [url, body, opts] = mockedAxios.post.mock.calls[0];
    expect(url).toBe('http://backend.local/api/finance-events');
    expect(body).toMatchObject({
      type: 'PAYMENT_CONFIRMED',
      cfisTransactionId: 'tx_1',
      payload: { amount: 100 },
      userId: 'user_1',
      backendReferenceId: 'sub_1',
    });
    expect(opts?.headers?.['x-cfis-signature']).toMatch(/^[0-9a-f]{64}$/);
    expect(opts?.headers?.['x-cfis-timestamp']).toMatch(/^\d+$/);
  });

  it('swallows backend errors so CFIS DB tx is never aborted', async () => {
    process.env.BACKEND_API_URL = 'http://backend.local';
    process.env.BACKEND_HMAC_SECRET = 'shhh';
    mockedAxios.post.mockRejectedValueOnce(new Error('502 bad gateway'));

    const n = new BackendNotifier();
    await expect(n.emit('PAYMENT_CONFIRMED', 'tx_2', {})).resolves.toBeUndefined();
  });

  it('isConfigured reflects env state', () => {
    delete process.env.BACKEND_API_URL;
    delete process.env.BACKEND_HMAC_SECRET;
    delete process.env.CFIS_HMAC_SECRET;
    expect(new BackendNotifier().isConfigured()).toBe(false);
    process.env.BACKEND_API_URL = 'http://x';
    expect(new BackendNotifier().isConfigured()).toBe(false);
    process.env.BACKEND_HMAC_SECRET = 's';
    expect(new BackendNotifier().isConfigured()).toBe(true);
  });
});
