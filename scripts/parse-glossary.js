/**
 * One-time script to parse crypto glossary.txt into a deduplicated TypeScript data file.
 * Run: node scripts/parse-glossary.js
 */
const fs = require('fs');
const path = require('path');

const raw = fs.readFileSync(path.join(__dirname, '..', 'crypto glossary.txt'), 'utf-8');
const lines = raw.split(/\r?\n/);

const terms = new Map(); // term (lowercased) -> { term (display), def }

// Single-letter section headers to skip
const sectionHeaders = new Set(
  'A B C D E F G H I J K L M N O P Q R S T U V W X Y Z #'.split(' ')
);

let i = 0;
while (i < lines.length) {
  const line = lines[i].trim();
  i++;

  // Skip empty lines, section headers, purely numeric lines
  if (!line) continue;
  if (sectionHeaders.has(line)) continue;
  if (/^\d+$/.test(line)) continue;

  // Peek at next non-empty line for the definition
  let def = '';
  // Check if current line looks like a term (next non-empty line is its definition)
  // Some entries have the definition on the same line after a period or dash
  // But the dominant pattern is: term on one line, definition on the next

  // Look ahead for definition
  let j = i;
  while (j < lines.length && !lines[j].trim()) j++;

  if (j < lines.length) {
    const nextLine = lines[j].trim();
    // If the next line looks like a definition (starts lowercase, or is a sentence)
    // vs another term (short, title-case)
    if (
      nextLine.length > 0 &&
      !sectionHeaders.has(nextLine) &&
      // Heuristic: definitions are usually longer than 30 chars or start with certain patterns
      (nextLine.length > 40 ||
        nextLine.startsWith('A ') ||
        nextLine.startsWith('An ') ||
        nextLine.startsWith('The ') ||
        nextLine.startsWith('In ') ||
        nextLine.startsWith('It ') ||
        nextLine.startsWith('Refers ') ||
        nextLine.startsWith('Short ') ||
        nextLine.startsWith('Used ') ||
        nextLine.startsWith('Also ') ||
        nextLine.startsWith('When ') ||
        nextLine.startsWith('One ') ||
        nextLine.startsWith('Any ') ||
        nextLine.startsWith('This ') ||
        nextLine.match(/^[A-Z][a-z]/) // Sentence-case start
      )
    ) {
      def = nextLine;
      i = j + 1;
    } else {
      // Might be a term without a definition on the next line — 
      // check if the line itself contains term + definition (e.g. "Term. Definition here")
      const dotMatch = line.match(/^(.+?)\.\s+(.{20,})$/);
      if (dotMatch) {
        const termName = dotMatch[1].trim();
        const termDef = dotMatch[2].trim();
        const key = termName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (key && termDef && !terms.has(key)) {
          terms.set(key, { term: termName, def: termDef });
        }
        continue;
      }
      // Skip lines that don't pair with a definition
      continue;
    }
  } else {
    continue;
  }

  if (!def || def.length < 10) continue;

  // Clean up the term name
  let termName = line;

  // Skip if term name is too long (likely a definition line we misidentified)
  if (termName.length > 120) continue;

  const key = termName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!key) continue;

  // Keep the entry with the longer definition (better quality)
  if (!terms.has(key) || def.length > terms.get(key).def.length) {
    terms.set(key, { term: termName, def });
  }
}

// Sort alphabetically by term
const sorted = [...terms.values()].sort((a, b) =>
  a.term.toLowerCase().localeCompare(b.term.toLowerCase())
);

console.log(`Parsed ${sorted.length} unique glossary terms`);

// Generate TypeScript using JSON.stringify for safe escaping
let ts = `// Auto-generated from "crypto glossary.txt" — do not edit manually.
// Run: node scripts/parse-glossary.js

export interface GlossaryTerm {
  term: string;
  def: string;
}

const glossaryTerms: GlossaryTerm[] = [\n`;

for (const entry of sorted) {
  ts += `  { term: ${JSON.stringify(entry.term)}, def: ${JSON.stringify(entry.def)} },\n`;
}

ts += `];\n\nexport default glossaryTerms;\n`;

const outPath = path.join(
  __dirname,
  '..',
  'frontend',
  'src',
  'data',
  'glossaryTerms.ts'
);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, ts, 'utf-8');
console.log(`Written to ${outPath}`);
