import { Request } from 'express';
import prisma from '../../lib/prisma';
import { ALL_FINANCE_OPERATIONS } from '../../constants/financeOperations';

export function generateTransactionHash(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `TXN_${timestamp}_${random}`.toUpperCase();
}

/**
 * Log finance operation for audit trail
 */
export async function logFinanceOperation(data: {
  operationKey: string;
  userId: string;
  transactionId: string;
  metadata?: Record<string, any>;
  req?: Request | any;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    let ipAddress = data.ipAddress || '0.0.0.0';
    let userAgent = data.userAgent || 'FinanceService';

    if (data.req) {
      const req = data.req;
      // Extract client IP address from the Express request
      const forwarded = req.headers?.['x-forwarded-for'];
      if (typeof forwarded === 'string') {
        ipAddress = forwarded.split(',')[0]?.trim() || req.ip || req.socket?.remoteAddress || ipAddress;
      } else {
        ipAddress = req.ip || req.socket?.remoteAddress || ipAddress;
      }

      // Extract client User-Agent from the Express request
      userAgent = req.headers?.['user-agent'] || (typeof req.get === 'function' ? req.get('user-agent') : '') || userAgent;
    }

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
