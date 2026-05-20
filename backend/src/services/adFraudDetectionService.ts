import prisma from '../lib/prisma';
import { logger } from '../utils/logger';

interface ClickEvent {
  campaignId: string;
  adId?: string;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  geoLocation?: { country: string; city?: string; lat?: number; lng?: number };
  timestamp: Date;
  sessionId?: string;
}

interface FraudSignal {
  type: string;
  confidence: number;
  evidence: Record<string, any>;
}

const FRAUD_THRESHOLDS = {
  RAPID_CLICKS_WINDOW_MS: 5000,
  RAPID_CLICKS_MAX: 5,
  SAME_IP_DAILY_MAX: 50,
  BOT_UA_PATTERNS: [
    /bot/i, /crawler/i, /spider/i, /headless/i, /phantom/i, /selenium/i,
    /puppeteer/i, /playwright/i, /wget/i, /curl/i,
  ],
  CLICK_FARM_THRESHOLD: 0.8,
  GEO_MISMATCH_ENABLED: true,
};

export class AdFraudDetectionService {
  private recentClicks: Map<string, Array<{ timestamp: number; ip: string }>> = new Map();

  /**
   * Analyze a click event for fraud signals
   */
  async analyzeClick(event: ClickEvent): Promise<{ isFraud: boolean; signals: FraudSignal[]; severity: string }> {
    const signals: FraudSignal[] = [];

    const botSignal = this.detectBotUA(event.userAgent);
    if (botSignal) signals.push(botSignal);

    const rapidClickSignal = this.detectRapidClicks(event);
    if (rapidClickSignal) signals.push(rapidClickSignal);

    const ipFloodSignal = await this.detectIPFlood(event.ipAddress, event.campaignId);
    if (ipFloodSignal) signals.push(ipFloodSignal);

    if (event.deviceFingerprint) {
      const spoofSignal = this.detectDeviceSpoofing(event);
      if (spoofSignal) signals.push(spoofSignal);
    }

    const maxConfidence = signals.length > 0 ? Math.max(...signals.map(s => s.confidence)) : 0;
    const avgConfidence = signals.length > 0 ? signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length : 0;

    let severity = 'LOW';
    if (avgConfidence >= 0.8) severity = 'CRITICAL';
    else if (avgConfidence >= 0.6) severity = 'HIGH';
    else if (avgConfidence >= 0.4) severity = 'MEDIUM';

    const isFraud = signals.length > 0 && avgConfidence >= 0.5;

    if (isFraud) {
      await this.recordFraudEvent(event, signals, severity);
    }

    return { isFraud, signals, severity };
  }

  private detectBotUA(userAgent: string): FraudSignal | null {
    for (const pattern of FRAUD_THRESHOLDS.BOT_UA_PATTERNS) {
      if (pattern.test(userAgent)) {
        return {
          type: 'BOT_CLICK',
          confidence: 0.95,
          evidence: { pattern: pattern.toString(), userAgent },
        };
      }
    }

    if (!userAgent || userAgent.length < 20) {
      return {
        type: 'BOT_CLICK',
        confidence: 0.7,
        evidence: { reason: 'Suspiciously short or empty user agent', userAgent },
      };
    }

    return null;
  }

  private detectRapidClicks(event: ClickEvent): FraudSignal | null {
    const key = `${event.campaignId}:${event.ipAddress}`;
    const now = Date.now();

    if (!this.recentClicks.has(key)) {
      this.recentClicks.set(key, []);
    }

    const clicks = this.recentClicks.get(key)!;
    clicks.push({ timestamp: now, ip: event.ipAddress });

    const windowStart = now - FRAUD_THRESHOLDS.RAPID_CLICKS_WINDOW_MS;
    const recentClicks = clicks.filter(c => c.timestamp >= windowStart);
    this.recentClicks.set(key, recentClicks);

    if (recentClicks.length >= FRAUD_THRESHOLDS.RAPID_CLICKS_MAX) {
      return {
        type: 'RAPID_CLICKS',
        confidence: Math.min(0.95, 0.5 + (recentClicks.length - FRAUD_THRESHOLDS.RAPID_CLICKS_MAX) * 0.1),
        evidence: {
          clickCount: recentClicks.length,
          windowMs: FRAUD_THRESHOLDS.RAPID_CLICKS_WINDOW_MS,
          threshold: FRAUD_THRESHOLDS.RAPID_CLICKS_MAX,
        },
      };
    }

    return null;
  }

