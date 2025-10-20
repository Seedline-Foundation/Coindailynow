// TypeScript fix script for ai-workflows.ts
// Run this to apply all fixes

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../backend/src/api/ai-workflows.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Add proper return type to all route handlers
content = content.replace(
  /router\.(get|post|put)\('([^']+)', (validateWorkflowId, )?asyncHandler\(async \(req: Request, res: Response\) =>/g,
  'router.$1(\'$2\', $3asyncHandler(async (req: Request, res: Response): Promise<void> =>'
);

// Fix 2: Add ID validation to all routes that need it
const routesNeedingIdValidation = [
  '/:id/rollback',
  '/:id/pause',
  '/:id/resume',
  '/:id/human-review',
  '/:id/review-decision'
];

routesNeedingIdValidation.forEach(route => {
  const pattern = new RegExp(
    `(router\\.(?:put|post)\\('${route.replace('/', '\\/')}', validateWorkflowId, asyncHandler\\(async \\(req: Request, res: Response\\): Promise<void> => {[\\s\\S]*?try {[\\s\\S]*?const { id } = req\\.params;)`,
    'g'
  );
  content = content.replace(pattern, `$1
    if (!id) {
      res.status(400).json({ error: { code: 'MISSING_ID', message: 'Workflow ID is required' } });
      return;
    }`);
});

// Fix 3: Replace all 'return res.' with 'res.' and add 'return;'
content = content.replace(/return res\.status\(/g, 'res.status(');
content = content.replace(/(res\.status\(\d+\)\.json\([^;]+\));/g, '$1;\n      return;');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed all TypeScript errors in ai-workflows.ts');
