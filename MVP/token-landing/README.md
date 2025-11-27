# Joy Token Landing Page

A stunning, high-converting landing page for Joy Token ($JY) presale built with Next.js 14, React 18, TypeScript, Tailwind CSS, and Framer Motion.

## 🚀 Features

- **Hero Section** with FOMO triggers and scarcity indicators
- **Live Stats** showing whitelist members, funds raised, and countdown
- **Tokenomics Visualization** with interactive charts
- **Staking Strategy** display with tiered APR rates
- **Presale Countdown** with dynamic timer and progress tracking
- **Email Capture** integrated with Brevo API
- **Responsive Design** optimized for mobile-first experience
- **Smooth Animations** powered by Framer Motion
- **SEO Optimized** with proper meta tags and structured data

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Brevo (Sendinblue) account for email capture

## 🛠️ Installation

1. Navigate to the token landing directory:
```bash
cd MVP/token-landing
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your values:
```env
# Brevo (Sendinblue) API Configuration
NEXT_PUBLIC_BREVO_API_KEY=your_brevo_api_key_here
NEXT_PUBLIC_BREVO_LIST_ID=your_list_id_here

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://token.coindaily.online
NEXT_PUBLIC_MAIN_SITE_URL=https://coindaily.online

# Presale Configuration
NEXT_PUBLIC_PRESALE_START_DATE=2026-01-15T00:00:00Z
NEXT_PUBLIC_PRESALE_END_DATE=2026-02-15T00:00:00Z
NEXT_PUBLIC_PINKSALE_URL=https://www.pinksale.finance/launchpad/your-token-address
```

## 🎨 Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) to view it in the browser.

## 🏗️ Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with navigation
│   ├── page.tsx             # Homepage
│   ├── presale/page.tsx    # Presale countdown page
│   ├── ambassador/page.tsx # Ambassador program
│   ├── careers/page.tsx    # Careers/hiring page
│   └── whitepaper/page.tsx # Whitepaper page
├── components/
│   ├── Navigation.tsx       # Header navigation
│   ├── Footer.tsx           # Footer component
│   ├── Hero.tsx             # Hero section with CTAs
│   ├── Stats.tsx            # Live statistics
│   ├── WhyJoyToken.tsx      # Value proposition
│   ├── Tokenomics.tsx       # Tokenomics charts
│   ├── StakingStrategy.tsx  # Staking tiers
│   ├── Roadmap.tsx          # Project roadmap
│   ├── HowToBuy.tsx         # Purchase guide
│   ├── EmailCapture.tsx     # Email subscription
│   ├── CountdownTimer.tsx   # Countdown component
│   ├── PresalePhases.tsx    # Presale phase tracker
│   └── SocialProof.tsx      # Social proof indicators
└── styles/
    └── globals.css          # Global styles
```

## 🎯 Key Pages

- `/` - Homepage with full feature showcase
- `/presale` - Dedicated presale countdown and progress
- `/ambassador` - Ambassador program details
- `/careers` - Job openings across Africa and globally
- `/whitepaper` - Comprehensive whitepaper
- `/pitch` - Interactive pitch deck

## 🔗 Integration Points

### Brevo Email Capture
The email capture component integrates with Brevo's API. You'll need to:
1. Create a Brevo account at https://www.brevo.com
2. Generate an API key from your account settings
3. Create an email list and get the list ID
4. Add both to your `.env.local` file

### PinkSale Integration
Update the PinkSale URL in your environment variables once your presale is live.

## 🎨 Customization

### Colors
Update the color scheme in `tailwind.config.js`:
```javascript
colors: {
  primary: { ... },  // Orange gradient
  accent: { ... },   // Purple gradient
}
```

### Content
Update copy and content directly in component files under `src/components/`.

### Images
Place images in the `public/` directory and reference them with `/image-name.jpg`.

## 📱 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Subdomain Setup
Configure your DNS to point `token.coindaily.online` to your deployment:
- Add CNAME record: `token` → your-deployment-url

## 🔒 Security

- Environment variables are never exposed to the client (except `NEXT_PUBLIC_*`)
- API routes handle sensitive operations
- Rate limiting recommended for email capture endpoint

## 📈 Analytics

Add Google Analytics or Plausible tracking ID to track conversions:
```env
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

## 🤝 Contributing

This is a standalone project. For main platform contributions, see the main repository.

## 📄 License

Proprietary - CoinDaily Platform

## 🆘 Support

For issues or questions:
- Email: support@coindaily.online
- Documentation: https://coindaily.online/docs

---

Built with ❤️ for the African crypto community
