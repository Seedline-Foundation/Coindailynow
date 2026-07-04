# Sygn - Coming Soon Landing Page

A beautiful, standalone "Coming Soon" landing page for Sygn with email capture integration using Resend.

## 🚀 Features

- **Countdown Timer**: Live countdown to launch date
- **Email Waitlist**: Capture emails with Resend integration
- **Beautiful Design**: Animated gradient background with modern UI
- **Responsive**: Works perfectly on all devices
- **Email Notifications**: Automatic welcome emails via Resend
- **Database Storage**: SQLite database for email storage
- **TypeScript**: Fully typed for better development experience

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Resend API key (sign up at [resend.com](https://resend.com))

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd coming
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your settings:

```env
# Database URL - Using SQLite for simplicity
DATABASE_URL="file:./waitlist.db"

# Resend API Configuration
RESEND_API_KEY=your_actual_resend_api_key
RESEND_FROM_EMAIL=noreply@sygn.com

# Launch Date (YYYY-MM-DD)
NEXT_PUBLIC_LAUNCH_DATE=2025-12-31

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

### 3. Set Up Database

Generate Prisma client and create database:

```bash
npx prisma generate
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

The landing page will be available at [http://localhost:3001](http://localhost:3001)

## 📦 Production Build

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Production Server

1. Upload the entire `coming` directory to your server
2. Install dependencies: `npm install --production`
3. Set up environment variables in `.env.local`
4. Run database migrations: `npx prisma db push`
5. Build: `npm run build`
6. Start with PM2: `pm2 start npm --name "sygn-coming-soon" -- start`

## 🔧 Configuration

### Change Launch Date

Edit the `NEXT_PUBLIC_LAUNCH_DATE` in `.env.local`:

```env
NEXT_PUBLIC_LAUNCH_DATE=2026-01-15
```

### Customize Branding

Edit `src/pages/index.tsx` to change:
- Colors and gradients
- Feature descriptions
- Social media links
- Text content

### Email Template

Customize the welcome email in `src/pages/api/waitlist/subscribe.ts`

## 📊 View Waitlist Statistics

Access the stats endpoint to see subscriber count:

```bash
curl http://localhost:3001/api/waitlist/stats
```

Get full list (for admin use):

```bash
curl http://localhost:3001/api/waitlist/stats?includeList=true
```

## 🔐 Security Features

- Email validation
- Rate limiting on IP addresses
- Duplicate email prevention
- User agent and IP tracking
- Secure database storage

## 🚦 Switching to Main App

When ready to launch:

1. **Option 1: Redirect Method**
   - Add redirect in `next.config.js`
   - Point traffic to main app

2. **Option 2: DNS/Proxy Method**
   - Point domain to main app
   - Keep coming soon page as subdomain

3. **Option 3: Delete Method**
   - Simply remove the `coming` directory
   - Deploy main app in its place

## 📁 Project Structure

```
coming/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── pages/
│   │   ├── api/
│   │   │   └── waitlist/
│   │   │       ├── subscribe.ts  # Email subscription API
│   │   │       └── stats.ts      # Statistics API
│   │   ├── _app.tsx              # App wrapper
│   │   ├── _document.tsx         # HTML document
│   │   └── index.tsx             # Landing page
│   └── styles/
│       └── globals.css           # Global styles
├── .env.local                    # Environment variables
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── tailwind.config.js            # Tailwind CSS config
└── tsconfig.json                 # TypeScript config
```

## 🎨 Customization Guide

### Colors

Edit `src/pages/index.tsx` to change gradient colors:

```tsx
// Background gradient
className="bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900"

// Heading gradient
className="bg-gradient-to-r from-yellow-400 via-purple-400 to-blue-400"

// Button gradient
className="bg-gradient-to-r from-purple-600 to-blue-600"
```

### Features Section

Edit the features array in `src/pages/index.tsx`:

```tsx
{[
  {
    icon: '🤖',
    title: 'Your Feature',
    description: 'Your description'
  },
  // Add more features
]}
```

## 📧 Resend Integration

The landing page uses Resend for:
- Welcome email to new subscribers
- Beautiful HTML email template
- Automatic email delivery

Make sure to:
1. Verify your domain in Resend dashboard
2. Update `RESEND_FROM_EMAIL` to use verified domain
3. Test email delivery before launch

## 🐛 Troubleshooting

### Database Issues

```bash
# Reset database
rm -f waitlist.db
npx prisma db push
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Email Not Sending

- Check Resend API key is correct
- Verify sender email domain is verified in Resend
- Check console logs for error messages

## 📝 License

This is part of the Sygn platform. All rights reserved.

## 🤝 Support

For issues or questions, contact the Sygn development team.

---

**Built with ❤️ for Africa's Crypto Community**
