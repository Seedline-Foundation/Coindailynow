import prisma from '../lib/prisma';
import { logger } from '../utils/logger';
import crypto from 'crypto';

interface RegulatorySource {
  countryCode: string;
  url: string;
  name: string;
}

const REGULATORY_SOURCES: RegulatorySource[] = [
  // Africa (14 countries)
  { countryCode: 'NG', url: 'https://sec.gov.ng', name: 'SEC Nigeria' },
  { countryCode: 'NG', url: 'https://cbn.gov.ng', name: 'Central Bank of Nigeria' },
  { countryCode: 'KE', url: 'https://cma.or.ke', name: 'CMA Kenya' },
  { countryCode: 'KE', url: 'https://centralbank.go.ke', name: 'Central Bank of Kenya' },
  { countryCode: 'ZA', url: 'https://fsca.co.za', name: 'FSCA South Africa' },
  { countryCode: 'GH', url: 'https://bog.gov.gh', name: 'Bank of Ghana' },
  { countryCode: 'TZ', url: 'https://bot.go.tz', name: 'Bank of Tanzania' },
  { countryCode: 'UG', url: 'https://bou.or.ug', name: 'Bank of Uganda' },
  { countryCode: 'RW', url: 'https://bnr.rw', name: 'National Bank of Rwanda' },
  { countryCode: 'MU', url: 'https://fscmauritius.org', name: 'FSC Mauritius' },
  { countryCode: 'SC', url: 'https://fsaseychelles.sc', name: 'FSA Seychelles' },
  { countryCode: 'EG', url: 'https://cbe.org.eg', name: 'Central Bank of Egypt' },
  { countryCode: 'ET', url: 'https://nbe.gov.et', name: 'National Bank of Ethiopia' },
  { countryCode: 'NA', url: 'https://bon.com.na', name: 'Bank of Namibia' },
  { countryCode: 'BW', url: 'https://bankofbotswana.bw', name: 'Bank of Botswana' },
  { countryCode: 'ZM', url: 'https://boz.zm', name: 'Bank of Zambia' },
  // Caribbean (8 countries)
  { countryCode: 'JM', url: 'https://boj.org.jm', name: 'Bank of Jamaica' },
  { countryCode: 'TT', url: 'https://central-bank.org.tt', name: 'Central Bank of Trinidad & Tobago' },
  { countryCode: 'BB', url: 'https://centralbank.org.bb', name: 'Central Bank of Barbados' },
  { countryCode: 'BS', url: 'https://centralbankbahamas.com', name: 'Central Bank of The Bahamas' },
  { countryCode: 'KY', url: 'https://cima.ky', name: 'CIMA Cayman Islands' },
  { countryCode: 'VG', url: 'https://bvifsc.vg', name: 'BVI FSC' },
  { countryCode: 'HT', url: 'https://brh.ht', name: 'Banque de la République d\'Haïti' },
  { countryCode: 'DO', url: 'https://bancentral.gov.do', name: 'Banco Central de la República Dominicana' },
  // Latin America (11 countries)
  { countryCode: 'BR', url: 'https://bcb.gov.br', name: 'Banco Central do Brasil' },
  { countryCode: 'AR', url: 'https://bcra.gob.ar', name: 'BCRA Argentina' },
  { countryCode: 'CO', url: 'https://banrep.gov.co', name: 'Banco de la República Colombia' },
  { countryCode: 'MX', url: 'https://banxico.org.mx', name: 'Banxico Mexico' },
  { countryCode: 'VE', url: 'https://bcv.org.ve', name: 'BCV Venezuela' },
  { countryCode: 'CL', url: 'https://bcentral.cl', name: 'Banco Central de Chile' },
  { countryCode: 'PE', url: 'https://bcrp.gob.pe', name: 'BCRP Peru' },
  { countryCode: 'EC', url: 'https://bce.fin.ec', name: 'BCE Ecuador' },
  { countryCode: 'PA', url: 'https://superbancos.gob.pa', name: 'SBP Panama' },
  { countryCode: 'UY', url: 'https://bcu.gub.uy', name: 'BCU Uruguay' },
  { countryCode: 'SV', url: 'https://bcr.gob.sv', name: 'BCR El Salvador' },
];

