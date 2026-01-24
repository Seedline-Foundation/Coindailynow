/**
 * Responsive & Mobile Testing Script
 * Session 3: Testing & Validation - Responsive/mobile testing
 */

import { chromium, devices } from '@playwright/test';

const mobileDevices = [
  {
    name: 'iPhone 12 Pro',
    device: devices['iPhone 12 Pro'],
  },
  {
    name: 'iPhone SE',
    device: devices['iPhone SE'],
  },
  {
    name: 'Samsung Galaxy S21',
    device: devices['Galaxy S21'],
  },
  {
    name: 'Samsung Galaxy Note 20',
    device: devices['Galaxy Note 20'],
  },
  {
    name: 'iPad Pro',
    device: devices['iPad Pro'],
  },
  {
    name: 'iPad Mini',
    device: devices['iPad Mini'],
  },
];

const tabletDevices = [
  {
    name: 'iPad (gen 7)',
    device: devices['iPad (gen 7)'],
  },
  {
    name: 'Kindle Fire HDX',
    device: devices['Kindle Fire HDX'],
  },
];

const desktopViewports = [
  { name: 'Desktop 1920x1080', width: 1920, height: 1080 },
  { name: 'Desktop 1366x768', width: 1366, height: 768 },
  { name: 'Desktop 1440x900', width: 1440, height: 900 },
];

const testPages = [
  { name: 'Home', url: '/' },
  { name: 'Dashboard', url: '/dashboard' },
  { name: 'Articles', url: '/articles' },
  { name: 'Market Data', url: '/market' },
  { name: 'User Profile', url: '/profile' },
  { name: 'Settings', url: '/settings' },
];

interface TestResult {
  device: string;
  page: string;
  viewport: { width: number; height: number };
  passed: boolean;
  issues: string[];
  screenshot?: string;
}

async function testResponsiveness() {
  console.log('🚀 Starting Responsive Testing...\n');
  
  const browser = await chromium.launch({ headless: true });
  const results: TestResult[] = [];

  // Test mobile devices
  for (const mobileDevice of mobileDevices) {
    console.log(`📱 Testing on ${mobileDevice.name}...`);
    const context = await browser.newContext(mobileDevice.device);
    const page = await context.newPage();

    for (const testPage of testPages) {
      try {
        await page.goto(`http://localhost:3000${testPage.url}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        const issues: string[] = [];
        const viewport = page.viewportSize()!;

        // Check for horizontal scrolling
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        if (hasHorizontalScroll) {
          issues.push('Horizontal scrolling detected');
        }

        // Check for text overflow
        const hasTextOverflow = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          return Array.from(elements).some(el => {
            const rect = el.getBoundingClientRect();
            return rect.right > window.innerWidth;
          });
        });
        if (hasTextOverflow) {
          issues.push('Text overflow detected');
        }

        // Check for touch target sizes
        const smallTouchTargets = await page.evaluate(() => {
          const interactive = document.querySelectorAll('button, a, input, textarea, select');
          return Array.from(interactive).filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width < 44 || rect.height < 44;
          }).length;
        });
        if (smallTouchTargets > 0) {
          issues.push(`${smallTouchTargets} touch targets smaller than 44x44px`);
        }

        // Check font sizes
        const smallFonts = await page.evaluate(() => {
          const elements = document.querySelectorAll('p, span, div, a, button');
          return Array.from(elements).filter(el => {
            const fontSize = window.getComputedStyle(el).fontSize;
            return parseFloat(fontSize) < 14;
          }).length;
        });
        if (smallFonts > 5) {
          issues.push(`${smallFonts} elements with font size < 14px`);
        }

        results.push({
          device: mobileDevice.name,
          page: testPage.name,
          viewport,
          passed: issues.length === 0,
          issues,
        });

        console.log(`  ✓ ${testPage.name} - ${issues.length === 0 ? 'PASSED' : 'ISSUES: ' + issues.join(', ')}`);
      } catch (error) {
        console.error(`  ✗ ${testPage.name} - ERROR: ${error}`);
        results.push({
          device: mobileDevice.name,
          page: testPage.name,
          viewport: page.viewportSize()!,
          passed: false,
          issues: [`Error: ${error}`],
        });
      }
    }

    await context.close();
    console.log('');
  }

  // Test tablet devices
  for (const tabletDevice of tabletDevices) {
    console.log(`📱 Testing on ${tabletDevice.name}...`);
    const context = await browser.newContext(tabletDevice.device);
    const page = await context.newPage();

    for (const testPage of testPages) {
      try {
        await page.goto(`http://localhost:3000${testPage.url}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        const issues: string[] = [];
        const viewport = page.viewportSize()!;

        // Similar checks as mobile
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth;
        });
        if (hasHorizontalScroll) {
          issues.push('Horizontal scrolling detected');
        }

        results.push({
          device: tabletDevice.name,
          page: testPage.name,
          viewport,
          passed: issues.length === 0,
          issues,
        });

        console.log(`  ✓ ${testPage.name} - ${issues.length === 0 ? 'PASSED' : 'ISSUES: ' + issues.join(', ')}`);
      } catch (error) {
        console.error(`  ✗ ${testPage.name} - ERROR: ${error}`);
      }
    }

    await context.close();
    console.log('');
  }

  // Test desktop viewports
  for (const desktopViewport of desktopViewports) {
    console.log(`💻 Testing on ${desktopViewport.name}...`);
    const context = await browser.newContext({
      viewport: { width: desktopViewport.width, height: desktopViewport.height },
    });
    const page = await context.newPage();

    for (const testPage of testPages) {
      try {
        await page.goto(`http://localhost:3000${testPage.url}`, {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        const issues: string[] = [];

        // Check for layout issues
        const hasLayoutIssues = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          return Array.from(elements).some(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > window.innerWidth || rect.height > window.innerHeight * 2;
          });
        });
        if (hasLayoutIssues) {
          issues.push('Layout issues detected');
        }

        results.push({
          device: desktopViewport.name,
          page: testPage.name,
          viewport: { width: desktopViewport.width, height: desktopViewport.height },
          passed: issues.length === 0,
          issues,
        });

        console.log(`  ✓ ${testPage.name} - ${issues.length === 0 ? 'PASSED' : 'ISSUES: ' + issues.join(', ')}`);
      } catch (error) {
        console.error(`  ✗ ${testPage.name} - ERROR: ${error}`);
      }
    }

    await context.close();
    console.log('');
  }

  await browser.close();

  // Generate report
  console.log('\n📊 RESPONSIVE TESTING SUMMARY\n');
  console.log('═'.repeat(80));
  
  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);

  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests} ✓`);
  console.log(`Failed: ${failedTests} ✗`);
  console.log(`Success Rate: ${successRate}%\n`);

  if (failedTests > 0) {
    console.log('❌ FAILED TESTS:\n');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`${r.device} - ${r.page}`);
        r.issues.forEach(issue => console.log(`  • ${issue}`));
        console.log('');
      });
  }

  console.log('═'.repeat(80));

  return {
    totalTests,
    passedTests,
    failedTests,
    successRate: parseFloat(successRate),
    results,
  };
}

// Run tests if executed directly
if (require.main === module) {
  testResponsiveness()
    .then(report => {
      if (report.failedTests > 0) {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

export default testResponsiveness;
