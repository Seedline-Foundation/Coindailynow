import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { logger } from '../utils/logger';

export interface SearchResult {
  total: number;
  hits: Array<{
    id: string;
    title: string;
    content?: string;
    summary?: string;
    language: string;
    category?: string;
    tags?: string[];
    publishedAt?: Date | undefined;
    author?: string;
    score: number;
    highlight?: {
      title?: string[];
      content?: string[];
    };
  }>;
  took: number;
  error?: string;
}

export interface MarketDataResult {
  total: number;
  hits: Array<{
    symbol: string;
    currency: string;
    price: number;
    volume24h?: number;
    exchange: string;
    country: string;
    timestamp: Date;
    change24h?: number;
    marketCap?: number;
  }>;
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  language?: string;
  languages?: string[];
  category?: string;
  fuzziness?: string;
  includeHighlight?: boolean;
  optimizeForAfrica?: boolean;
}

export interface SearchAnalytics {
  popularQueries: Array<{ query: string; count: number }>;
  averageResponseTime: number;
  totalSearches: number;
  languageDistribution: Array<{ language: string; searches: number }>;
  countryDistribution: Array<{ country: string; searches: number }>;
}

export interface IndexResult {
  success: boolean;
  id?: string;
  error?: string;
}

export interface BulkIndexResult {
  success: boolean;
  indexed: number;
  errors: number;
  details?: any[];
}

