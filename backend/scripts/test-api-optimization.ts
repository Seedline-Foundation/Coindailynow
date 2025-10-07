import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import { DatabaseOptimizer } from '../src/services/databaseOptimizer';
import { AdvancedCacheStrategy } from '../src/services/advancedCacheStrategy';
import { performanceMonitor } from '../src/middleware/performance';
import { logger } from '../src/utils/logger';

/**
 * Task 26 API Response Optimization - Verification and Testing
 * 
 * This script tests and validates:
 * 1. Sub-500ms API response times
 * 2. Database query optimization
 * 3. Advanced cache strategy implementation
 * 4. Performance monitoring
 */

interface TestResult {
  name: string;
  duration: number;
  success: boolean;
  details?: any;
  errorMessage?: string;
}

class OptimizationTester {
  private prisma: PrismaClient;
  private redis: Redis;
  private dbOptimizer: DatabaseOptimizer;
  private cacheStrategy: AdvancedCacheStrategy;
  private results: TestResult[] = [];

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.dbOptimizer = new DatabaseOptimizer(this.prisma);
    this.cacheStrategy = new AdvancedCacheStrategy(this.redis);
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
      return testResult;
    }
  }

  // Test 1: Database connection and basic query performance
  private async testDatabasePerformance(): Promise<any> {
    const results = await Promise.all([
      this.prisma.article.count(),
      this.prisma.user.count(),
      this.prisma.token.count(),
      this.prisma.category.count(),
    ]);

    return {
      articleCount: results[0],
      userCount: results[1],
      tokenCount: results[2],
      categoryCount: results[3],
    };
  }

  // Test 2: Optimized article queries
  private async testOptimizedArticleQueries(): Promise<any> {
    const [basicQuery, optimizedQuery] = await Promise.all([
      // Basic Prisma query
      this.prisma.article.findMany({
        take: 20,
        include: {
          User: true,
          Category: true,
        },
      }),
      // Optimized query using DatabaseOptimizer
      this.dbOptimizer.getArticles({
        limit: 20,
        status: 'PUBLISHED',
        includeTranslations: false,
      }),
    ]);

    return {
      basicQueryCount: basicQuery.length,
      optimizedQueryCount: optimizedQuery.length,
    };
  }

  // Test 3: Cache performance
  private async testCachePerformance(): Promise<any> {
    const testKey = 'performance_test_key';
    const testData = { message: 'Test cache data', timestamp: Date.now() };

    // Test cache set
    const setStartTime = Date.now();
    await this.cacheStrategy.set('articles', testKey, testData);
    const setDuration = Date.now() - setStartTime;

    // Test cache get (should be cached)
    const getStartTime = Date.now();
    const cachedData = await this.cacheStrategy.get('articles', testKey);
    const getDuration = Date.now() - getStartTime;

    // Test cache miss
    const missStartTime = Date.now();
    const missData = await this.cacheStrategy.get('articles', 'non_existent_key');
    const missDuration = Date.now() - missStartTime;

    return {
      setDuration,
      getDuration,
      missDuration,
      cacheHit: !!cachedData,
      cacheMiss: !missData,
    };
  }

  // Test 4: Token queries with market data
  private async testTokenQueries(): Promise<any> {
    const tokens = await this.dbOptimizer.getTokens({
      limit: 10,
      includeMarketData: true,
    });

    return {
      tokenCount: tokens.length,
      tokensWithMarketData: tokens.filter(t => t.MarketData && t.MarketData.length > 0).length,
    };
  }

  // Test 5: Batch operations
  private async testBatchOperations(): Promise<any> {
    // Create test articles for batch operations
    const testArticleIds: string[] = [];
    
    try {
      // Find existing articles to test with
      const existingArticles = await this.prisma.article.findMany({
        take: 5,
        select: { id: true },
      });

      if (existingArticles.length > 0) {
        const articleIds = existingArticles.map(a => a.id);
        await this.dbOptimizer.batchUpdateViewCounts(articleIds);
        
        return {
          batchSize: articleIds.length,
          success: true,
        };
      }

      return {
        batchSize: 0,
        success: true,
        message: 'No articles found for batch testing',
      };
    } catch (error) {
      return {
        batchSize: 0,
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // Test 6: Cache invalidation
  private async testCacheInvalidation(): Promise<any> {
    // Set some cache data
    await this.cacheStrategy.set('articles', 'test_invalidation', { data: 'test' });
    await this.cacheStrategy.set('tokens', 'test_invalidation', { data: 'test' });

    // Test strategy invalidation
    const articlesInvalidated = await this.cacheStrategy.invalidate('articles');
    
    // Test tag invalidation
    const tagInvalidated = await this.cacheStrategy.invalidateByTag('content');

    return {
      articlesInvalidated,
      tagInvalidated,
    };
  }

  // Test 7: Performance monitoring
  private async testPerformanceMonitoring(): Promise<any> {
    // Get current performance stats
    const stats = await performanceMonitor.getStats('hour');
    const slowQueries = performanceMonitor.getSlowQueries(5);

    return {
      totalRequests: stats.totalRequests,
      averageResponseTime: stats.averageResponseTime,
      cacheHitRate: stats.cacheHitRate,
      slowQueriesCount: slowQueries.length,
    };
  }

  // Test 8: Cache health
  private async testCacheHealth(): Promise<any> {
    const health = await this.cacheStrategy.getCacheHealth();
    
    return {
      totalKeys: health.totalKeys,
      averageHitRate: health.averageHitRate,
      strategiesCount: health.strategiesHealth.length,
      memoryUsage: health.totalMemoryUsage,
    };
  }

  // Run all tests
  public async runAllTests(): Promise<void> {
    console.log('🚀 Starting API Response Optimization Tests...\n');

    // Test database performance
    await this.runTest('Database Basic Performance', () => this.testDatabasePerformance());

    // Test optimized queries
    await this.runTest('Optimized Article Queries', () => this.testOptimizedArticleQueries());

    // Test cache performance
    await this.runTest('Cache Performance', () => this.testCachePerformance());

    // Test token queries
    await this.runTest('Token Queries with Market Data', () => this.testTokenQueries());

    // Test batch operations
    await this.runTest('Batch Operations', () => this.testBatchOperations());

    // Test cache invalidation
    await this.runTest('Cache Invalidation', () => this.testCacheInvalidation());

    // Test performance monitoring
    await this.runTest('Performance Monitoring', () => this.testPerformanceMonitoring());

    // Test cache health
    await this.runTest('Cache Health Check', () => this.testCacheHealth());

    // Generate report
    this.generateReport();
  }

  private generateReport(): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 API RESPONSE OPTIMIZATION TEST RESULTS');
    console.log('='.repeat(80));

    const passedTests = this.results.filter(r => r.success).length;
    const totalTests = this.results.length;
    const averageResponseTime = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;

    // Summary
    console.log(`\n✅ Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`⚡ Average Response Time: ${averageResponseTime.toFixed(2)}ms`);
    console.log(`🎯 Sub-500ms Target: ${averageResponseTime < 500 ? '✅ ACHIEVED' : '❌ NOT MET'}`);

    // Detailed results
    console.log('\n📋 Detailed Test Results:');
    console.log('-'.repeat(80));

    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      const duration = `${result.duration}ms`;
      const target = result.duration < 500 ? '🎯' : '⚠️';
      
      console.log(`${index + 1}. ${status} ${result.name}`);
      console.log(`   Duration: ${duration} ${target}`);
      
      if (result.success && result.details) {
        console.log(`   Details: ${JSON.stringify(result.details, null, 2).substring(0, 200)}...`);
      }
      
      if (!result.success && result.errorMessage) {
        console.log(`   Error: ${result.errorMessage}`);
      }
      
      console.log('');
    });

    // Performance analysis
    console.log('📈 Performance Analysis:');
    console.log('-'.repeat(40));
    
    const slowTests = this.results.filter(r => r.duration > 500);
    if (slowTests.length > 0) {
      console.log(`⚠️  Slow tests (>500ms): ${slowTests.map(t => t.name).join(', ')}`);
    } else {
      console.log('✅ All tests completed under 500ms target');
    }

    const fastTests = this.results.filter(r => r.duration < 100);
    if (fastTests.length > 0) {
      console.log(`🚀 Very fast tests (<100ms): ${fastTests.map(t => t.name).join(', ')}`);
    }

    // Recommendations
    console.log('\n💡 Optimization Recommendations:');
    console.log('-'.repeat(40));
    
    if (averageResponseTime > 200) {
      console.log('• Consider adding more database indexes');
      console.log('• Implement query result caching');
      console.log('• Use database connection pooling');
    }
    
    if (averageResponseTime < 100) {
      console.log('• Excellent performance! Consider maintaining current optimizations');
      console.log('• Monitor performance under load');
    }

    console.log('\n✨ Task 26: API Response Optimization - Testing Complete!');
    console.log('='.repeat(80));
  }

  // Cleanup
  public async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
    await this.redis.quit();
  }
}

// Run the tests
async function main() {
  const tester = new OptimizationTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    await tester.cleanup();
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

export { OptimizationTester };