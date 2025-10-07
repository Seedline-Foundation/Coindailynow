# REST API Contracts
# CoinDaily Platform AI Services & External Integrations

## AI Agent Service Endpoints

### Content Generation Agent
```yaml
POST /api/ai/content/generate
Content-Type: application/json
Authorization: Bearer {jwt_token}

Request:
{
  "type": "article" | "summary" | "headline",
  "input": {
    "topic": "string",
    "keywords": ["string"],
    "target_length": "number",
    "tone": "professional" | "casual" | "urgent",
    "language": "string (ISO 639-1)",
    "context": "string (optional)"
  },
  "priority": "low" | "normal" | "high" | "urgent"
}

Response:
{
  "task_id": "string",
  "status": "queued" | "processing" | "completed" | "failed",
  "estimated_completion": "ISO 8601 datetime",
  "content": "string (if completed)",
  "quality_score": "number (0-100)",
  "word_count": "number",
  "processing_time_ms": "number",
  "cost_usd": "number"
}
```

### Market Analysis Agent
```yaml
POST /api/ai/market/analyze
Content-Type: application/json
Authorization: Bearer {jwt_token}

Request:
{
  "analysis_type": "sentiment" | "trend" | "whale_activity" | "correlation",
  "tokens": ["string (symbols)"],
  "timeframe": "5m" | "15m" | "1h" | "4h" | "24h" | "7d",
  "exchanges": ["string (exchange names)"],
  "include_social_sentiment": "boolean",
  "african_focus": "boolean"
}

Response:
{
  "task_id": "string",
  "status": "queued" | "processing" | "completed" | "failed",
  "analysis": {
    "overall_sentiment": "bullish" | "bearish" | "neutral",
    "confidence_score": "number (0-100)",
    "key_findings": ["string"],
    "price_predictions": [
      {
        "token": "string",
        "timeframe": "string",
        "predicted_change": "number (percentage)",
        "confidence": "number (0-100)"
      }
    ],
    "whale_activity": [
      {
        "token": "string",
        "large_transactions": "number",
        "volume_impact": "number"
      }
    ],
    "mobile_money_correlation": {
      "correlation_score": "number (-1 to 1)",
      "affected_regions": ["string"]
    }
  },
  "processing_time_ms": "number",
  "cost_usd": "number"
}
```

### Translation Agent
```yaml
POST /api/ai/translate
Content-Type: application/json
Authorization: Bearer {jwt_token}

Request:
{
  "content": "string",
  "source_language": "string (ISO 639-1)",
  "target_languages": ["string (ISO 639-1)"],
  "content_type": "article" | "headline" | "summary" | "post",
  "preserve_crypto_terms": "boolean",
  "cultural_adaptation": "boolean"
}

Response:
{
  "task_id": "string",
  "status": "queued" | "processing" | "completed" | "failed",
  "translations": [
    {
      "language": "string",
      "content": "string",
      "quality_score": "number (0-100)",
      "human_review_required": "boolean",
      "crypto_terms_preserved": ["string"]
    }
  ],
  "processing_time_ms": "number",
  "cost_usd": "number"
}
```

### Image Generation Agent
```yaml
POST /api/ai/image/generate
Content-Type: application/json
Authorization: Bearer {jwt_token}

Request:
{
  "prompt": "string",
  "style": "professional" | "modern" | "crypto_themed" | "african_themed",
  "dimensions": {
    "width": "number",
    "height": "number"
  },
  "format": "png" | "jpg" | "webp",
  "usage": "article_featured" | "social_media" | "thumbnail"
}

Response:
{
  "task_id": "string",
  "status": "queued" | "processing" | "completed" | "failed",
  "image_url": "string",
  "alt_text": "string",
  "dimensions": {
    "width": "number",
    "height": "number"
  },
  "file_size_bytes": "number",
  "processing_time_ms": "number",
  "cost_usd": "number"
}
```

