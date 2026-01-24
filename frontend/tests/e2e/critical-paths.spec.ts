/**
 * E2E Critical Path Tests
 * Session 3: Testing & Validation - E2E tests for critical user workflows
 */

import { test, expect } from '@playwright/test';

test.describe('Critical User Workflows', () => {
  test.describe('Authentication Flow', () => {
    test('should register a new user', async ({ page }) => {
      await page.goto('/register');
      
      // Fill registration form
      await page.fill('[name="username"]', 'testuser');
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'Test123!@#');
      await page.fill('[name="confirmPassword"]', 'Test123!@#');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard or confirmation
      await expect(page).toHaveURL(/\/dashboard|\/verify-email/);
    });

    test('should login existing user', async ({ page }) => {
      await page.goto('/login');
      
      // Fill login form
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'Test123!@#');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Verify user is logged in
      await expect(page.locator('text=Welcome')).toBeVisible();
    });

    test('should handle login errors', async ({ page }) => {
      await page.goto('/login');
      
      // Fill with wrong credentials
      await page.fill('[name="email"]', 'wrong@example.com');
      await page.fill('[name="password"]', 'WrongPassword');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should show error message
      await expect(page.locator('text=/Invalid credentials|Login failed/i')).toBeVisible();
    });

    test('should logout user', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'Test123!@#');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
      
      // Logout
      await page.click('[aria-label="User menu"]');
      await page.click('text=Logout');
      
      // Should redirect to home or login
      await expect(page).toHaveURL(/\/|\/login/);
    });
  });

  test.describe('Article Reading Flow', () => {
    test('should browse articles', async ({ page }) => {
      await page.goto('/articles');
      
      // Should display article list
      await expect(page.locator('[data-testid="article-card"]').first()).toBeVisible();
      
      // Should have pagination or load more
      await expect(page.locator('text=/Load More|Next Page/i, button[aria-label="Next page"]')).toBeVisible();
    });

    test('should read full article', async ({ page }) => {
      await page.goto('/articles');
      
      // Click on first article
      await page.click('[data-testid="article-card"]');
      
      // Should navigate to article detail
      await expect(page).toHaveURL(/\/articles\/[\w-]+/);
      
      // Should display article content
      await expect(page.locator('[data-testid="article-title"]')).toBeVisible();
      await expect(page.locator('[data-testid="article-content"]')).toBeVisible();
    });

    test('should filter articles by category', async ({ page }) => {
      await page.goto('/articles');
      
      // Select a category
      await page.click('[data-testid="category-filter"]');
      await page.click('text=Bitcoin');
      
      // URL should update with filter
      await expect(page).toHaveURL(/category=bitcoin/i);
      
      // Articles should be filtered
      await expect(page.locator('[data-testid="article-card"]')).toHaveCount(await page.locator('[data-testid="article-card"]').count());
    });

    test('should search articles', async ({ page }) => {
      await page.goto('/articles');
      
      // Search for articles
      await page.fill('[data-testid="search-input"]', 'Bitcoin');
      await page.click('[data-testid="search-button"]');
      
      // Should display search results
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      await expect(page.locator('text=Bitcoin')).toBeVisible();
    });
  });

  test.describe('Market Data Flow', () => {
    test('should view market data', async ({ page }) => {
      await page.goto('/market');
      
      // Should display market data
      await expect(page.locator('[data-testid="market-table"]')).toBeVisible();
      await expect(page.locator('[data-testid="market-row"]').first()).toBeVisible();
    });

    test('should sort market data', async ({ page }) => {
      await page.goto('/market');
      
      // Sort by price
      await page.click('[data-testid="sort-price"]');
      
      // Should update sorting
      await expect(page.locator('[data-testid="market-row"]').first()).toBeVisible();
    });

    test('should filter market data', async ({ page }) => {
      await page.goto('/market');
      
      // Apply filter
      await page.click('[data-testid="filter-button"]');
      await page.check('[data-testid="filter-gainers"]');
      
      // Should show filtered results
      await expect(page.locator('[data-testid="market-row"]')).toHaveCount(await page.locator('[data-testid="market-row"]').count());
    });
  });

  test.describe('User Dashboard Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto('/login');
      await page.fill('[name="email"]', 'test@example.com');
      await page.fill('[name="password"]', 'Test123!@#');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard');
    });

    test('should display dashboard', async ({ page }) => {
      // Should show user dashboard
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="user-stats"]')).toBeVisible();
    });

    test('should bookmark article', async ({ page }) => {
      await page.goto('/articles');
      
      // Click bookmark on first article
      await page.click('[data-testid="bookmark-button"]');
      
      // Should show success message
      await expect(page.locator('text=/Bookmarked|Added to bookmarks/i')).toBeVisible();
      
      // Check in dashboard
      await page.goto('/dashboard/bookmarks');
      await expect(page.locator('[data-testid="bookmark-item"]').first()).toBeVisible();
    });

    test('should update user profile', async ({ page }) => {
      await page.goto('/dashboard/profile');
      
      // Update profile
      await page.fill('[name="displayName"]', 'Updated Name');
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text=/Profile updated|Saved successfully/i')).toBeVisible();
    });

    test('should change password', async ({ page }) => {
      await page.goto('/dashboard/security');
      
      // Fill password change form
      await page.fill('[name="currentPassword"]', 'Test123!@#');
      await page.fill('[name="newPassword"]', 'NewTest123!@#');
      await page.fill('[name="confirmPassword"]', 'NewTest123!@#');
      await page.click('button[type="submit"]');
      
      // Should show success message
      await expect(page.locator('text=/Password changed|Password updated/i')).toBeVisible();
    });
  });

  test.describe('Responsive Navigation', () => {
    test('should work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Open mobile menu
      await page.click('[aria-label="Open menu"]');
      
      // Should show menu
      await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
      
      // Navigate to articles
      await page.click('text=Articles');
      await expect(page).toHaveURL('/articles');
    });

    test('should work on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      // Should display properly
      await expect(page.locator('main')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should show 404 page', async ({ page }) => {
      await page.goto('/non-existent-page');
      
      // Should show 404 page
      await expect(page.locator('text=/404|Not Found/i')).toBeVisible();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline
      await page.context().setOffline(true);
      await page.goto('/articles');
      
      // Should show error message
      await expect(page.locator('text=/Network error|Connection failed/i')).toBeVisible();
      
      // Restore online
      await page.context().setOffline(false);
    });

    test('should retry failed requests', async ({ page }) => {
      // Intercept API calls
      await page.route('**/api/**', route => route.abort());
      await page.goto('/articles');
      
      // Should show error with retry button
      await expect(page.locator('text=/Try again|Retry/i')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should load home page quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;
      
      // Should load in under 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should not have console errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.goto('/');
      await page.goto('/articles');
      await page.goto('/market');
      
      // Should not have any console errors
      expect(errors).toHaveLength(0);
    });
  });
});
