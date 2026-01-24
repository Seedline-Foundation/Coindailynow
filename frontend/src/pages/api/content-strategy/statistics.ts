/**
 * Content Strategy Statistics API Route
 * GET /api/content-strategy/statistics
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startDate, endDate } = req.query;
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate as string);
    if (endDate) params.append('endDate', endDate as string);
    
    const url = `${BACKEND_URL}/api/content-strategy/statistics${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Statistics API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
