#!/usr/bin/env node

/**
 * Prisma to Supabase Migration Script
 * 
 * This script helps identify all Prisma usage in your codebase and provides
 * migration suggestions for converting to Supabase client.
 * 
 * Usage: node migrate-to-supabase.js
 */

const fs = require('fs');
const path = require('path');

const PRISMA_PATTERNS = [
  /import\s+{\s*PrismaClient\s*}\s+from\s+['"]@prisma\/client['"]/g,
  /new\s+PrismaClient\s*\(/g,
  /prisma\.\w+\.(findUnique|findMany|findFirst|create|update|delete|count|upsert)/g,
  /prisma\.\$transaction/g,
  /prisma\.\$queryRaw/g,
  /prisma\.\$connect/g,
  /prisma\.\$disconnect/g,
];

const MIGRATION_MAP = {
  'PrismaClient': 'getSupabaseClient() from lib/supabase',
  'prisma.user.findUnique': 'supabase.from("user").select("*").eq("id", id).single()',
  'prisma.user.findMany': 'supabase.from("user").select("*")',
  'prisma.user.create': 'supabase.from("user").insert(data).select().single()',
  'prisma.user.update': 'supabase.from("user").update(data).eq("id", id).select().single()',
  'prisma.user.delete': 'supabase.from("user").delete().eq("id", id)',
  'prisma.user.count': 'supabase.from("user").select("*", { count: "exact", head: true })',
  'prisma.$transaction': 'supabase.rpc("your_transaction_function")',
  'prisma.$queryRaw': 'supabase.rpc("execute_sql", { query, params })',
};

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and dist
      if (!['node_modules', 'dist', '.git', 'logs'].includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function analyzFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const findings = [];

  PRISMA_PATTERNS.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      matches.forEach(match => {
        findings.push({
          file: filePath,
          pattern: match,
          suggestion: MIGRATION_MAP[match.trim()] || 'Check migration guide'
        });
      });
    }
  });

  return findings;
}

function generateMigrationReport() {
  console.log('\n🔍 Scanning for Prisma usage...\n');
  
  const projectRoot = path.resolve(__dirname, '..');
  const files = findFiles(projectRoot);
  
  const allFindings = [];
  let fileCount = 0;

  files.forEach(file => {
    const findings = analyzeFile(file);
    if (findings.length > 0) {
      allFindings.push(...findings);
      fileCount++;
    }
  });

  console.log(`📊 Found Prisma usage in ${fileCount} files\n`);
  console.log('='+ '='.repeat(79));
  
  const groupedByFile = allFindings.reduce((acc, finding) => {
    if (!acc[finding.file]) {
      acc[finding.file] = [];
    }
    acc[finding.file].push(finding);
    return acc;
  }, {});

  Object.entries(groupedByFile).forEach(([file, findings]) => {
    console.log(`\n📄 ${file.replace(projectRoot, '.')}`);
    console.log('-'.repeat(80));
    findings.forEach((finding, idx) => {
      console.log(`  ${idx + 1}. Found: ${finding.pattern}`);
      console.log(`     → Replace with: ${finding.suggestion}`);
    });
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\n✨ Total findings: ${allFindings.length} Prisma references`);
  console.log('\n📖 Next steps:');
  console.log('  1. Review the migration guide: backend/lib/prisma-to-supabase-guide.ts');
  console.log('  2. Update environment variables (.env files)');
  console.log('  3. Migrate each file systematically');
  console.log('  4. Test thoroughly after each migration');
  console.log('  5. Remove Prisma dependencies when complete\n');

  // Save report to file
  const reportPath = path.join(projectRoot, 'PRISMA_MIGRATION_REPORT.txt');
  const reportContent = JSON.stringify(groupedByFile, null, 2);
  fs.writeFileSync(reportPath, reportContent);
  console.log(`📝 Detailed report saved to: PRISMA_MIGRATION_REPORT.txt\n`);
}

// Run the analysis
if (require.main === module) {
  generateMigrationReport();
}

module.exports = { findFiles, analyzeFile };
