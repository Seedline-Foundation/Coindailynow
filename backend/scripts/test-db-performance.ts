import { PrismaClient } from '@prisma/client';
import { DatabaseOptimizer } from '../src/services/databaseOptimizer';
import { logger } from '../src/utils/logger';

/**
 * Task 26: Database Performance Test (No Redis Required)
 * 
 * Tests database query optimization for sub-500ms performance
 */

interface TestResult {
  name: string;
  duration: number;
  success: boolean;
  details?: any;
  errorMessage?: string;
}

class DatabasePerformanceTester {
  private prisma: PrismaClient;
  private dbOptimizer: DatabaseOptimizer;
  private results: TestResult[] = [];

  constructor() {
    this.prisma = new PrismaClient();
    this.dbOptimizer = new DatabaseOptimizer(this.prisma, {
      enableQueryLogging: false, // Disable for cleaner output
      enableQueryCache: true,
      maxQueryCacheSize: 100,
    });
  }

  private async runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      const testResult: TestResult = {
        name,
        duration,
        success: true,
        details: result,
      };
      
      this.results.push(testResult);
      console.log(`✅ ${name}: ${duration}ms`);
      return testResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const testResult: TestResult = {
        name,
        duration,
        success: false,
        errorMessage: (error as Error).message,
      };
      
