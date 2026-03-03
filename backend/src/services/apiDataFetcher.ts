/**
 * API Data Fetcher Service
 *
 * Fetches & parses structured data from central banks, statistics offices,
 * and government APIs. Converts financial/policy data into news-ready items
 * for the AI content pipeline.
 *
 * Features:
 * - Specific parsers for major central bank API formats
 * - Generic JSON/XML fallback for unknown APIs
 * - Redis-backed caching with configurable TTL
 * - Rate limiting per API endpoint
 * - Retry logic with exponential backoff
 * - Structured output compatible with RSS aggregator
 */

import Redis from 'ioredis';
import { API_DATA_SOURCES, NewsSource } from '../config/newsSources';

// Optional Redis - only connect if enabled
const isRedisEnabled = process.env.REDIS_ENABLED !== 'false';
let redis: Redis | null = null;
if (isRedisEnabled) {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    retryStrategy: (times) => times > 3 ? null : Math.min(times * 100, 3000),
  });
  redis.on('error', (err) => console.warn('[ApiDataFetcher] Redis error:', err.message));
}

// Memory fallbacks when Redis is not available
const memoryCache: Map<string, { value: string; expiresAt: number }> = new Map();
const memoryRateLimits: Map<string, { count: number; expiresAt: number }> = new Map();

// Cache helper functions with memory fallback
async function cacheGet(key: string): Promise<string | null> {
  if (redis) {
    try { return await redis.get(key); } catch { /* fallback */ }
  }
  const entry = memoryCache.get(key);
  if (entry && entry.expiresAt > Date.now()) return entry.value;
  if (entry) memoryCache.delete(key);
  return null;
}

async function cacheSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (redis) {
    try { await redis.setex(key, ttlSeconds, value); return; } catch { /* fallback */ }
  }
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

async function cacheDel(key: string): Promise<void> {
  if (redis) {
    try { await redis.del(key); return; } catch { /* fallback */ }
  }
  memoryCache.delete(key);
}

async function cacheKeys(pattern: string): Promise<string[]> {
  if (redis) {
    try { return await redis.keys(pattern); } catch { /* fallback */ }
  }
  // Match pattern like 'api:cache:*'
  const prefix = pattern.replace('*', '');
  return Array.from(memoryCache.keys()).filter(k => k.startsWith(prefix));
}

// ============================================================================
// TYPES
// ============================================================================

export interface ApiDataItem {
  title: string;
  description: string;
  value?: number | string;
  unit?: string;
  previousValue?: number | string;
  changePercent?: number;
  date: Date;
  source: string;
  sourceUrl: string;
  region: string;
  category: string;
  dataType: 'exchange_rate' | 'interest_rate' | 'inflation' | 'gdp' | 'policy' | 'indicator' | 'announcement';
  metadata?: Record<string, any>;
}

export interface ApiResponse {
  success: boolean;
  items: ApiDataItem[];
  error?: string;
  cachedAt?: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FETCH_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const CACHE_TTL_SECONDS = 300; // 5 minutes for financial data
const RATE_LIMIT_KEY = 'api:rate_limit:';
const RATE_LIMIT_WINDOW = 60; // 1 minute
const RATE_LIMIT_MAX = 10; // max requests per minute per API

// ============================================================================
// RATE LIMITING
// ============================================================================

async function checkRateLimit(apiName: string): Promise<boolean> {
  const key = `${RATE_LIMIT_KEY}${apiName}`;
  
  if (redis) {
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, RATE_LIMIT_WINDOW);
      }
      return count <= RATE_LIMIT_MAX;
    } catch { /* fallback to memory */ }
  }
  
  // Memory fallback
  const now = Date.now();
  const entry = memoryRateLimits.get(key);
  if (!entry || entry.expiresAt < now) {
    memoryRateLimits.set(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW * 1000 });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

// ============================================================================
// HTTP FETCH WITH RETRY
// ============================================================================

async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = MAX_RETRIES
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'CoinDaily/1.0 (Financial News Aggregator)',
        'Accept': 'application/json, application/xml, text/xml',
        ...options.headers,
      },
    });
    clearTimeout(timeout);

    if (!response.ok && retries > 0) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (MAX_RETRIES - retries + 1)));
      return fetchWithRetry(url, options, retries - 1);
    }
    return response;
  } catch (error) {
    clearTimeout(timeout);
    if (retries > 0) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * (MAX_RETRIES - retries + 1)));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

