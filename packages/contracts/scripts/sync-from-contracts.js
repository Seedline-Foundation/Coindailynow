#!/usr/bin/env node
/**
 * Pull freshly compiled ABIs from /contracts/artifacts/ into this package.
 * Run after `cd contracts && npm run artifacts`.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..', '..');
const artifactsDir = path.join(root, 'contracts', 'artifacts');
const outDir = path.join(__dirname, '..', 'src', 'abis');

const contracts = [
  'JoyToken',
  'StakingVault',
  'CDPPoints',
  'TokenVesting',
  'PressDistribution',
  'SimpleWallet',
  'ReputationSBT',
  'Subscription',
  'CoinDailyTimelock',
];

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function resolve(name) {
  const candidates = [
    path.join(artifactsDir, 'sol', `${name}.sol`, `${name}.json`),
    path.join(artifactsDir, 'contracts', 'sol', `${name}.sol`, `${name}.json`),
    path.join(artifactsDir, 'contracts', `${name}.sol`, `${name}.json`),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

let synced = 0;
for (const name of contracts) {
  const artifactPath = resolve(name);
  if (!artifactPath) {
    console.warn(`[skip] ${name} not compiled yet — run \`npm --prefix contracts run compile\``);
    continue;
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  fs.writeFileSync(
    path.join(outDir, `${name}.json`),
    JSON.stringify({ abi: artifact.abi, bytecode: artifact.bytecode }, null, 2),
  );
  synced++;
  console.log(`[sync] ${name}`);
}
console.log(`done — ${synced}/${contracts.length} contracts synced`);
