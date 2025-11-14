import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { FinancePerformanceMonitor } from '../../src/services/finance/FinancePerformanceMonitor';

describe('Finance Load Testing Suite', () => {
  let prisma: PrismaClient;
  let performanceMonitor: FinancePerformanceMonitor;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
    });
    
    performanceMonitor = new FinancePerformanceMonitor(prisma);
    
    // Clean up test data - remove all transactions for testing
    // (In a real test environment, you'd have a dedicated test database)
  });

  afterAll(async () => {
    await performanceMonitor.stopMonitoring();
    await prisma.$disconnect();
  });

  describe('High Volume Transaction Load Tests', () => {
    test('should handle 1000 concurrent transfer transactions', async () => {
      const config = {
        duration: 60, // 1 minute
        concurrentUsers: 100,
        transactionsPerUser: 10,
        rampUpTime: 10,
        testScenarios: [
          {
            name: 'High Volume Transfers',
            weight: 100,
            operations: [
              {
                type: 'TRANSFER' as const,
                frequency: 20, // 20 per minute per user
                payload: {
                  amount: 100,
                  fromUserId: 'test-user-1',
                  toUserId: 'test-user-2',
                },
              },
            ],
          },
        ],
      };

      const result = await performanceMonitor.runLoadTest(config);

      expect(result.testId).toBeDefined();
      expect(result.totalTransactions).toBeGreaterThan(500);
      expect(result.successfulTransactions).toBeGreaterThan(result.totalTransactions * 0.95); // 95% success rate
      expect(result.averageResponseTime).toBeLessThan(1000); // Under 1 second
      expect(result.peakThroughput).toBeGreaterThan(5); // At least 5 TPS
    }, 120000); // 2 minute timeout

    test('should handle mixed transaction types under load', async () => {
      const config = {
        duration: 120, // 2 minutes
        concurrentUsers: 50,
        transactionsPerUser: 20,
        rampUpTime: 20,
        testScenarios: [
          {
            name: 'Mixed Operations',
            weight: 100,
            operations: [
              {
                type: 'TRANSFER' as const,
                frequency: 15,
                payload: { amount: 50 },
              },
              {
                type: 'STAKE' as const,
                frequency: 8,
                payload: { amount: 200, duration: 30 },
              },
              {
                type: 'CONVERSION' as const,
                frequency: 5,
                payload: { ceAmount: 1000 },
              },
              {
                type: 'REWARD' as const,
                frequency: 3,
                payload: { amount: 25 },
              },
            ],
          },
        ],
      };

      const result = await performanceMonitor.runLoadTest(config);

      expect(result.totalTransactions).toBeGreaterThan(800);
      expect(result.averageResponseTime).toBeLessThan(1500);
      expect(result.failedTransactions / result.totalTransactions).toBeLessThan(0.1); // Less than 10% failure rate
    }, 180000); // 3 minute timeout

    test('should maintain performance under sustained high load', async () => {
      const config = {
        duration: 300, // 5 minutes
        concurrentUsers: 200,
        transactionsPerUser: 50,
        rampUpTime: 60,
        testScenarios: [
          {
            name: 'Sustained Load',
            weight: 100,
            operations: [
              {
                type: 'TRANSFER' as const,
                frequency: 10,
                payload: { amount: 75 },
              },
            ],
          },
        ],
      };

      const result = await performanceMonitor.runLoadTest(config);

      // Analyze performance metrics over time
      const earlyMetrics = result.performanceMetrics.slice(0, 5);
      const lateMetrics = result.performanceMetrics.slice(-5);

      const earlyAvgResponseTime = earlyMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / earlyMetrics.length;
      const lateAvgResponseTime = lateMetrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / lateMetrics.length;

      // Response time shouldn't degrade by more than 50%
      expect(lateAvgResponseTime).toBeLessThan(earlyAvgResponseTime * 1.5);
      
      // Overall performance should still be acceptable
      expect(result.averageResponseTime).toBeLessThan(2000);
      expect(result.peakThroughput).toBeGreaterThan(10);
    }, 360000); // 6 minute timeout
  });

  describe('Memory and Resource Stress Tests', () => {
    test('should handle large transaction payloads', async () => {
      const config = {
        duration: 60,
        concurrentUsers: 20,
        transactionsPerUser: 10,
        rampUpTime: 10,
        testScenarios: [
          {
            name: 'Large Payloads',
            weight: 100,
            operations: [
              {
                type: 'TRANSFER' as const,
                frequency: 5,
                payload: {
                  amount: 10000,
                  metadata: {
                    description: 'A'.repeat(1000), // Large metadata
                    tags: Array(100).fill('test-tag'),
                    references: Array(50).fill({ id: 'ref-id', type: 'reference' }),
                  },
                },
              },
            ],
          },
        ],
      };

      const result = await performanceMonitor.runLoadTest(config);
      
      expect(result.successfulTransactions).toBeGreaterThan(result.totalTransactions * 0.9);
      expect(result.averageResponseTime).toBeLessThan(3000); // Allow more time for large payloads
    }, 120000);

    test('should handle memory-intensive operations', async () => {
      // Start monitoring to track memory usage
      await performanceMonitor.startMonitoring(5000);
      
      const config = {
        duration: 90,
        concurrentUsers: 30,
        transactionsPerUser: 15,
        rampUpTime: 15,
        testScenarios: [
          {
            name: 'Memory Intensive',
            weight: 100,
            operations: [
              {
                type: 'CONVERSION' as const,
                frequency: 8,
                payload: {
                  ceAmount: 5000,
                  batchSize: 100, // Process in batches
                },
              },
            ],
          },
        ],
      };

      const result = await performanceMonitor.runLoadTest(config);
      
      // Check memory usage didn't spike too high
      const maxMemoryUsage = Math.max(...result.performanceMetrics.map(m => m.memoryUsage));
      expect(maxMemoryUsage).toBeLessThan(2000); // Less than 2GB
      
      await performanceMonitor.stopMonitoring();
    }, 150000);
  });

  describe('Error Handling and Recovery Tests', () => {
    test('should gracefully handle database connection issues', async () => {
      // Simulate connection pool exhaustion
      const config = {
        duration: 30,
        concurrentUsers: 200, // Very high concurrency
        transactionsPerUser: 5,
        rampUpTime: 5,
        testScenarios: [
          {
            name: 'Connection Stress',
            weight: 100,
            operations: [
              {
                type: 'TRANSFER' as const,
                frequency: 20,
                payload: { amount: 10 },
              },
            ],
          },
        ],
      };

      const result = await performanceMonitor.runLoadTest(config);
      
      // System should handle connection issues gracefully
      expect(result.totalTransactions).toBeGreaterThan(0);
      
      // Even with some failures, most should succeed
      const successRate = result.successfulTransactions / result.totalTransactions;
      expect(successRate).toBeGreaterThan(0.7); // At least 70% success rate
    }, 60000);

    test('should recover from temporary service disruptions', async () => {
      const config = {
        duration: 120,
        concurrentUsers: 50,
        transactionsPerUser: 20,
        rampUpTime: 20,
        testScenarios: [
          {
            name: 'Recovery Test',
            weight: 100,
            operations: [
              {
                type: 'TRANSFER' as const,
                frequency: 12,
                payload: { amount: 50 },
              },
            ],
          },
        ],
      };

      const result = await performanceMonitor.runLoadTest(config);
      
      // Analyze error distribution
      const errorsByType = new Map<string, number>();
      result.errorBreakdown.forEach(error => {
        errorsByType.set(error.error, error.count);
      });

      // No single error type should dominate
      for (const [, count] of errorsByType) {
        expect(count / result.totalTransactions).toBeLessThan(0.3); // No error type > 30%
      }
    }, 180000);
  });

  describe('Performance Benchmarking', () => {
    test('should meet minimum performance SLAs', async () => {
      const config = {
        duration: 60,
        concurrentUsers: 100,
        transactionsPerUser: 10,
        rampUpTime: 10,
        testScenarios: [
          {
            name: 'SLA Benchmark',
            weight: 100,
            operations: [
              {
                type: 'TRANSFER' as const,
                frequency: 15,
                payload: { amount: 100 },
              },
            ],
          },
        ],
      };

      const result = await performanceMonitor.runLoadTest(config);
      
      // SLA requirements
      expect(result.averageResponseTime).toBeLessThan(500); // < 500ms average
      expect(result.peakThroughput).toBeGreaterThan(15); // > 15 TPS peak
      expect(result.successfulTransactions / result.totalTransactions).toBeGreaterThan(0.99); // > 99% success
      
      // P95 response time should be under 1 second
      // (This would require collecting individual response times in a real implementation)
      expect(result.averageResponseTime * 1.5).toBeLessThan(1000); // Approximate P95
    }, 120000);

    test('should scale linearly with user count', async () => {
      const testCases = [
        { users: 25, expectedMinThroughput: 5 },
        { users: 50, expectedMinThroughput: 10 },
        { users: 100, expectedMinThroughput: 20 },
      ];

      const results = [];

      for (const testCase of testCases) {
        const config = {
          duration: 30,
          concurrentUsers: testCase.users,
          transactionsPerUser: 10,
          rampUpTime: 5,
          testScenarios: [
            {
              name: 'Scaling Test',
              weight: 100,
              operations: [
                {
                  type: 'TRANSFER' as const,
                  frequency: 15,
                  payload: { amount: 50 },
                },
              ],
            },
          ],
        };

        const result = await performanceMonitor.runLoadTest(config);
        results.push({
          users: testCase.users,
          throughput: result.peakThroughput,
          responseTime: result.averageResponseTime,
        });

        expect(result.peakThroughput).toBeGreaterThan(testCase.expectedMinThroughput);
      }

      // Throughput should increase with user count (within reason)
      expect(results[1]!.throughput).toBeGreaterThan(results[0]!.throughput);
      expect(results[2]!.throughput).toBeGreaterThan(results[1]!.throughput);
    }, 300000);
  });

  describe('Concurrent Operation Stress Tests', () => {
    test('should handle simultaneous staking and unstaking operations', async () => {
      const config = {
        duration: 90,
        concurrentUsers: 60,
        transactionsPerUser: 15,
        rampUpTime: 15,
        testScenarios: [
          {
            name: 'Staking Stress',
            weight: 50,
            operations: [
              {
                type: 'STAKE' as const,
                frequency: 10,
                payload: { amount: 500, duration: 30 },
              },
            ],
          },
          {
            name: 'Reward Distribution Stress',
            weight: 50,
            operations: [
              {
                type: 'REWARD' as const,
                frequency: 8,
                payload: { amount: 250 },
              },
            ],
          },
        ],
      };

      const result = await performanceMonitor.runLoadTest(config);
      
      expect(result.successfulTransactions).toBeGreaterThan(result.totalTransactions * 0.95);
      expect(result.averageResponseTime).toBeLessThan(1000);
    }, 150000);

    test('should handle bulk conversion operations', async () => {
      const config = {
        duration: 60,
        concurrentUsers: 40,
        transactionsPerUser: 20,
        rampUpTime: 10,
        testScenarios: [
          {
            name: 'Bulk Conversions',
            weight: 100,
            operations: [
              {
                type: 'CONVERSION' as const,
                frequency: 12,
                payload: {
                  ceAmount: 2000,
                  batchProcessing: true,
                },
              },
            ],
          },
        ],
      };

      const result = await performanceMonitor.runLoadTest(config);
      
      expect(result.averageResponseTime).toBeLessThan(2000); // Allow more time for bulk operations
      expect(result.successfulTransactions / result.totalTransactions).toBeGreaterThan(0.9);
    }, 120000);
  });
});