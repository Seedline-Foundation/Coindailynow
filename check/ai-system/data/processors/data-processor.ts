// Data Processor - Processes and enriches collected data for AI analysis
// Optimized for single I/O operations with comprehensive validation

import { createAuditLog, AuditActions } from '../../../lib/audit';
import { DataCollectionResult } from '../../types/ai-types';

export interface ProcessingRequest {
  data: DataCollectionResult;
  processingType: 'news' | 'price' | 'social' | 'research';
  enrichments?: string[];
  filters?: Record<string, unknown>;
  outputFormat?: 'json' | 'csv' | 'xml';
  includeMetadata?: boolean;
}

interface ProcessedData {
  originalData: Record<string, unknown>[];
  enrichedData: Record<string, unknown>[];
  statistics: DataStatistics;
  metadata: ProcessingMetadata;
}

interface DataStatistics {
  recordCount: number;
  validRecords: number;
  duplicatesRemoved: number;
  enrichedFields: string[];
  qualityScore: number;
  processingTime: number;
}

interface ProcessingMetadata {
  processingId: string;
  timestamp: Date;
  processingType: string;
  enrichments: string[];
  version: string;
  validationErrors: ValidationError[];
}

interface ValidationError {
  field: string;
  recordIndex: number;
  error: string;
  severity: 'low' | 'medium' | 'high';
}

export class DataProcessor {
  private isInitialized: boolean = false;
  private processingCache: Map<string, ProcessedData> = new Map();
  private readonly cacheTimeout = 30 * 60 * 1000; // 30 minutes cache
  private readonly version = '1.0.0';

  // African market-specific data enrichments
  private readonly africanMarketEnrichments = {
    currencies: ['NGN', 'KES', 'ZAR', 'GHS', 'ETB', 'EGP'],
    countries: ['NG', 'KE', 'ZA', 'GH', 'ET', 'EG'],
    languages: ['en', 'sw', 'zu', 'af', 'am', 'ar'],
    exchanges: ['binance', 'luno', 'quidax', 'buycoins', 'valr', 'ice3x'],
    paymentSystems: ['m-pesa', 'ecocash', 'orange money', 'mtn mobile money']
  };

  // Data validation rules
  private readonly validationRules = {
    news: {
      required: ['title', 'url', 'publishedAt'],
      optional: ['description', 'content', 'author', 'source'],
      types: {
        title: 'string',
        url: 'string',
        publishedAt: 'string',
        description: 'string',
        content: 'string',
        author: 'string'
      }
    },
    price: {
      required: ['symbol', 'price', 'currency', 'timestamp'],
      optional: ['volume24h', 'marketCap', 'change24h'],
      types: {
        symbol: 'string',
        price: 'number',
        currency: 'string',
        timestamp: 'string',
        volume24h: 'number',
        marketCap: 'number',
        change24h: 'number'
      }
    },
    social: {
      required: ['content', 'platform', 'timestamp'],
      optional: ['author', 'engagement', 'reach'],
      types: {
        content: 'string',
        platform: 'string',
        timestamp: 'string',
        author: 'string',
        engagement: 'number',
        reach: 'number'
      }
    },
    research: {
      required: ['content', 'source', 'reliability'],
      optional: ['title', 'publishedAt', 'author'],
      types: {
        content: 'string',
        source: 'string',
        reliability: 'number',
        title: 'string',
        publishedAt: 'string',
        author: 'string'
      }
    }
  };

  constructor() {}

