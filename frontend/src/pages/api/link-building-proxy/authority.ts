import { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get authority metrics
      const queryParams = new URLSearchParams();
      if (req.query.limit) queryParams.append('limit', req.query.limit as string);

      const response = await fetch(
        `${BACKEND_URL}/api/link-building/authority?${queryParams.toString()}`,
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
      // Track authority metrics
      const response = await fetch(`${BACKEND_URL}/api/link-building/authority/track`, {
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
    console.error('Error in authority API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process authority request',
    });
  }
}
