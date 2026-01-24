import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import * as jwt from 'jsonwebtoken';
import { logger } from '../../utils/logger';

export interface ZeroTrustPolicy {
  id: string;
  name: string;
  description: string;
  rules: ZeroTrustRule[];
  active: boolean;
  priority: number;
}

export interface ZeroTrustRule {
  condition: string;
  action: 'allow' | 'deny' | 'challenge' | 'log';
  metadata?: Record<string, any>;
}

export interface AccessAttempt {
  userId?: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  action: string;
  timestamp: Date;
  deviceFingerprint?: string;
  location?: string;
}

export interface DeviceTrust {
  id?: string;
  deviceId: string;
  userId: string;
  fingerprint: string;
  trustScore: number;
  isActive: boolean;
  lastSeen: Date;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  riskFactors?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SessionContext {
  sessionId: string;
  userId: string;
  deviceId?: string | null;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  riskScore: number;
  attributes: Record<string, any>;
}

export interface IdentityConfig {
  zeroTrustEnabled: boolean;
  multiFactorRequired: boolean;
  sessionTimeout: number; // minutes
  deviceTrustEnabled: boolean;
}

export class IdentityAccessManagement extends EventEmitter {
  private zeroTrustPolicies: Map<string, ZeroTrustPolicy> = new Map();
  private activeSessions: Map<string, SessionContext> = new Map();
  private deviceTrust: Map<string, DeviceTrust> = new Map();
  
  private readonly CACHE_PREFIX = 'iam:';
  private readonly SESSION_PREFIX = 'session:';
  private readonly DEVICE_PREFIX = 'device:';

  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private config: IdentityConfig
  ) {
    super();
    
    if (config.zeroTrustEnabled) {
      this.initializeZeroTrustPolicies();
    }
    
    this.startSessionMonitoring();
  }

  /**
   * Evaluate access attempt against zero-trust policies
   */
  async evaluateAccess(attempt: AccessAttempt): Promise<{
    decision: 'allow' | 'deny' | 'challenge';
    reason: string;
    riskScore: number;
    additionalChallenges?: string[];
    policies: string[];
  }> {
    try {
      if (!this.config.zeroTrustEnabled) {
        return {
          decision: 'allow',
          reason: 'Zero-trust is disabled',
          riskScore: 0,
          policies: [],
        };
      }

      let finalDecision: 'allow' | 'deny' | 'challenge' = 'allow';
      let maxRiskScore = 0;
      const appliedPolicies: string[] = [];
      const challengeReasons: string[] = [];

      // Get user context if authenticated
      let userContext: any = null;
      if (attempt.userId) {
        userContext = await this.getUserContext(attempt.userId);
      }

      // Get device trust level
      const deviceTrust = attempt.deviceFingerprint 
        ? await this.getDeviceTrust(attempt.deviceFingerprint, attempt.userId)
        : null;

      // Evaluate each zero-trust policy
      for (const policy of this.zeroTrustPolicies.values()) {
        if (!policy.active) continue;

        const evaluation = await this.evaluatePolicy(policy, {
          attempt,
          userContext,
          deviceTrust,
        });

        if (evaluation.applies) {
          appliedPolicies.push(policy.name);
          maxRiskScore = Math.max(maxRiskScore, evaluation.riskScore);

          // Apply most restrictive decision
          if (evaluation.decision === 'deny') {
            finalDecision = 'deny';
            break;
          } else if (evaluation.decision === 'challenge' && finalDecision === 'allow') {
            finalDecision = 'challenge';
            challengeReasons.push(evaluation.reason || 'Additional verification required');
          }
        }
      }

      // Additional risk factors
      const riskFactors = await this.calculateRiskFactors(attempt, userContext, deviceTrust);
      maxRiskScore = Math.max(maxRiskScore, riskFactors.score);

      // Apply risk-based decisions
      if (maxRiskScore > 0.8) {
        finalDecision = 'deny';
      } else if (maxRiskScore > 0.6 && finalDecision === 'allow') {
        finalDecision = 'challenge';
        challengeReasons.push('High risk score detected');
      }

      const result = {
        decision: finalDecision,
        reason: finalDecision === 'deny' ? 'Access denied by security policy' : 
                finalDecision === 'challenge' ? challengeReasons.join(', ') : 
                'Access granted',
        riskScore: maxRiskScore,
        ...(finalDecision === 'challenge' && { additionalChallenges: this.getRequiredChallenges(maxRiskScore) }),
        policies: appliedPolicies,
      };

      // Log access attempt
      if (finalDecision === 'deny' || maxRiskScore > 0.5) {
        this.emit('accessViolation', {
          userId: attempt.userId,
          ipAddress: attempt.ipAddress,
          resource: attempt.resource,
          decision: finalDecision,
          riskScore: maxRiskScore,
          severity: finalDecision === 'deny' ? 'high' : 'medium',
          description: `Access ${finalDecision}: ${result.reason}`,
          metadata: {
            policies: appliedPolicies,
            riskFactors: riskFactors.factors,
          },
        });
      }

      return result;

    } catch (error) {
      logger.error('Access evaluation failed', { error, attempt });
      
      // Fail securely
      return {
        decision: 'deny',
        reason: 'Security evaluation failed',
        riskScore: 1,
        policies: [],
      };
    }
  }

