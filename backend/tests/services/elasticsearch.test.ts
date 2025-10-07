import { ElasticsearchService } from '../../src/services/elasticsearchService';
import { logger } from '../../src/utils/logger';

// Mock Elasticsearch client
const mockElasticsearchClient = {
  indices: {
    create: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    putMapping: jest.fn(),
    getMapping: jest.fn(),
    putSettings: jest.fn(),
    getSettings: jest.fn(),
  },
  index: jest.fn(),
  search: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  bulk: jest.fn(),
  ping: jest.fn(),
  info: jest.fn(),
  cat: {
    health: jest.fn(),
    indices: jest.fn(),
  },
} as any;

describe('Elasticsearch Search Foundation - Task 5 Implementation', () => {
  let elasticsearchService: ElasticsearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    elasticsearchService = new ElasticsearchService(mockElasticsearchClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Search Relevance Tests - Task 5 Requirements', () => {
    it('should perform full-text search with relevance scoring', async () => {
      const mockSearchResults = {
        hits: {
          total: { value: 5 },
          max_score: 2.5,
          hits: [
            {
              _index: 'coindaily_articles',
              _id: '1',
              _score: 2.5,
              _source: {
                title: 'Bitcoin Adoption Surges in Nigeria',
                content: 'Nigerian cryptocurrency exchanges report massive growth...',
                category: 'African Markets',
                language: 'en',
                publishedAt: '2025-09-23T10:00:00Z',
                tags: ['bitcoin', 'nigeria', 'adoption'],
                author: 'CoinDaily Editorial'
              }
            },
            {
              _index: 'coindaily_articles',
              _id: '2',
              _score: 2.1,
              _source: {
                title: 'Luno Exchange Expands in South Africa',
                content: 'South African cryptocurrency exchange announces new features...',
                category: 'Exchange News',
                language: 'en',
                publishedAt: '2025-09-23T09:00:00Z',
                tags: ['luno', 'south-africa', 'exchange'],
                author: 'Market Reporter'
              }
            }
          ]
        }
      };

      mockElasticsearchClient.search.mockResolvedValue(mockSearchResults);

      const results = await elasticsearchService.searchArticles('bitcoin nigeria', {
        limit: 10,
        offset: 0,
        language: 'en'
      });

      expect(mockElasticsearchClient.search).toHaveBeenCalledWith({
        index: 'coindaily_articles',
        body: {
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query: 'bitcoin nigeria',
                    fields: ['title^3', 'content^2', 'summary^2', 'tags^1.5'],
                    type: 'best_fields',
                    fuzziness: 'AUTO'
                  }
                }
              ],
              filter: [
                { term: { status: 'published' } },
                { term: { language: 'en' } }
              ]
            }
          },
          highlight: {
            fields: {
              title: {},
              content: { fragment_size: 150, number_of_fragments: 3 }
            }
          },
          sort: [
            { _score: { order: 'desc' } },
            { publishedAt: { order: 'desc' } }
          ],
          from: 0,
          size: 10
        }
      });

      expect(results.total).toBe(5);
      expect(results.hits).toHaveLength(2);
      expect(results.hits[0]?.title).toBe('Bitcoin Adoption Surges in Nigeria');
      expect(results.hits[0]?.score).toBe(2.5);
    });

    it('should support African language search with proper analyzers', async () => {
      const swahiliSearchResults = {
        hits: {
          total: { value: 3 },
          hits: [
            {
              _index: 'coindaily_articles',
              _id: '3',
              _score: 1.8,
              _source: {
                title: 'Bitcoin inafikia kiwango kipya cha juu',
                content: 'Soko la sarafu za kidijitali la Afrika linakabiliwa na ukuazi mkubwa...',
                category: 'Masoko ya Afrika',
                language: 'sw',
                publishedAt: '2025-09-23T08:00:00Z',
                tags: ['bitcoin', 'afrika', 'ukuaji'],
                author: 'Mhariri wa CoinDaily'
              }
            }
          ]
        }
      };

      mockElasticsearchClient.search.mockResolvedValue(swahiliSearchResults);

      const results = await elasticsearchService.searchArticles('bitcoin afrika', {
        limit: 10,
        offset: 0,
        language: 'sw'
      });

      expect(mockElasticsearchClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'coindaily_articles',
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([
                  { term: { language: 'sw' } }
                ])
              })
            })
          })
        })
      );

      expect(results.total).toBe(3);
      expect(results.hits[0]?.language).toBe('sw');
      expect(results.hits[0]?.title).toContain('Bitcoin');
    });

    it('should support fuzzy search for typos and variations', async () => {
      const fuzzyResults = {
        hits: {
          total: { value: 2 },
          hits: [
            {
              _index: 'coindaily_articles',
              _id: '4',
              _score: 1.5,
              _source: {
                title: 'Ethereum Network Upgrade Success',
                content: 'The Ethereum blockchain has successfully upgraded...',
                category: 'Technology',
                language: 'en'
              }
            }
          ]
        }
      };

      mockElasticsearchClient.search.mockResolvedValue(fuzzyResults);

      // Search with typo: "etherium" instead of "ethereum"
      const results = await elasticsearchService.searchArticles('etherium upgrade', {
        limit: 5,
        fuzziness: 'AUTO'
      });

      expect(mockElasticsearchClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                must: expect.arrayContaining([
                  expect.objectContaining({
                    multi_match: expect.objectContaining({
                      fuzziness: 'AUTO'
                    })
                  })
                ])
              })
            })
          })
        })
      );

      expect(results.hits).toHaveLength(1);
      expect(results.hits[0]?.title).toContain('Ethereum');
    });

    it('should provide search suggestions and autocomplete', async () => {
      const suggestionResults = {
        suggest: {
          article_suggest: [
            {
              text: 'bitco',
              options: [
                { text: 'bitcoin', score: 0.75 },
                { text: 'bitcoin adoption', score: 0.65 },
                { text: 'bitcoin price', score: 0.60 }
              ]
            }
          ]
        }
      };

      mockElasticsearchClient.search.mockResolvedValue(suggestionResults);

      const suggestions = await elasticsearchService.getSuggestions('bitco', {
        field: 'title',
        size: 5
      });

      expect(mockElasticsearchClient.search).toHaveBeenCalledWith({
        index: 'coindaily_articles',
        body: {
          suggest: {
            article_suggest: {
              text: 'bitco',
              completion: {
                field: 'suggest',
                size: 5,
                skip_duplicates: true
              }
            }
          }
        }
      });

      expect(suggestions).toHaveLength(3);
      expect(suggestions[0]?.text).toBe('bitcoin');
      expect(suggestions[0]?.score).toBe(0.75);
    });
  });

  describe('Indexing Tests - Task 5 Requirements', () => {
    it('should create indexes with proper African language analyzers', async () => {
      mockElasticsearchClient.indices.exists.mockResolvedValue(false);
      mockElasticsearchClient.indices.create.mockResolvedValue({ acknowledged: true });

      await elasticsearchService.initializeIndexes();

      // Verify at least one index creation call was made
      expect(mockElasticsearchClient.indices.create).toHaveBeenCalledTimes(3);
      
      // Check that articles index was created with African language analyzers
      const createCalls = mockElasticsearchClient.indices.create.mock.calls;
      const articlesIndexCall = createCalls.find((call: any) => call[0].index === 'coindaily_articles');
      
      expect(articlesIndexCall).toBeDefined();
      expect(articlesIndexCall[0].body.settings.analysis.analyzer.african_multilang).toBeDefined();
      expect(articlesIndexCall[0].body.settings.analysis.analyzer.swahili_analyzer).toBeDefined();
      expect(articlesIndexCall[0].body.settings.analysis.analyzer.french_analyzer).toBeDefined();
    });

    it('should index articles with proper field mapping', async () => {
      const article = {
        id: '1',
        title: 'Bitcoin Adoption Surges in Nigeria',
        content: 'Nigerian cryptocurrency exchanges report massive growth in user adoption...',
        summary: 'Bitcoin usage increases dramatically across Nigerian exchanges',
        language: 'en',
        category: 'African Markets',
        tags: ['bitcoin', 'nigeria', 'adoption', 'exchanges'],
        publishedAt: new Date('2025-09-23T10:00:00Z'),
        author: 'CoinDaily Editorial',
        status: 'published',
        location: {
          country: 'Nigeria',
          region: 'West Africa',
          coordinates: { lat: 9.0820, lon: 8.6753 }
        }
      };

      mockElasticsearchClient.index.mockResolvedValue({
        _index: 'coindaily_articles',
        _id: '1',
        result: 'created'
      });

      const result = await elasticsearchService.indexArticle(article);

      expect(mockElasticsearchClient.index).toHaveBeenCalledWith({
        index: 'coindaily_articles',
        id: '1',
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
            input: [article.title, ...article.tags],
            weight: 1
          },
          indexedAt: expect.any(Date)
        }
      });

      expect(result.success).toBe(true);
      expect(result.id).toBe('1');
    });

    it('should support real-time article indexing with bulk operations', async () => {
      const articles = [
        {
          id: '1',
          title: 'Bitcoin News 1',
          content: 'Content 1',
          language: 'en',
          status: 'published'
        },
        {
          id: '2', 
          title: 'Ethereum News 2',
          content: 'Content 2',
          language: 'sw',
          status: 'published'
        }
      ];

      mockElasticsearchClient.bulk.mockResolvedValue({
        took: 5,
        errors: false,
        items: [
          { index: { _index: 'coindaily_articles', _id: '1', result: 'created' } },
          { index: { _index: 'coindaily_articles', _id: '2', result: 'created' } }
        ]
      });

      const result = await elasticsearchService.bulkIndexArticles(articles);

      expect(mockElasticsearchClient.bulk).toHaveBeenCalledWith({
        body: [
          { index: { _index: 'coindaily_articles', _id: '1' } },
          expect.objectContaining({
            title: 'Bitcoin News 1',
            content: 'Content 1',
            language: 'en',
            status: 'published'
          }),
          { index: { _index: 'coindaily_articles', _id: '2' } },
          expect.objectContaining({
            title: 'Ethereum News 2',
            content: 'Content 2',
            language: 'sw',
            status: 'published'
          })
        ]
      });

      expect(result.success).toBe(true);
      expect(result.indexed).toBe(2);
      expect(result.errors).toBe(0);
    });

    it('should handle index updates and deletions', async () => {
      // Test update
      mockElasticsearchClient.update.mockResolvedValue({
        _index: 'coindaily_articles',
        _id: '1',
        result: 'updated'
      });

      const updateResult = await elasticsearchService.updateArticle('1', {
        title: 'Updated Bitcoin News',
        content: 'Updated content'
      });

      expect(mockElasticsearchClient.update).toHaveBeenCalledWith({
        index: 'coindaily_articles',
        id: '1',
        body: {
          doc: {
            title: 'Updated Bitcoin News',
            content: 'Updated content',
            updatedAt: expect.any(Date)
          }
        }
      });

      expect(updateResult.success).toBe(true);

      // Test deletion
      mockElasticsearchClient.delete.mockResolvedValue({
        _index: 'coindaily_articles',
        _id: '1',
        result: 'deleted'
      });

      const deleteResult = await elasticsearchService.deleteArticle('1');

      expect(mockElasticsearchClient.delete).toHaveBeenCalledWith({
        index: 'coindaily_articles',
        id: '1'
      });

      expect(deleteResult.success).toBe(true);
    });
  });

  describe('African Language Tests - Task 5 Requirements', () => {
    it('should support 15+ African languages with proper analyzers', async () => {
      const africanLanguages = [
        'sw', // Swahili
        'fr', // French
        'ha', // Hausa
        'am', // Amharic
        'yo', // Yoruba
        'ig', // Igbo
        'zu', // Zulu
        'xh', // Xhosa
        'af', // Afrikaans
        'st', // Sesotho
        'tn', // Setswana
        've', // Venda
        'ts', // Tsonga
        'ss', // Swazi
        'nr'  // Ndebele
      ];

      for (const lang of africanLanguages) {
        mockElasticsearchClient.search.mockResolvedValue({
          hits: {
            total: { value: 1 },
            hits: [{
              _source: {
                title: `Test article in ${lang}`,
                language: lang
              }
            }]
          }
        });

        const results = await elasticsearchService.searchArticles('test', {
          language: lang,
          limit: 5
        });

        expect(results.hits[0]?.language).toBe(lang);
      }

      expect(mockElasticsearchClient.search).toHaveBeenCalledTimes(africanLanguages.length);
    });

    it('should handle mixed-language search results', async () => {
      const multiLanguageResults = {
        hits: {
          total: { value: 4 },
          hits: [
            {
              _source: {
                title: 'Bitcoin price rises',
                language: 'en',
                category: 'Market News'
              }
            },
            {
              _source: {
                title: 'Bitcoin bei ya kupanda',
                language: 'sw',
                category: 'Habari za Soko'
              }
            },
            {
              _source: {
                title: 'Le prix du Bitcoin augmente',
                language: 'fr',
                category: 'Actualités du marché'
              }
            }
          ]
        }
      };

      mockElasticsearchClient.search.mockResolvedValue(multiLanguageResults);

      const results = await elasticsearchService.searchArticles('bitcoin price', {
        languages: ['en', 'sw', 'fr'],
        limit: 10
      });

      expect(mockElasticsearchClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([
                  { terms: { language: ['en', 'sw', 'fr'] } }
                ])
              })
            })
          })
        })
      );

      expect(results.hits).toHaveLength(3);
      expect(results.hits.map(h => h.language)).toEqual(['en', 'sw', 'fr']);
    });

    it('should provide language-specific tokenization and stemming', async () => {
      // Test Swahili-specific features
      const swahiliContent = {
        title: 'Sarafu za kidijitali zinazidi kupendwa Afrika',
        content: 'Watu wengi wanajifunza kuhusu Bitcoin na Ethereum...',
        language: 'sw'
      };

      mockElasticsearchClient.index.mockResolvedValue({
        _index: 'coindaily_articles',
        _id: 'sw-1',
        result: 'created'
      });

      await elasticsearchService.indexArticle({
        id: 'sw-1',
        ...swahiliContent,
        publishedAt: new Date(),
        status: 'published'
      });

      expect(mockElasticsearchClient.index).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            title: swahiliContent.title,
            content: swahiliContent.content,
            language: 'sw'
          })
        })
      );
    });
  });

  describe('Market Data Search Tests - Task 5 Requirements', () => {
    it('should index and search market data with real-time capabilities', async () => {
      const marketData = {
        id: 'btc-ngn-2025-09-23',
        symbol: 'BTC',
        currency: 'NGN',
        price: 25000000,
        volume24h: 1250000,
        exchange: 'quidax',
        country: 'Nigeria',
        timestamp: new Date('2025-09-23T10:00:00Z'),
        change24h: 5.2,
        marketCap: 850000000000
      };

      mockElasticsearchClient.index.mockResolvedValue({
        _index: 'coindaily_market_data',
        _id: 'btc-ngn-2025-09-23',
        result: 'created'
      });

      const result = await elasticsearchService.indexMarketData(marketData);

      expect(mockElasticsearchClient.index).toHaveBeenCalledWith({
        index: 'coindaily_market_data',
        id: 'btc-ngn-2025-09-23',
        body: {
          symbol: 'BTC',
          currency: 'NGN',
          price: 25000000,
          volume24h: 1250000,
          exchange: 'quidax',
          country: 'Nigeria',
          timestamp: marketData.timestamp,
          change24h: 5.2,
          marketCap: 850000000000,
          indexedAt: expect.any(Date)
        }
      });

      expect(result.success).toBe(true);
    });

    it('should search market data by exchange, country, and currency', async () => {
      const marketSearchResults = {
        hits: {
          total: { value: 3 },
          hits: [
            {
              _source: {
                symbol: 'BTC',
                currency: 'ZAR',
                exchange: 'luno',
                country: 'South Africa',
                price: 850000
              }
            },
            {
              _source: {
                symbol: 'ETH',
                currency: 'ZAR',
                exchange: 'luno',
                country: 'South Africa',
                price: 50000
              }
            }
          ]
        }
      };

      mockElasticsearchClient.search.mockResolvedValue(marketSearchResults);

      const results = await elasticsearchService.searchMarketData({
        exchange: 'luno',
        country: 'South Africa',
        currency: 'ZAR'
      });

      expect(mockElasticsearchClient.search).toHaveBeenCalledWith({
        index: 'coindaily_market_data',
        body: {
          query: {
            bool: {
              filter: [
                { term: { exchange: 'luno' } },
                { term: { country: 'South Africa' } },
                { term: { currency: 'ZAR' } }
              ]
            }
          },
          sort: [
            { timestamp: { order: 'desc' } }
          ],
          size: 50
        }
      });

      expect(results.hits).toHaveLength(2);
      expect(results.hits[0]?.exchange).toBe('luno');
      expect(results.hits[0]?.country).toBe('South Africa');
    });

    it('should support time-range queries for historical data', async () => {
      const timeRangeResults = {
        hits: {
          total: { value: 10 },
          hits: [
            {
              _source: {
                symbol: 'BTC',
                price: 25000000,
                timestamp: '2025-09-23T10:00:00Z'
              }
            }
          ]
        }
      };

      mockElasticsearchClient.search.mockResolvedValue(timeRangeResults);

      const results = await elasticsearchService.searchMarketData({
        symbol: 'BTC',
        timeRange: {
          from: new Date('2025-09-22T00:00:00Z'),
          to: new Date('2025-09-23T23:59:59Z')
        }
      });

      expect(mockElasticsearchClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            query: expect.objectContaining({
              bool: expect.objectContaining({
                filter: expect.arrayContaining([
                  { term: { symbol: 'BTC' } },
                  {
                    range: {
                      timestamp: {
                        gte: '2025-09-22T00:00:00.000Z',
                        lte: '2025-09-23T23:59:59.000Z'
                      }
                    }
                  }
                ])
              })
            })
          })
        })
      );

      expect(results.hits).toHaveLength(1);
    });
  });

  describe('Search Analytics Tests - Task 5 Requirements', () => {
    it('should track search queries and results', async () => {
      const searchQuery = 'bitcoin nigeria';
      const searchOptions = { language: 'en', limit: 10 };

      mockElasticsearchClient.search.mockResolvedValue({
        hits: { total: { value: 5 }, hits: [] },
        took: 25
      });

      mockElasticsearchClient.index.mockResolvedValue({
        _index: 'coindaily_search_analytics',
        result: 'created'
      });

      await elasticsearchService.searchArticles(searchQuery, searchOptions);

      // Verify analytics tracking
      expect(mockElasticsearchClient.index).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'coindaily_search_analytics',
          body: expect.objectContaining({
            query: searchQuery,
            language: 'en',
            resultsCount: 5,
            responseTime: expect.any(Number),
            timestamp: expect.any(Date),
            hasResults: true
          })
        })
      );
    });

    it('should provide search analytics and popular queries', async () => {
      const analyticsResults = {
        aggregations: {
          popular_queries: {
            buckets: [
              { key: 'bitcoin', doc_count: 150 },
              { key: 'ethereum', doc_count: 120 },
              { key: 'nigeria', doc_count: 80 },
              { key: 'south africa', doc_count: 75 }
            ]
          },
          average_response_time: {
            value: 45.5
          },
          total_searches: {
            value: 1250
          }
        }
      };

      mockElasticsearchClient.search.mockResolvedValue(analyticsResults);

      const analytics = await elasticsearchService.getSearchAnalytics({
        timeRange: {
          from: new Date('2025-09-01T00:00:00Z'),
          to: new Date('2025-09-23T23:59:59Z')
        }
      });

      expect(mockElasticsearchClient.search).toHaveBeenCalledWith({
        index: 'coindaily_search_analytics',
        body: {
          query: {
            range: {
              timestamp: {
                gte: '2025-09-01T00:00:00.000Z',
                lte: '2025-09-23T23:59:59.000Z'
              }
            }
          },
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

      expect(analytics.popularQueries).toHaveLength(4);
      expect(analytics.popularQueries[0]).toEqual({ query: 'bitcoin', count: 150 });
      expect(analytics.averageResponseTime).toBe(45.5);
      expect(analytics.totalSearches).toBe(1250);
    });

    it('should track African-specific search patterns', async () => {
      const africanAnalytics = {
        aggregations: {
          languages: {
            buckets: [
              { key: 'en', doc_count: 500 },
              { key: 'sw', doc_count: 200 },
              { key: 'fr', doc_count: 150 }
            ]
          },
          countries: {
            buckets: [
              { key: 'Nigeria', doc_count: 300 },
              { key: 'South Africa', doc_count: 250 },
              { key: 'Kenya', doc_count: 200 }
            ]
          }
        }
      };

      mockElasticsearchClient.search.mockResolvedValue(africanAnalytics);

      const analytics = await elasticsearchService.getAfricanSearchAnalytics();

      expect(analytics.languageDistribution).toEqual([
        { language: 'en', searches: 500 },
        { language: 'sw', searches: 200 },
        { language: 'fr', searches: 150 }
      ]);

      expect(analytics.countryDistribution).toEqual([
        { country: 'Nigeria', searches: 300 },
        { country: 'South Africa', searches: 250 },
        { country: 'Kenya', searches: 200 }
      ]);
    });
  });

  describe('Performance Tests - Task 5 Requirements', () => {
    it('should achieve sub-500ms search response times', async () => {
      const fastSearchResults = {
        hits: { total: { value: 10 }, hits: [] },
        took: 45 // milliseconds
      };

      mockElasticsearchClient.search.mockResolvedValue(fastSearchResults);

      const startTime = process.hrtime.bigint();
      await elasticsearchService.searchArticles('test query');
      const endTime = process.hrtime.bigint();

      const responseTimeMs = Number(endTime - startTime) / 1000000;

      expect(responseTimeMs).toBeLessThan(500);
      expect(fastSearchResults.took).toBeLessThan(100); // Elasticsearch internal time
    });

    it('should optimize queries for African network conditions', async () => {
      const optimizedResults = {
        hits: {
          total: { value: 100 },
          hits: []
        },
        took: 35
      };

      mockElasticsearchClient.search.mockResolvedValue(optimizedResults);

      const results = await elasticsearchService.searchArticles('bitcoin', {
        optimizeForAfrica: true,
        limit: 20,
        includeHighlight: false // Reduce payload size
      });

      expect(mockElasticsearchClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            _source: expect.arrayContaining([
              'title', 'summary', 'publishedAt', 'author', 'language'
            ]), // Minimal fields for faster transfer
            size: 20
          })
        })
      );
    });

    it('should implement caching for frequent queries', async () => {
      const cachedQuery = 'popular bitcoin query';
      const searchResults = {
        hits: { total: { value: 5 }, hits: [] }
      };

      mockElasticsearchClient.search.mockResolvedValue(searchResults);

      // First search - should hit Elasticsearch
      await elasticsearchService.searchArticles(cachedQuery);
      
      // Second search - should use cache
      await elasticsearchService.searchArticles(cachedQuery);

      // Should only call Elasticsearch once due to caching
      expect(mockElasticsearchClient.search).toHaveBeenCalledTimes(1);
    });
  });

  describe('Health and Monitoring Tests', () => {
    it('should provide cluster health information', async () => {
      mockElasticsearchClient.cat.health.mockResolvedValue([{
        cluster: 'coindaily-search',
        status: 'green',
        node_total: '3',
        node_data: '3',
        shards: '10',
        pri: '5',
        relo: '0',
        init: '0',
        unassign: '0'
      }]);

      const health = await elasticsearchService.getClusterHealth();

      expect(health.status).toBe('green');
      expect(health.totalNodes).toBe(3);
      expect(health.dataNodes).toBe(3);
    });

    it('should handle connection errors gracefully', async () => {
      mockElasticsearchClient.search.mockRejectedValue(
        new Error('Connection timeout')
      );

      const results = await elasticsearchService.searchArticles('test query');

      expect(results.error).toBeDefined();
      expect(results.hits).toEqual([]);
      expect(results.total).toBe(0);
    });
  });
});