# Joy Token Landing Page - Complete Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Git
- Code editor (VS Code recommended)
- Brevo account (for email capture)

### Installation Steps

1. **Navigate to project directory:**
```powershell
cd C:\Users\onech\Desktop\news-platform\MVP\token-landing
```

2. **Install dependencies:**
```powershell
npm install
```

3. **Set up environment variables:**
```powershell
# Copy the example file
copy .env.local.example .env.local

# Edit .env.local with your actual values
notepad .env.local
```

4. **Run development server:**
```powershell
npm run dev
```

5. **Open browser:**
Navigate to http://localhost:3001

## 📋 Environment Variables Setup

### Brevo (Email Service) Setup

1. **Create Brevo Account:**
   - Go to https://www.brevo.com
   - Sign up for free account (300 emails/day free)

2. **Get API Key:**
   - Login to Brevo dashboard
   - Go to Settings → API Keys
   - Create new API key
   - Copy the key

3. **Create Contact List:**
   - Go to Contacts → Lists
   - Create new list (e.g., "Joy Token Whitelist")
   - Note the List ID (shown in URL or list settings)

4. **Add to .env.local:**
```env
NEXT_PUBLIC_BREVO_API_KEY=xkeysib-your-api-key-here
NEXT_PUBLIC_BREVO_LIST_ID=2
```

### Presale Configuration

Update these dates for your actual presale:
```env
NEXT_PUBLIC_PRESALE_START_DATE=2026-01-15T00:00:00Z
NEXT_PUBLIC_PRESALE_END_DATE=2026-02-15T00:00:00Z
```

### PinkSale Integration

Once your token is deployed to PinkSale:
```env
NEXT_PUBLIC_PINKSALE_URL=https://www.pinksale.finance/launchpad/0x...your-address
```

## 🎨 Customization Guide

### Update Token Information

Edit `src/components/Hero.tsx`:
```typescript
// Line 45-55: Update key stats
<div className="bg-gray-900/50...">
  <p className="text-3xl font-bold text-primary-500">5M</p>
  <p className="text-gray-400 text-sm">Max Supply</p>
</div>
```

### Change Color Scheme

Edit `tailwind.config.js`:
```javascript
colors: {
  primary: {
    500: '#f97316',  // Change this for main color
    // ...
  },
  accent: {
    500: '#d946ef',  // Change this for accent color
    // ...
  },
}
```

### Update Social Links

Edit `src/components/Navigation.tsx` and `src/components/Footer.tsx`:
```typescript
<a href="https://twitter.com/yourhandle">Twitter</a>
<a href="https://t.me/yourgroup">Telegram</a>
```

## 🖼️ Adding Images

### Hero Background
1. Create or download a crypto-themed background image
2. Save as `public/hero-bg.jpg`
3. Update Hero component:
```typescript
<div className="absolute inset-0 bg-[url('/hero-bg.jpg')] opacity-20" />
```

### OG Images (Social Media Previews)
1. Create 1200x630px image for social sharing
2. Save as `public/og-image.jpg`
3. Already configured in `src/app/layout.tsx`

### Token Logo
1. Create 512x512px logo
2. Save as `public/logo.png`
3. Update Navigation component

## 🚀 Deployment Guide

### Option 1: Vercel (Recommended - Free)

1. **Install Vercel CLI:**
```powershell
npm i -g vercel
```

2. **Deploy:**
```powershell
vercel
```

3. **Follow prompts:**
   - Link to your account
   - Configure project
   - Deploy

4. **Set environment variables:**
   - Go to Vercel dashboard
   - Project Settings → Environment Variables
   - Add all your .env.local variables

5. **Custom Domain:**
   - Go to Project Settings → Domains
   - Add `token.coindaily.online`
   - Update DNS:
     - Add CNAME record: `token` → `cname.vercel-dns.com`

### Option 2: Netlify

1. **Build project:**
```powershell
npm run build
```

2. **Install Netlify CLI:**
```powershell
npm i -g netlify-cli
```

