// frontend/src/pages/api/optimization/stats.ts
// API Proxy: Dashboard Statistics

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/optimization/stats`, {
      headers: {
        Authorization: req.headers.authorization || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch stats');
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Error in stats proxy:', error);
    res.status(500).json({ error: error.message });
  }
}
