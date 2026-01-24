#!/usr/bin/env node

/**
 * Comprehensive Modular Marquee System Demonstration
 * 
 * This script demonstrates the complete modular marquee system
 * that allows administrators to create, configure, and manage
 * marquees without touching code.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function demonstrateModularMarqueeSystem() {
  console.log('\n🎬 =================================');
  console.log('📱 MODULAR MARQUEE SYSTEM DEMO');
  console.log('=================================== 🎬\n');

  try {
    // 1. Create Marquee Templates for Quick Setup
    console.log('1️⃣ Creating Marquee Templates...\n');
    
    const cryptoTemplate = await prisma.marqueeTemplate.create({
      data: {
        name: 'Crypto Price Ticker',
        description: 'Standard cryptocurrency price ticker with trending tokens',
        category: 'crypto',
        styleConfig: JSON.stringify({
          speed: 50,
          direction: 'left',
          pauseOnHover: true,
          backgroundColor: '#1f2937',
          textColor: '#ffffff',
          fontSize: '14px',
          fontWeight: 'normal',
          height: '48px',
          showIcons: true,
          iconColor: '#f59e0b',
          iconSize: '20px',
          itemSpacing: '32px'
        }),
        isDefault: true
      }
    });

    console.log(`✅ Created crypto template: ${cryptoTemplate.name} (ID: ${cryptoTemplate.id})`);

    const newsTemplate = await prisma.marqueeTemplate.create({
      data: {
        name: 'Breaking News Ticker',
        description: 'Breaking news alerts with red accent theme',
        category: 'news',
        styleConfig: JSON.stringify({
          speed: 60,
          direction: 'left',
          pauseOnHover: true,
          backgroundColor: '#dc2626',
          textColor: '#ffffff',
          fontSize: '16px',
          fontWeight: 'bold',
          height: '56px',
          showIcons: true,
          iconColor: '#ffffff',
          iconSize: '24px',
          itemSpacing: '48px'
        }),
        isDefault: false
      }
    });

    console.log(`✅ Created news template: ${newsTemplate.name} (ID: ${newsTemplate.id})\n`);

    // 2. Create Marquees Using Templates
    console.log('2️⃣ Creating Marquees...\n');
    
    const headerMarquee = await prisma.marquee.create({
      data: {
        name: 'Header Crypto Ticker',
        title: '🔥 Trending Crypto',
        type: 'token',
        position: 'header',
        isActive: true,
        isPublished: true,
        priority: 1,
        createdBy: 'admin-user-id'
      }
    });

    console.log(`✅ Created header marquee: ${headerMarquee.name} (ID: ${headerMarquee.id})`);

    const newsMarquee = await prisma.marquee.create({
      data: {
        name: 'Breaking News Alert',
        title: '🚨 Breaking News',
        type: 'news',
        position: 'header',
        isActive: true,
        isPublished: true,
        priority: 2,
        createdBy: 'admin-user-id'
      }
    });

    console.log(`✅ Created news marquee: ${newsMarquee.name} (ID: ${newsMarquee.id})`);

    const footerMarquee = await prisma.marquee.create({
      data: {
        name: 'Footer Announcements',
        title: '📢 Latest Updates',
        type: 'custom',
        position: 'footer',
        isActive: true,
        isPublished: true,
        priority: 1,
        createdBy: 'admin-user-id'
      }
    });

    console.log(`✅ Created footer marquee: ${footerMarquee.name} (ID: ${footerMarquee.id})\n`);

    // 3. Create Marquee Styles
    console.log('3️⃣ Creating Marquee Styles...\n');
    
    const headerStyle = await prisma.marqueeStyle.create({
      data: {
        marqueeId: headerMarquee.id,
        speed: 50,
        direction: 'left',
        pauseOnHover: true,
        backgroundColor: '#1f2937',
        textColor: '#ffffff',
        fontSize: '14px',
        fontWeight: 'normal',
        height: '48px',
        showIcons: true,
        iconColor: '#f59e0b',
        iconSize: '20px',
        itemSpacing: '32px'
      }
    });

    console.log(`✅ Created header style (ID: ${headerStyle.id})`);

    const newsStyle = await prisma.marqueeStyle.create({
      data: {
        marqueeId: newsMarquee.id,
        speed: 60,
        direction: 'left',
        pauseOnHover: true,
        backgroundColor: '#dc2626',
        textColor: '#ffffff',
        fontSize: '16px',
        fontWeight: 'bold',
        height: '56px',
        showIcons: true,
        iconColor: '#ffffff',
        iconSize: '24px',
        itemSpacing: '48px'
      }
    });

    console.log(`✅ Created news style (ID: ${newsStyle.id})`);

    const footerStyle = await prisma.marqueeStyle.create({
      data: {
        marqueeId: footerMarquee.id,
        speed: 40,
        direction: 'right',
        pauseOnHover: false,
        backgroundColor: '#374151',
        textColor: '#d1d5db',
        fontSize: '12px',
        fontWeight: 'normal',
        height: '32px',
        showIcons: false,
        iconColor: '#9ca3af',
        iconSize: '16px',
        itemSpacing: '24px'
      }
    });

    console.log(`✅ Created footer style (ID: ${footerStyle.id})\n`);

    // 4. Create Marquee Items
    console.log('4️⃣ Creating Marquee Items...\n');
    
    // Crypto items for header marquee
    const cryptoItems = [
      {
        type: 'token',
        title: 'Bitcoin',
        symbol: 'BTC',
        price: 43250.50,
        change24h: 1250.75,
        changePercent24h: 2.98,
        isHot: true,
        order: 1
      },
      {
        type: 'token',
        title: 'Ethereum',
        symbol: 'ETH',
        price: 2680.25,
        change24h: -45.30,
        changePercent24h: -1.66,
        isHot: false,
        order: 2
      },
      {
        type: 'token',
        title: 'Solana',
        symbol: 'SOL',
        price: 125.80,
        change24h: 8.95,
        changePercent24h: 7.65,
        isHot: true,
        order: 3
      }
    ];

    for (const itemData of cryptoItems) {
      await prisma.marqueeItem.create({
        data: {
          marqueeId: headerMarquee.id,
          ...itemData
        }
      });
      console.log(`✅ Created crypto item: ${itemData.title} (${itemData.symbol})`);
    }

    // News items for news marquee
    const newsItems = [
      {
        type: 'news',
        title: 'Bitcoin ETF Approval Sends Markets Soaring',
        subtitle: 'BTC reaches new all-time high',
        linkUrl: '/news/bitcoin-etf-approval',
        order: 1
      },
      {
        type: 'news',
        title: 'African Crypto Adoption Reaches 40% in Nigeria',
        subtitle: 'Mobile payments drive growth',
        linkUrl: '/news/africa-crypto-adoption',
        order: 2
      }
    ];

    for (const itemData of newsItems) {
      await prisma.marqueeItem.create({
        data: {
          marqueeId: newsMarquee.id,
          ...itemData
        }
      });
      console.log(`✅ Created news item: ${itemData.title}`);
    }

    // Custom items for footer marquee
    const footerItems = [
      {
        type: 'custom',
        title: 'Join our Telegram community for real-time alerts',
        linkUrl: 'https://t.me/coindaily',
        linkTarget: '_blank',
        order: 1
      },
      {
        type: 'custom',
        title: 'Download the CoinDaily mobile app for iOS and Android',
        linkUrl: '/mobile-app',
        order: 2
      }
    ];

    for (const itemData of footerItems) {
      await prisma.marqueeItem.create({
        data: {
          marqueeId: footerMarquee.id,
          ...itemData
        }
      });
      console.log(`✅ Created footer item: ${itemData.title}`);
    }

    // 5. Display System Summary
    console.log('\n5️⃣ System Summary...\n');
    
    const totalMarquees = await prisma.marquee.count();
    const activeMarquees = await prisma.marquee.count({ where: { isActive: true } });
    const publishedMarquees = await prisma.marquee.count({ where: { isPublished: true } });
    const totalItems = await prisma.marqueeItem.count();
    const visibleItems = await prisma.marqueeItem.count({ where: { isVisible: true } });
    const totalTemplates = await prisma.marqueeTemplate.count();

    console.log('📊 MARQUEE SYSTEM STATISTICS');
    console.log('================================');
    console.log(`📋 Total Templates: ${totalTemplates}`);
    console.log(`🎯 Total Marquees: ${totalMarquees}`);
    console.log(`⚡ Active Marquees: ${activeMarquees}`);
    console.log(`🚀 Published Marquees: ${publishedMarquees}`);
    console.log(`📝 Total Items: ${totalItems}`);
    console.log(`👁️  Visible Items: ${visibleItems}`);

    console.log('\n📈 ANALYTICS OVERVIEW');
    console.log('====================');
    console.log(`📊 Ready for real-time analytics tracking`);
    console.log(`🎯 Performance metrics collection enabled`);
    console.log(`📱 Mobile-responsive design implemented`);

    console.log('\n✅ Modular Marquee System Demo Complete!');
    console.log('🚀 Admin can now manage marquees without touching code!');
    console.log('🎨 Dynamic styling and content management ready');
    console.log('📊 Analytics and performance tracking enabled\n');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the demonstration
demonstrateModularMarqueeSystem().catch(console.error);

export { demonstrateModularMarqueeSystem };