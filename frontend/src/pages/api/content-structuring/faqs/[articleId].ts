import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { articleId } = req.query;

  if (!articleId || typeof articleId !== 'string') {
    return res.status(400).json({ error: 'Article ID is required' });
  }

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/content-structuring/faqs/${articleId}`);
    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('FAQs API error:', error);
    res.status(500).json({ error: error.message });
  }
}
