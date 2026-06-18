import prisma from '../lib/prisma';

type ContentQueryParams = {
  page: number;
  perPage: number;
  entity?: string;
  language?: string;
  territory?: string;
};

type TimelineQueryParams = {
  jurisdictions: string[];
  since?: Date;
  page: number;
  perPage: number;
};

const LICENSE = 'CC-BY-4.0';

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export class StructuredContentService {
  private readonly siteUrl = process.env.SITE_URL || 'https://sygn.live';

  async getStructuredContent(params: ContentQueryParams): Promise<any> {
    const page = clampNumber(params.page || 1, 1, 10000);
    const perPage = clampNumber(params.perPage || 50, 1, 100);
    const skip = (page - 1) * perPage;

    const where: any = {
      status: 'PUBLISHED',
    };

    if (params.language) {
      where.language = params.language;
    }

    if (params.territory) {
      where.territory = {
        has: params.territory,
      };
    }

    if (params.entity) {
      where.OR = [
        { title: { contains: params.entity, mode: 'insensitive' } },
        { excerpt: { contains: params.entity, mode: 'insensitive' } },
        { content: { contains: params.entity, mode: 'insensitive' } },
      ];
    }

    let totalItems = 0;
    let articles: any[] = [];

    try {
      [totalItems, articles] = await prisma.$transaction([
        prisma.article.count({ where }),
        prisma.article.findMany({
          where,
          orderBy: { publishedAt: 'desc' },
          skip,
          take: perPage,
          include: {
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                bio: true,
              },
            },
            Category: {
              select: {
                name: true,
                slug: true,
              },
            },
            KnowledgeBase: {
              select: {
                entities: true,
                facts: true,
                summary: true,
                citationCount: true,
              },
            },
          },
        }),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('Unknown arg `language`') && !message.includes('Unknown arg `territory`')) {
        throw error;
      }

      const fallbackWhere: any = {
        status: 'PUBLISHED',
      };

      if (params.entity) {
        fallbackWhere.OR = where.OR;
      }

      [totalItems, articles] = await prisma.$transaction([
        prisma.article.count({ where: fallbackWhere }),
        prisma.article.findMany({
          where: fallbackWhere,
          orderBy: { publishedAt: 'desc' },
          skip,
          take: perPage,
          include: {
            User: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                bio: true,
              },
            },
            Category: {
              select: {
                name: true,
                slug: true,
              },
            },
            KnowledgeBase: {
              select: {
                entities: true,
                facts: true,
                summary: true,
                citationCount: true,
              },
            },
          },
        }),
      ]);
    }

    const data = articles.map((article: any) => {
      const parsedEntities = safeJsonParse<any[]>(article.KnowledgeBase?.entities, []);
      const parsedFacts = safeJsonParse<any[]>(article.KnowledgeBase?.facts, []);
      const authorName = `${article.User?.firstName || ''} ${article.User?.lastName || ''}`.trim() || 'CoinDaily Staff';

      return {
        id: article.id,
        type: 'news',
        attributes: {
          headline: article.title,
          slug: article.slug,
          summary: article.KnowledgeBase?.summary || article.excerpt,
          content_text: article.content,
          content_html: article.content,
          published_at: (article.publishedAt || article.createdAt).toISOString(),
          modified_at: (article.updatedAt || article.createdAt).toISOString(),
          word_count: article.content ? article.content.split(/\s+/).filter(Boolean).length : 0,
          reading_time: article.readingTimeMinutes,
          language: article.language || 'en',
          territory: article.territory || [],
          sentiment: article.sentimentScore != null ? Number(article.sentimentScore) : null,
          urgency: article.urgencyLevel || null,
          key_facts: article.keyFacts || parsedFacts,
          speakable_content: article.speakableContent || null,
          fact_check_status: article.factCheckStatus || null,
        },
        relationships: {
          author: {
            id: article.User?.id || null,
            name: authorName,
            title: article.User?.role || 'Contributor',
            expertise: article.User?.bio ? [article.User.bio] : [],
            url: `${this.siteUrl}/authors/${slugify(authorName)}`,
          },
          entities: parsedEntities,
          regulatory_events: [],
        },
        links: {
          self: `${this.siteUrl}/api/v1/content/${article.id}`,
          canonical: `${this.siteUrl}/news/${article.slug}`,
          amp: `${this.siteUrl}/news/${article.slug}/amp`,
        },
      };
    });

    const articleIds = articles.map((article: any) => article.id);
    const territoryCodes = Array.from(
      new Set(
        articles.flatMap((article: any) => (Array.isArray(article.territory) ? article.territory : []))
      )
    );

    let regulatoryEvents: any[] = [];
    try {
      regulatoryEvents = await (prisma as any).regulatoryEvent.findMany({
        where: {
          OR: [
            { articleId: { in: articleIds } },
            { countryCode: { in: territoryCodes } },
          ],
        },
        orderBy: { eventDate: 'desc' },
        take: 500,
      });
    } catch {
      // Fallback for older Prisma clients without articleId in RegulatoryEvent
      if (territoryCodes.length > 0) {
        regulatoryEvents = await prisma.regulatoryEvent.findMany({
          where: {
            countryCode: { in: territoryCodes },
          },
          orderBy: { eventDate: 'desc' },
          take: 500,
        });
      }
    }

    const eventsByArticle = new Map<string, any[]>();
    for (const event of regulatoryEvents) {
      const articleId = (event as any).articleId;
      if (!articleId) continue;
      const existing = eventsByArticle.get(articleId) || [];
      existing.push(event);
      eventsByArticle.set(articleId, existing);
    }

    const eventsByCountry = new Map<string, any[]>();
    for (const event of regulatoryEvents) {
      const code = (event.countryCode || '').toUpperCase();
      if (!code) continue;
      const existing = eventsByCountry.get(code) || [];
      existing.push(event);
      eventsByCountry.set(code, existing);
    }

    const enrichedData = data.map((item: any, index: number) => {
      const article = articles[index];
      const articleTerritories: string[] = Array.isArray(article.territory) ? article.territory : [];

      const linkedByArticle = eventsByArticle.get(article.id) || [];
      const linkedByCountry = articleTerritories.flatMap((code) => eventsByCountry.get(String(code).toUpperCase()) || []);

      const merged = [...linkedByArticle, ...linkedByCountry]
        .filter((event, idx, arr) => arr.findIndex((e) => e.id === event.id) === idx)
        .slice(0, 5)
        .map((event) => ({
          id: event.id,
          jurisdiction: event.countryCode,
          action_type: event.eventType,
          title: event.title,
          effective_date: event.effectiveDate ? new Date(event.effectiveDate).toISOString().slice(0, 10) : null,
          document_url: event.documentUrl || null,
          citation: event.citationReference || null,
          impact_level: event.impactLevel || null,
        }));

      return {
        ...item,
        relationships: {
          ...item.relationships,
          regulatory_events: merged,
        },
      };
    });

    return {
      meta: {
        version: '1.0',
        total_items: totalItems,
        page,
        per_page: perPage,
        generated_at: new Date().toISOString(),
        license: LICENSE,
        attribution_required: true,
      },
      data: enrichedData,
    };
  }

  async getEntityBySlug(slug: string): Promise<any | null> {
    const normalizedSlug = slugify(slug);

    const entityClient = (prisma as any).entity;
    const explicitEntity = entityClient?.findFirst
      ? await entityClient.findFirst({
          where: {
            OR: [
              { slug: normalizedSlug },
              { name: { equals: slug, mode: 'insensitive' } },
            ],
          },
          include: {
            articleLinks: {
              select: { articleId: true },
            },
          },
        })
      : null;

    if (explicitEntity) {
      return {
        entity_type: explicitEntity.entityType,
        slug: explicitEntity.slug,
        names: {
          official: explicitEntity.name,
          short: explicitEntity.name,
          acronyms: safeJsonParse<string[]>(explicitEntity.aliases as any, []),
        },
        jurisdiction: {
          country: explicitEntity.jurisdiction,
          region: null,
          authority_type: explicitEntity.authorityType,
        },
        crypto_stance: {
          classification: explicitEntity.cryptoType,
          exchange_licensing: explicitEntity.regulatoryStance,
          last_updated: explicitEntity.updatedAt.toISOString().slice(0, 10),
        },
        key_documents: [],
        related_coverage: {
          count: explicitEntity.articleLinks.length,
          url: `${this.siteUrl}/api/v1/content?entity=${explicitEntity.slug}`,
        },
        data_sources: ['CoinDaily editorial content graph'],
      };
    }

    const fallbackEntity = await prisma.recognizedEntity.findFirst({
      where: {
        OR: [
          { normalizedName: normalizedSlug },
          { name: { equals: slug, mode: 'insensitive' } },
        ],
      },
      include: {
        EntityMention: {
          take: 1,
          select: { contentId: true },
        },
      },
    });

    if (!fallbackEntity) {
      return null;
    }

    return {
      entity_type: fallbackEntity.entityType,
      slug: normalizedSlug,
      names: {
        official: fallbackEntity.name,
        short: fallbackEntity.name,
        acronyms: safeJsonParse<string[]>(fallbackEntity.aliases, []),
      },
      jurisdiction: {
        country: null,
        region: null,
        authority_type: null,
      },
      current_leadership: null,
      crypto_stance: {
        classification: fallbackEntity.category,
        exchange_licensing: null,
        last_updated: fallbackEntity.updatedAt.toISOString().slice(0, 10),
      },
      key_documents: [],
      related_coverage: {
        count: fallbackEntity.mentionCount,
        url: `${this.siteUrl}/api/v1/content?entity=${normalizedSlug}`,
      },
      data_sources: ['CoinDaily entity recognition pipeline'],
    };
  }

  async getRegulatoryTimeline(params: TimelineQueryParams): Promise<any> {
    const page = clampNumber(params.page || 1, 1, 10000);
    const perPage = clampNumber(params.perPage || 50, 1, 100);
    const skip = (page - 1) * perPage;

    const where: any = {};
    if (params.since) {
      where.eventDate = { gte: params.since };
    }

    if (params.jurisdictions.length > 0) {
      const normalizedInputs = params.jurisdictions.map((item) => item.trim()).filter(Boolean);
      const maybeCodes = normalizedInputs.map((item) => item.toUpperCase());

      const countries = await prisma.regulatoryCountry.findMany({
        where: {
          OR: [
            { code: { in: maybeCodes as any } },
            ...normalizedInputs.map((item) => ({
              name: { contains: item, mode: 'insensitive' as const },
            })),
          ],
        },
        select: { code: true },
      });

      const matchedCodes = Array.from(new Set(countries.map((country) => country.code.toUpperCase())));
      where.countryCode = { in: matchedCodes.length > 0 ? matchedCodes : maybeCodes };
    }

    const events = await prisma.regulatoryEvent.findMany({
      where,
      include: {
        country: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        eventDate: 'desc',
      },
      skip,
      take: perPage,
    });

    return {
      timeline: events.map((event: any) => ({
        date: event.eventDate.toISOString().slice(0, 10),
        event_type: event.eventType,
        title: event.title,
        description: event.description,
        impact_level: event.impactLevel || null,
        affected_parties: [],
        jurisdiction: {
          code: event.country?.code || event.countryCode,
          name: event.country?.name || event.countryCode,
        },
        effective_date: event.effectiveDate ? event.effectiveDate.toISOString().slice(0, 10) : null,
        document_primary_source: event.documentUrl || null,
        citation_reference: event.citationReference || null,
        market_reaction: event.marketImpactData || null,
        our_coverage: event.articleId ? `${this.siteUrl}/api/v1/content/${event.articleId}` : null,
      })),
      meta: {
        page,
        per_page: perPage,
        generated_at: new Date().toISOString(),
      },
    };
  }
}

export const structuredContentService = new StructuredContentService();
