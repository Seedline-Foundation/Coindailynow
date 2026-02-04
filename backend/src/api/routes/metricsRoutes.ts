/**
 * System Metrics API Routes
 * Provides real-time metrics for the admin dashboard without requiring Grafana login
 * 
 * Endpoints:
 * - GET /api/metrics/system - System-wide metrics (CPU, RAM, Disk)
 * - GET /api/metrics/ai - AI model performance metrics
 * - GET /api/metrics/services - Docker service health
 * - GET /api/metrics/overview - Combined dashboard overview
 * - GET /api/metrics/realtime - Real-time data freshness metrics
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// Prometheus server URL (internal Docker network)
const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://prometheus:9090';

// Cache for metrics (30 second TTL to reduce Prometheus load)
const metricsCache: Map<string, { data: any; timestamp: number }> = new Map();
const CACHE_TTL = 30000; // 30 seconds

interface PrometheusResult {
  metric: Record<string, string>;
  value: [number, string];
}

interface PrometheusResponse {
  status: string;
  data: {
    resultType: string;
    result: PrometheusResult[];
  };
}

/**
 * Query Prometheus with caching
 */
async function queryPrometheus(query: string, cacheKey?: string): Promise<any> {
  const key = cacheKey || query;
  const cached = metricsCache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  try {
    const response = await axios.get<PrometheusResponse>(`${PROMETHEUS_URL}/api/v1/query`, {
      params: { query },
      timeout: 5000
    });
    
    const data = response.data.data.result;
    metricsCache.set(key, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    console.error(`Prometheus query failed: ${query}`, error);
    return cached?.data || [];
  }
}

/**
 * Parse Prometheus value to number
 */
function parseValue(result: PrometheusResult[]): number {
  if (!result || result.length === 0) return 0;
  const firstResult = result[0];
  if (!firstResult || !firstResult.value || !firstResult.value[1]) return 0;
  return parseFloat(firstResult.value[1]) || 0;
}

/**
 * GET /api/metrics/system
 * System-wide metrics (CPU, RAM, Disk, Network)
 */
router.get('/system', async (req: Request, res: Response) => {
  try {
    const [
      cpuUsage,
      memoryTotal,
      memoryAvailable,
      diskUsed,
      diskTotal,
      networkRx,
      networkTx,
      loadAvg1,
      loadAvg5,
      loadAvg15
    ] = await Promise.all([
      queryPrometheus('100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'),
      queryPrometheus('node_memory_MemTotal_bytes'),
      queryPrometheus('node_memory_MemAvailable_bytes'),
      queryPrometheus('node_filesystem_size_bytes{mountpoint="/"} - node_filesystem_avail_bytes{mountpoint="/"}'),
      queryPrometheus('node_filesystem_size_bytes{mountpoint="/"}'),
      queryPrometheus('rate(node_network_receive_bytes_total{device="eth0"}[5m])'),
      queryPrometheus('rate(node_network_transmit_bytes_total{device="eth0"}[5m])'),
      queryPrometheus('node_load1'),
      queryPrometheus('node_load5'),
      queryPrometheus('node_load15')
    ]);

    const memTotal = parseValue(memoryTotal);
    const memAvail = parseValue(memoryAvailable);
    const diskUsedBytes = parseValue(diskUsed);
    const diskTotalBytes = parseValue(diskTotal);

    res.json({
      success: true,
      data: {
        cpu: {
          usage: parseValue(cpuUsage).toFixed(1),
          cores: 16, // Known from server spec
          load: {
            '1m': parseValue(loadAvg1).toFixed(2),
            '5m': parseValue(loadAvg5).toFixed(2),
            '15m': parseValue(loadAvg15).toFixed(2)
          }
        },
        memory: {
          total: Math.round(memTotal / (1024 * 1024 * 1024)), // GB
          used: Math.round((memTotal - memAvail) / (1024 * 1024 * 1024)),
          available: Math.round(memAvail / (1024 * 1024 * 1024)),
          usage: ((memTotal - memAvail) / memTotal * 100).toFixed(1)
        },
        disk: {
          total: Math.round(diskTotalBytes / (1024 * 1024 * 1024)), // GB
          used: Math.round(diskUsedBytes / (1024 * 1024 * 1024)),
          available: Math.round((diskTotalBytes - diskUsedBytes) / (1024 * 1024 * 1024)),
          usage: (diskUsedBytes / diskTotalBytes * 100).toFixed(1)
        },
        network: {
          rx: (parseValue(networkRx) / 1024 / 1024).toFixed(2), // MB/s
          tx: (parseValue(networkTx) / 1024 / 1024).toFixed(2)
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('System metrics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch system metrics' });
  }
});

/**
 * GET /api/metrics/ai
 * AI model performance metrics
 */
router.get('/ai', async (req: Request, res: Response) => {
  try {
    // Query AI service metrics
    const [
      llamaRequests,
      llamaLatency,
      llamaErrors,
      deepseekRequests,
      deepseekLatency,
      deepseekErrors,
      nllbRequests,
      nllbLatency,
      sdxlRequests,
      sdxlLatency,
      embeddingsRequests,
      embeddingsLatency
    ] = await Promise.all([
      queryPrometheus('sum(rate(http_requests_total{job="llama"}[5m]))'),
      queryPrometheus('histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="llama"}[5m]))'),
      queryPrometheus('sum(rate(http_requests_total{job="llama", status=~"5.."}[5m]))'),
      queryPrometheus('sum(rate(http_requests_total{job="deepseek"}[5m]))'),
      queryPrometheus('histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="deepseek"}[5m]))'),
      queryPrometheus('sum(rate(http_requests_total{job="deepseek", status=~"5.."}[5m]))'),
      queryPrometheus('sum(rate(translation_requests_total[5m]))'),
      queryPrometheus('histogram_quantile(0.95, rate(translation_duration_seconds_bucket[5m]))'),
      queryPrometheus('sum(rate(sdxl_requests_total[5m]))'),
      queryPrometheus('histogram_quantile(0.95, rate(sdxl_generation_duration_seconds_bucket[5m]))'),
      queryPrometheus('sum(rate(embedding_requests_total[5m]))'),
      queryPrometheus('histogram_quantile(0.95, rate(embedding_duration_seconds_bucket[5m]))')
    ]);

    res.json({
      success: true,
      data: {
        models: {
          llama: {
            name: 'Llama 3.1 8B (Writer)',
            status: 'healthy',
            port: 11434,
            requestsPerMinute: (parseValue(llamaRequests) * 60).toFixed(1),
            latencyP95: (parseValue(llamaLatency) * 1000).toFixed(0) + 'ms',
            errorRate: (parseValue(llamaErrors) * 100).toFixed(2) + '%',
            memoryAllocated: '12GB'
          },
          deepseek: {
            name: 'DeepSeek-R1 8B (Reviewer)',
            status: 'healthy',
            port: 11435,
            requestsPerMinute: (parseValue(deepseekRequests) * 60).toFixed(1),
            latencyP95: (parseValue(deepseekLatency) * 1000).toFixed(0) + 'ms',
            errorRate: (parseValue(deepseekErrors) * 100).toFixed(2) + '%',
            memoryAllocated: '10GB'
          },
          nllb: {
            name: 'NLLB-200 600M (Translator)',
            status: 'healthy',
            port: 8080,
            requestsPerMinute: (parseValue(nllbRequests) * 60).toFixed(1),
            latencyP95: (parseValue(nllbLatency) * 1000).toFixed(0) + 'ms',
            supportedLanguages: 15,
            memoryAllocated: '4GB'
          },
          sdxl: {
            name: 'SDXL (Image Generator)',
            status: 'healthy',
            port: 7860,
            requestsPerMinute: (parseValue(sdxlRequests) * 60).toFixed(1),
            latencyP95: (parseValue(sdxlLatency) * 1000).toFixed(0) + 'ms',
            memoryAllocated: '14GB'
          },
          embeddings: {
            name: 'BGE-base (Embeddings)',
            status: 'healthy',
            port: 8081,
            requestsPerMinute: (parseValue(embeddingsRequests) * 60).toFixed(1),
            latencyP95: (parseValue(embeddingsLatency) * 1000).toFixed(0) + 'ms',
            memoryAllocated: '2GB'
          }
        },
        totalMemoryAllocated: '42GB',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI metrics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch AI metrics' });
  }
});

/**
 * GET /api/metrics/services
 * Docker service health status
 */
router.get('/services', async (req: Request, res: Response) => {
  try {
    const [
      containerUp,
      containerCpu,
      containerMemory
    ] = await Promise.all([
      queryPrometheus('container_last_seen{name!=""}'),
      queryPrometheus('rate(container_cpu_usage_seconds_total{name!=""}[5m]) * 100'),
      queryPrometheus('container_memory_usage_bytes{name!=""}')
    ]);

    // Build service status map
    const services: Record<string, any> = {
      postgres: { name: 'PostgreSQL', port: 5432, status: 'unknown' },
      redis: { name: 'Redis Cache', port: 6379, status: 'unknown' },
      elasticsearch: { name: 'Elasticsearch', port: 9200, status: 'unknown' },
      prometheus: { name: 'Prometheus', port: 9090, status: 'unknown' },
      grafana: { name: 'Grafana', port: 3001, status: 'unknown' },
      nginx: { name: 'Nginx', port: 80, status: 'unknown' },
      backend: { name: 'Backend API', port: 4000, status: 'unknown' },
      frontend: { name: 'Frontend', port: 3000, status: 'unknown' },
      llama: { name: 'Llama AI', port: 11434, status: 'unknown' },
      deepseek: { name: 'DeepSeek AI', port: 11435, status: 'unknown' },
      nllb: { name: 'NLLB Translation', port: 8080, status: 'unknown' },
      sdxl: { name: 'SDXL Images', port: 7860, status: 'unknown' },
      embeddings: { name: 'BGE Embeddings', port: 8081, status: 'unknown' }
    };

    // Update status from Prometheus
    (containerUp || []).forEach((result: PrometheusResult) => {
      const name = result.metric.name?.replace('coindaily_', '').toLowerCase();
      if (name && name in services) {
        services[name as keyof typeof services].status = parseFloat(result.value[1]) > 0 ? 'healthy' : 'down';
      }
    });

    // Add CPU and memory info
    (containerCpu || []).forEach((result: PrometheusResult) => {
      const name = result.metric.name?.replace('coindaily_', '').toLowerCase();
      if (name && name in services) {
        services[name as keyof typeof services].cpu = parseFloat(result.value[1]).toFixed(1) + '%';
      }
    });

    (containerMemory || []).forEach((result: PrometheusResult) => {
      const name = result.metric.name?.replace('coindaily_', '').toLowerCase();
      if (name && name in services) {
        const memMB = parseFloat(result.value[1]) / (1024 * 1024);
        services[name as keyof typeof services].memory = memMB.toFixed(0) + 'MB';
      }
    });

    // Calculate overall health
    const healthyCounts = Object.values(services).filter((s: any) => s.status === 'healthy').length;
    const totalServices = Object.keys(services).length;
    const overallHealth = healthyCounts === totalServices ? 'healthy' : 
                          healthyCounts >= totalServices * 0.8 ? 'degraded' : 'critical';

    res.json({
      success: true,
      data: {
        services,
        summary: {
          total: totalServices,
          healthy: healthyCounts,
          degraded: Object.values(services).filter((s: any) => s.status === 'degraded').length,
          down: Object.values(services).filter((s: any) => s.status === 'down' || s.status === 'unknown').length,
          overallHealth
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Services metrics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch service metrics' });
  }
});

/**
 * GET /api/metrics/realtime
 * Real-time data freshness and AI processing metrics
 */
router.get('/realtime', async (req: Request, res: Response) => {
  try {
    const [
      twitterLastFetch,
      redditLastFetch,
      newsapiLastFetch,
      cryptopanicLastFetch,
      articlesGenerated24h,
      translationsCompleted24h,
      imagesGenerated24h,
      contentQueueSize,
      processingLatency
    ] = await Promise.all([
      queryPrometheus('twitter_last_fetch_timestamp'),
      queryPrometheus('reddit_last_fetch_timestamp'),
      queryPrometheus('newsapi_last_fetch_timestamp'),
      queryPrometheus('cryptopanic_last_fetch_timestamp'),
      queryPrometheus('sum(increase(ai_articles_generated_total[24h]))'),
      queryPrometheus('sum(increase(translations_completed_total[24h]))'),
      queryPrometheus('sum(increase(sdxl_images_generated_total[24h]))'),
      queryPrometheus('ai_content_queue_size'),
      queryPrometheus('histogram_quantile(0.95, rate(ai_pipeline_duration_seconds_bucket[1h]))')
    ]);

    const now = Date.now() / 1000;
    
    const calculateFreshness = (timestamp: number) => {
      if (!timestamp) return { status: 'unknown', age: 'N/A' };
      const ageSeconds = now - timestamp;
      const ageMinutes = Math.round(ageSeconds / 60);
      const status = ageMinutes < 15 ? 'fresh' : ageMinutes < 60 ? 'stale' : 'outdated';
      const age = ageMinutes < 60 ? `${ageMinutes}m ago` : `${Math.round(ageMinutes / 60)}h ago`;
      return { status, age };
    };

    res.json({
      success: true,
      data: {
        dataSources: {
          twitter: {
            name: 'Twitter/X Trends',
            ...calculateFreshness(parseValue(twitterLastFetch))
          },
          reddit: {
            name: 'Reddit Crypto',
            ...calculateFreshness(parseValue(redditLastFetch))
          },
          newsapi: {
            name: 'NewsAPI',
            ...calculateFreshness(parseValue(newsapiLastFetch))
          },
          cryptopanic: {
            name: 'CryptoPanic',
            ...calculateFreshness(parseValue(cryptopanicLastFetch))
          }
        },
        processing: {
          articlesGenerated24h: Math.round(parseValue(articlesGenerated24h)),
          translationsCompleted24h: Math.round(parseValue(translationsCompleted24h)),
          imagesGenerated24h: Math.round(parseValue(imagesGenerated24h)),
          queueSize: Math.round(parseValue(contentQueueSize)),
          pipelineLatencyP95: (parseValue(processingLatency) * 1000).toFixed(0) + 'ms'
        },
        schedule: {
          contentGeneration: 'Every hour at :00',
          trendingUpdate: 'Every 15 minutes',
          translationBatch: 'Every 30 minutes',
          imageGeneration: 'On article publish'
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Realtime metrics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch realtime metrics' });
  }
});

/**
 * GET /api/metrics/overview
 * Combined dashboard overview - all key metrics in one call
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    // Fetch all metrics in parallel
    const [systemRes, aiRes, servicesRes, realtimeRes] = await Promise.all([
      axios.get(`http://localhost:${process.env.PORT || 4000}/api/metrics/system`),
      axios.get(`http://localhost:${process.env.PORT || 4000}/api/metrics/ai`),
      axios.get(`http://localhost:${process.env.PORT || 4000}/api/metrics/services`),
      axios.get(`http://localhost:${process.env.PORT || 4000}/api/metrics/realtime`)
    ]);

    res.json({
      success: true,
      data: {
        system: systemRes.data.data,
        ai: aiRes.data.data,
        services: servicesRes.data.data,
        realtime: realtimeRes.data.data,
        serverSpec: {
          cpu: '16 cores',
          ram: '64GB',
          storage: '300GB NVMe'
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Overview metrics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch overview metrics' });
  }
});

export default router;
