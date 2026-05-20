import { mockQueryFn, resetDbMocks, queryResult, testId } from './setup';

import { AuditService } from '../src/services/AuditService';

describe('AuditService', () => {
  let audit: AuditService;

  beforeEach(() => {
    resetDbMocks();
    jest.clearAllMocks();
    audit = new AuditService();
  });

  // =================================================================
  // log
  // =================================================================
  describe('log', () => {
    it('inserts an audit log entry with all fields', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));

      await audit.log({
        action: 'PAYMENT_COMPLETED',
        actor: 'SYSTEM',
        entity_type: 'TRANSACTION',
        entity_id: 'tx-1',
        old_value: { status: 'PROCESSING' },
        new_value: { status: 'COMPLETED' },
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
      });

      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_log'),
        expect.arrayContaining([
          expect.any(String),       // id
          'PAYMENT_COMPLETED',
          'SYSTEM',
          'TRANSACTION',
          'tx-1',
          JSON.stringify({ status: 'PROCESSING' }),
          JSON.stringify({ status: 'COMPLETED' }),
          '192.168.1.1',
          'Mozilla/5.0',
        ]),
      );
    });

    it('inserts with null for optional fields when not provided', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));

      await audit.log({
        action: 'USER_LOGIN',
        actor: 'admin@test.com',
      });

      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO audit_log'),
        expect.arrayContaining([
          expect.any(String),
          'USER_LOGIN',
          'admin@test.com',
          null, // entity_type
          null, // entity_id
          null, // old_value
          null, // new_value
          null, // ip_address
          null, // user_agent
        ]),
      );
    });

    it('serialises old_value and new_value as JSON', async () => {
      mockQueryFn.mockResolvedValue(queryResult([]));

      const complexValue = { nested: { deep: true }, arr: [1, 2, 3] };
      await audit.log({
        action: 'CONFIG_CHANGE',
        actor: 'SUPER_ADMIN',
        new_value: complexValue,
      });

      const callArgs = mockQueryFn.mock.calls[0][1];
      expect(callArgs[6]).toBe(JSON.stringify(complexValue));
    });
  });

  // =================================================================
  // getAuditTrail
  // =================================================================
  describe('getAuditTrail', () => {
    it('returns paginated audit entries with total count', async () => {
      const entries = [
        { id: testId(), action: 'PAYMENT_COMPLETED', actor: 'SYSTEM', created_at: new Date() },
        { id: testId(), action: 'USER_LOGIN', actor: 'admin@test.com', created_at: new Date() },
      ];
      mockQueryFn
        .mockResolvedValueOnce(queryResult([{ count: '10' }]))
        .mockResolvedValueOnce(queryResult(entries));

      const result = await audit.getAuditTrail();
      expect(result.total).toBe(10);
      expect(result.entries).toHaveLength(2);
    });

    it('applies entity_type filter', async () => {
      mockQueryFn
        .mockResolvedValueOnce(queryResult([{ count: '3' }]))
        .mockResolvedValueOnce(queryResult([]));

      await audit.getAuditTrail({ entity_type: 'TRANSACTION' });
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('entity_type'),
        expect.arrayContaining(['TRANSACTION']),
      );
    });

    it('applies actor filter', async () => {
      mockQueryFn
        .mockResolvedValueOnce(queryResult([{ count: '1' }]))
        .mockResolvedValueOnce(queryResult([]));

      await audit.getAuditTrail({ actor: 'SYSTEM' });
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('actor'),
        expect.arrayContaining(['SYSTEM']),
      );
    });

    it('applies action filter', async () => {
      mockQueryFn
        .mockResolvedValueOnce(queryResult([{ count: '2' }]))
        .mockResolvedValueOnce(queryResult([]));

      await audit.getAuditTrail({ action: 'PAYMENT_COMPLETED' });
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('action'),
        expect.arrayContaining(['PAYMENT_COMPLETED']),
      );
    });

    it('applies date range filters', async () => {
      mockQueryFn
        .mockResolvedValueOnce(queryResult([{ count: '5' }]))
        .mockResolvedValueOnce(queryResult([]));

      await audit.getAuditTrail({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      });

      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('created_at >='),
        expect.arrayContaining(['2024-01-01', '2024-12-31']),
      );
    });

    it('applies entity_id filter', async () => {
      mockQueryFn
        .mockResolvedValueOnce(queryResult([{ count: '1' }]))
        .mockResolvedValueOnce(queryResult([]));

      await audit.getAuditTrail({ entity_id: 'tx-1' });
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('entity_id'),
        expect.arrayContaining(['tx-1']),
      );
    });

    it('respects custom limit and offset', async () => {
      mockQueryFn
        .mockResolvedValueOnce(queryResult([{ count: '50' }]))
        .mockResolvedValueOnce(queryResult([]));

      await audit.getAuditTrail({ limit: 10, offset: 20 });
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([10, 20]),
      );
    });

    it('defaults to limit 100 offset 0', async () => {
      mockQueryFn
        .mockResolvedValueOnce(queryResult([{ count: '0' }]))
        .mockResolvedValueOnce(queryResult([]));

      await audit.getAuditTrail({});
      expect(mockQueryFn).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining([100, 0]),
      );
    });

    it('combines multiple filters', async () => {
      mockQueryFn
        .mockResolvedValueOnce(queryResult([{ count: '1' }]))
        .mockResolvedValueOnce(queryResult([]));

      await audit.getAuditTrail({
        entity_type: 'TRANSACTION',
        actor: 'SYSTEM',
        action: 'FUNDS_RECEIVED',
        limit: 5,
      });

      const query = mockQueryFn.mock.calls[0][0];
      expect(query).toContain('entity_type');
      expect(query).toContain('actor');
      expect(query).toContain('action');
    });
  });
});
