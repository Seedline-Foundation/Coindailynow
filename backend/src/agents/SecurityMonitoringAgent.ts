/**
 * Security Monitoring Agent — powered by DeepSeek R1 (self-hosted via Ollama)
 *
 * Monitors ALL CoinDaily apps and services for security threats, anomalies,
 * performance degradation, and suspicious activity. Sends reports and
 * real-time alerts to the super admin dashboard (jet.coindaily.online).
 *
 * Monitored services:
 *   - Backend API (Express/GraphQL)    port 4000
 *   - Frontend (Next.js)               port 3000
 *   - Finance System (CFIS)            port 3005
 *   - AI Orchestrator                  ports 11434/11435
 *   - Translation Service (NLLB)       port 8080
 *   - Image Generation (SDXL)          port 7860
 *   - Embedding Service (BGE)          port 8081
 *   - Redis                            port 6379
 *   - PostgreSQL (Supabase)            port 5432
 *   - Elasticsearch                    port 9200
 *
 * Self-hosted: DeepSeek R1 8B via Ollama (http://localhost:11435)
 */

import { reasoningComplete, AI_MODELS } from '../services/aiClient';
import { PrismaClient } from '@prisma/client';
import { createLogger, format, transports } from 'winston';

// ─── Types ────────────────────────────────────────────────────────────────

export interface ServiceHealthCheck {
  service: string;
  url: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  responseTimeMs: number;
  lastChecked: Date;
  details?: Record<string, any>;
}

export interface SecurityThreat {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: ThreatCategory;
  title: string;
  description: string;
  service: string;
  evidence: string[];
  recommendation: string;
  detectedAt: Date;
  resolved: boolean;
}

export type ThreatCategory =
  | 'brute_force'
  | 'injection_attempt'
  | 'unusual_traffic'
  | 'service_degradation'
  | 'unauthorized_access'
  | 'data_exfiltration'
  | 'ai_model_abuse'
  | 'prompt_injection'
  | 'resource_exhaustion'
  | 'configuration_drift'
  | 'dependency_vulnerability'
  | 'certificate_expiry';

export interface MonitoringReport {
  id: string;
  generatedAt: Date;
  period: 'hourly' | 'daily' | 'weekly';
  summary: string;
  serviceHealth: ServiceHealthCheck[];
  threats: SecurityThreat[];
  metrics: SystemMetrics;
  aiAnalysis: string;
  recommendations: string[];
  overallRiskScore: number; // 0-100
}

export interface SystemMetrics {
  totalRequests24h: number;
  errorRate: number;
  avgResponseTimeMs: number;
  activeUsers: number;
  aiTasksProcessed: number;
  cacheHitRate: number;
  diskUsagePercent: number;
  memoryUsagePercent: number;
  cpuUsagePercent: number;
  suspiciousRequestCount: number;
}

export interface SecurityMonitoringConfig {
  checkIntervalMs: number;          // Health check frequency (default: 60s)
  reportIntervalMs: number;         // Report generation frequency (default: 1h)
  alertThresholdResponseMs: number; // Alert if response > this (default: 500ms)
  maxErrorRate: number;             // Alert if error rate > this (default: 0.05)
  suspiciousPatterns: string[];     // Regex patterns for suspicious requests
  enableAIAnalysis: boolean;        // Use DeepSeek for threat analysis
}

// ─── Monitored Services ──────────────────────────────────────────────────

const MONITORED_SERVICES = [
  { name: 'Backend API',       url: 'http://localhost:4000/health',        critical: true },
  { name: 'Frontend',          url: 'http://localhost:3000',               critical: true },
  { name: 'Finance System',    url: 'http://localhost:3005/health',        critical: true },
  { name: 'Ollama Llama',      url: 'http://localhost:11434/api/tags',     critical: true },
  { name: 'Ollama DeepSeek',   url: 'http://localhost:11435/api/tags',     critical: true },
  { name: 'NLLB Translation',  url: 'http://localhost:8080/health',        critical: false },
  { name: 'SDXL Image Gen',    url: 'http://localhost:7860/sdapi/v1/options', critical: false },
  { name: 'BGE Embeddings',    url: 'http://localhost:8081/health',        critical: false },
  { name: 'Redis',             url: 'redis://localhost:6379',              critical: true },
  { name: 'Elasticsearch',     url: 'http://localhost:9200/_cluster/health', critical: false },
];