// ============================================================================
// API-SPECIFIC PARSERS
// ============================================================================

/**
 * Bank Negara Malaysia API
 * https://api.bnm.gov.my/
 */
async function parseBankNegaraMalaysia(source: NewsSource): Promise<ApiDataItem[]> {
  const items: ApiDataItem[] = [];
  
  try {
    // Exchange rates endpoint
    const ratesUrl = 'https://api.bnm.gov.my/public/exchange-rate';
    const ratesResp = await fetchWithRetry(ratesUrl, {
      headers: { 'Accept': 'application/vnd.BNM.API.v1+json' }
    });
    
    if (ratesResp.ok) {
      const data = await ratesResp.json();
      if (data.data) {
        for (const rate of data.data) {
          items.push({
            title: `MYR/${rate.currency_code} Exchange Rate Update`,
            description: `Bank Negara Malaysia: 1 ${rate.currency_code} = ${rate.rate?.middle || rate.rate?.selling} MYR`,
            value: rate.rate?.middle || rate.rate?.selling,
            unit: 'MYR',
            date: new Date(rate.date || Date.now()),
            source: source.name,
            sourceUrl: source.url,
            region: source.region,
            category: source.category,
            dataType: 'exchange_rate',
            metadata: { currencyCode: rate.currency_code, buyRate: rate.rate?.buying, sellRate: rate.rate?.selling }
          });
        }
      }
    }

    // Interest rate endpoint
    const irUrl = 'https://api.bnm.gov.my/public/opr';
    const irResp = await fetchWithRetry(irUrl, {
      headers: { 'Accept': 'application/vnd.BNM.API.v1+json' }
    });
    
    if (irResp.ok) {
      const data = await irResp.json();
      if (data.data) {
        items.push({
          title: `Malaysia Overnight Policy Rate: ${data.data.rate}%`,
          description: `Bank Negara Malaysia maintains OPR at ${data.data.rate}%. Effective since ${data.data.effective_date}.`,
          value: data.data.rate,
          unit: '%',
          date: new Date(data.data.effective_date || Date.now()),
          source: source.name,
          sourceUrl: source.url,
          region: source.region,
          category: source.category,
          dataType: 'interest_rate',
          metadata: data.data
        });
      }
    }
  } catch (error) {
    console.error(`[API Fetcher] Bank Negara error:`, error);
  }

  return items;
}

/**
 * South African Reserve Bank (SARB)
 */
async function parseSARB(source: NewsSource): Promise<ApiDataItem[]> {
  const items: ApiDataItem[] = [];
  
  try {
    // SARB provides data via their statistics page - we'll fetch key indicators
    const indicators = [
      { code: 'KBP1569J', name: 'Prime Lending Rate', type: 'interest_rate' as const },
      { code: 'KBP1550Q', name: 'Inflation Rate (CPI)', type: 'inflation' as const },
    ];

    for (const ind of indicators) {
      try {
        const url = `https://www.resbank.co.za/en/home/what-we-do/statistics/key-statistics/${ind.code}`;
        // SARB doesn't have a direct JSON API, so we'll create a placeholder
        items.push({
          title: `South Africa ${ind.name} Update`,
          description: `SARB ${ind.name} - Check official source for latest value.`,
          date: new Date(),
          source: source.name,
          sourceUrl: source.url,
          region: source.region,
          category: source.category,
          dataType: ind.type,
          metadata: { indicatorCode: ind.code, requiresManualUpdate: true }
        });
      } catch (e) {
        // Continue to next indicator
      }
    }
  } catch (error) {
    console.error(`[API Fetcher] SARB error:`, error);
  }

  return items;
}

/**
 * Banco Central do Brasil
 * https://api.bcb.gov.br/
 */
