/**
 * Seed launch publishing queue: 30+ day-1 articles + 14 daily scheduled slots.
 *
 * Generates realistic crypto/Africa-focused content across categories:
 *   market analysis, regulatory news, exchange updates, DeFi, NFTs, education
 *
 * Covers key African markets: Nigeria, Kenya, South Africa, Ghana
 *
 * Idempotent — skips articles whose slugs already exist.
 *
 * Usage:
 *   npx ts-node --transpile-only scripts/seed-launch-queue.ts
 *   npx ts-node --transpile-only scripts/seed-launch-queue.ts --dry-run
 *
 * Env vars (all optional):
 *   LAUNCH_DATE           – ISO date string for launch day (default: tomorrow)
 *   LAUNCH_DAY_ONE_COUNT  – override day-1 article count (default: 32)
 *   LAUNCH_DAILY_COUNT    – override post-launch daily count (default: 14)
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

// ---------------------------------------------------------------------------
// Content definitions
// ---------------------------------------------------------------------------

interface ArticleSeed {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categorySlug: string;
  tags: string;
  territories: string[];
  readingTimeMinutes: number;
  priority: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
}

const CATEGORY_SLUGS = [
  'market-analysis',
  'regulatory-news',
  'exchange-updates',
  'defi',
  'nfts',
  'education',
] as const;

type CategorySlug = (typeof CATEGORY_SLUGS)[number];

const CATEGORY_FALLBACK: Record<CategorySlug, { name: string; description: string }> = {
  'market-analysis': { name: 'Market Analysis', description: 'Crypto market analysis and price insights for African markets' },
  'regulatory-news': { name: 'Regulatory News', description: 'Cryptocurrency regulation updates across Africa' },
  'exchange-updates': { name: 'Exchange Updates', description: 'Crypto exchange news and platform updates' },
  'defi': { name: 'DeFi', description: 'Decentralized finance news and developments in Africa' },
  'nfts': { name: 'NFTs', description: 'NFT market news and digital collectibles in Africa' },
  'education': { name: 'Education', description: 'Cryptocurrency education and learning resources' },
};

// ---- Launch day articles (32 total) ----------------------------------------

const LAUNCH_DAY_ARTICLES: ArticleSeed[] = [
  // Market Analysis (6)
  {
    title: 'Bitcoin Surges Past $70K as African Trading Volumes Hit Record Highs',
    slug: 'launch-bitcoin-surges-70k-african-volumes-record',
    excerpt: 'Bitcoin has broken through the $70,000 barrier, with African peer-to-peer platforms reporting unprecedented trading activity across Nigeria, Kenya, and South Africa.',
    content: '<p>Bitcoin reached a new milestone today, surging past $70,000 as global markets rallied on institutional inflows. African exchanges have seen a notable spike in activity, with P2P volumes on platforms like Paxful and Noones climbing by over 40% week-over-week.</p><p>Nigeria continues to lead the continent in trading volume, followed by Kenya and South Africa. Analysts attribute the surge to growing confidence in digital assets as a hedge against local currency depreciation and rising inflation across the continent.</p><p>Market data shows that the BTC/NGN pair saw over $15 million in weekly volume, while BTC/KES and BTC/ZAR pairs also posted double-digit percentage gains. Industry experts suggest this trend reflects deepening crypto adoption across African economies.</p>',
    categorySlug: 'market-analysis',
    tags: JSON.stringify(['bitcoin', 'price-analysis', 'africa', 'trading-volume', 'p2p']),
    territories: ['NG', 'KE', 'ZA'],
    readingTimeMinutes: 5,
    priority: 'HIGH',
    seoTitle: 'Bitcoin Surges Past $70K – African Trading Volumes at Record Highs',
    seoDescription: 'Bitcoin breaks $70,000 as African crypto trading volumes reach all-time highs on P2P platforms across Nigeria, Kenya, and South Africa.',
    seoKeywords: JSON.stringify(['bitcoin price', 'african crypto', 'trading volume', 'P2P trading', 'Nigeria crypto']),
  },
  {
    title: 'Ethereum Staking Gains Momentum in Kenya as Validators Grow 200%',
    slug: 'launch-ethereum-staking-kenya-validators-grow',
    excerpt: 'Kenya is emerging as a staking hub for Ethereum, with the number of validators operated from the country more than tripling in the past quarter.',
    content: '<p>Kenya\'s tech-savvy population is increasingly embracing Ethereum staking, with validator counts rising 200% over the last three months. Nairobi-based blockchain firms report growing demand for staking-as-a-service products as ETH holders look for yield opportunities.</p><p>The trend aligns with Kenya\'s broader digital transformation agenda and the country\'s high mobile money adoption rates. Industry analysts say that staking provides an attractive passive income opportunity for Kenyan crypto holders, especially amid volatile local markets.</p>',
    categorySlug: 'market-analysis',
    tags: JSON.stringify(['ethereum', 'staking', 'kenya', 'validators', 'yield']),
    territories: ['KE'],
    readingTimeMinutes: 4,
    priority: 'HIGH',
    seoTitle: 'Ethereum Staking in Kenya – Validators Grow 200%',
    seoDescription: 'Kenya emerges as an Ethereum staking hub with validator count tripling in Q3. Learn about staking opportunities in East Africa.',
    seoKeywords: JSON.stringify(['ethereum staking', 'Kenya crypto', 'validators', 'staking rewards']),
  },
  {
    title: 'Naira Volatility Drives Nigerian Crypto Adoption to New Heights',
    slug: 'launch-naira-volatility-nigerian-crypto-adoption',
    excerpt: 'As the Nigerian naira faces continued depreciation against major currencies, citizens are increasingly turning to Bitcoin and stablecoins for value preservation.',
    content: '<p>The Nigerian naira has lost over 30% of its value against the US dollar in the past year, prompting a wave of crypto adoption among everyday Nigerians. Stablecoins like USDT and USDC have become popular hedging instruments, with P2P trading platforms reporting surging demand.</p><p>Local exchanges have introduced naira on-ramps via mobile money and bank transfers, making it easier than ever for Nigerians to access digital assets. Market analysts note that this trend is not purely speculative — many Nigerians view crypto as a practical tool for remittances and cross-border payments.</p>',
    categorySlug: 'market-analysis',
    tags: JSON.stringify(['nigeria', 'naira', 'stablecoins', 'crypto-adoption', 'usdt']),
    territories: ['NG'],
    readingTimeMinutes: 5,
    priority: 'HIGH',
    seoTitle: 'Naira Volatility Fuels Nigerian Crypto Adoption',
    seoDescription: 'Nigerian crypto adoption soars as naira depreciation drives demand for Bitcoin and stablecoins as value-preservation tools.',
    seoKeywords: JSON.stringify(['Nigeria crypto', 'naira depreciation', 'stablecoins', 'USDT Nigeria']),
  },
  {
    title: 'South African Rand Weakness Creates Opportunity for Crypto Arbitrage',
    slug: 'launch-south-african-rand-crypto-arbitrage',
    excerpt: 'Traders are capitalizing on the ZAR-USD spread across local and international exchanges, with crypto arbitrage strategies gaining popularity among South African investors.',
    content: '<p>South African crypto traders have found new opportunities in arbitrage strategies as the rand weakens against the US dollar. The premium on Bitcoin traded on South African exchanges versus global prices has fluctuated between 2-5%, creating profitable arbitrage windows.</p><p>VALR and Luno, two of South Africa\'s largest exchanges, have seen increased institutional activity as professional trading firms deploy automated strategies to capture these spreads. The trend highlights the growing sophistication of the South African crypto market.</p>',
    categorySlug: 'market-analysis',
    tags: JSON.stringify(['south-africa', 'arbitrage', 'rand', 'bitcoin', 'trading']),
    territories: ['ZA'],
    readingTimeMinutes: 4,
    priority: 'NORMAL',
    seoTitle: 'South African Rand Weakness Opens Crypto Arbitrage Opportunities',
    seoDescription: 'South African traders exploit ZAR-USD spreads for crypto arbitrage profits on local exchanges.',
  },
  {
    title: 'Ghana Cedi Under Pressure: How Ghanaians Are Hedging With Crypto',
    slug: 'launch-ghana-cedi-pressure-crypto-hedging',
    excerpt: 'Ghanaian investors are diversifying into digital assets as the cedi faces economic headwinds, with local exchanges seeing a 150% increase in new sign-ups.',
    content: '<p>The Ghanaian cedi has faced significant pressure in recent months, pushing more citizens toward cryptocurrency as a hedge. Local platforms report a 150% surge in new account registrations, with Bitcoin and USDT being the most popular choices.</p><p>The Bank of Ghana\'s CBDC pilot, the e-Cedi, has also contributed to broader digital currency awareness, inadvertently fueling interest in decentralized alternatives. Ghanaian blockchain startups are seizing the opportunity to build educational platforms and accessible trading tools.</p>',
    categorySlug: 'market-analysis',
    tags: JSON.stringify(['ghana', 'cedi', 'crypto-hedging', 'stablecoins', 'adoption']),
    territories: ['GH'],
    readingTimeMinutes: 4,
    priority: 'NORMAL',
  },
  {
    title: 'Weekly African Crypto Market Roundup: Top Gainers and Losers',
    slug: 'launch-weekly-african-crypto-roundup-gainers-losers',
    excerpt: 'Our first weekly roundup covers the top-performing and worst-performing crypto assets across major African markets, with insights on what drove the moves.',
    content: '<p>Welcome to CoinDaily\'s inaugural Weekly African Crypto Market Roundup. This week saw significant movement across the board, with Solana leading the gainers at +18% in NGN terms, while XRP dipped 5% against the KES.</p><p>Key takeaways: Bitcoin continues its dominance in African P2P trading, stablecoins are gaining ground in West Africa, and DeFi tokens are seeing increased interest from South African and Kenyan traders. Stay tuned for our in-depth analysis of each market segment.</p>',
    categorySlug: 'market-analysis',
    tags: JSON.stringify(['market-roundup', 'weekly', 'africa', 'gainers', 'losers']),
    territories: ['NG', 'KE', 'ZA', 'GH'],
    readingTimeMinutes: 6,
    priority: 'HIGH',
  },

  // Regulatory News (6)
  {
    title: 'Nigeria SEC Unveils New Framework for Digital Asset Exchanges',
    slug: 'launch-nigeria-sec-digital-asset-framework',
    excerpt: 'The Nigerian Securities and Exchange Commission has released a comprehensive regulatory framework for crypto exchanges operating in the country, marking a new era for the industry.',
    content: '<p>The Nigerian SEC has published its long-awaited regulatory framework for digital asset service providers, establishing clear guidelines for exchange licensing, custody requirements, and investor protection. The framework mandates that all crypto platforms serving Nigerian users must register within 180 days.</p><p>Industry leaders have welcomed the move, noting that regulatory clarity will attract institutional capital and improve consumer confidence. The framework also addresses stablecoin issuance, token listings, and anti-money laundering compliance.</p>',
    categorySlug: 'regulatory-news',
    tags: JSON.stringify(['nigeria', 'sec', 'regulation', 'exchanges', 'compliance']),
    territories: ['NG'],
    readingTimeMinutes: 6,
    priority: 'HIGH',
    seoTitle: 'Nigeria SEC Releases Digital Asset Exchange Framework',
    seoDescription: 'Nigerian SEC publishes comprehensive crypto exchange regulatory framework requiring licensing within 180 days.',
    seoKeywords: JSON.stringify(['Nigeria SEC', 'crypto regulation', 'digital asset framework', 'exchange licensing']),
  },
  {
    title: 'Kenya Central Bank Explores CBDC Pilot With Blockchain Startups',
    slug: 'launch-kenya-central-bank-cbdc-pilot',
    excerpt: 'The Central Bank of Kenya is partnering with local blockchain companies for a CBDC proof-of-concept, potentially transforming the country\'s payments landscape.',
    content: '<p>The Central Bank of Kenya (CBK) has announced a collaboration with three Nairobi-based blockchain firms to develop a CBDC proof-of-concept. The digital shilling pilot aims to enhance financial inclusion and reduce transaction costs in the M-Pesa-dominated payments ecosystem.</p><p>The pilot will run for 12 months and focus on cross-border remittances and merchant payments. The CBK emphasized that this initiative complements rather than replaces existing mobile money infrastructure.</p>',
    categorySlug: 'regulatory-news',
    tags: JSON.stringify(['kenya', 'cbdc', 'central-bank', 'digital-shilling', 'fintech']),
    territories: ['KE'],
    readingTimeMinutes: 5,
    priority: 'HIGH',
  },
  {
    title: 'South Africa FSCA Grants First Batch of Crypto Licenses',
    slug: 'launch-south-africa-fsca-crypto-licenses',
    excerpt: 'South Africa\'s Financial Sector Conduct Authority has issued its first round of crypto asset service provider licenses, legitimizing major platforms operating in the market.',
    content: '<p>The FSCA has granted crypto asset service provider (CASP) licenses to 15 firms, including VALR, Luno, and AltCoinTrader. This milestone follows the landmark declaration of crypto assets as financial products under the Financial Advisory and Intermediary Services Act.</p><p>Licensed firms must now comply with strict capital adequacy, cybersecurity, and consumer protection requirements. The FSCA plans to review additional applications on a rolling basis throughout the year.</p>',
    categorySlug: 'regulatory-news',
    tags: JSON.stringify(['south-africa', 'fsca', 'licensing', 'regulation', 'compliance']),
    territories: ['ZA'],
    readingTimeMinutes: 5,
    priority: 'HIGH',
  },
  {
    title: 'Ghana Bank of Ghana Publishes Draft Crypto Regulatory Guidelines',
    slug: 'launch-ghana-bank-draft-crypto-guidelines',
    excerpt: 'The Bank of Ghana has released draft regulations for cryptocurrency activities, seeking public comment on proposed licensing and consumer protection measures.',
    content: '<p>The Bank of Ghana (BoG) has published draft regulatory guidelines for cryptocurrency service providers, opening a 90-day public consultation period. The proposed framework covers exchange licensing, custody standards, and advertising restrictions.</p><p>The draft builds on lessons learned from the e-Cedi pilot and incorporates recommendations from the Ghana Fintech and Payments Association. Industry stakeholders are encouraged to submit comments before the consultation deadline.</p>',
    categorySlug: 'regulatory-news',
    tags: JSON.stringify(['ghana', 'bank-of-ghana', 'regulation', 'draft-guidelines', 'consultation']),
    territories: ['GH'],
    readingTimeMinutes: 4,
    priority: 'NORMAL',
  },
  {
    title: 'African Union Proposes Continental Crypto Regulatory Harmonization',
    slug: 'launch-african-union-continental-crypto-harmonization',
    excerpt: 'The African Union is pushing for a unified approach to cryptocurrency regulation across member states, aiming to reduce fragmentation and boost cross-border digital asset flows.',
    content: '<p>The African Union Commission has proposed a continental framework for harmonizing cryptocurrency regulations across its 55 member states. The initiative, backed by the African Development Bank, seeks to create common standards for licensing, AML compliance, and consumer protection.</p><p>The proposal has been met with cautious optimism from industry leaders who have long called for regulatory consistency across African markets. A working group of regulators from Nigeria, Kenya, South Africa, and Ghana will lead the initial drafting process.</p>',
    categorySlug: 'regulatory-news',
    tags: JSON.stringify(['african-union', 'regulation', 'harmonization', 'cross-border', 'policy']),
    territories: ['NG', 'KE', 'ZA', 'GH'],
    readingTimeMinutes: 5,
    priority: 'NORMAL',
  },
  {
    title: 'Tax Implications of Crypto Trading in Africa: A Country-by-Country Guide',
    slug: 'launch-crypto-tax-implications-africa-guide',
    excerpt: 'Understanding crypto tax obligations across Africa\'s major markets — a comprehensive guide covering Nigeria, Kenya, South Africa, and Ghana.',
    content: '<p>As cryptocurrency adoption grows across Africa, understanding tax obligations becomes increasingly important. This guide breaks down the current crypto tax landscape across four major markets.</p><p>South Africa has the most developed framework, treating crypto gains as capital gains or income depending on trading frequency. Nigeria\'s tax position is evolving following the SEC framework, while Kenya and Ghana are still developing comprehensive crypto tax guidance.</p><p>We recommend consulting local tax advisors as regulations continue to evolve across the continent.</p>',
    categorySlug: 'regulatory-news',
    tags: JSON.stringify(['tax', 'regulation', 'guide', 'africa', 'compliance']),
    territories: ['NG', 'KE', 'ZA', 'GH'],
    readingTimeMinutes: 7,
    priority: 'NORMAL',
  },

  // Exchange Updates (5)
  {
    title: 'Binance Africa Partners With Local Banks for Seamless Fiat On-Ramps',
    slug: 'launch-binance-africa-local-bank-partnerships',
    excerpt: 'Binance has announced partnerships with leading banks across Nigeria, Kenya, and South Africa to enable direct fiat deposits and withdrawals for African users.',
    content: '<p>Binance has expanded its African operations with new banking partnerships that enable seamless fiat on-ramps across three major markets. Nigerian users can now deposit naira directly from their bank accounts, while Kenyan and South African users gain access to similar KES and ZAR deposit channels.</p><p>The partnerships aim to reduce friction for new users and compete with local exchanges that have traditionally had stronger fiat integration. Binance Africa\'s managing director stated that the continent remains a top priority for the company\'s growth strategy.</p>',
    categorySlug: 'exchange-updates',
    tags: JSON.stringify(['binance', 'fiat-onramp', 'banking', 'partnerships', 'africa']),
    territories: ['NG', 'KE', 'ZA'],
    readingTimeMinutes: 4,
    priority: 'HIGH',
  },
  {
    title: 'Luno Launches Zero-Fee Trading Promotion for South African Users',
    slug: 'launch-luno-zero-fee-south-africa-promotion',
    excerpt: 'Luno is waiving trading fees for South African users for the next 30 days as the exchange celebrates a milestone of 10 million users on the continent.',
    content: '<p>Luno, one of Africa\'s most popular cryptocurrency exchanges, has launched a zero-fee trading promotion for its South African user base. The campaign coincides with the platform reaching 10 million registered users across Africa.</p><p>The promotion applies to BTC/ZAR and ETH/ZAR spot trading pairs and will run for 30 days. Luno\'s CEO credited the milestone to increasing crypto awareness and improved regulatory clarity in South Africa following the FSCA licensing process.</p>',
    categorySlug: 'exchange-updates',
    tags: JSON.stringify(['luno', 'south-africa', 'zero-fee', 'promotion', 'exchange']),
    territories: ['ZA'],
    readingTimeMinutes: 3,
    priority: 'NORMAL',
  },
  {
    title: 'Quidax Expands to Ghana With Mobile Money Integration',
    slug: 'launch-quidax-expands-ghana-mobile-money',
    excerpt: 'Nigerian-founded exchange Quidax is entering the Ghanaian market with full mobile money support, allowing users to buy crypto directly from their MoMo wallets.',
    content: '<p>Quidax, the Nigerian cryptocurrency exchange, has officially launched operations in Ghana with native mobile money integration. Ghanaian users can now buy and sell Bitcoin, Ethereum, and USDT using their MTN MoMo or Vodafone Cash wallets.</p><p>The expansion marks Quidax\'s third market in West Africa and reflects the growing demand for crypto services integrated with Africa\'s dominant payment method. The platform plans to add support for additional Ghanaian payment channels in the coming months.</p>',
    categorySlug: 'exchange-updates',
    tags: JSON.stringify(['quidax', 'ghana', 'mobile-money', 'expansion', 'exchange']),
    territories: ['GH', 'NG'],
    readingTimeMinutes: 4,
    priority: 'NORMAL',
  },
  {
    title: 'Yellow Card Raises $50M Series C to Expand Across 20 African Markets',
    slug: 'launch-yellow-card-series-c-african-expansion',
    excerpt: 'Pan-African crypto exchange Yellow Card has closed a $50 million Series C round, with plans to expand into 20 countries across the continent by year-end.',
    content: '<p>Yellow Card, the pan-African cryptocurrency platform, has raised $50 million in a Series C funding round led by Polychain Capital and Valar Ventures. The company plans to use the funds to expand from its current 12 markets to 20 African countries by year-end.</p><p>The raise is one of the largest for an African crypto company and signals strong investor confidence in the continent\'s digital asset market. Yellow Card will also invest in product development, including new DeFi features and institutional trading tools.</p>',
    categorySlug: 'exchange-updates',
    tags: JSON.stringify(['yellow-card', 'funding', 'series-c', 'expansion', 'africa']),
    territories: ['NG', 'KE', 'ZA', 'GH'],
    readingTimeMinutes: 4,
    priority: 'HIGH',
  },
  {
    title: 'VALR Introduces Instant Crypto-to-Fiat Conversions for Merchants',
    slug: 'launch-valr-instant-crypto-fiat-merchants',
    excerpt: 'South African exchange VALR launches a merchant solution enabling businesses to accept crypto payments and receive instant rand settlements.',
    content: '<p>VALR has unveiled a merchant payment solution that allows South African businesses to accept cryptocurrency payments while receiving instant settlements in South African rand. The product targets e-commerce platforms and brick-and-mortar retailers looking to tap into the growing crypto-paying consumer base.</p><p>The solution supports Bitcoin, Ethereum, and major stablecoins, with automatic conversion to ZAR at the point of sale. VALR\'s CEO described it as a bridge between the traditional and digital economies in South Africa.</p>',
    categorySlug: 'exchange-updates',
    tags: JSON.stringify(['valr', 'merchants', 'payments', 'south-africa', 'crypto-fiat']),
    territories: ['ZA'],
    readingTimeMinutes: 4,
    priority: 'NORMAL',
  },

  // DeFi (5)
  {
    title: 'DeFi Protocol Aave Sees Surge in African Users After Multi-Chain Expansion',
    slug: 'launch-aave-surge-african-users-multi-chain',
    excerpt: 'Aave\'s expansion to low-cost chains has opened DeFi lending to African users, with wallet addresses from the continent growing 300% in the past quarter.',
    content: '<p>Aave, one of the largest decentralized lending protocols, has seen a dramatic increase in African user activity following its expansion to Polygon, Arbitrum, and Base. The lower gas fees on these Layer 2 networks have made DeFi lending and borrowing accessible to users in Nigeria, Kenya, and South Africa.</p><p>Data from DefiLlama shows that wallet addresses identified as originating from African IP ranges have tripled since the multi-chain expansion. Analysts see this as a sign that DeFi is moving beyond crypto-native users into mainstream adoption on the continent.</p>',
    categorySlug: 'defi',
    tags: JSON.stringify(['aave', 'defi', 'lending', 'layer-2', 'africa']),
    territories: ['NG', 'KE', 'ZA'],
    readingTimeMinutes: 5,
    priority: 'HIGH',
  },
  {
    title: 'Kenyan Startup Launches Africa\'s First Decentralized Remittance Protocol',
    slug: 'launch-kenyan-startup-decentralized-remittance-protocol',
    excerpt: 'A Nairobi-based DeFi startup has launched a decentralized protocol specifically designed for cross-border remittances across African corridors.',
    content: '<p>A Nairobi-based startup has launched what it calls Africa\'s first decentralized remittance protocol, targeting the $48 billion annual remittance market to and within the continent. The protocol uses stablecoin liquidity pools and local on-ramp partners to enable near-instant, low-cost transfers.</p><p>The initial launch covers the Kenya-Nigeria and Kenya-Uganda corridors, with plans to add South Africa, Ghana, and Tanzania in the next phase. Early users report transaction costs of less than 1%, compared to 8-9% charged by traditional money transfer operators.</p>',
    categorySlug: 'defi',
    tags: JSON.stringify(['defi', 'remittances', 'kenya', 'stablecoins', 'cross-border']),
    territories: ['KE', 'NG'],
    readingTimeMinutes: 5,
    priority: 'HIGH',
  },
  {
    title: 'Yield Farming Opportunities in Africa: Where to Find the Best Returns',
    slug: 'launch-yield-farming-africa-best-returns',
    excerpt: 'A guide to the most promising DeFi yield farming opportunities accessible to African investors, from stablecoin pools to liquidity mining programs.',
    content: '<p>As DeFi adoption grows in Africa, yield farming has become an increasingly popular strategy among crypto-savvy investors. This guide covers the top yield farming opportunities currently available, focusing on platforms with low minimum requirements and reasonable gas fees.</p><p>Stablecoin pools on Aave and Compound offer steady 4-8% APY with relatively low risk, while newer protocols on Polygon and Base offer higher yields for liquidity providers. We break down the risk-reward profiles and help you choose the right strategy for your investment goals.</p>',
    categorySlug: 'defi',
    tags: JSON.stringify(['defi', 'yield-farming', 'stablecoins', 'guide', 'investing']),
    territories: ['NG', 'KE', 'ZA', 'GH'],
    readingTimeMinutes: 6,
    priority: 'NORMAL',
  },
  {
    title: 'Nigerian DeFi Users Hit by Smart Contract Exploit: Lessons Learned',
    slug: 'launch-nigerian-defi-smart-contract-exploit-lessons',
    excerpt: 'A DeFi protocol popular among Nigerian users suffered a $2M exploit, highlighting the importance of security audits and risk management in decentralized finance.',
    content: '<p>A DeFi protocol that had gained significant traction among Nigerian users suffered a $2 million smart contract exploit last week. The vulnerability was traced to an unaudited bridge contract that allowed attackers to drain liquidity pools.</p><p>The incident serves as a stark reminder of the risks inherent in DeFi. We examine what went wrong, how affected users can seek recourse, and the security best practices every DeFi participant should follow — from checking audit reports to using hardware wallets and limiting exposure.</p>',
    categorySlug: 'defi',
    tags: JSON.stringify(['defi', 'security', 'exploit', 'nigeria', 'smart-contracts']),
    territories: ['NG'],
    readingTimeMinutes: 5,
    priority: 'HIGH',
  },
  {
    title: 'How Mobile-First DeFi Apps Are Reaching the Unbanked in East Africa',
    slug: 'launch-mobile-first-defi-unbanked-east-africa',
    excerpt: 'Mobile-optimized DeFi applications are bridging the financial inclusion gap in East Africa, bringing savings, lending, and insurance products to those without bank accounts.',
    content: '<p>A new generation of mobile-first DeFi applications is targeting East Africa\'s unbanked population, leveraging the region\'s high smartphone penetration and mobile money infrastructure. These apps integrate directly with M-Pesa and Airtel Money, allowing users to access decentralized savings, lending, and micro-insurance products.</p><p>Projects like Kotani Pay and Celo-based dApps are leading the charge, with user-friendly interfaces designed for first-time DeFi participants. The potential impact is enormous — over 60% of East Africans remain unbanked, representing a massive opportunity for financial inclusion through DeFi.</p>',
    categorySlug: 'defi',
    tags: JSON.stringify(['defi', 'financial-inclusion', 'mobile', 'east-africa', 'unbanked']),
    territories: ['KE', 'GH'],
    readingTimeMinutes: 5,
    priority: 'NORMAL',
  },

  // NFTs (5)
  {
    title: 'African Digital Art Boom: NFT Sales From the Continent Triple in 2024',
    slug: 'launch-african-digital-art-nft-sales-triple',
    excerpt: 'NFT sales from African creators have tripled year-over-year, with Nigerian and South African artists leading a cultural renaissance on the blockchain.',
    content: '<p>The African NFT art scene is experiencing explosive growth, with sales from continent-based creators tripling compared to the previous year. Platforms like OpenSea and Foundation report a surge in collections from Nigerian, South African, Kenyan, and Ghanaian artists.</p><p>Notable collections exploring Afrofuturism, traditional patterns, and contemporary African life have attracted global collectors. The trend is being fueled by a growing network of African NFT communities, galleries, and educational initiatives that support emerging digital artists.</p>',
    categorySlug: 'nfts',
    tags: JSON.stringify(['nfts', 'digital-art', 'africa', 'artists', 'culture']),
    territories: ['NG', 'ZA', 'KE', 'GH'],
    readingTimeMinutes: 5,
    priority: 'HIGH',
  },
  {
    title: 'Lagos NFT Week Draws Global Collectors to Nigeria\'s Thriving Web3 Scene',
    slug: 'launch-lagos-nft-week-global-collectors-web3',
    excerpt: 'The inaugural Lagos NFT Week has attracted over 5,000 attendees and global collectors, showcasing Nigeria\'s position as a leading hub for African digital art.',
    content: '<p>Lagos NFT Week, a first-of-its-kind event celebrating African digital art and Web3 culture, has drawn over 5,000 attendees from across the globe. The week-long festival featured exhibitions, artist talks, live minting events, and panel discussions on the future of African NFTs.</p><p>Several Nigerian artists unveiled exclusive collections during the event, with some pieces selling for over $50,000. The event has been hailed as a milestone for Africa\'s Web3 creative economy and plans are already underway for an expanded edition next year.</p>',
    categorySlug: 'nfts',
    tags: JSON.stringify(['nfts', 'lagos', 'nigeria', 'web3', 'art-events']),
    territories: ['NG'],
    readingTimeMinutes: 4,
    priority: 'NORMAL',
  },
  {
    title: 'South African Musicians Embrace NFTs for Fan Engagement and Royalties',
    slug: 'launch-south-african-musicians-nfts-royalties',
    excerpt: 'South African music artists are using NFTs to create new revenue streams and deepen fan connections, from tokenized albums to exclusive concert access.',
    content: '<p>South African musicians are pioneering the use of NFTs in the African music industry, offering tokenized albums, backstage passes, and exclusive content to their fan base. Several prominent artists have launched NFT collections on Ethereum and Polygon, generating significant revenue while maintaining creative control.</p><p>The trend represents a shift from the traditional music distribution model, where intermediaries capture the majority of revenue. NFTs enable direct artist-to-fan relationships and programmable royalties that ensure creators earn from secondary sales.</p>',
    categorySlug: 'nfts',
    tags: JSON.stringify(['nfts', 'music', 'south-africa', 'royalties', 'fan-engagement']),
    territories: ['ZA'],
    readingTimeMinutes: 4,
    priority: 'NORMAL',
  },
  {
    title: 'Ghana\'s Traditional Kente Patterns Find New Life as NFT Collections',
    slug: 'launch-ghana-kente-patterns-nft-collections',
    excerpt: 'Ghanaian artisans and digital artists are collaborating to bring traditional kente weaving patterns to the blockchain as unique NFT collections.',
    content: '<p>A groundbreaking collaboration between Ghanaian kente weavers and digital artists has produced a series of NFT collections that celebrate the country\'s rich textile heritage. Each NFT is paired with a physical kente strip, creating a unique bridge between traditional craftsmanship and blockchain technology.</p><p>The project has gained international attention and raised questions about cultural preservation in the digital age. Revenue is shared between the digital artists and traditional weavers, creating a new economic model for cultural NFTs in Africa.</p>',
    categorySlug: 'nfts',
    tags: JSON.stringify(['nfts', 'ghana', 'kente', 'culture', 'traditional-art']),
    territories: ['GH'],
    readingTimeMinutes: 4,
    priority: 'NORMAL',
  },
  {
    title: 'How to Mint and Sell NFTs in Africa: A Complete Beginner\'s Guide',
    slug: 'launch-how-to-mint-sell-nfts-africa-guide',
    excerpt: 'A step-by-step guide for African creators looking to enter the NFT space, from setting up a wallet to listing your first digital artwork on major marketplaces.',
    content: '<p>The NFT market offers exciting opportunities for African creators, but getting started can be overwhelming. This comprehensive guide walks you through every step of the process, from choosing the right blockchain and setting up a crypto wallet to creating, minting, and marketing your NFTs.</p><p>We cover platform options with the lowest fees, strategies for pricing your work, and tips for building a collector community. Whether you\'re a visual artist, musician, photographer, or writer, this guide will help you launch your NFT career.</p>',
    categorySlug: 'nfts',
    tags: JSON.stringify(['nfts', 'guide', 'minting', 'beginners', 'africa']),
    territories: ['NG', 'KE', 'ZA', 'GH'],
    readingTimeMinutes: 8,
    priority: 'NORMAL',
  },

  // Education (5)
  {
    title: 'Crypto 101: Understanding Bitcoin and Blockchain for African Beginners',
    slug: 'launch-crypto-101-bitcoin-blockchain-african-beginners',
    excerpt: 'New to cryptocurrency? This beginner-friendly guide explains Bitcoin, blockchain technology, and why digital assets matter for Africa\'s economic future.',
    content: '<p>Welcome to CoinDaily\'s Crypto 101 series. In this first installment, we break down the fundamentals of Bitcoin and blockchain technology in plain language, with examples relevant to the African context.</p><p>You\'ll learn what makes Bitcoin different from traditional currencies, how blockchain technology ensures security and transparency, and why millions of Africans are adopting cryptocurrency for savings, remittances, and everyday transactions. No technical background required.</p>',
    categorySlug: 'education',
    tags: JSON.stringify(['education', 'bitcoin', 'blockchain', 'beginners', 'crypto-101']),
    territories: ['NG', 'KE', 'ZA', 'GH'],
    readingTimeMinutes: 7,
    priority: 'HIGH',
    seoTitle: 'Crypto 101: Bitcoin & Blockchain for African Beginners',
    seoDescription: 'A beginner-friendly guide to Bitcoin and blockchain technology, tailored for African audiences. Learn why crypto matters for Africa.',
    seoKeywords: JSON.stringify(['crypto beginners', 'bitcoin explained', 'blockchain Africa', 'crypto education']),
  },
  {
    title: 'How to Set Up Your First Crypto Wallet: A Guide for African Users',
    slug: 'launch-setup-first-crypto-wallet-african-guide',
    excerpt: 'Step-by-step instructions for setting up your first cryptocurrency wallet, with recommendations tailored for users in Nigeria, Kenya, South Africa, and Ghana.',
    content: '<p>Setting up a crypto wallet is the first step to participating in the digital asset economy. This guide covers everything you need to know, from choosing between hot and cold wallets to securing your recovery phrase.</p><p>We recommend the best wallet options for African users based on security, ease of use, and local currency support. Whether you\'re in Lagos, Nairobi, Johannesburg, or Accra, you\'ll find wallet options that integrate with your preferred payment methods.</p>',
    categorySlug: 'education',
    tags: JSON.stringify(['education', 'wallets', 'setup', 'security', 'beginners']),
    territories: ['NG', 'KE', 'ZA', 'GH'],
    readingTimeMinutes: 6,
    priority: 'HIGH',
  },
  {
    title: 'Understanding Stablecoins: Why USDT and USDC Matter for African Commerce',
    slug: 'launch-understanding-stablecoins-usdt-usdc-africa',
    excerpt: 'Stablecoins are transforming how Africans save and transact. Learn what they are, how they work, and why they\'re becoming essential for cross-border commerce.',
    content: '<p>Stablecoins like USDT (Tether) and USDC (Circle) have become critical financial tools across Africa, offering dollar-denominated stability in markets plagued by local currency volatility. This guide explains what stablecoins are, how they maintain their peg, and why they\'re particularly valuable in the African context.</p><p>We explore use cases from remittances and international freelancing to merchant payments and savings. You\'ll learn how to safely acquire and store stablecoins, the risks to watch for, and how regulations may evolve.</p>',
    categorySlug: 'education',
    tags: JSON.stringify(['education', 'stablecoins', 'usdt', 'usdc', 'commerce']),
    territories: ['NG', 'KE', 'ZA', 'GH'],
    readingTimeMinutes: 6,
    priority: 'HIGH',
  },
  {
    title: 'Crypto Security Essentials: Protecting Your Digital Assets in Africa',
    slug: 'launch-crypto-security-essentials-protecting-assets',
    excerpt: 'From phishing scams to SIM swap attacks, learn how to protect your cryptocurrency holdings with security practices tailored to the African threat landscape.',
    content: '<p>As crypto adoption grows in Africa, so do the threats targeting digital asset holders. This guide covers the most common attack vectors in the African market — including SIM swap attacks, phishing schemes, and fake exchange scams — and teaches you how to protect yourself.</p><p>We cover two-factor authentication, hardware wallets, secure backup practices, and how to verify legitimate platforms. Whether you hold $50 or $50,000 in crypto, these security fundamentals are essential for every African crypto user.</p>',
    categorySlug: 'education',
    tags: JSON.stringify(['education', 'security', 'scams', 'protection', 'best-practices']),
    territories: ['NG', 'KE', 'ZA', 'GH'],
    readingTimeMinutes: 7,
    priority: 'HIGH',
  },
  {
    title: 'Blockchain Jobs in Africa: Career Opportunities in the Web3 Economy',
    slug: 'launch-blockchain-jobs-africa-web3-careers',
    excerpt: 'The Web3 job market in Africa is booming. Discover the most in-demand roles, required skills, and how to land your first blockchain career opportunity.',
    content: '<p>Africa\'s blockchain industry is creating thousands of new jobs, from smart contract developers and DeFi analysts to community managers and content creators. This guide maps out the current Web3 job landscape across the continent.</p><p>We profile the top African blockchain companies hiring now, the skills most in demand, and free resources for upskilling. Whether you\'re a developer, marketer, designer, or writer, there\'s a growing opportunity for you in Africa\'s Web3 economy.</p>',
    categorySlug: 'education',
    tags: JSON.stringify(['education', 'jobs', 'web3', 'careers', 'blockchain']),
    territories: ['NG', 'KE', 'ZA', 'GH'],
    readingTimeMinutes: 6,
    priority: 'NORMAL',
  },
];

// ---- Post-launch daily articles (14 days) ----------------------------------

const POST_LAUNCH_ARTICLES: ArticleSeed[] = [
  {
    title: 'Day 1 Recap: CoinDaily Launch Breaks Traffic Records Across Africa',
    slug: 'launch-day1-recap-coindaily-traffic-records',
    excerpt: 'CoinDaily\'s launch day saw over 100,000 unique visitors from across the continent. Here\'s what our readers were most interested in.',
    content: '<p>What a day! CoinDaily\'s official launch has exceeded all expectations, with readers from Nigeria, Kenya, South Africa, Ghana, and over 30 other African countries visiting the platform. Our most-read articles covered Bitcoin market analysis, regulatory updates, and DeFi education.</p><p>Thank you to our growing community. This is just the beginning of our mission to deliver Africa-focused crypto news that matters.</p>',
    categorySlug: 'exchange-updates',
    tags: JSON.stringify(['coindaily', 'launch', 'recap', 'milestones']),
    territories: ['NG', 'KE', 'ZA', 'GH'],
    readingTimeMinutes: 3,
    priority: 'HIGH',
  },
  {
    title: 'Bitcoin Mining in Africa: Opportunities and Challenges Across the Continent',
    slug: 'launch-post-bitcoin-mining-africa-opportunities',
    excerpt: 'Exploring the emerging Bitcoin mining industry in Africa, from Ethiopia\'s hydroelectric advantage to Kenya\'s geothermal potential.',
    content: '<p>Africa is emerging as a frontier for Bitcoin mining, with several countries offering abundant renewable energy resources. Ethiopia\'s Grand Renaissance Dam provides cheap hydroelectric power, while Kenya\'s Rift Valley offers geothermal energy suitable for mining operations.</p><p>However, challenges remain, including infrastructure limitations, regulatory uncertainty, and access to mining hardware. This analysis examines the opportunity and obstacles for Bitcoin mining across the continent.</p>',
    categorySlug: 'market-analysis',
    tags: JSON.stringify(['bitcoin', 'mining', 'africa', 'renewable-energy', 'infrastructure']),
    territories: ['KE', 'ZA', 'NG'],
    readingTimeMinutes: 6,
    priority: 'NORMAL',
  },
  {
    title: 'How African Freelancers Are Using Crypto to Access the Global Gig Economy',
    slug: 'launch-post-african-freelancers-crypto-gig-economy',
    excerpt: 'Cryptocurrency is removing barriers for African freelancers receiving international payments, bypassing costly banking intermediaries.',
    content: '<p>For millions of African freelancers working with international clients, receiving payments has traditionally been a pain point. High bank fees, slow transfers, and unfavorable exchange rates eat into earnings. Cryptocurrency — particularly stablecoins — is changing this dynamic.</p><p>Freelancers in Nigeria, Kenya, and Ghana report using USDT and USDC to receive instant payments, then converting to local currency via P2P platforms at competitive rates. The savings compared to traditional wire transfers can be as high as 10-15%.</p>',
    categorySlug: 'education',
    tags: JSON.stringify(['freelancers', 'payments', 'stablecoins', 'gig-economy', 'africa']),
    territories: ['NG', 'KE', 'GH'],
    readingTimeMinutes: 5,
    priority: 'NORMAL',
  },
  {
    title: 'DeFi Lending Rates Comparison: Best Yields for African Stablecoin Holders',
    slug: 'launch-post-defi-lending-rates-african-stablecoin-yields',
    excerpt: 'Comparing DeFi lending rates across major protocols for African stablecoin holders looking to earn passive income.',
    content: '<p>For African crypto holders looking to earn yield on their stablecoin holdings, DeFi lending protocols offer attractive alternatives to traditional savings accounts. This comparison covers current rates across Aave, Compound, and newer platforms accessible from the continent.</p><p>We analyze risk-adjusted returns, platform security track records, and ease of access for users in major African markets. Understanding these options can help you make informed decisions about where to park your digital assets.</p>',
    categorySlug: 'defi',
    tags: JSON.stringify(['defi', 'lending', 'yields', 'stablecoins', 'comparison']),
    territories: ['NG', 'KE', 'ZA', 'GH'],
    readingTimeMinutes: 5,
    priority: 'NORMAL',
  },
  {
    title: 'NFT Gaming Takes Root in Africa: Play-to-Earn Trends Across the Continent',
    slug: 'launch-post-nft-gaming-play-to-earn-africa',
    excerpt: 'Play-to-earn gaming is gaining traction in Africa, with players in Nigeria and Ghana earning meaningful income through blockchain-based games.',
    content: '<p>Play-to-earn (P2E) blockchain gaming is finding a receptive audience in Africa, where gamers can earn cryptocurrency and NFTs while playing. Popular titles like Axie Infinity successors and Polygon-based games have built communities across Nigeria, Ghana, and Kenya.</p><p>For some players, P2E income supplements or even exceeds traditional employment earnings. This article explores the P2E landscape in Africa, the most promising games, and what the future holds for blockchain gaming on the continent.</p>',
    categorySlug: 'nfts',
    tags: JSON.stringify(['nfts', 'gaming', 'play-to-earn', 'africa', 'blockchain-gaming']),
    territories: ['NG', 'GH', 'KE'],
    readingTimeMinutes: 5,
    priority: 'NORMAL',
  },
  {
    title: 'Tanzania Signals Openness to Crypto With New Fintech Sandbox',
    slug: 'launch-post-tanzania-crypto-fintech-sandbox',
    excerpt: 'The Bank of Tanzania has launched a fintech sandbox that includes provisions for cryptocurrency companies, signaling a shift in regulatory stance.',
    content: '<p>The Bank of Tanzania has announced a fintech regulatory sandbox that, for the first time, explicitly includes cryptocurrency service providers. The sandbox allows selected companies to test products and services in a controlled environment for up to 18 months.</p><p>The move is seen as a significant shift from Tanzania\'s previously cautious stance on digital assets and could open the door for crypto exchanges and DeFi platforms to operate legally in the East African nation.</p>',
    categorySlug: 'regulatory-news',
    tags: JSON.stringify(['tanzania', 'regulation', 'sandbox', 'fintech', 'central-bank']),
    territories: ['KE'],
    readingTimeMinutes: 4,
    priority: 'NORMAL',
  },
  {
    title: 'Crypto Remittances to Africa Surpass $10 Billion Annually',
    slug: 'launch-post-crypto-remittances-africa-10-billion',
    excerpt: 'Cryptocurrency-based remittances to African countries have crossed the $10 billion annual mark, disrupting traditional money transfer operators.',
    content: '<p>Crypto remittances flowing into Africa have surpassed $10 billion annually, according to new data from Chainalysis. The growth has been driven primarily by the Nigeria-UK, Kenya-US, and South Africa-UK corridors, where crypto offers dramatically lower fees than traditional providers.</p><p>The data suggests that cryptocurrency is no longer a niche remittance channel but a mainstream alternative that is reshaping the competitive landscape for companies like Western Union and MoneyGram across the continent.</p>',
    categorySlug: 'market-analysis',
    tags: JSON.stringify(['remittances', 'crypto-payments', 'africa', 'cross-border', 'adoption']),
    territories: ['NG', 'KE', 'ZA'],
    readingTimeMinutes: 5,
    priority: 'HIGH',
  },
  {
    title: 'Understanding Layer 2 Solutions: Cheaper Transactions for African Users',
    slug: 'launch-post-layer-2-solutions-cheaper-transactions-africa',
    excerpt: 'Layer 2 scaling solutions like Polygon and Arbitrum are making Ethereum-based DeFi and NFTs affordable for African users. Here\'s how they work.',
    content: '<p>High Ethereum gas fees have historically been a barrier for African users looking to participate in DeFi and NFT markets. Layer 2 solutions like Polygon, Arbitrum, and Base are changing that equation, reducing transaction costs by 90-99%.</p><p>This educational guide explains what Layer 2s are, how they achieve lower costs while maintaining security, and how African users can bridge their assets to start using these networks today.</p>',
    categorySlug: 'education',
    tags: JSON.stringify(['education', 'layer-2', 'polygon', 'arbitrum', 'scaling']),
    territories: ['NG', 'KE', 'ZA', 'GH'],
    readingTimeMinutes: 6,
    priority: 'NORMAL',
  },
  {
    title: 'Solana Ecosystem Growth Attracts African Developers and Startups',
    slug: 'launch-post-solana-ecosystem-african-developers',
    excerpt: 'Solana\'s fast, low-cost blockchain is attracting a growing number of African developers building DeFi, payments, and social applications.',
    content: '<p>The Solana ecosystem is seeing a surge in African developer activity, with hackathon participation from the continent up 250% year-over-year. Nigerian and Kenyan developers in particular are building innovative applications on Solana, drawn by its high throughput and minimal transaction costs.</p><p>Several African startups have received grants from the Solana Foundation, and Superteam Africa chapters in Lagos, Nairobi, and Cape Town are fostering vibrant local communities.</p>',
    categorySlug: 'defi',
    tags: JSON.stringify(['solana', 'developers', 'africa', 'ecosystem', 'startups']),
    territories: ['NG', 'KE', 'ZA'],
    readingTimeMinutes: 5,
    priority: 'NORMAL',
  },
  {
    title: 'Top 5 African Crypto Exchanges Compared: Fees, Features, and Security',
    slug: 'launch-post-top-5-african-crypto-exchanges-compared',
    excerpt: 'A detailed comparison of the five largest cryptocurrency exchanges serving the African market, covering fees, supported assets, security measures, and user experience.',
    content: '<p>Choosing the right crypto exchange is one of the most important decisions for African investors. In this comprehensive comparison, we evaluate Luno, VALR, Quidax, Yellow Card, and Roqqu across key metrics including trading fees, deposit methods, supported cryptocurrencies, and security features.</p><p>Each exchange has its strengths: Luno excels in user experience, VALR in advanced trading features, and Quidax and Yellow Card in mobile money integration. We help you find the best fit based on your country and trading needs.</p>',
    categorySlug: 'exchange-updates',
    tags: JSON.stringify(['exchanges', 'comparison', 'africa', 'fees', 'security']),
    territories: ['NG', 'KE', 'ZA', 'GH'],
    readingTimeMinutes: 7,
    priority: 'HIGH',
  },
  {
    title: 'Real-World Asset Tokenization: How African Properties Are Moving On-Chain',
    slug: 'launch-post-real-world-asset-tokenization-african-properties',
    excerpt: 'Real estate tokenization is making property investment accessible to more Africans, with platforms enabling fractional ownership from as little as $50.',
    content: '<p>Real-world asset (RWA) tokenization is gaining momentum in Africa, with several platforms enabling fractional real estate ownership through blockchain technology. Properties in Lagos, Nairobi, and Johannesburg are being tokenized, allowing investors to own fractions of commercial and residential buildings for as little as $50.</p><p>The trend addresses a fundamental challenge in African real estate: high barriers to entry. Tokenization combined with DeFi lending could create entirely new investment opportunities for the continent\'s growing middle class.</p>',
    categorySlug: 'defi',
    tags: JSON.stringify(['rwa', 'tokenization', 'real-estate', 'africa', 'investing']),
    territories: ['NG', 'KE', 'ZA'],
    readingTimeMinutes: 5,
    priority: 'NORMAL',
  },
  {
    title: 'The Rise of African Crypto Influencers Shaping the Continental Narrative',
    slug: 'launch-post-african-crypto-influencers-shaping-narrative',
    excerpt: 'Meet the African crypto thought leaders and content creators who are educating millions and shaping the continent\'s digital asset narrative.',
    content: '<p>A new generation of African crypto influencers is emerging across YouTube, Twitter/X, and TikTok, educating millions about digital assets in local languages and cultural contexts. From Nigeria\'s crypto Twitter community to Kenya\'s YouTube educators, these creators are filling a critical knowledge gap.</p><p>We profile ten influential voices from across the continent and explore how they\'re making crypto more accessible, challenging misinformation, and building communities that support new adopters.</p>',
    categorySlug: 'education',
    tags: JSON.stringify(['influencers', 'education', 'community', 'africa', 'content-creators']),
    territories: ['NG', 'KE', 'ZA', 'GH'],
    readingTimeMinutes: 5,
    priority: 'NORMAL',
  },
  {
    title: 'ECOWAS Explores Regional Stablecoin to Facilitate West African Trade',
    slug: 'launch-post-ecowas-regional-stablecoin-west-african-trade',
    excerpt: 'The Economic Community of West African States is studying the feasibility of a regional stablecoin to simplify cross-border trade among member nations.',
    content: '<p>ECOWAS has commissioned a feasibility study on a regional stablecoin that could facilitate cross-border trade among its 15 member states. The initiative builds on the long-delayed Eco currency project but leverages blockchain technology for faster implementation.</p><p>If successful, the stablecoin could dramatically reduce the cost of intra-regional trade, which currently accounts for only 15% of total African trade — partly due to currency conversion challenges. Nigeria and Ghana are expected to be the primary champions of the initiative.</p>',
    categorySlug: 'regulatory-news',
    tags: JSON.stringify(['ecowas', 'stablecoin', 'west-africa', 'trade', 'regional-policy']),
    territories: ['NG', 'GH'],
    readingTimeMinutes: 5,
    priority: 'NORMAL',
  },
  {
    title: 'Two Weeks In: What We\'ve Learned About Africa\'s Crypto Appetite',
    slug: 'launch-post-two-weeks-in-africa-crypto-appetite',
    excerpt: 'Reflecting on our first two weeks of coverage, we share insights on what African crypto readers care about most and what\'s coming next from CoinDaily.',
    content: '<p>After two weeks of delivering Africa-focused crypto news, we\'re sharing key insights from our readership data. Market analysis and DeFi content consistently rank highest, regulatory news drives the most social sharing, and educational content sees the longest average reading times.</p><p>Our readers are primarily in Nigeria (40%), Kenya (22%), South Africa (18%), and Ghana (10%), with growing audiences in Tanzania, Uganda, and Rwanda. Thank you for joining us on this journey. Here\'s what\'s coming next from CoinDaily.</p>',
    categorySlug: 'exchange-updates',
    tags: JSON.stringify(['coindaily', 'milestones', 'insights', 'readership', 'africa']),
    territories: ['NG', 'KE', 'ZA', 'GH'],
    readingTimeMinutes: 4,
    priority: 'HIGH',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureCategory(
  slug: string,
  fallback: { name: string; description: string },
): Promise<string> {
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return existing.id;

  const id = randomUUID();
  await prisma.category.create({
    data: {
      id,
      name: fallback.name,
      slug,
      description: fallback.description,
      isActive: true,
      updatedAt: new Date(),
    },
  });
  console.log(`  → Created category "${fallback.name}" (${slug})`);
  return id;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const isDryRun = DRY_RUN;
  if (isDryRun) {
    console.log('🏃 DRY RUN — no database changes will be made.\n');
  }

  // Resolve an admin author
  const author = await prisma.user.findFirst({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'CONTENT_ADMIN'] } },
  });
  if (!author && !isDryRun) {
    throw new Error('No admin author found — create an admin user first');
  }
  const authorId = author?.id ?? 'dry-run-author-id';

  // Ensure all required categories exist
  const categoryMap: Record<string, string> = {};
  for (const slug of CATEGORY_SLUGS) {
    if (isDryRun) {
      categoryMap[slug] = `dry-run-category-${slug}`;
    } else {
      categoryMap[slug] = await ensureCategory(slug, CATEGORY_FALLBACK[slug]);
    }
  }

  // Compute launch start
  const launchStart = process.env.LAUNCH_DATE
    ? new Date(process.env.LAUNCH_DATE)
    : new Date(Date.now() + 24 * 60 * 60 * 1000);
  launchStart.setHours(6, 0, 0, 0);

  console.log(`📅 Launch date: ${launchStart.toISOString()}`);

  const dayOneCount = parseInt(process.env.LAUNCH_DAY_ONE_COUNT || String(LAUNCH_DAY_ARTICLES.length), 10);
  const dailyCount = parseInt(process.env.LAUNCH_DAILY_COUNT || String(POST_LAUNCH_ARTICLES.length), 10);

  // Slice arrays to env-driven counts (default = full arrays)
  const dayOneArticles = LAUNCH_DAY_ARTICLES.slice(0, dayOneCount);
  const dailyArticles = POST_LAUNCH_ARTICLES.slice(0, dailyCount);

  const now = new Date();
  let created = 0;
  let skipped = 0;

  // ---- Launch day articles --------------------------------------------------
  console.log(`\n🚀 Seeding ${dayOneArticles.length} launch day articles…`);

  for (let i = 0; i < dayOneArticles.length; i++) {
    const article = dayOneArticles[i];

    // Idempotency: skip if slug already exists
    if (!isDryRun) {
      const exists = await prisma.article.findUnique({ where: { slug: article.slug } });
      if (exists) {
        skipped++;
        continue;
      }
    }

    // Stagger across launch day: spread articles over 18 hours (06:00 – 23:59)
    const minuteOffset = Math.floor((i / dayOneArticles.length) * 18 * 60);
    const scheduledAt = new Date(launchStart.getTime() + minuteOffset * 60 * 1000);

    if (isDryRun) {
      console.log(`  [DRY] ${scheduledAt.toISOString()} | ${article.title}`);
      created++;
      continue;
    }

    await prisma.article.create({
      data: {
        id: randomUUID(),
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        authorId,
        categoryId: categoryMap[article.categorySlug],
        tags: article.tags,
        territory: article.territories,
        status: 'SCHEDULED',
        priority: article.priority,
        readingTimeMinutes: article.readingTimeMinutes,
        seoTitle: article.seoTitle ?? null,
        seoDescription: article.seoDescription ?? null,
        seoKeywords: article.seoKeywords ?? null,
        language: 'en',
        aiGenerated: true,
        publishScheduledAt: scheduledAt,
        updatedAt: now,
      },
    });
    created++;
  }

  // ---- Post-launch daily articles -------------------------------------------
  console.log(`\n📆 Seeding ${dailyArticles.length} post-launch daily articles (1/day for 14 days)…`);

  for (let i = 0; i < dailyArticles.length; i++) {
    const article = dailyArticles[i];

    if (!isDryRun) {
      const exists = await prisma.article.findUnique({ where: { slug: article.slug } });
      if (exists) {
        skipped++;
        continue;
      }
    }

    // Schedule one per day at 08:00 UTC, starting day after launch
    const scheduledAt = new Date(launchStart);
    scheduledAt.setDate(scheduledAt.getDate() + i + 1);
    scheduledAt.setHours(8, 0, 0, 0);

    if (isDryRun) {
      console.log(`  [DRY] ${scheduledAt.toISOString()} | ${article.title}`);
      created++;
      continue;
    }

    await prisma.article.create({
      data: {
        id: randomUUID(),
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        authorId,
        categoryId: categoryMap[article.categorySlug],
        tags: article.tags,
        territory: article.territories,
        status: 'SCHEDULED',
        priority: article.priority,
        readingTimeMinutes: article.readingTimeMinutes,
        seoTitle: article.seoTitle ?? null,
        seoDescription: article.seoDescription ?? null,
        seoKeywords: article.seoKeywords ?? null,
        language: 'en',
        aiGenerated: true,
        publishScheduledAt: scheduledAt,
        updatedAt: now,
      },
    });
    created++;
  }

  // ---- Summary --------------------------------------------------------------
  console.log(`\n✅ Done! Created ${created} articles, skipped ${skipped} (already existed).`);
  console.log(`   Day-1: ${dayOneArticles.length} | Post-launch daily: ${dailyArticles.length} | Total: ${dayOneArticles.length + dailyArticles.length}`);

  if (isDryRun) {
    console.log('\n🏃 Dry run complete — no database changes were made.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