      this.results.push(testResult);
      console.log(`❌ ${name}: ${duration}ms - ${(error as Error).message}`);
      return testResult;
    }
  }

  // Test 1: Basic database connectivity
  private async testDatabaseConnection(): Promise<any> {
    await this.prisma.$queryRaw`SELECT 1 as health`;
    return { connected: true };
  }

  // Test 2: Raw article count (baseline)
  private async testRawArticleCount(): Promise<any> {
    const count = await this.prisma.article.count();
    return { count };
  }

  // Test 3: Basic article query
  private async testBasicArticleQuery(): Promise<any> {
    const articles = await this.prisma.article.findMany({
      take: 10,
      select: {
        id: true,
        title: true,
        slug: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
    });
    return { count: articles.length };
  }

  // Test 4: Optimized article query
  private async testOptimizedArticleQuery(): Promise<any> {
    const articles = await this.dbOptimizer.getArticles({
      limit: 10,
      status: 'PUBLISHED',
    });
    return { count: articles.length };
  }

  // Test 5: Article with relations
  private async testArticleWithRelations(): Promise<any> {
    const articles = await this.dbOptimizer.getArticles({
      limit: 5,
      status: 'PUBLISHED',
      includeTranslations: false,
    });
    return { count: articles.length };
  }

  // Test 6: Single article lookup by slug
  private async testSingleArticleLookup(): Promise<any> {
    // First get a random article slug
    const randomArticle = await this.prisma.article.findFirst({
      select: { slug: true },
      where: { status: 'PUBLISHED' },
    });

    if (!randomArticle) {
      return { found: false, message: 'No published articles found' };
    }

    const article = await this.dbOptimizer.getArticle({
      slug: randomArticle.slug,
      includeContent: false,
    });

    return { found: !!article, slug: randomArticle.slug };
  }

  // Test 7: Categories query
  private async testCategoriesQuery(): Promise<any> {
    const categories = await this.prisma.category.findMany({
      take: 20,
      select: {
        id: true,
        name: true,
        slug: true,
      },
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return { count: categories.length };
  }

  // Test 8: Token queries
  private async testTokenQueries(): Promise<any> {
    const tokens = await this.dbOptimizer.getTokens({
      limit: 10,
      includeMarketData: false,
    });
    return { count: tokens.length };
  }

  // Test 9: User count
  private async testUserCount(): Promise<any> {
    const count = await this.prisma.user.count();
    return { count };
  }

  // Test 10: Complex query with multiple conditions
  private async testComplexQuery(): Promise<any> {
    const articles = await this.prisma.article.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        viewCount: true,
        publishedAt: true,
        User: {
          select: {
            username: true,
          },
        },
        Category: {
          select: {
            name: true,
          },
        },
      },
      where: {
        status: 'PUBLISHED',
        publishedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' },
      ],
    });
    return { count: articles.length };
  }

  // Run all tests
  public async runAllTests(): Promise<void> {
    console.log('🚀 Starting Database Performance Tests...\n');

    await this.runTest('Database Connection', () => this.testDatabaseConnection());
    await this.runTest('Raw Article Count', () => this.testRawArticleCount());
    await this.runTest('Basic Article Query', () => this.testBasicArticleQuery());
    await this.runTest('Optimized Article Query', () => this.testOptimizedArticleQuery());
    await this.runTest('Article with Relations', () => this.testArticleWithRelations());
    await this.runTest('Single Article Lookup', () => this.testSingleArticleLookup());
    await this.runTest('Categories Query', () => this.testCategoriesQuery());
    await this.runTest('Token Queries', () => this.testTokenQueries());
    await this.runTest('User Count', () => this.testUserCount());
    await this.runTest('Complex Query', () => this.testComplexQuery());

    this.generateReport();
  }

  private generateReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 DATABASE PERFORMANCE TEST RESULTS');
    console.log('='.repeat(80));

    const passedTests = this.results.filter(r => r.success).length;
    const totalTests = this.results.length;
    const averageResponseTime = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;

    // Summary
    console.log(`\n✅ Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`⚡ Average Response Time: ${averageResponseTime.toFixed(2)}ms`);
    console.log(`🎯 Sub-500ms Target: ${averageResponseTime < 500 ? '✅ ACHIEVED' : '❌ NOT MET'}`);

    // Performance breakdown
    const fastTests = this.results.filter(r => r.duration < 100);
    const slowTests = this.results.filter(r => r.duration > 500);
    const verySlowTests = this.results.filter(r => r.duration > 1000);

    console.log(`\n📈 Performance Breakdown:`);
    console.log(`🚀 Very Fast (<100ms): ${fastTests.length} tests`);
    console.log(`⚡ Good (100-500ms): ${totalTests - fastTests.length - slowTests.length} tests`);
    console.log(`⚠️  Slow (>500ms): ${slowTests.length} tests`);
    console.log(`🐌 Very Slow (>1000ms): ${verySlowTests.length} tests`);

    if (slowTests.length > 0) {
      console.log(`\n⚠️  Slow tests: ${slowTests.map(t => `${t.name} (${t.duration}ms)`).join(', ')}`);
    }

    // Detailed results
    console.log('\n📋 Detailed Results:');
    console.log('-'.repeat(80));

    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const speed = result.duration < 100 ? '🚀' : result.duration < 500 ? '⚡' : '⚠️';
      
      console.log(`${index + 1}. ${status} ${speed} ${result.name}: ${result.duration}ms`);
      
      if (result.details && typeof result.details === 'object') {
        const summary = Object.entries(result.details)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
        console.log(`   ${summary}`);
      }
    });

    // Recommendations
    console.log('\n💡 Optimization Recommendations:');
    console.log('-'.repeat(40));
    
    if (averageResponseTime < 100) {
      console.log('✅ Excellent database performance!');
      console.log('• Current optimization strategies are working well');
      console.log('• Monitor performance under higher load');
    } else if (averageResponseTime < 500) {
      console.log('✅ Good database performance, meeting sub-500ms target');
      console.log('• Consider adding more specific indexes for complex queries');
      console.log('• Implement query result caching for frequently accessed data');
    } else {
      console.log('⚠️  Database performance needs improvement');
      console.log('• Add database indexes for commonly queried fields');
      console.log('• Optimize complex queries with multiple joins');
      console.log('• Consider database connection pooling');
      console.log('• Implement query caching strategy');
    }

    console.log('\n✨ Task 26: Database Optimization Testing Complete!');
    console.log('='.repeat(80));
  }

  public async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Run the tests
async function main() {
  const tester = new DatabasePerformanceTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    await tester.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { DatabasePerformanceTester };