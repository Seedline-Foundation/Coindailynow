/**
 * Super Admin Dashboard Demo Script
 * Demonstrates the complete super admin functionality
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdminDemo() {
  console.log('🚀 Setting up Super Admin Dashboard Demo...\n');

  try {
    // 1. Create Super Admin User
    console.log('1. Creating Super Admin user...');
    const hashedPassword = await bcrypt.hash('SuperAdmin2024!', 12);
    
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@coindaily.africa' },
      update: {},
      create: {
        id: 'super-admin-001',
        username: 'superadmin',
        email: 'superadmin@coindaily.africa',
        passwordHash: hashedPassword,
        firstName: 'Super',
        lastName: 'Administrator',
        status: 'ACTIVE',
        emailVerified: true,
        twoFactorEnabled: true,
        lastLoginAt: new Date(),
        updatedAt: new Date(),
        UserProfile: {
          create: {
            bio: 'Platform Super Administrator with extensive blockchain and cryptocurrency expertise',
            location: 'Lagos, Nigeria',
            website: 'https://coindaily.africa',
            socialMedia: JSON.stringify({
              twitter: '@coindaily_africa',
              linkedin: 'coindaily-africa',
              telegram: '@coindaily_admin'
            }),
            tradingExperience: 'EXPERT',
            investmentPortfolioSize: 'LARGE',
            preferredExchanges: JSON.stringify(['Binance', 'Luno', 'Quidax']),
            notificationPreferences: JSON.stringify({ email: true, push: true, sms: false }),
            privacySettings: JSON.stringify({ profile: 'private', trading: 'private' }),
            contentPreferences: JSON.stringify({ categories: ['news', 'analysis', 'market'] }),
            updatedAt: new Date()
          }
        }
      }
    });

    console.log('✅ Super Admin created:', superAdmin.email);

    // 2. Create Sample Admin Users
    console.log('\n2. Creating sample admin users...');
    const adminRoles = [
      {
        id: 'admin-001',
        username: 'contentadmin',
        email: 'content@coindaily.africa',
        firstName: 'Content',
        lastName: 'Administrator',
        department: 'Content'
      },
      {
        id: 'admin-002',
        username: 'marketingadmin',
        email: 'marketing@coindaily.africa',
        firstName: 'Marketing',
        lastName: 'Administrator',
        department: 'Marketing'
      },
      {
        id: 'admin-003',
        username: 'techadmin',
        email: 'tech@coindaily.africa',
        firstName: 'Technical',
        lastName: 'Administrator',
        department: 'Technology'
      }
    ];

    for (const adminData of adminRoles) {
      const adminPassword = await bcrypt.hash('Admin2024!', 12);
      await prisma.user.upsert({
        where: { email: adminData.email },
        update: {},
        create: {
          id: adminData.id,
          username: adminData.username,
          email: adminData.email,
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          passwordHash: adminPassword,
          status: 'ACTIVE',
          emailVerified: true,
          twoFactorEnabled: false,
          updatedAt: new Date(),
          UserProfile: {
            create: {
              bio: `${adminData.department} team administrator`,
              location: 'Nigeria',
              website: `https://coindaily.africa/team/${adminData.username}`,
              socialMedia: JSON.stringify({
                twitter: `@${adminData.username}`,
                linkedin: adminData.username
              }),
              tradingExperience: 'INTERMEDIATE',
              investmentPortfolioSize: 'MEDIUM',
              preferredExchanges: JSON.stringify(['Binance', 'Luno']),
              notificationPreferences: JSON.stringify({ email: true, push: true, sms: false }),
              privacySettings: JSON.stringify({ profile: 'public', trading: 'private' }),
              contentPreferences: JSON.stringify({ categories: ['news', 'analysis'] }),
              updatedAt: new Date()
            }
          }
        }
      });
      console.log(`✅ Admin created: ${adminData.email}`);
    }

    // 3. Create Sample Analytics Events (as system monitoring proxy)
    console.log('\n3. Creating sample analytics events...');
    const analyticsEvents = [
      {
        id: 'event-001',
        sessionId: 'session-001',
        eventType: 'SYSTEM_ALERT_CRITICAL',
        resourceType: 'infrastructure',
        properties: JSON.stringify({ message: 'High memory usage detected on server cluster' }),
        metadata: JSON.stringify({ severity: 'CRITICAL', acknowledged: false })
      },
      {
        id: 'event-002',
        sessionId: 'session-002',
        eventType: 'SYSTEM_ALERT_WARNING',
        resourceType: 'ai_system',
        properties: JSON.stringify({ message: 'AI processing queue backlog increasing' }),
        metadata: JSON.stringify({ severity: 'WARNING', acknowledged: false })
      },
      {
        id: 'event-003',
        sessionId: 'session-003',
        eventType: 'SYSTEM_ALERT_INFO',
        resourceType: 'database',
        properties: JSON.stringify({ message: 'Backup completed successfully' }),
        metadata: JSON.stringify({ severity: 'INFO', acknowledged: true })
      }
    ];

    for (const event of analyticsEvents) {
      await prisma.analyticsEvent.upsert({
        where: { id: event.id },
        update: {},
        create: {
          ...event,
          userId: superAdmin.id
        }
      });
    }
    console.log('✅ Analytics events created (system monitoring proxy)');

    // 4. Create Sample Articles
    console.log('\n4. Creating sample articles...');
    // 4. Create Sample Articles
    console.log('\n4. Creating sample articles...');
    
    // First create a category
    const category = await prisma.category.upsert({
      where: { slug: 'market-news' },
      update: {},
      create: {
        id: 'cat-market-news',
        name: 'Market News',
        slug: 'market-news',
        description: 'Latest cryptocurrency market news and analysis',
        isActive: true,
        updatedAt: new Date()
      }
    });

    const sampleArticles = [
      {
        id: 'article-001',
        title: 'Bitcoin Reaches New All-Time High',
        slug: 'bitcoin-reaches-new-all-time-high',
        excerpt: 'Bitcoin surges past $100,000 amid institutional adoption',
        content: 'Full article content here...',
        status: 'PUBLISHED',
        readingTimeMinutes: 5
      },
      {
        id: 'article-002',
        title: 'Africa Leads in Cryptocurrency Adoption',
        slug: 'africa-leads-cryptocurrency-adoption',
        excerpt: 'African countries show highest crypto adoption rates globally',
        content: 'Full article content here...',
        status: 'PUBLISHED',
        readingTimeMinutes: 7
      },
      {
        id: 'article-003',
        title: 'DeFi Revolution in Nigeria',
        slug: 'defi-revolution-nigeria',
        excerpt: 'Decentralized finance gains traction in Nigerian markets',
        content: 'Full article content here...',
        status: 'DRAFT',
        readingTimeMinutes: 6
      }
    ];

    for (const article of sampleArticles) {
      await prisma.article.upsert({
        where: { slug: article.slug },
        update: {},
        create: {
          ...article,
          authorId: superAdmin.id,
          categoryId: category.id,
          publishedAt: article.status === 'PUBLISHED' ? new Date() : null,
          tags: JSON.stringify(['bitcoin', 'cryptocurrency', 'africa']),
          updatedAt: new Date()
        }
      });
    }
    console.log('✅ Sample articles created');

    // 5. Create Sample User Engagement (as subscription proxy)
    console.log('\n5. Creating sample user engagement...');
    const engagements = [
      {
        id: 'eng-001',
        userId: superAdmin.id,
        articleId: 'article-001',
        actionType: 'READ',
        durationSeconds: 3600,
        scrollPercentage: 95.5,
        deviceType: 'DESKTOP',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        ipAddress: '192.168.1.100',
        referrerUrl: 'https://google.com'
      },
      {
        id: 'eng-002',
        userId: 'admin-001',
        articleId: 'article-002',
        actionType: 'SHARE',
        durationSeconds: 120,
        scrollPercentage: 78.2,
        deviceType: 'MOBILE',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        ipAddress: '192.168.1.101',
        referrerUrl: 'https://twitter.com'
      }
    ];

    for (const engagement of engagements) {
      await prisma.userEngagement.upsert({
        where: { id: engagement.id },
        update: {},
        create: engagement
      });
    }
    console.log('✅ User engagement created (subscription proxy)');

    // 6. Create Sample AI Tasks
    console.log('\n6. Creating sample AI tasks...');
    
    // First create an AI Agent
    const aiAgent = await prisma.aIAgent.upsert({
      where: { id: 'agent-001' },
      update: {},
      create: {
        id: 'agent-001',
        name: 'Content Generator',
        type: 'CONTENT_GENERATION',
        modelProvider: 'openai',
        modelName: 'gpt-4',
        isActive: true,
        updatedAt: new Date()
      }
    });

    const aiTasks = [
      {
        id: 'task-001',
        agentId: aiAgent.id,
        taskType: 'CONTENT_GENERATION',
        inputData: JSON.stringify({ prompt: 'Generate article about Bitcoin price analysis' }),
        outputData: JSON.stringify({ result: 'Generated article content...' }),
        status: 'COMPLETED',
        estimatedCost: 0.15,
        actualCost: 0.12,
        processingTimeMs: 2500,
        qualityScore: 0.95,
        completedAt: new Date()
      },
      {
        id: 'task-002',
        agentId: aiAgent.id,
        taskType: 'IMAGE_GENERATION',
        inputData: JSON.stringify({ prompt: 'Create image for cryptocurrency news article' }),
        status: 'PROCESSING',
        estimatedCost: 0.10,
        processingTimeMs: 0
      },
      {
        id: 'task-003',
        agentId: aiAgent.id,
        taskType: 'CONTENT_MODERATION',
        inputData: JSON.stringify({ prompt: 'Moderate user comment for inappropriate content' }),
        outputData: JSON.stringify({ result: 'Content approved' }),
        status: 'COMPLETED',
        estimatedCost: 0.05,
        actualCost: 0.03,
        processingTimeMs: 500,
        qualityScore: 0.98,
        completedAt: new Date()
      }
    ];

    for (const task of aiTasks) {
      await prisma.aITask.upsert({
        where: { id: task.id },
        update: {},
        create: {
          ...task,
          createdAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // Random time in last 24h
        }
      });
    }
    console.log('✅ AI tasks created');

    // 7. Display Demo Credentials
    console.log('\n🎉 Super Admin Dashboard Demo Setup Complete!\n');
    console.log('='.repeat(60));
    console.log('DEMO CREDENTIALS:');
    console.log('='.repeat(60));
    console.log('Super Admin Login:');
    console.log('  URL: /super-admin/login');
    console.log('  Username: superadmin');
    console.log('  Email: superadmin@coindaily.africa');
    console.log('  Password: SuperAdmin2024!');
    console.log('  2FA Code: Any 6-digit number (demo mode)');
    console.log('');
    console.log('Regular Admin Logins:');
    console.log('  Content Admin: content@coindaily.africa / Admin2024!');
    console.log('  Marketing Admin: marketing@coindaily.africa / Admin2024!');
    console.log('  Tech Admin: tech@coindaily.africa / Admin2024!');
    console.log('');
    console.log('Features Demonstrated:');
    console.log('  ✅ Complete Super Admin Dashboard');
    console.log('  ✅ Admin Management System');
    console.log('  ✅ Platform Statistics');
    console.log('  ✅ Security & Authentication');
    console.log('  ✅ Mobile-Responsive Design');
    console.log('  ✅ Real-time Updates');
    console.log('  ✅ AI Task Management');
    console.log('  ✅ User Engagement Tracking');
    console.log('  ✅ Content Management');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error setting up demo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the demo setup
if (require.main === module) {
  createSuperAdminDemo()
    .then(() => {
      console.log('\n🚀 Ready to demonstrate Super Admin Dashboard!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to setup demo:', error);
      process.exit(1);
    });
}

export { createSuperAdminDemo };