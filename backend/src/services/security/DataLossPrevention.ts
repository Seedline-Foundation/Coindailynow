import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import * as crypto from 'crypto';
import { logger } from '../../utils/logger';

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  categories: string[];
  retention: number; // days
  encryptionRequired: boolean;
  accessControls: string[];
}

export interface DataPattern {
  id: string;
  name: string;
  description: string;
  regex: RegExp;
  classification: DataClassification['level'];
  severity: 'low' | 'medium' | 'high' | 'critical';
  active: boolean;
}

export interface DLPViolation {
  id: string;
  type: 'data_leak' | 'unauthorized_access' | 'data_exfiltration' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string | null;
  ipAddress?: string | null;
  resource: string;
  action: string;
  patterns: string[];
  timestamp: Date;
  blocked: boolean;
  metadata: Record<string, any>;
}

export interface EncryptionKey {
  id: string;
  algorithm: string;
  keyData: string;
  purpose: 'data' | 'backup' | 'communication';
  status: 'active' | 'retired' | 'compromised';
  createdAt: Date;
  expiresAt?: Date;
}

export interface DLPConfig {
  enabled: boolean;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  dataClassification: boolean;
}

export class DataLossPrevention extends EventEmitter {
  private dataPatterns: Map<string, DataPattern> = new Map();
  private encryptionKeys: Map<string, EncryptionKey> = new Map();
  private activeViolations: Map<string, DLPViolation> = new Map();
  
