import { mockQueryFn, resetDbMocks, queryResult, testId } from './setup';

import { TransactionService } from '../src/services/TransactionService';

describe('TransactionService', () => {
  let svc: TransactionService;

  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
    svc = new TransactionService();
  });

  // =================================================================
  // createTransaction
  // =================================================================
  describe('createTransaction', () => {
    it('inserts a PENDING transaction with all fields', async () => {
      const tx = {
        id: testId(),
        tx_type: 'TOKEN_WITHDRAWAL',
        status: 'PENDING',
        from_wallet_id: 'w-from',
        to_wallet_id: 'w-to',
        amount: 100,
        currency: 'JY',
        fee: 0,
        description: 'test withdrawal',
        requested_by: 'USER:u1',
        metadata: {},
      };
      mockQueryFn.mockResolvedValue(queryResult([tx]));

      const result = await svc.createTransaction({
        tx_type: 'TOKEN_WITHDRAWAL',
        from_wallet_id: 'w-from',
        to_wallet_id: 'w-to',
        amount: 100,
        description: 'test withdrawal',
        requested_by: 'USER:u1',
      });

      expect(result.tx_type).toBe('TOKEN_WITHDRAWAL');
      expect(result.status).toBe('PENDING');
      expect(result.amount).toBe(100);
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO transactions'),
        expect.arrayContaining([100]),
      );
    });

    it('defaults currency to JY and fee to 0', async () => {
      mockQueryFn.mockResolvedValue(queryResult([{ id: testId(), currency: 'JY', fee: 0 }]));

      const result = await svc.createTransaction({
        tx_type: 'BONUS_PAYMENT',
        amount: 50,
      });

      expect(result.currency).toBe('JY');
      expect(result.fee).toBe(0);
    });
  });

  // =================================================================
  // updateStatus
  // =================================================================
  describe('updateStatus', () => {
    it('updates status and sets completed_at for COMPLETED', async () => {
      const tx = { id: 'tx-1', status: 'COMPLETED', completed_at: new Date() };
      mockQueryFn.mockResolvedValue(queryResult([tx]));

      const result = await svc.updateStatus('tx-1', 'COMPLETED', 'SYSTEM');
      expect(result.status).toBe('COMPLETED');
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('completed_at = NOW()'),
        expect.any(Array),
      );
    });

    it('sets approved_by when provided', async () => {
      mockQueryFn.mockResolvedValue(queryResult([{ id: 'tx-1', status: 'APPROVED' }]));

      await svc.updateStatus('tx-1', 'APPROVED', 'SUPER_ADMIN');
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('approved_by'),
        expect.arrayContaining(['APPROVED', 'SUPER_ADMIN', 'tx-1']),
      );
    });

    it('throws when transaction not found', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));
      await expect(svc.updateStatus('missing', 'COMPLETED')).rejects.toThrow('not found');
    });
  });

  // =================================================================
  // setTxHash, setAIVerification, setJournalEntry
  // =================================================================
  describe('metadata setters', () => {
    it('setTxHash updates tx_hash', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));
      await svc.setTxHash('tx-1', '0xabc');
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('tx_hash'),
        ['0xabc', 'tx-1'],
      );
    });

    it('setAIVerification updates ai_verification_id', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));
      await svc.setAIVerification('tx-1', 'v-1');
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('ai_verification_id'),
        ['v-1', 'tx-1'],
      );
    });

    it('setJournalEntry updates journal_entry_id', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));
      await svc.setJournalEntry('tx-1', 'je-1');
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('journal_entry_id'),
        ['je-1', 'tx-1'],
      );
    });
  });

  // =================================================================
  // getTransaction
  // =================================================================
  describe('getTransaction', () => {
    it('returns the transaction when found', async () => {
      const tx = { id: 'tx-1', tx_type: 'BONUS_PAYMENT', amount: 100 };
      mockQueryFn.mockResolvedValue(queryResult([tx]));
      const result = await svc.getTransaction('tx-1');
      expect(result).toEqual(tx);
    });

    it('returns null when not found', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));
      const result = await svc.getTransaction('missing');
      expect(result).toBeNull();
    });
  });

  // =================================================================
  // listTransactions
  // =================================================================
  describe('listTransactions', () => {
    it('returns transactions with total count', async () => {
      const txs = [{ id: 'tx-1' }, { id: 'tx-2' }];
      mockQueryFn
        .mockResolvedValueOnce(queryResult([{ count: '5' }]))
        .mockResolvedValueOnce(queryResult(txs));

      const result = await svc.listTransactions({ limit: 2, offset: 0 });
      expect(result.total).toBe(5);
      expect(result.transactions).toHaveLength(2);
    });

    it('applies type filter', async () => {
      mockQueryFn
        .mockResolvedValueOnce(queryResult([{ count: '1' }]))
        .mockResolvedValueOnce(queryResult([{ id: 'tx-1', tx_type: 'STAFF_PAYROLL' }]));

      const result = await svc.listTransactions({ tx_type: 'STAFF_PAYROLL' });
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('tx_type'),
        expect.arrayContaining(['STAFF_PAYROLL']),
      );
      expect(result.transactions[0].tx_type).toBe('STAFF_PAYROLL');
    });

    it('applies status filter', async () => {
      mockQueryFn
        .mockResolvedValueOnce(queryResult([{ count: '3' }]))
        .mockResolvedValueOnce(queryResult([]));

      await svc.listTransactions({ status: 'COMPLETED' });
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('status'),
        expect.arrayContaining(['COMPLETED']),
      );
    });

    it('applies wallet filters', async () => {
      mockQueryFn
        .mockResolvedValueOnce(queryResult([{ count: '1' }]))
        .mockResolvedValueOnce(queryResult([]));

      await svc.listTransactions({ from_wallet_id: 'w-1', to_wallet_id: 'w-2' });
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('from_wallet_id'),
        expect.arrayContaining(['w-1', 'w-2']),
      );
    });

    it('defaults to limit 50 offset 0', async () => {
      mockQueryFn
        .mockResolvedValueOnce(queryResult([{ count: '0' }]))
        .mockResolvedValueOnce(queryResult([]));

      await svc.listTransactions();
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([50, 0]),
      );
    });
  });

  // =================================================================
  // getTransactionsByWallet
  // =================================================================
  describe('getTransactionsByWallet', () => {
    it('returns transactions for a wallet', async () => {
      mockQueryFn.mockResolvedValue(queryResult([{ id: 'tx-1' }, { id: 'tx-2' }]));
      const result = await svc.getTransactionsByWallet('w-1');
      expect(result).toHaveLength(2);
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('from_wallet_id = $1 OR to_wallet_id = $1'),
        ['w-1', 50],
      );
    });

    it('respects custom limit', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));
      await svc.getTransactionsByWallet('w-1', 10);
      expect(mockQueryFn).toHaveBeenCalledWith(expect.any(String), ['w-1', 10]);
    });
  });

  // =================================================================
  // getPendingTransactions
  // =================================================================
  describe('getPendingTransactions', () => {
    it('returns transactions in actionable statuses', async () => {
      const pending = [
        { id: 'tx-1', status: 'PENDING' },
        { id: 'tx-2', status: 'AI_REVIEW' },
        { id: 'tx-3', status: 'PROCESSING' },
      ];
      mockQueryFn.mockResolvedValue(queryResult(pending));

      const result = await svc.getPendingTransactions();
      expect(result).toHaveLength(3);
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining("'PENDING','AI_REVIEW','APPROVED','PROCESSING'"),
      );
    });
  });
});
