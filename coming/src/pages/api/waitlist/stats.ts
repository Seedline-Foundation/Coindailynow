import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ResponseData = {
  count: number;
  subscribers?: any[];
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', count: 0 });
  }

  try {
    const count = await prisma.waitlistSubscriber.count();
    
    // Optionally return the list of subscribers (only for admin access)
    const { includeList } = req.query;
    
    if (includeList === 'true') {
      const subscribers = await prisma.waitlistSubscriber.findMany({
        orderBy: {
          subscribedAt: 'desc'
        },
        select: {
          id: true,
          email: true,
          subscribedAt: true,
          notified: true,
          referralSource: true
        }
      });
      
      return res.status(200).json({ count, subscribers });
    }
    
    return res.status(200).json({ count });

  } catch (error) {
    console.error('Failed to fetch waitlist stats:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch waitlist statistics',
      count: 0 
    });
  }
}
