import prisma from '../lib/prisma';
import { logger } from '../utils/logger';

interface IndexCalculationInput {
  countryCode: string;
  countryName: string;
  subMetrics: Record<string, number>;
}

const INDEX_DEFINITIONS = {
  EMAI: {
    name: 'CHIMA EM Crypto Adoption Index',
    symbol: 'EMAI',
    indexType: 'ADOPTION',
    description: 'Monthly composite score per country measuring crypto adoption velocity across emerging markets. Factors: wallet growth rate, on-chain volume, P2P trading volume, exchange sign-ups, search interest.',
    methodology: 'Weighted composite of 5 sub-metrics per country: Wallet Growth (25%), On-Chain Volume (25%), P2P Trading Volume (20%), Exchange Sign-ups (15%), Search Interest (15%). Normalized to 0-100 scale.',
    updateFrequency: 'MONTHLY',
    subMetricKeys: ['walletGrowth', 'onChainVolume', 'p2pVolume', 'exchangeSignups', 'searchInterest'],
    subMetricWeights: { walletGrowth: 0.25, onChainVolume: 0.25, p2pVolume: 0.20, exchangeSignups: 0.15, searchInterest: 0.15 },
  },
  ADAI: {
    name: 'CHIMA Africa DeFi Activity Index',
    symbol: 'ADAI',
    indexType: 'DEFI_ACTIVITY',
    description: 'Tracks DeFi protocol usage across Sub-Saharan Africa: TVL bridged from African wallets, stablecoin flows, yield farming participation. Weekly publication.',
    methodology: 'Aggregate of DeFi activity metrics from African wallets: TVL (30%), Stablecoin Transfers (25%), Unique DeFi Users (20%), Yield Farming Participation (15%), DEX Volume (10%). Indexed to base 100.',
    updateFrequency: 'WEEKLY',
    subMetricKeys: ['tvl', 'stablecoinTransfers', 'uniqueDefiUsers', 'yieldFarming', 'dexVolume'],
    subMetricWeights: { tvl: 0.30, stablecoinTransfers: 0.25, uniqueDefiUsers: 0.20, yieldFarming: 0.15, dexVolume: 0.10 },
  },
  RRS: {
    name: 'CHIMA EM Regulatory Risk Score',
    symbol: 'RRS',
    indexType: 'REGULATORY_RISK',
    description: 'Daily risk score for 40 EM countries: 0 (ban) to 100 (fully progressive). Tracks legislation changes, enforcement actions, central bank statements, and FATF grey list status.',
    methodology: 'Per-country composite: Legal Status (25%), Licensing Framework (20%), Tax Clarity (15%), AML/CFT Compliance (15%), CBDC Progress (10%), Enforcement History (10%), FATF Status (5%). Scale 0-100.',
    updateFrequency: 'DAILY',
    subMetricKeys: ['legalStatus', 'licensingFramework', 'taxClarity', 'amlCompliance', 'cbdcProgress', 'enforcement', 'fatfStatus'],
    subMetricWeights: { legalStatus: 0.25, licensingFramework: 0.20, taxClarity: 0.15, amlCompliance: 0.15, cbdcProgress: 0.10, enforcement: 0.10, fatfStatus: 0.05 },
  },
  CRI: {
    name: 'CHIMA Caribbean Remittance Corridor Index',
    symbol: 'CRI',
    indexType: 'REMITTANCE',
    description: 'Tracks cost and speed of money transfers into Caribbean islands via crypto vs traditional rails. Unique dataset covering remittance costs, volume, speed, and crypto adoption in corridors.',
    methodology: 'Per-corridor composite: Transfer Cost Savings (30%), Volume Growth (25%), Speed Advantage (20%), Adoption Rate (15%), Corridor Coverage (10%). Indexed to base 100.',
    updateFrequency: 'WEEKLY',
    subMetricKeys: ['costSavings', 'volumeGrowth', 'speedAdvantage', 'adoptionRate', 'corridorCoverage'],
    subMetricWeights: { costSavings: 0.30, volumeGrowth: 0.25, speedAdvantage: 0.20, adoptionRate: 0.15, corridorCoverage: 0.10 },
  },
};

export class ChimaIndexService {
  /**
   * Initialize all CHIMA indices with seed data
   */
  async initializeIndices() {
    const results = [];

    for (const [symbol, def] of Object.entries(INDEX_DEFINITIONS)) {
      const existing = await prisma.chimaIndex.findUnique({
        where: { symbol },
      });

      if (!existing) {
        const index = await prisma.chimaIndex.create({
          data: {
            name: def.name,
            symbol: def.symbol,
            indexType: def.indexType,
            description: def.description,
            methodology: def.methodology,
            updateFrequency: def.updateFrequency,
            dataSourcesDesc: JSON.stringify({
              subMetricKeys: def.subMetricKeys,
              weights: def.subMetricWeights,
            }),
            currentValue: 100,
            previousValue: 100,
            allTimeHigh: 100,
            allTimeLow: 100,
            isPublished: true,
            lastCalculated: new Date(),
          },
        });
        results.push({ action: 'created', symbol, id: index.id });
        logger.info(`Created CHIMA index: ${def.name}`);
      } else {
        results.push({ action: 'exists', symbol, id: existing.id });
      }
    }

    return results;
  }

