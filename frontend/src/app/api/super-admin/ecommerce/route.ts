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

      // Mock e-commerce data (replace with real data from your database)
      const ecommerceData = {
        metrics: {
          totalRevenue: 125890,
          revenueChange: 18.5,
          totalOrders: 1456,
          ordersChange: 12.3,
          avgOrderValue: 86.47,
          avgOrderChange: 5.4,
          conversionRate: 3.2,
          conversionChange: 0.8,
          totalProducts: 156,
          activeProducts: 142,
          outOfStock: 14,
          pendingOrders: 23,
          processingOrders: 45,
          shippedOrders: 67,
          topProducts: [
            { name: 'Bitcoin Trading Course - Premium', sales: 234, revenue: 23400 },
            { name: 'Crypto Wallet Hardware - Ledger', sales: 189, revenue: 18900 },
            { name: 'DeFi Masterclass Bundle', sales: 156, revenue: 15600 },
            { name: 'NFT Creation Toolkit', sales: 134, revenue: 13400 },
            { name: 'Ethereum Staking Guide', sales: 98, revenue: 9800 }
          ],
          paymentGateways: [
            { name: 'Stripe', transactions: 789, revenue: 68234, successRate: 98.5 },
            { name: 'M-Pesa', transactions: 456, revenue: 39456, successRate: 97.2 },
            { name: 'PayPal', transactions: 211, revenue: 18200, successRate: 96.8 }
          ]
        },
        products: [
          {
            id: '1',
            name: 'Bitcoin Trading Course - Premium',
            description: 'Comprehensive Bitcoin trading course covering technical analysis, risk management, and advanced strategies for African markets.',
            price: 99.99,
            category: 'Courses',
            stock: 999,
            sales: 234,
            status: 'active' as const,
            createdAt: '2024-09-15'
          },
          {
            id: '2',
            name: 'Crypto Wallet Hardware - Ledger Nano X',
            description: 'Secure hardware wallet for storing Bitcoin, Ethereum, and 1000+ cryptocurrencies. Official distributor for Africa.',
            price: 149.99,
            category: 'Hardware',
            stock: 45,
            sales: 189,
            status: 'active' as const,
            createdAt: '2024-08-20'
          },
          {
            id: '3',
            name: 'DeFi Masterclass Bundle',
            description: 'Complete DeFi education package including yield farming, liquidity provision, and smart contract interaction.',
            price: 129.99,
            category: 'Courses',
            stock: 999,
            sales: 156,
            status: 'active' as const,
            createdAt: '2024-09-01'
          },
          {
            id: '4',
            name: 'NFT Creation Toolkit',
            description: 'Everything you need to create, mint, and sell NFTs on African marketplaces. Includes tools and tutorials.',
            price: 79.99,
            category: 'Digital Products',
            stock: 999,
            sales: 134,
            status: 'active' as const,
            createdAt: '2024-09-10'
          },
          {
            id: '5',
            name: 'Ethereum Staking Guide',
            description: 'Step-by-step guide to staking Ethereum with focus on African staking pools and tax implications.',
            price: 49.99,
            category: 'Guides',
            stock: 999,
            sales: 98,
            status: 'active' as const,
            createdAt: '2024-09-25'
          },
          {
            id: '6',
            name: 'Crypto Tax Software - Annual License',
            description: 'Automated crypto tax calculation software for South African, Nigerian, and Kenyan tax laws.',
            price: 199.99,
            category: 'Software',
            stock: 0,
            sales: 67,
            status: 'out-of-stock' as const,
            createdAt: '2024-08-01'
          },
          {
            id: '7',
            name: 'M-Pesa to Crypto Integration Guide',
            description: 'Comprehensive guide on integrating M-Pesa payments with cryptocurrency platforms.',
            price: 39.99,
            category: 'Guides',
            stock: 999,
            sales: 45,
            status: 'active' as const,
            createdAt: '2024-10-01'
          },
          {
            id: '8',
            name: 'African Crypto Startup Kit',
            description: 'Business plan templates, legal documents, and marketing materials for launching crypto businesses in Africa.',
            price: 299.99,
            category: 'Business',
            stock: 50,
            sales: 23,
            status: 'draft' as const,
            createdAt: '2024-10-05'
          },
          {
            id: '9',
            name: 'Binance Africa Trading Bot',
            description: 'Automated trading bot optimized for Binance Africa with backtested strategies.',
            price: 499.99,
            category: 'Software',
            stock: 100,
            sales: 12,
            status: 'active' as const,
            createdAt: '2024-09-20'
          }
        ],
        orders: [
          {
            id: '1',
            orderNumber: 'ORD-2024-001456',
            customer: {
              name: 'Kwame Osei',
              email: 'kwame.osei@example.com'
            },
            products: [
              { name: 'Bitcoin Trading Course - Premium', quantity: 1, price: 99.99 },
              { name: 'Crypto Wallet Hardware - Ledger', quantity: 1, price: 149.99 }
            ],
            total: 249.98,
            status: 'delivered' as const,
            paymentMethod: 'mpesa' as const,
            paymentStatus: 'paid' as const,
            createdAt: '2024-10-01 14:30',
            shippedAt: '2024-10-02 09:15',
            deliveredAt: '2024-10-04 11:20'
          },
          {
            id: '2',
            orderNumber: 'ORD-2024-001457',
            customer: {
              name: 'Amara Nwosu',
              email: 'amara.nwosu@example.com'
            },
            products: [
              { name: 'DeFi Masterclass Bundle', quantity: 1, price: 129.99 }
            ],
            total: 129.99,
            status: 'shipped' as const,
            paymentMethod: 'stripe' as const,
            paymentStatus: 'paid' as const,
            createdAt: '2024-10-03 10:15',
            shippedAt: '2024-10-04 08:30'
          },
          {
            id: '3',
            orderNumber: 'ORD-2024-001458',
            customer: {
              name: 'Thandiwe Mbatha',
              email: 'thandiwe.mbatha@example.com'
            },
            products: [
              { name: 'NFT Creation Toolkit', quantity: 1, price: 79.99 },
              { name: 'Ethereum Staking Guide', quantity: 1, price: 49.99 }
            ],
            total: 129.98,
            status: 'processing' as const,
            paymentMethod: 'paypal' as const,
            paymentStatus: 'paid' as const,
            createdAt: '2024-10-04 15:45'
          },
          {
            id: '4',
            orderNumber: 'ORD-2024-001459',
            customer: {
              name: 'Chinedu Okeke',
              email: 'chinedu.okeke@example.com'
            },
            products: [
              { name: 'Binance Africa Trading Bot', quantity: 1, price: 499.99 }
            ],
            total: 499.99,
            status: 'pending' as const,
            paymentMethod: 'mpesa' as const,
            paymentStatus: 'pending' as const,
            createdAt: '2024-10-05 09:20'
          },
          {
            id: '5',
            orderNumber: 'ORD-2024-001460',
            customer: {
              name: 'Fatima Hassan',
              email: 'fatima.hassan@example.com'
            },
            products: [
              { name: 'M-Pesa to Crypto Integration Guide', quantity: 2, price: 39.99 },
              { name: 'Ethereum Staking Guide', quantity: 1, price: 49.99 }
            ],
            total: 129.97,
            status: 'cancelled' as const,
            paymentMethod: 'stripe' as const,
            paymentStatus: 'refunded' as const,
            createdAt: '2024-10-02 11:30'
          },
          {
            id: '6',
            orderNumber: 'ORD-2024-001461',
            customer: {
              name: 'Jabari Mwangi',
              email: 'jabari.mwangi@example.com'
            },
            products: [
              { name: 'Bitcoin Trading Course - Premium', quantity: 1, price: 99.99 },
              { name: 'DeFi Masterclass Bundle', quantity: 1, price: 129.99 }
            ],
            total: 229.98,
            status: 'delivered' as const,
            paymentMethod: 'mpesa' as const,
            paymentStatus: 'paid' as const,
            createdAt: '2024-09-28 16:00',
            shippedAt: '2024-09-29 10:00',
            deliveredAt: '2024-10-01 14:30'
          },
          {
            id: '7',
            orderNumber: 'ORD-2024-001462',
            customer: {
              name: 'Zara Diop',
              email: 'zara.diop@example.com'
            },
            products: [
              { name: 'Crypto Wallet Hardware - Ledger', quantity: 2, price: 149.99 }
            ],
            total: 299.98,
            status: 'processing' as const,
            paymentMethod: 'stripe' as const,
            paymentStatus: 'paid' as const,
            createdAt: '2024-10-05 13:45'
          }
        ]
      };

      // Create audit log
      // await prisma.auditLog.create({
      //   data: {
      //     userId: decoded.userId,
      //     action: 'VIEW_ECOMMERCE_DATA',
      //     details: `Time range: ${timeRange}`,
      //     ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      //     userAgent: request.headers.get('user-agent') || 'unknown'
      //   }
      // });

      return NextResponse.json(ecommerceData);
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('E-commerce data error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
