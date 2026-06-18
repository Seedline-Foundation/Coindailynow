# CoinDaily - Africa's Premier Cryptocurrency News Platform

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

CoinDaily is Africa's premier cryptocurrency and memecoin news platform featuring AI-driven content generation, real-time market data, custom CMS, multi-language support, and Reddit-like community features.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Docker and Docker Compose
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd coindaily-platform

# Copy environment file
cp .env.example .env.local
```

### 2. Configure Environment Variables
Edit `.env.local` with your API keys and configuration (see `.env.example` for required variables).

### 3. Start Infrastructure Services
```bash
# Start databases and services
docker-compose up -d

# Install dependencies
npm run install:all
```

### 4. Run Database Migrations
```bash
cd backend
npm run db:migrate
npm run db:seed
```

### 5. Start Development Servers
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Terminal 3: Start AI agents (optional)
cd ai-system
npm run dev
```

### 6. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- GraphQL Playground: http://localhost:3001/graphql
- Kibana (logs): http://localhost:5601

## 📁 Project Structure

```
coindaily-platform/
├── backend/                    # Node.js/Express backend
│   ├── src/
│   │   ├── api/               # GraphQL schema & resolvers
│   │   ├── models/            # Database models
│   │   ├── services/          # Business logic
│   │   ├── middleware/        # Express middleware
│   │   ├── utils/             # Utilities
│   │   └── agents/            # AI agent integrations
│   ├── prisma/                # Database schema & migrations
│   └── package.json
├── frontend/                   # Next.js frontend
│   ├── src/
│   │   ├── app/               # Next.js 13+ app directory
│   │   ├── components/        # Reusable React components
│   │   ├── services/          # API clients
│   │   └── types/             # TypeScript definitions
│   └── package.json
├── ai-system/                  # AI agent orchestration
│   ├── agents/                # AI agent implementations
│   └── orchestrator/          # Central coordination
├── infrastructure/             # Docker & deployment configs
│   ├── docker/                # Docker Compose files
│   └── scripts/               # Deployment scripts
└── specs/                     # Project specifications
    └── 002-coindaily-africa-s/
        ├── plan.md            # Implementation plan
        ├── data-model.md      # Database schema
        ├── graphql-schema.graphql # API contracts
        ├── rest-api.md        # REST API specs
        └── quickstart.md      # Setup guide
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js + Apollo Server
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon) + Redis + Elasticsearch
- **ORM**: Prisma
- **Authentication**: JWT with refresh tokens
- **Real-time**: WebSocket + Socket.IO

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **API Client**: Apollo Client (GraphQL)
- **UI Components**: Headless UI + Custom components

### AI System
- **Content Generation**: OpenAI GPT-4 Turbo
- **Quality Review**: Google Gemini
- **Translation**: Meta NLLB-200 (15 African languages)
- **Image Generation**: DALL-E 3
- **Architecture**: Microservices with message queues

### Infrastructure
- **Hosting**: Contabo VPS
- **Containerization**: Docker + Docker Compose
- **CDN**: Cloudflare
- **Storage**: Backblaze B2
- **Monitoring**: Elasticsearch + Kibana

## 🎯 Key Features

### ✅ Core Functionality
- **AI-Powered Content**: Automated article generation and quality review
- **Real-Time Markets**: Live price data from African exchanges
- **Multi-Language Support**: 15+ African languages with AI translation
- **Community Platform**: Reddit-like features with moderation
- **Premium Content**: Subscription-based access to exclusive content

### ✅ African Market Focus
- **Local Exchanges**: Binance Africa, Luno, Quidax, BuyCoins, Valr, Ice3X
- **Mobile Money**: M-Pesa, Orange Money, MTN Money, EcoCash integration
- **Regional Content**: Country-specific news and market analysis
- **Cultural Adaptation**: AI-powered content localization

### ✅ Performance & Security
- **Sub-500ms Response Times**: Multi-layer caching strategy
- **Single I/O Operations**: Optimized database queries
- **Rate Limiting**: Tier-based API access control
- **Security**: JWT auth, input validation, OWASP compliance

## 📊 Development Scripts

### Backend Scripts
```bash
cd backend

# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:migrate       # Run migrations
npm run db:generate      # Generate Prisma client
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio

# Testing
npm run test             # Run tests
npm run test:watch       # Watch mode tests
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # ESLint
npm run lint:fix         # Fix linting issues
npm run type-check       # TypeScript check
```

### Frontend Scripts
```bash
cd frontend

# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Code Quality
npm run lint             # ESLint
npm run lint:fix         # Fix linting issues
npm run type-check       # TypeScript check

# Testing
npm run test             # Run tests
npm run test:watch       # Watch mode tests
npm run test:coverage    # Coverage report
npm run e2e              # End-to-end tests
```

## 🔧 Configuration

### Environment Variables
See `.env.example` for all required environment variables. Key configurations:

```env
# Database
DATABASE_URL="postgresql://..."
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# AI Services
OPENAI_API_KEY="sk-..."
GOOGLE_AI_API_KEY="..."
NLLB_SERVICE_URL="http://localhost:8080"

# External APIs
BINANCE_AFRICA_API_KEY="..."
LUNO_API_KEY="..."
```

### Docker Services
The application uses Docker Compose for local development:

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm run test                    # Unit tests
npm run test:integration       # Integration tests
npm run test:e2e               # End-to-end tests
```

### Frontend Testing
```bash
cd frontend
npm run test                    # Unit tests
npm run e2e                     # E2E tests with Playwright
```

### Performance Testing
```bash
# Load testing
npm run test:load

# Response time validation
npm run test:performance
```

## 🚀 Deployment

### Production Build
```bash
# Build all services
npm run build:all

# Run in production mode
npm run start:prod
```

### Docker Deployment
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 Documentation

- **[Quick Start Guide](specs/002-coindaily-africa-s/quickstart.md)**: Complete setup instructions
- **[API Documentation](specs/002-coindaily-africa-s/graphql-schema.graphql)**: GraphQL schema and REST APIs
- **[Data Model](specs/002-coindaily-africa-s/data-model.md)**: Database schema and relationships
- **[Implementation Plan](specs/002-coindaily-africa-s/plan.md)**: Development roadmap and phases

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Write tests for all new features
- Follow conventional commit messages
- Ensure all CI checks pass

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `specs/` directory
- **Issues**: Use GitHub Issues for bugs and feature requests
- **Discussions**: Join our development Discord
- **Email**: support@sygn.live

---

**CoinDaily Africa** - Empowering Africa's crypto community with quality content and insights.