/**
 * ChangeNOW provider integration.
 *
 * ChangeNOW is the diaspora/international on-ramp the launch spec calls for
 * alongside YellowCard (Africa) and Binance P2P. It supports 900+ assets and
 * doesn't require KYC for most fixed-rate flows, which makes it the right
 * default for diaspora users sending into NGN/KES/ZAR/GHS markets.
 *
 * Public docs: https://changenow.io/api/docs
 *
 * Env vars:
 *   CHANGENOW_API_KEY      — required, public API key from ChangeNOW dashboard
 *   CHANGENOW_API_BASE     — defaults to https://api.changenow.io/v2
 *   CHANGENOW_WEBHOOK_SECRET — HMAC secret for callback verification
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { logger as defaultLogger } from '../../utils/logger';

export interface ChangeNowEstimate {
  fromAmount: string;
  fromCurrency: string;
  toAmount: string;
  toCurrency: string;
  rateId?: string;
  validUntil?: string;
  fee: string;
  flow: 'standard' | 'fixed-rate';
}

export interface CreateExchangeInput {
  fromCurrency: string; // e.g. 'btc', 'usdt' (lowercase per ChangeNOW convention)
  toCurrency: string; // e.g. 'usdterc20'
  fromAmount: number;
  toAddress: string; // receiving address on the toCurrency network
  refundAddress?: string;
  flow?: 'standard' | 'fixed-rate';
  userId?: string; // we round-trip our own userId into `payload`
}

export interface ChangeNowExchange {
  id: string; // ChangeNOW transaction id
  fromAmount: string;
  toAmount: string;
  fromCurrency: string;
  toCurrency: string;
  payinAddress: string;
  payoutAddress: string;
  status: ChangeNowStatus;
  createdAt: string;
  expectedReceiveAmount?: string;
  rateId?: string;
}

export type ChangeNowStatus =
  | 'new'
  | 'waiting'
  | 'confirming'
  | 'exchanging'
  | 'sending'
  | 'finished'
  | 'failed'
  | 'refunded'
  | 'verifying'
  | 'expired';

export class ChangeNowProvider {
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly logger = defaultLogger;

  constructor(opts: { apiKey?: string; baseUrl?: string } = {}) {
    this.apiKey = opts.apiKey || process.env.CHANGENOW_API_KEY || '';
    const baseURL =
      opts.baseUrl ||
      process.env.CHANGENOW_API_BASE ||
      process.env.CHANGENOW_API_URL ||
      'https://api.changenow.io/v2';
    this.client = axios.create({
      baseURL,
      timeout: 15_000,
      headers: this.apiKey ? { 'x-changenow-api-key': this.apiKey } : {},
    });
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * GET /exchange/estimated-amount — quote a swap without committing.
   * Always returns; falls back to a 1:1 informational quote when unconfigured.
   */
  async estimate(params: {
    fromCurrency: string;
    toCurrency: string;
    fromAmount: number;
    flow?: 'standard' | 'fixed-rate';
  }): Promise<ChangeNowEstimate> {
    if (!this.isConfigured()) {
      this.logger.warn('[ChangeNOW] Estimate called without API key — returning passthrough');
      return {
        fromAmount: String(params.fromAmount),
        fromCurrency: params.fromCurrency,
        toAmount: String(params.fromAmount),
        toCurrency: params.toCurrency,
        fee: '0',
        flow: params.flow ?? 'standard',
      };
    }
    const { data } = await this.client.get('/exchange/estimated-amount', {
      params: {
        fromCurrency: params.fromCurrency.toLowerCase(),
        toCurrency: params.toCurrency.toLowerCase(),
        fromAmount: params.fromAmount,
        flow: params.flow ?? 'standard',
      },
    });
    return {
      fromAmount: String(params.fromAmount),
      fromCurrency: params.fromCurrency,
      toAmount: String(data.toAmount ?? data.estimatedAmount ?? '0'),
      toCurrency: params.toCurrency,
      rateId: data.rateId,
      validUntil: data.validUntil,
      fee: String(data.networkFee ?? '0'),
      flow: params.flow ?? 'standard',
    };
  }

  /**
   * POST /exchange — create a fixed-rate or standard exchange.
   */
  async createExchange(input: CreateExchangeInput): Promise<ChangeNowExchange> {
    if (!this.isConfigured()) {
      throw new Error('CHANGENOW_API_KEY not configured');
    }

    const body = {
      fromCurrency: input.fromCurrency.toLowerCase(),
      toCurrency: input.toCurrency.toLowerCase(),
      fromAmount: input.fromAmount,
      address: input.toAddress,
      refundAddress: input.refundAddress,
      flow: input.flow ?? 'standard',
      payload: input.userId ? { userId: input.userId } : undefined,
    };

    const { data } = await this.client.post('/exchange', body);
    return this.normalize(data);
  }

  /**
   * GET /exchange/by-id — poll status for reconciliation jobs.
   */
  async getExchange(id: string): Promise<ChangeNowExchange> {
    const { data } = await this.client.get('/exchange/by-id', { params: { id } });
    return this.normalize(data);
  }

  /**
   * Verify a webhook callback signed with our shared secret.
   * ChangeNOW does not natively support HMAC callbacks, so this method is for
   * our own internal forwarder (e.g. a serverless callback gateway) that
   * relays ChangeNOW polled status with HMAC for backend trust.
   */
  static verifyWebhook(rawBody: string, signature: string | undefined): boolean {
    const secret = process.env.CHANGENOW_WEBHOOK_SECRET;
    if (!secret || !signature) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (expected.length !== signature.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }

  private normalize(data: any): ChangeNowExchange {
    return {
      id: data.id,
      fromAmount: String(data.fromAmount ?? data.expectedAmountFrom ?? '0'),
      toAmount: String(data.toAmount ?? data.expectedAmountTo ?? '0'),
      fromCurrency: data.fromCurrency,
      toCurrency: data.toCurrency,
      payinAddress: data.payinAddress,
      payoutAddress: data.payoutAddress,
      status: (data.status ?? 'new') as ChangeNowStatus,
      createdAt: data.createdAt ?? new Date().toISOString(),
      expectedReceiveAmount: data.expectedReceiveAmount,
      rateId: data.rateId,
    };
  }
}

export const changeNowProvider = new ChangeNowProvider();
