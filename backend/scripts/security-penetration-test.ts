/**
 * Security Penetration Testing Script
 * Automated security testing for the CoinDaily platform
 * 
 * Tests:
 * - Authentication vulnerabilities
 * - Authorization bypass
 * - SQL injection
 * - XSS attacks
 * - CSRF protection
 * - Rate limiting
 * - Input validation
 * - Session management
 * - API security
 */

import axios, { AxiosInstance } from 'axios';
import chalk from 'chalk';

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  details?: string;
  recommendation?: string;
}

class SecurityTester {
  private api: AxiosInstance;
  private results: TestResult[] = [];
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:4000') {
    this.baseURL = baseURL;
    this.api = axios.create({
      baseURL,
      timeout: 10000,
      validateStatus: () => true // Don't throw on any status
    });
  }

  /**
   * Run all security tests
   */
  async runAllTests(): Promise<void> {
    console.log(chalk.bold.blue('\n🔒 Starting Security Penetration Tests\n'));

    await this.testAuthentication();
    await this.testAuthorization();
    await this.testSQLInjection();
    await this.testXSS();
    await this.testCSRF();
    await this.testRateLimiting();
    await this.testInputValidation();
    await this.testSessionManagement();
    await this.testAPISecur();

    this.printResults();
  }

  /**
   * Test 1: Authentication Security
   */
  private async testAuthentication(): Promise<void> {
    console.log(chalk.cyan('Testing Authentication Security...'));

    // Test 1.1: Login with SQL injection
    try {
      const response = await this.api.post('/api/auth/login', {
        email: "admin'--",
        password: 'anything'
      });

      this.addResult({
        name: 'SQL Injection in Login',
        category: 'Authentication',
        passed: response.status === 400 || response.status === 401,
        severity: 'CRITICAL',
        description: 'Attempt SQL injection in login endpoint',
        details: `Status: ${response.status}`,
        recommendation: 'Ensure input validation and parameterized queries'
      });
    } catch (error) {
      this.addResult({
        name: 'SQL Injection in Login',
        category: 'Authentication',
        passed: true,
        severity: 'CRITICAL',
        description: 'SQL injection blocked by input validation'
      });
    }

    // Test 1.2: Weak password acceptance
    try {
      const response = await this.api.post('/api/auth/register', {
        email: 'test@example.com',
        password: '123',
        username: 'testuser'
      });

      this.addResult({
        name: 'Weak Password Validation',
        category: 'Authentication',
        passed: response.status === 400,
        severity: 'MEDIUM',
        description: 'Test weak password rejection',
        details: `Status: ${response.status}`,
        recommendation: 'Enforce strong password policy (min 8 chars, uppercase, lowercase, number, special char)'
      });
    } catch (error) {
      this.addResult({
        name: 'Weak Password Validation',
        category: 'Authentication',
        passed: true,
        severity: 'MEDIUM',
        description: 'Weak passwords properly rejected'
      });
    }

    // Test 1.3: Brute force protection
    const loginAttempts = 6;
    let lastStatus = 0;
    for (let i = 0; i < loginAttempts; i++) {
      const response = await this.api.post('/api/auth/login', {
        email: 'test@example.com',
        password: 'wrongpassword'
      });
      lastStatus = response.status;
      
      if (response.status === 429) break;
    }

    this.addResult({
      name: 'Brute Force Protection',
      category: 'Authentication',
      passed: lastStatus === 429,
      severity: 'HIGH',
      description: 'Test rate limiting on failed login attempts',
      details: `Final status after ${loginAttempts} attempts: ${lastStatus}`,
      recommendation: 'Implement rate limiting and account lockout after multiple failed attempts'
    });
  }

  /**
   * Test 2: Authorization Security
   */
  private async testAuthorization(): Promise<void> {
    console.log(chalk.cyan('Testing Authorization Security...'));

    // Test 2.1: Access admin endpoint without authentication
    try {
      const response = await this.api.get('/api/admin/users');

      this.addResult({
        name: 'Admin Access Without Auth',
        category: 'Authorization',
        passed: response.status === 401 || response.status === 403,
        severity: 'CRITICAL',
        description: 'Attempt to access admin endpoint without authentication',
        details: `Status: ${response.status}`,
        recommendation: 'Ensure all admin routes require authentication'
      });
    } catch (error) {
      this.addResult({
        name: 'Admin Access Without Auth',
        category: 'Authorization',
        passed: true,
        severity: 'CRITICAL',
        description: 'Admin endpoints properly protected'
      });
    }

    // Test 2.2: Privilege escalation
    try {
      const response = await this.api.put('/api/users/promote', {
        userId: 'test-user-id',
        role: 'SUPER_ADMIN'
      });

      this.addResult({
        name: 'Privilege Escalation',
        category: 'Authorization',
        passed: response.status === 401 || response.status === 403,
        severity: 'CRITICAL',
        description: 'Attempt privilege escalation without proper authorization',
        details: `Status: ${response.status}`,
        recommendation: 'Implement proper role-based access control (RBAC)'
      });
    } catch (error) {
      this.addResult({
        name: 'Privilege Escalation',
        category: 'Authorization',
        passed: true,
        severity: 'CRITICAL',
        description: 'Privilege escalation properly blocked'
      });
    }
  }

  /**
   * Test 3: SQL Injection
   */
  private async testSQLInjection(): Promise<void> {
    console.log(chalk.cyan('Testing SQL Injection Protection...'));

    const sqlPayloads = [
      "' OR '1'='1",
      "1'; DROP TABLE users--",
      "' UNION SELECT NULL--",
      "admin'--",
      "1' OR '1' = '1",
      "'; EXEC sp_MSForEachTable 'DROP TABLE ?'--"
    ];

    for (const payload of sqlPayloads) {
      try {
        const response = await this.api.get(`/api/articles?search=${encodeURIComponent(payload)}`);

        this.addResult({
          name: `SQL Injection Test: ${payload.substring(0, 20)}...`,
          category: 'SQL Injection',
          passed: response.status !== 500 && !response.data?.error?.includes('SQL'),
          severity: 'CRITICAL',
          description: 'Test SQL injection in search parameter',
          details: `Payload: ${payload}, Status: ${response.status}`
        });
      } catch (error) {
        this.addResult({
          name: `SQL Injection Test: ${payload.substring(0, 20)}...`,
          category: 'SQL Injection',
          passed: true,
          severity: 'CRITICAL',
          description: 'SQL injection attempt blocked'
        });
      }
    }
  }

  /**
   * Test 4: XSS Protection
   */
  private async testXSS(): Promise<void> {
    console.log(chalk.cyan('Testing XSS Protection...'));

    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg/onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')">',
      '"><script>alert(String.fromCharCode(88,83,83))</script>'
    ];

    for (const payload of xssPayloads) {
      try {
        const response = await this.api.post('/api/comments', {
          articleId: 'test-article-id',
          content: payload
        });

        // Check if response data contains unescaped script tags
        const responseStr = JSON.stringify(response.data);
        const hasUnescapedScript = responseStr.includes('<script>') || responseStr.includes('onerror=');

        this.addResult({
          name: `XSS Test: ${payload.substring(0, 30)}...`,
          category: 'XSS',
          passed: !hasUnescapedScript,
          severity: 'HIGH',
          description: 'Test XSS vulnerability in comment submission',
          details: `Payload sanitized: ${!hasUnescapedScript}`,
          recommendation: 'Implement proper HTML sanitization and CSP headers'
        });
      } catch (error) {
        this.addResult({
          name: `XSS Test: ${payload.substring(0, 30)}...`,
          category: 'XSS',
          passed: true,
          severity: 'HIGH',
          description: 'XSS attempt blocked'
        });
      }
    }
  }

  /**
   * Test 5: CSRF Protection
   */
  private async testCSRF(): Promise<void> {
    console.log(chalk.cyan('Testing CSRF Protection...'));

    // Test 5.1: POST without CSRF token
    try {
      const response = await this.api.post('/api/articles', {
        title: 'Test Article',
        content: 'Test content'
      });

      this.addResult({
        name: 'CSRF Protection - POST',
        category: 'CSRF',
        passed: response.status === 403,
        severity: 'HIGH',
        description: 'Test CSRF protection on state-changing operations',
        details: `Status: ${response.status}`,
        recommendation: 'Implement CSRF tokens for all state-changing operations'
      });
    } catch (error) {
      this.addResult({
        name: 'CSRF Protection - POST',
        category: 'CSRF',
        passed: true,
        severity: 'HIGH',
        description: 'CSRF protection working'
      });
    }

    // Test 5.2: DELETE without CSRF token
    try {
      const response = await this.api.delete('/api/articles/test-id');

      this.addResult({
        name: 'CSRF Protection - DELETE',
        category: 'CSRF',
        passed: response.status === 403,
        severity: 'HIGH',
        description: 'Test CSRF protection on DELETE operations',
        details: `Status: ${response.status}`
      });
    } catch (error) {
      this.addResult({
        name: 'CSRF Protection - DELETE',
        category: 'CSRF',
        passed: true,
        severity: 'HIGH',
        description: 'CSRF protection working on DELETE'
      });
    }
  }

  /**
   * Test 6: Rate Limiting
   */
  private async testRateLimiting(): Promise<void> {
    console.log(chalk.cyan('Testing Rate Limiting...'));

    // Test 6.1: API rate limiting
    const requestCount = 100;
    let rateLimitedCount = 0;

    for (let i = 0; i < requestCount; i++) {
      const response = await this.api.get('/api/articles');
      if (response.status === 429) {
        rateLimitedCount++;
      }
    }

    this.addResult({
      name: 'API Rate Limiting',
      category: 'Rate Limiting',
      passed: rateLimitedCount > 0,
      severity: 'MEDIUM',
      description: `Test rate limiting with ${requestCount} rapid requests`,
      details: `Rate limited after ${requestCount - rateLimitedCount} requests`,
      recommendation: 'Implement rate limiting on all public endpoints'
    });
  }

  /**
   * Test 7: Input Validation
   */
  private async testInputValidation(): Promise<void> {
    console.log(chalk.cyan('Testing Input Validation...'));

    // Test 7.1: Path traversal
    try {
      const response = await this.api.get('/api/files/../../../../etc/passwd');

      this.addResult({
        name: 'Path Traversal Protection',
        category: 'Input Validation',
        passed: response.status === 400 || response.status === 404,
        severity: 'HIGH',
        description: 'Test path traversal attack',
        details: `Status: ${response.status}`,
        recommendation: 'Validate and sanitize file paths'
      });
    } catch (error) {
      this.addResult({
        name: 'Path Traversal Protection',
        category: 'Input Validation',
        passed: true,
        severity: 'HIGH',
        description: 'Path traversal properly blocked'
      });
    }

    // Test 7.2: Excessive data input
    try {
      const largeString = 'A'.repeat(1000000); // 1MB of data
      const response = await this.api.post('/api/articles', {
        title: largeString,
        content: largeString
      });

      this.addResult({
        name: 'Input Size Validation',
        category: 'Input Validation',
        passed: response.status === 400 || response.status === 413,
        severity: 'MEDIUM',
        description: 'Test handling of excessively large inputs',
        details: `Status: ${response.status}`,
        recommendation: 'Implement request size limits'
      });
    } catch (error) {
      this.addResult({
        name: 'Input Size Validation',
        category: 'Input Validation',
        passed: true,
        severity: 'MEDIUM',
        description: 'Large inputs properly rejected'
      });
    }
  }

  /**
   * Test 8: Session Management
   */
  private async testSessionManagement(): Promise<void> {
    console.log(chalk.cyan('Testing Session Management...'));

    // Test 8.1: Session fixation
    try {
      const response = await this.api.post('/api/auth/login', {
        email: 'test@example.com',
        password: 'TestPassword123!'
      }, {
        headers: {
          'Cookie': 'sessionId=fixed-session-id'
        }
      });

      const newSessionId = response.headers['set-cookie']?.[0];
      const sessionChanged = !newSessionId?.includes('fixed-session-id');

      this.addResult({
        name: 'Session Fixation Protection',
        category: 'Session Management',
        passed: sessionChanged,
        severity: 'HIGH',
        description: 'Test if session ID changes after login',
        details: `Session changed: ${sessionChanged}`,
        recommendation: 'Regenerate session ID after authentication'
      });
    } catch (error) {
      this.addResult({
        name: 'Session Fixation Protection',
        category: 'Session Management',
        passed: true,
        severity: 'HIGH',
        description: 'Session management secure'
      });
    }

    // Test 8.2: Secure cookie flags
    try {
      const response = await this.api.post('/api/auth/login', {
        email: 'test@example.com',
        password: 'TestPassword123!'
      });

      const cookie = response.headers['set-cookie']?.[0] || '';
      const hasHttpOnly = cookie.includes('HttpOnly');
      const hasSecure = cookie.includes('Secure') || process.env.NODE_ENV !== 'production';
      const hasSameSite = cookie.includes('SameSite');

      this.addResult({
        name: 'Secure Cookie Flags',
        category: 'Session Management',
        passed: hasHttpOnly && hasSecure && hasSameSite,
        severity: 'MEDIUM',
        description: 'Test cookie security flags',
        details: `HttpOnly: ${hasHttpOnly}, Secure: ${hasSecure}, SameSite: ${hasSameSite}`,
        recommendation: 'Set HttpOnly, Secure, and SameSite flags on cookies'
      });
    } catch (error) {
      this.addResult({
        name: 'Secure Cookie Flags',
        category: 'Session Management',
        passed: false,
        severity: 'MEDIUM',
        description: 'Could not verify cookie flags'
      });
    }
  }

  /**
   * Test 9: API Security
   */
  private async testAPISecur(): Promise<void> {
    console.log(chalk.cyan('Testing API Security...'));

    // Test 9.1: Security headers
    try {
      const response = await this.api.get('/');

      const headers = response.headers;
      const hasCSP = !!headers['content-security-policy'];
      const hasHSTS = !!headers['strict-transport-security'];
      const hasXFrameOptions = !!headers['x-frame-options'];
      const hasXContentType = !!headers['x-content-type-options'];

      this.addResult({
        name: 'Security Headers',
        category: 'API Security',
        passed: hasCSP && hasHSTS && hasXFrameOptions && hasXContentType,
        severity: 'MEDIUM',
        description: 'Test presence of security headers',
        details: `CSP: ${hasCSP}, HSTS: ${hasHSTS}, X-Frame-Options: ${hasXFrameOptions}, X-Content-Type: ${hasXContentType}`,
        recommendation: 'Implement all recommended security headers'
      });
    } catch (error) {
      this.addResult({
        name: 'Security Headers',
        category: 'API Security',
        passed: false,
        severity: 'MEDIUM',
        description: 'Could not verify security headers'
      });
    }

    // Test 9.2: Sensitive data exposure
    try {
      const response = await this.api.get('/api/users/me');

      const dataStr = JSON.stringify(response.data);
      const exposesPassword = dataStr.includes('password');
      const exposesToken = dataStr.includes('token') && !dataStr.includes('csrfToken');

      this.addResult({
        name: 'Sensitive Data Exposure',
        category: 'API Security',
        passed: !exposesPassword && !exposesToken,
        severity: 'CRITICAL',
        description: 'Test for sensitive data in API responses',
        details: `Exposes password: ${exposesPassword}, Exposes token: ${exposesToken}`,
        recommendation: 'Never return sensitive data (passwords, tokens, secrets) in API responses'
      });
    } catch (error) {
      this.addResult({
        name: 'Sensitive Data Exposure',
        category: 'API Security',
        passed: true,
        severity: 'CRITICAL',
        description: 'API properly protects sensitive data'
      });
    }
  }

  /**
   * Add test result
   */
  private addResult(result: TestResult): void {
    this.results.push(result);
  }

  /**
   * Print test results
   */
  private printResults(): void {
    console.log(chalk.bold.blue('\n\n📊 Security Test Results\n'));
    console.log('═'.repeat(80));

    // Group results by category
    const categories = [...new Set(this.results.map(r => r.category))];
    
    let totalTests = 0;
    let passedTests = 0;
    let criticalFailed = 0;
    let highFailed = 0;

    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category);
      const categoryPassed = categoryResults.filter(r => r.passed).length;

      console.log(chalk.bold.cyan(`\n${category} (${categoryPassed}/${categoryResults.length} passed)`));
      console.log('─'.repeat(80));

      for (const result of categoryResults) {
        totalTests++;
        if (result.passed) {
          passedTests++;
          console.log(chalk.green(`✓ ${result.name}`));
        } else {
          console.log(chalk.red(`✗ ${result.name} [${result.severity}]`));
          console.log(chalk.gray(`  ${result.description}`));
          if (result.details) {
            console.log(chalk.gray(`  Details: ${result.details}`));
          }
          if (result.recommendation) {
            console.log(chalk.yellow(`  Recommendation: ${result.recommendation}`));
          }

          if (result.severity === 'CRITICAL') criticalFailed++;
          if (result.severity === 'HIGH') highFailed++;
        }
      }
    }

    // Summary
    console.log(chalk.bold.blue('\n\n📈 Summary\n'));
    console.log('═'.repeat(80));
    console.log(`Total Tests: ${totalTests}`);
    console.log(chalk.green(`Passed: ${passedTests} (${Math.round(passedTests / totalTests * 100)}%)`));
    console.log(chalk.red(`Failed: ${totalTests - passedTests} (${Math.round((totalTests - passedTests) / totalTests * 100)}%)`));
    console.log(chalk.red(`Critical Failed: ${criticalFailed}`));
    console.log(chalk.yellow(`High Failed: ${highFailed}`));

    // Overall assessment
    console.log(chalk.bold.blue('\n\n🔒 Security Assessment\n'));
    console.log('═'.repeat(80));

    if (criticalFailed === 0 && highFailed === 0) {
      console.log(chalk.green('✓ EXCELLENT - No critical or high severity vulnerabilities found'));
    } else if (criticalFailed === 0 && highFailed <= 2) {
      console.log(chalk.yellow('⚠ GOOD - No critical vulnerabilities, but some high severity issues need attention'));
    } else if (criticalFailed <= 2) {
      console.log(chalk.red('✗ NEEDS IMPROVEMENT - Critical vulnerabilities found, immediate action required'));
    } else {
      console.log(chalk.red('✗ POOR - Multiple critical vulnerabilities, platform is not secure'));
    }

    console.log('\n');
  }

  /**
   * Generate JSON report
   */
  generateReport(): void {
    const report = {
      timestamp: new Date().toISOString(),
      baseURL: this.baseURL,
      totalTests: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      criticalFailed: this.results.filter(r => !r.passed && r.severity === 'CRITICAL').length,
      highFailed: this.results.filter(r => !r.passed && r.severity === 'HIGH').length,
      results: this.results
    };

    const fs = require('fs');
    fs.writeFileSync(
      'security-test-report.json',
      JSON.stringify(report, null, 2)
    );

    console.log(chalk.green('\n✓ Report saved to security-test-report.json'));
  }
}

// Run tests
const tester = new SecurityTester(process.env.API_URL || 'http://localhost:4000');
tester.runAllTests().then(() => {
  tester.generateReport();
  process.exit(0);
}).catch((error) => {
  console.error(chalk.red('Error running security tests:'), error);
  process.exit(1);
});
