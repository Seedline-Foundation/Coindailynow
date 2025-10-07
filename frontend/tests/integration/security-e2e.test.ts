/**
 * Integration Tests - End-to-End Security Workflows
 * Tests complete user journeys through security features
 */

import { test, expect } from '@playwright/test';

test.describe('Security & Compliance - E2E Tests', () => {
  let page: any;
  
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.describe('Security Dashboard Workflow', () => {
    test('should complete threat detection and blocking workflow', async () => {
      // Step 1: Login as Super Admin
      await page.goto('/login');
      await page.fill('[name="email"]', 'superadmin@coindaily.com');
      await page.fill('[name="password"]', 'SecureP@ss123');
      await page.click('button[type="submit"]');
      
      // Verify login success
      await expect(page).toHaveURL('/super-admin/dashboard');
      
      // Step 2: Navigate to Security Dashboard
      await page.click('text=Security');
      await expect(page).toHaveURL('/super-admin/security');
      
      // Step 3: Verify security metrics loaded
      await expect(page.locator('text=Security Score')).toBeVisible();
      await expect(page.locator('text=Threats Blocked')).toBeVisible();
      
      // Step 4: View failed login attempts
      await page.click('text=Threats');
      await expect(page.locator('text=Failed Login Attempts')).toBeVisible();
      
      // Step 5: Block suspicious IP
      const firstIP = page.locator('[data-testid="ip-address"]').first();
      const ipAddress = await firstIP.textContent();
      
      await page.click('[data-testid="block-ip-button"]');
      await page.fill('[name="reason"]', 'Suspicious activity detected');
      await page.click('button:has-text("Confirm Block")');
      
      // Verify success notification
      await expect(page.locator('text=IP address blocked successfully')).toBeVisible();
      
      // Step 6: Verify IP appears in blacklist
      await page.click('text=Blacklist');
      await expect(page.locator(`text=${ipAddress}`)).toBeVisible();
      
      // Step 7: Check audit log entry created
      await page.goto('/super-admin/audit');
      await expect(page.locator('text=IP Blocked')).toBeVisible();
      await expect(page.locator(`text=${ipAddress}`)).toBeVisible();
    });

    test('should handle security scan workflow', async () => {
      await page.goto('/super-admin/security');
      
      // Trigger security scan
      await page.click('button:has-text("Run Full Scan")');
      
      // Verify scan started
      await expect(page.locator('text=Security scan in progress')).toBeVisible();
      
      // Wait for scan completion (with timeout)
      await expect(page.locator('text=Scan completed')).toBeVisible({ timeout: 30000 });
      
      // Verify vulnerabilities tab updated
      await page.click('text=Vulnerabilities');
      await expect(page.locator('[data-testid="vulnerability-count"]')).toBeVisible();
    });

    test('should export security report', async () => {
      await page.goto('/super-admin/security');
      
      // Setup download listener
      const downloadPromise = page.waitForEvent('download');
      
      // Click export button
      await page.click('button:has-text("Export Report")');
      
      // Verify download started
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('security-report');
      expect(download.suggestedFilename()).toContain('.pdf');
    });
  });

  test.describe('Audit System Workflow', () => {
    test('should filter and export audit logs', async () => {
      await page.goto('/super-admin/audit');
      
      // Step 1: Apply filters
      await page.selectOption('[name="category"]', 'authentication');
      await page.selectOption('[name="result"]', 'success');
      await page.selectOption('[name="timeRange"]', '24h');
      
      // Verify filtered results
      await expect(page.locator('[data-testid="audit-log-entry"]')).toHaveCount(10, { timeout: 5000 });
      
      // Step 2: Search within results
      await page.fill('[name="search"]', 'login');
      await expect(page.locator('text=User Login')).toBeVisible();
      
      // Step 3: View log details
      await page.click('[data-testid="audit-log-entry"]').first();
      await expect(page.locator('[data-testid="log-details-modal"]')).toBeVisible();
      await expect(page.locator('text=IP Address')).toBeVisible();
      await expect(page.locator('text=User Agent')).toBeVisible();
      
      // Step 4: Export filtered logs
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Export CSV")');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('audit-logs');
      expect(download.suggestedFilename()).toContain('.csv');
    });

    test('should view analytics dashboard', async () => {
      await page.goto('/super-admin/audit');
      
      // Navigate to analytics tab
      await page.click('text=Analytics');
      
      // Verify charts loaded
      await expect(page.locator('[data-testid="events-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="top-actions-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="top-users-chart"]')).toBeVisible();
      
      // Verify metrics
      await expect(page.locator('text=Total Events')).toBeVisible();
      await expect(page.locator('text=Success Rate')).toBeVisible();
      await expect(page.locator('text=Unique Users')).toBeVisible();
    });

    test('should generate compliance reports', async () => {
      await page.goto('/super-admin/audit');
      
      // Navigate to reports tab
      await page.click('text=Reports');
      
      // Generate GDPR report
      await page.click('button:has-text("Generate GDPR Report")');
      
      // Verify report generation modal
      await expect(page.locator('[data-testid="report-modal"]')).toBeVisible();
      
      // Select date range
      await page.fill('[name="startDate"]', '2025-10-01');
      await page.fill('[name="endDate"]', '2025-10-06');
      
      // Generate report
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Generate")');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('gdpr-report');
    });
  });

  test.describe('Accessibility Tools Workflow', () => {
    test('should run accessibility scan and fix issues', async () => {
      await page.goto('/super-admin/accessibility');
      
      // Step 1: Run full scan
      await page.click('button:has-text("Run Full Scan")');
      
      // Wait for scan completion
      await expect(page.locator('text=Scan completed')).toBeVisible({ timeout: 30000 });
      
      // Step 2: Verify WCAG score
      const score = await page.locator('[data-testid="wcag-score"]').textContent();
      expect(parseInt(score!)).toBeGreaterThan(0);
      
      // Step 3: View critical issues
      await expect(page.locator('[data-testid="critical-issues"]')).toBeVisible();
      
      // Step 4: Fix contrast issue
      await page.click('text=Contrast');
      await page.click('[data-testid="contrast-issue"]').first();
      
      // View suggested fix
      await expect(page.locator('[data-testid="suggestion"]')).toBeVisible();
      
      // Apply fix
      await page.click('button:has-text("Apply Fix")');
      
      // Verify fix applied
      await expect(page.locator('text=Fix applied successfully')).toBeVisible();
      
      // Step 5: Re-scan to verify improvement
      await page.click('button:has-text("Run Full Scan")');
      await expect(page.locator('text=Scan completed')).toBeVisible({ timeout: 30000 });
      
      const newScore = await page.locator('[data-testid="wcag-score"]').textContent();
      expect(parseInt(newScore!)).toBeGreaterThanOrEqual(parseInt(score!));
    });

    test('should validate ARIA attributes', async () => {
      await page.goto('/super-admin/accessibility');
      
      // Navigate to ARIA tab
      await page.click('text=ARIA');
      
      // View ARIA issues
      await expect(page.locator('[data-testid="aria-issues"]')).toBeVisible();
      
      // Check issue details
      const issue = page.locator('[data-testid="aria-issue"]').first();
      await issue.click();
      
      await expect(page.locator('text=Missing ARIA label')).toBeVisible();
      await expect(page.locator('text=Add aria-label attribute')).toBeVisible();
    });

    test('should generate accessibility report', async () => {
      await page.goto('/super-admin/accessibility');
      
      // Generate report
      const downloadPromise = page.waitForEvent('download');
      await page.click('button:has-text("Generate Report")');
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('accessibility-report');
      expect(download.suggestedFilename()).toContain('.pdf');
    });
  });

  test.describe('Rate Limiting Workflow', () => {
    test('should create and manage rate limit rules', async () => {
      await page.goto('/super-admin/rate-limiting');
      
      // Step 1: Create new rule
      await page.click('button:has-text("Create Rule")');
      
      // Fill rule details
      await page.fill('[name="name"]', 'Test API Limit');
      await page.fill('[name="endpoint"]', '/api/test/*');
      await page.fill('[name="limit"]', '50');
      await page.selectOption('[name="window"]', '1m');
      await page.selectOption('[name="action"]', 'block');
      
      // Save rule
      await page.click('button:has-text("Save Rule")');
      
      // Verify rule created
      await expect(page.locator('text=Test API Limit')).toBeVisible();
      
      // Step 2: Edit rule
      await page.click('[data-testid="edit-rule-button"]');
      await page.fill('[name="limit"]', '100');
      await page.click('button:has-text("Update Rule")');
      
      // Verify update
      await expect(page.locator('text=100')).toBeVisible();
      
      // Step 3: Disable rule
      await page.click('[data-testid="toggle-rule"]');
      await expect(page.locator('text=Disabled')).toBeVisible();
      
      // Step 4: Delete rule
      await page.click('[data-testid="delete-rule-button"]');
      await page.click('button:has-text("Confirm Delete")');
      
      // Verify deletion
      await expect(page.locator('text=Test API Limit')).not.toBeVisible();
    });

    test('should manage IP whitelist', async () => {
      await page.goto('/super-admin/rate-limiting');
      
      // Navigate to whitelist tab
      await page.click('text=Whitelist');
      
      // Add IP to whitelist
      await page.click('button:has-text("Add IP")');
      await page.fill('[name="ip"]', '192.168.1.100');
      await page.fill('[name="reason"]', 'Internal testing server');
      await page.click('button:has-text("Add to Whitelist")');
      
      // Verify IP added
      await expect(page.locator('text=192.168.1.100')).toBeVisible();
      
      // Remove from whitelist
      await page.click('[data-testid="remove-whitelist"]');
      await page.click('button:has-text("Confirm")');
      
      await expect(page.locator('text=192.168.1.100')).not.toBeVisible();
    });

    test('should view traffic patterns', async () => {
      await page.goto('/super-admin/rate-limiting');
      
      // Navigate to traffic tab
      await page.click('text=Traffic');
      
      // Verify charts
      await expect(page.locator('[data-testid="hourly-traffic-chart"]')).toBeVisible();
      await expect(page.locator('[data-testid="endpoint-stats"]')).toBeVisible();
      await expect(page.locator('[data-testid="country-traffic"]')).toBeVisible();
      
      // Change time range
      await page.click('text=Last 7 Days');
      
      // Verify chart updated
      await expect(page.locator('[data-testid="hourly-traffic-chart"]')).toBeVisible();
    });

    test('should monitor DDoS protection', async () => {
      await page.goto('/super-admin/rate-limiting');
      
      // Navigate to DDoS tab
      await page.click('text=DDoS');
      
      // Verify metrics
      await expect(page.locator('text=Threat Level')).toBeVisible();
      await expect(page.locator('text=Suspicious Traffic')).toBeVisible();
      await expect(page.locator('text=Mitigated Attacks')).toBeVisible();
      
      // Check threat level color coding
      const threatLevel = await page.locator('[data-testid="threat-level"]');
      const classList = await threatLevel.getAttribute('class');
      expect(classList).toMatch(/text-(green|yellow|red)-600/);
    });
  });

  test.describe('Cross-Feature Integration', () => {
    test('should trace action through multiple systems', async () => {
      // Step 1: Block IP in Security Dashboard
      await page.goto('/super-admin/security');
      await page.click('text=Blacklist');
      await page.click('button:has-text("Block IP")');
      await page.fill('[name="ip"]', '203.0.113.100');
      await page.fill('[name="reason"]', 'Integration test');
      await page.click('button:has-text("Confirm")');
      
      // Step 2: Verify audit log entry
      await page.goto('/super-admin/audit');
      await page.fill('[name="search"]', '203.0.113.100');
      await expect(page.locator('text=IP Blocked')).toBeVisible();
      
      // Step 3: Verify rate limiting shows blocked IP
      await page.goto('/super-admin/rate-limiting');
      await page.click('text=Blocked IPs');
      await expect(page.locator('text=203.0.113.100')).toBeVisible();
      
      // Step 4: Unblock and verify cascade
      await page.click('[data-testid="unblock-button"]');
      await page.click('button:has-text("Confirm")');
      
      // Verify audit log updated
      await page.goto('/super-admin/audit');
      await expect(page.locator('text=IP Unblocked')).toBeVisible();
    });

    test('should maintain data consistency across refreshes', async () => {
      // Create audit event
      await page.goto('/super-admin/security');
      await page.click('button:has-text("Run Full Scan")');
      
      // Refresh page
      await page.reload();
      
      // Verify scan status persisted
      await expect(page.locator('text=Last Scan')).toBeVisible();
      
      // Check audit log
      await page.goto('/super-admin/audit');
      await expect(page.locator('text=Security Scan')).toBeVisible();
    });
  });

  test.describe('Performance Tests', () => {
    test('should load dashboard within SLA', async () => {
      const start = Date.now();
      
      await page.goto('/super-admin/security');
      await expect(page.locator('text=Security Score')).toBeVisible();
      
      const loadTime = Date.now() - start;
      expect(loadTime).toBeLessThan(2000); // 2 second page load requirement
    });

    test('should handle rapid navigation', async () => {
      // Navigate quickly between features
      await page.goto('/super-admin/security');
      await page.goto('/super-admin/audit');
      await page.goto('/super-admin/accessibility');
      await page.goto('/super-admin/rate-limiting');
      
      // Verify final page loaded correctly
      await expect(page.locator('text=Rate Limiting')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      // Intercept API to return error
      await page.route('**/api/super-admin/security', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      await page.goto('/super-admin/security');
      
      // Verify error message displayed
      await expect(page.locator('text=Failed to load security data')).toBeVisible();
      
      // Verify retry button present
      await expect(page.locator('button:has-text("Retry")')).toBeVisible();
    });

    test('should handle network timeout', async () => {
      // Simulate slow network
      await page.route('**/api/super-admin/security', route => {
        setTimeout(() => route.continue(), 5000);
      });
      
      await page.goto('/super-admin/security');
      
      // Verify loading state
      await expect(page.locator('text=Loading')).toBeVisible();
    });
  });
});
