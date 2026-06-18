const fs = require('fs');

const logs = {
  backend: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\60bfab3d-6edb-4b88-a1a1-98fb86b5245a\\.system_generated\\tasks\\task-598.log',
  admin: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\60bfab3d-6edb-4b88-a1a1-98fb86b5245a\\.system_generated\\tasks\\task-600.log',
  frontend: 'C:\\Users\\user\\.gemini\\antigravity\\brain\\60bfab3d-6edb-4b88-a1a1-98fb86b5245a\\.system_generated\\tasks\\task-602.log'
};

for (const [name, logPath] of Object.entries(logs)) {
  try {
    const content = fs.readFileSync(logPath, 'utf8');
    const lines = content.split('\n');
    console.log(`\n=== LAST 15 LINES OF ${name.toUpperCase()} LOG (${lines.length} lines) ===`);
    lines.slice(-15).forEach(line => console.log(line));
  } catch (e) {
    console.error(`Error reading ${name} log:`, e.message);
  }
}