  /**
   * Create secure session with zero-trust verification
   */
  async createSession(
    userId: string,
    deviceInfo: {
      fingerprint?: string;
      ipAddress: string;
      userAgent: string;
      location?: string;
    }
  ): Promise<{
    sessionId: string;
    token: string;
    expiresAt: Date;
    requiresMfa: boolean;
    deviceTrusted: boolean;
  }> {
    try {
      const sessionId = this.generateSessionId();
      const expiresAt = new Date(Date.now() + this.config.sessionTimeout * 60 * 1000);

      // Check device trust
      let deviceTrusted = false;
      if (this.config.deviceTrustEnabled && deviceInfo.fingerprint) {
        const trust = await this.getDeviceTrust(deviceInfo.fingerprint, userId);
        deviceTrusted = trust?.trustScore ? trust.trustScore > 0.7 : false;
        
        // Update device usage
        await this.updateDeviceUsage(deviceInfo.fingerprint, userId, deviceInfo);
      }

      // Determine MFA requirement
      const requiresMfa = this.config.multiFactorRequired || 
                         !deviceTrusted || 
                         await this.requiresMfaByPolicy(userId, deviceInfo);

      // Create session context
      const sessionContext: SessionContext = {
        sessionId,
        userId,
        deviceId: deviceInfo.fingerprint ?? null,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        createdAt: new Date(),
        lastActivity: new Date(),
        riskScore: deviceTrusted ? 0.1 : 0.5,
        attributes: {
          location: deviceInfo.location,
          deviceTrusted,
          requiresMfa,
        },
      };

      // Store session
      this.activeSessions.set(sessionId, sessionContext);
      await this.redis.setex(
        `${this.SESSION_PREFIX}${sessionId}`,
        this.config.sessionTimeout * 60,
        JSON.stringify(sessionContext)
      );

      // Generate JWT token
      const token = jwt.sign(
        {
          sessionId,
          userId,
          deviceTrusted,
          type: 'session',
        },
        process.env.JWT_SECRET!,
        {
          expiresIn: `${this.config.sessionTimeout}m`,
          issuer: 'coindaily-iam',
          audience: 'coindaily-app',
        }
      );

      logger.info('Secure session created', {
        sessionId,
        userId,
        deviceTrusted,
        requiresMfa,
        ipAddress: deviceInfo.ipAddress,
      });

      return {
        sessionId,
        token,
        expiresAt,
        requiresMfa,
        deviceTrusted,
      };

    } catch (error) {
      logger.error('Session creation failed', { error, userId });
      throw error;
    }
  }

