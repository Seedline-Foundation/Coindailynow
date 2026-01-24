/**
 * Phase 6.2: API Performance Benchmarking
 * Measures response times and identifies slow endpoints
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

interface EndpointBenchmark {
  endpoint: string;
  method: string;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  requestsPerSecond: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  recommendation?: string;
}

interface BenchmarkReport {
  timestamp: string;
  totalEndpoints: number;
  averageResponseTime: number;
  slowestEndpoints: EndpointBenchmark[];
  fastestEndpoints: EndpointBenchmark[];
  criticalEndpoints: EndpointBenchmark[];
  recommendations: string[];
}

class APIBenchmarker {
  private baseUrl = process.env.API_URL || 'http://localhost:4000';
  private authToken = process.env.TEST_AUTH_TOKEN || '';
  private slaTarget = 500; // 500ms SLA requirement
  
  private endpoints = [
    // Authentication
    { endpoint: '/api/auth/login', method: 'POST', authenticated: false },
    { endpoint: '/api/auth/refresh', method: 'POST', authenticated: false },
    
    // Super Admin - Security
    { endpoint: '/api/super-admin/security', method: 'GET', authenticated: true },
    { endpoint: '/api/super-admin/security/threats', method: 'GET', authenticated: true },
    { endpoint: '/api/super-admin/security/vulnerabilities', method: 'GET', authenticated: true },
    
    // Super Admin - Audit
    { endpoint: '/api/super-admin/audit', method: 'GET', authenticated: true },
    { endpoint: '/api/super-admin/audit/analytics', method: 'GET', authenticated: true },
    
    // Super Admin - Accessibility
    { endpoint: '/api/super-admin/accessibility', method: 'GET', authenticated: true },
    
    // Super Admin - Rate Limiting
    { endpoint: '/api/super-admin/rate-limiting', method: 'GET', authenticated: true },
    
    // Content
    { endpoint: '/api/articles', method: 'GET', authenticated: false },
    { endpoint: '/api/articles/trending', method: 'GET', authenticated: false },
    { endpoint: '/api/articles/featured', method: 'GET', authenticated: false },
    
    // Market Data
    { endpoint: '/api/market/prices', method: 'GET', authenticated: false },
    { endpoint: '/api/market/trending', method: 'GET', authenticated: false },
    
    // User Dashboard
    { endpoint: '/api/user/profile', method: 'GET', authenticated: true },
    { endpoint: '/api/user/preferences', method: 'GET', authenticated: true },
  ];
  
  async benchmarkEndpoint(
    endpoint: string, 
    method: string, 
    authenticated: boolean,
    iterations: number = 10
  ): Promise<EndpointBenchmark> {
    const responseTimes: number[] = [];
    
    console.log(`   Testing ${method} ${endpoint}...`);
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        if (authenticated && this.authToken) {
          headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method,
          headers,
          timeout: 5000 // 5 second timeout
        });
        
        const duration = Date.now() - start;
        
        if (response.ok) {
          responseTimes.push(duration);
        } else {
          console.log(`      ⚠️  Request ${i + 1} failed with status ${response.status}`);
        }
      } catch (error) {
        console.log(`      ❌ Request ${i + 1} failed:`, (error as Error).message);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (responseTimes.length === 0) {
      return {
        endpoint,
        method,
        avgResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        requestsPerSecond: 0,
        status: 'critical',
        recommendation: 'Endpoint is not responding - check server status'
      };
    }
    
    const sorted = responseTimes.sort((a, b) => a - b);
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    
    let status: EndpointBenchmark['status'];
    let recommendation: string | undefined;
    
    if (avg < 200) {
      status = 'excellent';
    } else if (avg < this.slaTarget) {
      status = 'good';
    } else if (avg < 1000) {
      status = 'warning';
      recommendation = 'Response time exceeds 500ms SLA - consider optimization';
    } else {
      status = 'critical';
      recommendation = 'Response time exceeds 1s - immediate optimization required';
    }
    
    return {
      endpoint,
      method,
      avgResponseTime: Math.round(avg),
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p50: Math.round(p50),
      p95: Math.round(p95),
      p99: Math.round(p99),
      requestsPerSecond: Math.round(1000 / avg),
      status,
      recommendation
    };
  }
  
  async runBenchmarks(): Promise<BenchmarkReport> {
    console.log('🔍 Running API Performance Benchmarks...\n');
    
    const results: EndpointBenchmark[] = [];
    
    for (const config of this.endpoints) {
      const benchmark = await this.benchmarkEndpoint(
        config.endpoint,
        config.method,
        config.authenticated
      );
      results.push(benchmark);
    }
    
    // Calculate statistics
    const avgResponseTime = Math.round(
      results.reduce((sum, r) => sum + r.avgResponseTime, 0) / results.length
    );
    
    const slowest = [...results]
      .sort((a, b) => b.avgResponseTime - a.avgResponseTime)
      .slice(0, 5);
    
    const fastest = [...results]
      .sort((a, b) => a.avgResponseTime - b.avgResponseTime)
      .slice(0, 5);
    
    const critical = results.filter(r => r.status === 'critical' || r.status === 'warning');
    
    const recommendations = this.generateRecommendations(results);
    
    return {
      timestamp: new Date().toISOString(),
      totalEndpoints: results.length,
      averageResponseTime: avgResponseTime,
      slowestEndpoints: slowest,
      fastestEndpoints: fastest,
      criticalEndpoints: critical,
      recommendations
    };
  }
  
  private generateRecommendations(results: EndpointBenchmark[]): string[] {
    const recommendations: string[] = [];
    
    const slow = results.filter(r => r.avgResponseTime > this.slaTarget);
    const verySlow = results.filter(r => r.avgResponseTime > 1000);
    
    if (verySlow.length > 0) {
      recommendations.push(
        `🔴 CRITICAL: ${verySlow.length} endpoint(s) exceed 1s response time - immediate action required`
      );
    }
    
    if (slow.length > 0) {
      recommendations.push(
        `⚠️  ${slow.length} endpoint(s) exceed 500ms SLA - optimization recommended`
      );
    }
    
    // Check for database query optimization opportunities
    const dbEndpoints = results.filter(r => 
      r.endpoint.includes('/audit') || 
      r.endpoint.includes('/security') ||
      r.endpoint.includes('/analytics')
    );
    
    const slowDb = dbEndpoints.filter(r => r.avgResponseTime > 300);
    if (slowDb.length > 0) {
      recommendations.push(
        `📊 ${slowDb.length} database-heavy endpoint(s) are slow - check query optimization`
      );
    }
    
    // Check for caching opportunities
    const publicEndpoints = results.filter(r => 
      r.endpoint.includes('/articles') || 
      r.endpoint.includes('/market')
    );
    
    const slowPublic = publicEndpoints.filter(r => r.avgResponseTime > 200);
    if (slowPublic.length > 0) {
      recommendations.push(
        `💾 ${slowPublic.length} public endpoint(s) could benefit from Redis caching`
      );
    }
    
    // Check p95/p99 latency
    const highVariance = results.filter(r => (r.p99 - r.p50) > 500);
    if (highVariance.length > 0) {
      recommendations.push(
        `📈 ${highVariance.length} endpoint(s) have high latency variance - investigate connection pooling`
      );
    }
    
    return recommendations;
  }
  
  printReport(report: BenchmarkReport): void {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           API PERFORMANCE BENCHMARK REPORT                ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 Overall Statistics:');
    console.log(`   Total Endpoints Tested: ${report.totalEndpoints}`);
    console.log(`   Average Response Time:  ${report.averageResponseTime}ms`);
    console.log(`   SLA Target:             ${this.slaTarget}ms`);
    console.log(`   SLA Compliance:         ${Math.round((1 - report.criticalEndpoints.length / report.totalEndpoints) * 100)}%\n`);
    
    console.log('🐌 Slowest Endpoints:');
    report.slowestEndpoints.forEach((endpoint, index) => {
      const icon = endpoint.status === 'critical' ? '🔴' : endpoint.status === 'warning' ? '🟡' : '🟢';
      console.log(`   ${index + 1}. ${icon} ${endpoint.method} ${endpoint.endpoint}`);
      console.log(`      Avg: ${endpoint.avgResponseTime}ms | P50: ${endpoint.p50}ms | P95: ${endpoint.p95}ms | P99: ${endpoint.p99}ms`);
      if (endpoint.recommendation) {
        console.log(`      💡 ${endpoint.recommendation}`);
      }
      console.log('');
    });
    
    console.log('⚡ Fastest Endpoints:');
    report.fastestEndpoints.forEach((endpoint, index) => {
      console.log(`   ${index + 1}. 🟢 ${endpoint.method} ${endpoint.endpoint}`);
      console.log(`      Avg: ${endpoint.avgResponseTime}ms | RPS: ${endpoint.requestsPerSecond}\n`);
    });
    
    if (report.criticalEndpoints.length > 0) {
      console.log('🚨 Endpoints Requiring Attention:');
      report.criticalEndpoints.forEach((endpoint, index) => {
        console.log(`   ${index + 1}. ${endpoint.method} ${endpoint.endpoint} - ${endpoint.avgResponseTime}ms`);
      });
      console.log('');
    }
    
    console.log('💡 Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`   ${rec}`);
    });
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════\n');
  }
  
  generateOptimizationPlan(report: BenchmarkReport): void {
    console.log('📋 API OPTIMIZATION PLAN\n');
    
    console.log('Priority 1: Critical Performance Issues');
    report.criticalEndpoints
      .filter(e => e.status === 'critical')
      .forEach((endpoint, index) => {
        console.log(`  ${index + 1}. ${endpoint.method} ${endpoint.endpoint}`);
        console.log(`     Current: ${endpoint.avgResponseTime}ms`);
        console.log(`     Target: <500ms`);
        console.log(`     Actions:`);
        console.log(`       ☐ Profile database queries`);
        console.log(`       ☐ Add missing indexes`);
        console.log(`       ☐ Implement Redis caching`);
        console.log(`       ☐ Optimize data serialization\n`);
      });
    
    console.log('Priority 2: Database Query Optimization');
    console.log('  ☐ Analyze slow queries with EXPLAIN ANALYZE');
    console.log('  ☐ Add composite indexes on frequently queried columns');
    console.log('  ☐ Implement query result caching');
    console.log('  ☐ Use connection pooling (pg-pool)');
    console.log('  ☐ Implement database read replicas\n');
    
    console.log('Priority 3: Caching Implementation');
    console.log('  ☐ Redis for frequently accessed data');
    console.log('  ☐ HTTP cache headers for static content');
    console.log('  ☐ In-memory caching for reference data');
    console.log('  ☐ CDN caching for public endpoints\n');
    
    console.log('Priority 4: Code Optimization');
    console.log('  ☐ Implement data pagination');
    console.log('  ☐ Reduce payload size with field selection');
    console.log('  ☐ Use GraphQL DataLoader for batching');
    console.log('  ☐ Implement response compression (gzip/brotli)\n');
  }
}

// Execute benchmarks
if (require.main === module) {
  const benchmarker = new APIBenchmarker();
  
  console.log('🚀 Starting API Performance Benchmarking - Phase 6.2\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  benchmarker.runBenchmarks()
    .then(report => {
      benchmarker.printReport(report);
      benchmarker.generateOptimizationPlan(report);
      
      // Save report to file
      const reportPath = path.join(process.cwd(), '..', 'docs', 'API_BENCHMARK_REPORT.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📄 Detailed report saved to: ${reportPath}\n`);
    })
    .catch(error => {
      console.error('❌ Benchmark failed:', error);
      process.exit(1);
    });
}

export default APIBenchmarker;
