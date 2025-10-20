/**
 * Content Calendar API Route
 * POST /api/content-strategy/calendar/generate
 * GET /api/content-strategy/calendar
 * PATCH /api/content-strategy/calendar/:itemId
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      // Generate calendar
      const response = await fetch(`${BACKEND_URL}/api/content-strategy/calendar/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } else if (req.method === 'GET') {
      // Get calendar
      const { region, category, status, startDate, endDate } = req.query;
      
      const params = new URLSearchParams();
      if (region) params.append('region', region as string);
      if (category) params.append('category', category as string);
      if (status) params.append('status', status as string);
      if (startDate) params.append('startDate', startDate as string);
      if (endDate) params.append('endDate', endDate as string);
      
      const response = await fetch(`${BACKEND_URL}/api/content-strategy/calendar?${params.toString()}`);
      const data = await response.json();
      
      return res.status(response.status).json(data);
    } else if (req.method === 'PATCH') {
      // Update calendar item
      const { itemId } = req.query;
      
      const response = await fetch(`${BACKEND_URL}/api/content-strategy/calendar/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Calendar API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
