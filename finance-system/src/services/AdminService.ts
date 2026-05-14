import bcrypt from 'bcryptjs';
import { TOTP, Secret } from 'otpauth';
import db from '../database/connection';

const BCRYPT_ROUNDS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;

export interface CfisAdmin {
  id: string;
  email: string;
  password_hash: string;
  totp_secret: string;
  totp_enrolled: boolean;
  failed_attempts: number;
  locked_until: Date | null;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
}

class AdminService {
  // ── Table detection ──────────────────────────────────────────
  // Returns false if cfis_admins table doesn't exist yet (pre-migration)
  private async tableExists(): Promise<boolean> {
    try {
      const result = await db.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'cfis_admins'
        ) AS exists`
      );
      return result.rows[0]?.exists === true;
    } catch {
      return false;
    }
  }

  async isDbAuthAvailable(): Promise<boolean> {
    if (!db.isConnected) return false;
    const exists = await this.tableExists();
    if (!exists) return false;
    const result = await db.query('SELECT COUNT(*) as count FROM cfis_admins');
    return parseInt(result.rows[0].count) > 0;
  }

  // ── Lookups ──────────────────────────────────────────────────

  async findByEmail(email: string): Promise<CfisAdmin | null> {
    const result = await db.query<CfisAdmin>(
      'SELECT * FROM cfis_admins WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  // ── Password verification ────────────────────────────────────

  async verifyPassword(
    email: string,
    password: string
  ): Promise<{ success: boolean; admin?: CfisAdmin; error?: string }> {
    const admin = await this.findByEmail(email);
    if (!admin) {
      // Constant-time comparison: hash the password even if admin not found
      // to prevent timing attacks that reveal valid emails
      await bcrypt.hash(password, BCRYPT_ROUNDS);
      return { success: false, error: 'Invalid email or password.' };
    }

    // Check lockout
    if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
      const remaining = Math.ceil(
        (new Date(admin.locked_until).getTime() - Date.now()) / 60000
      );
      return {
        success: false,
        error: `Account locked. Try again in ${remaining} minutes.`,
      };
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      await this.incrementFailedAttempts(admin.id);
      return { success: false, error: 'Invalid email or password.' };
    }

    // Reset failed attempts on successful password
    await db.query(
      'UPDATE cfis_admins SET failed_attempts = 0, locked_until = NULL WHERE id = $1',
      [admin.id]
    );

    return { success: true, admin };
  }

  private async incrementFailedAttempts(adminId: string): Promise<void> {
    const result = await db.query<{ failed_attempts: number }>(
      `UPDATE cfis_admins
       SET failed_attempts = failed_attempts + 1, updated_at = NOW()
       WHERE id = $1
       RETURNING failed_attempts`,
      [adminId]
    );
    const attempts = result.rows[0]?.failed_attempts || 0;
    if (attempts >= MAX_FAILED_ATTEMPTS) {
      await db.query(
        `UPDATE cfis_admins SET locked_until = NOW() + $2 * INTERVAL '1 minute' WHERE id = $1`,
        [adminId, LOCKOUT_MINUTES]
      );
    }
  }

  // ── TOTP ─────────────────────────────────────────────────────

  private buildTOTP(email: string, secret: string): TOTP {
    return new TOTP({
      issuer: 'CoinDaily CFIS',
      label: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: Secret.fromBase32(secret),
    });
  }

  verifyTOTP(email: string, secret: string, code: string): boolean {
    const totp = this.buildTOTP(email, secret);
    // Allow ±1 step (30 seconds) tolerance for clock drift
    const delta = totp.validate({ token: code, window: 1 });
    return delta !== null;
  }

  generateTOTPUri(email: string, secret: string): string {
    const totp = this.buildTOTP(email, secret);
    return totp.toString();
  }

  async enrollTOTP(adminId: string): Promise<void> {
    await db.query(
      'UPDATE cfis_admins SET totp_enrolled = true, updated_at = NOW() WHERE id = $1',
      [adminId]
    );
  }

  async updateLastLogin(adminId: string): Promise<void> {
    await db.query(
      'UPDATE cfis_admins SET last_login = NOW(), updated_at = NOW() WHERE id = $1',
      [adminId]
    );
  }

  // ── Admin creation ───────────────────────────────────────────

  async createAdmin(
    email: string,
    password: string
  ): Promise<{ admin: CfisAdmin; totpSecret: string; totpUri: string }> {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const secret = new Secret({ size: 20 });
    const secretBase32 = secret.base32;

    const id = db.generateId();
    const result = await db.query<CfisAdmin>(
      `INSERT INTO cfis_admins (id, email, password_hash, totp_secret, totp_enrolled)
       VALUES ($1, $2, $3, $4, false)
       RETURNING *`,
      [id, email, passwordHash, secretBase32]
    );

    const admin = result.rows[0];
    const totpUri = this.generateTOTPUri(email, secretBase32);

    return { admin, totpSecret: secretBase32, totpUri };
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }
}

export const adminService = new AdminService();
