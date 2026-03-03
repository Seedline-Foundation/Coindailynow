/**
 * Local Expert Program Dashboard
 * Monitor accepted local experts: detailed KPIs, performance metrics, award benchmarks
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  Ban,
  Star,
  Award,
  Filter,
  ChevronDown,
  ChevronUp,
  BarChart3,
  DollarSign,
  FileText,
  Globe,
  BookOpen,
  Mic,
  GraduationCap,
  Trophy,
  Medal,
  Crown,
  Activity,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Share2,
  Zap,
  Target,
  Flame,
  Sparkles,
  UserCheck,
  UserX,
  Inbox,
  Mail,
  MapPin,
  Link2,
  ExternalLink,
} from 'lucide-react';

// ──────────── Types ────────────

interface ExpertStats {
  totalExperts: number;
  activeExperts: number;
  pendingApplications: number;
  suspendedExperts: number;
  totalArticlesPublished: number;
  totalCoursesCreated: number;
  totalPodcastEpisodes: number;
  totalRevenueGenerated: number;
  totalTokensPaid: number;
  avgArticlesPerExpert: number;
  avgRevenuePerExpert: number;
  avgQualityScore: number;
  rewardEligible: number;
  monthlyGrowthRate: number;
}

interface Expert {
  id: string;
  name: string;
  email: string;
  country: string;
  countryFlag: string;
  tier: 'Community Writer' | 'Regional Expert' | 'Senior Analyst' | 'Advisory Board';
  type: string;
  joinedAt: string;
  status: 'active' | 'probation' | 'suspended' | 'inactive';
  avatar: string;
  // Content metrics
  articlesPublished: number;
  articlesThisMonth: number;
  avgArticleViews: number;
  totalViews: number;
  coursesCreated: number;
  courseEnrollments: number;
  podcastEpisodes: number;
  podcastListens: number;
  // Quality metrics
  qualityScore: number; // 0-100
  editorRating: number; // 1-5
  seoScore: number; // 0-100
  factCheckPass: number; // percentage
  aiReviewScore: number; // 0-100
  plagiarismFree: number; // percentage
  // Engagement metrics
  avgReadTime: number; // minutes
  totalComments: number;
  totalShares: number;
  totalLikes: number;
  socialFollowers: number;
  communityScore: number; // 0-100
  // Revenue metrics
  adRevenueEarned: number;
  courseRevenueEarned: number;
  tipsReceived: number;
  podcastRevenueEarned: number;
  totalRevenueEarned: number;
  totalTokensPaid: number;
  pendingPayout: number;
  // Compliance & Awards
  missedDeadlines: number;
  warningsReceived: number;
  awardsWon: number;
  awardEligible: boolean;
  consecutiveMonthsActive: number;
  lastArticleDate: string;
  languages: string[];
  specialties: string[];
}

interface AwardBenchmark {
  name: string;
  icon: React.ReactNode;
  criteria: string;
  threshold: number;
  metric: keyof Expert;
  color: string;
  prize: string;
}

interface Application {
  id: string;
  name: string;
  email: string;
  country: string;
  countryFlag: string;
  appliedTier: 'Community Writer' | 'Regional Expert' | 'Senior Analyst' | 'Advisory Board';
  appliedDate: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  avatar: string;
  expertise: string;
  portfolio: string;
  why: string;
  topics: string[];
  languages: string[];
  socialLinks: { platform: string; url: string }[];
  writingSamples: number;
  experience: string;
  reviewerNotes: string;
  aiScore: number | null; // AI pre-screening score 0-100
}

// ──────────── Mock Data ────────────

const mockStats: ExpertStats = {
  totalExperts: 87,
  activeExperts: 71,
  pendingApplications: 23,
  suspendedExperts: 4,
  totalArticlesPublished: 2846,
  totalCoursesCreated: 34,
  totalPodcastEpisodes: 189,
  totalRevenueGenerated: 482500,
  totalTokensPaid: 318200,
  avgArticlesPerExpert: 32.7,
  avgRevenuePerExpert: 5546,
  avgQualityScore: 78.4,
  rewardEligible: 28,
  monthlyGrowthRate: 12.3,
};

const mockExperts: Expert[] = [
  {
    id: 'exp-001', name: 'Amara Okafor', email: 'amara@example.com', country: 'Nigeria', countryFlag: '🇳🇬',
    tier: 'Regional Expert', type: 'Content & Analysis', joinedAt: '2025-03-15', status: 'active', avatar: 'AO',
    articlesPublished: 67, articlesThisMonth: 8, avgArticleViews: 3420, totalViews: 229140,
    coursesCreated: 2, courseEnrollments: 456, podcastEpisodes: 12, podcastListens: 8900,
    qualityScore: 92, editorRating: 4.7, seoScore: 88, factCheckPass: 98, aiReviewScore: 91, plagiarismFree: 100,
    avgReadTime: 4.2, totalComments: 1840, totalShares: 3200, totalLikes: 12400, socialFollowers: 24500, communityScore: 94,
    adRevenueEarned: 8420, courseRevenueEarned: 3200, tipsReceived: 890, podcastRevenueEarned: 1200, totalRevenueEarned: 13710, totalTokensPaid: 11200, pendingPayout: 2510,
    missedDeadlines: 0, warningsReceived: 0, awardsWon: 4, awardEligible: true, consecutiveMonthsActive: 11,
    lastArticleDate: '2026-02-27', languages: ['English', 'Igbo', 'Pidgin'], specialties: ['DeFi', 'P2P Markets', 'CBN Policy'],
  },
  {
    id: 'exp-002', name: 'Wanjiku Kamau', email: 'wanjiku@example.com', country: 'Kenya', countryFlag: '🇰🇪',
    tier: 'Regional Expert', type: 'Content & Analysis', joinedAt: '2025-04-20', status: 'active', avatar: 'WK',
    articlesPublished: 52, articlesThisMonth: 6, avgArticleViews: 2890, totalViews: 150280,
    coursesCreated: 1, courseEnrollments: 234, podcastEpisodes: 8, podcastListens: 5600,
    qualityScore: 88, editorRating: 4.5, seoScore: 85, factCheckPass: 96, aiReviewScore: 87, plagiarismFree: 100,
    avgReadTime: 3.8, totalComments: 1240, totalShares: 2100, totalLikes: 8900, socialFollowers: 18200, communityScore: 87,
    adRevenueEarned: 6100, courseRevenueEarned: 1800, tipsReceived: 620, podcastRevenueEarned: 780, totalRevenueEarned: 9300, totalTokensPaid: 7800, pendingPayout: 1500,
    missedDeadlines: 1, warningsReceived: 0, awardsWon: 2, awardEligible: true, consecutiveMonthsActive: 10,
    lastArticleDate: '2026-02-26', languages: ['English', 'Swahili'], specialties: ['M-Pesa', 'Mobile Money', 'CMA Regulation'],
  },
  {
    id: 'exp-003', name: 'Thabo Ndlovu', email: 'thabo@example.com', country: 'South Africa', countryFlag: '🇿🇦',
    tier: 'Senior Analyst', type: 'Research & Data', joinedAt: '2025-02-10', status: 'active', avatar: 'TN',
    articlesPublished: 41, articlesThisMonth: 4, avgArticleViews: 5120, totalViews: 209920,
    coursesCreated: 3, courseEnrollments: 890, podcastEpisodes: 24, podcastListens: 18400,
    qualityScore: 96, editorRating: 4.9, seoScore: 92, factCheckPass: 100, aiReviewScore: 95, plagiarismFree: 100,
    avgReadTime: 6.1, totalComments: 2100, totalShares: 4800, totalLikes: 16200, socialFollowers: 31000, communityScore: 96,
    adRevenueEarned: 12800, courseRevenueEarned: 7200, tipsReceived: 1400, podcastRevenueEarned: 3200, totalRevenueEarned: 24600, totalTokensPaid: 20800, pendingPayout: 3800,
    missedDeadlines: 0, warningsReceived: 0, awardsWon: 6, awardEligible: true, consecutiveMonthsActive: 12,
    lastArticleDate: '2026-02-28', languages: ['English', 'Zulu', 'Afrikaans'], specialties: ['FSCA', 'Institutional Crypto', 'Mining'],
  },
  {
    id: 'exp-004', name: 'Kwame Asante', email: 'kwame@example.com', country: 'Ghana', countryFlag: '🇬🇭',
    tier: 'Community Writer', type: 'Content', joinedAt: '2025-08-05', status: 'active', avatar: 'KA',
    articlesPublished: 22, articlesThisMonth: 3, avgArticleViews: 1890, totalViews: 41580,
    coursesCreated: 1, courseEnrollments: 67, podcastEpisodes: 0, podcastListens: 0,
    qualityScore: 74, editorRating: 3.9, seoScore: 72, factCheckPass: 92, aiReviewScore: 76, plagiarismFree: 100,
    avgReadTime: 3.1, totalComments: 480, totalShares: 820, totalLikes: 3200, socialFollowers: 5400, communityScore: 68,
    adRevenueEarned: 2100, courseRevenueEarned: 480, tipsReceived: 180, podcastRevenueEarned: 0, totalRevenueEarned: 2760, totalTokensPaid: 2200, pendingPayout: 560,
    missedDeadlines: 2, warningsReceived: 1, awardsWon: 0, awardEligible: false, consecutiveMonthsActive: 6,
    lastArticleDate: '2026-02-22', languages: ['English', 'Twi'], specialties: ['BoG Policy', 'e-Cedi', 'Remittances'],
  },
  {
    id: 'exp-005', name: 'Fatima Hassan', email: 'fatima@example.com', country: 'Egypt', countryFlag: '🇪🇬',
    tier: 'Regional Expert', type: 'Content & Analysis', joinedAt: '2025-05-12', status: 'active', avatar: 'FH',
    articlesPublished: 38, articlesThisMonth: 5, avgArticleViews: 3100, totalViews: 117800,
    coursesCreated: 1, courseEnrollments: 178, podcastEpisodes: 6, podcastListens: 4200,
    qualityScore: 86, editorRating: 4.4, seoScore: 84, factCheckPass: 95, aiReviewScore: 85, plagiarismFree: 100,
    avgReadTime: 4.0, totalComments: 980, totalShares: 1800, totalLikes: 7200, socialFollowers: 15800, communityScore: 82,
    adRevenueEarned: 5400, courseRevenueEarned: 1200, tipsReceived: 420, podcastRevenueEarned: 560, totalRevenueEarned: 7580, totalTokensPaid: 6200, pendingPayout: 1380,
    missedDeadlines: 0, warningsReceived: 0, awardsWon: 1, awardEligible: true, consecutiveMonthsActive: 9,
    lastArticleDate: '2026-02-25', languages: ['English', 'Arabic', 'French'], specialties: ['Islamic Finance', 'CBDC', 'Cross-border'],
  },
  {
    id: 'exp-006', name: 'Jean-Pierre Nkurunziza', email: 'jp@example.com', country: 'Rwanda', countryFlag: '🇷🇼',
    tier: 'Community Writer', type: 'Content', joinedAt: '2025-09-01', status: 'active', avatar: 'JN',
    articlesPublished: 18, articlesThisMonth: 2, avgArticleViews: 1420, totalViews: 25560,
    coursesCreated: 0, courseEnrollments: 0, podcastEpisodes: 15, podcastListens: 6700,
    qualityScore: 71, editorRating: 3.7, seoScore: 68, factCheckPass: 90, aiReviewScore: 72, plagiarismFree: 100,
    avgReadTime: 2.9, totalComments: 320, totalShares: 540, totalLikes: 2100, socialFollowers: 3800, communityScore: 65,
    adRevenueEarned: 1400, courseRevenueEarned: 0, tipsReceived: 120, podcastRevenueEarned: 890, totalRevenueEarned: 2410, totalTokensPaid: 1900, pendingPayout: 510,
    missedDeadlines: 1, warningsReceived: 0, awardsWon: 0, awardEligible: false, consecutiveMonthsActive: 5,
    lastArticleDate: '2026-02-20', languages: ['English', 'French', 'Kinyarwanda'], specialties: ['Innovation Hub', 'Digital Economy', 'BNR Framework'],
  },
  {
    id: 'exp-007', name: 'Chidinma Eze', email: 'chidinma@example.com', country: 'Nigeria', countryFlag: '🇳🇬',
    tier: 'Senior Analyst', type: 'Research & Data', joinedAt: '2025-01-20', status: 'active', avatar: 'CE',
    articlesPublished: 56, articlesThisMonth: 5, avgArticleViews: 4800, totalViews: 268800,
    coursesCreated: 4, courseEnrollments: 1200, podcastEpisodes: 30, podcastListens: 22000,
    qualityScore: 94, editorRating: 4.8, seoScore: 90, factCheckPass: 99, aiReviewScore: 93, plagiarismFree: 100,
    avgReadTime: 5.8, totalComments: 2600, totalShares: 5100, totalLikes: 18900, socialFollowers: 42000, communityScore: 97,
    adRevenueEarned: 14200, courseRevenueEarned: 9600, tipsReceived: 2100, podcastRevenueEarned: 4800, totalRevenueEarned: 30700, totalTokensPaid: 26200, pendingPayout: 4500,
    missedDeadlines: 0, warningsReceived: 0, awardsWon: 7, awardEligible: true, consecutiveMonthsActive: 13,
    lastArticleDate: '2026-02-28', languages: ['English', 'Igbo', 'Hausa'], specialties: ['DeFi', 'Tokenomics', 'Institutional Crypto'],
  },
  {
    id: 'exp-008', name: 'David Mensah', email: 'david@example.com', country: 'Ghana', countryFlag: '🇬🇭',
    tier: 'Community Writer', type: 'Content', joinedAt: '2025-10-15', status: 'probation', avatar: 'DM',
    articlesPublished: 9, articlesThisMonth: 1, avgArticleViews: 980, totalViews: 8820,
    coursesCreated: 0, courseEnrollments: 0, podcastEpisodes: 0, podcastListens: 0,
    qualityScore: 58, editorRating: 3.0, seoScore: 55, factCheckPass: 82, aiReviewScore: 60, plagiarismFree: 95,
    avgReadTime: 2.1, totalComments: 120, totalShares: 180, totalLikes: 640, socialFollowers: 1200, communityScore: 42,
    adRevenueEarned: 540, courseRevenueEarned: 0, tipsReceived: 30, podcastRevenueEarned: 0, totalRevenueEarned: 570, totalTokensPaid: 450, pendingPayout: 120,
    missedDeadlines: 4, warningsReceived: 2, awardsWon: 0, awardEligible: false, consecutiveMonthsActive: 2,
    lastArticleDate: '2026-02-10', languages: ['English'], specialties: ['Crypto Basics'],
  },
  {
    id: 'exp-009', name: 'Naledi Khumalo', email: 'naledi@example.com', country: 'South Africa', countryFlag: '🇿🇦',
    tier: 'Advisory Board', type: 'Strategy & Leadership', joinedAt: '2025-01-05', status: 'active', avatar: 'NK',
    articlesPublished: 14, articlesThisMonth: 1, avgArticleViews: 8200, totalViews: 114800,
    coursesCreated: 2, courseEnrollments: 560, podcastEpisodes: 8, podcastListens: 12400,
    qualityScore: 98, editorRating: 5.0, seoScore: 95, factCheckPass: 100, aiReviewScore: 97, plagiarismFree: 100,
    avgReadTime: 7.4, totalComments: 3400, totalShares: 8200, totalLikes: 28000, socialFollowers: 85000, communityScore: 99,
    adRevenueEarned: 18600, courseRevenueEarned: 4800, tipsReceived: 3200, podcastRevenueEarned: 2400, totalRevenueEarned: 29000, totalTokensPaid: 25000, pendingPayout: 4000,
    missedDeadlines: 0, warningsReceived: 0, awardsWon: 8, awardEligible: true, consecutiveMonthsActive: 13,
    lastArticleDate: '2026-02-24', languages: ['English', 'Zulu'], specialties: ['Strategy', 'Institutional Crypto', 'Policy'],
  },
  {
    id: 'exp-010', name: 'Omar Diallo', email: 'omar@example.com', country: 'Senegal', countryFlag: '🇸🇳',
    tier: 'Community Writer', type: 'Content', joinedAt: '2025-11-02', status: 'suspended', avatar: 'OD',
    articlesPublished: 6, articlesThisMonth: 0, avgArticleViews: 720, totalViews: 4320,
    coursesCreated: 0, courseEnrollments: 0, podcastEpisodes: 0, podcastListens: 0,
    qualityScore: 44, editorRating: 2.5, seoScore: 40, factCheckPass: 75, aiReviewScore: 48, plagiarismFree: 88,
    avgReadTime: 1.8, totalComments: 60, totalShares: 40, totalLikes: 180, socialFollowers: 600, communityScore: 28,
    adRevenueEarned: 180, courseRevenueEarned: 0, tipsReceived: 10, podcastRevenueEarned: 0, totalRevenueEarned: 190, totalTokensPaid: 190, pendingPayout: 0,
    missedDeadlines: 5, warningsReceived: 3, awardsWon: 0, awardEligible: false, consecutiveMonthsActive: 0,
    lastArticleDate: '2026-01-05', languages: ['French', 'Wolof'], specialties: ['West Africa Markets'],
  },
];

const mockApplications: Application[] = [
  {
    id: 'app-001', name: 'Blessing Adeyemi', email: 'blessing@example.com', country: 'Nigeria', countryFlag: '🇳🇬',
    appliedTier: 'Regional Expert', appliedDate: '2026-02-26', status: 'pending', avatar: 'BA',
    expertise: 'DeFi protocols and yield farming strategies in West Africa',
    portfolio: 'https://medium.com/@blessing-crypto',
    why: 'I have been covering DeFi in Nigeria for 3 years and want to share deep market insights with a Pan-African audience. I have connections with major Nigerian exchanges and can provide exclusive insider perspectives.',
    topics: ['DeFi & Yield Farming', 'Nigeria Market Analysis', 'P2P Markets'],
    languages: ['English', 'Yoruba', 'Pidgin'],
    socialLinks: [{ platform: 'Twitter', url: '@blessing_defi' }, { platform: 'LinkedIn', url: 'blessing-adeyemi' }],
    writingSamples: 5, experience: '3 years crypto journalism, former DeFi analyst at ChainAnalysis Africa',
    reviewerNotes: '', aiScore: 87,
  },
  {
    id: 'app-002', name: 'Samuel Ochieng', email: 'samuel@example.com', country: 'Kenya', countryFlag: '🇰🇪',
    appliedTier: 'Community Writer', appliedDate: '2026-02-25', status: 'pending', avatar: 'SO',
    expertise: 'M-Pesa crypto integration and mobile money trends',
    portfolio: 'https://samcrypto.substack.com',
    why: 'Mobile money is the gateway to crypto in Kenya. I want to document the bridge between M-Pesa and crypto for everyday Kenyans. My Substack has 2,400 subscribers.',
    topics: ['Kenya Fintech Coverage', 'East Africa Mobile Money', 'Educational Content'],
    languages: ['English', 'Swahili'],
    socialLinks: [{ platform: 'Twitter', url: '@sam_mpesa_crypto' }],
    writingSamples: 3, experience: '1 year blogging on Substack, fintech background',
    reviewerNotes: '', aiScore: 72,
  },
  {
    id: 'app-003', name: 'Nadia Bensaid', email: 'nadia@example.com', country: 'Morocco', countryFlag: '🇲🇦',
    appliedTier: 'Senior Analyst', appliedDate: '2026-02-24', status: 'under_review', avatar: 'NB',
    expertise: 'MENA-Africa cross-border crypto flows and Islamic finance DeFi',
    portfolio: 'https://nadia-research.com',
    why: 'I hold a CFA charter and have published 20+ research papers on crypto regulation in North Africa. I can bring institutional-grade analysis covering the MENA-Africa corridor that no one else covers.',
    topics: ['CBDC Research', 'Crypto Tax & Compliance', 'Stablecoin Remittances'],
    languages: ['English', 'French', 'Arabic'],
    socialLinks: [{ platform: 'Twitter', url: '@nadia_cfa_crypto' }, { platform: 'LinkedIn', url: 'bensaid-nadia' }, { platform: 'ResearchGate', url: 'nadia-bensaid' }],
    writingSamples: 8, experience: 'CFA charterholder, 5 years crypto research, ex-Deloitte blockchain advisory',
    reviewerNotes: 'Exceptional candidate. CFA + published research. Recommend fast-tracking.', aiScore: 96,
  },
  {
    id: 'app-004', name: 'Tendai Moyo', email: 'tendai@example.com', country: 'Zimbabwe', countryFlag: '🇿🇼',
    appliedTier: 'Community Writer', appliedDate: '2026-02-23', status: 'pending', avatar: 'TM',
    expertise: 'Crypto as hedge against inflation in Zimbabwe and Southern Africa',
    portfolio: '',
    why: 'Living through hyperinflation, I understand why Zimbabweans need crypto. I want to write about real experiences of using Bitcoin and stablecoins to survive economic turmoil.',
    topics: ['Educational Content', 'Exchange Reviews', 'Stablecoin Remittances'],
    languages: ['English', 'Shona'],
    socialLinks: [{ platform: 'Twitter', url: '@tendai_btc_zw' }],
    writingSamples: 1, experience: '6 months personal crypto blog, IT professional by day',
    reviewerNotes: '', aiScore: 58,
  },
  {
    id: 'app-005', name: 'Grace Mensah-Williams', email: 'grace@example.com', country: 'Ghana', countryFlag: '🇬🇭',
    appliedTier: 'Regional Expert', appliedDate: '2026-02-22', status: 'under_review', avatar: 'GM',
    expertise: 'Ghana e-Cedi CBDC rollout and BoG digital currency policy',
    portfolio: 'https://grace-crypto-ghana.medium.com',
    why: 'I was part of the BoG advisory group on the e-Cedi pilot. I can provide unmatched insider analysis on Ghana\'s CBDC journey and its implications for West African crypto markets.',
    topics: ['CBDC Research', 'West Africa P2P', 'Crypto Tax & Compliance'],
    languages: ['English', 'Twi', 'Ewe'],
    socialLinks: [{ platform: 'Twitter', url: '@grace_ecedi' }, { platform: 'LinkedIn', url: 'grace-mensah-williams' }],
    writingSamples: 6, experience: '4 years fintech journalism, BoG advisory group member, MBA Finance',
    reviewerNotes: 'Strong BoG connections. Verify advisory role claim before approval.', aiScore: 91,
  },
  {
    id: 'app-006', name: 'Ahmed Diop', email: 'ahmed@example.com', country: 'Senegal', countryFlag: '🇸🇳',
    appliedTier: 'Community Writer', appliedDate: '2026-02-21', status: 'rejected', avatar: 'AD',
    expertise: 'General crypto trading',
    portfolio: '',
    why: 'I trade crypto and want to share my signals.',
    topics: ['Memecoin Analysis'],
    languages: ['French'],
    socialLinks: [],
    writingSamples: 0, experience: 'Trading crypto for 6 months',
    reviewerNotes: 'Insufficient experience. No writing samples. Application focused on signal-sharing rather than journalism. Encourage to reapply after building a portfolio.', aiScore: 24,
  },
  {
    id: 'app-007', name: 'Amina Jallow', email: 'amina@example.com', country: 'Gambia', countryFlag: '🇬🇲',
    appliedTier: 'Community Writer', appliedDate: '2026-02-20', status: 'approved', avatar: 'AJ',
    expertise: 'Financial inclusion and crypto education for women in West Africa',
    portfolio: 'https://aminajallow.com/blog',
    why: 'Women in Gambia and West Africa are being left behind in the crypto revolution. I want to create educational content specifically targeting women entering the space.',
    topics: ['Educational Content', 'West Africa P2P', 'Exchange Reviews'],
    languages: ['English', 'Mandinka', 'Wolof'],
    socialLinks: [{ platform: 'Twitter', url: '@amina_crypto_women' }, { platform: 'Instagram', url: 'aminacryptoafrica' }],
    writingSamples: 4, experience: '2 years financial literacy educator, crypto educator at local NGO',
    reviewerNotes: 'Great niche focus. Strong passion for education. Approved for Community Writer tier with potential for upgrade.', aiScore: 79,
  },
  {
    id: 'app-008', name: 'Dr. Olumide Bankole', email: 'olumide@example.com', country: 'Nigeria', countryFlag: '🇳🇬',
    appliedTier: 'Advisory Board', appliedDate: '2026-02-19', status: 'under_review', avatar: 'OB',
    expertise: 'Blockchain regulation and policy advisory across Sub-Saharan Africa',
    portfolio: 'https://scholar.google.com/citations?user=olumide',
    why: 'As former SEC Nigeria blockchain committee member and current advisor to 3 African exchanges, I can provide strategic guidance on regulatory intelligence and institutional adoption.',
    topics: ['Crypto Tax & Compliance', 'Nigeria Market Analysis', 'CBDC Research'],
    languages: ['English', 'Yoruba'],
    socialLinks: [{ platform: 'Twitter', url: '@dr_bankole_policy' }, { platform: 'LinkedIn', url: 'dr-olumide-bankole' }],
    writingSamples: 12, experience: 'PhD Economics, ex-SEC Nigeria blockchain committee, advisor to Quidax, Luno Africa, Patricia',
    reviewerNotes: 'High-profile candidate. Verify SEC committee and exchange advisor claims. If confirmed, fast-track to Advisory Board.', aiScore: 98,
  },
];

const awardBenchmarks: AwardBenchmark[] = [
  { name: 'Top Writer', icon: <Trophy className="w-5 h-5" />, criteria: 'Quality Score ≥ 90', threshold: 90, metric: 'qualityScore', color: 'yellow', prize: '5,000 CDT + Trophy Badge' },
  { name: 'Revenue King', icon: <Crown className="w-5 h-5" />, criteria: 'Total Revenue ≥ $10,000', threshold: 10000, metric: 'totalRevenueEarned', color: 'purple', prize: '10,000 CDT + Crown Badge' },
  { name: 'Community Star', icon: <Star className="w-5 h-5" />, criteria: 'Community Score ≥ 90', threshold: 90, metric: 'communityScore', color: 'blue', prize: '3,000 CDT + Star Badge' },
  { name: 'Consistency Champion', icon: <Flame className="w-5 h-5" />, criteria: '12+ Consecutive Active Months', threshold: 12, metric: 'consecutiveMonthsActive', color: 'orange', prize: '7,500 CDT + Fire Badge' },
  { name: 'Viral Creator', icon: <Zap className="w-5 h-5" />, criteria: 'Total Views ≥ 200,000', threshold: 200000, metric: 'totalViews', color: 'green', prize: '5,000 CDT + Lightning Badge' },
  { name: 'Educator', icon: <GraduationCap className="w-5 h-5" />, criteria: 'Course Enrollments ≥ 500', threshold: 500, metric: 'courseEnrollments', color: 'indigo', prize: '4,000 CDT + Scholar Badge' },
];

// ──────────── Helper Components ────────────

const tierColors: Record<string, { bg: string; text: string; dot: string }> = {
  'Community Writer': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  'Regional Expert': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  'Senior Analyst': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  'Advisory Board': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
};

const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  active: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  probation: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', icon: <AlertCircle className="w-3.5 h-3.5" /> },
  suspended: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: <Ban className="w-3.5 h-3.5" /> },
  inactive: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-400', icon: <Clock className="w-3.5 h-3.5" /> },
};

// ──────────── Main Component ────────────

export default function ExpertProgramDashboard() {
  const [stats] = useState<ExpertStats>(mockStats);
  const [experts] = useState<Expert[]>(mockExperts);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('qualityScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'experts' | 'applications' | 'awards' | 'leaderboard'>('overview');
  const [applications, setApplications] = useState<Application[]>(mockApplications);
  const [appFilter, setAppFilter] = useState<string>('all');
  const [appSearch, setAppSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ app: Application; action: 'approve' | 'reject' } | null>(null);

  const filteredExperts = useMemo(() => {
    let result = [...experts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(e => e.name.toLowerCase().includes(q) || e.country.toLowerCase().includes(q) || e.specialties.some(s => s.toLowerCase().includes(q)));
    }
    if (tierFilter !== 'all') result = result.filter(e => e.tier === tierFilter);
    if (statusFilter !== 'all') result = result.filter(e => e.status === statusFilter);
    result.sort((a, b) => {
      const aVal = (a as any)[sortBy] ?? 0;
      const bVal = (b as any)[sortBy] ?? 0;
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
    return result;
  }, [experts, searchQuery, tierFilter, statusFilter, sortBy, sortDir]);

  const handleSort = (field: string) => {
    if (sortBy === field) setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const leaderboard = useMemo(() => {
    return [...experts]
      .filter(e => e.status === 'active')
      .sort((a, b) => {
        const scoreA = (a.qualityScore * 0.3) + (a.communityScore * 0.2) + (Math.min(a.totalRevenueEarned / 300, 100) * 0.2) + (Math.min(a.articlesPublished * 2, 100) * 0.15) + (Math.min(a.consecutiveMonthsActive * 8, 100) * 0.15);
        const scoreB = (b.qualityScore * 0.3) + (b.communityScore * 0.2) + (Math.min(b.totalRevenueEarned / 300, 100) * 0.2) + (Math.min(b.articlesPublished * 2, 100) * 0.15) + (Math.min(b.consecutiveMonthsActive * 8, 100) * 0.15);
        return scoreB - scoreA;
      });
  }, [experts]);

  const getCompositeScore = (e: Expert) => {
    return Math.round((e.qualityScore * 0.3) + (e.communityScore * 0.2) + (Math.min(e.totalRevenueEarned / 300, 100) * 0.2) + (Math.min(e.articlesPublished * 2, 100) * 0.15) + (Math.min(e.consecutiveMonthsActive * 8, 100) * 0.15));
  };

  const formatCurrency = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n}`;
  const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`;

  const filteredApps = useMemo(() => {
    let result = [...applications];
    if (appSearch) {
      const q = appSearch.toLowerCase();
      result = result.filter(a => a.name.toLowerCase().includes(q) || a.country.toLowerCase().includes(q) || a.expertise.toLowerCase().includes(q));
    }
    if (appFilter !== 'all') result = result.filter(a => a.status === appFilter);
    return result.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
  }, [applications, appSearch, appFilter]);

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const reviewCount = applications.filter(a => a.status === 'under_review').length;

  const handleAppAction = (app: Application, action: 'approve' | 'reject') => {
    setApplications(prev => prev.map(a => a.id === app.id ? {
      ...a,
      status: action === 'approve' ? 'approved' as const : 'rejected' as const,
      reviewerNotes: reviewNotes || a.reviewerNotes,
    } : a));
    setConfirmAction(null);
    setSelectedApp(null);
    setReviewNotes('');
  };

  const handleSetUnderReview = (app: Application) => {
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'under_review' as const } : a));
  };

  const appStatusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', label: 'Pending' },
    under_review: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', label: 'Under Review' },
    approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', label: 'Approved' },
    rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', label: 'Rejected' },
  };

  const getAiScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-orange-500" />
            Local Expert Program
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Monitor experts, track KPIs, manage awards and performance benchmarks
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700">
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
        {(['overview', 'experts', 'applications', 'awards', 'leaderboard'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all capitalize relative ${activeTab === tab ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {tab === 'overview' && <BarChart3 className="w-4 h-4 inline mr-1.5" />}
            {tab === 'experts' && <Users className="w-4 h-4 inline mr-1.5" />}
            {tab === 'applications' && <Inbox className="w-4 h-4 inline mr-1.5" />}
            {tab === 'awards' && <Award className="w-4 h-4 inline mr-1.5" />}
            {tab === 'leaderboard' && <Trophy className="w-4 h-4 inline mr-1.5" />}
            {tab}
            {tab === 'applications' && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════ OVERVIEW TAB ═══════════ */}
      {activeTab === 'overview' && (
        <>
          {/* KPI Cards Row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { label: 'Total Experts', value: stats.totalExperts, icon: <Users className="w-5 h-5 text-blue-500" />, change: stats.monthlyGrowthRate },
              { label: 'Active', value: stats.activeExperts, icon: <CheckCircle className="w-5 h-5 text-green-500" />, change: 8.2 },
              { label: 'Pending Apps', value: stats.pendingApplications, icon: <Clock className="w-5 h-5 text-yellow-500" />, change: null },
              { label: 'Suspended', value: stats.suspendedExperts, icon: <Ban className="w-5 h-5 text-red-500" />, change: -2.1 },
              { label: 'Articles', value: formatNumber(stats.totalArticlesPublished), icon: <FileText className="w-5 h-5 text-purple-500" />, change: 15.4 },
              { label: 'Courses', value: stats.totalCoursesCreated, icon: <GraduationCap className="w-5 h-5 text-indigo-500" />, change: 22.0 },
              { label: 'Podcasts', value: stats.totalPodcastEpisodes, icon: <Mic className="w-5 h-5 text-pink-500" />, change: 18.6 },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  {kpi.icon}
                  {kpi.change !== null && (
                    <span className={`text-xs font-medium flex items-center gap-0.5 ${kpi.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(kpi.change)}%
                    </span>
                  )}
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                <p className="text-xs text-gray-500">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* KPI Cards Row 2 — Financial */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 mb-1 opacity-80"><DollarSign className="w-5 h-5" /> Total Revenue Generated</div>
              <p className="text-3xl font-black">{formatCurrency(stats.totalRevenueGenerated)}</p>
              <p className="text-sm opacity-80 mt-1">By all experts combined</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 mb-1 opacity-80"><Sparkles className="w-5 h-5" /> Tokens Paid Out</div>
              <p className="text-3xl font-black">{formatCurrency(stats.totalTokensPaid)}</p>
              <p className="text-sm opacity-80 mt-1">CoinDaily Token distributions</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 mb-1 opacity-80"><Target className="w-5 h-5" /> Avg Quality Score</div>
              <p className="text-3xl font-black">{stats.avgQualityScore}/100</p>
              <p className="text-sm opacity-80 mt-1">Across all active experts</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 mb-1 opacity-80"><Award className="w-5 h-5" /> Award Eligible</div>
              <p className="text-3xl font-black">{stats.rewardEligible}</p>
              <p className="text-sm opacity-80 mt-1">Experts meeting benchmarks</p>
            </div>
          </div>

          {/* Tier Distribution + Avg Revenue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-orange-500" /> Tier Distribution</h3>
              {(['Community Writer', 'Regional Expert', 'Senior Analyst', 'Advisory Board'] as const).map(tier => {
                const count = experts.filter(e => e.tier === tier).length;
                const pct = Math.round((count / experts.length) * 100);
                const tc = tierColors[tier];
                return (
                  <div key={tier} className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tc.bg} ${tc.text}`}>{tier}</span>
                      <span className="text-gray-500">{count} experts ({pct}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${tc.dot}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-500" /> Top Countries</h3>
              {(() => {
                const countryMap: Record<string, { count: number; revenue: number; flag: string }> = {};
                experts.forEach(e => {
                  if (!countryMap[e.country]) countryMap[e.country] = { count: 0, revenue: 0, flag: e.countryFlag };
                  countryMap[e.country].count++;
                  countryMap[e.country].revenue += e.totalRevenueEarned;
                });
                return Object.entries(countryMap).sort((a, b) => b[1].count - a[1].count).map(([country, data]) => (
                  <div key={country} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{data.flag}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{country}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{data.count} experts</span>
                      <span className="text-xs text-gray-500 ml-2">{formatCurrency(data.revenue)} revenue</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </>
      )}

      {/* ═══════════ EXPERTS TAB ═══════════ */}
      {activeTab === 'experts' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search experts..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white" />
            </div>
            <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white">
              <option value="all">All Tiers</option>
              <option value="Community Writer">Community Writer</option>
              <option value="Regional Expert">Regional Expert</option>
              <option value="Senior Analyst">Senior Analyst</option>
              <option value="Advisory Board">Advisory Board</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="probation">Probation</option>
              <option value="suspended">Suspended</option>
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white">
              <option value="qualityScore">Sort: Quality Score</option>
              <option value="totalRevenueEarned">Sort: Revenue</option>
              <option value="articlesPublished">Sort: Articles</option>
              <option value="communityScore">Sort: Community</option>
              <option value="totalViews">Sort: Views</option>
              <option value="consecutiveMonthsActive">Sort: Consistency</option>
            </select>
            <span className="text-sm text-gray-500">{filteredExperts.length} results</span>
          </div>

          {/* Expert Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredExperts.map(expert => {
              const tc = tierColors[expert.tier];
              const sc = statusConfig[expert.status];
              return (
                <div key={expert.id} onClick={() => setSelectedExpert(expert)}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-800 transition-all cursor-pointer">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${tc.bg} ${tc.text}`}>
                        {expert.avatar}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          {expert.name} {expert.countryFlag}
                          {expert.awardEligible && <Award className="w-4 h-4 text-yellow-500" />}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tc.bg} ${tc.text}`}>{expert.tier}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${sc.bg} ${sc.text}`}>{sc.icon} {expert.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-orange-600">{expert.qualityScore}</p>
                      <p className="text-xs text-gray-500">Quality</p>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{expert.articlesPublished}</p>
                      <p className="text-xs text-gray-500">Articles</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatNumber(expert.totalViews)}</p>
                      <p className="text-xs text-gray-500">Views</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                      <p className="text-sm font-bold text-green-600">{formatCurrency(expert.totalRevenueEarned)}</p>
                      <p className="text-xs text-gray-500">Revenue</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{expert.awardsWon}</p>
                      <p className="text-xs text-gray-500">Awards</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-700">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      Last article: {new Date(expert.lastArticleDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-2">
                      {expert.missedDeadlines > 0 && (
                        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" /> {expert.missedDeadlines} missed
                        </span>
                      )}
                      {expert.warningsReceived > 0 && (
                        <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded-full">
                          ⚠ {expert.warningsReceived} warnings
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══════════ AWARDS TAB ═══════════ */}
      {activeTab === 'awards' && (
        <>
          <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 rounded-xl p-6 text-white mb-2">
            <h2 className="text-xl font-bold flex items-center gap-2"><Trophy className="w-6 h-6" /> Award Benchmarks & Criteria</h2>
            <p className="text-yellow-100 text-sm mt-1">Experts who meet these benchmarks qualify for quarterly awards. All prizes in CoinDaily Token (CDT).</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {awardBenchmarks.map(award => {
              const eligible = experts.filter(e => e.status === 'active' && (e as any)[award.metric] >= award.threshold);
              const colorClasses: Record<string, string> = {
                yellow: 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20',
                purple: 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20',
                blue: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20',
                orange: 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20',
                green: 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20',
                indigo: 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20',
              };
              const iconColors: Record<string, string> = {
                yellow: 'text-yellow-600', purple: 'text-purple-600', blue: 'text-blue-600',
                orange: 'text-orange-600', green: 'text-green-600', indigo: 'text-indigo-600',
              };
              return (
                <div key={award.name} className={`rounded-xl border-2 p-5 ${colorClasses[award.color]}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={iconColors[award.color]}>{award.icon}</span>
                    <h4 className="font-bold text-gray-900 dark:text-white">{award.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-1"><strong>Criteria:</strong> {award.criteria}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3"><strong>Prize:</strong> {award.prize}</p>
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Eligible Experts ({eligible.length}):</p>
                    {eligible.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No experts currently qualify</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {eligible.map(e => (
                          <span key={e.id} className="flex items-center gap-1 text-xs bg-white dark:bg-gray-800 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                            {e.countryFlag} {e.name.split(' ')[0]}
                            <span className="text-gray-400">({(e as any)[award.metric] >= 1000 ? formatNumber((e as any)[award.metric]) : (e as any)[award.metric]})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Award History Summary */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 mt-2">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Medal className="w-5 h-5 text-yellow-500" /> Award Winners This Quarter</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-500 font-medium">Expert</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Tier</th>
                    <th className="text-center py-2 text-gray-500 font-medium">Awards Won</th>
                    <th className="text-center py-2 text-gray-500 font-medium">Quality</th>
                    <th className="text-center py-2 text-gray-500 font-medium">Revenue</th>
                    <th className="text-center py-2 text-gray-500 font-medium">Community</th>
                    <th className="text-center py-2 text-gray-500 font-medium">Eligible For</th>
                  </tr>
                </thead>
                <tbody>
                  {experts.filter(e => e.awardsWon > 0).sort((a, b) => b.awardsWon - a.awardsWon).map(e => {
                    const eligibleAwards = awardBenchmarks.filter(a => (e as any)[a.metric] >= a.threshold);
                    return (
                      <tr key={e.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 flex items-center gap-2">
                          <span className="text-lg">{e.countryFlag}</span>
                          <span className="font-medium text-gray-900 dark:text-white">{e.name}</span>
                        </td>
                        <td><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[e.tier].bg} ${tierColors[e.tier].text}`}>{e.tier}</span></td>
                        <td className="text-center font-bold text-yellow-600">{e.awardsWon}</td>
                        <td className="text-center">{e.qualityScore}</td>
                        <td className="text-center text-green-600">{formatCurrency(e.totalRevenueEarned)}</td>
                        <td className="text-center">{e.communityScore}</td>
                        <td className="text-center">
                          <div className="flex justify-center gap-1">
                            {eligibleAwards.map(a => (
                              <span key={a.name} title={a.name} className="text-xs">{a.icon}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══════════ LEADERBOARD TAB ═══════════ */}
      {activeTab === 'leaderboard' && (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Composite Performance Ranking</h3>
              <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
                Score = Quality(30%) + Community(20%) + Revenue(20%) + Output(15%) + Consistency(15%)
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-6">Active experts ranked by composite score across all performance dimensions</p>

            <div className="space-y-3">
              {leaderboard.map((expert, index) => {
                const score = getCompositeScore(expert);
                const tc = tierColors[expert.tier];
                const isTop3 = index < 3;
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div key={expert.id} onClick={() => setSelectedExpert(expert)}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all cursor-pointer ${isTop3 ? 'bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/10 dark:via-amber-900/10 dark:to-orange-900/10 border-2 border-yellow-200 dark:border-yellow-800' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                    {/* Rank */}
                    <div className="w-10 text-center flex-shrink-0">
                      {isTop3 ? <span className="text-2xl">{medals[index]}</span> : <span className="text-lg font-bold text-gray-400">#{index + 1}</span>}
                    </div>
                    {/* Avatar + Info */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${tc.bg} ${tc.text}`}>
                      {expert.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-white">{expert.name}</span>
                        <span className="text-sm">{expert.countryFlag}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${tc.bg} ${tc.text}`}>{expert.tier}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span>{expert.articlesPublished} articles</span>
                        <span>{formatNumber(expert.totalViews)} views</span>
                        <span>{formatCurrency(expert.totalRevenueEarned)}</span>
                        <span>{expert.consecutiveMonthsActive}mo streak</span>
                      </div>
                    </div>
                    {/* Score Bars */}
                    <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
                      <div className="w-20">
                        <div className="flex justify-between text-xs text-gray-500 mb-0.5"><span>Quality</span><span>{expert.qualityScore}</span></div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${expert.qualityScore}%` }} />
                        </div>
                      </div>
                      <div className="w-20">
                        <div className="flex justify-between text-xs text-gray-500 mb-0.5"><span>Community</span><span>{expert.communityScore}</span></div>
                        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${expert.communityScore}%` }} />
                        </div>
                      </div>
                    </div>
                    {/* Composite Score */}
                    <div className="text-right flex-shrink-0 w-16">
                      <p className={`text-xl font-black ${isTop3 ? 'text-orange-600' : 'text-gray-700 dark:text-gray-300'}`}>{score}</p>
                      <p className="text-xs text-gray-500">score</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ═══════════ APPLICATIONS TAB ═══════════ */}
      {activeTab === 'applications' && (
        <>
          {/* Applications Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Applications', value: applications.length, icon: <Inbox className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Pending Review', value: pendingCount, icon: <Clock className="w-5 h-5 text-yellow-500" />, bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
              { label: 'Under Review', value: reviewCount, icon: <Eye className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
              { label: 'Approved / Rejected', value: `${applications.filter(a => a.status === 'approved').length} / ${applications.filter(a => a.status === 'rejected').length}`, icon: <UserCheck className="w-5 h-5 text-green-500" />, bg: 'bg-green-50 dark:bg-green-900/20' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-gray-100 dark:border-gray-700`}>
                <div className="flex items-center gap-2 mb-1">{s.icon}<span className="text-xs text-gray-500">{s.label}</span></div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search applicants..." value={appSearch} onChange={e => setAppSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white" />
            </div>
            <div className="flex gap-1.5">
              {['all', 'pending', 'under_review', 'approved', 'rejected'].map(f => (
                <button key={f} onClick={() => setAppFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    appFilter === f
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}>
                  {f === 'all' ? 'All' : f === 'under_review' ? 'Under Review' : f.charAt(0).toUpperCase() + f.slice(1)}
                  {f === 'pending' && pendingCount > 0 && <span className="ml-1 bg-red-500 text-white px-1.5 rounded-full text-xs">{pendingCount}</span>}
                </button>
              ))}
            </div>
            <span className="text-sm text-gray-500">{filteredApps.length} applications</span>
          </div>

          {/* Application List */}
          <div className="space-y-3">
            {filteredApps.map(app => {
              const sc = appStatusConfig[app.status];
              const tc = tierColors[app.appliedTier];
              return (
                <div key={app.id} onClick={() => { setSelectedApp(app); setReviewNotes(app.reviewerNotes); }}
                  className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-5 hover:shadow-lg transition-all cursor-pointer ${
                    app.status === 'pending' ? 'border-yellow-200 dark:border-yellow-800' :
                    app.status === 'under_review' ? 'border-blue-200 dark:border-blue-800' :
                    'border-transparent'
                  }`}>
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${tc.bg} ${tc.text}`}>
                      {app.avatar}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900 dark:text-white">{app.name}</h4>
                        <span className="text-sm">{app.countryFlag}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tc.bg} ${tc.text}`}>{app.appliedTier}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>{sc.label}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">{app.expertise}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(app.appliedDate).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{app.languages.join(', ')}</span>
                        <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{app.writingSamples} samples</span>
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{app.email}</span>
                      </div>
                    </div>
                    {/* AI Score + Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {app.aiScore !== null && (
                        <div className="text-center">
                          <p className={`text-lg font-black ${getAiScoreColor(app.aiScore)}`}>{app.aiScore}</p>
                          <p className="text-xs text-gray-400">AI Score</p>
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5">
                        {(app.status === 'pending' || app.status === 'under_review') && (
                          <>
                            <button onClick={e => { e.stopPropagation(); setConfirmAction({ app, action: 'approve' }); }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700">
                              <CheckCircle className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button onClick={e => { e.stopPropagation(); setConfirmAction({ app, action: 'reject' }); }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700">
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        {app.status === 'pending' && (
                          <button onClick={e => { e.stopPropagation(); handleSetUnderReview(app); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-lg hover:bg-blue-200">
                            <Eye className="w-3.5 h-3.5" /> Review
                          </button>
                        )}
                        {app.status === 'approved' && <span className="text-green-600 text-xs font-bold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Approved</span>}
                        {app.status === 'rejected' && <span className="text-red-600 text-xs font-bold flex items-center gap-1"><XCircle className="w-4 h-4" /> Rejected</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredApps.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No applications match your filters</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════ APPLICATION DETAIL MODAL ═══════════ */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto" onClick={() => { setSelectedApp(null); setReviewNotes(''); }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full mx-4 border dark:border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${tierColors[selectedApp.appliedTier].bg} ${tierColors[selectedApp.appliedTier].text}`}>
                    {selectedApp.avatar}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {selectedApp.name} {selectedApp.countryFlag}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[selectedApp.appliedTier].bg} ${tierColors[selectedApp.appliedTier].text}`}>Applied: {selectedApp.appliedTier}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${appStatusConfig[selectedApp.status].bg} ${appStatusConfig[selectedApp.status].text}`}>{appStatusConfig[selectedApp.status].label}</span>
                      <span className="text-xs text-gray-500">Applied {new Date(selectedApp.appliedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => { setSelectedApp(null); setReviewNotes(''); }} className="p-2 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Contact & AI Score */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedApp.email}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Country</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedApp.countryFlag} {selectedApp.country}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Languages</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedApp.languages.join(', ')}</p>
                </div>
                <div className={`rounded-lg p-3 ${selectedApp.aiScore !== null && selectedApp.aiScore >= 80 ? 'bg-green-50 dark:bg-green-900/20' : selectedApp.aiScore !== null && selectedApp.aiScore >= 60 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <p className="text-xs text-gray-500 mb-1">AI Pre-Screening</p>
                  <p className={`text-2xl font-black ${getAiScoreColor(selectedApp.aiScore)}`}>{selectedApp.aiScore ?? 'N/A'}<span className="text-xs font-normal text-gray-400">/100</span></p>
                </div>
              </div>

              {/* Expertise & Experience */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Expertise</h4>
                <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">{selectedApp.expertise}</p>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Experience</h4>
                <p className="text-sm text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">{selectedApp.experience}</p>
              </div>

              {/* Why They Want to Join */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Why They Want to Join</h4>
                <p className="text-sm text-gray-800 dark:text-gray-200 bg-orange-50 dark:bg-orange-900/10 rounded-lg p-4 border border-orange-100 dark:border-orange-900/30 italic">&ldquo;{selectedApp.why}&rdquo;</p>
              </div>

              {/* Topics & Links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Topics of Interest</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApp.topics.map(t => (
                      <span key={t} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">{t}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Links</h4>
                  <div className="space-y-1.5">
                    {selectedApp.portfolio && (
                      <div className="flex items-center gap-2 text-sm">
                        <Link2 className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-blue-600 dark:text-blue-400 hover:underline truncate">{selectedApp.portfolio}</span>
                      </div>
                    )}
                    {selectedApp.socialLinks.map(sl => (
                      <div key={sl.platform} className="flex items-center gap-2 text-sm">
                        <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-500">{sl.platform}:</span>
                        <span className="text-gray-800 dark:text-gray-200">{sl.url}</span>
                      </div>
                    ))}
                    {!selectedApp.portfolio && selectedApp.socialLinks.length === 0 && (
                      <p className="text-xs text-gray-400 italic">No links provided</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Writing Samples */}
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 text-center ${selectedApp.writingSamples >= 3 ? 'bg-green-50 dark:bg-green-900/20' : selectedApp.writingSamples > 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedApp.writingSamples}</p>
                  <p className="text-xs text-gray-500">Writing Samples</p>
                </div>
                <div className="flex-1 text-xs text-gray-500">
                  <p><strong>Recommendation:</strong> {selectedApp.writingSamples >= 5 ? '✅ Excellent — strong portfolio' : selectedApp.writingSamples >= 3 ? '⚠️ Adequate — meets minimum' : selectedApp.writingSamples > 0 ? '⚠️ Below minimum — consider requesting more' : '❌ No samples — reject or request submission'}</p>
                </div>
              </div>

              {/* Reviewer Notes */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2 flex items-center gap-1"><MessageSquare className="w-4 h-4" /> Reviewer Notes</h4>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Add your review notes here... These will be saved with the application."
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                />
                <button onClick={() => {
                  setApplications(prev => prev.map(a => a.id === selectedApp.id ? { ...a, reviewerNotes: reviewNotes } : a));
                }} className="mt-2 px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300">Save Notes</button>
              </div>

              {/* Action Buttons */}
              {(selectedApp.status === 'pending' || selectedApp.status === 'under_review') && (
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button onClick={() => setConfirmAction({ app: selectedApp, action: 'approve' })}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 text-sm">
                    <CheckCircle className="w-4 h-4" /> Approve Application
                  </button>
                  <button onClick={() => setConfirmAction({ app: selectedApp, action: 'reject' })}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 text-sm">
                    <XCircle className="w-4 h-4" /> Reject Application
                  </button>
                  {selectedApp.status === 'pending' && (
                    <button onClick={() => { handleSetUnderReview(selectedApp); setSelectedApp({ ...selectedApp, status: 'under_review' }); }}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium hover:bg-blue-200 text-sm">
                      <Eye className="w-4 h-4" /> Mark Under Review
                    </button>
                  )}
                </div>
              )}
              {selectedApp.status === 'approved' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-green-800 dark:text-green-300">Application Approved</p>
                    <p className="text-sm text-green-700 dark:text-green-400">This applicant has been accepted into the {selectedApp.appliedTier} tier.</p>
                  </div>
                </div>
              )}
              {selectedApp.status === 'rejected' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                  <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-red-800 dark:text-red-300">Application Rejected</p>
                    <p className="text-sm text-red-700 dark:text-red-400">Rejection email will be sent with feedback.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ CONFIRM APPROVE/REJECT MODAL ═══════════ */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={() => setConfirmAction(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 border dark:border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${confirmAction.action === 'approve' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {confirmAction.action === 'approve'
                ? <CheckCircle className="w-7 h-7 text-green-600" />
                : <XCircle className="w-7 h-7 text-red-600" />}
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
              {confirmAction.action === 'approve' ? 'Approve' : 'Reject'} Application?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
              {confirmAction.action === 'approve'
                ? `Accept ${confirmAction.app.name} as a ${confirmAction.app.appliedTier}? They will receive an approval email with onboarding instructions.`
                : `Reject ${confirmAction.app.name}'s application for ${confirmAction.app.appliedTier}? They will receive a rejection email with feedback.`}
            </p>
            {confirmAction.action === 'reject' && (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rejection reason (optional)</label>
                <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={2} placeholder="Add feedback for the applicant..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white" />
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 text-sm">Cancel</button>
              <button onClick={() => handleAppAction(confirmAction.app, confirmAction.action)}
                className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium text-sm ${confirmAction.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                Confirm {confirmAction.action === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ EXPERT DETAIL MODAL ═══════════ */}
      {selectedExpert && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto" onClick={() => setSelectedExpert(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full mx-4 border dark:border-gray-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${tierColors[selectedExpert.tier].bg} ${tierColors[selectedExpert.tier].text}`}>
                    {selectedExpert.avatar}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      {selectedExpert.name} {selectedExpert.countryFlag}
                      {selectedExpert.awardEligible && <Award className="w-5 h-5 text-yellow-500" />}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierColors[selectedExpert.tier].bg} ${tierColors[selectedExpert.tier].text}`}>
                        {selectedExpert.tier}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${statusConfig[selectedExpert.status].bg} ${statusConfig[selectedExpert.status].text}`}>
                        {statusConfig[selectedExpert.status].icon} {selectedExpert.status}
                      </span>
                      <span className="text-xs text-gray-500">Joined {new Date(selectedExpert.joinedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedExpert.status === 'active' && (
                    <button className="px-3 py-1.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200">Set Probation</button>
                  )}
                  {selectedExpert.status !== 'suspended' && (
                    <button className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200">Suspend</button>
                  )}
                  {selectedExpert.status === 'suspended' && (
                    <button className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200">Reinstate</button>
                  )}
                  <button onClick={() => setSelectedExpert(null)} className="p-2 text-gray-400 hover:text-gray-600 text-xl">&times;</button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedExpert.email}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Country</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedExpert.countryFlag} {selectedExpert.country}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Languages</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedExpert.languages.join(', ')}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Specialties</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedExpert.specialties.join(', ')}</p>
                </div>
              </div>

              {/* Content Metrics */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-1"><FileText className="w-4 h-4" /> Content Output</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Articles Published', value: selectedExpert.articlesPublished, sub: `${selectedExpert.articlesThisMonth} this month` },
                    { label: 'Total Views', value: formatNumber(selectedExpert.totalViews), sub: `${formatNumber(selectedExpert.avgArticleViews)} avg/article` },
                    { label: 'Courses Created', value: selectedExpert.coursesCreated, sub: `${selectedExpert.courseEnrollments} enrollments` },
                    { label: 'Podcast Episodes', value: selectedExpert.podcastEpisodes, sub: `${formatNumber(selectedExpert.podcastListens)} listens` },
                  ].map(m => (
                    <div key={m.label} className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{m.value}</p>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{m.label}</p>
                      <p className="text-xs text-gray-500">{m.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quality Metrics */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-1"><Target className="w-4 h-4" /> Quality Metrics</h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { label: 'Quality Score', value: selectedExpert.qualityScore, max: 100, color: 'purple' },
                    { label: 'Editor Rating', value: selectedExpert.editorRating, max: 5, color: 'yellow' },
                    { label: 'SEO Score', value: selectedExpert.seoScore, max: 100, color: 'green' },
                    { label: 'Fact Check', value: `${selectedExpert.factCheckPass}%`, max: 100, color: 'blue' },
                    { label: 'AI Review', value: selectedExpert.aiReviewScore, max: 100, color: 'indigo' },
                    { label: 'Plagiarism Free', value: `${selectedExpert.plagiarismFree}%`, max: 100, color: 'emerald' },
                  ].map(m => (
                    <div key={m.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                      <p className={`text-xl font-bold text-${m.color}-600 dark:text-${m.color}-400`}>{m.value}</p>
                      <p className="text-xs text-gray-500">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Engagement Metrics */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-1"><Activity className="w-4 h-4" /> Engagement</h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {[
                    { label: 'Avg Read Time', value: `${selectedExpert.avgReadTime}m`, icon: <Clock className="w-3.5 h-3.5" /> },
                    { label: 'Comments', value: formatNumber(selectedExpert.totalComments), icon: <MessageSquare className="w-3.5 h-3.5" /> },
                    { label: 'Shares', value: formatNumber(selectedExpert.totalShares), icon: <Share2 className="w-3.5 h-3.5" /> },
                    { label: 'Likes', value: formatNumber(selectedExpert.totalLikes), icon: <ThumbsUp className="w-3.5 h-3.5" /> },
                    { label: 'Followers', value: formatNumber(selectedExpert.socialFollowers), icon: <Users className="w-3.5 h-3.5" /> },
                    { label: 'Community', value: selectedExpert.communityScore, icon: <Star className="w-3.5 h-3.5" /> },
                  ].map(m => (
                    <div key={m.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                      <div className="flex justify-center text-gray-400 mb-1">{m.icon}</div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{m.value}</p>
                      <p className="text-xs text-gray-500">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-1"><DollarSign className="w-4 h-4" /> Revenue</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Ad Revenue (55%)', value: formatCurrency(selectedExpert.adRevenueEarned), color: 'green' },
                    { label: 'Course Revenue (80%)', value: formatCurrency(selectedExpert.courseRevenueEarned), color: 'blue' },
                    { label: 'Tips Received', value: formatCurrency(selectedExpert.tipsReceived), color: 'pink' },
                    { label: 'Podcast Revenue', value: formatCurrency(selectedExpert.podcastRevenueEarned), color: 'purple' },
                  ].map(m => (
                    <div key={m.label} className={`bg-${m.color}-50 dark:bg-${m.color}-900/20 rounded-lg p-3 text-center`}>
                      <p className={`text-xl font-bold text-${m.color}-600 dark:text-${m.color}-400`}>{m.value}</p>
                      <p className="text-xs text-gray-500">{m.label}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-green-700 dark:text-green-300">{formatCurrency(selectedExpert.totalRevenueEarned)}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Earned</p>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/30 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-orange-700 dark:text-orange-300">{formatCurrency(selectedExpert.totalTokensPaid)}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Tokens Paid</p>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3 text-center">
                    <p className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{formatCurrency(selectedExpert.pendingPayout)}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Pending Payout</p>
                  </div>
                </div>
              </div>

              {/* Compliance & Warnings */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> Compliance & Awards</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: 'Missed Deadlines', value: selectedExpert.missedDeadlines, warn: selectedExpert.missedDeadlines > 2 },
                    { label: 'Warnings', value: selectedExpert.warningsReceived, warn: selectedExpert.warningsReceived > 1 },
                    { label: 'Awards Won', value: selectedExpert.awardsWon, warn: false },
                    { label: 'Active Streak', value: `${selectedExpert.consecutiveMonthsActive}mo`, warn: false },
                    { label: 'Award Eligible', value: selectedExpert.awardEligible ? 'Yes ✓' : 'No ✗', warn: false },
                  ].map(m => (
                    <div key={m.label} className={`rounded-lg p-3 text-center ${m.warn ? 'bg-red-50 dark:bg-red-900/20 ring-2 ring-red-200 dark:ring-red-800' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
                      <p className={`text-xl font-bold ${m.warn ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{m.value}</p>
                      <p className="text-xs text-gray-500">{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button className="px-4 py-2 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700">Promote Tier</button>
                <button className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700">Grant Award</button>
                <button className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700">Process Payout</button>
                <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">Send Message</button>
                <button className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300">View All Articles</button>
                <button className="px-4 py-2 text-sm font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300">Audit Log</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
