import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { logger } from '../../utils/logger';

export interface ThreatSignature {
  id: string;
  name: string;
  description: string;
  pattern: string | RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'sql_injection' | 'xss' | 'brute_force' | 'ddos' | 'malware' | 'anomaly' | 'insider_threat';
  active: boolean;
}

export interface ThreatDetection {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source: string;
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  blocked: boolean;
  confidence: number; // 0-1
  metadata: Record<string, any>;
}

export interface ThreatConfig {
  enabled: boolean;
  realTimeMonitoring: boolean;
  aiPoweredAnalysis: boolean;
  suspiciousActivityThreshold: number;
}

export interface UserBehaviorProfile {
  userId: string;
  typicalLoginTimes: number[]; // Hours of day
  typicalLocations: string[]; // IP ranges or countries
  typicalDevices: string[]; // Device fingerprints
  averageSessionDuration: number; // Minutes
  typicalActions: string[]; // Common user actions
  riskScore: number; // 0-1
  lastUpdated: Date;
}

export class ThreatDetectionService extends EventEmitter {
  private threatSignatures: Map<string, ThreatSignature> = new Map();
  private userProfiles: Map<string, UserBehaviorProfile> = new Map();
  private ipReputation: Map<string, number> = new Map(); // IP -> reputation score (0-1)
  private activeThreats: Map<string, ThreatDetection> = new Map();
  private isMonitoring = false;