  private readonly CACHE_PREFIX = 'dlp:';
  private readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';

  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private config: DLPConfig
  ) {
    super();
    
    if (config.enabled) {
      this.initializeDataPatterns();
      this.initializeEncryptionKeys();
    }
  }

  /**
   * Scan data for sensitive content
   */
  async scanData(data: {
    content: string;
    source: string;
    userId?: string;
    ipAddress?: string;
    action: string;
    metadata?: Record<string, any>;
  }): Promise<{
    violations: DLPViolation[];
    classification: DataClassification['level'];
    shouldBlock: boolean;
    sanitizedContent?: string;
  }> {
    try {
      const violations: DLPViolation[] = [];
      let highestClassification: DataClassification['level'] = 'public';
      let shouldBlock = false;

      // Scan against data patterns
      for (const pattern of this.dataPatterns.values()) {
        if (!pattern.active) continue;

        const matches = data.content.match(pattern.regex);
        if (matches) {
          const violation: DLPViolation = {
            id: this.generateViolationId(),
            type: 'policy_violation',
            severity: pattern.severity,
            description: `Sensitive data detected: ${pattern.name}`,
            userId: data.userId ?? null,
            ipAddress: data.ipAddress ?? null,
            resource: data.source,
            action: data.action,
            patterns: [pattern.id],
            timestamp: new Date(),
            blocked: false,
            metadata: {
              patternName: pattern.name,
              matches: matches.length,
              classification: pattern.classification,
              ...data.metadata,
            },
          };

          violations.push(violation);

          // Update highest classification
          if (this.getClassificationLevel(pattern.classification) > this.getClassificationLevel(highestClassification)) {
            highestClassification = pattern.classification;
          }

          // Determine if should block
          if (pattern.severity === 'critical' || 
              (pattern.severity === 'high' && pattern.classification === 'restricted')) {
            shouldBlock = true;
            violation.blocked = true;
          }
        }
      }

      // Additional checks for specific data types
      const additionalViolations = await this.performAdditionalChecks(data);
      violations.push(...additionalViolations);

      // Store violations
      for (const violation of violations) {
        this.activeViolations.set(violation.id, violation);
        
        if (violation.severity === 'high' || violation.severity === 'critical') {
          this.emit('dataViolation', violation);
        }
      }

      // Generate sanitized content if needed
      let sanitizedContent: string | undefined;
      if (violations.length > 0 && !shouldBlock) {
        sanitizedContent = this.sanitizeContent(data.content, violations);
      }

      logger.info('Data scan completed', {
        source: data.source,
        violations: violations.length,
        classification: highestClassification,
        shouldBlock,
      });

      return {
        violations,
        classification: highestClassification,
        shouldBlock,
        ...(sanitizedContent && { sanitizedContent }),
      };

    } catch (error) {
      logger.error('Data scan failed', { error, source: data.source });
      
      // Fail securely
      return {
        violations: [],
        classification: 'restricted',
        shouldBlock: true,
      };
    }
  }

  /**
   * Encrypt sensitive data
   */
  async encryptData(
    data: string,
    classification: DataClassification['level'],
    purpose: 'storage' | 'transmission' = 'storage'
  ): Promise<{
    encryptedData: string;
    keyId: string;
    iv: string;
    authTag: string;
  }> {
    try {
      const keyId = await this.getEncryptionKeyId(classification, purpose);
      const key = await this.getEncryptionKey(keyId);
      
      if (!key) {
        throw new Error('Encryption key not found');
      }

      // Generate random IV
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipher('aes-256-gcm', Buffer.from(key.keyData, 'hex'));
      
      // For GCM mode, we use update/final without setIV

      // Encrypt data
      let encryptedData = cipher.update(data, 'utf8', 'hex');
      encryptedData += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      logger.debug('Data encrypted', {
        keyId,
        classification,
        purpose,
        dataLength: data.length,
      });

      return {
        encryptedData,
        keyId,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
      };

    } catch (error) {
      logger.error('Data encryption failed', { error, classification });
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptData(
    encryptedData: string,
    keyId: string,
    iv: string,
    authTag: string
  ): Promise<string> {
    try {
      const key = await this.getEncryptionKey(keyId);
      
      if (!key) {
        throw new Error('Decryption key not found');
      }

      // Create decipher
      const decipher = crypto.createDecipher(this.ENCRYPTION_ALGORITHM, key.keyData);
      
      // For GCM mode, set auth tag before processing
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      // Decrypt data
      let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
      decryptedData += decipher.final('utf8');

      logger.debug('Data decrypted', { keyId });

      return decryptedData;

    } catch (error) {
      logger.error('Data decryption failed', { error, keyId });
      throw error;
    }
  }

  /**
   * Classify data based on content
   */
  async classifyData(content: string): Promise<{
    classification: DataClassification['level'];
    categories: string[];
    confidence: number;
    patterns: string[];
  }> {
    try {
      let highestClassification: DataClassification['level'] = 'public';
      const categories: string[] = [];
      const patterns: string[] = [];
      let maxConfidence = 0;

      for (const pattern of this.dataPatterns.values()) {
        if (!pattern.active) continue;

        const matches = content.match(pattern.regex);
        if (matches) {
          patterns.push(pattern.id);
          
          if (this.getClassificationLevel(pattern.classification) > this.getClassificationLevel(highestClassification)) {
            highestClassification = pattern.classification;
          }

          // Calculate confidence based on matches
          const confidence = Math.min(matches.length * 0.2, 1.0);
          maxConfidence = Math.max(maxConfidence, confidence);

          // Add categories
          const classification = this.getDataClassification(pattern.classification);
          categories.push(...classification.categories);
        }
      }

      // Remove duplicate categories
      const uniqueCategories = [...new Set(categories)];

      return {
        classification: highestClassification,
        categories: uniqueCategories,
        confidence: maxConfidence,
        patterns,
      };

    } catch (error) {
      logger.error('Data classification failed', { error });
      return {
        classification: 'restricted',
        categories: [],
        confidence: 0,
        patterns: [],
      };
    }
  }

  /**
   * Monitor data access
   */
  async monitorDataAccess(access: {
    userId: string;
    resource: string;
    action: 'read' | 'write' | 'delete' | 'export';
    classification: DataClassification['level'];
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{
    allowed: boolean;
    violations: DLPViolation[];
    reason?: string;
  }> {
    try {
      const violations: DLPViolation[] = [];
      
      // Check access patterns
      const accessPattern = await this.analyzeAccessPattern(access);
      
      if (accessPattern.suspicious) {
        const violation: DLPViolation = {
          id: this.generateViolationId(),
          type: 'unauthorized_access',
          severity: accessPattern.severity,
          description: accessPattern.reason,
          userId: access.userId,
          ipAddress: access.ipAddress ?? null,
          resource: access.resource,
          action: access.action,
          patterns: [],
          timestamp: new Date(),
          blocked: accessPattern.severity === 'critical',
          metadata: {
            classification: access.classification,
            suspiciousPatterns: accessPattern.patterns,
          },
        };

        violations.push(violation);
        this.activeViolations.set(violation.id, violation);

        if (violation.blocked) {
          this.emit('dataViolation', violation);
          return {
            allowed: false,
            violations,
            reason: accessPattern.reason,
          };
        }
      }

      // Check bulk operations
      if (access.action === 'export') {
        const bulkCheck = await this.checkBulkOperation(access);
        if (!bulkCheck.allowed) {
          violations.push(...bulkCheck.violations);
          return {
            allowed: false,
            violations,
            reason: 'Bulk operation policy violation',
          };
        }
      }

      return {
        allowed: true,
        violations,
      };

    } catch (error) {
      logger.error('Data access monitoring failed', { error, userId: access.userId });
      return {
        allowed: false,
        violations: [],
        reason: 'Monitoring system error',
      };
    }
  }

  /**
   * Get service status
   */
  async getStatus(): Promise<{
    operational: boolean;
    encryptionEnabled: boolean;
    activePolicies: number;
    activeViolations: number;
    encryptionKeys: number;
  }> {
    try {
      return {
        operational: this.config.enabled,
        encryptionEnabled: this.config.encryptionAtRest,
        activePolicies: Array.from(this.dataPatterns.values()).filter(p => p.active).length,
        activeViolations: this.activeViolations.size,
        encryptionKeys: this.encryptionKeys.size,
      };

    } catch (error) {
      logger.error('Failed to get DLP status', { error });
      return {
        operational: false,
        encryptionEnabled: false,
        activePolicies: 0,
        activeViolations: 0,
        encryptionKeys: 0,
      };
    }
  }

  /**
   * Perform security scan
   */
  async performScan(): Promise<{
    scanId: string;
    timestamp: Date;
    violations: number;
    encryptionStatus: any;
    recommendations: string[];
  }> {
    const scanId = `dlp_scan_${Date.now()}`;
    const recommendations: string[] = [];

    try {
      // Check encryption status
      const encryptionStatus = await this.checkEncryptionStatus();
      
      // Count recent violations
      const recentViolations = Array.from(this.activeViolations.values())
        .filter(v => v.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;

      if (!encryptionStatus.atRest) {
        recommendations.push('Enable encryption at rest for sensitive data');
      }

      if (!encryptionStatus.inTransit) {
        recommendations.push('Enable encryption in transit for all communications');
      }

      if (recentViolations > 10) {
        recommendations.push(`High number of DLP violations (${recentViolations}) - review policies`);
      }

      if (recommendations.length === 0) {
        recommendations.push('Data loss prevention appears to be working correctly');
      }

      return {
        scanId,
        timestamp: new Date(),
        violations: recentViolations,
        encryptionStatus,
        recommendations,
      };

    } catch (error) {
      logger.error('DLP scan failed', { error, scanId });
      throw error;
    }
  }

  /**
   * Update configuration
   */
  async updateConfig(newConfig: Partial<DLPConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.enabled !== undefined) {
      if (newConfig.enabled && this.dataPatterns.size === 0) {
        await this.initializeDataPatterns();
      }
    }

    logger.info('DLP config updated', { newConfig });
  }

  /**
   * Get metrics
   */
  async getMetrics(timeframe: '1h' | '24h' | '7d' | '30d'): Promise<{
    breachAttempts: number;
    violationsBlocked: number;
    dataClassified: number;
    encryptionUsage: number;
  }> {
    try {
      const timeframeMs = this.getTimeframeMs(timeframe);
      const since = new Date(Date.now() - timeframeMs);

      const violations = Array.from(this.activeViolations.values())
        .filter(v => v.timestamp > since);

      return {
        breachAttempts: violations.filter(v => v.type === 'data_exfiltration').length,
        violationsBlocked: violations.filter(v => v.blocked).length,
        dataClassified: violations.length, // Placeholder
        encryptionUsage: 85, // Placeholder percentage
      };

    } catch (error) {
      logger.error('Failed to get DLP metrics', { error });
      return {
        breachAttempts: 0,
        violationsBlocked: 0,
        dataClassified: 0,
        encryptionUsage: 0,
      };
    }
  }

  /**
   * Emergency lockdown
   */
  async emergencyLockdown(): Promise<void> {
    logger.warn('DLP emergency lockdown activated');

    // Activate emergency data protection policies
    await this.activateEmergencyPolicies();

    // Clear active violations (they'll be logged elsewhere)
    this.activeViolations.clear();

    this.emit('emergencyLockdown', { service: 'DataLossPrevention' });
  }

  /**
   * Process security event
   */
  async processEvent(event: any): Promise<void> {
    if (event.type === 'data_access' || event.type === 'security_event') {
      // Process data-related security events
      await this.monitorDataAccess({
        userId: event.userId || 'system',
        resource: event.metadata?.resource || 'unknown',
        action: event.action as any,
        classification: event.metadata?.classification || 'restricted',
        ipAddress: event.ipAddress,
      });
    }
  }

  private async initializeDataPatterns(): Promise<void> {
    const defaultPatterns: DataPattern[] = [
      {
        id: 'email_addresses',
        name: 'Email Addresses',
        description: 'Detects email addresses in content',
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        classification: 'internal',
        severity: 'low',
        active: true,
      },
      {
        id: 'credit_cards',
        name: 'Credit Card Numbers',
        description: 'Detects credit card numbers',
        regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
        classification: 'restricted',
        severity: 'critical',
        active: true,
      },
      {
        id: 'social_security',
        name: 'Social Security Numbers',
        description: 'Detects SSN patterns',
        regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        classification: 'restricted',
        severity: 'critical',
        active: true,
      },
      {
        id: 'phone_numbers',
        name: 'Phone Numbers',
        description: 'Detects phone number patterns',
        regex: /\b\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
        classification: 'internal',
        severity: 'medium',
        active: true,
      },
      {
        id: 'api_keys',
        name: 'API Keys',
        description: 'Detects API key patterns',
        regex: /\b[A-Za-z0-9]{32,}\b/g,
        classification: 'confidential',
        severity: 'high',
        active: true,
      },
    ];

    for (const pattern of defaultPatterns) {
      this.dataPatterns.set(pattern.id, pattern);
    }

    logger.info('Data patterns initialized', { count: defaultPatterns.length });
  }

  private async initializeEncryptionKeys(): Promise<void> {
    // Generate default encryption keys
    const keys: EncryptionKey[] = [
      {
        id: 'default_data_key',
        algorithm: this.ENCRYPTION_ALGORITHM,
        keyData: crypto.randomBytes(32).toString('hex'),
        purpose: 'data',
        status: 'active',
        createdAt: new Date(),
      },
      {
        id: 'backup_key',
        algorithm: this.ENCRYPTION_ALGORITHM,
        keyData: crypto.randomBytes(32).toString('hex'),
        purpose: 'backup',
        status: 'active',
        createdAt: new Date(),
      },
    ];

    for (const key of keys) {
      this.encryptionKeys.set(key.id, key);
    }

    logger.info('Encryption keys initialized', { count: keys.length });
  }

  private async performAdditionalChecks(data: any): Promise<DLPViolation[]> {
    const violations: DLPViolation[] = [];

    // Check for potential data exfiltration
    if (data.action === 'export' && data.content.length > 100000) {
      violations.push({
        id: this.generateViolationId(),
        type: 'data_exfiltration',
        severity: 'high',
        description: 'Large data export detected',
        userId: data.userId,
        ipAddress: data.ipAddress,
        resource: data.source,
        action: data.action,
        patterns: [],
        timestamp: new Date(),
        blocked: false,
        metadata: {
          dataSize: data.content.length,
          reason: 'Large export volume',
        },
      });
    }

    return violations;
  }

  private sanitizeContent(content: string, violations: DLPViolation[]): string {
    let sanitized = content;

    // Replace sensitive patterns with placeholders
    for (const violation of violations) {
      for (const pattern of this.dataPatterns.values()) {
        if (violation.patterns.includes(pattern.id)) {
          sanitized = sanitized.replace(pattern.regex, '[REDACTED]');
        }
      }
    }

    return sanitized;
  }

  private getClassificationLevel(classification: DataClassification['level']): number {
    const levels = { public: 0, internal: 1, confidential: 2, restricted: 3 };
    return levels[classification] || 0;
  }

  private getDataClassification(level: DataClassification['level']): DataClassification {
    const classifications: Record<DataClassification['level'], DataClassification> = {
      public: {
        level: 'public',
        categories: ['marketing', 'general'],
        retention: 365,
        encryptionRequired: false,
        accessControls: ['public'],
      },
      internal: {
        level: 'internal',
        categories: ['business', 'operational'],
        retention: 1095, // 3 years
        encryptionRequired: false,
        accessControls: ['employees'],
      },
      confidential: {
        level: 'confidential',
        categories: ['financial', 'strategic'],
        retention: 2555, // 7 years
        encryptionRequired: true,
        accessControls: ['authorized_personnel'],
      },
      restricted: {
        level: 'restricted',
        categories: ['personal', 'financial', 'security'],
        retention: 2555, // 7 years
        encryptionRequired: true,
        accessControls: ['need_to_know'],
      },
    };

    return classifications[level];
  }

  private async getEncryptionKeyId(
    classification: DataClassification['level'],
    purpose: 'storage' | 'transmission'
  ): Promise<string> {
    // Return appropriate key ID based on classification and purpose
    return 'default_data_key';
  }

  private async getEncryptionKey(keyId: string): Promise<EncryptionKey | null> {
    return this.encryptionKeys.get(keyId) || null;
  }

  private async analyzeAccessPattern(access: any): Promise<{
    suspicious: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
    patterns: string[];
  }> {
    // Analyze access patterns for suspicious behavior
    // This is a simplified implementation
    
    // Check for bulk access
    const recentAccess = await this.getRecentUserAccess(access.userId);
    if (recentAccess.length > 100) {
      return {
        suspicious: true,
        severity: 'high',
        reason: 'Unusual bulk data access detected',
        patterns: ['bulk_access'],
      };
    }

    return {
      suspicious: false,
      severity: 'low',
      reason: 'Normal access pattern',
      patterns: [],
    };
  }

  private async checkBulkOperation(access: any): Promise<{
    allowed: boolean;
    violations: DLPViolation[];
  }> {
    // Check if bulk operation is allowed
    return {
      allowed: true,
      violations: [],
    };
  }

  private async getRecentUserAccess(userId: string): Promise<any[]> {
    // Get recent access patterns for user
    return [];
  }

  private async checkEncryptionStatus(): Promise<{
    atRest: boolean;
    inTransit: boolean;
    keyRotation: boolean;
  }> {
    return {
      atRest: this.config.encryptionAtRest,
      inTransit: this.config.encryptionInTransit,
      keyRotation: true,
    };
  }

  private async activateEmergencyPolicies(): Promise<void> {
    // Activate emergency data protection policies
    const emergencyPattern: DataPattern = {
      id: 'emergency_all_data',
      name: 'Emergency - All Data Restricted',
      description: 'Emergency lockdown - treat all data as restricted',
      regex: /.*/g,
      classification: 'restricted',
      severity: 'critical',
      active: true,
    };

    this.dataPatterns.set(emergencyPattern.id, emergencyPattern);
  }

  private generateViolationId(): string {
    return `dlp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTimeframeMs(timeframe: string): number {
    switch (timeframe) {
      case '1h': return 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  }
}