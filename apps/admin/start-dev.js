// Quick dev startup script - bypass npm workspace issues
process.chdir(__dirname);

// Set env vars before Next.js loads
process.env.NEXT_TELEMETRY_DISABLED = '1';
process.env.NO_UPDATE_NOTIFIER = '1';

process.argv = [process.argv[0], __filename, 'dev', '-p', '3002'];

// Simple approach - just require next/dist/bin/next
try {
  require('../../node_modules/next/dist/bin/next');
} catch (e) {
  console.error('Failed to start Next.js:', e.message);
  process.exit(1);
}