  /**
   * Validate session and update activity
   */
  async validateSession(sessionId: string, ipAddress?: string): Promise<{
    valid: boolean;
    session?: SessionContext;
    reason?: string;
  }> {
    try {
      // Get session from cache first
      const cachedSession = await this.redis.get(`${this.SESSION_PREFIX}${sessionId}`);
      let session: SessionContext | undefined;

      if (cachedSession) {
        session = JSON.parse(cachedSession);
      } else {
        session = this.activeSessions.get(sessionId);
      }

      if (!session) {
        return {
          valid: false,
          reason: 'Session not found',
        };
      }

      // Check session timeout
      const now = new Date();
      const sessionAge = now.getTime() - session.lastActivity.getTime();
      const timeoutMs = this.config.sessionTimeout * 60 * 1000;

      if (sessionAge > timeoutMs) {
        await this.invalidateSession(sessionId);
        return {
          valid: false,
          reason: 'Session expired',
        };
      }

      // Check IP address consistency (if provided)
      if (ipAddress && session.ipAddress !== ipAddress) {
        // Log potential session hijacking
        this.emit('accessViolation', {
          userId: session.userId,
          ipAddress,
          resource: 'session',
          decision: 'deny',
          riskScore: 0.9,
          severity: 'high',
          description: 'Session IP address mismatch - potential hijacking',
          metadata: {
            sessionId,
            originalIp: session.ipAddress,
            newIp: ipAddress,
          },
        });

        await this.invalidateSession(sessionId);
        return {
          valid: false,
          reason: 'IP address mismatch',
        };
      }

      // Update last activity
      session.lastActivity = now;
      this.activeSessions.set(sessionId, session);
      await this.redis.setex(
        `${this.SESSION_PREFIX}${sessionId}`,
        this.config.sessionTimeout * 60,
        JSON.stringify(session)
      );

      return {
        valid: true,
        session,
      };

    } catch (error) {
      logger.error('Session validation failed', { error, sessionId });
      return {
        valid: false,
        reason: 'Validation error',
      };
    }
  }