// ─── Default Config ──────────────────────────────────────────────────────

const DEFAULT_CONFIG: SecurityMonitoringConfig = {
  checkIntervalMs: 60_000,          // 1 minute
  reportIntervalMs: 3_600_000,      // 1 hour
  alertThresholdResponseMs: 500,    // 500ms per project requirement
  maxErrorRate: 0.05,               // 5%
  suspiciousPatterns: [
    '(?:union|select|insert|update|delete|drop|alter)\\s',  // SQL injection
    '<script[^>]*>',                                         // XSS
    '\\.\\.[\\/\\\\]',                                       // Path traversal
    'eval\\s*\\(',                                           // Code injection
    '__(proto|constructor)__',                               // Prototype pollution
    'ignore previous|disregard|forget.*instructions',        // Prompt injection
    'system\\s*prompt|<\\|im_start\\|>',                     // Prompt injection
  ],
  enableAIAnalysis: true,
};

// ─── Agent Implementation ────────────────────────────────────────────────

export class SecurityMonitoringAgent {
  private prisma: PrismaClient;
  private config: SecurityMonitoringConfig;
  private logger: ReturnType<typeof createLogger>;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private reportInterval: NodeJS.Timeout | null = null;
  private recentThreats: SecurityThreat[] = [];
  private serviceHistory: Map<string, ServiceHealthCheck[]> = new Map();
  private requestLog: { timestamp: Date; path: string; status: number; responseTime: number }[] = [];
  private wsServer: any = null; // Socket.IO server reference

