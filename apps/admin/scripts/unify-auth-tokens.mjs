/**
 * One-shot: replace legacy localStorage token reads with getAccessToken().
 * Run: node scripts/unify-auth-tokens.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

function walk(dir, files = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, files);
    else if (/\.(tsx?)$/.test(ent.name)) files.push(p);
  }
  return files;
}

const patterns = [
  [/localStorage\.getItem\(['"]super_admin_token['"]\)/g, 'getAccessToken()'],
  [/localStorage\.getItem\(['"]token['"]\)/g, 'getAccessToken()'],
  [/localStorage\.removeItem\(['"]super_admin_token['"]\)/g, 'clearSession()'],
];

let changed = 0;
for (const file of walk(root)) {
  if (file.includes(`${path.sep}lib${path.sep}auth.ts`)) continue;
  let text = fs.readFileSync(file, 'utf8');
  let next = text;
  for (const [re, rep] of patterns) next = next.replace(re, rep);
  if (next === text) continue;
  if (!next.includes("from '@/lib/auth'") && !next.includes('from "@/lib/auth"')) {
    if (next.includes("'use client'")) {
      next = next.replace(
        /('use client';\r?\n)/,
        "$1\nimport { getAccessToken, clearSession } from '@/lib/auth';\n",
      );
    } else {
      next = `import { getAccessToken, clearSession } from '@/lib/auth';\n${next}`;
    }
  }
  fs.writeFileSync(file, next);
  changed++;
  console.log('updated', path.relative(root, file));
}
console.log(`Done. ${changed} files updated.`);
