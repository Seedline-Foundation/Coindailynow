# SEO API Reference

## Overview

The CoinDaily SEO API provides comprehensive SEO analysis, metadata generation, and RAO (Retrieval-Augmented Optimization) capabilities. All endpoints require authentication and implement rate limiting.

## 🔐 Authentication

All SEO API endpoints require a valid JWT token:

```
Authorization: Bearer <your-jwt-token>
```

## 📊 Core Endpoints

### POST /api/seo/analyze

Perform comprehensive SEO analysis on content.

**Request Body:**
```json
{
  "url": "https://coindaily.africa/article/bitcoin-analysis",
  "content": "Full article content here...",
  "title": "Bitcoin Price Analysis 2025",
  "description": "Comprehensive Bitcoin analysis...",
  "keywords": ["bitcoin", "crypto", "analysis"],
  "targetAudience": "crypto investors",
  "contentType": "article"
}
```

**Response:**
```json
{
  "data": {
    "score": 85,
    "issues": [
      {
        "type": "warning",
        "category": "title",
        "message": "Title could be more descriptive",
        "impact": "medium",
        "fix": "Add primary keyword to title"
      }
    ],
    "suggestions": [
      {
        "type": "title",
        "suggestion": "Bitcoin Price Analysis 2025: Key Trends and Predictions",
        "expectedImprovement": 15,
        "priority": "high"
      }
    ],
    "metadata": {
      "title": "Bitcoin Price Analysis 2025: Key Trends and Predictions",
      "description": "Comprehensive analysis of Bitcoin price movements...",
      "keywords": ["bitcoin", "crypto analysis", "2025 trends"],
      "canonicalUrl": "https://coindaily.africa/article/bitcoin-analysis",
      "ogTitle": "Bitcoin Price Analysis 2025",
      "ogDescription": "Comprehensive Bitcoin analysis...",
      "ogImage": "/images/bitcoin-analysis.jpg",
      "ogType": "article",
      "twitterCard": "summary_large_image",
      "raometa": {
        "canonicalAnswer": "Bitcoin is expected to reach $150,000 by end of 2025...",
        "semanticChunks": ["Market analysis", "Technical indicators", "Predictions"],
        "entityMentions": ["Bitcoin", "Ethereum", "Federal Reserve"],
        "factClaims": ["Bitcoin market cap exceeds $1T", "Institutional adoption growing"],
        "aiSource": "CoinDaily AI Analysis",
        "lastVerified": "2025-01-08T10:00:00Z",
        "confidence": 0.87
      }
    }
  },
  "cache": {
    "expires_at": "2025-01-08T11:00:00Z",
    "hit": false
  }
}
```

**Rate Limit:** 100 requests per 15 minutes

---

### POST /api/seo/generate

Generate optimized SEO metadata for content.

**Request Body:**
```json
{
  "content": "Full content for analysis...",
  "type": "article",
  "url": "https://coindaily.africa/article/example",
  "title": "Example Article",
  "image": "/images/example.jpg",
  "author": "John Doe",
  "publishedAt": "2025-01-08T10:00:00Z",
  "modifiedAt": "2025-01-08T10:00:00Z",
  "category": "Cryptocurrency",
  "tags": ["bitcoin", "analysis"],
  "targetKeywords": ["bitcoin", "crypto"]
}
```

**Response:**
```json
{
  "data": {
    "title": "Example Article - Comprehensive Bitcoin Analysis",
    "description": "In-depth analysis of Bitcoin market trends...",
    "keywords": ["bitcoin", "cryptocurrency", "market analysis"],
    "canonicalUrl": "https://coindaily.africa/article/example",
    "ogTitle": "Example Article - Comprehensive Bitcoin Analysis",
    "ogDescription": "In-depth analysis of Bitcoin market trends...",
    "ogImage": "/images/example.jpg",
    "ogType": "article",
    "twitterCard": "summary_large_image",
    "articleAuthor": "John Doe",
    "articlePublishedTime": "2025-01-08T10:00:00Z",
    "articleModifiedTime": "2025-01-08T10:00:00Z",
    "articleSection": "Cryptocurrency",
    "articleTag": ["bitcoin", "analysis"],
    "raometa": {
      "canonicalAnswer": "Bitcoin shows strong bullish patterns...",
      "semanticChunks": ["Market overview", "Technical analysis", "Future outlook"],
      "entityMentions": ["Bitcoin", "Cryptocurrency", "Blockchain"],
      "factClaims": ["Market cap increased 15%", "Trading volume surged"],
      "aiSource": "CoinDaily AI Analysis",
      "lastVerified": "2025-01-08T10:00:00Z",
      "confidence": 0.89
    }
  },
  "cache": {
    "expires_at": "2025-01-08T11:00:00Z",
    "hit": false
  }
}
```

