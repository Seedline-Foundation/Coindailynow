import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import statisticsHandler from '../../../src/pages/api/knowledge-api/admin/statistics';
import keysHandler from '../../../src/pages/api/knowledge-api/admin/keys';
import feedsHandler from '../../../src/pages/api/knowledge-api/admin/feeds';

// Mock global fetch
const originalFetch = global.fetch;

describe('Knowledge API Admin Proxies', () => {
  let mockFetch: any;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    (console.error as any).mockRestore();
  });

  describe('GET /api/knowledge-api/admin/statistics', () => {
    it('should return 405 if method is not GET', async () => {
      const req: any = { method: 'POST' };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await statisticsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('should forward Authorization header to backend and return data', async () => {
      const mockResponseData = { success: true, stats: { totalKeys: 5 } };
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => mockResponseData,
      });

      const req: any = {
        method: 'GET',
        headers: {
          authorization: 'Bearer admin-token',
        },
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await statisticsHandler(req, res);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/knowledge-api/admin/statistics'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-token',
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponseData);
    });

    it('should handle error and return 500 status', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const req: any = {
        method: 'GET',
        headers: {},
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await statisticsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error',
        message: 'Failed to fetch API statistics',
      });
    });
  });

  describe('POST /api/knowledge-api/admin/keys', () => {
    it('should return 405 if method is not POST', async () => {
      const req: any = { method: 'GET' };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await keysHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('should forward Authorization header and body to backend', async () => {
      const mockResponseData = { message: 'API key created successfully' };
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => mockResponseData,
      });

      const req: any = {
        method: 'POST',
        headers: {
          authorization: 'Bearer admin-token',
        },
        body: { name: 'New Key' },
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await keysHandler(req, res);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/knowledge-api/admin/keys'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-token',
          }),
          body: JSON.stringify({ name: 'New Key' }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponseData);
    });
  });

  describe('GET /api/knowledge-api/admin/feeds', () => {
    it('should return 405 if method is not GET', async () => {
      const req: any = { method: 'POST' };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await feedsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.json).toHaveBeenCalledWith({ error: 'Method not allowed' });
    });

    it('should forward Authorization header to backend and return feeds list', async () => {
      const mockResponseData = { feeds: [] };
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => mockResponseData,
      });

      const req: any = {
        method: 'GET',
        headers: {
          authorization: 'Bearer admin-token',
        },
      };
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await feedsHandler(req, res);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/knowledge-api/admin/feeds'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer admin-token',
          }),
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponseData);
    });
  });
});
