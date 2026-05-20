export type EntityType = 'cryptocurrency' | 'exchange' | 'company' | 'country';

export interface FactsheetEntity {
  slug: string;
  name: string;
  type: EntityType;
  ticker?: string;
  logo?: string;
  tagline: string;
  overview: string;
  founded?: string;
  headquarters?: string;
  website?: string;
  keyStats: { label: string; value: string }[];
  africanRelevance: string;
  regulatoryStatus?: string;
  relatedSlugs: string[];
}

export const factsheets: FactsheetEntity[] = [
  // --- Cryptocurrencies ---
  {
    slug: 'bitcoin',
    name: 'Bitcoin',
    type: 'cryptocurrency',
    ticker: 'BTC',
    tagline: 'The original decentralised digital currency',
    overview:
      'Bitcoin is the first and largest cryptocurrency by market capitalisation. Created in 2009, it operates on a proof-of-work blockchain and is widely used across Africa as a store of value, remittance rail, and hedge against local-currency depreciation.',
    founded: '2009',
    website: 'https://bitcoin.org',
    keyStats: [
      { label: 'Consensus', value: 'Proof of Work' },
      { label: 'Max supply', value: '21,000,000 BTC' },
      { label: 'Block time', value: '~10 minutes' },
      { label: 'Halving cycle', value: '~4 years' },
    ],
    africanRelevance:
      'Nigeria, Kenya, and South Africa consistently rank in the top 20 globally for Bitcoin P2P trading volume. Bitcoin is the most traded cryptocurrency on Luno, Quidax, and YellowCard.',
    relatedSlugs: ['ethereum', 'luno', 'quidax', 'yellowcard', 'nigeria', 'kenya'],
  },
  {
    slug: 'ethereum',
    name: 'Ethereum',
    type: 'cryptocurrency',
    ticker: 'ETH',
    tagline: 'Programmable blockchain powering DeFi and smart contracts',
    overview:
      'Ethereum is the leading smart-contract platform. Its ecosystem includes DeFi protocols, NFT marketplaces, and layer-2 scaling solutions. The network transitioned to proof of stake in September 2022.',
    founded: '2015',
    website: 'https://ethereum.org',
    keyStats: [
      { label: 'Consensus', value: 'Proof of Stake' },
      { label: 'Block time', value: '~12 seconds' },
      { label: 'Staking APR', value: '~3–5%' },
      { label: 'EVM compatible', value: 'Yes (reference)' },
    ],
    africanRelevance:
      'Ethereum-based stablecoins (USDT, USDC) are the most-used crypto instruments for cross-border payments in Africa. DeFi protocols built on Ethereum serve unbanked populations across the continent.',
    relatedSlugs: ['bitcoin', 'binance', 'luno', 'south-africa'],
  },
  {
    slug: 'bnb',
    name: 'BNB',
    type: 'cryptocurrency',
    ticker: 'BNB',
    tagline: 'Native token of the BNB Chain ecosystem',
    overview:
      "BNB is the native cryptocurrency of BNB Chain (formerly Binance Smart Chain). It is used for transaction fees, staking, and governance within the Binance ecosystem. BNB Chain's low fees make it popular in price-sensitive African markets.",
    founded: '2017',
    website: 'https://www.bnbchain.org',
    keyStats: [
      { label: 'Consensus', value: 'Proof of Staked Authority' },
      { label: 'Block time', value: '~3 seconds' },
      { label: 'Max supply', value: '200,000,000 BNB' },
      { label: 'Burn mechanism', value: 'Quarterly auto-burn' },
    ],
    africanRelevance:
      'BNB Chain hosts many of the DeFi protocols popular with African retail traders due to sub-cent transaction fees. Binance P2P in Africa frequently settles in BNB.',
    relatedSlugs: ['binance', 'bitcoin', 'ethereum'],
  },
  {
    slug: 'solana',
    name: 'Solana',
    type: 'cryptocurrency',
    ticker: 'SOL',
    tagline: 'High-throughput blockchain for decentralised applications',
    overview:
      'Solana is a layer-1 blockchain designed for speed, processing thousands of transactions per second at low cost. Its ecosystem spans DeFi, NFTs, payments, and mobile (Saga phone).',
    founded: '2020',
    website: 'https://solana.com',
    keyStats: [
      { label: 'Consensus', value: 'Proof of History + PoS' },
      { label: 'TPS (theoretical)', value: '65,000' },
      { label: 'Block time', value: '~400ms' },
      { label: 'Validator count', value: '~1,800+' },
    ],
    africanRelevance:
      'Solana Pay is being piloted by African fintech startups for point-of-sale crypto payments. Low fees make it attractive for micro-transaction use cases in mobile money markets.',
    relatedSlugs: ['bitcoin', 'ethereum', 'bnb'],
  },
  {
    slug: 'usdt',
    name: 'Tether (USDT)',
    type: 'cryptocurrency',
    ticker: 'USDT',
    tagline: 'Dominant dollar-pegged stablecoin for African remittances and P2P',
    overview:
      'USDT is the most widely used stablecoin globally and the primary settlement asset on African P2P desks. It maintains a soft peg to the US dollar and runs on multiple chains including Ethereum, Tron, and BNB Chain.',
    founded: '2014',
    website: 'https://tether.to',
    keyStats: [
      { label: 'Peg', value: '1 USD (target)' },
      { label: 'Primary chains', value: 'Tron, Ethereum, BNB' },
      { label: 'Use case', value: 'Remittance, trading, treasury' },
      { label: 'Issuer', value: 'Tether Limited' },
    ],
    africanRelevance:
      'USDT/NGN and USDT/KES pairs are the highest-volume crypto markets in Africa. YellowCard, Binance P2P, and Quidax rely on USDT as the bridge between local fiat and global liquidity.',
    relatedSlugs: ['bitcoin', 'yellowcard', 'binance', 'nigeria', 'kenya'],
  },

  // --- Exchanges ---
  {
    slug: 'binance',
    name: 'Binance',
    type: 'exchange',
    tagline: "World's largest cryptocurrency exchange by trading volume",
    overview:
      'Binance is the largest global cryptocurrency exchange. It offers spot, futures, P2P, and earn products. Binance operates dedicated African operations with NGN, KES, ZAR, and GHS P2P pairs.',
    founded: '2017',
    headquarters: 'Global (no single HQ)',
    website: 'https://www.binance.com',
    keyStats: [
      { label: 'Trading pairs', value: '1,600+' },
      { label: 'African P2P currencies', value: 'NGN, KES, ZAR, GHS, TZS' },
      { label: 'Supported countries', value: '180+' },
      { label: 'Products', value: 'Spot, Futures, P2P, Earn, NFT' },
    ],
    africanRelevance:
      "Binance P2P is the dominant on-ramp for crypto in Nigeria after CBN's bank ban on crypto transactions. It also operates large P2P desks in Kenya, South Africa, and Ghana.",
    regulatoryStatus: 'Regulatory status varies by African jurisdiction. Registered in South Africa (FSCA). Faced restrictions in Nigeria (2024).',
    relatedSlugs: ['bnb', 'bitcoin', 'nigeria', 'south-africa', 'kenya'],
  },
  {
    slug: 'luno',
    name: 'Luno',
    type: 'exchange',
    tagline: 'Africa-focused exchange with fiat on-ramp in 7 countries',
    overview:
      'Luno is a cryptocurrency exchange headquartered in London with deep African roots. Acquired by Digital Currency Group in 2020, it offers simple buy/sell, savings, and instant fiat deposits in South Africa, Nigeria, and other markets.',
    founded: '2013',
    headquarters: 'London, UK',
    website: 'https://www.luno.com',
    keyStats: [
      { label: 'African markets', value: 'ZA, NG, MY, ID, UK, SG, UG' },
      { label: 'Supported assets', value: '~10' },
      { label: 'Fiat currencies', value: 'ZAR, NGN, MYR, IDR, GBP, SGD, EUR' },
      { label: 'Parent company', value: 'Digital Currency Group' },
    ],
    africanRelevance:
      'Luno was the first major exchange to offer ZAR and NGN fiat pairs with instant bank deposits, making it a gateway for millions of first-time African crypto buyers.',
    regulatoryStatus: 'Registered with FSCA in South Africa. Operating under interim framework in Nigeria.',
    relatedSlugs: ['bitcoin', 'ethereum', 'south-africa', 'nigeria', 'valr'],
  },
  {
    slug: 'valr',
    name: 'VALR',
    type: 'exchange',
    tagline: 'South African crypto exchange with institutional-grade infrastructure',
    overview:
      'VALR is a Cape Town-based cryptocurrency exchange serving retail and institutional clients across Africa. It offers spot trading, earn products, and API access with FSCA-aligned compliance positioning.',
    founded: '2018',
    headquarters: 'Cape Town, South Africa',
    website: 'https://www.valr.com',
    keyStats: [
      { label: 'HQ', value: 'Cape Town, ZA' },
      { label: 'Regulatory context', value: 'FSCA CASP ecosystem' },
      { label: 'Products', value: 'Spot, Earn, API' },
      { label: 'Markets', value: 'ZAR, BTC, ETH, USDT' },
    ],
    africanRelevance:
      'VALR is among the largest exchanges in Southern Africa and a key ZAR liquidity venue for regional market coverage.',
    relatedSlugs: ['luno', 'south-africa', 'bitcoin', 'usdt'],
  },
  {
    slug: 'quidax',
    name: 'Quidax',
    type: 'exchange',
    tagline: 'Nigerian-founded exchange with naira instant deposits',
    overview:
      'Quidax is a Nigerian-founded cryptocurrency exchange offering NGN fiat pairs, instant naira deposits via bank transfer, and a growing suite of trading products. It targets the West African market with localised UX.',
    founded: '2018',
    headquarters: 'Lagos, Nigeria',
    website: 'https://www.quidax.com',
    keyStats: [
      { label: 'Primary market', value: 'Nigeria' },
      { label: 'Supported assets', value: '20+' },
      { label: 'Fiat currency', value: 'NGN' },
      { label: 'Deposit methods', value: 'Bank transfer, card' },
    ],
    africanRelevance:
      'Quidax is one of the few exchanges with direct NGN bank integration post-CBN crypto ban, enabling Nigerians to buy and sell crypto without P2P friction.',
    regulatoryStatus: 'Registered with SEC Nigeria under the Accelerated Regulatory Incubation Programme (ARIP).',
    relatedSlugs: ['bitcoin', 'ethereum', 'nigeria', 'yellowcard'],
  },
  {
    slug: 'yellowcard',
    name: 'YellowCard',
    type: 'exchange',
    tagline: 'Pan-African exchange operating in 20+ countries',
    overview:
      'YellowCard is the largest pan-African cryptocurrency exchange by geographic coverage, operating in over 20 countries. It supports local currencies and mobile money deposits across the continent.',
    founded: '2019',
    headquarters: 'Miami, USA (operations across Africa)',
    website: 'https://yellowcard.io',
    keyStats: [
      { label: 'African countries', value: '20+' },
      { label: 'Local currencies', value: 'NGN, KES, ZAR, GHS, TZS, UGX, XOF, XAF' },
      { label: 'Deposit methods', value: 'Mobile money, bank, card' },
      { label: 'Total raised', value: '$40M+' },
    ],
    africanRelevance:
      'YellowCard is the only exchange with mobile money integration across West, East, and Southern Africa, making it the go-to on-ramp for users without bank accounts.',
    regulatoryStatus: 'Licensed or registered in multiple African jurisdictions including Nigeria and South Africa.',
    relatedSlugs: ['bitcoin', 'nigeria', 'kenya', 'ghana', 'south-africa'],
  },

  // --- Companies / Telcos ---
  {
    slug: 'mtn',
    name: 'MTN Group',
    type: 'company',
    tagline: "Africa's largest mobile network operator",
    overview:
      'MTN Group is a multinational telecommunications company headquartered in Johannesburg, South Africa. With over 280 million subscribers across 19 African and Middle Eastern markets, MTN is central to mobile money, fintech, and digital services on the continent.',
    founded: '1994',
    headquarters: 'Johannesburg, South Africa',
    website: 'https://www.mtn.com',
    keyStats: [
      { label: 'Subscribers', value: '280M+' },
      { label: 'Markets', value: '19' },
      { label: 'MoMo users', value: '60M+' },
      { label: 'JSE ticker', value: 'MTN' },
    ],
    africanRelevance:
      'MTN MoMo (Mobile Money) is one of the largest mobile money platforms in Africa. MTN has explored blockchain-based remittances and is a key infrastructure partner for crypto on-ramp services.',
    relatedSlugs: ['safaricom', 'nigeria', 'south-africa', 'ghana'],
  },
  {
    slug: 'safaricom',
    name: 'Safaricom',
    type: 'company',
    tagline: "Kenya's leading telco and home of M-Pesa",
    overview:
      "Safaricom is the largest telecommunications provider in Kenya and the operator of M-Pesa, the world's most successful mobile money platform. M-Pesa processes billions of dollars in transactions annually.",
    founded: '1997',
    headquarters: 'Nairobi, Kenya',
    website: 'https://www.safaricom.co.ke',
    keyStats: [
      { label: 'M-Pesa users', value: '50M+' },
      { label: 'Annual M-Pesa volume', value: '$300B+' },
      { label: 'NSE ticker', value: 'SCOM' },
      { label: 'Majority owner', value: 'Vodacom/Vodafone' },
    ],
    africanRelevance:
      'M-Pesa is the dominant payment rail in East Africa. Crypto exchanges like Binance and YellowCard integrate M-Pesa for instant deposits and withdrawals in Kenya, Uganda, and Tanzania.',
    relatedSlugs: ['mtn', 'kenya', 'yellowcard'],
  },
  {
    slug: 'standard-bank',
    name: 'Standard Bank',
    type: 'company',
    tagline: "Africa's largest bank by assets",
    overview:
      'Standard Bank Group is the largest African banking group by assets, with operations in 20 African countries. It provides retail, commercial, and investment banking services and has been cautiously engaging with digital assets.',
    founded: '1862',
    headquarters: 'Johannesburg, South Africa',
    website: 'https://www.standardbank.com',
    keyStats: [
      { label: 'Total assets', value: '$170B+' },
      { label: 'African countries', value: '20' },
      { label: 'Employees', value: '49,000+' },
      { label: 'JSE ticker', value: 'SBK' },
    ],
    africanRelevance:
      'Standard Bank is a key player in African trade finance and cross-border payments. Its partnership with ICBC (China) positions it at the intersection of African and Asian capital flows relevant to crypto infrastructure.',
    relatedSlugs: ['south-africa', 'naspers'],
  },
  {
    slug: 'naspers',
    name: 'Naspers',
    type: 'company',
    tagline: 'African tech conglomerate and Tencent investor',
    overview:
      'Naspers is a South African multinational holding company and one of the largest technology investors in the world. Through its subsidiary Prosus, it holds stakes in major global tech companies and invests heavily in African fintech.',
    founded: '1915',
    headquarters: 'Cape Town, South Africa',
    website: 'https://www.naspers.com',
    keyStats: [
      { label: 'Major holding', value: 'Prosus (Tencent stake)' },
      { label: 'African fintech bets', value: 'Takealot, PayU, OLX' },
      { label: 'JSE ticker', value: 'NPN' },
      { label: 'Employees', value: '30,000+' },
    ],
    africanRelevance:
      'Naspers/Prosus is the largest tech investor originating from Africa. Its fintech arm (PayU) and food delivery (Delivery Hero stake) give it unique exposure to African digital commerce and payments infrastructure.',
    relatedSlugs: ['south-africa', 'standard-bank'],
  },

  // --- Countries ---
  {
    slug: 'nigeria',
    name: 'Nigeria',
    type: 'country',
    tagline: "Africa's largest economy and most active crypto market",
    overview:
      'Nigeria is the largest economy in Africa and one of the most active cryptocurrency markets globally. Despite regulatory friction from the CBN, peer-to-peer crypto trading volumes consistently place Nigeria in the global top 5.',
    headquarters: 'Abuja (capital)',
    keyStats: [
      { label: 'Population', value: '230M+' },
      { label: 'GDP', value: '$470B+' },
      { label: 'Currency', value: 'Nigerian Naira (NGN)' },
      { label: 'Crypto regulator', value: 'SEC Nigeria' },
      { label: 'Exchange rate regime', value: 'Managed float' },
      { label: 'Internet penetration', value: '~55%' },
    ],
    africanRelevance:
      "Nigeria leads Africa in crypto adoption. The SEC Nigeria launched the Accelerated Regulatory Incubation Programme (ARIP) in 2024 to register crypto exchanges. The naira's depreciation drives demand for stablecoins as a store of value.",
    regulatoryStatus: 'SEC Nigeria regulates digital assets. CBN lifted its bank ban on crypto in late 2023. Exchanges must register under ARIP.',
    relatedSlugs: ['bitcoin', 'binance', 'quidax', 'yellowcard', 'mtn'],
  },
  {
    slug: 'kenya',
    name: 'Kenya',
    type: 'country',
    tagline: "East Africa's fintech hub and M-Pesa pioneer",
    overview:
      "Kenya is East Africa's largest economy and a global leader in mobile money adoption. M-Pesa processes more value than many traditional banking systems. The country's tech-savvy population has embraced cryptocurrency alongside mobile payments.",
    headquarters: 'Nairobi (capital)',
    keyStats: [
      { label: 'Population', value: '56M+' },
      { label: 'GDP', value: '$115B+' },
      { label: 'Currency', value: 'Kenyan Shilling (KES)' },
      { label: 'Crypto regulator', value: 'CMA Kenya (emerging)' },
      { label: 'M-Pesa penetration', value: '~96% of adults' },
      { label: 'Internet penetration', value: '~85%' },
    ],
    africanRelevance:
      'Kenya is the birthplace of M-Pesa and a global fintech laboratory. Crypto-to-M-Pesa bridges are the primary on/off ramp for Kenyan crypto users, enabling seamless conversion between digital assets and mobile money.',
    regulatoryStatus: 'No comprehensive crypto legislation yet. Capital Markets Authority exploring regulatory framework. Crypto is not banned but not formally regulated.',
    relatedSlugs: ['safaricom', 'bitcoin', 'yellowcard', 'binance'],
  },
  {
    slug: 'south-africa',
    name: 'South Africa',
    type: 'country',
    tagline: "Africa's most regulated and institutionalised crypto market",
    overview:
      'South Africa has the most developed financial markets in Africa and the most advanced crypto regulatory framework on the continent. The FSCA became one of the first African regulators to license crypto asset service providers.',
    headquarters: 'Pretoria (administrative capital)',
    keyStats: [
      { label: 'Population', value: '62M+' },
      { label: 'GDP', value: '$400B+' },
      { label: 'Currency', value: 'South African Rand (ZAR)' },
      { label: 'Crypto regulator', value: 'FSCA' },
      { label: 'Licensed CASPs', value: '60+' },
      { label: 'Internet penetration', value: '~72%' },
    ],
    africanRelevance:
      "South Africa is the institutional gateway to African crypto. The FSCA's licensing regime provides regulatory clarity that attracts global exchanges. Luno, VALR, and AltCoinTrader are major local platforms.",
    regulatoryStatus: 'FSCA licenses Crypto Asset Service Providers (CASPs) under the Financial Advisory and Intermediary Services Act. Tax on crypto gains applies.',
    relatedSlugs: ['luno', 'standard-bank', 'naspers', 'bitcoin', 'mtn'],
  },
  {
    slug: 'ghana',
    name: 'Ghana',
    type: 'country',
    tagline: "West Africa's emerging crypto and fintech corridor",
    overview:
      "Ghana is West Africa's second-largest economy and a growing hub for fintech and cryptocurrency adoption. The Bank of Ghana has been progressive with its digital currency pilot (e-Cedi) and fintech sandbox.",
    headquarters: 'Accra (capital)',
    keyStats: [
      { label: 'Population', value: '34M+' },
      { label: 'GDP', value: '$75B+' },
      { label: 'Currency', value: 'Ghanaian Cedi (GHS)' },
      { label: 'Crypto regulator', value: 'SEC Ghana / BoG' },
      { label: 'Mobile money users', value: '20M+' },
      { label: 'Internet penetration', value: '~68%' },
    ],
    africanRelevance:
      "Ghana's e-Cedi CBDC pilot is one of Africa's most advanced. Mobile money interoperability and strong P2P crypto trading volumes make it a key market for pan-African exchanges like YellowCard.",
    regulatoryStatus: 'SEC Ghana and Bank of Ghana are developing a regulatory framework. No ban on crypto. e-Cedi CBDC pilot ongoing.',
    relatedSlugs: ['mtn', 'yellowcard', 'nigeria', 'bitcoin'],
  },
  {
    slug: 'tanzania',
    name: 'Tanzania',
    type: 'country',
    tagline: 'East African market with growing mobile-money and crypto adoption',
    overview:
      'Tanzania is an East African economy with rising fintech adoption and increasing retail interest in stablecoins for savings and cross-border transfers. Regulatory clarity is still evolving compared to Kenya and South Africa.',
    headquarters: 'Dodoma (capital)',
    keyStats: [
      { label: 'Population', value: '67M+' },
      { label: 'GDP', value: '$85B+' },
      { label: 'Currency', value: 'Tanzanian Shilling (TZS)' },
      { label: 'Mobile money', value: 'M-Pesa, Tigo Pesa, Airtel Money' },
      { label: 'Internet penetration', value: '~32%' },
    ],
    africanRelevance:
      'Tanzania is part of the East African Community corridor alongside Kenya and Uganda. P2P USDT demand and mobile-money interoperability make it a strategic market for pan-African exchanges.',
    regulatoryStatus: 'Bank of Tanzania has cautioned on crypto; formal CASP licensing framework still developing.',
    relatedSlugs: ['kenya', 'yellowcard', 'usdt', 'safaricom'],
  },
  {
    slug: 'ripple',
    name: 'Ripple (XRP)',
    type: 'cryptocurrency',
    ticker: 'XRP',
    tagline: 'Payments-focused digital asset used in cross-border settlement pilots',
    overview:
      'XRP is the native asset of the XRP Ledger, designed for fast, low-cost cross-border payments. RippleNet partners include financial institutions exploring remittance corridors relevant to African markets.',
    founded: '2012',
    website: 'https://ripple.com',
    keyStats: [
      { label: 'Ledger', value: 'XRP Ledger' },
      { label: 'Settlement time', value: '~3–5 seconds' },
      { label: 'Use case', value: 'Cross-border payments' },
      { label: 'Supply model', value: 'Fixed max supply' },
    ],
    africanRelevance:
      'Ripple has announced CBDC and cross-border settlement pilots with African central banks (e.g. Rwanda). XRP is watched as infrastructure for remittance cost reduction across EAC corridors.',
    relatedSlugs: ['bitcoin', 'kenya', 'tanzania', 'yellowcard'],
  },
];

export function getFactsheet(slug: string): FactsheetEntity | undefined {
  return factsheets.find((f) => f.slug === slug);
}

export function getFactsheetsByType(type: EntityType): FactsheetEntity[] {
  return factsheets.filter((f) => f.type === type);
}

export function getAllFactsheetSlugs(): string[] {
  return factsheets.map((f) => f.slug);
}