**Rate Limit:** 100 requests per 15 minutes

---

### GET /api/seo/metadata/:contentId/:contentType

Retrieve stored SEO metadata for specific content.

**Parameters:**
- `contentId`: Content identifier (e.g., article ID)
- `contentType`: Content type (article, page, category, author)

**Response:**
```json
{
  "data": {
    "title": "Bitcoin Analysis 2025",
    "description": "Comprehensive market analysis...",
    "raometa": {
      "canonicalAnswer": "Bitcoin will reach $150K by 2025",
      "confidence": 0.87
    }
  },
  "cache": {
    "expires_at": "2025-01-08T10:30:00Z",
    "hit": true
  }
}
```

**Rate Limit:** 1000 requests per 15 minutes

---

### PUT /api/seo/metadata/:contentId/:contentType

Save or update SEO metadata (Super Admin only).

**Parameters:**
- `contentId`: Content identifier
- `contentType`: Content type

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description...",
  "raometa": {
    "canonicalAnswer": "Updated canonical answer",
    "confidence": 0.95
  }
}
```

**Response:**
```json
{
  "data": {
    "success": true,
    "contentId": "article-123",
    "contentType": "article"
  },
  "message": "SEO metadata saved successfully"
}
```

**Rate Limit:** 50 requests per 15 minutes
**Required Role:** Super Admin

---

## 🎯 Advanced Endpoints

### GET /llms.txt

Retrieve AI-friendly content index for LLM indexing.

**Response:** Plain text content index optimized for language models.

**Example Response:**
```
# CoinDaily - Africa's Premier Cryptocurrency News Platform

## About
CoinDaily provides comprehensive cryptocurrency and blockchain news coverage...

## Content Index

### Bitcoin Price Analysis 2025
Comprehensive analysis of Bitcoin price movements...
/article/bitcoin-analysis-2025