3. **Deploy:**
```powershell
netlify deploy --prod
```

### Option 3: Self-Hosted (VPS)

1. **Build project:**
```powershell
npm run build
```

2. **Transfer files to VPS:**
```bash
scp -r .next package.json package-lock.json user@your-vps:/var/www/token
```

3. **On VPS:**
```bash
cd /var/www/token
npm install --production
npm start
```

4. **Set up Nginx:**
```nginx
server {
    listen 80;
    server_name token.coindaily.online;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Set up SSL:**
```bash
sudo certbot --nginx -d token.coindaily.online
```

## 📊 Analytics Setup

### Google Analytics

1. Create GA4 property at https://analytics.google.com
2. Get Measurement ID (G-XXXXXXXXXX)
3. Add to `.env.local`:
```env
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

4. Create `src/app/layout.tsx` update:
```typescript
// Add Google Analytics script
{process.env.NEXT_PUBLIC_GA_TRACKING_ID && (
  <script
    async
    src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_TRACKING_ID}`}
  />
)}
```

## 🧪 Testing Checklist

Before launch, test:

- [ ] Email capture works (test subscription)
- [ ] All links work correctly
- [ ] Countdown timer displays correctly
- [ ] Mobile responsive on all pages
- [ ] Forms validate properly
- [ ] Social media links open correctly
- [ ] Images load properly
- [ ] Page load speed < 3 seconds
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Meta tags for social media sharing

## 🔒 Security Checklist

- [ ] Environment variables not exposed in code
- [ ] API routes have rate limiting
- [ ] No sensitive data in git history
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Input validation on all forms

## 📈 Performance Optimization

### Image Optimization
```powershell
# Install sharp for Next.js image optimization
npm install sharp
```

### Caching Strategy
Already configured in `next.config.js`:
```javascript
images: {
  domains: ['coindaily.online'],
  deviceSizes: [640, 750, 828, 1080, 1200],
  imageSizes: [16, 32, 48, 64, 96],
}
```

## 🐛 Troubleshooting

### Build Errors
```powershell
# Clear cache and rebuild
Remove-Item -Recurse -Force .next
npm run build
```

### Port Already in Use
```powershell
# Find process on port 3001
netstat -ano | findstr :3001

# Kill process
taskkill /PID <process_id> /F

# Or use different port
npm run dev -- -p 3002
```

### Email Not Sending
1. Check Brevo API key is correct
2. Verify list ID exists
3. Check browser console for errors
4. Test API route: POST to `/api/subscribe` with JSON body

## 📱 Progressive Web App (Optional)

To make it installable:

1. Create `public/manifest.json`:
```json
{
  "name": "Joy Token",
  "short_name": "JY Token",
  "description": "Africa's Premier Crypto Utility Token",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#f97316",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

2. Update `src/app/layout.tsx`:
```typescript
<link rel="manifest" href="/manifest.json" />
```

## 🎯 Marketing Checklist

Pre-launch:
- [ ] Create social media accounts
- [ ] Design announcement graphics
- [ ] Prepare email templates
- [ ] Set up Twitter/Telegram bots
- [ ] Create press kit

Post-launch:
- [ ] Monitor email signups
- [ ] Track referral sources
- [ ] A/B test CTAs
- [ ] Collect user feedback
- [ ] Optimize conversion funnel

## 📞 Support

For technical issues:
- Email: dev@coindaily.online
- GitHub Issues: [repo-link]

For business inquiries:
- Email: partnerships@coindaily.online

---

## 🎉 Launch Day Checklist

- [ ] Final build tested on staging
- [ ] Environment variables configured on production
- [ ] DNS records updated
- [ ] SSL certificate active
- [ ] Analytics tracking verified
- [ ] Email capture tested
- [ ] Social media posts scheduled
- [ ] Team notified and ready
- [ ] Monitoring dashboards ready
- [ ] Backup plan in place

**Good luck with your launch! 🚀**
