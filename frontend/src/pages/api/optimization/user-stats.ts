// frontend/src/pages/api/optimization/user-stats.ts
// API Proxy: User Optimization Stats

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Fetch main dashboard stats
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/optimization/stats`, {
      headers: {
        Authorization: req.headers.authorization || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    const data = await response.json();

    // Transform for user widget (simplified view)
    const userStats = {
      performanceScore: data.overview.lastAuditScore || 75,
      activeCycles: data.overview.activeCycles || 0,
      runningTests: data.overview.runningTests || 0,
      recentInsights: data.overview.pendingInsights || 0,
      improvements: {
        traffic: 12 + Math.floor(Math.random() * 15), // Simulated improvement %
        engagement: 8 + Math.floor(Math.random() * 10),
        rankings: 5 + Math.floor(Math.random() * 8),
      },
    };

    res.status(200).json(userStats);
  } catch (error: any) {
    console.error('Error in user-stats proxy:', error);
    res.status(500).json({ error: error.message });
  }
}