### Moderation Agent
```yaml
POST /api/ai/moderate
Content-Type: application/json
Authorization: Bearer {jwt_token}

Request:
{
  "content": "string",
  "content_type": "article" | "post" | "comment",
  "check_types": ["spam", "hate_speech", "unlisted_tokens", "financial_advice", "misinformation"],
  "strictness": "low" | "medium" | "high"
}

Response:
{
  "task_id": "string",
  "status": "completed" | "failed",
  "moderation_result": {
    "approved": "boolean",
    "confidence_score": "number (0-100)",
    "violations": [
      {
        "type": "string",
        "severity": "low" | "medium" | "high",
        "description": "string",
        "suggested_action": "approve" | "flag" | "reject" | "shadow_ban"
      }
    ],
    "detected_tokens": ["string"],
    "unlisted_token_mentions": ["string"]
  },
  "processing_time_ms": "number"
}
```

## Authentication Endpoints

### User Authentication
```yaml
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "string",
  "password": "string",
  "remember_me": "boolean"
}

Response:
{
  "access_token": "string",
  "refresh_token": "string",
  "expires_at": "ISO 8601 datetime",
  "user": {
    "id": "string",
    "email": "string",
    "username": "string",
    "subscription_tier": "free" | "premium" | "enterprise"
  }
}
```

```yaml
POST /api/auth/refresh
Content-Type: application/json
Authorization: Bearer {refresh_token}

Response:
{
  "access_token": "string",
  "expires_at": "ISO 8601 datetime"
}
```

## Market Data Endpoints

### Real-time Price Data
```yaml
GET /api/market/prices
Authorization: Bearer {jwt_token}
Query Parameters:
  - symbols: string (comma-separated, e.g., "BTC,ETH,ADA")
  - exchanges: string (comma-separated, optional)
  - currency: string (default: "USD")

Response:
{
  "data": [
    {
      "symbol": "string",
      "price_usd": "number",
      "price_change_24h": "number",
      "volume_24h": "number",
      "market_cap": "number",
      "last_updated": "ISO 8601 datetime",
      "exchange": "string"
    }
  ],
  "cache_expires_at": "ISO 8601 datetime",
  "response_time_ms": "number"
}
```

### African Exchange Data
```yaml
GET /api/market/african-exchanges
Authorization: Bearer {jwt_token}
Query Parameters:
  - country: string (ISO 3166-1 alpha-2, optional)
  - exchange: string (optional)

Response:
{
  "exchanges": [
    {
      "name": "string",
      "country": "string",
      "region": "string",
      "volume_24h_usd": "number",
      "supported_pairs": ["string"],
      "api_status": "online" | "offline" | "limited",
      "last_sync": "ISO 8601 datetime"
    }
  ],
  "mobile_money_correlation": {
    "m_pesa_volume": "number",
    "correlation_score": "number"
  }
}
```

## Search Endpoints

### Intelligent Search
```yaml
POST /api/search
Content-Type: application/json
Authorization: Bearer {jwt_token}

Request:
{
  "query": "string",
  "type": "ai" | "organic",
  "filters": {
    "content_types": ["article", "token", "user", "post"],
    "categories": ["string"],
    "date_range": {
      "start": "ISO 8601 date",
      "end": "ISO 8601 date"
    },
    "is_premium": "boolean",
    "language": "string"
  },
  "limit": "number (default: 20, max: 100)",
  "offset": "number (default: 0)"
}

Response:
{
  "results": [
    {
      "id": "string",
      "title": "string",
      "excerpt": "string",
      "url": "string",
      "type": "article" | "token" | "user" | "post",
      "relevance_score": "number (0-100)",
      "is_ai_generated": "boolean",
      "is_premium": "boolean",
      "published_at": "ISO 8601 datetime",
      "author": "string",
      "category": "string"
    }
  ],
  "total_count": "number",
  "search_time_ms": "number",
  "suggestions": ["string"],
  "ai_response": "string (if type='ai')",
  "personalized_greeting": "string (if user logged in)"
}
```

### Search Suggestions
```yaml
GET /api/search/suggestions
Authorization: Bearer {jwt_token}
Query Parameters:
  - q: string (partial query)
  - limit: number (default: 10)

Response:
{
  "suggestions": [
    {
      "text": "string",
      "type": "trending" | "popular" | "recent" | "autocomplete",
      "count": "number"
    }
  ],
  "response_time_ms": "number"
}
```

## Content Management Endpoints

