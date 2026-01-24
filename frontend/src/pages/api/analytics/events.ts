import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

// Validation schema for general analytics events
const AnalyticsEventSchema = z.object({
  event: z.string(),
  properties: z.record(z.any()),
  timestamp: z.number(),
  page_url: z.string().optional(),
  user_id: z.string().optional(),
  session_id: z.string().optional(),
});

const AnalyticsRequestSchema = z.object({
  events: z.array(AnalyticsEventSchema),
});

interface AnalyticsEventData {
  id: string;
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  page_url?: string;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// In-memory storage for development
const analyticsEvents: AnalyticsEventData[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const validatedData = AnalyticsRequestSchema.parse(req.body);
    
    // Get client IP and user agent
    const ip_address = req.headers['x-forwarded-for'] as string || req.connection.remoteAddress;
    const user_agent = req.headers['user-agent'] as string;

    // Process each event
    const processedEvents = validatedData.events.map(event => ({
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      event: event.event,
      properties: event.properties,
      timestamp: event.timestamp,
      page_url: event.page_url,
      user_id: event.user_id,
      session_id: event.session_id,
      ip_address,
      user_agent,
      created_at: new Date(),
    }));

    // Store analytics data
    analyticsEvents.push(...processedEvents);

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Events Received:', {
        eventCount: processedEvents.length,
        events: processedEvents.map(e => ({
          event: e.event,
          properties: e.properties
        }))
      });
    }

    // In production, save to database and send to analytics services
    /*
    await prisma.analyticsEvent.createMany({
      data: processedEvents.map(event => ({
        event: event.event,
        properties: event.properties,
        timestamp: new Date(event.timestamp),
        pageUrl: event.page_url,
        userId: event.user_id,
        sessionId: event.session_id,
        ipAddress: event.ip_address,
        userAgent: event.user_agent,
      }))
    });
    */

    res.status(200).json({ 
      success: true, 
      processed: processedEvents.length,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Analytics error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid request data',
        details: error.errors 
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      timestamp: Date.now()
    });
  }
}

// Helper to get analytics summary
export async function getAnalyticsSummary(
  startDate: Date,
  endDate: Date
): Promise<{
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  topEvents: Array<{ event: string; count: number }>;
  topPages: Array<{ page: string; count: number }>;
}> {
  const filteredEvents = analyticsEvents.filter(
    event => event.created_at >= startDate && event.created_at <= endDate
  );

  const eventCounts: Record<string, number> = {};
  const pageCounts: Record<string, number> = {};
  const uniqueUsers = new Set<string>();
  const uniqueSessions = new Set<string>();

  filteredEvents.forEach(event => {
    // Count events
    eventCounts[event.event] = (eventCounts[event.event] || 0) + 1;
    
    // Count page views
    if (event.page_url) {
      pageCounts[event.page_url] = (pageCounts[event.page_url] || 0) + 1;
    }
    
    // Track unique users and sessions
    if (event.user_id) uniqueUsers.add(event.user_id);
    if (event.session_id) uniqueSessions.add(event.session_id);
  });

  const topEvents = Object.entries(eventCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([event, count]) => ({ event, count }));

  const topPages = Object.entries(pageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([page, count]) => ({ page, count }));

  return {
    totalEvents: filteredEvents.length,
    uniqueUsers: uniqueUsers.size,
    uniqueSessions: uniqueSessions.size,
    topEvents,
    topPages,
  };
}