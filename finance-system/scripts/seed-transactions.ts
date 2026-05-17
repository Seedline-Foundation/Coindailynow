#!/usr/bin/env ts-node
/**
 * Seed COMPLETED transactions for tax CSV smoke tests (Contabo / local CFIS DB).
 *
 * Usage:
 *   cd finance-system && npx ts-node scripts/seed-transactions.ts [--year 2025]
 *
 * Requires schema.sql applied and at least one wallet row (see database/seed.sql).
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import db from '../src/database/connection';

const year = Number(process.argv.find((a) => a.startsWith('--year='))?.split('=')[1] || new Date().getFullYear());

async function main() {
  const wallet = await db.query<{ id: string }>(
    `SELECT id FROM wallets WHERE is_active = true ORDER BY created_at ASC LIMIT 1`,
  );
  if (!wallet.rows[0]) {
    console.error('No wallet found. Run database/seed.sql first.');
    process.exit(1);
  }
  const walletId = wallet.rows[0].id;

  const samples: Array<{
    tx_type: string;
    currency: string;
    amount: string;
    fee: string;
    description: string;
    month: number;
  }> = [
    { tx_type: 'SUBSCRIPTION_PAYMENT', currency: 'USD', amount: '9.99', fee: '0.30', description: 'Premium monthly', month: 2 },
    { tx_type: 'TOKEN_DEPOSIT', currency: 'JY', amount: '100.000000', fee: '0', description: 'Wallet deposit', month: 3 },
    { tx_type: 'TOKEN_WITHDRAWAL', currency: 'JY', amount: '25.000000', fee: '0.500000', description: 'User withdrawal', month: 4 },
    { tx_type: 'FEE', currency: 'JY', amount: '1.250000', fee: '0', description: 'Platform fee', month: 5 },
    { tx_type: 'SUBSCRIPTION_REFUND', currency: 'USD', amount: '9.99', fee: '0', description: 'Refund', month: 6 },
  ];

  let inserted = 0;
  for (const s of samples) {
    const created = `${year}-${String(s.month).padStart(2, '0')}-15T12:00:00.000Z`;
    const res = await db.query(
      `INSERT INTO transactions (
         tx_type, status, to_wallet_id, amount, currency, fee, tx_hash, description, requested_by, created_at, completed_at
       ) VALUES ($1::tx_type, 'COMPLETED', $2, $3, $4, $5, $6, $7, 'seed-transactions', $8::timestamptz, $8::timestamptz)
       RETURNING id`,
      [
        s.tx_type,
        walletId,
        s.amount,
        s.currency,
        s.fee,
        `0xseed${year}${s.month}${s.tx_type.slice(0, 4)}`,
        s.description,
        created,
      ],
    );
    if (res.rowCount) inserted += 1;
  }

  console.log(`Seeded ${inserted} COMPLETED transactions for tax year ${year} (wallet ${walletId}).`);
  await db.pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
