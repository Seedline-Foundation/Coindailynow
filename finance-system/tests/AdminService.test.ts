import { mockQueryFn, resetDbMocks, queryResult, testId } from './setup';

// We need to mock bcryptjs and otpauth before importing AdminService
jest.mock('bcryptjs', () => ({
  hash: jest.fn(async (pw: string, rounds: number) => `hashed:${pw}`),
  compare: jest.fn(async (pw: string, hash: string) => hash === `hashed:${pw}`),
}));

const mockTOTPValidate = jest.fn();
const mockTOTPToString = jest.fn().mockReturnValue('otpauth://totp/CoinDaily%20CFIS:admin@test.com?secret=BASE32&issuer=CoinDaily%20CFIS');

jest.mock('otpauth', () => {
  const SecretCtor: any = jest.fn().mockImplementation(() => ({
    base32: 'JBSWY3DPEHPK3PXP',
  }));
  SecretCtor.fromBase32 = jest.fn().mockReturnValue('decoded-secret');

  return {
    TOTP: jest.fn().mockImplementation(() => ({
      validate: mockTOTPValidate,
      toString: mockTOTPToString,
    })),
    Secret: SecretCtor,
  };
});

// Now import — the mocks are in place
import { adminService } from '../src/services/AdminService';
import bcrypt from 'bcryptjs';

describe('AdminService', () => {
  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
  });

  // =================================================================
  // createAdmin
  // =================================================================
  describe('createAdmin', () => {
    it('hashes password, generates TOTP secret, and inserts admin', async () => {
      const admin = {
        id: testId(),
        email: 'admin@test.com',
        password_hash: 'hashed:strongpass',
        totp_secret: 'JBSWY3DPEHPK3PXP',
        totp_enrolled: false,
        failed_attempts: 0,
        locked_until: null,
      };
      mockQueryFn.mockResolvedValue(queryResult([admin]));

      const result = await adminService.createAdmin('admin@test.com', 'strongpass');

      expect(bcrypt.hash).toHaveBeenCalledWith('strongpass', 12);
      expect(result.admin.email).toBe('admin@test.com');
      expect(result.totpSecret).toBe('JBSWY3DPEHPK3PXP');
      expect(result.totpUri).toContain('otpauth://');
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO cfis_admins'),
        expect.any(Array),
      );
    });
  });

  // =================================================================
  // verifyPassword
  // =================================================================
  describe('verifyPassword', () => {
    const admin = {
      id: 'admin-1',
      email: 'admin@test.com',
      password_hash: 'hashed:correct',
      totp_secret: 'JBSWY3DPEHPK3PXP',
      totp_enrolled: true,
      failed_attempts: 0,
      locked_until: null,
      last_login: null,
    };

    it('returns success for correct password', async () => {
      mockQueryFn
        .mockResolvedValueOnce(queryResult([admin]))  // findByEmail
        .mockResolvedValueOnce(queryResult([]));       // reset failed_attempts

      const result = await adminService.verifyPassword('admin@test.com', 'correct');
      expect(result.success).toBe(true);
      expect(result.admin).toBeDefined();
      expect(result.admin!.email).toBe('admin@test.com');
    });

    it('returns failure for wrong password and increments attempts', async () => {
      mockQueryFn
        .mockResolvedValueOnce(queryResult([admin]))  // findByEmail
        .mockResolvedValueOnce(queryResult([{ failed_attempts: 1 }]));  // incrementFailedAttempts

      const result = await adminService.verifyPassword('admin@test.com', 'wrong');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password.');
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('failed_attempts = failed_attempts + 1'),
        ['admin-1'],
      );
    });

    it('returns failure for non-existent email (constant-time)', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));

      const result = await adminService.verifyPassword('nobody@test.com', 'anything');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password.');
      expect(bcrypt.hash).toHaveBeenCalledWith('anything', 12);
    });

    it('returns lockout error when account is locked', async () => {
      const locked = {
        ...admin,
        locked_until: new Date(Date.now() + 15 * 60000), // 15 min from now
      };
      mockQueryFn.mockResolvedValue(queryResult([locked]));

      const result = await adminService.verifyPassword('admin@test.com', 'correct');
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Account locked/);
      expect(result.error).toMatch(/minutes/);
    });

    it('locks account after MAX_FAILED_ATTEMPTS', async () => {
      const nearLockout = { ...admin, failed_attempts: 4 };
      mockQueryFn
        .mockResolvedValueOnce(queryResult([nearLockout]))  // findByEmail
        .mockResolvedValueOnce(queryResult([{ failed_attempts: 5 }]))  // increment
        .mockResolvedValueOnce(queryResult([]));  // lock query

      await adminService.verifyPassword('admin@test.com', 'wrong');

      // Should have called the lockout UPDATE
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('locked_until'),
        expect.arrayContaining(['admin-1', 30]),
      );
    });
  });

  // =================================================================
  // TOTP
  // =================================================================
  describe('TOTP', () => {
    it('verifyTOTP returns true when token is valid', () => {
      mockTOTPValidate.mockReturnValue(0); // delta = 0 → exact match
      const result = adminService.verifyTOTP('admin@test.com', 'JBSWY3DPEHPK3PXP', '123456');
      expect(result).toBe(true);
    });

    it('verifyTOTP returns false when token is invalid', () => {
      mockTOTPValidate.mockReturnValue(null); // null → invalid
      const result = adminService.verifyTOTP('admin@test.com', 'JBSWY3DPEHPK3PXP', '000000');
      expect(result).toBe(false);
    });

    it('generateTOTPUri returns otpauth URI', () => {
      const uri = adminService.generateTOTPUri('admin@test.com', 'JBSWY3DPEHPK3PXP');
      expect(uri).toContain('otpauth://');
    });

    it('enrollTOTP marks admin as enrolled', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));
      await adminService.enrollTOTP('admin-1');
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('totp_enrolled = true'),
        ['admin-1'],
      );
    });
  });

  // =================================================================
  // updateLastLogin
  // =================================================================
  describe('updateLastLogin', () => {
    it('updates last_login timestamp', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));
      await adminService.updateLastLogin('admin-1');
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('last_login = NOW()'),
        ['admin-1'],
      );
    });
  });

  // =================================================================
  // hashPassword
  // =================================================================
  describe('hashPassword', () => {
    it('returns hashed password', async () => {
      const result = await adminService.hashPassword('testpass');
      expect(result).toBe('hashed:testpass');
    });
  });

  // =================================================================
  // isDbAuthAvailable
  // =================================================================
  describe('isDbAuthAvailable', () => {
    it('returns true when table exists and has admins', async () => {
      mockQueryFn
        .mockResolvedValueOnce(queryResult([{ exists: true }]))   // tableExists
        .mockResolvedValueOnce(queryResult([{ count: '2' }]));    // count admins

      const result = await adminService.isDbAuthAvailable();
      expect(result).toBe(true);
    });

    it('returns false when table has no admins', async () => {
      mockQueryFn
        .mockResolvedValueOnce(queryResult([{ exists: true }]))
        .mockResolvedValueOnce(queryResult([{ count: '0' }]));

      const result = await adminService.isDbAuthAvailable();
      expect(result).toBe(false);
    });
  });
});
