// frontend/src/pages/api/optimization/audits.ts
// API Proxy: Performance Audits

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/optimization/audits`);
    
    if (req.method === 'GET') {
      // Add query parameters
      Object.entries(req.query).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value as string);
      });

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: req.headers.authorization || '',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audits');
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
        throw new Error('Failed to create audit');
      }

      const data = await response.json();
      return res.status(200).json(data);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Error in audits proxy:', error);
    res.status(500).json({ error: error.message });
  }
}
