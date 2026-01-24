/**
 * Phase 6.2: Performance Optimization
 * Bundle size analysis and optimization recommendations
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  files: Array<{
    name: string;
    size: number;
    gzipped: number;
    percentage: number;
  }>;
  recommendations: string[];
  optimization_opportunities: Array<{
    file: string;
    current_size: string;
    potential_savings: string;
    action: string;
  }>;
}

class BundleAnalyzer {
  private buildDir = path.join(process.cwd(), '.next');
  private targetBudget = 244; // 244KB for initial bundle (Google's recommendation)
  
  analyzeBundleSize(): BundleAnalysis {
    console.log('🔍 Analyzing bundle size...\n');
    
    const analysis: BundleAnalysis = {
      totalSize: 0,
      gzippedSize: 0,
      files: [],
      recommendations: [],
      optimization_opportunities: []
    };
    
    // Check if build exists
    if (!fs.existsSync(this.buildDir)) {
      console.log('⚠️  No build found. Running production build...\n');
      try {
        execSync('npm run build', { stdio: 'inherit', cwd: path.join(process.cwd()) });
      } catch (error) {
        console.error('❌ Build failed:', error);
        return analysis;
      }
    }
    
    // Analyze JavaScript bundles
    const staticDir = path.join(this.buildDir, 'static', 'chunks');
    if (fs.existsSync(staticDir)) {
      const files = this.getFilesSorted(staticDir);
      
      files.forEach(file => {
        const stats = fs.statSync(file);
        const size = stats.size;
        const gzipped = this.estimateGzipSize(size);
        const percentage = (gzipped / this.targetBudget) * 100;
        
        analysis.files.push({
          name: path.relative(this.buildDir, file),
          size,
          gzipped,
          percentage
        });
        
        analysis.totalSize += size;
        analysis.gzippedSize += gzipped;
      });
    }
    
    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);
    analysis.optimization_opportunities = this.identifyOptimizations(analysis);
    
    return analysis;
  }
  
  private getFilesSorted(dir: string): string[] {
    const files: string[] = [];
    
    const scan = (directory: string) => {
      const items = fs.readdirSync(directory);
      
      items.forEach(item => {
        const fullPath = path.join(directory, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          scan(fullPath);
        } else if (item.endsWith('.js')) {
          files.push(fullPath);
        }
      });
    };
    
    if (fs.existsSync(dir)) {
      scan(dir);
    }
    
    return files.sort((a, b) => {
      const sizeA = fs.statSync(a).size;
      const sizeB = fs.statSync(b).size;
      return sizeB - sizeA;
    });
  }
  
  private estimateGzipSize(size: number): number {
    // Approximate gzip compression ratio (typically 70-80% compression)
    return Math.round(size * 0.3);
  }
  
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
  
  private generateRecommendations(analysis: BundleAnalysis): string[] {
    const recommendations: string[] = [];
    
    // Check total bundle size
    if (analysis.gzippedSize > this.targetBudget * 1024) {
      recommendations.push(
        `⚠️  Total bundle size (${this.formatBytes(analysis.gzippedSize)}) exceeds recommended 244KB budget`
      );
    }
    
    // Check for large individual chunks
    const largeChunks = analysis.files.filter(f => f.gzipped > 100 * 1024);
    if (largeChunks.length > 0) {
      recommendations.push(
        `🔴 Found ${largeChunks.length} chunk(s) larger than 100KB - consider code splitting`
      );
    }
    
    // Check for duplicate dependencies
    const potentialDuplicates = this.checkForDuplicates(analysis.files);
    if (potentialDuplicates.length > 0) {
      recommendations.push(
        `📦 Potential duplicate dependencies detected - consider using webpack aliases`
      );
    }
    
    // Performance budget recommendations
    if (analysis.gzippedSize < this.targetBudget * 1024) {
      recommendations.push(
        `✅ Bundle size is within budget (${this.formatBytes(analysis.gzippedSize)} / 244KB)`
      );
    }
    
    return recommendations;
  }
  
  private checkForDuplicates(files: BundleAnalysis['files']): string[] {
    const fileNames = files.map(f => f.name.toLowerCase());
    const duplicates = fileNames.filter((name, index) => 
      fileNames.indexOf(name) !== index
    );
    return Array.from(new Set(duplicates));
  }
  
  private identifyOptimizations(analysis: BundleAnalysis): Array<{
    file: string;
    current_size: string;
    potential_savings: string;
    action: string;
  }> {
    const opportunities: Array<{
      file: string;
      current_size: string;
      potential_savings: string;
      action: string;
    }> = [];
    
    // Identify large vendor chunks
    const vendorChunks = analysis.files.filter(f => 
      f.name.includes('vendor') || f.name.includes('node_modules')
    );
    
    vendorChunks.forEach(chunk => {
      if (chunk.gzipped > 200 * 1024) {
        opportunities.push({
          file: chunk.name,
          current_size: this.formatBytes(chunk.gzipped),
          potential_savings: this.formatBytes(chunk.gzipped * 0.3),
          action: 'Split into smaller chunks using dynamic imports'
        });
      }
    });
    
    // Identify framework chunks
    const frameworkChunks = analysis.files.filter(f => 
      f.name.includes('framework') || f.name.includes('react')
    );
    
    frameworkChunks.forEach(chunk => {
      if (chunk.gzipped > 150 * 1024) {
        opportunities.push({
          file: chunk.name,
          current_size: this.formatBytes(chunk.gzipped),
          potential_savings: this.formatBytes(chunk.gzipped * 0.2),
          action: 'Enable React production mode and tree shaking'
        });
      }
    });
    
    // Identify page bundles
    const pageChunks = analysis.files.filter(f => 
      f.name.includes('pages/')
    );
    
    pageChunks.forEach(chunk => {
      if (chunk.gzipped > 50 * 1024) {
        opportunities.push({
          file: chunk.name,
          current_size: this.formatBytes(chunk.gzipped),
          potential_savings: this.formatBytes(chunk.gzipped * 0.4),
          action: 'Implement lazy loading for heavy components'
        });
      }
    });
    
    return opportunities;
  }
  
  printReport(analysis: BundleAnalysis): void {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           BUNDLE SIZE ANALYSIS REPORT                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 Overall Statistics:');
    console.log(`   Total Size (uncompressed): ${this.formatBytes(analysis.totalSize)}`);
    console.log(`   Total Size (gzipped):      ${this.formatBytes(analysis.gzippedSize)}`);
    console.log(`   Target Budget:             244 KB`);
    console.log(`   Budget Usage:              ${Math.round((analysis.gzippedSize / (244 * 1024)) * 100)}%\n`);
    
    console.log('📦 Top 10 Largest Chunks:');
    analysis.files.slice(0, 10).forEach((file, index) => {
      const status = file.gzipped > 100 * 1024 ? '🔴' : file.gzipped > 50 * 1024 ? '🟡' : '🟢';
      console.log(`   ${index + 1}. ${status} ${file.name}`);
      console.log(`      Size: ${this.formatBytes(file.size)} → ${this.formatBytes(file.gzipped)} (gzipped)`);
      console.log(`      Budget: ${file.percentage.toFixed(1)}% of recommended\n`);
    });
    
    console.log('💡 Recommendations:');
    analysis.recommendations.forEach(rec => {
      console.log(`   ${rec}`);
    });
    console.log('');
    
    if (analysis.optimization_opportunities.length > 0) {
      console.log('🎯 Optimization Opportunities:\n');
      analysis.optimization_opportunities.forEach((opp, index) => {
        console.log(`   ${index + 1}. ${opp.file}`);
        console.log(`      Current: ${opp.current_size}`);
        console.log(`      Potential Savings: ${opp.potential_savings}`);
        console.log(`      Action: ${opp.action}\n`);
      });
    }
    
    console.log('═══════════════════════════════════════════════════════════\n');
  }
  
  generateOptimizationPlan(): void {
    console.log('📋 OPTIMIZATION PLAN\n');
    console.log('Phase 6.2.1: Code Splitting & Lazy Loading');
    console.log('  ☐ Implement dynamic imports for dashboard routes');
    console.log('  ☐ Lazy load heavy components (charts, editors)');
    console.log('  ☐ Split vendor chunks by usage frequency');
    console.log('  ☐ Implement route-based code splitting\n');
    
    console.log('Phase 6.2.2: Tree Shaking & Dead Code Elimination');
    console.log('  ☐ Enable webpack tree shaking');
    console.log('  ☐ Remove unused imports and dependencies');
    console.log('  ☐ Use ES6 modules instead of CommonJS');
    console.log('  ☐ Configure babel to preserve ES6 imports\n');
    
    console.log('Phase 6.2.3: Dependency Optimization');
    console.log('  ☐ Replace moment.js with date-fns (if used)');
    console.log('  ☐ Use lightweight alternatives for heavy libraries');
    console.log('  ☐ Remove duplicate dependencies');
    console.log('  ☐ Implement webpack aliases for common modules\n');
    
    console.log('Phase 6.2.4: Image & Asset Optimization');
    console.log('  ☐ Implement Next.js Image component');
    console.log('  ☐ Use WebP format with fallbacks');
    console.log('  ☐ Lazy load images below the fold');
    console.log('  ☐ Implement progressive image loading\n');
    
    console.log('Phase 6.2.5: Caching Strategy');
    console.log('  ☐ Configure aggressive cache headers');
    console.log('  ☐ Implement service worker for offline caching');
    console.log('  ☐ Use CDN for static assets');
    console.log('  ☐ Enable HTTP/2 server push\n');
  }
}

// Execute analysis
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  
  console.log('🚀 Starting Performance Optimization - Phase 6.2\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  const analysis = analyzer.analyzeBundleSize();
  analyzer.printReport(analysis);
  analyzer.generateOptimizationPlan();
  
  // Save report to file
  const reportPath = path.join(process.cwd(), 'docs', 'BUNDLE_ANALYSIS_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}\n`);
}

export default BundleAnalyzer;