  private async detectIPFlood(ip: string, campaignId: string): Promise<FraudSignal | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyCount = await prisma.adFraudEvent.count({
      where: {
        ipAddress: ip,
        campaignId,
        createdAt: { gte: today },
      },
    });

    const existingClicks = dailyCount;

    if (existingClicks >= FRAUD_THRESHOLDS.SAME_IP_DAILY_MAX) {
      return {
        type: 'CLICK_FARM',
        confidence: Math.min(0.95, 0.6 + (existingClicks - FRAUD_THRESHOLDS.SAME_IP_DAILY_MAX) * 0.01),
        evidence: {
          dailyClicks: existingClicks,
          threshold: FRAUD_THRESHOLDS.SAME_IP_DAILY_MAX,
          ip,
        },
      };
    }

    return null;
  }

  private detectDeviceSpoofing(event: ClickEvent): FraudSignal | null {
    if (!event.deviceFingerprint) return null;

    const suspiciousPatterns = [
      event.deviceFingerprint.length < 10,
      event.deviceFingerprint === '0'.repeat(event.deviceFingerprint.length),
      /^[a-f0-9]{32}$/i.test(event.deviceFingerprint) && event.userAgent.includes('Headless'),
    ];

    if (suspiciousPatterns.some(Boolean)) {
      return {
        type: 'DEVICE_SPOOFING',
        confidence: 0.7,
        evidence: {
          fingerprint: event.deviceFingerprint,
          reason: 'Suspicious device fingerprint pattern',
        },
      };
    }

    return null;
  }

  private async recordFraudEvent(event: ClickEvent, signals: FraudSignal[], severity: string) {
    const primarySignal = signals.reduce((max, s) => s.confidence > max.confidence ? s : max, signals[0]);

    await prisma.adFraudEvent.create({
      data: {
        campaignId: event.campaignId,
        adId: event.adId,
        fraudType: primarySignal.type,
        confidence: primarySignal.confidence,
        severity,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        deviceFingerprint: event.deviceFingerprint,
        geoLocation: event.geoLocation ? JSON.stringify(event.geoLocation) : null,
        clickPattern: JSON.stringify(signals),
        sessionData: event.sessionId ? JSON.stringify({ sessionId: event.sessionId }) : null,
        actionTaken: severity === 'CRITICAL' ? 'BLOCKED' : 'FLAGGED',
        blockedClicks: 1,
      },
    });

    logger.warn(`Ad fraud detected: ${primarySignal.type} (${severity}) on campaign ${event.campaignId}`);
  }

  /**
   * Get fraud analytics for a campaign or globally
   */
  async getFraudAnalytics(options: {
    campaignId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {};
    if (options.campaignId) where.campaignId = options.campaignId;
    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [totalEvents, bySeverity, byType, totalBlocked, totalSaved] = await Promise.all([
      prisma.adFraudEvent.count({ where }),
      prisma.adFraudEvent.groupBy({
        by: ['severity'],
        where,
        _count: true,
      }),
      prisma.adFraudEvent.groupBy({
        by: ['fraudType'],
        where,
        _count: true,
        _avg: { confidence: true },
      }),
      prisma.adFraudEvent.aggregate({
        where: { ...where, actionTaken: 'BLOCKED' },
        _sum: { blockedClicks: true },
      }),
      prisma.adFraudEvent.aggregate({
        where,
        _sum: { savedBudget: true },
      }),
    ]);

    return {
      totalEvents,
      bySeverity,
      byType,
      totalBlocked: totalBlocked._sum.blockedClicks || 0,
      totalSaved: totalSaved._sum.savedBudget || 0,
    };
  }

  /**
   * Get recent fraud events for admin review
   */
  async getRecentFraudEvents(limit: number = 50) {
    return await prisma.adFraudEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Dismiss a fraud event (false positive)
   */
  async dismissFraudEvent(eventId: string, dismissedBy: string) {
    return await prisma.adFraudEvent.update({
      where: { id: eventId },
      data: {
        actionTaken: 'DISMISSED',
        actionTakenBy: dismissedBy,
        actionTakenAt: new Date(),
      },
    });
  }
}

export default new AdFraudDetectionService();