  /**
   * Invalidate session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    try {
      this.activeSessions.delete(sessionId);
      await this.redis.del(`${this.SESSION_PREFIX}${sessionId}`);
      
      logger.info('Session invalidated', { sessionId });

    } catch (error) {
      logger.error('Session invalidation failed', { error, sessionId });
    }
  }

  /**
   * Get device trust information
   */
  async getDeviceTrust(fingerprint: string, userId?: string): Promise<DeviceTrust | null> {
    try {
      // Check cache first
      const cached = await this.redis.get(`${this.DEVICE_PREFIX}${fingerprint}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Get from database
      const device = await this.prisma.deviceTrust.findUnique({
        where: { deviceId: fingerprint },
      });

      if (device && device.userId === userId) {
        const trust: DeviceTrust = {
          deviceId: device.id,
          userId: device.userId,
          fingerprint: device.fingerprint,
          trustScore: device.trustScore,
          lastSeen: device.lastSeen,
          userAgent: device.userAgent || '',
          isActive: device.isActive,
        };
        
        // Add location only if it exists to avoid undefined assignment
        if (device.location) {
          trust.location = device.location;
        }

        // Cache for future use
        await this.redis.setex(
          `${this.DEVICE_PREFIX}${fingerprint}`,
          3600, // 1 hour
          JSON.stringify(trust)
        );

        return trust;
      }

      return null;

    } catch (error) {
      logger.error('Failed to get device trust', { error, fingerprint });
      return null;
    }
  }

  /**
   * Update device trust level
   */
  async updateDeviceTrust(
    fingerprint: string,
    userId: string,
    trustLevel: 'unknown' | 'low' | 'medium' | 'high' | 'trusted',
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      await this.prisma.deviceTrust.upsert({
        where: { deviceId: fingerprint },
        update: {
          trustScore: trustLevel === 'trusted' ? 0.9 : trustLevel === 'high' ? 0.8 : trustLevel === 'medium' ? 0.6 : trustLevel === 'low' ? 0.4 : 0.2,
          lastSeen: new Date(),
          riskFactors: JSON.stringify(metadata || {}),
        },
        create: {
          deviceId: fingerprint,
          fingerprint,
          userId,
          trustScore: trustLevel === 'trusted' ? 0.9 : trustLevel === 'high' ? 0.8 : trustLevel === 'medium' ? 0.6 : trustLevel === 'low' ? 0.4 : 0.2,
          lastSeen: new Date(),
          userAgent: metadata?.userAgent || 'unknown',
          location: metadata?.location,
          isActive: true,
          riskFactors: JSON.stringify(metadata || {}),
        },
      });

      // Update cache
      await this.redis.del(`${this.DEVICE_PREFIX}${fingerprint}`);

      logger.info('Device trust updated', { fingerprint, userId, trustLevel });

    } catch (error) {
      logger.error('Failed to update device trust', { error, fingerprint, trustLevel });
    }
  }

  /**
   * Get service status
   */
  async getStatus(): Promise<{
    operational: boolean;
    activeSessions: number;
    trustedDevices: number;
    activePolicies: number;
    zeroTrustEnabled: boolean;
  }> {
    try {
      const activePolicies = Array.from(this.zeroTrustPolicies.values())
        .filter(p => p.active).length;

      const trustedDevicesCount = await this.prisma.deviceTrust.count({
        where: {
          trustScore: { gte: 0.7 },
          isActive: true,
        },
      });

      return {
        operational: true,
        activeSessions: this.activeSessions.size,
        trustedDevices: trustedDevicesCount,
        activePolicies,
        zeroTrustEnabled: this.config.zeroTrustEnabled,
      };

    } catch (error) {
      logger.error('Failed to get IAM status', { error });
      return {
        operational: false,
        activeSessions: this.activeSessions.size,
        trustedDevices: 0,
        activePolicies: 0,
        zeroTrustEnabled: this.config.zeroTrustEnabled,
      };
    }
  }

  /**
   * Perform security scan
   */
  async performScan(): Promise<{
    scanId: string;
    timestamp: Date;
    findings: any[];
    recommendations: string[];
  }> {
    const scanId = `iam_scan_${Date.now()}`;
    const findings: any[] = [];
    const recommendations: string[] = [];

    try {
      // Check for stale sessions
      const staleSessions = await this.findStaleSessions();
      if (staleSessions.length > 0) {
        findings.push({
          type: 'stale_sessions',
          count: staleSessions.length,
          severity: 'medium',
        });
        recommendations.push(`Found ${staleSessions.length} stale sessions - consider cleanup`);
      }

      // Check for suspicious device activity
      const suspiciousDevices = await this.findSuspiciousDevices();
      if (suspiciousDevices.length > 0) {
        findings.push({
          type: 'suspicious_devices',
          devices: suspiciousDevices,
          severity: 'high',
        });
        recommendations.push(`Found ${suspiciousDevices.length} suspicious devices`);
      }

      // Check policy effectiveness
      const policyStats = await this.analyzePolicyEffectiveness();
      if (policyStats.ineffectivePolicies > 0) {
        findings.push({
          type: 'ineffective_policies',
          count: policyStats.ineffectivePolicies,
          severity: 'low',
        });
        recommendations.push('Some zero-trust policies may need review');
      }

      if (findings.length === 0) {
        recommendations.push('Identity and access management appears secure');
      }

      return {
        scanId,
        timestamp: new Date(),
        findings,
        recommendations,
      };

    } catch (error) {
      logger.error('IAM scan failed', { error, scanId });
      throw error;
    }
  }

  /**
   * Update configuration
   */
  async updateConfig(newConfig: Partial<IdentityConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.zeroTrustEnabled !== undefined) {
      if (newConfig.zeroTrustEnabled && this.zeroTrustPolicies.size === 0) {
        await this.initializeZeroTrustPolicies();
      }
    }

    logger.info('IAM config updated', { newConfig });
  }

  /**
   * Get metrics
   */
  async getMetrics(timeframe: '1h' | '24h' | '7d' | '30d'): Promise<{
    violations: number;
    blockedAttempts: number;
    newDevices: number;
    sessionCount: number;
  }> {
    try {
      // This would typically query audit logs or metrics database
      // For now, return placeholder data
      return {
        violations: 0,
        blockedAttempts: 0,
        newDevices: 0,
        sessionCount: this.activeSessions.size,
      };

    } catch (error) {
      logger.error('Failed to get IAM metrics', { error });
      return {
        violations: 0,
        blockedAttempts: 0,
        newDevices: 0,
        sessionCount: 0,
      };
    }
  }

  /**
   * Emergency lockdown
   */
  async emergencyLockdown(): Promise<void> {
    logger.warn('IAM emergency lockdown activated');

    // Invalidate all sessions
    for (const sessionId of this.activeSessions.keys()) {
      await this.invalidateSession(sessionId);
    }

    // Activate emergency policies
    await this.activateEmergencyPolicies();

    this.emit('emergencyLockdown', { service: 'IdentityAccessManagement' });
  }

  /**
   * Process security event
   */
  async processEvent(event: any): Promise<void> {
    if (event.type === 'access' && event.userId) {
      // Update risk scoring based on access patterns
      await this.updateUserRiskScore(event.userId, event.metadata);
    }
  }

  private async initializeZeroTrustPolicies(): Promise<void> {
    const defaultPolicies: ZeroTrustPolicy[] = [
      {
        id: 'unknown_device',
        name: 'Unknown Device Policy',
        description: 'Challenge access from unknown devices',
        rules: [
          {
            condition: 'deviceTrust === null || deviceTrust.trustLevel === "unknown"',
            action: 'challenge',
          },
        ],
        active: true,
        priority: 1,
      },
      {
        id: 'high_risk_location',
        name: 'High Risk Location Policy',
        description: 'Block access from high-risk locations',
        rules: [
          {
            condition: 'attempt.location && riskFactors.locationRisk > 0.8',
            action: 'deny',
          },
        ],
        active: true,
        priority: 2,
      },
      {
        id: 'unusual_hours',
        name: 'Unusual Hours Policy',
        description: 'Challenge access during unusual hours',
        rules: [
          {
            condition: 'riskFactors.timeRisk > 0.6',
            action: 'challenge',
          },
        ],
        active: true,
        priority: 3,
      },
    ];

    for (const policy of defaultPolicies) {
      this.zeroTrustPolicies.set(policy.id, policy);
    }

    logger.info('Zero-trust policies initialized', { count: defaultPolicies.length });
  }

  private async evaluatePolicy(
    policy: ZeroTrustPolicy,
    context: {
      attempt: AccessAttempt;
      userContext: any;
      deviceTrust: DeviceTrust | null;
    }
  ): Promise<{
    applies: boolean;
    decision: 'allow' | 'deny' | 'challenge';
    riskScore: number;
    reason?: string;
  }> {
    try {
      for (const rule of policy.rules) {
        // Simple condition evaluation (in production, use a safe eval library)
        const applies = this.evaluateCondition(rule.condition, context);
        
        if (applies) {
          return {
            applies: true,
            decision: rule.action === 'log' ? 'allow' : rule.action,
            riskScore: rule.action === 'deny' ? 1 : rule.action === 'challenge' ? 0.7 : 0.3,
            reason: policy.description,
          };
        }
      }

      return {
        applies: false,
        decision: 'allow',
        riskScore: 0,
      };

    } catch (error) {
      logger.error('Policy evaluation failed', { error, policyId: policy.id });
      return {
        applies: false,
        decision: 'allow',
        riskScore: 0,
      };
    }
  }

  private evaluateCondition(condition: string, context: any): boolean {
    // Simplified condition evaluation
    // In production, use a safe expression evaluator
    try {
      const { attempt, userContext, deviceTrust } = context;
      
      // Basic condition checks
      if (condition.includes('deviceTrust === null')) {
        return deviceTrust === null;
      }
      
      if (condition.includes('deviceTrust.trustLevel === "unknown"')) {
        return deviceTrust?.trustLevel === 'unknown';
      }

      return false;
    } catch {
      return false;
    }
  }

  private async calculateRiskFactors(
    attempt: AccessAttempt,
    userContext: any,
    deviceTrust: DeviceTrust | null
  ): Promise<{
    score: number;
    factors: Record<string, number>;
  }> {
    const factors: Record<string, number> = {};

    // Device trust factor
    if (!deviceTrust) {
      factors.deviceTrust = 0.5;
    } else {
      // Convert trust score to risk factor (higher trust = lower risk)
      factors.deviceTrust = Math.max(0, 1 - deviceTrust.trustScore);
    }

    // Time-based risk (placeholder)
    const hour = new Date().getHours();
    factors.timeRisk = (hour < 6 || hour > 22) ? 0.3 : 0.0;

    // Location-based risk (placeholder)
    factors.locationRisk = 0.0; // Would implement geo-location risk

    // User behavior risk (placeholder)
    factors.behaviorRisk = userContext?.riskScore || 0.0;

    const score = Math.max(...Object.values(factors));

    return { score, factors };
  }

  private getRequiredChallenges(riskScore: number): string[] {
    const challenges: string[] = [];

    if (riskScore > 0.7) {
      challenges.push('mfa');
    }
    
    if (riskScore > 0.8) {
      challenges.push('device_verification');
    }

    if (riskScore > 0.9) {
      challenges.push('admin_approval');
    }

    return challenges;
  }

  private async getUserContext(userId: string): Promise<any> {
    // Get user context from database
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        status: true,
        lastLoginAt: true,
      },
    });
  }

  private async updateDeviceUsage(
    fingerprint: string,
    userId: string,
    deviceInfo: any
  ): Promise<void> {
    await this.prisma.deviceTrust.upsert({
      where: { deviceId: fingerprint },
      update: {
        lastSeen: new Date(),
        userAgent: deviceInfo.userAgent,
        location: deviceInfo.location,
      },
      create: {
        deviceId: fingerprint,
        fingerprint,
        userId,
        trustScore: 0.2, // Default unknown trust level
        lastSeen: new Date(),
        userAgent: deviceInfo.userAgent,
        location: deviceInfo.location,
        isActive: true,
      },
    });
  }

  private async requiresMfaByPolicy(userId: string, deviceInfo: any): Promise<boolean> {
    // Implement MFA requirement logic based on policies
    return false; // Placeholder
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startSessionMonitoring(): void {
    // Monitor sessions for anomalies
    setInterval(async () => {
      await this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    const timeoutMs = this.config.sessionTimeout * 60 * 1000;

    for (const [sessionId, session] of this.activeSessions.entries()) {
      const age = now.getTime() - session.lastActivity.getTime();
      if (age > timeoutMs) {
        await this.invalidateSession(sessionId);
      }
    }
  }

  private async findStaleSessions(): Promise<any[]> {
    // Find sessions that haven't been active recently
    return [];
  }

  private async findSuspiciousDevices(): Promise<any[]> {
    // Find devices with suspicious activity patterns
    return [];
  }

  private async analyzePolicyEffectiveness(): Promise<{ ineffectivePolicies: number }> {
    // Analyze how effective zero-trust policies are
    return { ineffectivePolicies: 0 };
  }

  private async activateEmergencyPolicies(): Promise<void> {
    // Activate emergency security policies
    const emergencyPolicy: ZeroTrustPolicy = {
      id: 'emergency_lockdown',
      name: 'Emergency Lockdown Policy',
      description: 'Emergency security lockdown - deny all access',
      rules: [
        {
          condition: 'true',
          action: 'deny',
        },
      ],
      active: true,
      priority: 0,
    };

    this.zeroTrustPolicies.set(emergencyPolicy.id, emergencyPolicy);
  }

  private async updateUserRiskScore(userId: string, metadata: any): Promise<void> {
    // Update user risk score based on activity patterns
    // This would typically update a user risk profile
  }
}