export class ElasticsearchService {
  private client: ElasticsearchClient;
  private searchCache = new Map<string, { result: any; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(client?: ElasticsearchClient) {
    if (client) {
      this.client = client;
    } else {
      const clientOptions: any = {
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        requestTimeout: 30000,
        maxRetries: 3,
        resurrectStrategy: 'ping'
      };

      if (process.env.ELASTICSEARCH_AUTH) {
        clientOptions.auth = {
          username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
          password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
        };
      }

      this.client = new ElasticsearchClient(clientOptions);
    }
  }

  /**
   * Initialize all indexes with proper African language analyzers
   */
  async initializeIndexes(): Promise<void> {
    try {
      // Create articles index
      await this.createArticlesIndex();
      
      // Create market data index
      await this.createMarketDataIndex();
      
      // Create search analytics index
      await this.createSearchAnalyticsIndex();

      logger.info('Elasticsearch indexes initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Elasticsearch indexes:', error);
      throw error;
    }
  }

  /**
   * Create articles index with African language support
   */
  private async createArticlesIndex(): Promise<void> {
    const indexExists = await this.client.indices.exists({
      index: 'coindaily_articles'
    });

    if (!indexExists) {
      await this.client.indices.create({
        index: 'coindaily_articles',
        body: {
          settings: {
            number_of_shards: 2,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                african_multilang: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: [
                    'lowercase',
                    'asciifolding',
                    'stop',
                    'stemmer',
                    'african_synonyms'
                  ]
                },
                swahili_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: [
                    'lowercase',
                    'asciifolding',
                    'swahili_stop',
                    'swahili_stemmer'
                  ]
                },
                french_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: [
                    'lowercase',
                    'asciifolding',
                    'french_stop',
                    'french_stemmer'
                  ]
                }
              },
              filter: {
                african_synonyms: {
                  type: 'synonym',
                  synonyms: [
                    'crypto,cryptocurrency,sarafu ya kidijitali',
                    'bitcoin,BTC',
                    'ethereum,ETH',
                    'africa,afrika',
                    'exchange,kubadilishana,bourse'
                  ]
                },
                swahili_stop: {
                  type: 'stop',
                  stopwords: ['na', 'ya', 'wa', 'la', 'kwa', 'ni', 'au']
                },
                swahili_stemmer: {
                  type: 'stemmer',
                  language: 'light_english'
                },
                french_stop: {
                  type: 'stop',
                  stopwords: '_french_'
                },
                french_stemmer: {
                  type: 'stemmer',
                  language: 'light_french'
                }
              }
            }
          },
          mappings: {
            properties: {
              title: {
                type: 'text',
                analyzer: 'african_multilang',
                fields: {
                  keyword: { type: 'keyword' },
                  suggest: { type: 'completion' }
                }
              },
              content: {
                type: 'text',
                analyzer: 'african_multilang'
              },
              summary: {
                type: 'text',
                analyzer: 'african_multilang'
              },
              language: { type: 'keyword' },
              category: { type: 'keyword' },
              tags: { type: 'keyword' },
              publishedAt: { type: 'date' },
              author: { type: 'keyword' },
              status: { type: 'keyword' },
              location: {
                properties: {
                  country: { type: 'keyword' },
                  region: { type: 'keyword' },
                  coordinates: { type: 'geo_point' }
                }
              },
              suggest: { type: 'completion' },
              indexedAt: { type: 'date' },
              updatedAt: { type: 'date' }
            }
          }
        }
      });
    }
  }

  /**
   * Create market data index
   */
  private async createMarketDataIndex(): Promise<void> {
    const indexExists = await this.client.indices.exists({
      index: 'coindaily_market_data'
    });

    if (!indexExists) {
      await this.client.indices.create({
        index: 'coindaily_market_data',
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1
          },
          mappings: {
            properties: {
              symbol: { type: 'keyword' },
              currency: { type: 'keyword' },
              price: { type: 'double' },
              volume24h: { type: 'double' },
              exchange: { type: 'keyword' },
              country: { type: 'keyword' },
              timestamp: { type: 'date' },
              change24h: { type: 'double' },
              marketCap: { type: 'double' },
              indexedAt: { type: 'date' }
            }
          }
        }
      });
    }
  }

  /**
   * Create search analytics index
   */
  private async createSearchAnalyticsIndex(): Promise<void> {
    const indexExists = await this.client.indices.exists({
      index: 'coindaily_search_analytics'
    });

    if (!indexExists) {
      await this.client.indices.create({
        index: 'coindaily_search_analytics',
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0
          },
          mappings: {
            properties: {
              query: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              language: { type: 'keyword' },
              country: { type: 'keyword' },
              resultsCount: { type: 'integer' },
              responseTime: { type: 'integer' },
              timestamp: { type: 'date' },
              hasResults: { type: 'boolean' },
              userAgent: { type: 'keyword' },
              ipAddress: { type: 'ip' }
            }
          }
        }
      });
    }
  }

  /**
   * Search articles with full-text search and African language support
   */
  async searchArticles(query: string, options: SearchOptions = {}): Promise<SearchResult> {
    const cacheKey = `search:${query}:${JSON.stringify(options)}`;
    
    // Check cache first
    if (this.shouldUseCache(options)) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const startTime = process.hrtime.bigint();

      const searchBody: any = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query,
                  fields: ['title^3', 'content^2', 'summary^2', 'tags^1.5'],
                  type: 'best_fields',
                  fuzziness: options.fuzziness || 'AUTO'
                }
              }
            ],
            filter: [
              { term: { status: 'published' } }
            ]
          }
        },
        sort: [
          { _score: { order: 'desc' } },
          { publishedAt: { order: 'desc' } }
        ],
        from: options.offset || 0,
        size: options.limit || 10
      };

      // Add language filters
      if (options.language) {
        searchBody.query.bool.filter.push({ term: { language: options.language } });
      } else if (options.languages) {
        searchBody.query.bool.filter.push({ terms: { language: options.languages } });
      }

      // Add category filter
      if (options.category) {
        searchBody.query.bool.filter.push({ term: { category: options.category } });
      }

      // Add highlighting unless disabled
      if (options.includeHighlight !== false) {
        searchBody.highlight = {
          fields: {
            title: {},
            content: { fragment_size: 150, number_of_fragments: 3 }
          }
        };
      }

      // Optimize for African network conditions
      if (options.optimizeForAfrica) {
        searchBody._source = [
          'title', 'summary', 'publishedAt', 'author', 'language', 'category', 'tags'
        ];
      }

      const response = await this.client.search({
        index: 'coindaily_articles',
        body: searchBody
      });

      const endTime = process.hrtime.bigint();
      const responseTimeMs = Number(endTime - startTime) / 1000000;

      const total = typeof response.hits.total === 'number' 
        ? response.hits.total 
        : response.hits.total?.value || 0;

      const result: SearchResult = {
        total,
        hits: response.hits.hits.map((hit: any) => ({
          id: hit._id,
          title: hit._source.title,
          content: hit._source.content,
          summary: hit._source.summary,
          language: hit._source.language,
          category: hit._source.category,
          tags: hit._source.tags,
          publishedAt: hit._source.publishedAt ? new Date(hit._source.publishedAt) : undefined,
          author: hit._source.author,
          score: hit._score,
          highlight: hit.highlight
        })),
        took: response.took || 0
      };

      // Cache the result
      if (this.shouldUseCache(options)) {
        this.setCache(cacheKey, result);
      }

      // Track search analytics
      await this.trackSearchAnalytics(query, options, result, responseTimeMs);

      return result;
    } catch (error) {
      logger.error('Search failed:', error);
      return {
        total: 0,
        hits: [],
        took: 0,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * Get search suggestions and autocomplete
   */
  async getSuggestions(text: string, options: { field?: string; size?: number } = {}): Promise<Array<{ text: string; score: number }>> {
    try {
      const response = await this.client.search({
        index: 'coindaily_articles',
        body: {
          suggest: {
            article_suggest: {
              text,
              completion: {
                field: 'suggest',
                size: options.size || 5,
                skip_duplicates: true
              }
            }
          }
        }
      });

      const suggestResults = response.suggest?.article_suggest;
      if (!suggestResults || !Array.isArray(suggestResults)) {
        return [];
      }

      const suggestions = suggestResults[0]?.options || [];
      if (!Array.isArray(suggestions)) {
        return [];
      }

      return suggestions.map((suggestion: any) => ({
        text: suggestion.text,
        score: suggestion.score
      }));
    } catch (error) {
      logger.error('Suggestions failed:', error);
      return [];
    }
  }

  /**
   * Index a single article
   */
  async indexArticle(article: any): Promise<IndexResult> {
    try {
      const response = await this.client.index({
        index: 'coindaily_articles',
        id: article.id,
        body: {
          title: article.title,
          content: article.content,
          summary: article.summary,
          language: article.language,
          category: article.category,
          tags: article.tags,
          publishedAt: article.publishedAt,
          author: article.author,
          status: article.status,
          location: article.location,
          suggest: {
            input: [article.title, ...(article.tags || [])],
            weight: 1
          },
          indexedAt: new Date()
        }
      });

      return {
        success: true,
        id: response._id
      };
    } catch (error) {
      logger.error('Article indexing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Indexing failed'
      };
    }
  }

  /**
   * Bulk index multiple articles
   */
  async bulkIndexArticles(articles: any[]): Promise<BulkIndexResult> {
    try {
      const body = articles.flatMap(article => [
        { index: { _index: 'coindaily_articles', _id: article.id } },
        {
          title: article.title,
          content: article.content,
          summary: article.summary,
          language: article.language,
          category: article.category,
          tags: article.tags,
          publishedAt: article.publishedAt,
          author: article.author,
          status: article.status,
          location: article.location,
          suggest: {
            input: [article.title, ...(article.tags || [])],
            weight: 1
          },
          indexedAt: new Date()
        }
      ]);

      const response = await this.client.bulk({ body });

      const errors = response.items.filter((item: any) => 
        item.index && item.index.error
      );

      return {
        success: !response.errors,
        indexed: articles.length - errors.length,
        errors: errors.length,
        details: errors
      };
    } catch (error) {
      logger.error('Bulk indexing failed:', error);
      return {
        success: false,
        indexed: 0,
        errors: articles.length
      };
    }
  }

  /**
   * Update an article
   */
  async updateArticle(id: string, updates: any): Promise<IndexResult> {
    try {
      const response = await this.client.update({
        index: 'coindaily_articles',
        id,
        body: {
          doc: {
            ...updates,
            updatedAt: new Date()
          }
        }
      });

      return {
        success: true,
        id: response._id
      };
    } catch (error) {
      logger.error('Article update failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  /**
   * Delete an article
   */
  async deleteArticle(id: string): Promise<IndexResult> {
    try {
      await this.client.delete({
        index: 'coindaily_articles',
        id
      });

      return { success: true };
    } catch (error) {
      logger.error('Article deletion failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deletion failed'
      };
    }
  }

  /**
   * Index market data
   */
  async indexMarketData(data: any): Promise<IndexResult> {
    try {
      const response = await this.client.index({
        index: 'coindaily_market_data',
        id: data.id,
        body: {
          symbol: data.symbol,
          currency: data.currency,
          price: data.price,
          volume24h: data.volume24h,
          exchange: data.exchange,
          country: data.country,
          timestamp: data.timestamp,
          change24h: data.change24h,
          marketCap: data.marketCap,
          indexedAt: new Date()
        }
      });

      return {
        success: true,
        id: response._id
      };
    } catch (error) {
      logger.error('Market data indexing failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Market data indexing failed'
      };
    }
  }

  /**
   * Search market data
   */
  async searchMarketData(filters: {
    symbol?: string;
    exchange?: string;
    country?: string;
    currency?: string;
    timeRange?: { from: Date; to: Date };
  }): Promise<MarketDataResult> {
    try {
      const filterClauses: any[] = [];

      if (filters.symbol) {
        filterClauses.push({ term: { symbol: filters.symbol } });
      }
      if (filters.exchange) {
        filterClauses.push({ term: { exchange: filters.exchange } });
      }
      if (filters.country) {
        filterClauses.push({ term: { country: filters.country } });
      }
      if (filters.currency) {
        filterClauses.push({ term: { currency: filters.currency } });
      }
      if (filters.timeRange) {
        filterClauses.push({
          range: {
            timestamp: {
              gte: filters.timeRange.from.toISOString(),
              lte: filters.timeRange.to.toISOString()
            }
          }
        });
      }

      const response = await this.client.search({
        index: 'coindaily_market_data',
        body: {
          query: {
            bool: {
              filter: filterClauses
            }
          },
          sort: [
            { timestamp: { order: 'desc' } }
          ],
          size: 50
        }
      });

      const total = typeof response.hits.total === 'number' 
        ? response.hits.total 
        : response.hits.total?.value || 0;

      return {
        total,
        hits: response.hits.hits.map((hit: any) => ({
          symbol: hit._source.symbol,
          currency: hit._source.currency,
          price: hit._source.price,
          volume24h: hit._source.volume24h,
          exchange: hit._source.exchange,
          country: hit._source.country,
          timestamp: new Date(hit._source.timestamp),
          change24h: hit._source.change24h,
          marketCap: hit._source.marketCap
        }))
      };
    } catch (error) {
      logger.error('Market data search failed:', error);
      return { total: 0, hits: [] };
    }
  }

  /**
   * Track search analytics
   */
  private async trackSearchAnalytics(
    query: string,
    options: SearchOptions,
    result: SearchResult,
    responseTime: number
  ): Promise<void> {
    try {
      await this.client.index({
        index: 'coindaily_search_analytics',
        body: {
          query,
          language: options.language || 'unknown',
          resultsCount: result.total,
          responseTime: Math.round(responseTime),
          timestamp: new Date(),
          hasResults: result.total > 0
        }
      });
    } catch (error) {
      // Don't fail search if analytics tracking fails
      logger.warn('Search analytics tracking failed:', error);
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(options: {
    timeRange?: { from: Date; to: Date };
  } = {}): Promise<SearchAnalytics> {
    try {
      const query: any = {};
      
      if (options.timeRange) {
        query.range = {
          timestamp: {
            gte: options.timeRange.from.toISOString(),
            lte: options.timeRange.to.toISOString()
          }
        };
      }

      const response = await this.client.search({
        index: 'coindaily_search_analytics',
        body: {
          query: Object.keys(query).length > 0 ? query : { match_all: {} },
          aggs: {
            popular_queries: {
              terms: {
                field: 'query.keyword',
                size: 20
              }
            },
            average_response_time: {
              avg: {
                field: 'responseTime'
              }
            },
            total_searches: {
              value_count: {
                field: 'query'
              }
            }
          },
          size: 0
        }
      });

      const aggs = response.aggregations;

      const popularQueries = (aggs?.popular_queries as any)?.buckets?.map((bucket: any) => ({
        query: bucket.key,
        count: bucket.doc_count
      })) || [];

      const averageResponseTime = (aggs?.average_response_time as any)?.value || 0;
      const totalSearches = (aggs?.total_searches as any)?.value || 0;

      return {
        popularQueries,
        averageResponseTime,
        totalSearches,
        languageDistribution: [],
        countryDistribution: []
      };
    } catch (error) {
      logger.error('Search analytics failed:', error);
      return {
        popularQueries: [],
        averageResponseTime: 0,
        totalSearches: 0,
        languageDistribution: [],
        countryDistribution: []
      };
    }
  }

  /**
   * Get African-specific search analytics
   */
  async getAfricanSearchAnalytics(): Promise<{
    languageDistribution: Array<{ language: string; searches: number }>;
    countryDistribution: Array<{ country: string; searches: number }>;
  }> {
    try {
      const response = await this.client.search({
        index: 'coindaily_search_analytics',
        body: {
          aggs: {
            languages: {
              terms: {
                field: 'language',
                size: 20
              }
            },
            countries: {
              terms: {
                field: 'country',
                size: 20
              }
            }
          },
          size: 0
        }
      });

      const aggs = response.aggregations;

      const languageDistribution = (aggs?.languages as any)?.buckets?.map((bucket: any) => ({
        language: bucket.key,
        searches: bucket.doc_count
      })) || [];

      const countryDistribution = (aggs?.countries as any)?.buckets?.map((bucket: any) => ({
        country: bucket.key,
        searches: bucket.doc_count
      })) || [];

      return {
        languageDistribution,
        countryDistribution
      };
    } catch (error) {
      logger.error('African search analytics failed:', error);
      return {
        languageDistribution: [],
        countryDistribution: []
      };
    }
  }

  /**
   * Get cluster health
   */
  async getClusterHealth(): Promise<{
    status: string;
    totalNodes: number;
    dataNodes: number;
  }> {
    try {
      const health = await this.client.cat.health({ format: 'json' });
      const healthData: any = Array.isArray(health) ? health[0] : health;

      if (!healthData) {
        return {
          status: 'unknown',
          totalNodes: 0,
          dataNodes: 0
        };
      }

      return {
        status: healthData.status || 'unknown',
        totalNodes: parseInt(healthData.nodeTotal || healthData.node_total || '0'),
        dataNodes: parseInt(healthData.nodeData || healthData.node_data || '0')
      };
    } catch (error) {
      logger.error('Cluster health check failed:', error);
      return {
        status: 'unknown',
        totalNodes: 0,
        dataNodes: 0
      };
    }
  }

  /**
   * Cache management
   */
  private shouldUseCache(options: SearchOptions): boolean {
    return !options.optimizeForAfrica; // Disable cache for optimized queries
  }

  private getFromCache(key: string): any {
    const cached = this.searchCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }
    this.searchCache.delete(key);
    return null;
  }

  private setCache(key: string, result: any): void {
    // Limit cache size
    if (this.searchCache.size > 100) {
      const firstKey = this.searchCache.keys().next().value;
      if (firstKey) {
        this.searchCache.delete(firstKey);
      }
    }

    this.searchCache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
  }
}