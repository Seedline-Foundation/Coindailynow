import { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Get prospects with filters
      const queryParams = new URLSearchParams();
      if (req.query.status) queryParams.append('status', req.query.status as string);
      if (req.query.prospectType) queryParams.append('prospectType', req.query.prospectType as string);
      if (req.query.region) queryParams.append('region', req.query.region as string);
      if (req.query.campaignId) queryParams.append('campaignId', req.query.campaignId as string);

      const response = await fetch(
        `${BACKEND_URL}/api/link-building/prospects?${queryParams.toString()}`,
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
      // Add new prospect
      const response = await fetch(`${BACKEND_URL}/api/link-building/prospects`, {
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
    console.error('Error in prospects API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process prospects request',
    });
  }
}
