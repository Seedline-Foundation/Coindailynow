import { mockQueryFn, mockTransactionFn, resetDbMocks, queryResult, testId } from './setup';

// Mock dependent services before importing PaymentProcessor
const mockGetTreasuryWallet = jest.fn();
const mockGetEscrowWallet = jest.fn();
const mockCreditWallet = jest.fn();
const mockDebitWallet = jest.fn();

jest.mock('../src/services/WalletService', () => ({
  walletService: {
    getTreasuryWallet: (...a: any[]) => mockGetTreasuryWallet(...a),
    getEscrowWallet: (...a: any[]) => mockGetEscrowWallet(...a),
    creditWallet: (...a: any[]) => mockCreditWallet(...a),
    debitWallet: (...a: any[]) => mockDebitWallet(...a),
  },
}));

const mockCreateTransaction = jest.fn();
const mockUpdateStatus = jest.fn();
const mockSetAIVerification = jest.fn();
const mockSetJournalEntry = jest.fn();
const mockGetTransaction = jest.fn();

jest.mock('../src/services/TransactionService', () => ({
  transactionService: {
    createTransaction: (...a: any[]) => mockCreateTransaction(...a),
    updateStatus: (...a: any[]) => mockUpdateStatus(...a),
    setAIVerification: (...a: any[]) => mockSetAIVerification(...a),
    setJournalEntry: (...a: any[]) => mockSetJournalEntry(...a),
    getTransaction: (...a: any[]) => mockGetTransaction(...a),
  },
}));

const mockCreateJournalEntry = jest.fn();
jest.mock('../src/services/LedgerService', () => ({
  ledgerService: {
    createJournalEntry: (...a: any[]) => mockCreateJournalEntry(...a),
  },
}));

const mockNotifySuperAdmin = jest.fn();
jest.mock('../src/services/NotificationService', () => ({
  notificationService: {
    notifySuperAdmin: (...a: any[]) => mockNotifySuperAdmin(...a),
  },
}));

const mockAuditLog = jest.fn();
jest.mock('../src/services/AuditService', () => ({
  auditService: {
    log: (...a: any[]) => mockAuditLog(...a),
  },
}));

const mockVerifyUserWithdrawal = jest.fn();
const mockVerifyPressPlacement = jest.fn();
const mockVerifyPartnershipDocument = jest.fn();
const mockVerifyBonusPayment = jest.fn();

jest.mock('../src/agents/AIVerificationAgent', () => ({
  aiVerificationAgent: {
    verifyUserWithdrawal: (...a: any[]) => mockVerifyUserWithdrawal(...a),
    verifyPressPlacement: (...a: any[]) => mockVerifyPressPlacement(...a),
    verifyPartnershipDocument: (...a: any[]) => mockVerifyPartnershipDocument(...a),
    verifyBonusPayment: (...a: any[]) => mockVerifyBonusPayment(...a),
  },
}));

import { PaymentProcessor } from '../src/services/PaymentProcessor';