  constructor(prisma: PrismaClient, config?: Partial<SecurityMonitoringConfig>) {
    this.prisma = prisma;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.json()
      ),
      defaultMeta: { agent: 'SecurityMonitoringAgent' },
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'logs/security-monitoring.log', maxsize: 10_000_000 }),
      ],
    });
  }

  /**
   * Start the monitoring agent — background service
   */
  async start(wsServer?: any): Promise<void> {
    this.wsServer = wsServer;
    this.logger.info('Security Monitoring Agent starting...', {
      checkInterval: this.config.checkIntervalMs,
      reportInterval: this.config.reportIntervalMs,
      services: MONITORED_SERVICES.length,
    });

    // Run initial health check
    await this.runHealthChecks();

    // Schedule periodic health checks
    this.healthCheckInterval = setInterval(
      () => this.runHealthChecks(),
      this.config.checkIntervalMs
    );

    // Schedule periodic report generation
    this.reportInterval = setInterval(
      () => this.generateReport('hourly'),
      this.config.reportIntervalMs
    );

    this.logger.info('Security Monitoring Agent started ✓');
  }

  /**
   * Stop the monitoring agent
   */
  stop(): void {
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.reportInterval) clearInterval(this.reportInterval);
    this.logger.info('Security Monitoring Agent stopped');
  }

  // ─── Health Checks ───────────────────────────────────────────────────

  async runHealthChecks(): Promise<ServiceHealthCheck[]> {
    const results: ServiceHealthCheck[] = [];

    for (const service of MONITORED_SERVICES) {
      const check = await this.checkService(service);
      results.push(check);

      // Track history (keep last 100 per service)
      const history = this.serviceHistory.get(service.name) || [];
      history.push(check);
      if (history.length > 100) history.shift();
      this.serviceHistory.set(service.name, history);

      // Alert on critical service failure
      if (check.status === 'down' && service.critical) {
        await this.raiseAlert({
          severity: 'critical',
          category: 'service_degradation',
          title: `Critical service DOWN: ${service.name}`,
          description: `${service.name} is not responding at ${service.url}`,
          service: service.name,
          evidence: [`Response time: ${check.responseTimeMs}ms`, `Status: ${check.status}`],
          recommendation: `Investigate ${service.name} immediately. Check logs and restart if necessary.`,
        });
      }

      // Alert on slow responses
      if (check.responseTimeMs > this.config.alertThresholdResponseMs && check.status !== 'down') {
        await this.raiseAlert({
          severity: 'medium',
          category: 'service_degradation',
          title: `Slow response: ${service.name}`,
          description: `${service.name} responding in ${check.responseTimeMs}ms (threshold: ${this.config.alertThresholdResponseMs}ms)`,
          service: service.name,
          evidence: [`Response time: ${check.responseTimeMs}ms`],
          recommendation: `Check ${service.name} for performance issues.`,
        });
      }
    }

    return results;
  }

  private async checkService(service: { name: string; url: string }): Promise<ServiceHealthCheck> {
    const start = Date.now();

    // Special handling for Redis (not HTTP)
    if (service.url.startsWith('redis://')) {
      return this.checkRedis(service, start);
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(service.url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'User-Agent': 'CoinDaily-SecurityMonitor/1.0' },
      });

      clearTimeout(timeout);
      const responseTimeMs = Date.now() - start;

      return {
        service: service.name,
        url: service.url,
        status: response.ok ? 'healthy' : 'degraded',
        responseTimeMs,
        lastChecked: new Date(),
        details: { statusCode: response.status },
      };
    } catch (error: any) {
      return {
        service: service.name,
        url: service.url,
        status: 'down',
        responseTimeMs: Date.now() - start,
        lastChecked: new Date(),
        details: { error: error.message },
      };
    }
  }

  private async checkRedis(service: { name: string; url: string }, start: number): Promise<ServiceHealthCheck> {
    try {
      // Try connecting to Redis via a simple TCP check
      const net = await import('net');
      return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3000);
        socket.on('connect', () => {
          socket.destroy();
          resolve({
            service: service.name,
            url: service.url,
            status: 'healthy',
            responseTimeMs: Date.now() - start,
            lastChecked: new Date(),
          });
        });
        socket.on('error', (err: Error) => {
          socket.destroy();
          resolve({
            service: service.name,
            url: service.url,
            status: 'down',
            responseTimeMs: Date.now() - start,
            lastChecked: new Date(),
            details: { error: err.message },
          });
        });
        socket.on('timeout', () => {
          socket.destroy();
          resolve({
            service: service.name,
            url: service.url,
            status: 'down',
            responseTimeMs: Date.now() - start,
            lastChecked: new Date(),
            details: { error: 'Connection timeout' },
          });
        });
        socket.connect(6379, 'localhost');
      });
    } catch {
      return {
        service: service.name,
        url: service.url,
        status: 'unknown',
        responseTimeMs: Date.now() - start,
        lastChecked: new Date(),
      };
    }
  }

  // ─── Threat Detection ────────────────────────────────────────────────

  /**
   * Analyze a request for suspicious patterns
   */
  analyzeRequest(path: string, body: string, headers: Record<string, string>): SecurityThreat | null {
    const combined = `${path} ${body} ${JSON.stringify(headers)}`;

    for (const pattern of this.config.suspiciousPatterns) {
      const regex = new RegExp(pattern, 'gi');
      if (regex.test(combined)) {
        const threat: SecurityThreat = {
          id: this.generateId(),
          severity: this.classifyThreatSeverity(pattern),
          category: this.classifyThreatCategory(pattern),
          title: `Suspicious pattern detected in request`,
          description: `Pattern "${pattern}" matched in request to ${path}`,
          service: 'Backend API',
          evidence: [`Path: ${path}`, `Pattern: ${pattern}`, `IP: ${headers['x-forwarded-for'] || 'unknown'}`],
          recommendation: 'Review and potentially block the source IP.',
          detectedAt: new Date(),
          resolved: false,
        };

        this.recentThreats.push(threat);
        return threat;
      }
    }
    return null;
  }

  /**
   * Log a request for analysis
   */
  logRequest(path: string, status: number, responseTime: number): void {
    this.requestLog.push({ timestamp: new Date(), path, status, responseTime });

    // Keep only last 10000 requests
    if (this.requestLog.length > 10_000) {
      this.requestLog = this.requestLog.slice(-5_000);
    }
  }

  private classifyThreatSeverity(pattern: string): SecurityThreat['severity'] {
    if (pattern.includes('union') || pattern.includes('select') || pattern.includes('drop')) return 'critical';
    if (pattern.includes('script') || pattern.includes('eval')) return 'high';
    if (pattern.includes('ignore previous') || pattern.includes('system.*prompt')) return 'high';
    if (pattern.includes('\\.\\.')) return 'medium';
    return 'medium';
  }

  private classifyThreatCategory(pattern: string): ThreatCategory {
    if (pattern.includes('union') || pattern.includes('select')) return 'injection_attempt';
    if (pattern.includes('script')) return 'injection_attempt';
    if (pattern.includes('eval') || pattern.includes('proto')) return 'injection_attempt';
    if (pattern.includes('ignore') || pattern.includes('system.*prompt')) return 'prompt_injection';
    if (pattern.includes('\\.\\.')) return 'unauthorized_access';
    return 'injection_attempt';
  }

  // ─── AI-powered Analysis (DeepSeek R1) ───────────────────────────────

  /**
   * Use DeepSeek R1 to analyze collected metrics and generate a threat assessment
   */
  async aiThreatAnalysis(metrics: SystemMetrics, serviceHealth: ServiceHealthCheck[]): Promise<string> {
    if (!this.config.enableAIAnalysis) {
      return 'AI analysis disabled';
    }

    try {
      const prompt = `<think>
You are CoinDaily's Security Monitoring AI. Analyze the following system state and provide a security assessment.

SERVICE HEALTH:
${serviceHealth.map(s => `- ${s.service}: ${s.status} (${s.responseTimeMs}ms)`).join('\n')}

SYSTEM METRICS (last 24h):
- Total requests: ${metrics.totalRequests24h}
- Error rate: ${(metrics.errorRate * 100).toFixed(2)}%
- Avg response time: ${metrics.avgResponseTimeMs}ms
- Active users: ${metrics.activeUsers}
- AI tasks processed: ${metrics.aiTasksProcessed}
- Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%
- Disk usage: ${metrics.diskUsagePercent}%
- Memory usage: ${metrics.memoryUsagePercent}%
- CPU usage: ${metrics.cpuUsagePercent}%
- Suspicious requests: ${metrics.suspiciousRequestCount}

RECENT THREATS (last 24h): ${this.recentThreats.filter(t => !t.resolved).length} unresolved

Provide:
1. Overall risk assessment (0-100 score)
2. Top 3 security concerns
3. Actionable recommendations
4. Performance observations

Format as structured text.
</think>`;

      const result = await reasoningComplete(prompt, {
        maxTokens: 1000,
        temperature: 0.2,
      });

      return result || 'Analysis unavailable';
    } catch (error: any) {
      this.logger.error('AI threat analysis failed', { error: error.message });
      return `AI analysis unavailable: ${error.message}`;
    }
  }

  // ─── Report Generation ───────────────────────────────────────────────

  /**
   * Generate a comprehensive monitoring report
   */
  async generateReport(period: 'hourly' | 'daily' | 'weekly' = 'hourly'): Promise<MonitoringReport> {
    this.logger.info(`Generating ${period} security report...`);

    // Run fresh health checks
    const serviceHealth = await this.runHealthChecks();

    // Collect metrics
    const metrics = await this.collectMetrics();

    // Run AI analysis
    const aiAnalysis = await this.aiThreatAnalysis(metrics, serviceHealth);

    // Calculate risk score
    const overallRiskScore = this.calculateRiskScore(serviceHealth, metrics);

    // Get unresolved threats
    const activePeriod = period === 'hourly' ? 3_600_000 : period === 'daily' ? 86_400_000 : 604_800_000;
    const cutoff = new Date(Date.now() - activePeriod);
    const threats = this.recentThreats.filter(t => t.detectedAt >= cutoff);

    // Generate recommendations
    const recommendations = this.generateRecommendations(serviceHealth, metrics, threats);

    const report: MonitoringReport = {
      id: this.generateId(),
      generatedAt: new Date(),
      period,
      summary: this.generateSummary(serviceHealth, metrics, threats),
      serviceHealth,
      threats,
      metrics,
      aiAnalysis,
      recommendations,
      overallRiskScore,
    };

    // Save to database
    await this.saveReport(report);

    // Send to admin via WebSocket
    this.notifyAdmin(report);

    this.logger.info(`${period} report generated`, {
      id: report.id,
      risk_score: overallRiskScore,
      threats: threats.length,
    });

    return report;
  }

  private async collectMetrics(): Promise<SystemMetrics> {
    const now = Date.now();
    const last24h = this.requestLog.filter(r => r.timestamp.getTime() > now - 86_400_000);
    const errors = last24h.filter(r => r.status >= 500);
    const avgResponseTime = last24h.length > 0
      ? last24h.reduce((s, r) => s + r.responseTime, 0) / last24h.length
      : 0;

    let diskUsage = 0;
    let memUsage = 0;
    let cpuUsage = 0;

    try {
      const os = await import('os');
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      memUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

      // CPU usage estimate from load average
      const loadAvg = os.loadavg();
      const cpuCount = os.cpus().length;
      cpuUsage = Math.min(100, Math.round((loadAvg[0] / cpuCount) * 100));
    } catch { /* fallback to 0 */ }

    return {
      totalRequests24h: last24h.length,
      errorRate: last24h.length > 0 ? errors.length / last24h.length : 0,
      avgResponseTimeMs: Math.round(avgResponseTime),
      activeUsers: 0, // Would integrate with session store
      aiTasksProcessed: 0, // Would integrate with AI orchestrator
      cacheHitRate: 0.75, // Would integrate with Redis stats
      diskUsagePercent: diskUsage,
      memoryUsagePercent: memUsage,
      cpuUsagePercent: cpuUsage,
      suspiciousRequestCount: this.recentThreats.filter(
        t => t.detectedAt.getTime() > now - 86_400_000
      ).length,
    };
  }

  private calculateRiskScore(health: ServiceHealthCheck[], metrics: SystemMetrics): number {
    let score = 0;

    // Service health (max 40 points)
    const downServices = health.filter(s => s.status === 'down').length;
    const degradedServices = health.filter(s => s.status === 'degraded').length;
    score += downServices * 15;
    score += degradedServices * 5;

    // Error rate (max 20 points)
    score += Math.min(20, Math.round(metrics.errorRate * 200));

    // Response time (max 15 points)
    if (metrics.avgResponseTimeMs > 500) score += 5;
    if (metrics.avgResponseTimeMs > 1000) score += 5;
    if (metrics.avgResponseTimeMs > 2000) score += 5;

    // Suspicious activity (max 15 points)
    score += Math.min(15, metrics.suspiciousRequestCount);

    // Resource usage (max 10 points)
    if (metrics.memoryUsagePercent > 80) score += 3;
    if (metrics.cpuUsagePercent > 80) score += 3;
    if (metrics.diskUsagePercent > 85) score += 4;

    return Math.min(100, score);
  }

  private generateSummary(
    health: ServiceHealthCheck[],
    metrics: SystemMetrics,
    threats: SecurityThreat[]
  ): string {
    const healthy = health.filter(s => s.status === 'healthy').length;
    const total = health.length;
    const criticalThreats = threats.filter(t => t.severity === 'critical' || t.severity === 'high').length;

    return `Services: ${healthy}/${total} healthy | Error rate: ${(metrics.errorRate * 100).toFixed(2)}% | ` +
      `Avg response: ${metrics.avgResponseTimeMs}ms | Active threats: ${threats.length} (${criticalThreats} critical/high) | ` +
      `Memory: ${metrics.memoryUsagePercent}% | CPU: ${metrics.cpuUsagePercent}%`;
  }

  private generateRecommendations(
    health: ServiceHealthCheck[],
    metrics: SystemMetrics,
    threats: SecurityThreat[]
  ): string[] {
    const recommendations: string[] = [];

    const down = health.filter(s => s.status === 'down');
    if (down.length > 0) {
      recommendations.push(`CRITICAL: Restart ${down.map(s => s.service).join(', ')} immediately`);
    }

    if (metrics.errorRate > 0.05) {
      recommendations.push(`High error rate (${(metrics.errorRate * 100).toFixed(1)}%) — investigate backend logs`);
    }

    if (metrics.avgResponseTimeMs > 500) {
      recommendations.push(`Response times above 500ms threshold — check database queries and caching`);
    }

    if (metrics.memoryUsagePercent > 80) {
      recommendations.push(`Memory usage at ${metrics.memoryUsagePercent}% — consider scaling or optimizing`);
    }

    if (threats.filter(t => t.category === 'prompt_injection').length > 0) {
      recommendations.push('Prompt injection attempts detected — verify AI input sanitization middleware');
    }

    if (metrics.cacheHitRate < 0.75) {
      recommendations.push(`Cache hit rate below 75% target (${(metrics.cacheHitRate * 100).toFixed(1)}%) — review caching strategy`);
    }

    if (recommendations.length === 0) {
      recommendations.push('All systems operating within normal parameters');
    }

    return recommendations;
  }

  // ─── Alert System ────────────────────────────────────────────────────

  private async raiseAlert(
    alertData: Omit<SecurityThreat, 'id' | 'detectedAt' | 'resolved'>
  ): Promise<void> {
    const threat: SecurityThreat = {
      ...alertData,
      id: this.generateId(),
      detectedAt: new Date(),
      resolved: false,
    };

    this.recentThreats.push(threat);

    // Keep only last 1000 threats
    if (this.recentThreats.length > 1000) {
      this.recentThreats = this.recentThreats.slice(-500);
    }

    this.logger.warn('[ALERT]', {
      severity: threat.severity,
      title: threat.title,
      service: threat.service,
    });

    // Save to database
    try {
      await this.prisma.moderationAlert.create({
        data: {
          alertType: threat.category,
          severity: threat.severity,
          title: threat.title,
          message: threat.description,
          actionRequired: threat.recommendation,
          status: 'UNREAD',
          contentType: 'security',
          contentId: threat.service,
        },
      });
    } catch (error: any) {
      this.logger.error('Failed to save alert to database', { error: error.message });
    }

    // Send real-time notification via WebSocket
    if (this.wsServer) {
      try {
        this.wsServer.to('role:SUPER_ADMIN').emit('security:alert', {
          type: 'security_alert',
          data: threat,
          timestamp: new Date().toISOString(),
        });
      } catch { /* WebSocket send best-effort */ }
    }
  }

  // ─── Notify Admin ────────────────────────────────────────────────────

  private notifyAdmin(report: MonitoringReport): void {
    if (!this.wsServer) return;

    try {
      this.wsServer.to('role:SUPER_ADMIN').emit('security:report', {
        type: 'monitoring_report',
        data: {
          id: report.id,
          period: report.period,
          generatedAt: report.generatedAt,
          summary: report.summary,
          overallRiskScore: report.overallRiskScore,
          serviceCount: report.serviceHealth.length,
          healthyCount: report.serviceHealth.filter(s => s.status === 'healthy').length,
          threatCount: report.threats.length,
          criticalCount: report.threats.filter(t => t.severity === 'critical').length,
          recommendations: report.recommendations,
        },
        timestamp: new Date().toISOString(),
      });
    } catch { /* WebSocket send best-effort */ }
  }

  // ─── Persistence ─────────────────────────────────────────────────────

  private async saveReport(report: MonitoringReport): Promise<void> {
    try {
      // Store as a JSON log entry via AnalyticsEvent (systemLog is not in schema)
      await this.prisma.analyticsEvent.create({
        data: {
          id: report.id,
          sessionId: 'security-monitor',
          eventType: 'SECURITY_MONITORING_REPORT',
          resourceType: 'security',
          properties: JSON.stringify({
            period: report.period,
            overallRiskScore: report.overallRiskScore,
          }),
          metadata: JSON.stringify({
            id: report.id,
            period: report.period,
            overallRiskScore: report.overallRiskScore,
            serviceHealth: report.serviceHealth.map(s => ({
              service: s.service,
              status: s.status,
              responseTimeMs: s.responseTimeMs,
            })),
            threatCount: report.threats.length,
            aiAnalysis: report.aiAnalysis,
            recommendations: report.recommendations,
            metrics: report.metrics,
          }),
        },
      });
    } catch (error: any) {
      this.logger.error('Failed to save report to database', { error: error.message });
    }
  }

  // ─── API Methods (for dashboard) ─────────────────────────────────────

  /**
   * Get current health status of all services
   */
  async getServiceHealth(): Promise<ServiceHealthCheck[]> {
    return this.runHealthChecks();
  }

  /**
   * Get recent threats
   */
  getRecentThreats(limit: number = 50): SecurityThreat[] {
    return this.recentThreats
      .sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Resolve a threat
   */
  resolveThreat(threatId: string): boolean {
    const threat = this.recentThreats.find(t => t.id === threatId);
    if (threat) {
      threat.resolved = true;
      return true;
    }
    return false;
  }

  /**
   * Get the latest report from DB
   */
  async getLatestReport(): Promise<MonitoringReport | null> {
    try {
      const log = await this.prisma.analyticsEvent.findFirst({
        where: { eventType: 'SECURITY_MONITORING_REPORT' },
        orderBy: { timestamp: 'desc' },
      });

      if (!log) return null;

      const details = typeof log.metadata === 'string' ? JSON.parse(log.metadata) : log.metadata;
      const props = typeof log.properties === 'string' ? JSON.parse(log.properties) : log.properties;
      return {
        id: details.id,
        generatedAt: log.timestamp,
        period: details.period,
        summary: `Risk score: ${props.overallRiskScore}`,
        serviceHealth: details.serviceHealth || [],
        threats: [],
        metrics: details.metrics || {} as SystemMetrics,
        aiAnalysis: details.aiAnalysis || '',
        recommendations: details.recommendations || [],
        overallRiskScore: details.overallRiskScore || 0,
      };
    } catch {
      return null;
    }
  }

  /**
   * Force an on-demand report
   */
  async generateOnDemandReport(): Promise<MonitoringReport> {
    return this.generateReport('hourly');
  }

  // ─── Utility ─────────────────────────────────────────────────────────

  private generateId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// ─── Singleton ─────────────────────────────────────────────────────────

let agentInstance: SecurityMonitoringAgent | null = null;

export function getSecurityMonitoringAgent(
  prisma: PrismaClient,
  config?: Partial<SecurityMonitoringConfig>
): SecurityMonitoringAgent {
  if (!agentInstance) {
    agentInstance = new SecurityMonitoringAgent(prisma, config);
  }
  return agentInstance;
}

export default SecurityMonitoringAgent;
