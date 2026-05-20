import prisma from '../lib/prisma';
import { logger } from '../utils/logger';

interface EventSubmission {
  title: string;
  description?: string;
  eventType: string;
  format?: string;
  category: string;
  country?: string;
  city?: string;
  venue?: string;
  startDate: Date;
  endDate?: Date;
  isFree?: boolean;
  price?: number;
  currency?: string;
  ticketUrl?: string;
  websiteUrl?: string;
  registrationUrl?: string;
  imageUrl?: string;
  organizerName?: string;
  organizerEmail?: string;
  organizerUrl?: string;
  tags?: string[];
  speakers?: Array<{
    name: string;
    title?: string;
    organization?: string;
    bio?: string;
  }>;
}

export class EventsIntelligenceService {
  /**
   * Submit a new event (user or scraper)
   */
  async submitEvent(data: EventSubmission, source: string = 'USER', organizerId?: string) {
    try {
      const slug = this.generateSlug(data.title, data.startDate);

      const event = await prisma.cryptoEvent.create({
        data: {
          title: data.title,
          slug,
          description: data.description,
          shortDescription: data.description?.substring(0, 200),
          eventType: data.eventType,
          format: data.format || 'IN_PERSON',
          category: data.category,
          country: data.country,
          city: data.city,
          venue: data.venue,
          startDate: data.startDate,
          endDate: data.endDate,
          organizerId,
          organizerName: data.organizerName,
          organizerEmail: data.organizerEmail,
          organizerUrl: data.organizerUrl,
          isFree: data.isFree ?? true,
          price: data.price,
          currency: data.currency || 'USD',
          ticketUrl: data.ticketUrl,
          websiteUrl: data.websiteUrl,
          registrationUrl: data.registrationUrl,
          imageUrl: data.imageUrl,
          tags: data.tags ? JSON.stringify(data.tags) : null,
          submissionSource: source,
          status: source === 'ADMIN' ? 'APPROVED' : 'PENDING',
        },
      });

      if (data.speakers && data.speakers.length > 0) {
        await prisma.eventSpeaker.createMany({
          data: data.speakers.map(s => ({
            eventId: event.id,
            name: s.name,
            title: s.title,
            organization: s.organization,
            bio: s.bio,
          })),
        });
      }

      logger.info(`Event submitted: ${event.title} (${event.id})`);
      return event;
    } catch (error) {
      logger.error('Error submitting event:', error);
      throw error;
    }
  }

  /**
   * List events with filtering
   */
  async listEvents(options: {
    country?: string;
    category?: string;
    eventType?: string;
    format?: string;
    status?: string;
    startAfter?: Date;
    startBefore?: Date;
    isFeatured?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20, ...filters } = options;

    const where: any = {};
    if (filters.country) where.country = filters.country;
    if (filters.category) where.category = filters.category;
    if (filters.eventType) where.eventType = filters.eventType;
    if (filters.format) where.format = filters.format;
    if (filters.status) where.status = filters.status;
    if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;

    if (filters.startAfter || filters.startBefore) {
      where.startDate = {};
      if (filters.startAfter) where.startDate.gte = filters.startAfter;
      if (filters.startBefore) where.startDate.lte = filters.startBefore;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { organizerName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.cryptoEvent.findMany({
        where,
        include: {
          speakers_rel: true,
          promotions: true,
        },
        orderBy: { startDate: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.cryptoEvent.count({ where }),
    ]);

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get event by ID or slug
   */
  async getEvent(idOrSlug: string) {
    return await prisma.cryptoEvent.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        speakers_rel: true,
        promotions: true,
      },
    });
  }

  /**
   * Approve/reject event (admin)
   */
  async moderateEvent(eventId: string, decision: 'APPROVED' | 'REJECTED', moderatorId: string, relevanceScore?: number) {
    return await prisma.cryptoEvent.update({
      where: { id: eventId },
      data: {
        status: decision,
        moderatedBy: moderatorId,
        moderatedAt: new Date(),
        relevanceScore,
      },
    });
  }

  /**
   * Purchase event promotion
   */
  async purchasePromotion(eventId: string, promotionType: string, cpCost: number) {
    const event = await prisma.cryptoEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');

    const promotion = await prisma.eventPromotion.create({
      data: {
        eventId,
        promotionType,
        cpCost,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    if (promotionType === 'FEATURED_LISTING' || promotionType === 'FULL_BUNDLE') {
      await prisma.cryptoEvent.update({
        where: { id: eventId },
        data: {
          isFeatured: true,
          featuredUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          promotionTier: promotionType === 'FULL_BUNDLE' ? 'PREMIUM' : 'STANDARD',
          cpPaid: { increment: cpCost },
        },
      });
    }

    return promotion;
  }

  /**
   * Get events calendar grouped by month
   */
  async getEventsCalendar(year: number, month?: number) {
    const startDate = month
      ? new Date(year, month - 1, 1)
      : new Date(year, 0, 1);
    const endDate = month
      ? new Date(year, month, 0)
      : new Date(year, 11, 31);

    const events = await prisma.cryptoEvent.findMany({
      where: {
        status: 'APPROVED',
        startDate: { gte: startDate, lte: endDate },
      },
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        eventType: true,
        category: true,
        format: true,
        country: true,
        city: true,
        startDate: true,
        endDate: true,
        isFree: true,
        price: true,
        isFeatured: true,
        imageUrl: true,
      },
    });

    return events;
  }

  /**
   * Speaker bureau - list speakers
   */
  async listSpeakers(options: {
    country?: string;
    expertise?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { page = 1, limit = 20 } = options;

    const where: any = { isInBureau: true };
    if (options.country) where.country = options.country;
    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { organization: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [speakers, total] = await Promise.all([
      prisma.eventSpeaker.findMany({
        where,
        include: { event: { select: { title: true, startDate: true } } },
        orderBy: { rating: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.eventSpeaker.count({ where }),
    ]);

    return { speakers, total, page, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Get event stats for admin dashboard
   */
  async getEventStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalEvents, pendingEvents, upcomingEvents, featuredEvents, recentSubmissions] = await Promise.all([
      prisma.cryptoEvent.count(),
      prisma.cryptoEvent.count({ where: { status: 'PENDING' } }),
      prisma.cryptoEvent.count({ where: { status: 'APPROVED', startDate: { gte: now } } }),
      prisma.cryptoEvent.count({ where: { isFeatured: true } }),
      prisma.cryptoEvent.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    const byCountry = await prisma.cryptoEvent.groupBy({
      by: ['country'],
      _count: true,
      where: { status: 'APPROVED' },
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    });

    const byCategory = await prisma.cryptoEvent.groupBy({
      by: ['category'],
      _count: true,
      where: { status: 'APPROVED' },
    });

    return {
      totalEvents,
      pendingEvents,
      upcomingEvents,
      featuredEvents,
      recentSubmissions,
      byCountry,
      byCategory,
    };
  }

  private generateSlug(title: string, date: Date): string {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const dateStr = date.toISOString().slice(0, 7);
    return `${base}-${dateStr}`;
  }
}

export default new EventsIntelligenceService();
