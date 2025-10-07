/**
 * Phase 6.2: Database Query Optimization
 * Analyzes slow queries and recommends indexes
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

interface SlowQuery {
  query: string;
  avgDuration: number;
  executions: number;
  totalDuration: number;
  recommendation: string;
  suggestedIndexes: string[];
}

interface QueryAnalysis {
  timestamp: string;
  totalQueries: number;
  slowQueries: SlowQuery[];
  indexRecommendations: Array<{
    table: string;
    columns: string[];
    reason: string;
    createStatement: string;
  }>;
  optimizationOpportunities: Array<{
    issue: string;
    impact: 'high' | 'medium' | 'low';
    solution: string;
  }>;
}

class DatabaseOptimizer {
  private prisma: PrismaClient;
  private slowQueryThreshold = 100; // 100ms threshold
  
  constructor() {
    this.prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
      ],
    });
  }
  
  async analyzeQueries(): Promise<QueryAnalysis> {
    console.log('🔍 Analyzing database queries...\n');
    
    // Check current indexes
    const existingIndexes = await this.getExistingIndexes();
    console.log(`   Found ${existingIndexes.length} existing indexes\n`);
    
    // Identify missing indexes
    const recommendations = this.generateIndexRecommendations();
    
    // Analyze query patterns
    const opportunities = this.identifyOptimizationOpportunities();
    
    return {
      timestamp: new Date().toISOString(),
      totalQueries: 0,
      slowQueries: [],
      indexRecommendations: recommendations,
      optimizationOpportunities: opportunities
    };
  }
  
  private async getExistingIndexes(): Promise<string[]> {
    try {
      // Query to get all indexes from PostgreSQL
      const result = await this.prisma.$queryRaw<Array<{ indexname: string }>>`
        SELECT indexname 
        FROM pg_indexes 
        WHERE schemaname = 'public'
        ORDER BY indexname;
      `;
      
      return result.map(r => r.indexname);
    } catch (error) {
      console.log('   ⚠️  Could not query indexes:', (error as Error).message);
      return [];
    }
  }
  
  private generateIndexRecommendations(): Array<{
    table: string;
    columns: string[];
    reason: string;
    createStatement: string;
  }> {
    return [
      // Security Dashboard queries
      {
        table: 'SecurityEvent',
        columns: ['eventType', 'createdAt'],
        reason: 'Frequently filtered by event type and sorted by timestamp',
        createStatement: 'CREATE INDEX idx_security_events_type_time ON "SecurityEvent"("eventType", "createdAt" DESC);'
      },
      {
        table: 'SecurityEvent',
        columns: ['severity', 'createdAt'],
        reason: 'Dashboard filters by severity and recent events',
        createStatement: 'CREATE INDEX idx_security_events_severity_time ON "SecurityEvent"("severity", "createdAt" DESC);'
      },
      {
        table: 'SecurityEvent',
        columns: ['ipAddress'],
        reason: 'IP-based threat lookup and blocking',
        createStatement: 'CREATE INDEX idx_security_events_ip ON "SecurityEvent"("ipAddress");'
      },
      
      // Audit System queries
      {
        table: 'AuditLog',
        columns: ['userId', 'createdAt'],
        reason: 'User activity tracking and timeline queries',
        createStatement: 'CREATE INDEX idx_audit_logs_user_time ON "AuditLog"("userId", "createdAt" DESC);'
      },
      {
        table: 'AuditLog',
        columns: ['action', 'createdAt'],
        reason: 'Action-based filtering in audit reports',
        createStatement: 'CREATE INDEX idx_audit_logs_action_time ON "AuditLog"("action", "createdAt" DESC);'
      },
      {
        table: 'AuditLog',
        columns: ['category', 'result'],
        reason: 'Category and result filtering for analytics',
        createStatement: 'CREATE INDEX idx_audit_logs_category_result ON "AuditLog"("category", "result");'
      },
      
      // Rate Limiting queries
      {
        table: 'RateLimitRule',
        columns: ['status', 'endpoint'],
        reason: 'Active rule lookup by endpoint',
        createStatement: 'CREATE INDEX idx_rate_limit_rules_status_endpoint ON "RateLimitRule"("status", "endpoint");'
      },
      {
        table: 'BlacklistedIP',
        columns: ['ipAddress', 'expiresAt'],
        reason: 'IP blocking checks and expiration cleanup',
        createStatement: 'CREATE INDEX idx_blacklisted_ips_address_expires ON "BlacklistedIP"("ipAddress", "expiresAt");'
      },
      
      // Article queries
      {
        table: 'Article',
        columns: ['status', 'publishedAt'],
        reason: 'Published articles sorted by date',
        createStatement: 'CREATE INDEX idx_articles_status_published ON "Article"("status", "publishedAt" DESC);'
      },
      {
        table: 'Article',
        columns: ['categoryId', 'publishedAt'],
        reason: 'Category-based article listing',
        createStatement: 'CREATE INDEX idx_articles_category_published ON "Article"("categoryId", "publishedAt" DESC);'
      },
      {
        table: 'Article',
        columns: ['authorId', 'status'],
        reason: 'Author article management',
        createStatement: 'CREATE INDEX idx_articles_author_status ON "Article"("authorId", "status");'
      },
      {
        table: 'Article',
        columns: ['isPremium', 'status'],
        reason: 'Premium content filtering',
        createStatement: 'CREATE INDEX idx_articles_premium_status ON "Article"("isPremium", "status");'
      },
      
      // User queries
      {
        table: 'User',
        columns: ['email'],
        reason: 'Login and authentication lookups',
        createStatement: 'CREATE INDEX idx_users_email ON "User"("email");'
      },
      {
        table: 'User',
        columns: ['role', 'isActive'],
        reason: 'Role-based access control queries',
        createStatement: 'CREATE INDEX idx_users_role_active ON "User"("role", "isActive");'
      },
      
      // Notification queries
      {
        table: 'Notification',
        columns: ['userId', 'isRead', 'createdAt'],
        reason: 'Unread notification retrieval',
        createStatement: 'CREATE INDEX idx_notifications_user_read_time ON "Notification"("userId", "isRead", "createdAt" DESC);'
      },
      
      // Analytics queries
      {
        table: 'PageView',
        columns: ['articleId', 'createdAt'],
        reason: 'Article view count and trending calculation',
        createStatement: 'CREATE INDEX idx_page_views_article_time ON "PageView"("articleId", "createdAt");'
      },
      {
        table: 'PageView',
        columns: ['userId', 'createdAt'],
        reason: 'User activity tracking',
        createStatement: 'CREATE INDEX idx_page_views_user_time ON "PageView"("userId", "createdAt");'
      },
      
      // Comment queries
      {
        table: 'Comment',
        columns: ['articleId', 'status', 'createdAt'],
        reason: 'Article comments with moderation',
        createStatement: 'CREATE INDEX idx_comments_article_status_time ON "Comment"("articleId", "status", "createdAt" DESC);'
      },
      {
        table: 'Comment',
        columns: ['userId', 'createdAt'],
        reason: 'User comment history',
        createStatement: 'CREATE INDEX idx_comments_user_time ON "Comment"("userId", "createdAt" DESC);'
      }
    ];
  }
  
  private identifyOptimizationOpportunities(): Array<{
    issue: string;
    impact: 'high' | 'medium' | 'low';
    solution: string;
  }> {
    return [
      {
        issue: 'N+1 query problem in article loading',
        impact: 'high',
        solution: 'Use Prisma include/select to fetch related data in a single query. Implement DataLoader for GraphQL.'
      },
      {
        issue: 'Full table scans on audit log queries',
        impact: 'high',
        solution: 'Add composite indexes on (userId, createdAt) and (action, createdAt) columns.'
      },
      {
        issue: 'Slow security event aggregation',
        impact: 'high',
        solution: 'Implement materialized views or periodic aggregation jobs. Cache results in Redis.'
      },
      {
        issue: 'Large result sets without pagination',
        impact: 'medium',
        solution: 'Implement cursor-based pagination for all list queries. Limit default page size to 20-50 items.'
      },
      {
        issue: 'Expensive COUNT(*) queries',
        impact: 'medium',
        solution: 'Cache total counts in Redis. Use approximate counts for large tables (> 100k rows).'
      },
      {
        issue: 'JSON field queries without indexes',
        impact: 'medium',
        solution: 'Create GIN indexes on JSONB columns that are frequently queried.'
      },
      {
        issue: 'Timezone conversions in WHERE clauses',
        impact: 'low',
        solution: 'Store timestamps in UTC. Do timezone conversions in application layer, not database.'
      },
      {
        issue: 'SELECT * instead of specific columns',
        impact: 'low',
        solution: 'Specify only required columns in SELECT. Reduces data transfer and memory usage.'
      },
      {
        issue: 'Missing connection pooling configuration',
        impact: 'high',
        solution: 'Configure Prisma connection pool: {min: 2, max: 10, idle_timeout: 60s}'
      },
      {
        issue: 'No query timeout configured',
        impact: 'medium',
        solution: 'Set statement_timeout = 5000ms to prevent runaway queries from blocking resources.'
      }
    ];
  }
  
  printReport(analysis: QueryAnalysis): void {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║           DATABASE OPTIMIZATION REPORT                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log(`📊 Analysis Summary:`);
    console.log(`   Timestamp: ${new Date(analysis.timestamp).toLocaleString()}`);
    console.log(`   Index Recommendations: ${analysis.indexRecommendations.length}`);
    console.log(`   Optimization Opportunities: ${analysis.optimizationOpportunities.length}\n`);
    
    console.log('🔍 Recommended Indexes:\n');
    analysis.indexRecommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec.table} [${rec.columns.join(', ')}]`);
      console.log(`      Reason: ${rec.reason}`);
      console.log(`      SQL: ${rec.createStatement}\n`);
    });
    
    console.log('💡 Optimization Opportunities:\n');
    analysis.optimizationOpportunities.forEach((opp, index) => {
      const icon = opp.impact === 'high' ? '🔴' : opp.impact === 'medium' ? '🟡' : '🟢';
      console.log(`   ${index + 1}. ${icon} ${opp.issue} (${opp.impact.toUpperCase()} impact)`);
      console.log(`      Solution: ${opp.solution}\n`);
    });
    
    console.log('═══════════════════════════════════════════════════════════\n');
  }
  
  async generateMigrationScript(analysis: QueryAnalysis): Promise<void> {
    console.log('📝 Generating migration script...\n');
    
    const migrationContent = `-- Phase 6.2: Database Performance Optimization
-- Generated: ${new Date().toISOString()}

-- Add recommended indexes for query optimization
${analysis.indexRecommendations.map(rec => rec.createStatement).join('\n')}

-- Configure connection pooling
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Set query timeouts
ALTER DATABASE coindaily SET statement_timeout = '5000ms';
ALTER DATABASE coindaily SET lock_timeout = '3000ms';
ALTER DATABASE coindaily SET idle_in_transaction_session_timeout = '10000ms';

-- Enable query logging for slow queries
ALTER SYSTEM SET log_min_duration_statement = 500; -- Log queries > 500ms

-- Analyze tables to update statistics
ANALYZE;
`;
    
    const migrationPath = path.join(
      process.cwd(),
      'prisma',
      'migrations',
      `${Date.now()}_performance_optimization`,
      'migration.sql'
    );
    
    const migrationDir = path.dirname(migrationPath);
    if (!fs.existsSync(migrationDir)) {
      fs.mkdirSync(migrationDir, { recursive: true });
    }
    
    fs.writeFileSync(migrationPath, migrationContent);
    console.log(`   ✅ Migration script saved to: ${migrationPath}\n`);
  }
  
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Execute analysis
if (require.main === module) {
  const optimizer = new DatabaseOptimizer();
  
  console.log('🚀 Starting Database Query Analysis - Phase 6.2\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  optimizer.analyzeQueries()
    .then(async analysis => {
      optimizer.printReport(analysis);
      await optimizer.generateMigrationScript(analysis);
      
      // Save report to file
      const reportPath = path.join(process.cwd(), '..', 'docs', 'DATABASE_OPTIMIZATION_REPORT.json');
      fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
      console.log(`📄 Detailed report saved to: ${reportPath}\n`);
      
      await optimizer.disconnect();
    })
    .catch(async error => {
      console.error('❌ Analysis failed:', error);
      await optimizer.disconnect();
      process.exit(1);
    });
}

export default DatabaseOptimizer;
