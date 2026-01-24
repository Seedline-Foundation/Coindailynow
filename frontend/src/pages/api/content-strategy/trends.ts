/**
 * Trend Monitoring API Route
 * POST /api/content-strategy/trends/monitor
 * GET /api/content-strategy/trends
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      // Monitor trends
      const response = await fetch(`${BACKEND_URL}/api/content-strategy/trends/monitor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } else if (req.method === 'GET') {
      // Get trends
      const { region, category, trendType, velocity, minScore } = req.query;
      
      const params = new URLSearchParams();
      if (region) params.append('region', region as string);
      if (category) params.append('category', category as string);
      if (trendType) params.append('trendType', trendType as string);
      if (velocity) params.append('velocity', velocity as string);
      if (minScore) params.append('minScore', minScore as string);
      
      const response = await fetch(`${BACKEND_URL}/api/content-strategy/trends?${params.toString()}`);
      const data = await response.json();
      
      return res.status(response.status).json(data);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Trends API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
