import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

// Validation schema for navigation analytics
const NavigationEventSchema = z.object({
  event_type: z.enum(['navigation_click', 'navigation_dropdown_open', 'navigation_search', 'breadcrumb_click']),
  timestamp: z.number(),
  user_agent: z.string(),
  page_url: z.string(),
  referrer: z.string(),
  session_id: z.string(),
  label: z.string().optional(),
  href: z.string().optional(),
  menu_id: z.string().optional(),
  menu_label: z.string().optional(),
  query: z.string().optional(),
  results_count: z.number().optional(),
  breadcrumb_level: z.number().optional(),
  category: z.string().optional(),
});

const AnalyticsRequestSchema = z.object({
  events: z.array(NavigationEventSchema),
  type: z.literal('navigation'),
});

interface NavigationAnalyticsData {
  id: string;
  event_type: string;
  timestamp: number;
  session_id: string;
  user_agent: string;
  page_url: string;
  referrer: string;
  metadata: Record<string, any>;
  created_at: Date;
}

// In-memory storage for development (replace with proper database in production)
const analyticsData: NavigationAnalyticsData[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate request body
    const validatedData = AnalyticsRequestSchema.parse(req.body);
    
    // Process each event
    const processedEvents = validatedData.events.map(event => {
      const { event_type, timestamp, session_id, user_agent, page_url, referrer, ...metadata } = event;
      
      return {
        id: `nav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        event_type,
        timestamp,
        session_id,
        user_agent,
        page_url,
        referrer,
        metadata,
        created_at: new Date(),
      };
    });

    // Store analytics data (in production, this would be saved to a database)
    analyticsData.push(...processedEvents);

    // Log analytics for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Navigation Analytics Received:', {
        eventCount: processedEvents.length,
        events: processedEvents.map(e => ({
          type: e.event_type,
          metadata: e.metadata
        }))
      });
    }

    // In production, you would:
    // 1. Save to database (PostgreSQL, MongoDB, etc.)
    // 2. Send to analytics service (Google Analytics, Mixpanel, etc.)
    // 3. Queue for batch processing
    // 4. Validate user permissions

    /*
    // Example database save:
    await prisma.navigationAnalytics.createMany({
      data: processedEvents.map(event => ({
        eventType: event.event_type,
        timestamp: new Date(event.timestamp),
        sessionId: event.session_id,
        userAgent: event.user_agent,
        pageUrl: event.page_url,
        referrer: event.referrer,
        metadata: event.metadata,
      }))
    });
    */

    // Return success response
    res.status(200).json({ 
      success: true, 
      processed: processedEvents.length,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Navigation analytics error:', error);
    
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

// Helper function to get analytics summary (for admin dashboard)
export async function getNavigationAnalyticsSummary(
  startDate: Date,
  endDate: Date
): Promise<{
  totalEvents: number;
  eventBreakdown: Record<string, number>;
  topPages: Array<{ page: string; count: number }>;
  topSearchQueries: Array<{ query: string; count: number }>;
  sessionCount: number;
}> {
  // Filter events by date range
  const filteredEvents = analyticsData.filter(
    event => event.created_at >= startDate && event.created_at <= endDate
  );

  // Calculate event breakdown
  const eventBreakdown: Record<string, number> = {};
  filteredEvents.forEach(event => {
    eventBreakdown[event.event_type] = (eventBreakdown[event.event_type] || 0) + 1;
  });

  // Get top pages
  const pageViews: Record<string, number> = {};
  filteredEvents.forEach(event => {
    const page = event.page_url;
    pageViews[page] = (pageViews[page] || 0) + 1;
  });
  
  const topPages = Object.entries(pageViews)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([page, count]) => ({ page, count }));

  // Get top search queries
  const searchQueries: Record<string, number> = {};
  filteredEvents
    .filter(event => event.event_type === 'navigation_search' && event.metadata.query)
    .forEach(event => {
      const query = event.metadata.query;
      searchQueries[query] = (searchQueries[query] || 0) + 1;
    });
  
  const topSearchQueries = Object.entries(searchQueries)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }));

  // Get unique session count
  const uniqueSessions = new Set(filteredEvents.map(event => event.session_id));

  return {
    totalEvents: filteredEvents.length,
    eventBreakdown,
    topPages,
    topSearchQueries,
    sessionCount: uniqueSessions.size,
  };
}