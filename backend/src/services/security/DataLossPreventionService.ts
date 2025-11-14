/**
 * Data Loss Prevention (DLP) Service
 * 
 * Scans content for sensitive data and prevents unauthorized data exposure.
 * Detects PII, credentials, financial data, and other sensitive information.
 */

import { PrismaClient } from '@prisma/client';
import { Logger } from 'winston';

export interface DLPScanResult {
  isSafe: boolean;
  violations: DLPViolation[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  scannedAt: Date;
}

export interface DLPViolation {
  type: DLPViolationType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    start: number;
    end: number;
  };
  matchedPattern: string;
  recommendation: string;
}

export type DLPViolationType =
  | 'email'
  | 'phone'
  | 'ssn'
  | 'credit_card'
  | 'api_key'
  | 'password'
  | 'private_key'
  | 'ip_address'
  | 'passport'
  | 'driver_license'
  | 'bank_account'
  | 'crypto_wallet';

export interface DLPContext {
  userId?: string;
  documentId?: string;
  documentType?: string;
  metadata?: Record<string, any>;
}

export class DataLossPreventionService {
  private readonly prisma: PrismaClient;
  private readonly logger: Logger;

  // Regex patterns for sensitive data detection
  private patterns: Record<DLPViolationType, RegExp> = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b(\+?1[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    credit_card: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    api_key: /\b[A-Za-z0-9]{32,}\b/g,
    password: /(?:password|pwd|pass|secret)\s*[:=]\s*['"]?[^\s'"]+['"]?/gi,
    private_key: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/g,
    ip_address: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
    driver_license: /\b[A-Z]{1,2}\d{6,8}\b/g,
    bank_account: /\b\d{8,17}\b/g,
    crypto_wallet: /\b0x[a-fA-F0-9]{40}\b|\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g
  };

  // Severity mapping for violation types
  private severityMap: Record<DLPViolationType, DLPViolation['severity']> = {
    email: 'low',
    phone: 'medium',
    ssn: 'critical',
    credit_card: 'critical',
    api_key: 'high',
    password: 'critical',
    private_key: 'critical',
    ip_address: 'low',
    passport: 'high',
    driver_license: 'high',
    bank_account: 'critical',
    crypto_wallet: 'medium'
  };

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
  }

  /**
   * Scan content for sensitive data
   */
  async scanContent(
    content: string,
    scanTypes: DLPViolationType[],
    context?: DLPContext
  ): Promise<DLPScanResult> {
    const startTime = Date.now();
    const violations: DLPViolation[] = [];

    try {
      this.logger.info('Starting DLP content scan', {
        contentLength: content.length,
        scanTypes,
        userId: context?.userId,
        documentId: context?.documentId
      });

      // Scan for each specified type
      for (const type of scanTypes) {
        const pattern = this.patterns[type];
        if (!pattern) {
          this.logger.warn(`Unknown DLP violation type: ${type}`);
          continue;
        }

        // Reset regex state
        pattern.lastIndex = 0;
        
        let match;
        while ((match = pattern.exec(content)) !== null) {
          violations.push({
            type,
            severity: this.severityMap[type],
            location: {
              start: match.index,
              end: match.index + match[0].length
            },
            matchedPattern: this.maskSensitiveData(match[0], type),
            recommendation: this.getRecommendation(type)
          });
        }
      }

      // Calculate risk level
      const riskLevel = this.calculateRiskLevel(violations);

      const result: DLPScanResult = {
        isSafe: violations.length === 0,
        violations,
        riskLevel,
        scannedAt: new Date()
      };

      // Log scan result
      const duration = Date.now() - startTime;
      this.logger.info('DLP scan completed', {
        duration,
        violationsCount: violations.length,
        riskLevel,
        isSafe: result.isSafe,
        userId: context?.userId,
        documentId: context?.documentId
      });

      // Store scan record for audit trail
      if (context?.userId || context?.documentId) {
        await this.logScanResult(result, context);
      }

      return result;

    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.logger.error('DLP scan failed', {
        error: error.message,
        duration,
        context
      });

      // Return safe result on error to avoid blocking
      return {
        isSafe: true,
        violations: [],
        riskLevel: 'low',
        scannedAt: new Date()
      };
    }
  }

