import { FinanceWalletManagement } from '../src/services/finance/categories/walletManagement';
import prisma from '../src/lib/prisma';
import OTPService, { OTPPurpose } from '../src/services/OTPService';
import * as FinPriv from '../src/services/finance/financePrivateCompliance';
import { WalletStatus } from '@prisma/client';

jest.mock('../src/lib/prisma', () => ({
  wallet: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  financeOperationLog: {
    create: jest.fn(),
  },
}));

jest.mock('../src/services/OTPService', () => ({
  verifyOTP: jest.fn(),
  OTPPurpose: {
    WALLET_RECOVERY: 'WALLET_RECOVERY',
  },
}));

jest.mock('../src/services/finance/financePrivateCompliance', () => ({
  validate2FAToken: jest.fn(),
}));

describe('FinanceWalletManagement.walletRecovery', () => {
  const userId = 'user-123';
  const walletId = 'wallet-123';
  const recoveryCode = '123456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should recover wallet via EMAIL successfully', async () => {
    (prisma.wallet.findUnique as jest.Mock).mockResolvedValue({
      id: walletId,
      userId: userId,
      status: WalletStatus.FROZEN,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: userId,
    });
    (OTPService.verifyOTP as jest.Mock).mockResolvedValue({
      success: true,
    });
    (prisma.wallet.update as jest.Mock).mockResolvedValue({
      id: walletId,
      status: WalletStatus.ACTIVE,
      twoFactorRequired: false,
      otpRequired: true,
    });

    const result = await FinanceWalletManagement.walletRecovery({
      userId,
      walletId,
      recoveryMethod: 'EMAIL',
      recoveryCode,
    });

    expect(result.success).toBe(true);
    expect(OTPService.verifyOTP).toHaveBeenCalledWith({
      userId,
      code: recoveryCode,
      purpose: 'WALLET_RECOVERY',
    });
    expect(prisma.wallet.update).toHaveBeenCalled();
  });

  it('should recover wallet via AUTHENTICATOR successfully', async () => {
    (prisma.wallet.findUnique as jest.Mock).mockResolvedValue({
      id: walletId,
      userId: userId,
      status: WalletStatus.FROZEN,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: userId,
      twoFactorEnabled: true,
      twoFactorSecret: 'secret123',
    });
    (FinPriv.validate2FAToken as jest.Mock).mockReturnValue(true);
    (prisma.wallet.update as jest.Mock).mockResolvedValue({
      id: walletId,
      status: WalletStatus.ACTIVE,
    });

    const result = await FinanceWalletManagement.walletRecovery({
      userId,
      walletId,
      recoveryMethod: 'AUTHENTICATOR',
      recoveryCode,
    });

    expect(result.success).toBe(true);
    expect(FinPriv.validate2FAToken).toHaveBeenCalledWith('secret123', recoveryCode);
  });

  it('should fail if recovery code is invalid (EMAIL)', async () => {
    (prisma.wallet.findUnique as jest.Mock).mockResolvedValue({
      id: walletId,
      userId: userId,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: userId,
    });
    (OTPService.verifyOTP as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Invalid OTP',
    });

    const result = await FinanceWalletManagement.walletRecovery({
      userId,
      walletId,
      recoveryMethod: 'EMAIL',
      recoveryCode: 'wrong',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid OTP');
  });

  it('should fail if 2FA is not enabled for AUTHENTICATOR method', async () => {
    (prisma.wallet.findUnique as jest.Mock).mockResolvedValue({
      id: walletId,
      userId: userId,
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: userId,
      twoFactorEnabled: false,
    });

    const result = await FinanceWalletManagement.walletRecovery({
      userId,
      walletId,
      recoveryMethod: 'AUTHENTICATOR',
      recoveryCode,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('2FA is not enabled for this user');
  });
});