  /**
   * Calculate index value from country-level inputs
   */
  async calculateIndex(symbol: string, countryInputs: IndexCalculationInput[]) {
    const def = INDEX_DEFINITIONS[symbol as keyof typeof INDEX_DEFINITIONS];
    if (!def) throw new Error(`Unknown index symbol: ${symbol}`);

    const index = await prisma.chimaIndex.findUnique({
      where: { symbol },
    });
    if (!index) throw new Error(`Index not found: ${symbol}`);

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const input of countryInputs) {
      let countryScore = 0;

      for (const [metric, weight] of Object.entries(def.subMetricWeights)) {
        const value = input.subMetrics[metric] || 0;
        countryScore += value * weight;
      }

      const countryWeight = 1.0;
      totalWeightedScore += countryScore * countryWeight;
      totalWeight += countryWeight;

      await prisma.chimaCountryScore.upsert({
        where: {
          indexId_countryCode: {
            indexId: index.id,
            countryCode: input.countryCode,
          },
        },
        update: {
          score: countryScore,
          previousScore: (await prisma.chimaCountryScore.findFirst({
            where: { indexId: index.id, countryCode: input.countryCode },
          }))?.score || 0,
          subMetrics: JSON.stringify(input.subMetrics),
          lastUpdated: new Date(),
        },
        create: {
          indexId: index.id,
          countryCode: input.countryCode,
          countryName: input.countryName,
          score: countryScore,
          subMetrics: JSON.stringify(input.subMetrics),
        },
      });
    }

    const newValue = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
    const previousValue = index.currentValue;

    await prisma.chimaIndex.update({
      where: { symbol },
      data: {
        previousValue,
        currentValue: newValue,
        change24h: newValue - previousValue,
        changePercent24h: previousValue > 0 ? ((newValue - previousValue) / previousValue) * 100 : 0,
        allTimeHigh: Math.max(index.allTimeHigh, newValue),
        allTimeLow: Math.min(index.allTimeLow, newValue),
        athDate: newValue > index.allTimeHigh ? new Date() : index.athDate,
        atlDate: newValue < index.allTimeLow ? new Date() : index.atlDate,
        lastCalculated: new Date(),
        components: JSON.stringify(countryInputs.map(c => ({
          country: c.countryCode,
          name: c.countryName,
          score: Object.entries(def.subMetricWeights).reduce(
            (sum, [metric, weight]) => sum + (c.subMetrics[metric] || 0) * weight,
            0
          ),
        }))),
      },
    });

    await prisma.chimaIndexHistory.create({
      data: {
        indexId: index.id,
        value: newValue,
        components: JSON.stringify(countryInputs),
        timestamp: new Date(),
      },
    });

    return { symbol, newValue, previousValue, change: newValue - previousValue };
  }

  /**
   * Get all indices summary
   */
  async getAllIndices() {
    return await prisma.chimaIndex.findMany({
      where: { isPublished: true },
      include: {
        countryScores: {
          orderBy: { rank: 'asc' },
          take: 10,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get single index with full detail
   */
  async getIndex(symbol: string) {
    const index = await prisma.chimaIndex.findUnique({
      where: { symbol },
      include: {
        countryScores: {
          orderBy: { score: 'desc' },
        },
        historicalData: {
          orderBy: { timestamp: 'desc' },
          take: 365,
        },
      },
    });

    return index;
  }

  /**
   * Get index historical data for charts
   */
  async getIndexHistory(symbol: string, days: number = 30) {
    const index = await prisma.chimaIndex.findUnique({
      where: { symbol },
    });
    if (!index) return null;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return await prisma.chimaIndexHistory.findMany({
      where: {
        indexId: index.id,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
    });
  }

  /**
   * API endpoint data for enterprise clients
   */
  async getIndexAPIData(symbol: string, format: 'json' | 'csv' = 'json') {
    const index = await this.getIndex(symbol);
    if (!index) return null;

    if (format === 'csv') {
      let csv = 'timestamp,value,change\n';
      for (const h of index.historicalData) {
        csv += `${h.timestamp.toISOString()},${h.value},${h.changePercent || 0}\n`;
      }
      return csv;
    }

    return {
      index: {
        name: index.name,
        symbol: index.symbol,
        type: index.indexType,
        methodology: index.methodology,
        updateFrequency: index.updateFrequency,
      },
      current: {
        value: index.currentValue,
        change24h: index.change24h,
        changePercent24h: index.changePercent24h,
        change7d: index.change7d,
        change30d: index.change30d,
        allTimeHigh: index.allTimeHigh,
        allTimeLow: index.allTimeLow,
        lastCalculated: index.lastCalculated,
      },
      countries: index.countryScores.map(c => ({
        code: c.countryCode,
        name: c.countryName,
        score: c.score,
        previousScore: c.previousScore,
        rank: c.rank,
        subMetrics: c.subMetrics ? JSON.parse(c.subMetrics) : null,
      })),
      historicalData: index.historicalData.map(h => ({
        timestamp: h.timestamp,
        value: h.value,
      })),
    };
  }
}

export default new ChimaIndexService();
