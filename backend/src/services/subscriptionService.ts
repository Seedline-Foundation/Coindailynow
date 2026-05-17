/**
 * Subscription checkout, trial, cancel, and receipt generation.
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import axios from 'axios';
import { logger } from '../utils/logger';
import prisma from '../lib/prisma';

export type CheckoutProvider = 'yellowcard' | 'changenow';

export interface CheckoutSessionInput {
  userId: string;
  planId: string;
  provider: CheckoutProvider;
  successUrl?: string;
  cancelUrl?: string;
}

export class SubscriptionService {
  constructor(private prisma: PrismaClient) {}

  async listPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getUserSubscription(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
      include: { SubscriptionPlan: true },
    });
  }

  async startTrial(userId: string, planId: string, trialDays = 7) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');

    const now = new Date();
    const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(trialEnd.getTime() + 30 * 24 * 60 * 60 * 1000);

    return this.prisma.subscription.upsert({
      where: { userId },
      create: {
        id: randomUUID(),
        userId,
        planId,
        status: 'TRIAL',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEnd,
        updatedAt: now,
      },
      update: {
        planId,
        status: 'TRIAL',
        trialEnd,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        updatedAt: now,
      },
    });
  }

  async createCheckoutSession(input: CheckoutSessionInput) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: input.planId } });
    if (!plan) throw new Error('Plan not found');

    const reference = `sub_${input.userId}_${Date.now()}`;
    const amountUsd = (plan.priceCents / 100).toFixed(2);

    if (input.provider === 'yellowcard') {
      const apiKey = process.env.YELLOWCARD_API_KEY;
      const baseUrl = process.env.YELLOWCARD_API_URL || 'https://api.yellowcard.io';
      const checkoutUrl =
        process.env.YELLOWCARD_CHECKOUT_URL ||
        `${baseUrl}/checkout?amount=${amountUsd}&currency=USD&ref=${reference}`;

      return {
        provider: 'yellowcard',
        reference,
        checkoutUrl,
        amount: plan.priceCents,
        currency: plan.currency,
        planId: plan.id,
        planName: plan.name,
      };
    }

    const partnerId = process.env.CHANGENOW_PARTNER_ID || '';
    const checkoutUrl =
      process.env.CHANGENOW_CHECKOUT_URL ||
      `https://changenow.io/exchange?from=usd&to=btc&amount=${amountUsd}&partner_id=${partnerId}&order_id=${reference}`;

    return {
      provider: 'changenow',
      reference,
      checkoutUrl,
      amount: plan.priceCents,
      currency: plan.currency,
      planId: plan.id,
      planName: plan.name,
    };
  }

  async confirmPayment(params: {
    userId: string;
    planId: string;
    gatewayTxId: string;
    paymentMethod: string;
    paymentGateway: string;
    amount: number;
    currency?: string;
  }) {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const invoiceNumber = `INV-${Date.now()}-${params.userId.slice(0, 6)}`;

    const subscription = await this.prisma.subscription.upsert({
      where: { userId: params.userId },
      create: {
        id: randomUUID(),
        userId: params.userId,
        planId: params.planId,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        updatedAt: now,
      },
      update: {
        planId: params.planId,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        updatedAt: now,
      },
    });

    const record = await this.prisma.subscriptionPaymentRecord.create({
      data: {
        userId: params.userId,
        subscriptionId: subscription.id,
        amount: params.amount,
        currency: params.currency || 'USD',
        paymentMethod: params.paymentMethod,
        paymentGateway: params.paymentGateway,
        gatewayTxId: params.gatewayTxId,
        invoiceNumber,
        status: 'COMPLETED',
        nextBillingDate: periodEnd,
      },
    });

    await this.prisma.user.update({
      where: { id: params.userId },
      data: { subscriptionTier: 'PREMIUM', updatedAt: now },
    });

    await this.sendReceiptEmail(params.userId, record);
    const { emitCfisEvent } = await import('./cfisWebhookService');
    await emitCfisEvent('SUBSCRIPTION_PAYMENT', {
      subscriptionId: subscription.id,
      userId: params.userId,
      amount: params.amount,
      invoiceNumber,
      currency: params.currency || 'USD',
    });

    return { subscription, paymentRecord: record };
  }

  async cancelAtPeriodEnd(userId: string) {
    return this.prisma.subscription.update({
      where: { userId },
      data: { cancelAtPeriodEnd: true, cancelledAt: new Date(), updatedAt: new Date() },
    });
  }

  private async sendReceiptEmail(
    userId: string,
    record: { invoiceNumber: string; amount: number; currency: string; paidAt: Date },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    });
    if (!user?.email) return;

    const html = `
      <h2>CoinDaily Subscription Receipt</h2>
      <p>Invoice: ${record.invoiceNumber}</p>
      <p>Amount: ${record.currency} ${record.amount.toFixed(2)}</p>
      <p>Paid: ${record.paidAt.toISOString()}</p>
      <p>Thank you for subscribing.</p>
    `;

    let attachments: { Name: string; Content: string; ContentType: string }[] | undefined;
    try {
      const { PDFDocument, StandardFonts } = await import('pdf-lib');
      const doc = await PDFDocument.create();
      const page = doc.addPage([400, 220]);
      const font = await doc.embedFont(StandardFonts.Helvetica);
      page.drawText('CoinDaily — Subscription receipt', { x: 40, y: 180, size: 14, font });
      page.drawText(`Invoice: ${record.invoiceNumber}`, { x: 40, y: 150, size: 11, font });
      page.drawText(`Amount: ${record.currency} ${record.amount.toFixed(2)}`, { x: 40, y: 130, size: 11, font });
      page.drawText(`Paid: ${record.paidAt.toISOString()}`, { x: 40, y: 110, size: 11, font });
      const bytes = await doc.save();
      attachments = [
        {
          Name: `receipt-${record.invoiceNumber}.pdf`,
          Content: Buffer.from(bytes).toString('base64'),
          ContentType: 'application/pdf',
        },
      ];
    } catch {
      attachments = undefined;
    }

    if (process.env.POSTMARK_SERVER_TOKEN) {
      await axios.post(
        'https://api.postmarkapp.com/email',
        {
          From: process.env.RECEIPT_FROM_EMAIL || 'billing@coindaily.online',
          To: user.email,
          Subject: `Receipt ${record.invoiceNumber}`,
          HtmlBody: html,
          ...(attachments ? { Attachments: attachments } : {}),
        },
        { headers: { 'X-Postmark-Server-Token': process.env.POSTMARK_SERVER_TOKEN } },
      ).catch((e) => logger.warn('Postmark receipt failed', { error: e.message }));
      return;
    }

    if (process.env.AWS_SES_REGION) {
      logger.info('SES receipt queued (configure SES send in production)', {
        to: user.email,
        invoice: record.invoiceNumber,
      });
    }
  }

}

export const subscriptionService = new SubscriptionService(prisma);
