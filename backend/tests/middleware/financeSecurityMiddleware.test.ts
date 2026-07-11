import { Request } from 'express';
import { financeSecurityMiddleware } from '../../src/middleware/financeSecurityMiddleware';
import prisma from '../../src/lib/prisma';
import { financeEmailService } from '../../src/services/FinanceEmailService';
import { WalletType } from '@prisma/client';
import { logger } from '../../src/utils/logger';

// Mock Prisma
jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    wallet: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock FinanceEmailService
jest.mock('../../src/services/FinanceEmailService', () => ({
  financeEmailService: {
    sendSecurityAlert: jest.fn(),
  },
}));

// Mock FinanceAuditService while preserving enums like AuditAction
jest.mock('../../src/services/FinanceAuditService', () => {
  const original = jest.requireActual('../../src/services/FinanceAuditService');
  return {
    ...original,
    financeAuditService: {
      logSecurityEvent: jest.fn().mockResolvedValue(true),
    },
  };
});

// Mock logger to avoid spamming the console
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('FinanceSecurityMiddleware - lockWallet', () => {
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      ip: '127.0.0.1',
      headers: {},
      socket: {
        remoteAddress: '127.0.0.1',
      } as any,
    };
  });

  it('should lock wallet and send security alert email when wallet is found and user is found', async () => {
    const userId = 'user-123';
    const reason = 'Suspicious activity';
    const mockWallet = { id: 'wallet-123', userId, walletType: WalletType.USER_WALLET };
    const mockUser = { id: userId, email: 'user@example.com', username: 'testuser' };

    (prisma.wallet.findFirst as jest.Mock).mockResolvedValue(mockWallet);
    (prisma.wallet.update as jest.Mock).mockResolvedValue({ ...mockWallet, status: 'LOCKED' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (financeEmailService.sendSecurityAlert as jest.Mock).mockResolvedValue(true);

    await financeSecurityMiddleware.lockWallet(userId, mockRequest as Request, reason);

    // Verify wallet findFirst was called
    expect(prisma.wallet.findFirst).toHaveBeenCalledWith({
      where: { userId, walletType: WalletType.USER_WALLET },
    });

    // Verify wallet status was updated
    expect(prisma.wallet.update).toHaveBeenCalledWith({
      where: { id: 'wallet-123' },
      data: { status: 'LOCKED' },
    });

    // Verify user was fetched
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
      select: { email: true, username: true },
    });

    // Verify security email was sent
    expect(financeEmailService.sendSecurityAlert).toHaveBeenCalledWith('user@example.com', expect.objectContaining({
      username: 'testuser',
      alertType: 'wallet_locked',
      message: expect.stringContaining(reason),
      ipAddress: '127.0.0.1',
      actionRequired: 'Please contact support to unlock your wallet.',
    }));
  });

  it('should handle sendSecurityAlert rejection gracefully without throwing error', async () => {
    const userId = 'user-123';
    const reason = 'Suspicious activity';
    const mockWallet = { id: 'wallet-123', userId, walletType: WalletType.USER_WALLET };
    const mockUser = { id: userId, email: 'user@example.com', username: 'testuser' };

    (prisma.wallet.findFirst as jest.Mock).mockResolvedValue(mockWallet);
    (prisma.wallet.update as jest.Mock).mockResolvedValue({ ...mockWallet, status: 'LOCKED' });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (financeEmailService.sendSecurityAlert as jest.Mock).mockRejectedValue(new Error('SMTP connection timed out'));

    // Should not throw
    await expect(
      financeSecurityMiddleware.lockWallet(userId, mockRequest as Request, reason)
    ).resolves.not.toThrow();

    expect(financeEmailService.sendSecurityAlert).toHaveBeenCalled();
  });
});
