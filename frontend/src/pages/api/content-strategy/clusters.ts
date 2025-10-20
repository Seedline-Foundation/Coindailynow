/**
 * Topic Clusters API Route
 * POST /api/content-strategy/clusters
 * GET /api/content-strategy/clusters
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'POST') {
      // Create cluster
      const response = await fetch(`${BACKEND_URL}/api/content-strategy/clusters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      
      const data = await response.json();
      return res.status(response.status).json(data);
    } else if (req.method === 'GET') {
      // Get clusters
      const { region, category, status } = req.query;
      
      const params = new URLSearchParams();
      if (region) params.append('region', region as string);
      if (category) params.append('category', category as string);
      if (status) params.append('status', status as string);
      
      const response = await fetch(`${BACKEND_URL}/api/content-strategy/clusters?${params.toString()}`);
      const data = await response.json();
      
      return res.status(response.status).json(data);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Clusters API error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
