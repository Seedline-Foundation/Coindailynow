#!/usr/bin/env node

/**
 * Simple Modular Marquee System Demonstration
 * 
 * This script demonstrates the modular marquee system with correct schema usage.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function demonstrateMarqueeSystem() {
  console.log('\n🎬 =================================');
  console.log('📱 SIMPLE MARQUEE SYSTEM DEMO');
  console.log('=================================== 🎬\n');

  try {
    // 1. Create a Marquee Template
    console.log('1️⃣ Creating Marquee Template...\n');
    
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

    console.log(`✅ Created template: ${cryptoTemplate.name} (ID: ${cryptoTemplate.id})\n`);

    // 2. Create a Marquee
    console.log('2️⃣ Creating Marquee...\n');
    
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

    console.log(`✅ Created marquee: ${headerMarquee.name} (ID: ${headerMarquee.id})\n`);

    // 3. Create Marquee Style
    console.log('3️⃣ Creating Marquee Style...\n');
    
    const marqueeStyle = await prisma.marqueeStyle.create({
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

    console.log(`✅ Created marquee style (ID: ${marqueeStyle.id})\n`);

    // 4. Create Marquee Items
    console.log('4️⃣ Creating Marquee Items...\n');
    
    const items = [
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

    for (const itemData of items) {
      const item = await prisma.marqueeItem.create({
        data: {
          marqueeId: headerMarquee.id,
          ...itemData
        }
      });
      console.log(`✅ Created item: ${item.title} (${item.symbol}) - $${item.price}`);
    }

    // 5. Display System Summary
    console.log('\n5️⃣ System Summary...\n');
    
    const totalMarquees = await prisma.marquee.count();
    const activeMarquees = await prisma.marquee.count({ where: { isActive: true } });
    const totalItems = await prisma.marqueeItem.count();
    const totalTemplates = await prisma.marqueeTemplate.count();

    console.log('📊 MARQUEE SYSTEM STATISTICS');
    console.log('================================');
    console.log(`📋 Total Templates: ${totalTemplates}`);
    console.log(`🎯 Total Marquees: ${totalMarquees}`);
    console.log(`⚡ Active Marquees: ${activeMarquees}`);
    console.log(`📝 Total Items: ${totalItems}`);

    console.log('\n✅ Modular Marquee System Demo Complete!');
    console.log('🚀 Admin can now manage marquees without touching code!\n');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the demonstration
demonstrateMarqueeSystem().catch(console.error);

export { demonstrateMarqueeSystem };