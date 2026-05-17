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
  }): Promise<void> {
    try {
      await prisma.financeOperationLog.create({
        data: {
          operationType: data.operationKey,
          operationCategory: 'FINANCE',
          userId: data.userId,
          performedBy: data.userId,
          transactionId: data.transactionId,
          inputData: JSON.stringify(data.metadata || {}),
          status: 'SUCCESS',
          ipAddress: '0.0.0.0', // TODO: Get from request
          userAgent: 'FinanceService',
        },
      });
    } catch (error) {
      console.error('Failed to log finance operation:', error);
    }
  }
