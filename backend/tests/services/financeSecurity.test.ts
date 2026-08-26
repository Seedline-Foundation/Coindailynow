import { FinanceSecurity } from '../../src/services/finance/categories/security';
import prisma from '../../src/lib/prisma';
import { financeEmailService } from '../../src/services/FinanceEmailService';

jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    wallet: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    financeOperationLog: {
      create: jest.fn(),
    },
    userNotification: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../src/services/FinanceEmailService', () => ({
  financeEmailService: {
    sendSecurityAlert: jest.fn(),
  },
}));

describe('FinanceSecurity - securityWalletFreeze', () => {
  const mockWallet = {
    id: 'wallet-123',
    userId: 'user-123',
    walletAddress: '0x1234567890abcdef',
    isLocked: false,
    user: {
      id: 'user-123',
      email: 'user@example.com',
      username: 'testuser',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should freeze wallet and send both in-app and email notifications when user and email exist', async () => {
    (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
    (prisma.wallet.update as jest.Mock).mockResolvedValue({ ...mockWallet, isLocked: true });
    (prisma.financeOperationLog.create as jest.Mock).mockResolvedValue({});
    (prisma.userNotification.create as jest.Mock).mockResolvedValue({});
    (financeEmailService.sendSecurityAlert as jest.Mock).mockResolvedValue(true);

    const result = await FinanceSecurity.securityWalletFreeze({
      walletId: 'wallet-123',
      reason: 'Suspicious activity detected',
      frozenByUserId: 'admin-1',
      duration: 12,
    });

    expect(result.success).toBe(true);
    expect(result.walletFrozen).toBe(true);

    // Verify wallet status updated
    expect(prisma.wallet.update).toHaveBeenCalledWith({
      where: { id: 'wallet-123' },
      data: expect.objectContaining({
        isLocked: true,
        lockReason: 'Suspicious activity detected',
        lockedBy: 'admin-1',
      }),
    });

    // Verify in-app notification created
    expect(prisma.userNotification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-123',
        type: 'SECURITY_ALERT',
        title: 'Wallet Frozen',
        message: expect.stringContaining('Suspicious activity detected'),
        link: '/wallet/security',
      }),
    });

    // Verify email notification sent
    expect(financeEmailService.sendSecurityAlert).toHaveBeenCalledWith(
      'user@example.com',
      expect.objectContaining({
        username: 'testuser',
        alertType: 'wallet_locked',
        message: expect.stringContaining('Suspicious activity detected'),
        actionRequired: expect.stringContaining('12 hours'),
      })
    );
  });

  it('should handle missing user email gracefully without throwing error', async () => {
    const mockWalletNoEmail = {
      ...mockWallet,
      user: {
        id: 'user-123',
        email: null,
        username: 'testuser',
      },
    };

    (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWalletNoEmail);
    (prisma.wallet.update as jest.Mock).mockResolvedValue({ ...mockWalletNoEmail, isLocked: true });
    (prisma.financeOperationLog.create as jest.Mock).mockResolvedValue({});
    (prisma.userNotification.create as jest.Mock).mockResolvedValue({});

    const result = await FinanceSecurity.securityWalletFreeze({
      walletId: 'wallet-123',
      reason: 'Suspicious activity detected',
      frozenByUserId: 'admin-1',
    });

    expect(result.success).toBe(true);
    expect(prisma.userNotification.create).toHaveBeenCalled();
    expect(financeEmailService.sendSecurityAlert).not.toHaveBeenCalled();
  });

  it('should handle missing userId gracefully without creating in-app or email notifications', async () => {
    const mockWalletNoUser = {
      id: 'wallet-platform',
      userId: null,
      walletAddress: '0xplatform',
      user: null,
    };

    (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWalletNoUser);
    (prisma.wallet.update as jest.Mock).mockResolvedValue({ ...mockWalletNoUser, isLocked: true });
    (prisma.financeOperationLog.create as jest.Mock).mockResolvedValue({});

    const result = await FinanceSecurity.securityWalletFreeze({
      walletId: 'wallet-platform',
      reason: 'System maintenance freeze',
      frozenByUserId: 'admin-1',
    });

    expect(result.success).toBe(true);
    expect(prisma.userNotification.create).not.toHaveBeenCalled();
    expect(financeEmailService.sendSecurityAlert).not.toHaveBeenCalled();
  });

  it('should remain successful if notification creation or email sending fails', async () => {
    (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
    (prisma.wallet.update as jest.Mock).mockResolvedValue({ ...mockWallet, isLocked: true });
    (prisma.financeOperationLog.create as jest.Mock).mockResolvedValue({});
    (prisma.userNotification.create as jest.Mock).mockRejectedValue(new Error('DB notification error'));
    (financeEmailService.sendSecurityAlert as jest.Mock).mockRejectedValue(new Error('SMTP connection error'));

    const result = await FinanceSecurity.securityWalletFreeze({
      walletId: 'wallet-123',
      reason: 'Suspicious activity detected',
      frozenByUserId: 'admin-1',
    });

    expect(result.success).toBe(true);
    expect(result.walletFrozen).toBe(true);
  });
});
