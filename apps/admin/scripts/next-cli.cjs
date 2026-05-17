/**
 * Resolve `next` from workspace-local or hoisted node_modules (monorepo-safe).
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const appRoot = path.join(__dirname, '..');
const candidates = [
  path.join(appRoot, 'node_modules', 'next', 'dist', 'bin', 'next'),
  path.join(appRoot, '..', '..', 'node_modules', 'next', 'dist', 'bin', 'next'),
];

const nextBin = candidates.find((p) => fs.existsSync(p));
if (!nextBin) {
  console.error(
    'Next.js is not installed.\n' +
      '  From repo root: npm install\n' +
      '  Or: npm install --workspace=@coindaily/admin',
  );
  process.exit(1);
}

const args = process.argv.slice(2);
const result = spawnSync(process.execPath, [nextBin, ...args], {
  stdio: 'inherit',
  cwd: appRoot,
  env: process.env,
});

process.exit(result.status ?? 1);
