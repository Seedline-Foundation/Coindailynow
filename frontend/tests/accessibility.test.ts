/**
 * WCAG AA Accessibility Testing
 * Session 3: Testing & Validation - WCAG AA compliance
 */

import { chromium, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

interface AccessibilityIssue {
  id: string;
  impact: string;
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

interface AccessibilityReport {
  page: string;
  url: string;
  violations: AccessibilityIssue[];
  passes: number;
  incomplete: number;
  timestamp: string;
}

const testPages = [
  { name: 'Home', url: '/', critical: true },
  { name: 'Dashboard', url: '/dashboard', critical: true },
  { name: 'Articles', url: '/articles', critical: true },
  { name: 'Article Detail', url: '/articles/example', critical: true },
  { name: 'Market Data', url: '/market', critical: true },
  { name: 'User Profile', url: '/profile', critical: false },
  { name: 'Settings', url: '/settings', critical: false },
  { name: 'Login', url: '/login', critical: true },
  { name: 'Register', url: '/register', critical: true },
];

async function testAccessibility() {
  console.log('♿ Starting WCAG AA Accessibility Testing...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const reports: AccessibilityReport[] = [];
  let totalViolations = 0;
  let criticalViolations = 0;

  for (const testPage of testPages) {
    console.log(`Testing ${testPage.name} (${testPage.url})...`);

    try {
      await page.goto(`http://localhost:3000${testPage.url}`, {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Run accessibility tests with axe-core
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const violations = accessibilityScanResults.violations.map((v: any) => ({
        id: v.id,
        impact: v.impact,
        description: v.description,
        help: v.help,
        helpUrl: v.helpUrl,
        nodes: v.nodes.map((n: any) => ({
          html: n.html,
          target: n.target,
          failureSummary: n.failureSummary,
        })),
      }));

      const report: AccessibilityReport = {
        page: testPage.name,
        url: testPage.url,
        violations,
        passes: accessibilityScanResults.passes.length,
        incomplete: accessibilityScanResults.incomplete.length,
        timestamp: new Date().toISOString(),
      };

      reports.push(report);
      totalViolations += violations.length;

      if (testPage.critical && violations.length > 0) {
        criticalViolations += violations.length;
      }

      // Log results
      if (violations.length === 0) {
        console.log(`  ✓ No accessibility violations found`);
      } else {
        console.log(`  ✗ Found ${violations.length} violation(s):`);
        violations.forEach((v: AccessibilityIssue) => {
          console.log(`    • [${v.impact}] ${v.description}`);
          console.log(`      ${v.help}`);
          console.log(`      ${v.helpUrl}`);
        });
      }
      console.log(`  Passes: ${accessibilityScanResults.passes.length}, Incomplete: ${accessibilityScanResults.incomplete.length}\n`);
    } catch (error) {
      console.error(`  ✗ Error testing ${testPage.name}:`, error);
    }
  }

  await context.close();
  await browser.close();

  // Generate comprehensive report
  console.log('\n♿ ACCESSIBILITY TESTING SUMMARY\n');
  console.log('═'.repeat(80));

  const testedPages = reports.length;
  const pagesWithViolations = reports.filter(r => r.violations.length > 0).length;
  const pagesWithoutViolations = testedPages - pagesWithViolations;
  const complianceRate = ((pagesWithoutViolations / testedPages) * 100).toFixed(1);

  console.log(`Pages Tested: ${testedPages}`);
  console.log(`Pages Compliant: ${pagesWithoutViolations} ✓`);
  console.log(`Pages with Issues: ${pagesWithViolations} ✗`);
  console.log(`Compliance Rate: ${complianceRate}%`);
  console.log(`Total Violations: ${totalViolations}`);
  console.log(`Critical Page Violations: ${criticalViolations}\n`);

  // Violation breakdown by impact
  const violationsByImpact = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };

  reports.forEach(report => {
    report.violations.forEach(v => {
      if (v.impact in violationsByImpact) {
        violationsByImpact[v.impact as keyof typeof violationsByImpact]++;
      }
    });
  });

  console.log('Violations by Impact:');
  console.log(`  Critical: ${violationsByImpact.critical}`);
  console.log(`  Serious: ${violationsByImpact.serious}`);
  console.log(`  Moderate: ${violationsByImpact.moderate}`);
  console.log(`  Minor: ${violationsByImpact.minor}\n`);

  // Common violations
  const violationCounts: Record<string, number> = {};
  reports.forEach(report => {
    report.violations.forEach(v => {
      violationCounts[v.id] = (violationCounts[v.id] || 0) + 1;
    });
  });

  const sortedViolations = Object.entries(violationCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  if (sortedViolations.length > 0) {
    console.log('Most Common Violations:');
    sortedViolations.forEach(([id, count]) => {
      const violation = reports
        .flatMap(r => r.violations)
        .find(v => v.id === id);
      console.log(`  ${count}x ${id}: ${violation?.description}`);
    });
    console.log('');
  }

  // Detailed violations by page
  if (pagesWithViolations > 0) {
    console.log('DETAILED VIOLATIONS BY PAGE:\n');
    reports
      .filter(r => r.violations.length > 0)
      .forEach(report => {
        console.log(`${report.page} (${report.url}):`);
        report.violations.forEach(v => {
          console.log(`  [${v.impact.toUpperCase()}] ${v.id}`);
          console.log(`  ${v.description}`);
          console.log(`  Fix: ${v.help}`);
          console.log(`  Learn more: ${v.helpUrl}`);
          console.log(`  Affected elements: ${v.nodes.length}`);
          v.nodes.slice(0, 3).forEach(node => {
            console.log(`    • ${node.target.join(' > ')}`);
          });
          if (v.nodes.length > 3) {
            console.log(`    ... and ${v.nodes.length - 3} more`);
          }
          console.log('');
        });
      });
  }

  console.log('═'.repeat(80));

  // WCAG AA compliance check
  const isWCAGCompliant = criticalViolations === 0 && violationsByImpact.critical === 0 && violationsByImpact.serious === 0;
  
  console.log(`\n${isWCAGCompliant ? '✅' : '❌'} WCAG AA Compliance: ${isWCAGCompliant ? 'PASSED' : 'FAILED'}\n`);

  return {
    reports,
    summary: {
      testedPages,
      pagesWithViolations,
      pagesWithoutViolations,
      complianceRate: parseFloat(complianceRate),
      totalViolations,
      criticalViolations,
      violationsByImpact,
      isWCAGCompliant,
    },
  };
}

// Run tests if executed directly
if (require.main === module) {
  testAccessibility()
    .then(result => {
      if (!result.summary.isWCAGCompliant) {
        console.error('WCAG AA compliance check failed!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Accessibility test execution failed:', error);
      process.exit(1);
    });
}

export default testAccessibility;
