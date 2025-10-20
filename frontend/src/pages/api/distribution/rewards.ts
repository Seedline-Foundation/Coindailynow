/**
 * User Rewards API Proxy
 * Task 64: User reward tracking and management
 */

import type { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { method, query, body } = req;
    const { userId, action } = query;
    
    let url = `${API_BASE_URL}/api/distribution/rewards`;
    
    // Build URL based on action
    if (action === 'user' && userId) {
      url += `/user/${userId}`;
      // Add limit and offset if provided
      const params = new URLSearchParams();
      if (query.limit) params.append('limit', String(query.limit));
      if (query.offset) params.append('offset', String(query.offset));
      if (params.toString()) url += `?${params.toString()}`;
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
    console.error('Rewards proxy error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
