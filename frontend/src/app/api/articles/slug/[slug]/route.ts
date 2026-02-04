/**
 * Article by Slug API Route (Frontend Proxy)
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const response = await fetch(`${backendUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetArticleBySlug($slug: String!) {
            article(slug: $slug) {
              id
              title
              slug
              excerpt
              content
              featuredImageUrl
              status
              publishedAt
              updatedAt
              author {
                id
                username
                firstName
                lastName
                avatarUrl
              }
              category {
                id
                name
                slug
              }
            }
          }
        `,
        variables: { slug },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch article');
    }

    const data = await response.json();
    
    if (!data.data.article) {
      return NextResponse.json(
        {
          success: false,
          error: 'Article not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data.data.article,
    });
  } catch (error: any) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch article',
      },
      { status: 500 }
    );
  }
}
