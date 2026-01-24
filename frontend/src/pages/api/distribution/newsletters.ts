/**
 * Newsletter Campaigns API Proxy
 * Task 64: Email newsletter management
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { method, query, body } = req;
    const { id, action } = query;
    
    let url = `${API_BASE_URL}/api/distribution/newsletters`;
    
    // Build URL based on action
    if (action === 'send' && id) {
      url += `/${id}/send`;
    } else if (action === 'stats' && id) {
      url += `/${id}/stats`;
    } else if (id) {
      url += `/${id}`;
    }

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && {
          Authorization: req.headers.authorization,
        }),
      },
    };

    if (method !== 'GET' && body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Newsletter proxy error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
