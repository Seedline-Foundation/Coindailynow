import { z } from 'zod';

export const checkoutSchema = z.object({
  planId: z.string().min(1),
  provider: z.enum(['yellowcard', 'changenow']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const confirmPaymentSchema = z.object({
  planId: z.string().min(1),
  gatewayTxId: z.string().min(1),
  amount: z.number().nonnegative(),
  paymentMethod: z.string().optional(),
  paymentGateway: z.string().optional(),
  currency: z.string().optional(),
});
