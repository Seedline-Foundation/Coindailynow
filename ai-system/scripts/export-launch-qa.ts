/**
 * Export launch QA sample: up to 30 articles × launch languages for human review.
 * Usage: npx ts-node ai-system/scripts/export-launch-qa.ts
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { editorialPolicy } from '../config/editorialPolicy';

const API = process.env.BACKEND_API_URL || 'http://localhost:4000';
const OUT = path.join(__dirname, '../exports/launch-qa-sample.json');

async function main() {
  const res = await fetch(`${API}/api/super-admin/articles?limit=30&status=APPROVED`);
  const json = await res.json();
  const articles = json.data || json.articles || [];

  const exportRows = articles.map((a: any) => ({
    id: a.id,
    title: a.title,
    languages: editorialPolicy.launchQaLanguages,
    status: a.status,
    scheduledAt: a.publishScheduledAt,
  }));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ exportedAt: new Date().toISOString(), articles: exportRows }, null, 2));
  console.log(`Wrote ${exportRows.length} rows to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
