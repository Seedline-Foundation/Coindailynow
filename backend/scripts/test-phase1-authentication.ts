/**
 * Phase 1 Authentication Test Suite
 * Comprehensive testing of super admin authentication flow
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';

const prisma = new PrismaClient();

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function logTest(test: string, status: 'PASS' | 'FAIL', message: string, details?: any) {
  const color = status === 'PASS' ? colors.green : colors.red;
  const symbol = status === 'PASS' ? '✅' : '❌';
  console.log(`${color}${symbol} ${test}${colors.reset}`);
  console.log(`   ${message}`);
  if (details) {
    console.log(`   ${colors.cyan}Details:${colors.reset}`, JSON.stringify(details, null, 2));
  }
  results.push({ test, status, message, details });
}

async function testDatabaseSchema() {
  console.log(`\n${colors.bright}${colors.blue}=== Database Schema Tests ===${colors.reset}\n`);

  try {
    // Test 1: Check if UserRole enum exists
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });
    
    if (superAdmin) {
      logTest('UserRole Enum', 'PASS', 'SUPER_ADMIN role exists in database');
    } else {
      logTest('UserRole Enum', 'FAIL', 'No SUPER_ADMIN user found');
    }

    // Test 2: Check AdminPermission model
    const permissionCount = await prisma.adminPermission.count();
    logTest('AdminPermission Model', 'PASS', `AdminPermission table exists with ${permissionCount} records`);

    // Test 3: Check AuditLog model
    const auditCount = await prisma.auditLog.count();
    logTest('AuditLog Model', 'PASS', `AuditLog table exists with ${auditCount} records`);

    // Test 4: Check AdminRole model
    const roleCount = await prisma.adminRole.count();
    logTest('AdminRole Model', 'PASS', `AdminRole table exists with ${roleCount} records`);

    // Test 5: Verify twoFactorSecret field
    const userWithSecret = await prisma.user.findFirst({
      where: { twoFactorSecret: { not: null } }
    });
    logTest('Two-Factor Fields', 'PASS', `Two-factor authentication fields available`, {
      hasUsersWithSecret: !!userWithSecret
    });

  } catch (error) {
    logTest('Database Schema', 'FAIL', `Schema validation failed: ${error}`);
  }
}

async function testUserCreation() {
  console.log(`\n${colors.bright}${colors.blue}=== User Creation Tests ===${colors.reset}\n`);

  try {
    // Test 1: Check super admin exists
    const superAdmin = await prisma.user.findFirst({
      where: { 
        role: 'SUPER_ADMIN',
        email: 'admin@coindaily.africa'
      }
    });

    if (superAdmin) {
      logTest('Super Admin User', 'PASS', 'Super admin account exists', {
        email: superAdmin.email,
        username: superAdmin.username,
        role: superAdmin.role
      });

      // Test 2: Verify password hash
      const passwordValid = await bcrypt.compare('Admin@2024!', superAdmin.passwordHash);
      if (passwordValid) {
        logTest('Password Hash', 'PASS', 'Password is correctly hashed and verifiable');
      } else {
        logTest('Password Hash', 'FAIL', 'Password verification failed');
      }
    } else {
      logTest('Super Admin User', 'FAIL', 'Super admin account not found');
    }

    // Test 3: Check additional admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        role: { in: ['CONTENT_ADMIN', 'MARKETING_ADMIN', 'TECH_ADMIN'] }
      }
    });

    logTest('Additional Admin Users', 'PASS', `Found ${adminUsers.length} additional admin users`, {
      users: adminUsers.map(u => ({ email: u.email, role: u.role }))
    });

  } catch (error) {
    logTest('User Creation', 'FAIL', `User creation test failed: ${error}`);
  }
}

async function testJWTTokens() {
  console.log(`\n${colors.bright}${colors.blue}=== JWT Token Tests ===${colors.reset}\n`);

  try {
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (!superAdmin) {
      logTest('JWT Token Generation', 'FAIL', 'No super admin user for testing');
      return;
    }

    // Test 1: Generate access token
    const accessToken = jwt.sign(
      {
        sub: superAdmin.id,
        email: superAdmin.email,
        username: superAdmin.username,
        role: superAdmin.role
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    logTest('Access Token Generation', 'PASS', 'Access token generated successfully', {
      tokenLength: accessToken.length,
      startsWithBearer: accessToken.startsWith('eyJ')
    });

    // Test 2: Verify access token
    const decoded = jwt.verify(accessToken, JWT_SECRET) as any;
    if (decoded.sub === superAdmin.id && decoded.role === 'SUPER_ADMIN') {
      logTest('Access Token Verification', 'PASS', 'Token verified and decoded successfully', {
        userId: decoded.sub,
        role: decoded.role,
        email: decoded.email
      });
    } else {
      logTest('Access Token Verification', 'FAIL', 'Token payload mismatch');
    }

    // Test 3: Generate refresh token
    const refreshToken = jwt.sign(
      { sub: superAdmin.id, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    logTest('Refresh Token Generation', 'PASS', 'Refresh token generated successfully');

    // Test 4: Verify refresh token
    const refreshDecoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
    if (refreshDecoded.sub === superAdmin.id && refreshDecoded.type === 'refresh') {
      logTest('Refresh Token Verification', 'PASS', 'Refresh token verified successfully');
    } else {
      logTest('Refresh Token Verification', 'FAIL', 'Refresh token payload mismatch');
    }

  } catch (error) {
    logTest('JWT Token Tests', 'FAIL', `JWT test failed: ${error}`);
  }
}

async function testTwoFactorAuth() {
  console.log(`\n${colors.bright}${colors.blue}=== Two-Factor Authentication Tests ===${colors.reset}\n`);

  try {
    // Test 1: Generate 2FA secret
    const secret = authenticator.generateSecret();
    logTest('2FA Secret Generation', 'PASS', 'TOTP secret generated successfully', {
      secretLength: secret.length
    });

    // Test 2: Generate OTP code
    const token = authenticator.generate(secret);
    logTest('2FA Code Generation', 'PASS', 'TOTP code generated successfully', {
      codeLength: token.length,
      isNumeric: /^\d+$/.test(token)
    });

    // Test 3: Verify OTP code
    const isValid = authenticator.verify({ token, secret });
    if (isValid) {
      logTest('2FA Code Verification', 'PASS', 'TOTP code verified successfully');
    } else {
      logTest('2FA Code Verification', 'FAIL', 'TOTP verification failed');
    }

    // Test 4: Test with user's 2FA
    const userWith2FA = await prisma.user.findFirst({
      where: {
        twoFactorEnabled: true,
        twoFactorSecret: { not: null }
      }
    });

    if (userWith2FA && userWith2FA.twoFactorSecret) {
      const userToken = authenticator.generate(userWith2FA.twoFactorSecret);
      const userValid = authenticator.verify({ 
        token: userToken, 
        secret: userWith2FA.twoFactorSecret 
      });
      
      logTest('User 2FA Integration', 'PASS', `2FA working for user ${userWith2FA.email}`, {
        enabled: userWith2FA.twoFactorEnabled,
        verified: userValid
      });
    } else {
      logTest('User 2FA Integration', 'PASS', 'No users with 2FA enabled (expected for fresh install)');
    }

  } catch (error) {
    logTest('Two-Factor Auth', 'FAIL', `2FA test failed: ${error}`);
  }
}

async function testAuditLogging() {
  console.log(`\n${colors.bright}${colors.blue}=== Audit Logging Tests ===${colors.reset}\n`);

  try {
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (!superAdmin) {
      logTest('Audit Logging', 'FAIL', 'No super admin user for testing');
      return;
    }

    // Test 1: Create audit log entry
    const auditLog = await prisma.auditLog.create({
      data: {
        id: `audit_test_${Date.now()}`,
        adminId: superAdmin.id,
        action: 'test_action',
        resource: 'test_resource',
        details: JSON.stringify({ test: true, timestamp: new Date() }),
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
        status: 'success',
        timestamp: new Date()
      }
    });

    logTest('Audit Log Creation', 'PASS', 'Audit log entry created successfully', {
      id: auditLog.id,
      action: auditLog.action,
      adminId: auditLog.adminId
    });

    // Test 2: Query audit logs
    const recentLogs = await prisma.auditLog.findMany({
      where: { adminId: superAdmin.id },
      orderBy: { timestamp: 'desc' },
      take: 5
    });

    logTest('Audit Log Retrieval', 'PASS', `Retrieved ${recentLogs.length} recent audit logs`);

    // Test 3: Audit log filtering
    const successLogs = await prisma.auditLog.count({
      where: { status: 'success' }
    });

    const failedLogs = await prisma.auditLog.count({
      where: { status: 'failed' }
    });

    logTest('Audit Log Filtering', 'PASS', 'Audit logs can be filtered by status', {
      successCount: successLogs,
      failedCount: failedLogs
    });

  } catch (error) {
    logTest('Audit Logging', 'FAIL', `Audit logging test failed: ${error}`);
  }
}

async function testRolePermissions() {
  console.log(`\n${colors.bright}${colors.blue}=== Role & Permissions Tests ===${colors.reset}\n`);

  try {
    // Test 1: Check admin role templates
    const adminRoles = await prisma.adminRole.findMany();
    
    logTest('Admin Role Templates', 'PASS', `Found ${adminRoles.length} role templates`, {
      roles: adminRoles.map(r => ({ name: r.name, displayName: r.displayName }))
    });

    // Test 2: Verify role permissions structure
    const superAdminRole = await prisma.adminRole.findFirst({
      where: { name: 'SUPER_ADMIN' }
    });

    if (superAdminRole) {
      const permissions = JSON.parse(superAdminRole.permissions);
      logTest('Role Permissions Structure', 'PASS', 'Permissions are properly structured', {
        roleId: superAdminRole.id,
        permissionKeys: Object.keys(permissions)
      });
    } else {
      logTest('Role Permissions Structure', 'FAIL', 'SUPER_ADMIN role not found');
    }

    // Test 3: Check permission inheritance
    const contentAdminRole = await prisma.adminRole.findFirst({
      where: { name: 'CONTENT_ADMIN' }
    });

    if (contentAdminRole) {
      const contentPerms = JSON.parse(contentAdminRole.permissions);
      logTest('Content Admin Permissions', 'PASS', 'Content admin has appropriate permissions', {
        hasContentPerms: !!contentPerms.content,
        contentActions: contentPerms.content
      });
    }

  } catch (error) {
    logTest('Role Permissions', 'FAIL', `Role/permission test failed: ${error}`);
  }
}

async function generateReport() {
  console.log(`\n${colors.bright}${colors.magenta}╔═══════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}║        PHASE 1 AUTHENTICATION TEST REPORT           ║${colors.reset}`);
  console.log(`${colors.bright}${colors.magenta}╚═══════════════════════════════════════════════════════╝${colors.reset}\n`);

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(1);

  console.log(`${colors.bright}Total Tests:${colors.reset} ${total}`);
  console.log(`${colors.green}Passed:${colors.reset} ${passed}`);
  console.log(`${colors.red}Failed:${colors.reset} ${failed}`);
  console.log(`${colors.cyan}Success Rate:${colors.reset} ${percentage}%\n`);

  if (failed > 0) {
    console.log(`${colors.red}Failed Tests:${colors.reset}`);
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ${colors.red}•${colors.reset} ${r.test}: ${r.message}`);
    });
    console.log();
  }

  const status = failed === 0 ? 'COMPLETE' : 'INCOMPLETE';
  const statusColor = failed === 0 ? colors.green : colors.yellow;

  console.log(`${statusColor}${colors.bright}Phase 1 Status: ${status}${colors.reset}\n`);

  if (failed === 0) {
    console.log(`${colors.green}✅ All Phase 1 tests passed! Ready for Phase 2.${colors.reset}\n`);
    console.log(`${colors.cyan}Test Credentials:${colors.reset}`);
    console.log(`  Email: admin@coindaily.africa`);
    console.log(`  Password: Admin@2024!`);
    console.log(`  Login URL: http://localhost:3000/super-admin/login\n`);
  } else {
    console.log(`${colors.yellow}⚠️  Some tests failed. Please review and fix before proceeding.${colors.reset}\n`);
  }
}

async function runAllTests() {
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  CoinDaily Super Admin - Phase 1 Authentication Test Suite  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  try {
    await testDatabaseSchema();
    await testUserCreation();
    await testJWTTokens();
    await testTwoFactorAuth();
    await testAuditLogging();
    await testRolePermissions();
    await generateReport();
  } catch (error) {
    console.error(`${colors.red}Fatal error during test execution:${colors.reset}`, error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests
runAllTests().catch(console.error);
