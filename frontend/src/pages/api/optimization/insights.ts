// frontend/src/pages/api/optimization/insights.ts
// API Proxy: Optimization Insights

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/optimization/insights`);
    
    if (req.method === 'GET') {
      Object.entries(req.query).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value as string);
      });

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: req.headers.authorization || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch insights');
      }

      const data = await response.json();
      return res.status(200).json(data);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error in insights proxy:', error);
    res.status(500).json({ error: error.message });
  }
}
