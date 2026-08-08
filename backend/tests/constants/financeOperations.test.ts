import {
  getOperationsByCategory,
  requiresApproval,
  requiresOTP,
  isHighRisk,
  getOperationDisplayName,
  getAllOperations,
  getOperationCount,
  OPERATION_CATEGORIES,
  ALL_FINANCE_OPERATIONS,
} from '../../src/constants/financeOperations';

describe('Finance Operations Constants & Helpers', () => {
  describe('getOperationsByCategory', () => {
    it('should return correct operations list for a valid category', () => {
      const deposits = getOperationsByCategory('DEPOSITS');
      expect(Array.isArray(deposits)).toBe(true);
      expect(deposits).toContain('deposit_external');
      expect(deposits).toContain('deposit_mobile_money');
    });

    it('should return undefined or throw for an invalid category when casted', () => {
      // Cast invalid key to test JavaScript runtime behavior
      const result = getOperationsByCategory('INVALID_CATEGORY' as any);
      expect(result).toBeUndefined();
    });
  });

  describe('requiresApproval', () => {
    it('should return true for operations requiring super admin approval', () => {
      expect(requiresApproval('transfer_we_to_user')).toBe(true);
      expect(requiresApproval('bulk_transfer')).toBe(true);
    });

    it('should return false for operations not requiring super admin approval', () => {
      expect(requiresApproval('deposit_external')).toBe(false);
      expect(requiresApproval('stake_lock')).toBe(false);
    });

    it('should return false for completely unknown operations', () => {
      expect(requiresApproval('unknown_operation_xyz')).toBe(false);
    });
  });

  describe('requiresOTP', () => {
    it('should return true for operations requiring OTP verification', () => {
      expect(requiresOTP('withdrawal_external')).toBe(true);
      expect(requiresOTP('transfer_user_to_user')).toBe(true);
    });

    it('should return false for operations not requiring OTP', () => {
      expect(requiresOTP('deposit_external')).toBe(false);
      expect(requiresOTP('stake_lock')).toBe(false);
    });

    it('should return false for unknown operations', () => {
      expect(requiresOTP('some_random_operation')).toBe(false);
    });
  });

  describe('isHighRisk', () => {
    it('should return true for high-risk operations', () => {
      expect(isHighRisk('security_wallet_freeze')).toBe(true);
      expect(isHighRisk('airdrop_distribute')).toBe(true);
    });

    it('should return false for low/medium risk operations', () => {
      expect(isHighRisk('deposit_external')).toBe(false);
      expect(isHighRisk('stake_lock')).toBe(false);
    });

    it('should return false for unknown operations', () => {
      expect(isHighRisk('unknown_op')).toBe(false);
    });
  });

  describe('getOperationDisplayName', () => {
    it('should return correct display name when metadata exists', () => {
      expect(getOperationDisplayName('deposit_external')).toBe('External Wallet Deposit');
      expect(getOperationDisplayName('withdrawal_external')).toBe('External Wallet Withdrawal');
    });

    it('should fallback to returning the operation string if no metadata exists', () => {
      expect(getOperationDisplayName('deposit_mobile_money')).toBe('deposit_mobile_money');
      expect(getOperationDisplayName('non_existent_op')).toBe('non_existent_op');
    });
  });

  describe('getAllOperations', () => {
    it('should return all registered operations in an array', () => {
      const allOps = getAllOperations();
      expect(Array.isArray(allOps)).toBe(true);
      expect(allOps.length).toBeGreaterThan(0);
      expect(allOps).toContain('deposit_external');
      expect(allOps).toContain('withdrawal_external');
      expect(allOps).toContain('stake_lock');
    });
  });

  describe('getOperationCount', () => {
    it('should return the correct count of registered operations', () => {
      const count = getOperationCount();
      const allOps = getAllOperations();
      expect(typeof count).toBe('number');
      expect(count).toBe(allOps.length);
    });
  });

  describe('Integrity checks of OPERATION_CATEGORIES', () => {
    it('should contain valid keys matching keyof typeof OPERATION_CATEGORIES', () => {
      const categoriesKeys = Object.keys(OPERATION_CATEGORIES);
      expect(categoriesKeys).toContain('DEPOSITS');
      expect(categoriesKeys).toContain('WITHDRAWALS');
      expect(categoriesKeys).toContain('STAKING');
    });
  });
});
