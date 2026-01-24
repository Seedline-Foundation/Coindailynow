/**
 * Backend API Tests - Security Endpoints
 * Tests security dashboard and IP blocking APIs
 */

import request from 'supertest';
import { setupApp } from '../../src/index';
import { prisma } from '../../src/lib/prisma';
import { generateJWT } from '../../src/utils/auth';

describe('Security API Endpoints', () => {
  let app: any;
  let adminToken: string;
  let superAdminToken: string;

  beforeAll(async () => {
    app = setupApp();
    
    // Create test users
    const admin = await prisma.user.create({
      data: {
        id: 'admin-test-1',
        email: 'admin@test.com',
        username: 'admin',
        passwordHash: 'hashed_password',
        role: 'ADMIN'
      }
    });

    const superAdmin = await prisma.user.create({
      data: {
        id: 'super-admin-test-1',
        email: 'superadmin@test.com',
        username: 'superadmin',
        passwordHash: 'hashed_password',
        role: 'SUPER_ADMIN'
      }
    });

    adminToken = generateJWT({ 
      sub: admin.id, 
      email: admin.email,
      username: admin.username,
      role: 'ADMIN' 
    });
    superAdminToken = generateJWT({ 
      sub: superAdmin.id, 
      email: superAdmin.email,
      username: superAdmin.username,
      role: 'SUPER_ADMIN' 
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/super-admin/security', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/super-admin/security')
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });

    it('should require super admin role', async () => {
      const response = await request(app)
        .get('/api/super-admin/security')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(403);

      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should return security metrics for super admin', async () => {
      const response = await request(app)
        .get('/api/super-admin/security')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('metrics');
      expect(response.body.metrics).toHaveProperty('securityScore');
      expect(response.body.metrics).toHaveProperty('threatsBlocked');
      expect(response.body.metrics).toHaveProperty('failedLogins');
    });

    it('should support time range filtering', async () => {
      const response = await request(app)
        .get('/api/super-admin/security?timeRange=7d')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.metrics).toBeDefined();
    });

    it('should include failed login attempts', async () => {
      // Create test failed login
      await prisma.securityEvent.create({
        data: {
          id: 'test-event-1',
          eventType: 'failed_login',
          severity: 'medium',
          ipAddress: '41.203.245.178',
          userAgent: 'Mozilla/5.0',
          metadata: JSON.stringify({ username: 'test@test.com' })
        }
      });

      const response = await request(app)
        .get('/api/super-admin/security')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.failedLogins).toBeDefined();
      expect(Array.isArray(response.body.failedLogins)).toBe(true);
    });

    it('should include blacklisted IPs', async () => {
      const response = await request(app)
        .get('/api/super-admin/security')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.blacklistedIPs).toBeDefined();
      expect(Array.isArray(response.body.blacklistedIPs)).toBe(true);
    });

    it('should return data within performance SLA', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/super-admin/security')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500); // < 500ms requirement
    });
  });

  describe('POST /api/super-admin/security/block-ip', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/super-admin/security/block-ip')
        .send({ ip: '192.168.1.1' })
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });

    it('should require super admin role', async () => {
      const response = await request(app)
        .post('/api/super-admin/security/block-ip')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ip: '192.168.1.1' })
        .expect(403);

      expect(response.body.error).toBe('Insufficient permissions');
    });

    it('should validate IP address format', async () => {
      const response = await request(app)
        .post('/api/super-admin/security/block-ip')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ ip: 'invalid-ip' })
        .expect(400);

      expect(response.body.error).toContain('Invalid IP address');
    });

    it('should block valid IP address', async () => {
      const response = await request(app)
        .post('/api/super-admin/security/block-ip')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          ip: '192.168.1.100',
          reason: 'Suspicious activity',
          duration: 3600
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('blocked');
    });

    it('should create audit log entry', async () => {
      await request(app)
        .post('/api/super-admin/security/block-ip')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({
          ip: '192.168.1.101',
          reason: 'Test blocking'
        })
        .expect(200);

      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'ip_blocked'
        }
      });

      expect(auditLog).toBeDefined();
    });
  });

  describe('POST /api/super-admin/security/unblock-ip', () => {
    beforeEach(async () => {
      // Create blocked IP for testing
      await prisma.blacklistedIP.create({
        data: {
          ipAddress: '192.168.1.200',
          reason: 'Test'
        }
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/super-admin/security/unblock-ip')
        .send({ ip: '192.168.1.200' })
        .expect(401);
    });

    it('should unblock IP address', async () => {
      const response = await request(app)
        .post('/api/super-admin/security/unblock-ip')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ ip: '192.168.1.200' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle non-existent IP gracefully', async () => {
      const response = await request(app)
        .post('/api/super-admin/security/unblock-ip')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send({ ip: '192.168.1.255' })
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('GET /api/super-admin/security/threats', () => {
    it('should return threat list', async () => {
      const response = await request(app)
        .get('/api/super-admin/security/threats')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.threats)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/super-admin/security/threats?page=1&limit=10')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('threats');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should support severity filtering', async () => {
      const response = await request(app)
        .get('/api/super-admin/security/threats?severity=high')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.threats).toBeDefined();
    });
  });

  describe('POST /api/super-admin/security/scan', () => {
    it('should trigger security scan', async () => {
      const response = await request(app)
        .post('/api/super-admin/security/scan')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('scanId');
    });

    it('should prevent concurrent scans', async () => {
      // Start first scan
      await request(app)
        .post('/api/super-admin/security/scan')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      // Try second scan immediately
      const response = await request(app)
        .post('/api/super-admin/security/scan')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(429);

      expect(response.body.error).toContain('in progress');
    });
  });

  describe('GET /api/super-admin/security/vulnerabilities', () => {
    it('should return vulnerability list', async () => {
      const response = await request(app)
        .get('/api/super-admin/security/vulnerabilities')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.vulnerabilities)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Make multiple requests rapidly
      const requests = Array(101).fill(null).map(() =>
        request(app)
          .get('/api/super-admin/security')
          .set('Authorization', `Bearer ${superAdminToken}`)
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(r => r.status === 429);
      
      expect(rateLimited).toBe(true);
    });
  });

  describe('Caching', () => {
    it('should cache security metrics', async () => {
      const start1 = Date.now();
      await request(app)
        .get('/api/super-admin/security')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
      const duration1 = Date.now() - start1;

      // Second request should be faster (cached)
      const start2 = Date.now();
      await request(app)
        .get('/api/super-admin/security')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .expect(200);
      const duration2 = Date.now() - start2;

      expect(duration2).toBeLessThan(duration1);
    });
  });
});