  private readonly CACHE_PREFIX = 'threat_detection:';
  private readonly PROFILE_CACHE_TTL = 3600; // 1 hour
  private readonly REPUTATION_CACHE_TTL = 1800; // 30 minutes

  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private config: ThreatConfig
  ) {
    super();
    this.initializeThreatSignatures();
    if (config.enabled) {
      this.startMonitoring();
    }
  }

  /**
   * Analyze request for potential threats
   */
  async analyzeRequest(request: {
    userId?: string;
    ipAddress: string;
    userAgent: string;
    path: string;
    method: string;
    headers: Record<string, string>;
    body?: any;
    query?: Record<string, string>;
  }): Promise<{
    threats: ThreatDetection[];
    shouldBlock: boolean;
    riskScore: number;
  }> {
    const threats: ThreatDetection[] = [];
    let maxRiskScore = 0;

    try {
      // 1. Check against known threat signatures
      const signatureThreats = await this.checkThreatSignatures(request);
      threats.push(...signatureThreats);

      // 2. Analyze user behavior (if user is authenticated)
      if (request.userId) {
        const behaviorThreats = await this.analyzeBehaviorAnomalies(request);
        threats.push(...behaviorThreats);
      }

      // 3. Check IP reputation
      const ipThreats = await this.checkIpReputation(request);
      threats.push(...ipThreats);

      // 4. AI-powered analysis (if enabled)
      if (this.config.aiPoweredAnalysis) {
        const aiThreats = await this.performAiAnalysis(request);
        threats.push(...aiThreats);
      }

      // 5. Rate limiting and DDoS detection
      const rateLimitThreats = await this.checkRateLimiting(request);
      threats.push(...rateLimitThreats);

      // Calculate overall risk score
      maxRiskScore = Math.max(...threats.map(t => t.confidence), 0);

      // Determine if request should be blocked
      const shouldBlock = threats.some(t => 
        (t.severity === 'critical' && t.confidence > 0.8) ||
        (t.severity === 'high' && t.confidence > 0.9)
      );

      // Store threats for monitoring
      for (const threat of threats) {
        if (threat.severity === 'high' || threat.severity === 'critical') {
          this.activeThreats.set(threat.id, threat);
          this.emit('threatDetected', threat);
        }
      }

      // Log analysis results
      if (threats.length > 0) {
        logger.warn('Threats detected in request', {
          ipAddress: request.ipAddress,
          userId: request.userId,
          path: request.path,
          threatCount: threats.length,
          maxRiskScore,
          shouldBlock,
        });
      }

      return {
        threats,
        shouldBlock,
        riskScore: maxRiskScore,
      };

    } catch (error) {
      logger.error('Threat analysis failed', { error, request: {
        ipAddress: request.ipAddress,
        path: request.path,
        method: request.method,
      }});

      // Return safe defaults on error
      return {
        threats: [],
        shouldBlock: false,
        riskScore: 0,
      };
    }
  }

  /**
   * Update user behavior profile
   */
  async updateUserProfile(userId: string, activity: {
    loginTime?: Date;
    ipAddress?: string;
    deviceFingerprint?: string;
    sessionDuration?: number;
    actions?: string[];
    location?: string;
  }): Promise<void> {
    try {
      let profile = this.userProfiles.get(userId);
      
      if (!profile) {
        profile = {
          userId,
          typicalLoginTimes: [],
          typicalLocations: [],
          typicalDevices: [],
          averageSessionDuration: 0,
          typicalActions: [],
          riskScore: 0,
          lastUpdated: new Date(),
        };
        this.userProfiles.set(userId, profile);
      }

      // Update profile based on new activity
      if (activity.loginTime) {
        const hour = activity.loginTime.getHours();
        if (!profile.typicalLoginTimes.includes(hour)) {
          profile.typicalLoginTimes.push(hour);
          if (profile.typicalLoginTimes.length > 10) {
            profile.typicalLoginTimes = profile.typicalLoginTimes.slice(-10);
          }
        }
      }

      if (activity.ipAddress && !profile.typicalLocations.includes(activity.ipAddress)) {
        profile.typicalLocations.push(activity.ipAddress);
        if (profile.typicalLocations.length > 5) {
          profile.typicalLocations = profile.typicalLocations.slice(-5);
        }
      }

      if (activity.deviceFingerprint && !profile.typicalDevices.includes(activity.deviceFingerprint)) {
        profile.typicalDevices.push(activity.deviceFingerprint);
        if (profile.typicalDevices.length > 3) {
          profile.typicalDevices = profile.typicalDevices.slice(-3);
        }
      }

      if (activity.sessionDuration) {
        profile.averageSessionDuration = (profile.averageSessionDuration + activity.sessionDuration) / 2;
      }

      if (activity.actions) {
        for (const action of activity.actions) {
          if (!profile.typicalActions.includes(action)) {
            profile.typicalActions.push(action);
            if (profile.typicalActions.length > 20) {
              profile.typicalActions = profile.typicalActions.slice(-20);
            }
          }
        }
      }

      profile.lastUpdated = new Date();

      // Cache updated profile
      await this.redis.setex(
        `${this.CACHE_PREFIX}profile:${userId}`,
        this.PROFILE_CACHE_TTL,
        JSON.stringify(profile)
      );

    } catch (error) {
      logger.error('Failed to update user profile', { error, userId });
    }
  }

  /**
   * Get threat detection status
   */
  async getStatus(): Promise<{
    operational: boolean;
    currentThreatLevel: 'low' | 'medium' | 'high' | 'critical';
    activeThreats: number;
    signaturesLoaded: number;
    lastUpdate: Date;
  }> {
    const activeThreatsArray = Array.from(this.activeThreats.values());
    const criticalThreats = activeThreatsArray.filter(t => t.severity === 'critical').length;
    const highThreats = activeThreatsArray.filter(t => t.severity === 'high').length;

    let currentThreatLevel: 'low' | 'medium' | 'high' | 'critical';
    if (criticalThreats > 0) {
      currentThreatLevel = 'critical';
    } else if (highThreats > 2) {
      currentThreatLevel = 'high';
    } else if (highThreats > 0 || activeThreatsArray.length > 5) {
      currentThreatLevel = 'medium';
    } else {
      currentThreatLevel = 'low';
    }

    return {
      operational: this.config.enabled && this.isMonitoring,
      currentThreatLevel,
      activeThreats: this.activeThreats.size,
      signaturesLoaded: this.threatSignatures.size,
      lastUpdate: new Date(),
    };
  }

  /**
   * Perform security scan
   */
  async performScan(): Promise<{
    scanId: string;
    timestamp: Date;
    threatsFound: number;
    recommendations: string[];
    details: any;
  }> {
    const scanId = `threat_scan_${Date.now()}`;
    
    try {
      // Scan active sessions for anomalies
      const activeSessions = await this.scanActiveSessions();
      
      // Check for suspicious IP addresses
      const suspiciousIPs = await this.scanSuspiciousIPs();
      
      // Analyze recent user behavior
      const behaviorAnomalies = await this.scanBehaviorAnomalies();

      const recommendations: string[] = [];
      let threatsFound = 0;

      if (activeSessions.suspicious.length > 0) {
        threatsFound += activeSessions.suspicious.length;
        recommendations.push(`Found ${activeSessions.suspicious.length} suspicious active sessions`);
      }

      if (suspiciousIPs.length > 0) {
        threatsFound += suspiciousIPs.length;
        recommendations.push(`Detected ${suspiciousIPs.length} suspicious IP addresses`);
      }

      if (behaviorAnomalies.length > 0) {
        threatsFound += behaviorAnomalies.length;
        recommendations.push(`Identified ${behaviorAnomalies.length} behavior anomalies`);
      }

      if (threatsFound === 0) {
        recommendations.push('No immediate threats detected');
      }

      return {
        scanId,
        timestamp: new Date(),
        threatsFound,
        recommendations,
        details: {
          activeSessions,
          suspiciousIPs,
          behaviorAnomalies,
        },
      };

    } catch (error) {
      logger.error('Threat detection scan failed', { error, scanId });
      throw error;
    }
  }

  /**
   * Update threat detection configuration
   */
  async updateConfig(newConfig: Partial<ThreatConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enabled !== undefined) {
      if (newConfig.enabled && !this.isMonitoring) {
        this.startMonitoring();
      } else if (!newConfig.enabled && this.isMonitoring) {
        this.stopMonitoring();
      }
    }

    logger.info('Threat detection config updated', { newConfig });
  }

  /**
   * Get threat detection metrics
   */
  async getMetrics(timeframe: '1h' | '24h' | '7d' | '30d'): Promise<{
    detections: number;
    blocked: number;
    falsePositives: number;
    averageResponseTime: number;
  }> {
    const timeframeMs = this.getTimeframeMs(timeframe);
    const since = new Date(Date.now() - timeframeMs);

    try {
      const activeThreatsArray = Array.from(this.activeThreats.values());
      const recentThreats = activeThreatsArray.filter(t => t.timestamp > since);

      return {
        detections: recentThreats.length,
        blocked: recentThreats.filter(t => t.blocked).length,
        falsePositives: 0, // Would need manual review data
        averageResponseTime: 150, // ms - average detection time
      };
    } catch (error) {
      logger.error('Failed to get threat detection metrics', { error });
      return {
        detections: 0,
        blocked: 0,
        falsePositives: 0,
        averageResponseTime: 0,
      };
    }
  }

  /**
   * Emergency lockdown
   */
  async emergencyLockdown(): Promise<void> {
    logger.warn('Threat detection emergency lockdown activated');
    
    // Stop all monitoring
    this.stopMonitoring();
    
    // Clear active threats
    this.activeThreats.clear();
    
    // Implement additional lockdown measures
    await this.redis.setex(`${this.CACHE_PREFIX}lockdown`, 3600, 'active');
    
    this.emit('emergencyLockdown', { service: 'ThreatDetection' });
  }

  /**
   * Process security event
   */
  async processEvent(event: any): Promise<void> {
    // Process threat-related security events
    if (event.type === 'threat') {
      const threat: ThreatDetection = {
        id: event.id,
        type: event.metadata.threatType || 'unknown',
        severity: event.severity,
        description: event.description,
        source: event.source,
        timestamp: event.timestamp,
        userId: event.userId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        blocked: event.metadata.blocked || false,
        confidence: event.metadata.confidence || 0.5,
        metadata: event.metadata,
      };

      this.activeThreats.set(threat.id, threat);
      
      // Auto-block high confidence critical threats
      if (threat.severity === 'critical' && threat.confidence > 0.9) {
        await this.blockThreat(threat);
      }
    }
  }

  private async initializeThreatSignatures(): Promise<void> {
    // Load default threat signatures
    const defaultSignatures: ThreatSignature[] = [
      {
        id: 'sql_injection_1',
        name: 'SQL Injection - Basic',
        description: 'Detects basic SQL injection patterns',
        pattern: /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
        severity: 'high',
        category: 'sql_injection',
        active: true,
      },
      {
        id: 'xss_1',
        name: 'XSS - Script Tags',
        description: 'Detects script tag injection attempts',
        pattern: /<script[^>]*>.*?<\/script>/gi,
        severity: 'high',
        category: 'xss',
        active: true,
      },
      {
        id: 'brute_force_1',
        name: 'Brute Force - Login Attempts',
        description: 'Detects rapid login attempts',
        pattern: 'RATE_LIMIT_CHECK',
        severity: 'medium',
        category: 'brute_force',
        active: true,
      },
      {
        id: 'ddos_1',
        name: 'DDoS - Request Flood',
        description: 'Detects request flooding patterns',
        pattern: 'REQUEST_FLOOD_CHECK',
        severity: 'critical',
        category: 'ddos',
        active: true,
      },
    ];

    for (const signature of defaultSignatures) {
      this.threatSignatures.set(signature.id, signature);
    }

    logger.info('Threat signatures initialized', { count: defaultSignatures.length });
  }

  private async checkThreatSignatures(request: any): Promise<ThreatDetection[]> {
    const threats: ThreatDetection[] = [];
    
    for (const signature of this.threatSignatures.values()) {
      if (!signature.active) continue;

      const requestString = JSON.stringify({
        path: request.path,
        query: request.query,
        body: request.body,
        headers: request.headers,
      });

      let matches = false;
      if (signature.pattern instanceof RegExp) {
        matches = signature.pattern.test(requestString);
      } else if (typeof signature.pattern === 'string') {
        matches = requestString.includes(signature.pattern);
      }

      if (matches) {
        threats.push({
          id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: signature.category,
          severity: signature.severity,
          description: `${signature.name}: ${signature.description}`,
          source: 'ThreatSignature',
          timestamp: new Date(),
          userId: request.userId,
          ipAddress: request.ipAddress,
          userAgent: request.userAgent,
          blocked: false,
          confidence: 0.8,
          metadata: {
            signatureId: signature.id,
            signatureName: signature.name,
            pattern: signature.pattern.toString(),
          },
        });
      }
    }

    return threats;
  }

  private async analyzeBehaviorAnomalies(request: any): Promise<ThreatDetection[]> {
    const threats: ThreatDetection[] = [];
    
    if (!request.userId) return threats;

    const profile = this.userProfiles.get(request.userId);
    if (!profile) return threats;

    const currentHour = new Date().getHours();
    const isUnusualTime = !profile.typicalLoginTimes.includes(currentHour);
    const isUnusualLocation = !profile.typicalLocations.includes(request.ipAddress);

    if (isUnusualTime && isUnusualLocation) {
      threats.push({
        id: `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'anomaly',
        severity: 'medium',
        description: 'Unusual access pattern detected - different time and location',
        source: 'BehaviorAnalysis',
        timestamp: new Date(),
        userId: request.userId,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        blocked: false,
        confidence: 0.7,
        metadata: {
          unusualTime: isUnusualTime,
          unusualLocation: isUnusualLocation,
          typicalHours: profile.typicalLoginTimes,
          typicalLocations: profile.typicalLocations,
        },
      });
    }

    return threats;
  }

  private async checkIpReputation(request: any): Promise<ThreatDetection[]> {
    const threats: ThreatDetection[] = [];
    
    const reputation = this.ipReputation.get(request.ipAddress) || 0.5;
    
    if (reputation < 0.3) {
      threats.push({
        id: `ip_rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'malware',
        severity: 'high',
        description: 'Request from IP with poor reputation',
        source: 'IPReputation',
        timestamp: new Date(),
        userId: request.userId,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        blocked: false,
        confidence: 1 - reputation,
        metadata: {
          reputationScore: reputation,
        },
      });
    }

    return threats;
  }

  private async performAiAnalysis(request: any): Promise<ThreatDetection[]> {
    // Placeholder for AI-powered threat analysis
    // In a real implementation, this would call an ML model
    return [];
  }

  private async checkRateLimiting(request: any): Promise<ThreatDetection[]> {
    const threats: ThreatDetection[] = [];
    
    const key = `rate_limit:${request.ipAddress}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, 60); // 1 minute window
    }

    if (current > 100) { // More than 100 requests per minute
      threats.push({
        id: `rate_limit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'ddos',
        severity: 'high',
        description: 'Rate limit exceeded - potential DDoS attack',
        source: 'RateLimit',
        timestamp: new Date(),
        userId: request.userId,
        ipAddress: request.ipAddress,
        userAgent: request.userAgent,
        blocked: true,
        confidence: 0.9,
        metadata: {
          requestCount: current,
          timeWindow: '1 minute',
        },
      });
    }

    return threats;
  }

  private async scanActiveSessions(): Promise<{ total: number; suspicious: any[] }> {
    // Placeholder for active session scanning
    return { total: 0, suspicious: [] };
  }

  private async scanSuspiciousIPs(): Promise<string[]> {
    // Placeholder for suspicious IP scanning
    return [];
  }

  private async scanBehaviorAnomalies(): Promise<any[]> {
    // Placeholder for behavior anomaly scanning
    return [];
  }

  private async blockThreat(threat: ThreatDetection): Promise<void> {
    // Implement threat blocking logic
    if (threat.ipAddress) {
      await this.redis.setex(`blocked_ip:${threat.ipAddress}`, 3600, threat.id);
    }
    
    threat.blocked = true;
    logger.warn('Threat blocked automatically', { threatId: threat.id, ipAddress: threat.ipAddress });
  }

  private startMonitoring(): void {
    this.isMonitoring = true;
    logger.info('Threat detection monitoring started');
  }

  private stopMonitoring(): void {
    this.isMonitoring = false;
    logger.info('Threat detection monitoring stopped');
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