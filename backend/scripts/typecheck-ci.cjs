/**
 * CI/local typecheck with larger heap. Resolves typescript from backend or hoisted node_modules.
 */
const { spawnSync } = require('child_process');

let tscPath;
try {
  tscPath = require.resolve('typescript/bin/tsc');
} catch {
  console.error(
    'TypeScript is not installed. Run: npm install (from repo root or backend folder).',
  );
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ['--max-old-space-size=6144', tscPath, '--noEmit', '--skipLibCheck'],
  { stdio: 'inherit', cwd: require('path').join(__dirname, '..') },
);

process.exit(result.status ?? 1);
