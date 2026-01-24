import { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get velocity metrics
      const queryParams = new URLSearchParams();
      if (req.query.period) queryParams.append('period', req.query.period as string);
      if (req.query.limit) queryParams.append('limit', req.query.limit as string);

      const response = await fetch(
        `${BACKEND_URL}/api/link-building/velocity?${queryParams.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      return res.status(response.status).json(data);
    } else if (req.method === 'POST') {
      // Track velocity
      const response = await fetch(`${BACKEND_URL}/api/link-building/velocity/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();
      return res.status(response.status).json(data);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in velocity API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process velocity request',
    });
  }
}
