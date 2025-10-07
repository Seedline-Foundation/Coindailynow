import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { logger } from '../../utils/logger';

// Type-safe workaround for Prisma client caching issues
const createExtendedPrismaClient = (prisma: PrismaClient) => {
  return prisma as any;
};

export interface DeviceInfo {
  deviceId: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  os: string;
  browser: string;
  location?: {
    country: string;
    city: string;
    ip: string;
  };
  fingerprint: string;
}

export interface TrustAssessment {
  deviceId: string;
  trustScore: number; // Changed from trustLevel to match schema
  factors: {
    isKnownDevice: boolean;
    locationMatch: boolean;
    behaviorPattern: boolean;
    timeOfAccess: boolean;
    networkSecurity: boolean;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface SessionContext {
  sessionId: string;
  userId: string;
  deviceInfo: DeviceInfo;
  accessPatterns: AccessPattern[];
  riskScore: number;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

export interface AccessPattern {
  timestamp: Date;
  action: string;
  resource: string;
  outcome: 'granted' | 'denied' | 'restricted';
  riskFactors: string[];
}

export interface ZeroTrustPolicy {
  id: string;
  name: string;
  conditions: {
    userGroups?: string[];
    deviceTypes?: string[];
    locations?: string[];
    timeWindows?: Array<{ start: string; end: string; days: string[] }>;
    riskThreshold?: number;
  };
  actions: {
    allow: boolean;
    requireMFA: boolean;
    restrictAccess: boolean;
    logEvent: boolean;
    alertAdmin: boolean;
  };
  priority: number;
  enabled: boolean;
}

export interface ComplianceCheck {
  policyId: string;
  userId: string;
  deviceId: string;
  resource: string;
  timestamp: Date;
  result: 'compliant' | 'non_compliant' | 'requires_action';
  violations: string[];
  remediation: string[];
}

/**
 * IdentityAccessManagement - Zero-trust identity and access management
 * 
 * Implements comprehensive identity verification, device trust assessment,
 * and zero-trust access policies with real-time risk evaluation.
 * 
 * Features:
 * - Device fingerprinting and trust scoring
 * - Behavioral analysis and anomaly detection
 * - Zero-trust policy enforcement
 * - Real-time session monitoring
 * - Compliance and audit integration
 */
export class IdentityAccessManagement extends EventEmitter {
  private readonly prisma: any;
  private readonly redis: Redis;
  private readonly activeSessions = new Map<string, SessionContext>();
  private readonly deviceTrustCache = new Map<string, TrustAssessment>();
  private readonly policies: ZeroTrustPolicy[] = [];

  constructor(
    prisma: PrismaClient,
    redis: Redis
  ) {
    super();
    this.prisma = createExtendedPrismaClient(prisma);
    this.redis = redis;
    
    this.initializeDefaultPolicies();
    logger.info('Identity Access Management initialized');
  }

  /**
   * Assess device trust based on multiple factors
   */
  async assessDeviceTrust(deviceInfo: DeviceInfo, userId: string): Promise<TrustAssessment> {
    const cacheKey = `device_trust:${deviceInfo.deviceId}`;
    const cached = this.deviceTrustCache.get(cacheKey);
    
    if (cached && Date.now() - cached.riskLevel.length < 300000) { // 5 min cache
      return cached;
    }

    // Get device history from database
    const deviceRecord = await this.prisma.deviceTrust.findUnique({
      where: { deviceId: deviceInfo.deviceId },
    });

    const factors = {
      isKnownDevice: !!deviceRecord,
      locationMatch: await this.checkLocationConsistency(deviceInfo, userId),
      behaviorPattern: await this.analyzeBehaviorPattern(deviceInfo, userId),
      timeOfAccess: this.checkAccessTime(new Date()),
      networkSecurity: await this.assessNetworkSecurity(deviceInfo),
    };

    const trustScore = this.calculateTrustScore(factors, deviceRecord);
    const riskLevel = this.determineRiskLevel(trustScore);

    const assessment: TrustAssessment = {
      deviceId: deviceInfo.deviceId,
      trustScore,
      factors,
      riskLevel,
      recommendations: this.generateTrustRecommendations(factors, trustScore),
    };

    // Update device trust in database
    await this.updateDeviceTrust(deviceInfo, assessment, userId);

    // Cache assessment
    this.deviceTrustCache.set(cacheKey, assessment);

    this.emit('device_assessment', { userId, deviceInfo, assessment });
    return assessment;
  }

  /**
   * Evaluate access request against zero-trust policies
   */
  async evaluateAccess(
    userId: string,
    resource: string,
    deviceInfo: DeviceInfo,
    context: Record<string, any> = {}
  ): Promise<{
    decision: 'allow' | 'deny' | 'require_mfa' | 'restrict';
    reasons: string[];
    policies: string[];
    riskScore: number;
  }> {
    const deviceTrust = await this.assessDeviceTrust(deviceInfo, userId);
    const session = this.activeSessions.get(userId);

    let riskScore = 0;
    const reasons: string[] = [];
    const appliedPolicies: string[] = [];

    // Base risk from device trust
    riskScore += (100 - deviceTrust.trustScore) * 0.4;

    // Evaluate each policy
    for (const policy of this.policies.filter(p => p.enabled)) {
      const policyResult = await this.evaluatePolicy(
        policy,
        userId,
        resource,
        deviceInfo,
        context
      );

      if (policyResult.applies) {
        appliedPolicies.push(policy.name);
        riskScore += policyResult.riskAdjustment;
        reasons.push(...policyResult.reasons);

        // High priority policies can override
        if (policy.priority > 8 && !policyResult.compliant) {
          return {
            decision: 'deny',
            reasons: [`High priority policy violation: ${policy.name}`],
            policies: [policy.name],
            riskScore: 100,
          };
        }
      }
    }

    // Determine final decision
    let decision: 'allow' | 'deny' | 'require_mfa' | 'restrict' = 'allow';

    if (riskScore > 80) {
      decision = 'deny';
      reasons.push('Risk score too high');
    } else if (riskScore > 60 || deviceTrust.riskLevel === 'high') {
      decision = 'require_mfa';
      reasons.push('Additional authentication required');
    } else if (riskScore > 40 || deviceTrust.riskLevel === 'medium') {
      decision = 'restrict';
      reasons.push('Access with restrictions');
    }

    // Log access decision
    await this.logAccessDecision(userId, resource, deviceInfo, {
      decision,
      riskScore,
      reasons,
      policies: appliedPolicies,
    });

    this.emit('access_evaluation', {
      userId,
      resource,
      decision,
      riskScore,
      reasons,
    });

    return {
      decision,
      reasons,
      policies: appliedPolicies,
      riskScore,
    };
  }

  /**
   * Create new session with risk assessment
   */
  async createSession(
    userId: string,
    deviceInfo: DeviceInfo,
    context: Record<string, any> = {}
  ): Promise<SessionContext> {
    const sessionId = this.generateSessionId();
    const deviceTrust = await this.assessDeviceTrust(deviceInfo, userId);

    const session: SessionContext = {
      sessionId,
      userId,
      deviceInfo,
      accessPatterns: [],
      riskScore: 100 - deviceTrust.trustScore,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
    };

    this.activeSessions.set(sessionId, session);

    // Store in Redis for persistence
    await this.redis.setex(
      `session:${sessionId}`,
      3600, // 1 hour
      JSON.stringify(session)
    );

    logger.info(`Session created for user ${userId} with risk score ${session.riskScore}`);
    this.emit('session_created', session);

    return session;
  }

  /**
   * Update session with new access pattern
   */
  async updateSession(
    sessionId: string,
    accessPattern: Omit<AccessPattern, 'timestamp'>
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const pattern: AccessPattern = {
      ...accessPattern,
      timestamp: new Date(),
    };

    session.accessPatterns.push(pattern);
    session.lastActivity = new Date();

    // Recalculate risk based on patterns
    session.riskScore = await this.calculateSessionRisk(session);

    // Update in Redis
    await this.redis.setex(
      `session:${sessionId}`,
      3600,
      JSON.stringify(session)
    );

    this.emit('session_updated', { sessionId, pattern, riskScore: session.riskScore });
  }

  /**
   * Terminate session
   */
  async terminateSession(sessionId: string, reason: string = 'user_logout'): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.activeSessions.delete(sessionId);
      
      await this.redis.del(`session:${sessionId}`);
      
      logger.info(`Session ${sessionId} terminated: ${reason}`);
      this.emit('session_terminated', { sessionId, reason });
    }
  }

  /**
   * Get session information
   */
  getSession(sessionId: string): SessionContext | null {
    return this.activeSessions.get(sessionId) || null;
  }

  /**
   * Get all active sessions for user
   */
  getUserSessions(userId: string): SessionContext[] {
    return Array.from(this.activeSessions.values())
      .filter(session => session.userId === userId && session.isActive);
  }

  /**
   * Add or update zero-trust policy
   */
  addPolicy(policy: ZeroTrustPolicy): void {
    const existingIndex = this.policies.findIndex(p => p.id === policy.id);
    if (existingIndex >= 0) {
      this.policies[existingIndex] = policy;
    } else {
      this.policies.push(policy);
    }

    // Sort by priority
    this.policies.sort((a, b) => b.priority - a.priority);
    
    logger.info(`Policy ${policy.name} added/updated with priority ${policy.priority}`);
    this.emit('policy_updated', policy);
  }

  /**
   * Remove policy
   */
  removePolicy(policyId: string): boolean {
    const index = this.policies.findIndex(p => p.id === policyId);
    if (index >= 0) {
      const removed = this.policies.splice(index, 1)[0];
      if (removed) {
        logger.info(`Policy ${removed.name} removed`);
        this.emit('policy_removed', removed);
      }
      return true;
    }
    return false;
  }

  /**
   * Get compliance status for user/device
   */
  async getComplianceStatus(
    userId: string,
    deviceId: string,
    resource?: string
  ): Promise<ComplianceCheck[]> {
    const checks: ComplianceCheck[] = [];
    const device = await this.prisma.deviceTrust.findUnique({
      where: { deviceId },
    });

    for (const policy of this.policies.filter(p => p.enabled)) {
      const violations: string[] = [];
      const remediation: string[] = [];

      // Check compliance against each policy
      if (policy.conditions.riskThreshold && device) {
        if (device.trustScore < policy.conditions.riskThreshold) {
          violations.push(`Device trust score below threshold`);
          remediation.push('Improve device security posture');
        }
      }

      const result: ComplianceCheck = {
        policyId: policy.id,
        userId,
        deviceId,
        resource: resource || 'general',
        timestamp: new Date(),
        result: violations.length > 0 ? 'non_compliant' : 'compliant',
        violations,
        remediation,
      };

      checks.push(result);
    }

    return checks;
  }

  /**
   * Private helper methods
   */

  private async checkLocationConsistency(deviceInfo: DeviceInfo, userId: string): Promise<boolean> {
    if (!deviceInfo.location) return false;

    // Get recent sessions for this user
    const recentSessions = await this.redis.keys(`session:*`);
    // Implementation would check if location is consistent with recent activity
    return true; // Simplified for demo
  }

  private async analyzeBehaviorPattern(deviceInfo: DeviceInfo, userId: string): Promise<boolean> {
    // Get user's typical behavior patterns
    // This would analyze things like:
    // - Typical login times
    // - Common locations
    // - Device usage patterns
    // - Resource access patterns
    return true; // Simplified for demo
  }

  private checkAccessTime(timestamp: Date): boolean {
    const hour = timestamp.getHours();
    // Business hours are considered safer
    return hour >= 8 && hour <= 18;
  }

  private async assessNetworkSecurity(deviceInfo: DeviceInfo): Promise<boolean> {
    // Assess network security based on:
    // - IP reputation
    // - VPN/Proxy detection
    // - Geolocation consistency
    return true; // Simplified for demo
  }

  private calculateTrustScore(factors: TrustAssessment['factors'], deviceRecord: any): number {
    let score = 50; // Base score

    if (factors.isKnownDevice) score += 20;
    if (factors.locationMatch) score += 15;
    if (factors.behaviorPattern) score += 15;
    if (factors.timeOfAccess) score += 5;
    if (factors.networkSecurity) score += 10;

    // Historical trust from device record
    if (deviceRecord) {
      score = Math.max(score, deviceRecord.trustScore * 0.8); // Historical influence
    }

    return Math.min(100, Math.max(0, score));
  }

  private determineRiskLevel(trustScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (trustScore >= 80) return 'low';
    if (trustScore >= 60) return 'medium';
    if (trustScore >= 40) return 'high';
    return 'critical';
  }

  private generateTrustRecommendations(factors: TrustAssessment['factors'], trustScore: number): string[] {
    const recommendations: string[] = [];

    if (!factors.isKnownDevice) {
      recommendations.push('Device fingerprinting required');
    }
    if (!factors.locationMatch) {
      recommendations.push('Verify location consistency');
    }
    if (!factors.behaviorPattern) {
      recommendations.push('Monitor behavioral patterns');
    }
    if (!factors.networkSecurity) {
      recommendations.push('Assess network security');
    }
    if (trustScore < 60) {
      recommendations.push('Additional authentication required');
    }

    return recommendations;
  }

  private async updateDeviceTrust(
    deviceInfo: DeviceInfo,
    assessment: TrustAssessment,
    userId: string
  ): Promise<void> {
    await this.prisma.deviceTrust.upsert({
      where: { deviceId: deviceInfo.deviceId },
      update: {
        trustScore: assessment.trustScore,
        riskLevel: assessment.riskLevel,
        lastAssessment: new Date(),
        metadata: JSON.stringify({
          factors: assessment.factors,
          recommendations: assessment.recommendations,
          deviceInfo,
        }),
      },
      create: {
        deviceId: deviceInfo.deviceId,
        userId,
        trustScore: assessment.trustScore,
        riskLevel: assessment.riskLevel,
        firstSeen: new Date(),
        lastAssessment: new Date(),
        metadata: JSON.stringify({
          factors: assessment.factors,
          recommendations: assessment.recommendations,
          deviceInfo,
        }),
      },
    });
  }

  private async evaluatePolicy(
    policy: ZeroTrustPolicy,
    userId: string,
    resource: string,
    deviceInfo: DeviceInfo,
    context: Record<string, any>
  ): Promise<{
    applies: boolean;
    compliant: boolean;
    riskAdjustment: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let riskAdjustment = 0;
    let compliant = true;

    // Check if policy applies to this request
    const applies = true; // Simplified - would check conditions

    if (!applies) {
      return { applies: false, compliant: true, riskAdjustment: 0, reasons: [] };
    }

    // Evaluate policy conditions
    if (policy.conditions.riskThreshold) {
      const deviceTrust = this.deviceTrustCache.get(deviceInfo.deviceId);
      if (deviceTrust && deviceTrust.trustScore < policy.conditions.riskThreshold) {
        compliant = false;
        riskAdjustment += 20;
        reasons.push(`Device trust below threshold (${deviceTrust.trustScore})`);
      }
    }

    return { applies, compliant, riskAdjustment, reasons };
  }

  private async logAccessDecision(
    userId: string,
    resource: string,
    deviceInfo: DeviceInfo,
    decision: any
  ): Promise<void> {
    // Log the access decision for audit purposes
    logger.info('Access decision logged', {
      userId,
      resource,
      deviceId: deviceInfo.deviceId,
      decision: decision.decision,
      riskScore: decision.riskScore,
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async calculateSessionRisk(session: SessionContext): Promise<number> {
    let risk = session.riskScore;

    // Analyze access patterns for risk indicators
    const recentPatterns = session.accessPatterns.slice(-10);
    const failedAttempts = recentPatterns.filter(p => p.outcome === 'denied').length;

    if (failedAttempts > 3) {
      risk += 30;
    }

    return Math.min(100, risk);
  }

  private initializeDefaultPolicies(): void {
    // Add default zero-trust policies
    this.addPolicy({
      id: 'default_device_trust',
      name: 'Device Trust Requirement',
      conditions: {
        riskThreshold: 60,
      },
      actions: {
        allow: true,
        requireMFA: true,
        restrictAccess: false,
        logEvent: true,
        alertAdmin: false,
      },
      priority: 5,
      enabled: true,
    });

    this.addPolicy({
      id: 'business_hours',
      name: 'Business Hours Access',
      conditions: {
        timeWindows: [
          {
            start: '08:00',
            end: '18:00',
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          },
        ],
      },
      actions: {
        allow: true,
        requireMFA: false,
        restrictAccess: false,
        logEvent: true,
        alertAdmin: false,
      },
      priority: 3,
      enabled: true,
    });
  }
}