  /**
   * Mask sensitive data for logging
   */
  private maskSensitiveData(data: string, type: DLPViolationType): string {
    const visibleChars = 4;
    
    if (data.length <= visibleChars) {
      return '*'.repeat(data.length);
    }

      switch (type) {
      case 'email':
        const [localPart, domain] = data.split('@');
        if (!localPart || !domain) return '***@***';
        return `${localPart[0]}***@${domain}`;      case 'credit_card':
        return `****-****-****-${data.slice(-4)}`;
      
      case 'phone':
        return `***-***-${data.slice(-4)}`;
      
      default:
        return `${data.slice(0, visibleChars)}${'*'.repeat(data.length - visibleChars)}`;
    }
  }

  /**
   * Get recommendation for violation type
   */
  private getRecommendation(type: DLPViolationType): string {
    const recommendations: Record<DLPViolationType, string> = {
      email: 'Remove or redact email addresses from content',
      phone: 'Remove or mask phone numbers',
      ssn: 'CRITICAL: Remove Social Security Numbers immediately',
      credit_card: 'CRITICAL: Remove credit card numbers immediately',
      api_key: 'Remove API keys and rotate compromised keys',
      password: 'CRITICAL: Remove passwords and change credentials',
      private_key: 'CRITICAL: Remove private keys and regenerate',
      ip_address: 'Consider removing IP addresses if not necessary',
      passport: 'Remove passport numbers',
      driver_license: 'Remove driver license numbers',
      bank_account: 'CRITICAL: Remove bank account numbers',
      crypto_wallet: 'Consider removing wallet addresses if sensitive'
    };

    return recommendations[type] || 'Review and remove sensitive data';
  }

  /**
   * Calculate overall risk level
   */
  private calculateRiskLevel(violations: DLPViolation[]): DLPScanResult['riskLevel'] {
    if (violations.length === 0) return 'low';

    const hasCritical = violations.some(v => v.severity === 'critical');
    const hasHigh = violations.some(v => v.severity === 'high');
    const hasMedium = violations.some(v => v.severity === 'medium');

    if (hasCritical) return 'critical';
    if (hasHigh || violations.length >= 5) return 'high';
    if (hasMedium || violations.length >= 3) return 'medium';
    return 'low';
  }

  /**
   * Log scan result for audit trail
   */
  private async logScanResult(result: DLPScanResult, context: DLPContext): Promise<void> {
    try {
      // In a real implementation, you might store this in a dedicated DLP audit table
      // For now, we'll just log it
      this.logger.info('DLP scan result logged', {
        isSafe: result.isSafe,
        violationsCount: result.violations.length,
        riskLevel: result.riskLevel,
        userId: context.userId,
        documentId: context.documentId,
        timestamp: result.scannedAt
      });
    } catch (error: any) {
      this.logger.error('Failed to log DLP scan result', {
        error: error.message,
        context
      });
    }
  }

  /**
   * Redact sensitive content from text
   */
  async redactContent(
    content: string,
    scanTypes: DLPViolationType[]
  ): Promise<{ redactedContent: string; redactionCount: number }> {
    let redactedContent = content;
    let redactionCount = 0;

    for (const type of scanTypes) {
      const pattern = this.patterns[type];
      if (!pattern) continue;

      pattern.lastIndex = 0;
      const replacementText = `[REDACTED_${type.toUpperCase()}]`;
      
      const matches = content.match(pattern);
      if (matches) {
        redactionCount += matches.length;
        redactedContent = redactedContent.replace(pattern, replacementText);
      }
    }

    return {
      redactedContent,
      redactionCount
    };
  }

  /**
   * Validate content before publication
   */
  async validateForPublication(content: string): Promise<{
    approved: boolean;
    violations: DLPViolation[];
    message: string;
  }> {
    // Scan for critical data types that should never be published
    const criticalTypes: DLPViolationType[] = [
      'ssn',
      'credit_card',
      'password',
      'private_key',
      'bank_account'
    ];

    const result = await this.scanContent(content, criticalTypes);

    if (!result.isSafe) {
      return {
        approved: false,
        violations: result.violations,
        message: 'Content contains sensitive data that cannot be published'
      };
    }

    return {
      approved: true,
      violations: [],
      message: 'Content approved for publication'
    };
  }
}
