/**
 * Articles API Route (Frontend Proxy)
 * Proxies requests to backend API
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const searchParams = request.nextUrl.searchParams;
    
    const response = await fetch(`${backendUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetArticles {
            articles(first: 100, where: { status: PUBLISHED }) {
              edges {
                node {
                  id
                  title
                  slug
                  excerpt
                  status
                  publishedAt
                }
              }
            }
          }
        `,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch articles');
    }

    const data = await response.json();
    const articles = data.data.articles.edges.map((edge: any) => edge.node);

    return NextResponse.json({
      success: true,
      data: articles,
    });
  } catch (error: any) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch articles',
      },
      { status: 500 }
    );
  }
}
