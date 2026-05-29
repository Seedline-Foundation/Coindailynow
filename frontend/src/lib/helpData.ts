export interface HelpArticle {
  id: string;
  question: string;
  answer: string;
}

export interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  region: 'global' | 'africa' | 'latam' | 'caribbean';
  articles: HelpArticle[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
  // ========== GLOBAL CATEGORIES ==========
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '🚀',
    region: 'global',
    articles: [
      {
        id: 'gs-1',
        question: 'What is CoinDaily?',
        answer: 'CoinDaily is a premium cryptocurrency news, analysis, and market intelligence platform. We deliver real-time news, deep-dive research reports, creator economy tools, and personalized feeds tailored to global and emerging markets.'
      },
      {
        id: 'gs-2',
        question: 'How do I customize my feed?',
        answer: 'You can customize your feed by completing the onboarding wizard (which sets your initial interests) or by adjusting your topics and preferences in the Settings page. The system uses these preferences to filter and rank articles on your home feed.'
      },
      {
        id: 'gs-3',
        question: 'Is CoinDaily free to use?',
        answer: 'CoinDaily offers a Free Tier with access to basic news, daily summaries, and standard market tickers. To unlock deep-dive research, advanced alpha signals, full creator tools, and unlimited AI Concierge queries, you can upgrade to our Premium or Enterprise subscription plans.'
      },
      {
        id: 'gs-4',
        question: 'How do I connect my Web3 wallet?',
        answer: 'Navigate to the Wallet tab in your dashboard, click "Connect Wallet," and select your preferred provider (MetaMask, Phantom, Coinbase Wallet, etc.). Once connected, you can view your token balances, interact with smart contracts, and manage your account using on-chain credentials.'
      }
    ]
  },
  {
    id: 'wallets-security',
    title: 'Wallets & Security',
    icon: '🔒',
    region: 'global',
    articles: [
      {
        id: 'ws-1',
        question: 'How do I secure my CoinDaily account?',
        answer: 'We recommend enabling Multi-Factor Authentication (MFA) via Google Authenticator or another app-based TOTP provider. Go to Settings > Security, scan the QR code, and enter the verification code. Avoid using SMS-based 2FA as it is vulnerable to SIM-swap attacks.'
      },
      {
        id: 'ws-2',
        question: 'What is a seed phrase and how do I protect it?',
        answer: 'A seed phrase (usually 12 or 24 words) is the master key to your Web3 wallet. Never share it with anyone, including CoinDaily staff. Store it physically offline on paper or metal. Never save it on cloud notes, screenshots, or email.'
      },
      {
        id: 'ws-3',
        question: 'Can CoinDaily access my private keys?',
        answer: 'No. CoinDaily is a non-custodial platform. When you connect a Web3 wallet, all transactions are signed locally on your device via your wallet extension or mobile app. CoinDaily never stores or transmits your private keys.'
      },
      {
        id: 'ws-4',
        question: 'What should I do if my account is compromised?',
        answer: 'If you suspect unauthorized access, immediately go to Settings > Security and change your password. If your Web3 wallet is compromised, transfer all assets to a newly created secure wallet immediately; CoinDaily cannot retrieve funds from a compromised private wallet.'
      }
    ]
  },
  {
    id: 'subscriptions',
    title: 'Subscriptions',
    icon: '💳',
    region: 'global',
    articles: [
      {
        id: 'sub-1',
        question: 'How do I upgrade to Premium?',
        answer: 'Go to the Subscriptions tab in your dashboard, choose a monthly or annual billing cycle, and select your payment method. We support Credit/Debit Cards, local mobile money networks (M-Pesa, MTN, Orange), and cryptocurrency payments (USDC, USDT, BTC).'
      },
      {
        id: 'sub-2',
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes, you can cancel your subscription at any time. Your premium benefits will remain active until the end of your current billing cycle, and no further automatic payments will be charged.'
      },
      {
        id: 'sub-3',
        question: 'How do crypto subscription payments work?',
        answer: 'Crypto payments are processed on-chain. When choosing a crypto payment, you will be prompted to connect your wallet and authorize a token transfer for the plan price. We support stablecoins on Solana, Polygon, and Ethereum.'
      },
      {
        id: 'sub-4',
        question: 'Do you offer student or team discounts?',
        answer: 'Yes! We offer a 50% discount for verified academic accounts and custom pricing for teams/enterprises. Please use the Contact tab to reach our billing department with your credentials to set this up.'
      }
    ]
  },
  {
    id: 'content-editorial',
    title: 'Content & Editorial',
    icon: '📰',
    region: 'global',
    articles: [
      {
        id: 'ce-1',
        question: 'Who writes CoinDaily articles?',
        answer: 'Our articles are authored by an in-house team of professional crypto journalists, independent regional analysts, and verified creators. We maintain strict editorial guidelines to ensure accuracy and objectivity.'
      },
      {
        id: 'ce-2',
        question: 'How do you prevent fake news?',
        answer: 'All published articles go through a multi-stage verification pipeline, combining automated plagiarisms/fact checks, reputation scoring, and human editorial approval. Additionally, articles disclose their citations and on-chain references.'
      },
      {
        id: 'ce-3',
        question: 'Can I write for CoinDaily?',
        answer: 'Yes! Navigate to the Creator Studio tab in the sidebar. Once you verify your profile, you can draft articles, build your subscriber list, and earn rewards (in stablecoins or tokens) based on reader engagement.'
      },
      {
        id: 'ce-4',
        question: 'What is the "Confidence Score" on articles?',
        answer: 'The Confidence Score is an AI-assisted metric that evaluates the reliability of an article\'s sources, the strength of the evidence presented, and the consensus among other reputable outlets. A higher score indicates verified primary source data.'
      }
    ]
  },

  // ========== AFRICA CATEGORIES ==========
  {
    id: 'mobile-money',
    title: 'Mobile Money',
    icon: '📱',
    region: 'africa',
    articles: [
      {
        id: 'af-mm-1',
        question: 'How do I pay with M-Pesa?',
        answer: 'Select M-Pesa at checkout. Enter your phone number (format: +254...), and click "Pay". You will receive an STK Push prompt on your phone to enter your PIN. Once authorized, your CoinDaily subscription will instantly activate.'
      },
      {
        id: 'af-mm-2',
        question: 'Which countries support MTN MoMo and Airtel Money?',
        answer: 'We support MTN Mobile Money and Airtel Money payments in Nigeria, Ghana, Kenya, and Uganda. Select your country during checkout to see the available local operators.'
      },
      {
        id: 'af-mm-3',
        question: 'Are there extra fees for mobile money transactions?',
        answer: 'CoinDaily does not charge any additional fees for mobile money transactions. However, your mobile network operator may apply standard transaction or network fees depending on your tariff plan.'
      }
    ]
  },
  {
    id: 'stablecoins-p2p',
    title: 'Stablecoins & P2P',
    icon: '🔗',
    region: 'africa',
    articles: [
      {
        id: 'af-sp-1',
        question: 'Why are stablecoins popular in Nigeria and Kenya?',
        answer: 'Stablecoins like USDT and USDC allow users to hedge against local currency inflation (Naira, Shilling) and facilitate cross-border trade without the delays and restrictions of traditional bank wire transfers.'
      },
      {
        id: 'af-sp-2',
        question: 'How do I trade P2P safely?',
        answer: 'When using Peer-to-Peer (P2P) exchanges, always use platforms that offer escrow services (like Quidax or Binance). Never release your crypto until you have verified in your bank or mobile money app that the fiat currency has cleared.'
      },
      {
        id: 'af-sp-3',
        question: 'How do I convert USDT back to mobile money?',
        answer: 'You can sell USDT through local exchange partners or P2P markets, choosing M-Pesa, MTN Money, or bank transfer as your payment method. The escrow system holds the crypto until the cash is credited to your mobile money wallet.'
      }
    ]
  },
  {
    id: 'local-exchanges',
    title: 'Local Exchanges',
    icon: '🏦',
    region: 'africa',
    articles: [
      {
        id: 'af-le-1',
        question: 'What are the best crypto exchanges in Africa?',
        answer: 'Popular, compliant exchanges include Luno (South Africa/Nigeria), Quidax (Nigeria), and Yellow Card (pan-African). These platforms allow you to directly deposit local currencies (NGN, KES, ZAR, GHS) via bank transfer or agent networks.'
      },
      {
        id: 'af-le-2',
        question: 'Are crypto exchanges legal in South Africa and Nigeria?',
        answer: 'Yes. South Africa\'s FSCA regulates crypto asset service providers (CASPs) and licenses local exchanges. In Nigeria, the SEC has established a framework for licensing digital asset exchanges, moving away from previous bank bans.'
      }
    ]
  },

  // ========== LATAM CATEGORIES ==========
  {
    id: 'pix-remittances',
    title: 'PIX & Remittances',
    icon: '💸',
    region: 'latam',
    articles: [
      {
        id: 'la-pr-1',
        question: 'How do I purchase subscriptions using PIX in Brazil?',
        answer: 'Choose PIX at checkout. A dynamic QR code and a Copy-and-Paste code will be generated. Open your Brazilian banking app, select "Pagar com PIX", scan or paste the code, and confirm. Your subscription will activate in less than 10 seconds.'
      },
      {
        id: 'la-pr-2',
        question: 'Can I use crypto for remittances to Latin America?',
        answer: 'Yes. Stablecoins are widely used for remittances to Brazil, Argentina, and Mexico. Senders transfer stablecoins on low-fee networks (like Solana or Polygon) to the recipient\'s wallet, who can then liquidate them locally via PIX or bank transfer.'
      }
    ]
  },
  {
    id: 'bitcoin-adoption',
    title: 'Bitcoin Adoption',
    icon: '₿',
    region: 'latam',
    articles: [
      {
        id: 'la-ba-1',
        question: 'What is the status of Bitcoin adoption in El Salvador?',
        answer: 'El Salvador made Bitcoin legal tender in 2021. Businesses are legally required to accept BTC payments via the Lightning Network alongside the US Dollar. Government services, taxes, and daily purchases can all be settled in BTC.'
      },
      {
        id: 'la-ba-2',
        question: 'How is inflation in Argentina impacting crypto?',
        answer: 'High inflation of the Argentine Peso has driven massive adoption of stablecoins (USDT/USDC) and Bitcoin. Many freelancers and remote workers receive payments in crypto to preserve their purchasing power.'
      }
    ]
  },

  // ========== CARIBBEAN CATEGORIES ==========
  {
    id: 'caribbean-banking',
    title: 'Digital Banking',
    icon: '🏝️',
    region: 'caribbean',
    articles: [
      {
        id: 'ca-db-1',
        question: 'Can Caribbean residents open Web3-friendly bank accounts?',
        answer: 'Many traditional banks in the Caribbean maintain strict AML/KYC filters for crypto. However, emerging digital banks and fintech firms in jurisdictions like Barbados, Trinidad, and Saint Lucia offer specialized USD accounts friendly to international exchange transfers.'
      },
      {
        id: 'ca-db-2',
        question: 'What is Jam-Dex in Jamaica?',
        answer: 'Jam-Dex is the Central Bank Digital Currency (CBDC) issued by the Bank of Jamaica. It is peg-backed by the Jamaican dollar, meant for local retail payments via digital wallets, and does not operate on a public decentralized blockchain.'
      }
    ]
  }
];

export function getCategoriesByRegion(region: string): HelpCategory[] {
  const normalized = region.toLowerCase();
  
  // Return global categories + region-specific categories
  return HELP_CATEGORIES.filter(cat => {
    if (cat.region === 'global') return true;
    if (normalized === 'ng' || normalized === 'ke' || normalized === 'za' || normalized === 'gh') {
      return cat.region === 'africa';
    }
    if (normalized === 'br' || normalized === 'py' || normalized === 'cl') {
      return cat.region === 'latam';
    }
    if (normalized === 'tt' || normalized === 'bb' || normalized === 'lc') {
      return cat.region === 'caribbean';
    }
    return false;
  });
}
