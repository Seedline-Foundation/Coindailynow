import { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      // Check if getting specific campaign by ID
      if (req.query.id) {
        const response = await fetch(
          `${BACKEND_URL}/api/link-building/campaigns/${req.query.id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await response.json();
        return res.status(response.status).json(data);
      }

      // Get all campaigns with filters
      const queryParams = new URLSearchParams();
      if (req.query.status) queryParams.append('status', req.query.status as string);
      if (req.query.campaignType) queryParams.append('campaignType', req.query.campaignType as string);
      if (req.query.region) queryParams.append('region', req.query.region as string);

      const response = await fetch(
        `${BACKEND_URL}/api/link-building/campaigns?${queryParams.toString()}`,
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
      // Create new campaign
      const response = await fetch(`${BACKEND_URL}/api/link-building/campaigns`, {
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
    console.error('Error in campaigns API:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process campaigns request',
    });
  }
}