export class RegulatoryChangeDetectionService {
  /**
   * Take a snapshot of a regulatory source page.
   * In production, this would use a web scraper (Crawlee/Puppeteer).
   * Here we define the pipeline and data flow.
   */
  async takeSnapshot(source: RegulatorySource, contentText: string) {
    const contentHash = crypto.createHash('sha256').update(contentText).digest('hex');

    const previousSnapshot = await prisma.regulatorySnapshot.findFirst({
      where: {
        countryCode: source.countryCode,
        sourceUrl: source.url,
      },
      orderBy: { createdAt: 'desc' },
    });

    const hasChanged = previousSnapshot ? previousSnapshot.contentHash !== contentHash : false;

    let changeType: string | null = null;
    let materialChange = false;

    if (hasChanged && previousSnapshot) {
      const analysis = this.analyzeChange(
        previousSnapshot.contentText || '',
        contentText
      );
      changeType = analysis.changeType;
      materialChange = analysis.isMaterial;
    }

    const snapshot = await prisma.regulatorySnapshot.create({
      data: {
        countryCode: source.countryCode,
        sourceUrl: source.url,
        sourceName: source.name,
        contentHash,
        contentText,
        previousHash: previousSnapshot?.contentHash || null,
        hasChanged,
        changeType,
        materialChange,
        processedAt: new Date(),
      },
    });

    if (materialChange) {
      logger.info(`Material regulatory change detected for ${source.countryCode} from ${source.name}`);
    }

    return snapshot;
  }

  /**
   * Analyze the difference between two snapshots
   */
  private analyzeChange(previousText: string, currentText: string): {
    changeType: string;
    isMaterial: boolean;
    summary: string;
  } {
    const prevLen = previousText.length;
    const currLen = currentText.length;
    const lenDiff = Math.abs(currLen - prevLen);
    const changeRatio = prevLen > 0 ? lenDiff / prevLen : 1;

    let changeType = 'MODIFICATION';
    if (prevLen === 0) changeType = 'NEW_DOCUMENT';
    else if (currLen > prevLen * 1.2) changeType = 'ADDITION';
    else if (currLen < prevLen * 0.8) changeType = 'REMOVAL';

    const materialKeywords = [
      'license', 'licensing', 'regulation', 'framework', 'act', 'bill',
      'enforcement', 'penalty', 'fine', 'ban', 'restrict', 'approve',
      'tax', 'capital gains', 'aml', 'kyc', 'fatf', 'vasp', 'casp',
      'stablecoin', 'cbdc', 'digital asset', 'virtual asset',
      'crypto', 'blockchain', 'token', 'exchange',
    ];

    const newContent = currentText.toLowerCase();
    const prevContent = previousText.toLowerCase();

    const isMaterial = materialKeywords.some(kw =>
      newContent.includes(kw) && (
        !prevContent.includes(kw) ||
        changeRatio > 0.1
      )
    ) || changeRatio > 0.3;

    return {
      changeType,
      isMaterial,
      summary: `${changeType}: ${(changeRatio * 100).toFixed(1)}% content change detected`,
    };
  }

  /**
   * Run change detection scan across all sources
   */
  async runFullScan() {
    const results = {
      scanned: 0,
      changed: 0,
      materialChanges: 0,
      errors: 0,
    };

    for (const source of REGULATORY_SOURCES) {
      try {
        results.scanned++;
      } catch (error) {
        results.errors++;
        logger.error(`Error scanning ${source.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Get pending material changes for review
   */
  async getPendingChanges() {
    return await prisma.regulatorySnapshot.findMany({
      where: {
        materialChange: true,
        alertSent: false,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Mark a change as reviewed and optionally trigger article generation
   */
  async reviewChange(snapshotId: string, options: {
    generateArticle?: boolean;
    sendAlert?: boolean;
    changeSummary?: string;
  }) {
    const update: any = {};

    if (options.sendAlert) update.alertSent = true;
    if (options.changeSummary) update.changeSummary = options.changeSummary;
    if (options.generateArticle) update.articleGenerated = true;

    return await prisma.regulatorySnapshot.update({
      where: { id: snapshotId },
      data: update,
    });
  }

  /**
   * Get change detection stats
   */
  async getStats() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalSnapshots, materialChanges, pendingAlerts, byCountry] = await Promise.all([
      prisma.regulatorySnapshot.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.regulatorySnapshot.count({
        where: { materialChange: true, createdAt: { gte: thirtyDaysAgo } },
      }),
      prisma.regulatorySnapshot.count({
        where: { materialChange: true, alertSent: false },
      }),
      prisma.regulatorySnapshot.groupBy({
        by: ['countryCode'],
        where: { hasChanged: true, createdAt: { gte: thirtyDaysAgo } },
        _count: true,
        orderBy: { _count: { countryCode: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalSources: REGULATORY_SOURCES.length,
      countriesCovered: new Set(REGULATORY_SOURCES.map(s => s.countryCode)).size,
      totalSnapshots,
      materialChanges,
      pendingAlerts,
      byCountry,
    };
  }

  /**
   * Get all monitored sources
   */
  getSources() {
    return REGULATORY_SOURCES;
  }
}

export default new RegulatoryChangeDetectionService();