## AI Analysis Confidence: 87.3%
Generated by CoinDaily AI on 2025-01-08T10:00:00Z
```

**Rate Limit:** 100 requests per hour

---

### POST /api/seo/keywords/suggestions

Get AI-powered keyword suggestions for content.

**Request Body:**
```json
{
  "content": "Article content for keyword analysis...",
  "targetKeywords": ["bitcoin", "crypto"]
}
```

**Response:**
```json
{
  "data": {
    "keywords": [
      "bitcoin",
      "cryptocurrency",
      "blockchain",
      "market analysis",
      "price prediction",
      "2025 forecast"
    ]
  },
  "cache": {
    "expires_at": "2025-01-08T11:00:00Z",
    "hit": false
  }
}
```

**Rate Limit:** 50 requests per 15 minutes

---

### POST /api/seo/ab-test

Create A/B test for meta descriptions (Super Admin only).

**Request Body:**
```json
{
  "contentId": "article-123",
  "contentType": "article",
  "variants": [
    {
      "description": "First variant description...",
      "traffic": 50
    },
    {
      "description": "Second variant description...",
      "traffic": 50
    }
  ]
}
```

**Response:**
```json
{
  "data": {
    "testId": "ab_test_1736328000000",
    "contentId": "article-123",
    "contentType": "article",
    "variants": 2,
    "status": "active",
    "createdAt": "2025-01-08T10:00:00Z"
  },
  "message": "A/B test created successfully"
}
```

**Rate Limit:** 10 requests per hour
**Required Role:** Super Admin

---

### GET /api/seo/analytics

Get comprehensive SEO analytics and performance metrics (Super Admin only).

**Response:**
```json
{
  "data": {
    "totalPages": 1250,
    "averageScore": 78.5,
    "topIssues": [
      {
        "type": "Missing meta descriptions",
        "count": 45
      },
      {
        "type": "Title too long",
        "count": 32
      }
    ],
    "improvement": {
      "lastMonth": 5.2,
      "trendingUp": true
    },
    "raometa": {
      "indexedPages": 892,
      "averageConfidence": 0.82
    }
  },
  "cache": {
    "expires_at": "2025-01-08T10:30:00Z",
    "hit": false
  }
}
```

**Rate Limit:** 20 requests per hour
**Required Role:** Super Admin

---

## 📋 Data Types

### SEOIssue
```typescript
interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  category: 'title' | 'description' | 'keywords' | 'content' | 'technical' | 'social';
  message: string;
  impact: 'high' | 'medium' | 'low';
  fix?: string;
}
```

### SEOSuggestion
```typescript
interface SEOSuggestion {
  type: 'title' | 'description' | 'keywords' | 'content' | 'technical';
  suggestion: string;
  expectedImprovement: number; // percentage
  priority: 'high' | 'medium' | 'low';
}
```

### SEOMetadata
```typescript
interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  articleAuthor?: string;
  articlePublishedTime?: string;
  articleModifiedTime?: string;
  articleSection?: string;
  articleTag?: string[];
  raometa: RAOMetadata;
}
```

### RAOMetadata
```typescript
interface RAOMetadata {
  canonicalAnswer?: string;
  semanticChunks: string[];
  entityMentions: string[];
  factClaims: string[];
  aiSource: string;
  lastVerified: string;
  confidence: number;
  llmsTxt: string;
}
```

---

## ⚠️ Error Responses

All endpoints return errors in a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details (development only)"
  }
}
```

### Common Error Codes

- `INVALID_REQUEST`: Missing or invalid request parameters
- `UNAUTHORIZED`: Missing or invalid authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `ANALYSIS_FAILED`: SEO analysis failed
- `GENERATION_FAILED`: Metadata generation failed
- `SAVE_FAILED`: Failed to save metadata
- `RATE_LIMITED`: Too many requests

---

## 🔒 Security & Rate Limiting

### Authentication
- All endpoints require valid JWT tokens
- Tokens must be included in `Authorization: Bearer <token>` header

### Rate Limits
- **Analysis/Generation**: 100 requests per 15 minutes
- **Metadata Retrieval**: 1000 requests per 15 minutes
- **Admin Operations**: 10-50 requests per hour
- **Public Access** (`/llms.txt`): 100 requests per hour

### Input Validation
- Content length limited to 50KB
- URLs must be valid HTTPS URLs
- Keywords limited to 20 per request
- HTML content is sanitized

---

## 📊 Response Caching

All responses include cache headers:

```json
{
  "cache": {
    "expires_at": "2025-01-08T11:00:00Z",
    "hit": false
  }
}
```

- **SEO Analysis**: Cached for 30 minutes
- **Metadata Generation**: Cached for 1 hour
- **Stored Metadata**: Cached for 30 minutes
- **Analytics**: Cached for 30 minutes

---

## 🔧 Troubleshooting

### Common Issues

#### 401 Unauthorized
```
Solution: Ensure valid JWT token is provided in Authorization header
```

#### 429 Rate Limited
```
Solution: Wait for rate limit reset or upgrade API plan
```

#### 500 Internal Server Error
```
Solution: Check server logs, retry request, contact support if persistent
```

#### Slow Responses
```
Solution: Check Redis cache status, verify OpenAI API connectivity
```

---

## 📞 Support

For API support and questions:
- **Documentation**: Check this reference first
- **Status Page**: Monitor API status at `/api/status`
- **Logs**: Check application logs for detailed error information
- **Contact**: Use admin dashboard for support requests

---

**Last Updated:** January 8, 2025
**Version:** 1.0.0