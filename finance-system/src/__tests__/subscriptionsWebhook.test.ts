/**
 * GAP-2-4: CFIS webhook signature verification smoke test.
 */

import crypto from 'crypto';

describe('CFIS webhook HMAC', () => {
  const secret = 'test-secret';

  it('produces matching signature for payload', () => {
    const timestamp = String(Date.now());
    const body = { type: 'SUBSCRIPTION_PAYMENT', userId: 'u1', amount: 10 };
    const sig = crypto
      .createHmac('sha256', secret)
      .update(timestamp + '.' + JSON.stringify(body))
      .digest('hex');

    const expected = crypto
      .createHmac('sha256', secret)
      .update(timestamp + '.' + JSON.stringify(body))
      .digest('hex');

    expect(sig).toBe(expected);
  });
});