### Article Management
```yaml
POST /api/content/articles
Content-Type: application/json
Authorization: Bearer {jwt_token}

Request:
{
  "title": "string",
  "content": "string",
  "excerpt": "string",
  "category_id": "string",
  "tags": ["string"],
  "is_premium": "boolean",
  "featured_image_url": "string",
  "publish_at": "ISO 8601 datetime (optional)",
  "seo_title": "string",
  "seo_description": "string"
}

Response:
{
  "id": "string",
  "title": "string",
  "slug": "string",
  "status": "draft" | "pending_review" | "published",
  "created_at": "ISO 8601 datetime",
  "preview_url": "string",
  "ai_analysis": {
    "readability_score": "number",
    "seo_score": "number",
    "engagement_prediction": "number"
  }
}
```

## Analytics Endpoints

### Content Performance
```yaml
GET /api/analytics/content/{content_id}
Authorization: Bearer {jwt_token}
Query Parameters:
  - date_range: string (7d, 30d, 90d, custom)
  - start_date: string (ISO 8601 date, for custom range)
  - end_date: string (ISO 8601 date, for custom range)

Response:
{
  "performance": {
    "views": "number",
    "unique_views": "number",
    "likes": "number",
    "shares": "number",
    "comments": "number",
    "reading_time_avg": "number",
    "bounce_rate": "number",
    "conversion_rate": "number"
  },
  "trends": [
    {
      "date": "ISO 8601 date",
      "views": "number",
      "engagement": "number"
    }
  ],
  "demographics": {
    "countries": [{"country": "string", "percentage": "number"}],
    "devices": [{"device": "string", "percentage": "number"}]
  }
}
```

## WebSocket Contracts

### Real-time Market Data
```yaml
WebSocket: /ws/market-data
Authentication: Query parameter ?token={jwt_token}

Subscribe Message:
{
  "action": "subscribe",
  "channels": ["prices", "volume", "whale_activity"],
  "tokens": ["BTC", "ETH", "ADA"]
}

Price Update Message:
{
  "channel": "prices",
  "data": {
    "symbol": "string",
    "price": "number",
    "change_24h": "number",
    "timestamp": "ISO 8601 datetime"
  }
}

Whale Activity Message:
{
  "channel": "whale_activity",
  "data": {
    "symbol": "string",
    "transaction_hash": "string",
    "amount_usd": "number",
    "exchange": "string",
    "timestamp": "ISO 8601 datetime"
  }
}
```

### Breaking News Notifications
```yaml
WebSocket: /ws/notifications
Authentication: Query parameter ?token={jwt_token}

Breaking News Message:
{
  "type": "breaking_news",
  "data": {
    "article_id": "string",
    "title": "string",
    "excerpt": "string",
    "priority": "high" | "urgent",
    "published_at": "ISO 8601 datetime",
    "url": "string"
  }
}
```

## Error Response Format

All endpoints use consistent error response format:

```yaml
HTTP Status: 4xx or 5xx

Response:
{
  "error": {
    "code": "string (ERROR_CODE)",
    "message": "string (human-readable)",
    "details": "string (optional, additional context)",
    "request_id": "string (for tracking)",
    "timestamp": "ISO 8601 datetime"
  }
}
```

### Common Error Codes
- `AUTHENTICATION_REQUIRED`: 401, missing or invalid token
- `PERMISSION_DENIED`: 403, insufficient permissions
- `RATE_LIMIT_EXCEEDED`: 429, too many requests
- `VALIDATION_ERROR`: 400, invalid input data
- `RESOURCE_NOT_FOUND`: 404, requested resource doesn't exist
- `AI_SERVICE_UNAVAILABLE`: 503, AI service temporarily unavailable
- `CACHE_MISS`: 503, unable to serve from cache and backend unavailable

## Rate Limiting

All endpoints implement rate limiting based on user tier:

- **Free Tier**: 100 requests/hour
- **Premium Tier**: 1000 requests/hour  
- **Enterprise Tier**: 10000 requests/hour

Rate limit headers included in all responses:
- `X-RateLimit-Limit`: Total requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

## Caching Headers

All cacheable responses include appropriate Cache-Control headers:

- **Static content**: `Cache-Control: public, max-age=31536000` (1 year)
- **Article content**: `Cache-Control: public, max-age=3600` (1 hour)
- **Market data**: `Cache-Control: public, max-age=30` (30 seconds)
- **User data**: `Cache-Control: private, max-age=300` (5 minutes)
- **Search results**: `Cache-Control: public, max-age=600` (10 minutes)