/**
 * Keyword Research API Route
 * POST /api/content-strategy/keywords/research
 * GET /api/content-strategy/keywords
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      // Keyword research
      const response = await fetch(`${BACKEND_URL}/api/content-strategy/keywords/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } else if (req.method === 'GET') {
      // Get keywords
      const { region, category, priority, limit } = req.query;
      
      const params = new URLSearchParams();
      if (region) params.append('region', region as string);
      if (category) params.append('category', category as string);
      if (priority) params.append('priority', priority as string);
      if (limit) params.append('limit', limit as string);
      
      const response = await fetch(`${BACKEND_URL}/api/content-strategy/keywords?${params.toString()}`);
      const data = await response.json();
      
      return res.status(response.status).json(data);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Keywords API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
