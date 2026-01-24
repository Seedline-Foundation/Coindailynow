import { NextRequest, NextResponse } from 'next/server';

const checkAuth = (request: NextRequest) => {
  const authHeader = request.headers.get('authorization');
  return !!(authHeader && authHeader.startsWith('Bearer '));
};

export async function GET(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const parentId = searchParams.get('parentId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Mock categories data - replace with actual database call
    const categories = [
      {
        id: '1',
        name: 'Bitcoin',
        slug: 'bitcoin',
        description: 'All Bitcoin-related news and analysis',
        type: 'cryptocurrency',
        parentId: null,
        order: 1,
        isActive: true,
        featuredImage: 'https://example.com/bitcoin-icon.png',
        metaTitle: 'Bitcoin News & Analysis | CoinDaily',
        metaDescription: 'Latest Bitcoin news, price analysis, and market insights.',
        keywords: ['bitcoin', 'btc', 'cryptocurrency', 'digital currency'],
        articleCount: 1250,
        subscriberCount: 45000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-11-04T10:00:00Z',
        children: [
          {
            id: '11',
            name: 'Bitcoin Price Analysis',
            slug: 'bitcoin-price-analysis',
            description: 'Technical and fundamental Bitcoin price analysis',
            type: 'analysis',
            parentId: '1',
            order: 1,
            isActive: true,
            articleCount: 320,
            subscriberCount: 18000
          },
          {
            id: '12',
            name: 'Bitcoin Mining',
            slug: 'bitcoin-mining',
            description: 'Bitcoin mining news and updates',
            type: 'technology',
            parentId: '1',
            order: 2,
            isActive: true,
            articleCount: 180,
            subscriberCount: 12000
          }
        ]
      },
      {
        id: '2',
        name: 'Ethereum',
        slug: 'ethereum',
        description: 'Ethereum ecosystem news and developments',
        type: 'cryptocurrency',
        parentId: null,
        order: 2,
        isActive: true,
        featuredImage: 'https://example.com/ethereum-icon.png',
        metaTitle: 'Ethereum News & Updates | CoinDaily',
        metaDescription: 'Latest Ethereum news, DeFi updates, and ecosystem developments.',
        keywords: ['ethereum', 'eth', 'defi', 'smart contracts'],
        articleCount: 980,
        subscriberCount: 38000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-11-04T09:30:00Z',
        children: [
          {
            id: '21',
            name: 'DeFi',
            slug: 'defi',
            description: 'Decentralized Finance news and protocols',
            type: 'finance',
            parentId: '2',
            order: 1,
            isActive: true,
            articleCount: 450,
            subscriberCount: 25000
          },
          {
            id: '22',
            name: 'Layer 2',
            slug: 'layer-2',
            description: 'Ethereum Layer 2 scaling solutions',
            type: 'technology',
            parentId: '2',
            order: 2,
            isActive: true,
            articleCount: 280,
            subscriberCount: 15000
          }
        ]
      },
      {
        id: '3',
        name: 'Altcoins',
        slug: 'altcoins',
        description: 'Alternative cryptocurrency news and analysis',
        type: 'cryptocurrency',
        parentId: null,
        order: 3,
        isActive: true,
        featuredImage: 'https://example.com/altcoins-icon.png',
        metaTitle: 'Altcoin News & Analysis | CoinDaily',
        metaDescription: 'Latest altcoin news, emerging cryptocurrencies, and market analysis.',
        keywords: ['altcoins', 'cryptocurrency', 'emerging crypto', 'digital assets'],
        articleCount: 720,
        subscriberCount: 28000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-11-04T08:45:00Z',
        children: []
      },
      {
        id: '4',
        name: 'Africa Crypto',
        slug: 'africa-crypto',
        description: 'Cryptocurrency adoption and news from Africa',
        type: 'regional',
        parentId: null,
        order: 4,
        isActive: true,
        featuredImage: 'https://example.com/africa-icon.png',
        metaTitle: 'African Cryptocurrency News | CoinDaily',
        metaDescription: 'Latest cryptocurrency news and adoption stories from Africa.',
        keywords: ['africa crypto', 'african cryptocurrency', 'crypto adoption africa'],
        articleCount: 550,
        subscriberCount: 35000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-11-04T12:00:00Z',
        children: [
          {
            id: '41',
            name: 'Nigeria',
            slug: 'nigeria',
            description: 'Cryptocurrency news from Nigeria',
            type: 'country',
            parentId: '4',
            order: 1,
            isActive: true,
            articleCount: 220,
            subscriberCount: 18000
          },
          {
            id: '42',
            name: 'Kenya',
            slug: 'kenya',
            description: 'Cryptocurrency news from Kenya',
            type: 'country',
            parentId: '4',
            order: 2,
            isActive: true,
            articleCount: 180,
            subscriberCount: 12000
          }
        ]
      },
      {
        id: '5',
        name: 'Memecoins',
        slug: 'memecoins',
        description: 'Memecoin trends and viral cryptocurrency news',
        type: 'trending',
        parentId: null,
        order: 5,
        isActive: true,
        featuredImage: 'https://example.com/meme-icon.png',
        metaTitle: 'Memecoin News & Trends | CoinDaily',
        metaDescription: 'Latest memecoin trends, viral cryptocurrencies, and community-driven tokens.',
        keywords: ['memecoins', 'viral crypto', 'community tokens', 'trending crypto'],
        articleCount: 380,
        subscriberCount: 22000,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-11-04T11:30:00Z',
        children: []
      }
    ];

    // Filter categories based on type and parentId
    let filteredCategories = categories;
    
    if (type !== 'all') {
      filteredCategories = filteredCategories.filter(cat => cat.type === type);
    }
    
    if (parentId) {
      filteredCategories = filteredCategories.filter(cat => cat.parentId === parentId);
    } else if (parentId === null) {
      filteredCategories = filteredCategories.filter(cat => cat.parentId === null);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

    // Calculate statistics
    const stats = {
      total: categories.length,
      active: categories.filter(cat => cat.isActive).length,
      inactive: categories.filter(cat => !cat.isActive).length,
      topLevel: categories.filter(cat => cat.parentId === null).length,
      totalArticles: categories.reduce((sum, cat) => sum + cat.articleCount, 0),
      totalSubscribers: categories.reduce((sum, cat) => sum + cat.subscriberCount, 0)
    };

    return NextResponse.json({
      categories: paginatedCategories,
      stats,
      pagination: {
        page,
        limit,
        total: filteredCategories.length,
        pages: Math.ceil(filteredCategories.length / limit)
      }
    });
  } catch (error) {
    console.error('Categories fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categoryData = await request.json();

    // TODO: Implement actual category creation with database
    // Example: const newCategory = await prisma.category.create({ data: categoryData });

    const newCategory = {
      id: `cat_${Date.now()}`,
      ...categoryData,
      articleCount: 0,
      subscriberCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: []
    };

    console.log('Category creation:', newCategory);

    return NextResponse.json({ 
      success: true, 
      category: newCategory,
      message: 'Category created successfully' 
    });
  } catch (error) {
    console.error('Category creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...updateData } = await request.json();

    // TODO: Implement actual category update with database
    // Example: const updatedCategory = await prisma.category.update({ where: { id }, data: updateData });

    console.log('Category update:', { id, updateData });

    return NextResponse.json({ 
      success: true, 
      message: 'Category updated successfully' 
    });
  } catch (error) {
    console.error('Category update error:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!checkAuth(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID required' }, { status: 400 });
    }

    // TODO: Implement actual category deletion with database
    // Check if category has children or articles before deletion
    // Example: await prisma.category.delete({ where: { id: categoryId } });

    console.log('Category deletion:', categoryId);

    return NextResponse.json({ 
      success: true, 
      message: 'Category deleted successfully' 
    });
  } catch (error) {
    console.error('Category deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}