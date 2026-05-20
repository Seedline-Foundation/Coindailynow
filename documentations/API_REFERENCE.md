# CoinDaily API Reference

## Base URL
- **Production**: `https://app.coindaily.online`
- **Development**: `http://localhost:4000`

## Authentication
All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

Tokens are obtained via the `register` or `login` GraphQL mutations.

## GraphQL API

### Endpoint
`POST /graphql`

### Queries

| Query | Description | Auth Required |
|-------|-------------|---------------|
| `me` | Get current user profile | Yes |
| `user(id: ID!)` | Get user by ID | Yes |
| `users(limit, offset)` | List users | Yes (Admin) |
| `article(id, slug)` | Get article by ID or slug | No |
| `articles(limit, offset, categoryId, status)` | List articles | No |
| `categories(parentId)` | List categories | No |
| `tokens(limit, offset)` | List tracked tokens | No |
| `myBookmarks` | Get user's bookmarks | Yes |
| `myReadingHistory` | Get reading history | Yes |
| `myNotifications` | Get notifications | Yes |
| `myWalletSummary` | Get wallet info | Yes |
| `supportedLanguages` | List translation languages | No |

### Mutations

| Mutation | Description | Auth Required |
|---------|-------------|---------------|
| `register(input: RegisterInput!)` | Create account | No |
| `login(input: LoginInput!)` | Authenticate | No |
| `logout` | End session | Yes |
| `refreshToken(token: String!)` | Refresh access token | No |
| `createArticle(input)` | Create article | Yes (Author+) |
| `updateArticle(id, input)` | Update article | Yes (Author+) |
| `deleteArticle(id)` | Delete article | Yes (Admin) |
| `updateProfile(input)` | Update user profile | Yes |
| `recordConsent(input)` | Record cookie/GDPR consent | No |
| `deleteUserData(userId, reason)` | GDPR data deletion | Yes (Self/Admin) |

### Example: Register
```graphql
mutation {
  register(input: {
    email: "user@example.com"
    username: "newuser"
    password: "SecurePass123!"
  }) {
    tokens { accessToken refreshToken }
    user { id email username role }
  }
}
```

## REST API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |
| GET | `/api/v1/market/*` | Market data |
| GET | `/api/v1/regulations/*` | Regulatory info |
| GET | `/api/v1/bounty/*` | Bounty system |
| GET | `/api/v1/press/*` | Press releases |
| POST | `/api/legal/consent/cookies` | Record cookie consent |
| GET | `/api/news/*` | News aggregation |
| GET | `/api/sitemap` | XML sitemap |
| GET | `/feed.xml` | RSS feed |
| GET | `/feed.json` | JSON feed |
| GET | `/atom.xml` | Atom feed |

## Rate Limiting
- Development: 10,000 requests per 15-minute window
- Production (Free): 100 requests per 15-minute window
- Production (Premium): 1,000 requests per 15-minute window

## WebSocket Endpoints
- `/graphql` — GraphQL subscriptions (graphql-ws protocol)
- `/api/v1/stream/:symbol` — Real-time market data stream