async function parseBancoCentralBrasil(source: NewsSource): Promise<ApiDataItem[]> {
  const items: ApiDataItem[] = [];
  
  try {
    // SELIC Rate (base interest rate)
    const selicUrl = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json';
    const selicResp = await fetchWithRetry(selicUrl);
    
    if (selicResp.ok) {
      const data = await selicResp.json();
      if (data && data[0]) {
        items.push({
          title: `Brazil SELIC Rate: ${data[0].valor}%`,
          description: `Banco Central do Brasil: SELIC base rate at ${data[0].valor}% as of ${data[0].data}.`,
          value: parseFloat(data[0].valor),
          unit: '%',
          date: parseDate(data[0].data, 'dd/MM/yyyy'),
          source: source.name,
          sourceUrl: source.url,
          region: source.region,
          category: source.category,
          dataType: 'interest_rate',
          metadata: { series: 432 }
        });
      }
    }

    // IPCA Inflation
    const ipcaUrl = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados/ultimos/1?formato=json';
    const ipcaResp = await fetchWithRetry(ipcaUrl);
    
    if (ipcaResp.ok) {
      const data = await ipcaResp.json();
      if (data && data[0]) {
        items.push({
          title: `Brazil IPCA Inflation: ${data[0].valor}%`,
          description: `Monthly inflation rate (IPCA) at ${data[0].valor}% for ${data[0].data}.`,
          value: parseFloat(data[0].valor),
          unit: '%',
          date: parseDate(data[0].data, 'dd/MM/yyyy'),
          source: source.name,
          sourceUrl: source.url,
          region: source.region,
          category: source.category,
          dataType: 'inflation',
          metadata: { series: 433 }
        });
      }
    }

    // USD/BRL Exchange Rate
    const usdUrl = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados/ultimos/1?formato=json';
    const usdResp = await fetchWithRetry(usdUrl);
    
    if (usdResp.ok) {
      const data = await usdResp.json();
      if (data && data[0]) {
        items.push({
          title: `USD/BRL Exchange Rate: R$${data[0].valor}`,
          description: `US Dollar to Brazilian Real: 1 USD = R$${data[0].valor}`,
          value: parseFloat(data[0].valor),
          unit: 'BRL',
          date: parseDate(data[0].data, 'dd/MM/yyyy'),
          source: source.name,
          sourceUrl: source.url,
          region: source.region,
          category: source.category,
          dataType: 'exchange_rate',
          metadata: { series: 1, currencyPair: 'USD/BRL' }
        });
      }
    }
  } catch (error) {
    console.error(`[API Fetcher] Banco Central Brasil error:`, error);
  }

  return items;
}

/**
 * Bundesbank Germany
 * https://api.statistiken.bundesbank.de/
 */