  async initialize(): Promise<void> {
    console.log('🔧 Initializing Data Processor...');

    try {
      this.isInitialized = true;
      
      await createAuditLog({
        action: AuditActions.SETTINGS_UPDATE,
        resource: 'data_processor',
        resourceId: 'processor',
        details: { 
          initialized: true, 
          version: this.version,
          supportedTypes: Object.keys(this.validationRules),
          africanMarketSupport: true,
          capabilities: ['validation', 'enrichment', 'deduplication', 'quality_scoring']
        }
      });

      console.log('✅ Data Processor initialized successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      
      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'data_processor',
        resourceId: 'processor',
        details: { error: errorMessage, initialized: false }
      });

      throw error;
    }
  }

  async processData(request: ProcessingRequest): Promise<ProcessedData> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const processingId = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const cacheKey = this.generateCacheKey(request);

    // Check cache first
    const cachedResult = this.processingCache.get(cacheKey);
    if (cachedResult) {
      console.log(`📋 Using cached processed data for ${request.processingType}`);
      return cachedResult;
    }

    console.log(`🔧 Processing ${request.data.data.length} records for ${request.processingType}...`);

    try {
      // Step 1: Validate data
      const validationResults = this.validateData(request.data.data, request.processingType);
      
      // Step 2: Remove duplicates
      const deduplicatedData = this.removeDuplicates(validationResults.validData);
      
      // Step 3: Enrich data with African market context
      const enrichedData = await this.enrichData(deduplicatedData, request);
      
      // Step 4: Apply filters if specified
      const filteredData = this.applyFilters(enrichedData, request.filters);
      
      // Step 5: Calculate statistics
      const statistics = this.calculateStatistics(
        request.data.data,
        filteredData,
        validationResults,
        Date.now() - startTime
      );

      const result: ProcessedData = {
        originalData: request.data.data,
        enrichedData: filteredData,
        statistics,
        metadata: {
          processingId,
          timestamp: new Date(),
          processingType: request.processingType,
          enrichments: request.enrichments || [],
          version: this.version,
          validationErrors: validationResults.errors
        }
      };

      // Cache result
      this.processingCache.set(cacheKey, result);
      setTimeout(() => this.processingCache.delete(cacheKey), this.cacheTimeout);

      // Log successful processing
      await createAuditLog({
        action: AuditActions.ARTICLE_CREATE,
        resource: 'data_processing',
        resourceId: processingId,
        details: {
          processingType: request.processingType,
          originalRecords: request.data.data.length,
          processedRecords: filteredData.length,
          qualityScore: statistics.qualityScore,
          processingTime: statistics.processingTime,
          enrichments: request.enrichments,
          validationErrors: validationResults.errors.length
        }
      });

      console.log(`✅ Data processing completed: ${filteredData.length} records processed`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Data processing failed';
      const processingTime = Date.now() - startTime;

      await createAuditLog({
        action: AuditActions.ARTICLE_DELETE,
        resource: 'data_processing',
        resourceId: processingId,
        details: { 
          error: errorMessage, 
          processingTime,
          processingType: request.processingType,
          originalRecords: request.data.data.length
        }
      });

      throw new Error(`Data processing failed: ${errorMessage}`);
    }
  }

  private validateData(
    data: Record<string, unknown>[], 
    type: string
  ): { validData: Record<string, unknown>[]; errors: ValidationError[] } {
    const rules = this.validationRules[type as keyof typeof this.validationRules];
    if (!rules) {
      throw new Error(`Unknown processing type: ${type}`);
    }

    const validData: Record<string, unknown>[] = [];
    const errors: ValidationError[] = [];

    data.forEach((record, index) => {
      const recordErrors: ValidationError[] = [];

      // Check required fields
      for (const field of rules.required) {
        if (!(field in record) || record[field] === null || record[field] === undefined) {
          recordErrors.push({
            field,
            recordIndex: index,
            error: `Missing required field: ${field}`,
            severity: 'high'
          });
        }
      }

      // Check field types
      for (const [field, expectedType] of Object.entries(rules.types)) {
        if (field in record && record[field] !== null) {
          const actualType = typeof record[field];
          if (actualType !== expectedType) {
            recordErrors.push({
              field,
              recordIndex: index,
              error: `Expected ${expectedType}, got ${actualType}`,
              severity: 'medium'
            });
          }
        }
      }

      // If no high-severity errors, include record
      const highSeverityErrors = recordErrors.filter(e => e.severity === 'high');
      if (highSeverityErrors.length === 0) {
        validData.push(record);
      }

      errors.push(...recordErrors);
    });

    return { validData, errors };
  }

  private removeDuplicates(data: Record<string, unknown>[]): Record<string, unknown>[] {
    const seen = new Set<string>();
    const unique: Record<string, unknown>[] = [];

    for (const record of data) {
      // Create a hash key based on significant fields
      const keyFields = this.getKeyFields(record);
      const key = this.createHashKey(keyFields);
      
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(record);
      }
    }

    return unique;
  }

  private getKeyFields(record: Record<string, unknown>): Record<string, unknown> {
    // Define key fields for different record types
    const keyFields: Record<string, unknown> = {};

    if ('title' in record && 'url' in record) {
      // News article
      keyFields.title = record.title;
      keyFields.url = record.url;
    } else if ('symbol' in record && 'timestamp' in record) {
      // Price data
      keyFields.symbol = record.symbol;
      keyFields.timestamp = record.timestamp;
    } else if ('content' in record && 'platform' in record) {
      // Social media post
      keyFields.content = record.content;
      keyFields.platform = record.platform;
    } else {
      // Generic case - use first few fields
      const entries = Object.entries(record);
      for (let i = 0; i < Math.min(3, entries.length); i++) {
        keyFields[entries[i][0]] = entries[i][1];
      }
    }

    return keyFields;
  }

  private createHashKey(data: Record<string, unknown>): string {
    const sortedEntries = Object.entries(data).sort(([a], [b]) => a.localeCompare(b));
    return sortedEntries.map(([key, value]) => `${key}:${JSON.stringify(value)}`).join('|');
  }

  private async enrichData(
    data: Record<string, unknown>[], 
    request: ProcessingRequest
  ): Promise<Record<string, unknown>[]> {
    const enrichments = request.enrichments || [];
    
    return data.map(record => {
      const enriched = { ...record };

      // Add African market context
      if (enrichments.includes('african_context') || enrichments.length === 0) {
        enriched.africanMarketContext = this.addAfricanMarketContext(record);
      }

      // Add geolocation data
      if (enrichments.includes('geolocation')) {
        enriched.geolocation = this.addGeolocationData(record);
      }

      // Add temporal analysis
      if (enrichments.includes('temporal')) {
        enriched.temporalAnalysis = this.addTemporalAnalysis(record);
      }

      // Add quality indicators
      if (enrichments.includes('quality') || enrichments.length === 0) {
        enriched.qualityIndicators = this.addQualityIndicators(record);
      }

      // Add processing metadata
      enriched._processing = {
        enrichedAt: new Date().toISOString(),
        enrichments: enrichments.length > 0 ? enrichments : ['african_context', 'quality'],
        processingVersion: this.version
      };

      return enriched;
    });
  }

  private addAfricanMarketContext(record: Record<string, unknown>): Record<string, unknown> {
    const context: Record<string, unknown> = {
      relevanceScore: 0,
      currencies: [],
      countries: [],
      exchanges: [],
      paymentSystems: []
    };

    // Convert record to text for analysis
    const text = this.recordToText(record).toLowerCase();

    // Check for African currencies
    for (const currency of this.africanMarketEnrichments.currencies) {
      if (text.includes(currency.toLowerCase())) {
        (context.currencies as string[]).push(currency);
        context.relevanceScore = (context.relevanceScore as number) + 0.1;
      }
    }

    // Check for African countries
    for (const country of this.africanMarketEnrichments.countries) {
      if (text.includes(country.toLowerCase())) {
        (context.countries as string[]).push(country);
        context.relevanceScore = (context.relevanceScore as number) + 0.15;
      }
    }

    // Check for African exchanges
    for (const exchange of this.africanMarketEnrichments.exchanges) {
      if (text.includes(exchange.toLowerCase())) {
        (context.exchanges as string[]).push(exchange);
        context.relevanceScore = (context.relevanceScore as number) + 0.1;
      }
    }

    // Check for payment systems
    for (const system of this.africanMarketEnrichments.paymentSystems) {
      if (text.includes(system.toLowerCase())) {
        (context.paymentSystems as string[]).push(system);
        context.relevanceScore = (context.relevanceScore as number) + 0.1;
      }
    }

    // Cap relevance score at 1.0
    context.relevanceScore = Math.min(context.relevanceScore as number, 1.0);

    return context;
  }

  private addGeolocationData(record: Record<string, unknown>): Record<string, unknown> {
    const geolocation: Record<string, unknown> = {
      continent: 'Africa',
      region: 'Unknown',
      timezone: 'UTC'
    };

    const text = this.recordToText(record).toLowerCase();

    // Simple geolocation mapping
    if (text.includes('nigeria') || text.includes('ngn') || text.includes('lagos')) {
      geolocation.country = 'Nigeria';
      geolocation.region = 'West Africa';
      geolocation.timezone = 'Africa/Lagos';
    } else if (text.includes('kenya') || text.includes('kes') || text.includes('nairobi')) {
      geolocation.country = 'Kenya';
      geolocation.region = 'East Africa';
      geolocation.timezone = 'Africa/Nairobi';
    } else if (text.includes('south africa') || text.includes('zar') || text.includes('johannesburg')) {
      geolocation.country = 'South Africa';
      geolocation.region = 'Southern Africa';
      geolocation.timezone = 'Africa/Johannesburg';
    }

    return geolocation;
  }

  private addTemporalAnalysis(record: Record<string, unknown>): Record<string, unknown> {
    const temporal: Record<string, unknown> = {
      isRecent: false,
      ageInHours: 0,
      marketSession: 'unknown'
    };

    // Look for timestamp fields
    const timestampFields = ['timestamp', 'publishedAt', 'createdAt', 'date'];
    let recordTime: Date | null = null;

    for (const field of timestampFields) {
      if (field in record && record[field]) {
        recordTime = new Date(record[field] as string);
        break;
      }
    }

    if (recordTime && !isNaN(recordTime.getTime())) {
      const now = new Date();
      const ageMs = now.getTime() - recordTime.getTime();
      const ageInHours = ageMs / (1000 * 60 * 60);
      temporal.ageInHours = ageInHours;
      temporal.isRecent = ageInHours < 24;

      // Determine market session (simplified)
      const hour = recordTime.getUTCHours();
      if (hour >= 6 && hour < 14) {
        temporal.marketSession = 'african_morning';
      } else if (hour >= 14 && hour < 22) {
        temporal.marketSession = 'african_afternoon';
      } else {
        temporal.marketSession = 'african_night';
      }
    }

    return temporal;
  }

  private addQualityIndicators(record: Record<string, unknown>): Record<string, unknown> {
    const quality: Record<string, unknown> = {
      completeness: 0,
      reliability: 0.5,
      freshness: 0.5
    };

    // Calculate completeness
    const totalFields = Object.keys(record).length;
    const nonEmptyFields = Object.values(record).filter(value => 
      value !== null && value !== undefined && value !== ''
    ).length;
    quality.completeness = totalFields > 0 ? nonEmptyFields / totalFields : 0;

    // Calculate reliability based on source
    if ('source' in record) {
      const source = record.source as Record<string, unknown>;
      if (typeof source === 'object' && source !== null) {
        if ('reliability' in source && typeof source.reliability === 'number') {
          quality.reliability = source.reliability;
        } else if ('name' in source) {
          // Known reliable sources get higher scores
          const sourceName = (source.name as string).toLowerCase();
          if (sourceName.includes('reuters') || sourceName.includes('bloomberg')) {
            quality.reliability = 0.9;
          } else if (sourceName.includes('techpoint') || sourceName.includes('nairametrics')) {
            quality.reliability = 0.8;
          }
        }
      }
    }

    // Calculate freshness
    const timestampFields = ['timestamp', 'publishedAt', 'createdAt'];
    for (const field of timestampFields) {
      if (field in record && record[field]) {
        const recordTime = new Date(record[field] as string);
        if (!isNaN(recordTime.getTime())) {
          const ageHours = (Date.now() - recordTime.getTime()) / (1000 * 60 * 60);
          quality.freshness = Math.max(0, 1 - (ageHours / 48)); // Decay over 48 hours
          break;
        }
      }
    }

    return quality;
  }

  private applyFilters(
    data: Record<string, unknown>[], 
    filters?: Record<string, unknown>
  ): Record<string, unknown>[] {
    if (!filters || Object.keys(filters).length === 0) {
      return data;
    }

    return data.filter(record => {
      for (const [filterKey, filterValue] of Object.entries(filters)) {
        if (filterKey in record) {
          if (record[filterKey] !== filterValue) {
            return false;
          }
        }
      }
      return true;
    });
  }

  private calculateStatistics(
    originalData: Record<string, unknown>[],
    processedData: Record<string, unknown>[],
    validationResults: { validData: Record<string, unknown>[]; errors: ValidationError[] },
    processingTime: number
  ): DataStatistics {
    const duplicatesRemoved = validationResults.validData.length - processedData.length;
    
    // Calculate quality score based on validation and processing success
    const validationScore = validationResults.validData.length / originalData.length;
    const errorScore = 1 - (validationResults.errors.filter(e => e.severity === 'high').length / originalData.length);
    const completenessScore = processedData.length / originalData.length;
    
    const qualityScore = (validationScore * 0.4 + errorScore * 0.3 + completenessScore * 0.3);

    return {
      recordCount: originalData.length,
      validRecords: processedData.length,
      duplicatesRemoved,
      enrichedFields: ['africanMarketContext', 'qualityIndicators', '_processing'],
      qualityScore,
      processingTime
    };
  }

  private recordToText(record: Record<string, unknown>): string {
    const textFields = ['title', 'description', 'content', 'text', 'name'];
    const texts: string[] = [];

    for (const field of textFields) {
      if (field in record && typeof record[field] === 'string') {
        texts.push(record[field] as string);
      }
    }

    return texts.join(' ');
  }

  private generateCacheKey(request: ProcessingRequest): string {
    const dataHash = this.createHashKey({
      dataLength: request.data.data.length,
      type: request.processingType,
      enrichments: request.enrichments?.sort().join(',') || '',
      filters: JSON.stringify(request.filters || {})
    });
    return `processing:${dataHash}`;
  }

  // Public method to get processing statistics
  getProcessingStats(): { cacheSize: number; cacheHitRate: number; supportedTypes: string[] } {
    return {
      cacheSize: this.processingCache.size,
      cacheHitRate: 0.65, // Mock hit rate for demo
      supportedTypes: Object.keys(this.validationRules)
    };
  }

  // Public method to validate data structure
  validateDataStructure(data: Record<string, unknown>[], type: string): ValidationError[] {
    const result = this.validateData(data, type);
    return result.errors;
  }

  // Public method to get supported enrichments
  getSupportedEnrichments(): string[] {
    return ['african_context', 'geolocation', 'temporal', 'quality'];
  }
}

// Create singleton instance
export const dataProcessor = new DataProcessor();
