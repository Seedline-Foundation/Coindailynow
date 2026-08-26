/**
 * Wallet Admin Service Unit Tests
 */

import { lockWallet } from '../../src/services/WalletAdminService';
import prisma from '../../src/lib/prisma';
import { financeEmailService } from '../../src/services/FinanceEmailService';
import { logger } from '../../src/utils/logger';
import { WalletStatus, UserRole } from '@prisma/client';

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    wallet: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    financeOperationLog: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/FinanceEmailService', () => ({
  financeEmailService: {
    sendSecurityAlert: jest.fn(),
  },
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

describe('WalletAdminService - lockWallet', () => {
  const adminId = 'admin-123';
  const walletId = 'wallet-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should lock wallet and send email notification when user has an email', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: adminId,
      role: UserRole.SUPER_ADMIN,
    });

    const mockWallet = {
      id: walletId,
      userId: 'user-789',
      isLocked: false,
      user: {
        id: 'user-789',
        username: 'testuser',
        email: 'test@example.com',
      },
    };

    (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

    const updatedWallet = {
      ...mockWallet,
      isLocked: true,
      lockReason: '[TEMPORARY] Fraud investigation',
      status: WalletStatus.LOCKED,
    };

    (prisma.wallet.update as jest.Mock).mockResolvedValue(updatedWallet);
    (prisma.financeOperationLog.create as jest.Mock).mockResolvedValue({});
    (financeEmailService.sendSecurityAlert as jest.Mock).mockResolvedValue(true);

    const result = await lockWallet({
      walletId,
      reason: 'Fraud investigation',
      adminId,
      lockType: 'TEMPORARY',
      duration: 24,
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: adminId } });
    expect(prisma.wallet.findUnique).toHaveBeenCalledWith({
      where: { id: walletId },
      include: { user: true },
    });
    expect(prisma.wallet.update).toHaveBeenCalledWith({
      where: { id: walletId },
      data: expect.objectContaining({
        isLocked: true,
        lockReason: '[TEMPORARY] Fraud investigation',
        lockedBy: adminId,
        status: WalletStatus.LOCKED,
      }),
    });
    expect(financeEmailService.sendSecurityAlert).toHaveBeenCalledWith(
      'test@example.com',
      expect.objectContaining({
        username: 'testuser',
        alertType: 'wallet_locked',
        message: expect.stringContaining('Fraud investigation'),
      })
    );
    expect(result).toEqual(updatedWallet);
  });

  it('should handle email sending failure gracefully without throwing error', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: adminId,
      role: UserRole.SUPER_ADMIN,
    });

    const mockWallet = {
      id: walletId,
      userId: 'user-789',
      isLocked: false,
      user: {
        id: 'user-789',
        username: 'testuser',
        email: 'test@example.com',
      },
    };

    (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

    const updatedWallet = {
      ...mockWallet,
      isLocked: true,
      lockReason: '[SECURITY] Suspicious activity',
      status: WalletStatus.FROZEN,
    };

    (prisma.wallet.update as jest.Mock).mockResolvedValue(updatedWallet);
    (prisma.financeOperationLog.create as jest.Mock).mockResolvedValue({});
    (financeEmailService.sendSecurityAlert as jest.Mock).mockRejectedValue(new Error('SMTP service down'));

    const result = await lockWallet({
      walletId,
      reason: 'Suspicious activity',
      adminId,
      lockType: 'SECURITY',
    });

    expect(financeEmailService.sendSecurityAlert).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed to send wallet lock email notification'),
      expect.any(Error)
    );
    expect(result).toEqual(updatedWallet);
  });
});
