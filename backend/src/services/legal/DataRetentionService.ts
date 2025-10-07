/**
 * Data Retention Service
 * Task 30: FR-1395 Data Retention Policies
 * 
 * Manages automated data retention and deletion policies
 * Supports GDPR Article 5(1)(e), CCPA, POPIA requirements
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { logger } from '../../utils/logger';
import { DataRetentionPolicy } from './LegalComplianceOrchestrator';

export interface RetentionRule {
  id: string;
  name: string;
  description: string;
  dataCategory: string;
  tableName: string;
  retentionPeriod: number; // days
  deletionMethod: 'hard_delete' | 'soft_delete' | 'anonymization' | 'pseudonymization';
  triggers: RetentionTrigger[];
  conditions: RetentionCondition[];
  exceptions: RetentionException[];
  notificationRules: NotificationRule[];
  isActive: boolean;
  priority: number;
  framework: string[];
  lastExecuted?: Date;
  nextExecution?: Date;
}

export interface RetentionTrigger {
  type: 'time_based' | 'event_based' | 'manual';
  schedule?: string; // cron expression for time-based
  event?: string; // event name for event-based
  parameters?: Record<string, any>;
}

export interface RetentionCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface RetentionException {
  reason: string;
  condition: RetentionCondition[];
  extendedRetention: number; // additional days
  requiresApproval: boolean;
  approver?: string;
}

export interface NotificationRule {
  type: 'before_deletion' | 'after_deletion' | 'retention_exceeded';
  recipients: string[];
  leadTime: number; // days before deletion
  template: string;
  channels: ('email' | 'slack' | 'webhook')[];
}

export interface RetentionExecution {
  id: string;
  ruleId: string;
  executionDate: Date;
  recordsEvaluated: number;
  recordsDeleted: number;
  recordsAnonymized: number;
  recordsRetained: number;
  errors: string[];
  duration: number; // milliseconds
  status: 'completed' | 'failed' | 'partial';
  dryRun: boolean;
}

export interface DataLifecycleEvent {
  id: string;
  recordId: string;
  dataCategory: string;
  eventType: 'created' | 'accessed' | 'modified' | 'retention_extended' | 'marked_for_deletion' | 'deleted';
  timestamp: Date;
  userId?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

export class DataRetentionService {
  private readonly RETENTION_CACHE_TTL = 3600; // 1 hour
  private readonly RETENTION_PREFIX = 'retention:';
  
  private retentionRules: Map<string, RetentionRule> = new Map();
  private executionHistory: Map<string, RetentionExecution[]> = new Map();

  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {
    this.initializeRetentionRules();
    this.startPeriodicExecution();
  }

  /**
   * Initialize retention rules for different data categories
   */
  private async initializeRetentionRules(): Promise<void> {
    const rules: RetentionRule[] = [
      // User Activity Data
      {
        id: 'user_activity_retention',
        name: 'User Activity Data Retention',
        description: 'Retain user activity logs for analytics and security',
        dataCategory: 'user_activity',
        tableName: 'user_activities',
        retentionPeriod: 730, // 2 years
        deletionMethod: 'anonymization',
        framework: ['GDPR', 'CCPA', 'POPIA'],
        isActive: true,
        priority: 1,
        triggers: [
          {
            type: 'time_based',
            schedule: '0 2 * * *' // Daily at 2 AM
          }
        ],
        conditions: [
          {
            field: 'created_at',
            operator: 'less_than',
            value: '730_days_ago'
          }
        ],
        exceptions: [
          {
            reason: 'Legal investigation',
            condition: [
              {
                field: 'legal_hold',
                operator: 'equals',
                value: true
              }
            ],
            extendedRetention: 1095, // 3 years total
            requiresApproval: true
          }
        ],
        notificationRules: [
          {
            type: 'before_deletion',
            recipients: ['admin@coindaily.com'],
            leadTime: 7,
            template: 'retention_warning',
            channels: ['email']
          }
        ]
      },

      // Session Data
      {
        id: 'session_data_retention',
        name: 'Session Data Retention',
        description: 'Clean up expired session data',
        dataCategory: 'session_data',
        tableName: 'sessions',
        retentionPeriod: 30, // 30 days
        deletionMethod: 'hard_delete',
        framework: ['GDPR', 'CCPA'],
        isActive: true,
        priority: 2,
        triggers: [
          {
            type: 'time_based',
            schedule: '0 3 * * *' // Daily at 3 AM
          }
        ],
        conditions: [
          {
            field: 'last_activity',
            operator: 'less_than',
            value: '30_days_ago'
          }
        ],
        exceptions: [],
        notificationRules: []
      },

      // Email Marketing Data
      {
        id: 'email_marketing_retention',
        name: 'Email Marketing Data Retention',
        description: 'Retain email marketing data for campaign analysis',
        dataCategory: 'marketing_data',
        tableName: 'email_campaigns',
        retentionPeriod: 1095, // 3 years
        deletionMethod: 'pseudonymization',
        framework: ['GDPR', 'CCPA'],
        isActive: true,
        priority: 3,
        triggers: [
          {
            type: 'time_based',
            schedule: '0 1 1 * *' // Monthly on 1st at 1 AM
          }
        ],
        conditions: [
          {
            field: 'sent_at',
            operator: 'less_than',
            value: '1095_days_ago'
          }
        ],
        exceptions: [
          {
            reason: 'Active subscription',
            condition: [
              {
                field: 'user_subscribed',
                operator: 'equals',
                value: true
              }
            ],
            extendedRetention: 365, // 1 additional year
            requiresApproval: false
          }
        ],
        notificationRules: [
          {
            type: 'before_deletion',
            recipients: ['marketing@coindaily.com'],
            leadTime: 30,
            template: 'marketing_data_retention',
            channels: ['email']
          }
        ]
      },

      // Financial Transaction Data
      {
        id: 'financial_transaction_retention',
        name: 'Financial Transaction Data Retention',
        description: 'Retain financial data for regulatory compliance',
        dataCategory: 'financial_data',
        tableName: 'mobile_money_transactions',
        retentionPeriod: 2555, // 7 years (regulatory requirement)
        deletionMethod: 'pseudonymization',
        framework: ['AML', 'PCI_DSS', 'GDPR'],
        isActive: true,
        priority: 4,
        triggers: [
          {
            type: 'time_based',
            schedule: '0 0 1 1 *' // Annually on Jan 1st
          }
        ],
        conditions: [
          {
            field: 'transaction_date',
            operator: 'less_than',
            value: '2555_days_ago'
          }
        ],
        exceptions: [
          {
            reason: 'Regulatory investigation',
            condition: [
              {
                field: 'under_investigation',
                operator: 'equals',
                value: true
              }
            ],
            extendedRetention: 1825, // 5 additional years
            requiresApproval: true,
            approver: 'compliance@coindaily.com'
          }
        ],
        notificationRules: [
          {
            type: 'before_deletion',
            recipients: ['compliance@coindaily.com', 'finance@coindaily.com'],
            leadTime: 90,
            template: 'financial_data_retention',
            channels: ['email', 'slack']
          }
        ]
      },

      // Content Analytics Data
      {
        id: 'content_analytics_retention',
        name: 'Content Analytics Data Retention',
        description: 'Retain content performance analytics',
        dataCategory: 'analytics_data',
        tableName: 'content_analytics',
        retentionPeriod: 1095, // 3 years
        deletionMethod: 'anonymization',
        framework: ['GDPR', 'CCPA'],
        isActive: true,
        priority: 5,
        triggers: [
          {
            type: 'time_based',
            schedule: '0 4 1 * *' // Monthly on 1st at 4 AM
          }
        ],
        conditions: [
          {
            field: 'recorded_at',
            operator: 'less_than',
            value: '1095_days_ago'
          }
        ],
        exceptions: [],
        notificationRules: []
      }
    ];

    for (const rule of rules) {
      this.retentionRules.set(rule.id, rule);
    }

    logger.info('Data retention rules initialized', {
      count: rules.length,
      categories: Array.from(new Set(rules.map(r => r.dataCategory)))
    });
  }

  /**
   * Execute retention policy for a specific rule
   */
  async executeRetentionRule(
    ruleId: string,
    dryRun: boolean = false
  ): Promise<RetentionExecution> {
    const startTime = Date.now();
    const rule = this.retentionRules.get(ruleId);
    
    if (!rule) {
      throw new Error(`Retention rule not found: ${ruleId}`);
    }

    const execution: RetentionExecution = {
      id: `exec_${ruleId}_${Date.now()}`,
      ruleId,
      executionDate: new Date(),
      recordsEvaluated: 0,
      recordsDeleted: 0,
      recordsAnonymized: 0,
      recordsRetained: 0,
      errors: [],
      duration: 0,
      status: 'completed',
      dryRun
    };

    try {
      logger.info('Starting retention rule execution', { ruleId, dryRun });

      // Send pre-deletion notifications
      if (!dryRun) {
        await this.sendPreDeletionNotifications(rule);
      }

      // Get records to evaluate
      const records = await this.getRecordsForEvaluation(rule);
      execution.recordsEvaluated = records.length;

      // Process each record
      for (const record of records) {
        try {
          const shouldDelete = await this.evaluateRecord(record, rule);
          
          if (shouldDelete) {
            if (!dryRun) {
              await this.processRecordDeletion(record, rule);
            }
            
            switch (rule.deletionMethod) {
              case 'hard_delete':
              case 'soft_delete':
                execution.recordsDeleted++;
                break;
              case 'anonymization':
              case 'pseudonymization':
                execution.recordsAnonymized++;
                break;
            }
          } else {
            execution.recordsRetained++;
          }

          // Log lifecycle event
          await this.logLifecycleEvent(record, 'retention_evaluation', rule);

        } catch (error) {
          execution.errors.push(`Record ${record.id}: ${(error as Error).message}`);
          logger.warn('Failed to process record for retention', {
            recordId: record.id,
            ruleId,
            error: (error as Error).message
          });
        }
      }

      // Update rule execution timestamp
      rule.lastExecuted = new Date();
      const nextExecTime = this.calculateNextExecution(rule);
      if (nextExecTime) {
        rule.nextExecution = nextExecTime;
      }

      // Send post-deletion notifications
      if (!dryRun && execution.recordsDeleted > 0) {
        await this.sendPostDeletionNotifications(rule, execution);
      }

    } catch (error) {
      execution.status = 'failed';
      execution.errors.push((error as Error).message);
      logger.error('Retention rule execution failed', { ruleId, error });
    }

    execution.duration = Date.now() - startTime;
    
    // Store execution history
    await this.storeExecutionHistory(execution);

    logger.info('Retention rule execution completed', {
      ruleId,
      duration: execution.duration,
      recordsEvaluated: execution.recordsEvaluated,
      recordsDeleted: execution.recordsDeleted,
      recordsAnonymized: execution.recordsAnonymized,
      recordsRetained: execution.recordsRetained,
      errors: execution.errors.length
    });

    return execution;
  }

  /**
   * Execute all active retention rules
   */
  async executeAllRetentionRules(dryRun: boolean = false): Promise<RetentionExecution[]> {
    const executions: RetentionExecution[] = [];
    const activeRules = Array.from(this.retentionRules.values())
      .filter(rule => rule.isActive)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of activeRules) {
      try {
        const execution = await this.executeRetentionRule(rule.id, dryRun);
        executions.push(execution);
      } catch (error) {
        logger.error('Failed to execute retention rule', {
          ruleId: rule.id,
          error: (error as Error).message
        });
      }
    }

    return executions;
  }

  /**
   * Get retention status for specific data
   */
  async getRetentionStatus(
    dataCategory: string,
    recordId?: string
  ): Promise<{
    category: string;
    totalRecords: number;
    recordsNearExpiry: number;
    recordsExpired: number;
    nextScheduledCleanup: Date | null;
    applicableRules: RetentionRule[];
  }> {
    const applicableRules = Array.from(this.retentionRules.values())
      .filter(rule => rule.dataCategory === dataCategory && rule.isActive);

    const status = {
      category: dataCategory,
      totalRecords: 0,
      recordsNearExpiry: 0,
      recordsExpired: 0,
      nextScheduledCleanup: null as Date | null,
      applicableRules
    };

    // Calculate status for each applicable rule
    for (const rule of applicableRules) {
      const ruleStatus = await this.calculateRuleStatus(rule, recordId);
      status.totalRecords += ruleStatus.totalRecords;
      status.recordsNearExpiry += ruleStatus.recordsNearExpiry;
      status.recordsExpired += ruleStatus.recordsExpired;
      
      if (!status.nextScheduledCleanup || 
          (rule.nextExecution && rule.nextExecution < status.nextScheduledCleanup)) {
        status.nextScheduledCleanup = rule.nextExecution || null;
      }
    }

    return status;
  }

  /**
   * Create or update retention rule
   */
  async upsertRetentionRule(rule: Omit<RetentionRule, 'id'>): Promise<RetentionRule> {
    const ruleId = `${rule.dataCategory}_${rule.tableName}`;
    const nextExecTime = this.calculateNextExecution(rule as RetentionRule);
    const fullRule: RetentionRule = {
      ...rule,
      id: ruleId,
      ...(nextExecTime && { nextExecution: nextExecTime })
    };

    this.retentionRules.set(ruleId, fullRule);
    
    // Store in cache
    await this.redis.setex(
      `${this.RETENTION_PREFIX}rule:${ruleId}`,
      this.RETENTION_CACHE_TTL,
      JSON.stringify(fullRule)
    );

    logger.info('Retention rule upserted', { ruleId });
    return fullRule;
  }

  /**
   * Start periodic execution scheduler
   */
  private startPeriodicExecution(): void {
    // Check for scheduled executions every hour
    setInterval(async () => {
      try {
        await this.checkScheduledExecutions();
      } catch (error) {
        logger.error('Scheduled retention check failed', { error });
      }
    }, 60 * 60 * 1000); // 1 hour

    logger.info('Periodic retention execution scheduler started');
  }

  /**
   * Helper methods (implementation stubs for brevity)
   */
  private async getRecordsForEvaluation(rule: RetentionRule): Promise<any[]> {
    // Implementation would query the actual table
    return [];
  }

  private async evaluateRecord(record: any, rule: RetentionRule): Promise<boolean> {
    // Implementation would evaluate retention conditions and exceptions
    return false;
  }

  private async processRecordDeletion(record: any, rule: RetentionRule): Promise<void> {
    // Implementation would perform the actual deletion/anonymization
  }

  private async logLifecycleEvent(record: any, eventType: string, rule: RetentionRule): Promise<void> {
    // Implementation would log the lifecycle event
  }

  private async sendPreDeletionNotifications(rule: RetentionRule): Promise<void> {
    // Implementation would send notifications
  }

  private async sendPostDeletionNotifications(rule: RetentionRule, execution: RetentionExecution): Promise<void> {
    // Implementation would send notifications
  }

  private calculateNextExecution(rule: RetentionRule): Date | undefined {
    // Implementation would calculate next execution based on schedule
    return undefined;
  }

  private async storeExecutionHistory(execution: RetentionExecution): Promise<void> {
    // Implementation would store execution history
  }

  private async calculateRuleStatus(rule: RetentionRule, recordId?: string): Promise<{
    totalRecords: number;
    recordsNearExpiry: number;
    recordsExpired: number;
  }> {
    // Implementation would calculate rule-specific status
    return {
      totalRecords: 0,
      recordsNearExpiry: 0,
      recordsExpired: 0
    };
  }

  private async checkScheduledExecutions(): Promise<void> {
    // Implementation would check for scheduled executions
  }
}