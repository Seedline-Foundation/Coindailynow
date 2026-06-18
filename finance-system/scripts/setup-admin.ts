#!/usr/bin/env ts-node
/**
 * CFIS Admin Setup Script
 *
 * Creates the cfis_admins table (if not exists) and bootstraps the first
 * Super Admin with bcrypt-hashed password + TOTP secret.
 *
 * Usage:
 *   npx ts-node scripts/setup-admin.ts <email> <password>
 *
 * Example:
 *   npx ts-node scripts/setup-admin.ts admin@sygn.live MyStr0ngP@ss!
 *
 * After running:
 *   1. The script prints a TOTP URI — add it to your authenticator app
 *      (Google Authenticator, Authy, 1Password, etc.)
 *   2. On first CFIS login, you'll be prompted to verify the TOTP code
 *   3. After verification, TOTP is enrolled and required on all future logins
 *
 * Environment:
 *   Reads DATABASE_URL (or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME)
 *   from .env in the finance-system root.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env from finance-system root
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import db from '../src/database/connection';
import { adminService } from '../src/services/AdminService';
import QRCode from 'qrcode';

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('');
    console.error('Usage: npx ts-node scripts/setup-admin.ts <email> <password>');
    console.error('');
    console.error('Example:');
    console.error('  npx ts-node scripts/setup-admin.ts admin@sygn.live MyStr0ngP@ss!');
    console.error('');
    process.exit(1);
  }

  // Validate password strength
  if (password.length < 12) {
    console.error('ERROR: Password must be at least 12 characters for a finance system.');
    process.exit(1);
  }

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   CFIS Admin Setup — Super Admin Bootstrap      ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  // 1. Run migration
  console.log('[1/3] Running migration...');
  const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '001_cfis_admins.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
  await db.query(migrationSQL);
  console.log('      ✅ cfis_admins table ready');

  // 2. Check if admin already exists
  const existing = await adminService.findByEmail(email);
  if (existing) {
    console.log(`      ⚠ Admin ${email} already exists. Skipping creation.`);
    console.log('');
    console.log('To reset password or TOTP, delete the row from cfis_admins and re-run this script.');
    process.exit(0);
  }

  // 3. Create admin
  console.log(`[2/3] Creating admin: ${email}`);
  const { totpSecret, totpUri } = await adminService.createAdmin(email, password);
  console.log('      ✅ Admin created with bcrypt-hashed password');

  // 4. Display TOTP setup info
  console.log('[3/3] TOTP setup');
  console.log('');
  console.log('─── Add this to your authenticator app ───────────────────');
  console.log('');
  console.log('TOTP Secret (manual entry):');
  console.log(`  ${totpSecret}`);
  console.log('');
  console.log('TOTP URI (paste into authenticator):');
  console.log(`  ${totpUri}`);
  console.log('');

  // Generate QR code in terminal
  try {
    const qr = await QRCode.toString(totpUri, { type: 'terminal', small: true });
    console.log('QR Code (scan with authenticator app):');
    console.log(qr);
  } catch {
    console.log('(QR code generation unavailable — use the URI above)');
  }

  console.log('──────────────────────────────────────────────────────────');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Add the TOTP secret/URI to your authenticator app');
  console.log('  2. Login to CFIS — it will ask you to verify a TOTP code');
  console.log('  3. After first verification, TOTP is enrolled and always required');
  console.log('');
  console.log('⚠  Store the TOTP secret securely as a backup. If you lose');
  console.log('   your authenticator, you\'ll need to reset via the database.');
  console.log('');

  await db.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
