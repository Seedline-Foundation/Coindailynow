const fs = require('fs');

const logPath = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\60bfab3d-6edb-4b88-a1a1-98fb86b5245a\\.system_generated\\tasks\\task-166.log';

try {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split('\n');
  console.log(`Total lines: ${lines.length}`);
  
  // Filter lines with prisma:query or graphql or login
  const recentLines = lines.slice(-100);
  console.log('Last 100 lines of backend log:');
  recentLines.forEach(line => console.log(line));
} catch (e) {
  console.error('Error reading log:', e.message);
}
