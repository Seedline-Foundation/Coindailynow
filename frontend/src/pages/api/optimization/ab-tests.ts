// frontend/src/pages/api/optimization/ab-tests.ts
// API Proxy: A/B Testing

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/optimization/ab-tests`);
    
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
        throw new Error('Failed to fetch tests');
      }

      const data = await response.json();
      return res.status(200).json(data);
    } else if (req.method === 'POST') {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: req.headers.authorization || '',
        },
        body: JSON.stringify(req.body),
      });

      if (!response.ok) {
        throw new Error('Failed to create test');
      }

      const data = await response.json();
      return res.status(200).json(data);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error in ab-tests proxy:', error);
    res.status(500).json({ error: error.message });
  }
}
