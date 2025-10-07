/**
 * AI Agents API Route
 * Get all AI agents with their status and performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Verify user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !['SUPER_ADMIN', 'TECH_ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get AI agents data (mock data for now - will integrate with real AI system)
    const agents = [
      {
        id: 'agent_content_gen',
        name: 'Content Generation Agent',
        type: 'content_generation',
        status: 'active' as const,
        description: 'Generates cryptocurrency news articles using GPT-4',
        tasksProcessed: 1245,
        tasksInQueue: 8,
        successRate: 98.5,
        avgProcessingTime: 12.3,
        lastActive: new Date().toISOString(),
        errorCount: 2
      },
      {
        id: 'agent_translation',
        name: 'Translation Agent',
        type: 'translation',
        status: 'active' as const,
        description: 'Translates content to 15 African languages',
        tasksProcessed: 3421,
        tasksInQueue: 15,
        successRate: 99.2,
        avgProcessingTime: 4.7,
        lastActive: new Date().toISOString(),
        errorCount: 0
      },
      {
        id: 'agent_image_gen',
        name: 'Image Generation Agent',
        type: 'image_generation',
        status: 'active' as const,
        description: 'Creates featured images using DALL-E 3',
        tasksProcessed: 892,
        tasksInQueue: 3,
        successRate: 96.8,
        avgProcessingTime: 18.5,
        lastActive: new Date().toISOString(),
        errorCount: 5
      },
      {
        id: 'agent_sentiment',
        name: 'Sentiment Analysis Agent',
        type: 'sentiment_analysis',
        status: 'active' as const,
        description: 'Analyzes market sentiment and social media',
        tasksProcessed: 5621,
        tasksInQueue: 0,
        successRate: 97.1,
        avgProcessingTime: 2.1,
        lastActive: new Date().toISOString(),
        errorCount: 1
      },
      {
        id: 'agent_moderation',
        name: 'Content Moderation Agent',
        type: 'moderation',
        status: 'active' as const,
        description: 'Moderates user comments and community posts',
        tasksProcessed: 8234,
        tasksInQueue: 42,
        successRate: 99.5,
        avgProcessingTime: 1.8,
        lastActive: new Date().toISOString(),
        errorCount: 0
      },
      {
        id: 'agent_market',
        name: 'Market Analysis Agent',
        type: 'market_analysis',
        status: 'active' as const,
        description: 'Analyzes cryptocurrency market trends',
        tasksProcessed: 2134,
        tasksInQueue: 5,
        successRate: 95.3,
        avgProcessingTime: 8.9,
        lastActive: new Date().toISOString(),
        errorCount: 8
      },
      {
        id: 'agent_seo',
        name: 'SEO Optimization Agent',
        type: 'seo_optimization',
        status: 'idle' as const,
        description: 'Optimizes content for search engines',
        tasksProcessed: 567,
        tasksInQueue: 0,
        successRate: 98.9,
        avgProcessingTime: 5.2,
        lastActive: new Date(Date.now() - 3600000).toISOString(),
        errorCount: 0
      },
      {
        id: 'agent_social',
        name: 'Social Media Agent',
        type: 'social_media',
        status: 'active' as const,
        description: 'Generates social media posts and schedules distribution',
        tasksProcessed: 1823,
        tasksInQueue: 12,
        successRate: 97.8,
        avgProcessingTime: 3.4,
        lastActive: new Date().toISOString(),
        errorCount: 3
      },
      {
        id: 'agent_email',
        name: 'Email Campaign Agent',
        type: 'email_campaign',
        status: 'idle' as const,
        description: 'Creates and manages email newsletters',
        tasksProcessed: 234,
        tasksInQueue: 0,
        successRate: 99.1,
        avgProcessingTime: 6.7,
        lastActive: new Date(Date.now() - 7200000).toISOString(),
        errorCount: 0
      },
      {
        id: 'agent_quality',
        name: 'Quality Review Agent',
        type: 'quality_review',
        status: 'active' as const,
        description: 'Reviews AI-generated content for quality',
        tasksProcessed: 1156,
        tasksInQueue: 6,
        successRate: 98.2,
        avgProcessingTime: 7.1,
        lastActive: new Date().toISOString(),
        errorCount: 1
      }
    ];

    // Log audit event
    await prisma.auditLog.create({
      data: {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adminId: user.id,
        action: 'VIEW_AI_AGENTS',
        resource: 'ai_agents',
        details: JSON.stringify({ entity: 'AIAgent', entityId: 'all' }),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        status: 'success',
        User: {
          connect: { id: user.id }
        }
      }
    });

    return NextResponse.json({ 
      agents,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching AI agents:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
