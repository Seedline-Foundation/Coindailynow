// Enhanced Marquee System with Page-Specific Controls

export interface PageTargeting {
  includePages: string[];      // Specific pages to show on
  excludePages: string[];      // Pages to exclude from
  includeCategories: string[]; // Show on category pages
  showOnHomepage: boolean;     // Homepage visibility
  showOnArticles: boolean;     // Article page visibility  
  showOnTokenPages: boolean;   // Token detail pages
  pathPatterns: string[];      // URL pattern matching
}

export interface MarqueeSchedule {
  startDate?: Date;
  endDate?: Date;
  timezone: string;
  daysOfWeek: number[];        // 0-6 for Sunday-Saturday
  startTime?: string;          // HH:MM format
  endTime?: string;            // HH:MM format
}

export interface GeoTargeting {
  countries: string[];         // ISO country codes
  regions: string[];           // African regions
  cities: string[];            // Specific cities
}

export interface EnhancedMarqueeData {
  id: string;
  name: string;
  title?: string;
  type: 'token' | 'news' | 'custom';
  position: 'header' | 'footer' | 'content';
  isActive: boolean;
  isPublished: boolean;
  priority: number;
  pageTargeting: PageTargeting;
  schedule?: MarqueeSchedule;
  geoTargeting?: GeoTargeting;
  impressions: number;
  clicks: number;
}

// Example admin configuration
export const examplePageTargeting: PageTargeting = {
  includePages: [
    '/',                       // Homepage
    '/tokens/*',              // All token pages
    '/news/crypto/*',         // Crypto news section
    '/markets',               // Markets page
  ],
  excludePages: [
    '/admin/*',               // No admin pages
    '/login',                 // No auth pages
    '/privacy',               // No legal pages
  ],
  includeCategories: [
    'bitcoin',
    'defi', 
    'nft',
    'african-crypto'
  ],
  showOnHomepage: true,
  showOnArticles: true,
  showOnTokenPages: false,
  pathPatterns: [
    '/news/breaking/*',       // Breaking news articles
    '/analysis/*',            // Analysis sections
  ]
};

// Enhanced usage example (TypeScript interface only)
export interface EnhancedMarqueeWrapperProps {
  position: 'header' | 'footer' | 'content';
  currentPage: string;
  pageCategory?: string;
  useDynamic: boolean;
}