async function parseBundesbank(source: NewsSource): Promise<ApiDataItem[]> {
  const items: ApiDataItem[] = [];
  
  try {
    // Euro reference rates
    const url = 'https://api.statistiken.bundesbank.de/rest/data/BBEX3/D.USD.EUR.BB.AC.000?detail=dataonly&lastNObservations=1';
    const resp = await fetchWithRetry(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (resp.ok) {
      const data = await resp.json();
      // SDMX-JSON format parsing
      if (data.dataSets?.[0]?.series?.['0:0:0:0:0:0']?.observations) {
        const obs = data.dataSets[0].series['0:0:0:0:0:0'].observations;
        const keys = Object.keys(obs);
        if (keys.length > 0) {
          const value = obs[keys[keys.length - 1]][0];
          items.push({
            title: `EUR/USD Exchange Rate: ${value}`,
            description: `Bundesbank: Euro to US Dollar reference rate at ${value}`,
            value: value,
            unit: 'USD',
            date: new Date(),
            source: source.name,
            sourceUrl: source.url,
            region: source.region,
            category: source.category,
            dataType: 'exchange_rate',
            metadata: { currencyPair: 'EUR/USD' }
          });
        }
      }
    }
  } catch (error) {
    console.error(`[API Fetcher] Bundesbank error:`, error);
  }

  return items;
}

/**
 * INSEE France
 * https://api.insee.fr/
 */
async function parseINSEE(source: NewsSource): Promise<ApiDataItem[]> {
  const items: ApiDataItem[] = [];
  
  try {
    // Consumer Price Index
    const cpiUrl = 'https://api.insee.fr/series/BDM/V1/data/SERIES_BDM/001759970';
    const resp = await fetchWithRetry(cpiUrl, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (resp.ok) {
      const data = await resp.json();
      if (data.observations?.length > 0) {
        const latest = data.observations[data.observations.length - 1];
        items.push({
          title: `France CPI Index: ${latest.OBS_VALUE}`,
          description: `INSEE Consumer Price Index for France: ${latest.OBS_VALUE}`,
          value: parseFloat(latest.OBS_VALUE),
          date: new Date(latest.TIME_PERIOD || Date.now()),
          source: source.name,
          sourceUrl: source.url,
          region: source.region,
          category: source.category,
          dataType: 'inflation',
          metadata: { seriesId: '001759970' }
        });
      }
    }
  } catch (error) {
    console.error(`[API Fetcher] INSEE error:`, error);
  }

  return items;
}

/**
 * Bank of Canada Valet API
 * https://www.bankofcanada.ca/valet/
 */
async function parseBankOfCanada(source: NewsSource): Promise<ApiDataItem[]> {
  const items: ApiDataItem[] = [];
  
  try {
    // Exchange rates
    const fxUrl = 'https://www.bankofcanada.ca/valet/observations/FXUSDCAD/json?recent=1';
    const fxResp = await fetchWithRetry(fxUrl);
    
    if (fxResp.ok) {
      const data = await fxResp.json();
      if (data.observations?.length > 0) {
        const latest = data.observations[0];
        items.push({
          title: `USD/CAD Exchange Rate: ${latest.FXUSDCAD.v}`,
          description: `Bank of Canada: 1 USD = ${latest.FXUSDCAD.v} CAD`,
          value: parseFloat(latest.FXUSDCAD.v),
          unit: 'CAD',
          date: new Date(latest.d),
          source: source.name,
          sourceUrl: source.url,
          region: source.region,
          category: source.category,
          dataType: 'exchange_rate',
          metadata: { currencyPair: 'USD/CAD' }
        });
      }
    }

    // Policy interest rate
    const irUrl = 'https://www.bankofcanada.ca/valet/observations/V39079/json?recent=1';
    const irResp = await fetchWithRetry(irUrl);
    
    if (irResp.ok) {
      const data = await irResp.json();
      if (data.observations?.length > 0) {
        const latest = data.observations[0];
        items.push({
          title: `Canada Policy Interest Rate: ${latest.V39079.v}%`,
          description: `Bank of Canada target for the overnight rate at ${latest.V39079.v}%`,
          value: parseFloat(latest.V39079.v),
          unit: '%',
          date: new Date(latest.d),
          source: source.name,
          sourceUrl: source.url,
          region: source.region,
          category: source.category,
          dataType: 'interest_rate',
          metadata: { seriesId: 'V39079' }
        });
      }
    }
  } catch (error) {
    console.error(`[API Fetcher] Bank of Canada error:`, error);
  }

  return items;
}

/**
 * UK Office for National Statistics (ONS)
 */
async function parseONS(source: NewsSource): Promise<ApiDataItem[]> {
  const items: ApiDataItem[] = [];
  
  try {
    // CPI Inflation
    const cpiUrl = 'https://api.beta.ons.gov.uk/v1/datasets/cpih01/editions/time-series/versions/25/observations?time=*&geography=K02000001&aggregate=cpih1dim1A0';
    const resp = await fetchWithRetry(cpiUrl);
    
    if (resp.ok) {
      const data = await resp.json();
      if (data.observations?.length > 0) {
        const latest = data.observations[data.observations.length - 1];
        items.push({
          title: `UK CPIH Inflation: ${latest.observation}%`,
          description: `ONS Consumer Prices Index including owner occupiers' housing costs`,
          value: parseFloat(latest.observation),
          unit: '%',
          date: new Date(),
          source: source.name,
          sourceUrl: source.url,
          region: source.region,
          category: source.category,
          dataType: 'inflation',
          metadata: { dataset: 'cpih01' }
        });
      }
    }
  } catch (error) {
    console.error(`[API Fetcher] ONS error:`, error);
  }

  return items;
}

/**
 * Banco Central de Chile
 */
async function parseBancoCentralChile(source: NewsSource): Promise<ApiDataItem[]> {
  const items: ApiDataItem[] = [];
  
  try {
    // TPM (Monetary Policy Rate)
    const tpmUrl = 'https://si3.bcentral.cl/SieteRestWS/SieteRestWS.ashx?user=anonymous&pass=anonymous&function=GetSeries&timeseries=F022.TPM.TAS.D001&firstdate=2024-01-01';
    const resp = await fetchWithRetry(tpmUrl);
    
    if (resp.ok) {
      const data = await resp.json();
      if (data?.Series?.Obs?.length > 0) {
        const latest = data.Series.Obs[data.Series.Obs.length - 1];
        items.push({
          title: `Chile Monetary Policy Rate: ${latest.value}%`,
          description: `Banco Central de Chile TPM at ${latest.value}%`,
          value: parseFloat(latest.value),
          unit: '%',
          date: new Date(latest.indexDateString || Date.now()),
          source: source.name,
          sourceUrl: source.url,
          region: source.region,
          category: source.category,
          dataType: 'interest_rate',
          metadata: { series: 'TPM' }
        });
      }
    }
  } catch (error) {
    console.error(`[API Fetcher] Banco Central Chile error:`, error);
  }

  return items;
}

/**
 * IBGE Brazil Statistics
 */
async function parseIBGE(source: NewsSource): Promise<ApiDataItem[]> {
  const items: ApiDataItem[] = [];
  
  try {
    // GDP Growth
    const gdpUrl = 'https://servicodados.ibge.gov.br/api/v3/agregados/5932/periodos/-1/variaveis/6564?localidades=N1[all]';
    const resp = await fetchWithRetry(gdpUrl);
    
    if (resp.ok) {
      const data = await resp.json();
      if (data?.[0]?.resultados?.[0]?.series?.[0]?.serie) {
        const serie = data[0].resultados[0].series[0].serie;
        const periods = Object.keys(serie);
        if (periods.length > 0) {
          const latestPeriod = periods[periods.length - 1];
          const value = serie[latestPeriod];
          items.push({
            title: `Brazil GDP Growth: ${value}%`,
            description: `IBGE: Brazilian GDP quarterly growth rate at ${value}%`,
            value: parseFloat(value),
            unit: '%',
            date: new Date(),
            source: source.name,
            sourceUrl: source.url,
            region: source.region,
            category: source.category,
            dataType: 'gdp',
            metadata: { period: latestPeriod }
          });
        }
      }
    }
  } catch (error) {
    console.error(`[API Fetcher] IBGE error:`, error);
  }

  return items;
}

/**
 * World Bank API (generic for multiple countries)
 */
async function parseWorldBank(source: NewsSource): Promise<ApiDataItem[]> {
  const items: ApiDataItem[] = [];
  
  try {
    const resp = await fetchWithRetry(source.url);
    
    if (resp.ok) {
      const data = await resp.json();
      // World Bank returns [metadata, data] array
      if (Array.isArray(data) && data[1]?.length > 0) {
        const latest = data[1][0];
        if (latest.value !== null) {
          items.push({
            title: `${latest.country?.value || source.region} GDP: $${(latest.value / 1e9).toFixed(2)}B`,
            description: `World Bank: ${latest.indicator?.value || 'GDP'} for ${latest.country?.value}`,
            value: latest.value,
            unit: 'USD',
            date: new Date(`${latest.date}-01-01`),
            source: source.name,
            sourceUrl: source.url,
            region: source.region,
            category: source.category,
            dataType: 'gdp',
            metadata: { indicator: latest.indicator?.id, year: latest.date }
          });
        }
      }
    }
  } catch (error) {
    console.error(`[API Fetcher] World Bank error:`, error);
  }

  return items;
}

/**
 * ReliefWeb API (policy/disaster reports)
 */
async function parseReliefWeb(source: NewsSource): Promise<ApiDataItem[]> {
  const items: ApiDataItem[] = [];
  
  try {
    const resp = await fetchWithRetry(source.url);
    
    if (resp.ok) {
      const data = await resp.json();
      if (data.data?.length > 0) {
        for (const report of data.data.slice(0, 5)) {
          items.push({
            title: report.fields?.title || 'Policy Report',
            description: report.fields?.body?.substring(0, 500) || '',
            date: new Date(report.fields?.date?.created || Date.now()),
            source: source.name,
            sourceUrl: report.fields?.url_alias || source.url,
            region: source.region,
            category: source.category,
            dataType: 'policy',
            metadata: { id: report.id, format: report.fields?.format?.[0]?.name }
          });
        }
      }
    }
  } catch (error) {
    console.error(`[API Fetcher] ReliefWeb error:`, error);
  }

  return items;
}

/**
 * SEC EDGAR API (US regulatory filings)
 */
async function parseSECEdgar(source: NewsSource): Promise<ApiDataItem[]> {
  const items: ApiDataItem[] = [];
  
  try {
    // Recent filings endpoint
    const url = 'https://efts.sec.gov/LATEST/search-index?q=*&dateRange=custom&startdt=2024-01-01&enddt=2024-12-31&forms=8-K,10-K,10-Q&from=0&size=10';
    const resp = await fetchWithRetry(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (resp.ok) {
      const data = await resp.json();
      if (data.hits?.hits?.length > 0) {
        for (const hit of data.hits.hits.slice(0, 5)) {
          const filing = hit._source;
          items.push({
            title: `SEC Filing: ${filing.form} - ${filing.display_names?.[0] || 'Company'}`,
            description: `${filing.form} filing by ${filing.display_names?.[0]} on ${filing.file_date}`,
            date: new Date(filing.file_date || Date.now()),
            source: source.name,
            sourceUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${filing.ciks?.[0]}`,
            region: source.region,
            category: source.category,
            dataType: 'policy',
            metadata: { form: filing.form, cik: filing.ciks?.[0] }
          });
        }
      }
    }
  } catch (error) {
    console.error(`[API Fetcher] SEC EDGAR error:`, error);
  }

  return items;
}

/**
 * Generic JSON API parser - fallback for unknown APIs
 */
async function parseGenericJson(source: NewsSource): Promise<ApiDataItem[]> {
  const items: ApiDataItem[] = [];
  
  try {
    const resp = await fetchWithRetry(source.url);
    
    if (resp.ok) {
      const text = await resp.text();
      try {
        const data = JSON.parse(text);
        
        // Try to extract meaningful data from common patterns
        const extractItems = (obj: any, prefix = ''): void => {
          if (Array.isArray(obj)) {
            obj.slice(0, 10).forEach((item, i) => {
              if (typeof item === 'object' && item !== null) {
                const title = item.title || item.name || item.label || `${source.name} Item ${i + 1}`;
                const value = item.value || item.rate || item.price || item.amount;
                const date = item.date || item.timestamp || item.created_at || item.updated_at;
                
                items.push({
                  title: String(title),
                  description: item.description || item.summary || JSON.stringify(item).substring(0, 200),
                  value: value,
                  date: date ? new Date(date) : new Date(),
                  source: source.name,
                  sourceUrl: source.url,
                  region: source.region,
                  category: source.category,
                  dataType: 'indicator',
                  metadata: item
                });
              }
            });
          } else if (typeof obj === 'object' && obj !== null) {
            // Look for data arrays in common keys
            const dataKeys = ['data', 'results', 'items', 'records', 'observations', 'series'];
            for (const key of dataKeys) {
              if (obj[key]) {
                extractItems(obj[key], `${prefix}${key}.`);
                break;
              }
            }
          }
        };
        
        extractItems(data);
      } catch (parseError) {
        console.warn(`[API Fetcher] JSON parse error for ${source.name}`);
      }
    }
  } catch (error) {
    console.error(`[API Fetcher] Generic JSON error for ${source.name}:`, error);
  }

  return items;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function parseDate(dateStr: string, format: string): Date {
  if (!dateStr) return new Date();
  
  if (format === 'dd/MM/yyyy') {
    const [day, month, year] = dateStr.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

// ============================================================================
// PARSER ROUTER
// ============================================================================

type ParserFunction = (source: NewsSource) => Promise<ApiDataItem[]>;

const PARSER_MAP: Record<string, ParserFunction> = {
  'Bank Negara API': parseBankNegaraMalaysia,
  'SARB OpenAPI': parseSARB,
  'Banco Central Brasil API': parseBancoCentralBrasil,
  'Bundesbank API': parseBundesbank,
  'INSEE API': parseINSEE,
  'Bank of Canada Valet API': parseBankOfCanada,
  'ONS API': parseONS,
  'Banco Central Chile API': parseBancoCentralChile,
  'IBGE API': parseIBGE,
  'World Bank LC API': parseWorldBank,
  'ReliefWeb VU API': parseReliefWeb,
  'SEC EDGAR API': parseSECEdgar,
};

function getParser(source: NewsSource): ParserFunction {
  return PARSER_MAP[source.name] || parseGenericJson;
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Fetch data from a single API source
 */
export async function fetchApiSource(source: NewsSource): Promise<ApiResponse> {
  const cacheKey = `api:cache:${source.name}`;
  
  // Check cache first
  const cached = await cacheGet(cacheKey);
  if (cached) {
    const data = JSON.parse(cached);
    return {
      success: true,
      items: data.items,
      cachedAt: new Date(data.cachedAt)
    };
  }

  // Check rate limit
  if (!await checkRateLimit(source.name)) {
    return {
      success: false,
      items: [],
      error: 'Rate limit exceeded'
    };
  }

  try {
    const parser = getParser(source);
    const items = await parser(source);
    
    // Cache results
    const cacheData = {
      items,
      cachedAt: new Date().toISOString()
    };
    await cacheSet(cacheKey, JSON.stringify(cacheData), CACHE_TTL_SECONDS);

    return {
      success: true,
      items
    };
  } catch (error) {
    return {
      success: false,
      items: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetch all API data sources
 */
export async function fetchAllApiSources(): Promise<ApiDataItem[]> {
  const apiSources = API_DATA_SOURCES;
  const allItems: ApiDataItem[] = [];
  
  // Process in batches of 5 to avoid overwhelming APIs
  const BATCH_SIZE = 5;
  
  for (let i = 0; i < apiSources.length; i += BATCH_SIZE) {
    const batch = apiSources.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(source => fetchApiSource(source))
    );
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.success) {
        allItems.push(...result.value.items);
      }
    }
    
    // Small delay between batches
    if (i + BATCH_SIZE < apiSources.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`[API Fetcher] Fetched ${allItems.length} items from ${apiSources.length} API sources`);
  return allItems;
}

/**
 * Fetch API sources by region
 */
export async function fetchApiSourcesByRegion(region: string): Promise<ApiDataItem[]> {
  const regionSources = API_DATA_SOURCES.filter(
    s => s.region === region.toUpperCase() || s.region === 'GLOBAL'
  );
  
  const allItems: ApiDataItem[] = [];
  
  for (const source of regionSources) {
    const result = await fetchApiSource(source);
    if (result.success) {
      allItems.push(...result.items);
    }
  }

  return allItems;
}

/**
 * Fetch financial data (exchange rates, interest rates, inflation)
 */
export async function fetchFinancialData(): Promise<ApiDataItem[]> {
  const financeSources = API_DATA_SOURCES.filter(
    s => s.category.toLowerCase().includes('finance')
  );
  
  const allItems: ApiDataItem[] = [];
  
  for (const source of financeSources) {
    const result = await fetchApiSource(source);
    if (result.success) {
      allItems.push(...result.items);
    }
  }

  return allItems;
}

/**
 * Get cached API data without fetching (for fast reads)
 */
export async function getCachedApiData(sourceName?: string): Promise<ApiDataItem[]> {
  const items: ApiDataItem[] = [];
  
  if (sourceName) {
    const cached = await cacheGet(`api:cache:${sourceName}`);
    if (cached) {
      const data = JSON.parse(cached);
      return data.items;
    }
  } else {
    // Get all cached data
    const keys = await cacheKeys('api:cache:*');
    for (const key of keys) {
      const cached = await cacheGet(key);
      if (cached) {
        const data = JSON.parse(cached);
        items.push(...data.items);
      }
    }
  }

  return items;
}

/**
 * Clear API cache
 */
export async function clearApiCache(sourceName?: string): Promise<void> {
  if (sourceName) {
    await cacheDel(`api:cache:${sourceName}`);
  } else {
    const keys = await cacheKeys('api:cache:*');
    for (const key of keys) {
      await cacheDel(key);
    }
  }
}

/**
 * Get API source status
 */
export async function getApiSourceStatus(): Promise<Record<string, { cached: boolean; cachedAt?: Date; itemCount?: number }>> {
  const status: Record<string, { cached: boolean; cachedAt?: Date; itemCount?: number }> = {};
  
  for (const source of API_DATA_SOURCES) {
    const cached = await cacheGet(`api:cache:${source.name}`);
    if (cached) {
      const data = JSON.parse(cached);
      status[source.name] = {
        cached: true,
        cachedAt: new Date(data.cachedAt),
        itemCount: data.items.length
      };
    } else {
      status[source.name] = { cached: false };
    }
  }

  return status;
}

export default {
  fetchApiSource,
  fetchAllApiSources,
  fetchApiSourcesByRegion,
  fetchFinancialData,
  getCachedApiData,
  clearApiCache,
  getApiSourceStatus,
};
