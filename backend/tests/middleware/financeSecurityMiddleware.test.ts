import { financeSecurityMiddleware } from '../../src/middleware/financeSecurityMiddleware';
import prisma from '../../src/lib/prisma';
import { financeAuditService } from '../../src/services/FinanceAuditService';
import { financeEmailService } from '../../src/services/FinanceEmailService';

jest.mock('../../src/lib/prisma', () => ({
  wallet: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
}));

jest.mock('../../src/services/FinanceAuditService', () => ({
  financeAuditService: {
    logSecurityEvent: jest.fn(),
  },
  AuditAction: {
    WALLET_LOCKED: 'WALLET_LOCKED',
  },
}));

jest.mock('../../src/services/FinanceEmailService', () => ({
  financeEmailService: {
    sendSecurityAlert: jest.fn(),
  },
}));

describe('FinanceSecurityMiddleware - lockWallet', () => {
  const mockReq: any = {
    headers: {
      'x-forwarded-for': '192.168.1.100',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should lock wallet and send security alert email when user is found', async () => {
    (prisma.wallet.findFirst as jest.Mock).mockResolvedValue({
      id: 'wallet-123',
      userId: 'user-123',
    });
    (prisma.wallet.update as jest.Mock).mockResolvedValue({
      id: 'wallet-123',
      status: 'LOCKED',
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      email: 'user@example.com',
      username: 'testuser',
    });
    (financeEmailService.sendSecurityAlert as jest.Mock).mockResolvedValue(true);

    await financeSecurityMiddleware.lockWallet('user-123', mockReq, 'Multiple failed OTP attempts');

    expect(prisma.wallet.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-123', walletType: 'USER_WALLET' },
    });
    expect(prisma.wallet.update).toHaveBeenCalledWith({
      where: { id: 'wallet-123' },
      data: { status: 'LOCKED' },
    });
    expect(financeAuditService.logSecurityEvent).toHaveBeenCalledWith(
      'user-123',
      'WALLET_LOCKED',
      expect.objectContaining({
        reason: 'Multiple failed OTP attempts',
        wallet_id: 'wallet-123',
        auto_locked: true,
      }),
      mockReq
    );
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      select: { email: true, username: true },
    });
    expect(financeEmailService.sendSecurityAlert).toHaveBeenCalledWith(
      'user@example.com',
      expect.objectContaining({
        username: 'testuser',
        alertType: 'wallet_locked',
        message: 'Your wallet has been locked due to security reasons. Reason: Multiple failed OTP attempts',
        ipAddress: '192.168.1.100',
        actionRequired: 'Please contact support to unlock your wallet.',
      })
    );
  });

  it('should not throw if sending security alert email fails', async () => {
    (prisma.wallet.findFirst as jest.Mock).mockResolvedValue({
      id: 'wallet-123',
      userId: 'user-123',
    });
    (prisma.wallet.update as jest.Mock).mockResolvedValue({
      id: 'wallet-123',
      status: 'LOCKED',
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      email: 'user@example.com',
      username: 'testuser',
    });
    (financeEmailService.sendSecurityAlert as jest.Mock).mockRejectedValue(new Error('SMTP Error'));

    await expect(
      financeSecurityMiddleware.lockWallet('user-123', mockReq, 'Multiple failed OTP attempts')
    ).resolves.not.toThrow();

    expect(financeEmailService.sendSecurityAlert).toHaveBeenCalled();
  });
});
