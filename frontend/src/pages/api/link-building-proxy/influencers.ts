import { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get influencers with filters
      const queryParams = new URLSearchParams();
      if (req.query.platform) queryParams.append('platform', req.query.platform as string);
      if (req.query.region) queryParams.append('region', req.query.region as string);
      if (req.query.status) queryParams.append('status', req.query.status as string);
      if (req.query.minFollowers) queryParams.append('minFollowers', req.query.minFollowers as string);

      const response = await fetch(
        `${BACKEND_URL}/api/link-building/influencers?${queryParams.toString()}`,
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
      // Add new influencer
      const response = await fetch(`${BACKEND_URL}/api/link-building/influencers`, {
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
    console.error('Error in influencers API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process influencers request',
    });
  }
}
