/**
 * Content SEO Optimization API - Next.js Proxy
 * Handles frontend API calls for content SEO optimization
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, body, query } = req;
  const { endpoint } = query;

  // Build URL
  const backendEndpoint = Array.isArray(endpoint) ? endpoint.join('/') : endpoint;
  const url = `${BACKEND_URL}/api/content-seo/${backendEndpoint || ''}`;

  try {
    // Forward request to backend
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization || '',
      },
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    // Return response
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Content SEO API error:', error);
    res.status(500).json({ error: error.message });
  }
}