describe('PaymentProcessor', () => {
  let processor: PaymentProcessor;

  const TREASURY_WALLET = { id: testId(), owner_type: 'TREASURY', balance_jy: 1000000 };
  const ESCROW_WALLET = { id: testId(), owner_type: 'ESCROW', balance_jy: 500000 };
  const USER_WALLET_ID = testId();

  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
    processor = new PaymentProcessor();

    mockGetTreasuryWallet.mockResolvedValue(TREASURY_WALLET);
    mockGetEscrowWallet.mockResolvedValue(ESCROW_WALLET);
    mockCreditWallet.mockResolvedValue({});
    mockDebitWallet.mockResolvedValue({});
    mockNotifySuperAdmin.mockResolvedValue({});
    mockAuditLog.mockResolvedValue(undefined);
  });

  // ── Helper to set up standard executePayment mocks ──────────────
  function setupExecuteMocks(tx: any) {
    mockGetTransaction.mockResolvedValue(tx);
    mockUpdateStatus.mockResolvedValue(tx);
    mockCreateJournalEntry.mockResolvedValue({ id: testId() });
    mockSetJournalEntry.mockResolvedValue(undefined);
  }

  // =================================================================
  // 1. processUserWithdrawal
  // =================================================================
  describe('processUserWithdrawal', () => {
    const baseData = {
      userId: 'user-1',
      walletId: USER_WALLET_ID,
      amount: 100,
      activityData: { totalPointsEarned: 200000 },
    };

    it('creates a transaction and calls AI verification', async () => {
      const txId = testId();
      const tx = { id: txId, amount: 100, currency: 'JY', from_wallet_id: TREASURY_WALLET.id, to_wallet_id: USER_WALLET_ID, tx_type: 'TOKEN_WITHDRAWAL', description: 'withdrawal' };
      mockCreateTransaction.mockResolvedValue(tx);
      mockUpdateStatus.mockResolvedValue(tx);
      mockVerifyUserWithdrawal.mockResolvedValue({ id: testId(), result: 'APPROVED' });
      mockSetAIVerification.mockResolvedValue(undefined);
      setupExecuteMocks(tx);

      const result = await processor.processUserWithdrawal(baseData);

      expect(mockCreateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ tx_type: 'TOKEN_WITHDRAWAL', amount: 100, currency: 'JY' }),
      );
      expect(mockVerifyUserWithdrawal).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('rejects withdrawal when AI verification fails', async () => {
      const txId = testId();
      const tx = { id: txId, amount: 100, currency: 'JY', tx_type: 'TOKEN_WITHDRAWAL' };
      mockCreateTransaction.mockResolvedValue(tx);
      mockUpdateStatus.mockResolvedValue(tx);
      mockVerifyUserWithdrawal.mockResolvedValue({ id: testId(), result: 'REJECTED', reasoning: 'suspicious activity' });
      mockSetAIVerification.mockResolvedValue(undefined);
      mockGetTransaction.mockResolvedValue({ ...tx, status: 'REJECTED' });

      const result = await processor.processUserWithdrawal(baseData);

      expect(mockUpdateStatus).toHaveBeenCalledWith(txId, 'REJECTED', 'ARIA_AGENT');
      expect(mockNotifySuperAdmin).toHaveBeenCalledWith(
        expect.stringContaining('REJECTED'),
        expect.any(String),
        'PAYMENT',
        'HIGH',
        'TRANSACTION',
        txId,
      );
      expect(result.status).toBe('REJECTED');
    });
  });

  // =================================================================
  // 2. processStaffPayroll
  // =================================================================
  describe('processStaffPayroll', () => {
    it('creates transaction and executes payment without AI verification', async () => {
      const txId = testId();
      const tx = { id: txId, amount: 5000, currency: 'JY', from_wallet_id: TREASURY_WALLET.id, to_wallet_id: 'staff-wallet', tx_type: 'STAFF_PAYROLL', description: 'Monthly payroll for Alice' };
      mockCreateTransaction.mockResolvedValue(tx);
      setupExecuteMocks(tx);

      const result = await processor.processStaffPayroll({
        staffWalletId: 'staff-wallet',
        staffName: 'Alice',
        amount: 5000,
        payrollId: 'pay-1',
      });

      expect(mockCreateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ tx_type: 'STAFF_PAYROLL', amount: 5000 }),
      );
      expect(mockVerifyUserWithdrawal).not.toHaveBeenCalled();
      expect(mockDebitWallet).toHaveBeenCalled();
      expect(mockCreditWallet).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  // =================================================================
  // 3. processEscrowRelease
  // =================================================================
  describe('processEscrowRelease', () => {
    it('throws when escrow not found', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));
      await expect(processor.processEscrowRelease('missing-id')).rejects.toThrow('not found');
    });

    it('throws when escrow status is not releasable', async () => {
      mockQueryFn.mockResolvedValue(queryResult([{ id: 'e1', status: 'RELEASED' }]));
      await expect(processor.processEscrowRelease('e1')).rejects.toThrow('not in releasable state');
    });

    it('releases escrow when AI verification passes', async () => {
      const escrowId = testId();
      const escrow = {
        id: escrowId,
        status: 'FUNDED',
        site_url: 'https://example.com',
        press_order_id: 'po-1',
        publisher_wallet_id: 'pub-w',
        recipient_wallet_id: 'rec-w',
        amount: '500',
        currency: 'JY',
      };
      mockQueryFn.mockResolvedValueOnce(queryResult([escrow]));
      mockVerifyPressPlacement.mockResolvedValue({ id: testId(), result: 'APPROVED' });

      const txId = testId();
      const tx = { id: txId, amount: 500, currency: 'JY', from_wallet_id: ESCROW_WALLET.id, to_wallet_id: 'rec-w', tx_type: 'PRESS_ESCROW_RELEASE', description: 'escrow release' };
      mockCreateTransaction.mockResolvedValue(tx);
      mockSetAIVerification.mockResolvedValue(undefined);
      setupExecuteMocks(tx);
      // DB update queries for escrow status
      mockQueryFn.mockResolvedValue(queryResult([]));

      const result = await processor.processEscrowRelease(escrowId);
      expect(mockVerifyPressPlacement).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws when AI verification rejects press placement', async () => {
      const escrowId = testId();
      const escrow = {
        id: escrowId,
        status: 'FUNDED',
        site_url: 'https://example.com',
        press_order_id: 'po-1',
        publisher_wallet_id: 'pub-w',
        recipient_wallet_id: 'rec-w',
        amount: '500',
      };
      mockQueryFn.mockResolvedValueOnce(queryResult([escrow]));
      mockVerifyPressPlacement.mockResolvedValue({ id: testId(), result: 'REJECTED', reasoning: 'placement not found' });
      mockQueryFn.mockResolvedValue(queryResult([]));

      await expect(processor.processEscrowRelease(escrowId)).rejects.toThrow('verification failed');
    });
  });

  // =================================================================
  // 4. processPartnershipPayment
  // =================================================================
  describe('processPartnershipPayment', () => {
    it('throws when partnership not found', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));
      await expect(processor.processPartnershipPayment('missing')).rejects.toThrow('not found');
    });

    it('throws when partnership status is not DOCS_SUBMITTED', async () => {
      mockQueryFn.mockResolvedValue(queryResult([{ id: 'p1', status: 'PENDING_DOCS' }]));
      await expect(processor.processPartnershipPayment('p1')).rejects.toThrow('not in correct state');
    });

    it('processes payment when documents are approved', async () => {
      const pid = testId();
      const partnership = {
        id: pid,
        status: 'DOCS_SUBMITTED',
        partner_name: 'Acme Corp',
        contract_doc_url: 'https://docs.example.com/contract.pdf',
        contract_doc_hash: 'abc123',
        contract_signed_date: '2024-01-01',
        contract_parties: ['Party A', 'Party B'],
        contract_amount: '10000',
        partner_wallet_id: 'partner-w',
        currency: 'JY',
      };
      mockQueryFn.mockResolvedValueOnce(queryResult([partnership]));
      mockVerifyPartnershipDocument.mockResolvedValue({ id: testId(), result: 'APPROVED' });
      mockQueryFn.mockResolvedValue(queryResult([]));

      const txId = testId();
      const tx = { id: txId, amount: 10000, currency: 'JY', from_wallet_id: TREASURY_WALLET.id, to_wallet_id: 'partner-w', tx_type: 'PARTNERSHIP_PAYMENT', description: 'partnership payment' };
      mockCreateTransaction.mockResolvedValue(tx);
      mockSetAIVerification.mockResolvedValue(undefined);
      setupExecuteMocks(tx);

      const result = await processor.processPartnershipPayment(pid);
      expect(mockVerifyPartnershipDocument).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('throws when partnership documents are rejected', async () => {
      const pid = testId();
      const partnership = {
        id: pid,
        status: 'DOCS_SUBMITTED',
        partner_name: 'Bad Corp',
        contract_doc_url: '',
        contract_doc_hash: '',
        contract_signed_date: '',
        contract_parties: [],
        contract_amount: '0',
      };
      mockQueryFn.mockResolvedValueOnce(queryResult([partnership]));
      mockVerifyPartnershipDocument.mockResolvedValue({ id: testId(), result: 'REJECTED', reasoning: 'docs missing' });
      mockQueryFn.mockResolvedValue(queryResult([]));

      await expect(processor.processPartnershipPayment(pid)).rejects.toThrow('verification failed');
    });
  });

  // =================================================================
  // 5. processBonusPayment
  // =================================================================
  describe('processBonusPayment', () => {
    it('processes approved bonus payment', async () => {
      const txId = testId();
      const tx = { id: txId, amount: 500, currency: 'JY', from_wallet_id: TREASURY_WALLET.id, to_wallet_id: 'rec-w', tx_type: 'BONUS_PAYMENT', description: 'Bonus: great work' };
      mockVerifyBonusPayment.mockResolvedValue({ id: testId(), result: 'APPROVED' });
      mockCreateTransaction.mockResolvedValue(tx);
      mockSetAIVerification.mockResolvedValue(undefined);
      setupExecuteMocks(tx);

      const result = await processor.processBonusPayment({
        recipientWalletId: 'rec-w',
        amount: 500,
        reason: 'great work this quarter',
        requestedBy: 'SUPER_ADMIN',
      });

      expect(result).toBeDefined();
      expect(mockVerifyBonusPayment).toHaveBeenCalled();
    });

    it('rejects bonus when AI verification fails', async () => {
      const txId = testId();
      const tx = { id: txId, amount: 500, currency: 'JY', tx_type: 'BONUS_PAYMENT', status: 'REJECTED' };
      mockVerifyBonusPayment.mockResolvedValue({ id: testId(), result: 'REJECTED', reasoning: 'unauthorized' });
      mockCreateTransaction.mockResolvedValue(tx);
      mockSetAIVerification.mockResolvedValue(undefined);
      mockUpdateStatus.mockResolvedValue(tx);
      mockGetTransaction.mockResolvedValue({ ...tx, status: 'REJECTED' });

      const result = await processor.processBonusPayment({
        recipientWalletId: 'rec-w',
        amount: 500,
        reason: 'great work this quarter',
        requestedBy: 'random-user',
      });

      expect(mockUpdateStatus).toHaveBeenCalledWith(txId, 'REJECTED', 'ARIA_AGENT');
      expect(result.status).toBe('REJECTED');
    });
  });

  // =================================================================
  // 6. receiveFunds
  // =================================================================
  describe('receiveFunds', () => {
    it('credits treasury, records journal entry, notifies admin', async () => {
      const txId = testId();
      const tx = { id: txId, amount: 1000, currency: 'JY', tx_type: 'TOKEN_DEPOSIT', description: 'incoming' };
      mockCreateTransaction.mockResolvedValue(tx);
      mockUpdateStatus.mockResolvedValue(tx);
      mockCreditWallet.mockResolvedValue({});
      mockCreateJournalEntry.mockResolvedValue({ id: testId() });
      mockSetJournalEntry.mockResolvedValue(undefined);
      mockGetTransaction.mockResolvedValue({ ...tx, status: 'COMPLETED' });

      const result = await processor.receiveFunds({
        fromWalletId: 'external-w',
        amount: 1000,
        currency: 'JY',
        txType: 'TOKEN_DEPOSIT',
        description: 'Incoming deposit',
      });

      expect(mockCreditWallet).toHaveBeenCalledWith(TREASURY_WALLET.id, 'balance_jy', 1000);
      expect(mockCreateJournalEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          lines: expect.arrayContaining([
            expect.objectContaining({ account_code: '100001', debit: 1000 }),
            expect.objectContaining({ account_code: '400001', credit: 1000 }),
          ]),
        }),
      );
      expect(mockNotifySuperAdmin).toHaveBeenCalled();
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'FUNDS_RECEIVED' }),
      );
      expect(result.status).toBe('COMPLETED');
    });

    it('uses correct balance field for USD currency', async () => {
      const txId = testId();
      const tx = { id: txId, amount: 50, currency: 'USD', tx_type: 'FIAT_PAYMENT', description: 'usd in' };
      mockCreateTransaction.mockResolvedValue(tx);
      mockUpdateStatus.mockResolvedValue(tx);
      mockCreditWallet.mockResolvedValue({});
      mockCreateJournalEntry.mockResolvedValue({ id: testId() });
      mockSetJournalEntry.mockResolvedValue(undefined);
      mockGetTransaction.mockResolvedValue({ ...tx, status: 'COMPLETED' });

      await processor.receiveFunds({
        fromWalletId: 'ext',
        amount: 50,
        currency: 'USD',
        txType: 'FIAT_PAYMENT',
        description: 'USD payment',
      });

      expect(mockCreditWallet).toHaveBeenCalledWith(TREASURY_WALLET.id, 'balance_usd', 50);
    });
  });

  // =================================================================
  // 7. executePayment (via processStaffPayroll — covers private method)
  // =================================================================
  describe('executePayment flow (via processStaffPayroll)', () => {
    it('marks transaction FAILED and notifies admin on error', async () => {
      const txId = testId();
      const tx = { id: txId, amount: 5000, currency: 'JY', from_wallet_id: TREASURY_WALLET.id, to_wallet_id: 'staff-w', tx_type: 'STAFF_PAYROLL', description: 'payroll' };
      mockCreateTransaction.mockResolvedValue(tx);
      mockGetTransaction.mockResolvedValue(tx);
      mockUpdateStatus.mockResolvedValue(tx);
      mockDebitWallet.mockRejectedValue(new Error('Insufficient balance'));

      await expect(
        processor.processStaffPayroll({
          staffWalletId: 'staff-w',
          staffName: 'Bob',
          amount: 5000,
          payrollId: 'pay-2',
        }),
      ).rejects.toThrow('Insufficient balance');

      expect(mockUpdateStatus).toHaveBeenCalledWith(txId, 'FAILED');
      expect(mockNotifySuperAdmin).toHaveBeenCalledWith(
        expect.stringContaining('FAILED'),
        expect.stringContaining('Insufficient balance'),
        'PAYMENT',
        'CRITICAL',
        'TRANSACTION',
        txId,
      );
      expect(mockAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({ action: expect.stringContaining('PAYMENT_FAILED') }),
      );
    });
  });
});
