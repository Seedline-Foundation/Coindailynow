#!/usr/bin/env node

/**
 * Automated Prisma to Supabase Code Converter
 * 
 * This script can automatically convert simple Prisma patterns to Supabase.
 * For complex queries, manual review is recommended.
 * 
 * Usage: node convert-file.js <filepath>
 */

const fs = require('fs');
const path = require('path');

const conversions = [
  // Import statements
  {
    pattern: /import\s+{\s*PrismaClient\s*}\s+from\s+['"]@prisma\/client['"]/g,
    replacement: "import { getSupabaseClient } from '../lib/supabase'"
  },
  {
    pattern: /import\s+{\s*PrismaClient,\s*Prisma\s*}\s+from\s+['"]@prisma\/client['"]/g,
    replacement: "import { getSupabaseClient } from '../lib/supabase'"
  },
  
  // Client initialization
  {
    pattern: /const\s+prisma\s*=\s*new\s+PrismaClient\(\s*\)/g,
    replacement: "const supabase = getSupabaseClient()"
  },
  
  // findUnique patterns
  {
    pattern: /await\s+prisma\.(\w+)\.findUnique\(\s*{\s*where:\s*{\s*(\w+):\s*(\w+)\s*}\s*}\s*\)/g,
    replacement: "await supabase.from('$1').select('*').eq('$2', $3).single()"
  },
  
  // findMany without where
  {
    pattern: /await\s+prisma\.(\w+)\.findMany\(\s*\)/g,
    replacement: "await supabase.from('$1').select('*')"
  },
  
  // create patterns
  {
    pattern: /await\s+prisma\.(\w+)\.create\(\s*{\s*data:\s*(\w+)\s*}\s*\)/g,
    replacement: "await supabase.from('$1').insert($2).select().single()"
  },
  
  // update patterns
  {
    pattern: /await\s+prisma\.(\w+)\.update\(\s*{\s*where:\s*{\s*(\w+):\s*(\w+)\s*},\s*data:\s*(\w+)\s*}\s*\)/g,
    replacement: "await supabase.from('$1').update($4).eq('$2', $3).select().single()"
  },
  
  // delete patterns
  {
    pattern: /await\s+prisma\.(\w+)\.delete\(\s*{\s*where:\s*{\s*(\w+):\s*(\w+)\s*}\s*}\s*\)/g,
    replacement: "await supabase.from('$1').delete().eq('$2', $3)"
  },
  
  // count patterns
  {
    pattern: /await\s+prisma\.(\w+)\.count\(\s*\)/g,
    replacement: "await supabase.from('$1').select('*', { count: 'exact', head: true })"
  },
];

function convertFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let changeCount = 0;
    
    console.log(`\n🔄 Converting: ${filePath}`);
    console.log('='.repeat(80));
    
    conversions.forEach(({ pattern, replacement }) => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          console.log(`  ✓ Converting: ${match.substring(0, 60)}...`);
          changeCount++;
        });
        content = content.replace(pattern, replacement);
      }
    });
    
    if (changeCount > 0) {
      // Create backup
      const backupPath = `${filePath}.prisma.backup`;
      fs.copyFileSync(filePath, backupPath);
      console.log(`\n  💾 Backup created: ${backupPath}`);
      
      // Write converted file
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Converted ${changeCount} patterns`);
      console.log(`\n  ⚠️  IMPORTANT: Review the changes manually!`);
      console.log(`  - Error handling needs to be added`);
      console.log(`  - Complex queries may need manual adjustment`);
      console.log(`  - Test thoroughly before deployment`);
    } else {
      console.log(`  ℹ️  No Prisma patterns found to convert`);
    }
    
  } catch (error) {
    console.error(`\n  ❌ Error: ${error.message}`);
    process.exit(1);
  }
}

function showUsage() {
  console.log(`
Prisma to Supabase File Converter

Usage:
  node convert-file.js <filepath>

Examples:
  node convert-file.js backend/services/userService.js
  node convert-file.js backend/api/articles.js

Note:
  - Creates a .prisma.backup file before converting
  - Only handles simple patterns
  - Manual review is REQUIRED after conversion
  - Add error handling for all Supabase queries

After conversion, you need to:
  1. Add error handling: const { data, error } = await ...
  2. Handle null/undefined results
  3. Test all database operations
  4. Update TypeScript types if needed
`);
}

// Main
if (require.main === module) {
  const filePath = process.argv[2];
  
  if (!filePath) {
    showUsage();
    process.exit(1);
  }
  
  if (!fs.existsSync(filePath)) {
    console.error(`\n❌ Error: File not found: ${filePath}`);
    process.exit(1);
  }
  
  convertFile(filePath);
}

module.exports = { convertFile };
