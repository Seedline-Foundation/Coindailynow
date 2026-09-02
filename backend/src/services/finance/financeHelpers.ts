import { Request } from 'express';
import prisma from '../../lib/prisma';
import { ALL_FINANCE_OPERATIONS } from '../../constants/financeOperations';

  export function generateTransactionHash(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `TXN_${timestamp}_${random}`.toUpperCase();
  }

  /**
   * Extract client IP address from request
   */
  export function getClientIP(req?: Request): string {
    if (!req) return '0.0.0.0';
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      const ip = forwarded.split(',')[0]?.trim();
      if (ip) return ip;
    }
    return req.ip || req.socket?.remoteAddress || '0.0.0.0';
  }

  /**
   * Log finance operation for audit trail
   */
  export async function logFinanceOperation(data: {
    operationKey: string;
    userId: string;
    transactionId: string;
    metadata?: Record<string, any>;
    req?: Request;
  }): Promise<void> {
    try {
      const ipAddress = getClientIP(data.req);
      const userAgent = data.req?.get
        ? (data.req.get('user-agent') || 'FinanceService')
        : (data.req?.headers?.['user-agent'] as string || 'FinanceService');

      await prisma.financeOperationLog.create({
        data: {
          operationType: data.operationKey,
          operationCategory: 'FINANCE',
          userId: data.userId,
          performedBy: data.userId,
          transactionId: data.transactionId,
          inputData: JSON.stringify(data.metadata || {}),
          status: 'SUCCESS',
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to log finance operation:', error);
    }
  }
