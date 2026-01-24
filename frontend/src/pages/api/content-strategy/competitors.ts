/**
 * Competitor Analysis API Route
 * POST /api/content-strategy/competitors/analyze
 * GET /api/content-strategy/competitors/gaps
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      // Analyze competitor
      const response = await fetch(`${BACKEND_URL}/api/content-strategy/competitors/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } else if (req.method === 'GET') {
      // Get competitor gaps
      const response = await fetch(`${BACKEND_URL}/api/content-strategy/competitors/gaps`);
      const data = await response.json();
      
      return res.status(response.status).json(data);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Competitors API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
