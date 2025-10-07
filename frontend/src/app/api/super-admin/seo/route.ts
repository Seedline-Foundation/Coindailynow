import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Check if user has required permissions
      if (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'MARKETING_ADMIN') {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
      }

      // Get time range from query params
      const searchParams = request.nextUrl.searchParams;
      const timeRange = searchParams.get('timeRange') || '30d';

      // Mock SEO data (replace with real data from your SEO tools: Google Search Console, Ahrefs, etc.)
      const seoData = {
        metrics: {
          organicTraffic: 45678,
          organicChange: 12.5,
          avgPosition: 8.3,
          positionChange: -2.1, // Negative means improved
          totalKeywords: 1247,
          keywordsChange: 34,
          clickThroughRate: 3.42,
          ctrChange: 0.3,
          topPages: 156,
          indexedPages: 3456,
          crawlErrors: 12,
          backlinks: 8934
        },
        keywords: [
          {
            keyword: 'bitcoin price africa',
            position: 3,
            previousPosition: 5,
            searchVolume: 12500,
            difficulty: 65,
            clicks: 456,
            impressions: 15678,
            ctr: 2.91,
            url: '/articles/bitcoin-price-analysis'
          },
          {
            keyword: 'crypto news africa',
            position: 7,
            previousPosition: 12,
            searchVolume: 8900,
            difficulty: 72,
            clicks: 234,
            impressions: 9876,
            ctr: 2.37,
            url: '/news'
          },
          {
            keyword: 'buy bitcoin kenya',
            position: 4,
            previousPosition: 4,
            searchVolume: 6700,
            difficulty: 58,
            clicks: 345,
            impressions: 11234,
            ctr: 3.07,
            url: '/guides/buy-bitcoin-kenya'
          },
          {
            keyword: 'ethereum staking guide',
            position: 2,
            previousPosition: 3,
            searchVolume: 5400,
            difficulty: 54,
            clicks: 567,
            impressions: 13456,
            ctr: 4.21,
            url: '/guides/ethereum-staking'
          },
          {
            keyword: 'mpesa crypto exchange',
            position: 5,
            previousPosition: 8,
            searchVolume: 4200,
            difficulty: 48,
            clicks: 289,
            impressions: 8765,
            ctr: 3.3,
            url: '/exchanges/mpesa-crypto'
          },
          {
            keyword: 'nigeria cryptocurrency regulation',
            position: 6,
            previousPosition: 6,
            searchVolume: 3800,
            difficulty: 61,
            clicks: 201,
            impressions: 7654,
            ctr: 2.63,
            url: '/articles/nigeria-crypto-regulation'
          },
          {
            keyword: 'best crypto wallet africa',
            position: 9,
            previousPosition: 15,
            searchVolume: 3200,
            difficulty: 55,
            clicks: 178,
            impressions: 6543,
            ctr: 2.72,
            url: '/reviews/best-crypto-wallets'
          },
          {
            keyword: 'dogecoin price prediction',
            position: 11,
            previousPosition: 11,
            searchVolume: 2900,
            difficulty: 68,
            clicks: 145,
            impressions: 5432,
            ctr: 2.67,
            url: '/articles/dogecoin-prediction'
          },
          {
            keyword: 'south africa crypto tax',
            position: 8,
            previousPosition: 10,
            searchVolume: 2600,
            difficulty: 52,
            clicks: 167,
            impressions: 5234,
            ctr: 3.19,
            url: '/guides/sa-crypto-tax'
          },
          {
            keyword: 'shiba inu news',
            position: 10,
            previousPosition: 14,
            searchVolume: 2400,
            difficulty: 70,
            clicks: 134,
            impressions: 4876,
            ctr: 2.75,
            url: '/news/shiba-inu'
          },
          {
            keyword: 'binance africa',
            position: 12,
            previousPosition: 9,
            searchVolume: 2200,
            difficulty: 64,
            clicks: 112,
            impressions: 4321,
            ctr: 2.59,
            url: '/exchanges/binance-africa'
          },
          {
            keyword: 'cryptocurrency mining africa',
            position: 13,
            previousPosition: 13,
            searchVolume: 1800,
            difficulty: 57,
            clicks: 98,
            impressions: 3987,
            ctr: 2.46,
            url: '/guides/crypto-mining-africa'
          },
          {
            keyword: 'cardano staking rewards',
            position: 14,
            previousPosition: 18,
            searchVolume: 1600,
            difficulty: 51,
            clicks: 87,
            impressions: 3456,
            ctr: 2.52,
            url: '/guides/cardano-staking'
          },
          {
            keyword: 'solana nft marketplace',
            position: 15,
            previousPosition: 16,
            searchVolume: 1400,
            difficulty: 62,
            clicks: 74,
            impressions: 3012,
            ctr: 2.46,
            url: '/articles/solana-nft'
          },
          {
            keyword: 'defi yield farming guide',
            position: 16,
            previousPosition: 19,
            searchVolume: 1200,
            difficulty: 59,
            clicks: 65,
            impressions: 2789,
            ctr: 2.33,
            url: '/guides/defi-yield-farming'
          }
        ],
        pages: [
          {
            url: '/articles/bitcoin-price-analysis',
            title: 'Bitcoin Price Analysis: African Market Trends 2025',
            metaDescription: 'Comprehensive Bitcoin price analysis focusing on African cryptocurrency markets, M-Pesa integration, and regional trends.',
            status: 'optimized' as const,
            issues: [],
            score: 94,
            traffic: 15678,
            keywords: 23,
            lastUpdated: '2 days ago'
          },
          {
            url: '/guides/buy-bitcoin-kenya',
            title: 'How to Buy Bitcoin in Kenya: Complete Guide',
            metaDescription: 'Step-by-step guide to buying Bitcoin in Kenya using M-Pesa, mobile money, and local exchanges.',
            status: 'optimized' as const,
            issues: [],
            score: 91,
            traffic: 12345,
            keywords: 18,
            lastUpdated: '1 week ago'
          },
          {
            url: '/news/crypto-regulation-update',
            title: 'Crypto Regulation Update',
            metaDescription: 'Latest cryptocurrency regulation news from Africa.',
            status: 'needs-improvement' as const,
            issues: ['Meta description too short', 'Missing alt text on images'],
            score: 67,
            traffic: 8765,
            keywords: 12,
            lastUpdated: '3 days ago'
          },
          {
            url: '/articles/ethereum-staking',
            title: 'Ethereum Staking Guide: Earn Passive Income',
            metaDescription: 'Learn how to stake Ethereum and earn passive income. Complete guide covering validators, rewards, and African staking pools.',
            status: 'optimized' as const,
            issues: [],
            score: 89,
            traffic: 10234,
            keywords: 15,
            lastUpdated: '5 days ago'
          },
          {
            url: '/exchanges/mpesa-crypto',
            title: 'Best M-Pesa Crypto Exchanges in Kenya',
            metaDescription: 'Top cryptocurrency exchanges supporting M-Pesa payments in Kenya. Compare fees, security, and supported coins.',
            status: 'optimized' as const,
            issues: [],
            score: 88,
            traffic: 9876,
            keywords: 14,
            lastUpdated: '1 week ago'
          },
          {
            url: '/guides/crypto-security',
            title: 'Crypto Security Best Practices',
            metaDescription: 'Security guide',
            status: 'critical' as const,
            issues: ['Meta description too short', 'Missing H1 tag', 'Broken internal links', 'Page load time >3s'],
            score: 42,
            traffic: 3456,
            keywords: 8,
            lastUpdated: '2 weeks ago'
          },
          {
            url: '/articles/africa-crypto-adoption',
            title: 'Cryptocurrency Adoption in Africa: 2025 Report',
            metaDescription: 'Detailed analysis of cryptocurrency adoption rates across African countries, including Nigeria, Kenya, South Africa, and Ghana.',
            status: 'optimized' as const,
            issues: [],
            score: 92,
            traffic: 11234,
            keywords: 19,
            lastUpdated: '4 days ago'
          },
          {
            url: '/news/memecoin-trends',
            title: 'Memecoin Market Analysis',
            metaDescription: 'Latest memecoin trends and price predictions',
            status: 'needs-improvement' as const,
            issues: ['Add more internal links', 'Optimize images'],
            score: 73,
            traffic: 7654,
            keywords: 11,
            lastUpdated: '1 day ago'
          }
        ],
        sitemaps: [
          {
            url: 'https://coindaily.africa/sitemap.xml',
            status: 'active' as const,
            lastSubmitted: '2024-10-03',
            urlsIndexed: 2834,
            totalUrls: 3456
          },
          {
            url: 'https://coindaily.africa/sitemap-articles.xml',
            status: 'active' as const,
            lastSubmitted: '2024-10-03',
            urlsIndexed: 1245,
            totalUrls: 1456
          },
          {
            url: 'https://coindaily.africa/sitemap-news.xml',
            status: 'active' as const,
            lastSubmitted: '2024-10-05',
            urlsIndexed: 789,
            totalUrls: 890
          },
          {
            url: 'https://coindaily.africa/sitemap-guides.xml',
            status: 'pending' as const,
            lastSubmitted: '2024-10-05',
            urlsIndexed: 234,
            totalUrls: 345
          }
        ]
      };

      // Create audit log
      // await prisma.auditLog.create({
      //   data: {
      //     userId: decoded.userId,
      //     action: 'VIEW_SEO_DATA',
      //     details: `Time range: ${timeRange}`,
      //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      //     userAgent: request.headers.get('user-agent') || 'unknown'
      //   }
      // });

      return NextResponse.json(seoData);
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('SEO data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
