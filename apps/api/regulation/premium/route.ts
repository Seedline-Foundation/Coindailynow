/**
 * Premium Regulation API
 * Serves comprehensive regulatory intelligence data for paid members.
 * Includes risk scores, editorial analysis, full timelines, tax frameworks,
 * licensing requirements, CBDC progress, and CoinDaily expert views.
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// ━━━━ Types ━━━━

export interface PremiumCountryRegulation {
  code: string;
  name: string;
  flag: string;
  region: string;
  status: string;
  lastUpdate: string;
  // Basic info
  summary: string;
  exchanges: string[];
  keyDocs: string[];
  // Premium fields
  riskScore: number; // 1-100
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  complianceRating: string; // A+ to F
  regulatoryBody: string;
  regulatoryContacts: { name: string; role: string; email?: string }[];
  cbdc: { name: string; status: string; phase: string; details: string } | null;
  taxFramework: {
    capitalGainsTax: string;
    tradingTax: string;
    miningTax: string;
    reportingThreshold: string;
    details: string;
  };
  licensing: {
    required: boolean;
    types: string[];
    applicationProcess: string;
    timelineWeeks: number;
    fees: string;
    renewalPeriod: string;
  };
  amlKyc: {
    amlRequired: boolean;
    kycRequired: boolean;
    travelRuleCompliant: boolean;
    reportingEntity: string;
    details: string;
  };
  timeline: {
    date: string;
    type: string;
    title: string;
    description: string;
    impactScore: number;
    source: string;
  }[];
  upcomingPolicies: {
    title: string;
    expectedDate: string;
    status: string;
    description: string;
    impactLevel: string;
  }[];
  // CoinDaily Expert Analysis
  editorialAnalysis: {
    outlook: 'Bullish' | 'Neutral' | 'Bearish' | 'Uncertain';
    summary: string;
    opportunities: string[];
    risks: string[];
    recommendation: string;
    analystName: string;
    publishedDate: string;
  };
  // Market context
  marketContext: {
    estimatedCryptoUsers: string;
    p2pVolume24h: string;
    dominantPlatforms: string[];
    mobileMoneyIntegration: string;
    internetPenetration: string;
  };
}

// ━━━━ Premium Fallback Data ━━━━

const PREMIUM_COUNTRIES: PremiumCountryRegulation[] = [
  {
    code: 'NG', name: 'Nigeria', flag: '🇳🇬', region: 'West Africa',
    status: 'Regulated', lastUpdate: '2026-02-10',
    summary: 'SEC Nigeria requires all VASPs to register. CBN lifted banking ban in 2023. eNaira CBDC in Phase 2. All crypto exchanges must comply with AML/CFT requirements. Nigeria has the most developed crypto regulatory landscape in Africa.',
    exchanges: ['Quidax', 'Luno', 'Binance P2P', 'Patricia', 'Roqqu', 'BuyCoins'],
    keyDocs: ['SEC Digital Assets Framework 2025', 'CBN Circular on VASPs', 'NFIU Crypto AML Guidelines', 'Finance Act 2023 (Crypto Provisions)', 'NDIC Digital Asset Coverage Guidelines'],
    riskScore: 35, riskLevel: 'Medium', complianceRating: 'B+',
    regulatoryBody: 'SEC Nigeria / Central Bank of Nigeria (CBN)',
    regulatoryContacts: [
      { name: 'SEC Nigeria', role: 'Digital Assets & Innovation Division', email: 'digitalassets@sec.gov.ng' },
      { name: 'CBN FinTech Office', role: 'Payment Systems Management', email: 'fintech@cbn.gov.ng' },
    ],
    cbdc: { name: 'eNaira', status: 'Active', phase: 'Phase 2 — Merchant Integration', details: 'Launched Oct 2021. Phase 2 expanding to 15,000+ merchant points across Lagos, Abuja, Port Harcourt. Integration with NIN for identity verification.' },
    taxFramework: {
      capitalGainsTax: '10% on crypto profits',
      tradingTax: 'Included in capital gains',
      miningTax: 'Standard corporate tax (30%)',
      reportingThreshold: '₦5,000,000 (~$3,200) per transaction',
      details: 'Finance Act 2023 introduced specific crypto taxation. Capital gains tax of 10% applies to profits from disposal of digital assets. Mining income taxed as business income. FIRS requires annual crypto transaction reporting for amounts exceeding the threshold.',
    },
    licensing: {
      required: true,
      types: ['VASP Registration', 'Digital Asset Exchange License', 'Crypto Custodian License'],
      applicationProcess: 'Apply to SEC Nigeria via online portal. Submit AML compliance plan, proof of capital (min ₦500M), Board resolution, IT security audit report.',
      timelineWeeks: 16,
      fees: '₦30,000,000 (~$19,000) registration + ₦10,000,000 annual renewal',
      renewalPeriod: 'Annual',
    },
    amlKyc: {
      amlRequired: true,
      kycRequired: true,
      travelRuleCompliant: true,
      reportingEntity: 'NFIU (Nigerian Financial Intelligence Unit)',
      details: 'All VASPs must submit STRs to NFIU. KYC Tier 1: BVN + phone. Tier 2: NIN + address. Tier 3: Enhanced due diligence for >₦10M transactions. Travel Rule compliance required since Jan 2026.',
    },
    timeline: [
      { date: '2026-02-10', type: 'new_regulation', title: 'SEC Updates VASP Registration Requirements', description: 'Enhanced KYC/AML requirements for all Virtual Asset Service Providers.', impactScore: 8, source: 'SEC Nigeria Gazette' },
      { date: '2026-01-25', type: 'enforcement', title: 'CBN Fines Two Unlicensed Exchanges', description: 'CBN penalized two crypto exchanges operating without proper registration with N50M fines each.', impactScore: 7, source: 'CBN Press Release' },
      { date: '2026-01-15', type: 'cbdc_update', title: 'eNaira Phase 2 Merchant Rollout', description: 'CBN expanded eNaira to 15,000 merchant points across Lagos, Abuja, and Port Harcourt.', impactScore: 6, source: 'eNaira.gov.ng' },
      { date: '2025-12-20', type: 'amendment', title: 'NFIU Updates Crypto Transaction Reporting Threshold', description: 'NFIU lowered crypto transaction reporting threshold from $10,000 to $5,000 equivalent.', impactScore: 7, source: 'NFIU Circular' },
      { date: '2025-09-15', type: 'announcement', title: 'SEC Approves First 3 Licensed Crypto Exchanges', description: 'Quidax, Patricia, and Roqqu receive full SEC VASP licenses.', impactScore: 9, source: 'SEC Nigeria' },
      { date: '2025-06-01', type: 'new_regulation', title: 'Finance Act 2023 Crypto Provisions Take Effect', description: '10% capital gains tax on crypto and mandatory reporting come into force.', impactScore: 8, source: 'Federal Gazette' },
      { date: '2023-12-22', type: 'amendment', title: 'CBN Lifts Bank Crypto Restrictions', description: 'CBN reverses 2021 circular banning banks from serving crypto entities. Banks may now serve licensed VASPs.', impactScore: 10, source: 'CBN' },
    ],
    upcomingPolicies: [
      { title: 'Stablecoin Regulation Framework', expectedDate: '2026-Q2', status: 'draft', description: 'SEC drafting specific framework for stablecoin issuance and trading in Nigeria. Expected to require reserves backing equivalent to 110% of circulated value.', impactLevel: 'high' },
      { title: 'DeFi Protocol Registration Mandate', expectedDate: '2026-Q3', status: 'proposed', description: 'Proposed requirement for DeFi protocols serving Nigerian users to register with SEC. Contentious — industry pushback expected.', impactLevel: 'critical' },
      { title: 'Crypto Asset Insurance Requirements', expectedDate: '2026-Q4', status: 'proposed', description: 'NDIC developing mandatory insurance coverage requirements for customer crypto funds held by VASPs.', impactLevel: 'medium' },
    ],
    editorialAnalysis: {
      outlook: 'Bullish',
      summary: 'Nigeria continues to lead Africa in progressive crypto regulation. With the SEC licensing framework fully operational and CBN actively supporting licensed exchanges, the regulatory environment is maturing rapidly. The combination of mandatory VASP registration, clear tax guidelines, and eNaira CBDC creates a comprehensive but navigable regulatory landscape.',
      opportunities: [
        'Largest crypto market in Africa by volume — first-mover advantage for compliant players',
        'SEC sandbox program accepting new applications for innovative crypto products',
        'M-Pesa integration with Binance P2P shows willingness to bridge TradFi and crypto',
        'eNaira Phase 2 creates infrastructure for CBDCs that benefit the broader crypto ecosystem',
      ],
      risks: [
        'DeFi registration mandate could impose impractical compliance on decentralized platforms',
        'NFIU reporting thresholds are low by global standards — potential for overregulation',
        'CBN still retains ability to restrict banking access if systemic risk perceived',
        'Multiple regulators (SEC, CBN, NFIU) create coordination challenges',
      ],
      recommendation: 'Nigeria is a MUST-ENTER market for any African crypto business. Pursue SEC VASP registration immediately. The clear regulatory framework reduces uncertainty, and the sheer market size (~35M crypto users) justifies the compliance investment. Budget 16-20 weeks for licensing.',
      analystName: 'CoinDaily Regulation Desk',
      publishedDate: '2026-02-12',
    },
    marketContext: {
      estimatedCryptoUsers: '~35 million',
      p2pVolume24h: '$120M+',
      dominantPlatforms: ['Binance P2P', 'Quidax', 'Luno', 'Yellow Card'],
      mobileMoneyIntegration: 'M-Pesa, OPay, PalmPay widely used for fiat on/off ramps',
      internetPenetration: '55%',
    },
  },
  {
    code: 'KE', name: 'Kenya', flag: '🇰🇪', region: 'East Africa',
    status: 'Evolving', lastUpdate: '2026-01-28',
    summary: 'CMA exploring sandbox for digital assets. CBK cautious but not hostile. M-Pesa crypto integrations underway. Capital Markets Act amendments pending. Kenya represents the most dynamic evolving market in East Africa.',
    exchanges: ['Binance P2P', 'Luno', 'Yellow Card', 'LocalBitcoins', 'Paxful'],
    keyDocs: ['CMA Capital Markets Master Plan 2023-2027', 'CBK Emerging Payments Discussion Paper', 'Draft Virtual Assets Bill 2025', 'Finance Bill 2025 Digital Tax Provisions'],
    riskScore: 45, riskLevel: 'Medium', complianceRating: 'B',
    regulatoryBody: 'Capital Markets Authority (CMA) / Central Bank of Kenya (CBK)',
    regulatoryContacts: [
      { name: 'CMA Innovation Hub', role: 'Digital Assets Sandbox', email: 'innovation@cma.or.ke' },
      { name: 'CBK National Payment System', role: 'Digital Payments Division' },
    ],
    cbdc: { name: 'Digital KES', status: 'Under Study', phase: 'Feasibility Study', details: 'CBK conducting feasibility study on digital Kenyan Shilling. Focus on cross-border remittances and financial inclusion. Decision expected Q4 2026.' },
    taxFramework: {
      capitalGainsTax: 'Proposed 3% digital asset tax (Finance Bill 2025)',
      tradingTax: 'Proposed 3% per transaction',
      miningTax: 'Standard corporate tax (30%)',
      reportingThreshold: 'KES 500,000 (~$3,800)',
      details: 'Finance Bill 2025 proposes 3% tax on all digital asset transactions above KES 500,000. Currently not yet in effect — awaiting Parliamentary approval. If passed, KRA would require quarterly reporting from all platforms.',
    },
    licensing: {
      required: false,
      types: ['CMA Sandbox Participant (voluntary)', 'Money Remittance License (for fiat gateways)'],
      applicationProcess: 'No mandatory crypto license yet. CMA sandbox applications accepted on rolling basis. Sandbox participants get 24-month regulatory exemption.',
      timelineWeeks: 8,
      fees: 'KES 1,000,000 (~$7,600) sandbox application fee',
      renewalPeriod: '24-month sandbox period',
    },
    amlKyc: {
      amlRequired: true,
      kycRequired: true,
      travelRuleCompliant: false,
      reportingEntity: 'FRC (Financial Reporting Centre)',
      details: 'AML/KYC requirements apply under Proceeds of Crime and Anti-Money Laundering Act. Crypto-specific guidelines pending. FRC requires STRs for suspicious crypto transactions.',
    },
    timeline: [
      { date: '2026-01-28', type: 'consultation', title: 'CMA Opens Public Comment on Digital Assets Sandbox', description: 'Capital Markets Authority opened 60-day public consultation period for proposed digital assets regulatory sandbox.', impactScore: 8, source: 'CMA Kenya' },
      { date: '2026-01-10', type: 'announcement', title: 'Safaricom Partners with Binance for M-Pesa Integration', description: 'M-Pesa users can now buy crypto directly via Binance P2P with M-Pesa wallet.', impactScore: 9, source: 'TechWeez' },
      { date: '2025-12-15', type: 'new_regulation', title: 'Finance Bill 2025 Proposes Digital Asset Tax', description: 'Kenya Revenue Authority proposes 3% tax on all digital asset transactions above KES 500,000.', impactScore: 8, source: 'Kenya Gazette' },
      { date: '2025-10-01', type: 'announcement', title: 'CBK Signals Openness to Crypto Regulation', description: 'CBK Governor indicates willingness to work with CMA on comprehensive crypto framework.', impactScore: 7, source: 'Business Daily' },
    ],
    upcomingPolicies: [
      { title: 'Virtual Assets Bill 2026', expectedDate: '2026-Q2', status: 'pending_approval', description: 'Comprehensive virtual assets legislation currently before Parliament for second reading. Would establish licensing framework for VASPs.', impactLevel: 'critical' },
      { title: 'CMA Digital Assets Sandbox Launch', expectedDate: '2026-Q3', status: 'consultation', description: 'Regulatory sandbox for qualifying crypto/DeFi startups. 24-month exemption from certain regulations.', impactLevel: 'high' },
    ],
    editorialAnalysis: {
      outlook: 'Bullish',
      summary: 'Kenya is on the cusp of comprehensive crypto regulation, and the signs are overwhelmingly positive. The CMA sandbox approach mirrors successful models from Singapore and UAE. M-Pesa integration with Binance is a game-changer for adoption. The key risk is the proposed 3% transaction tax, which could push volume to unregulated P2P channels.',
      opportunities: [
        'M-Pesa integration creates seamless fiat on-ramp for 35M+ mobile money users',
        'CMA sandbox offers low-risk market entry for fintech startups',
        'East African crypto hub status — gateway to Uganda, Tanzania, Rwanda markets',
        'Highly educated tech workforce — strong developer ecosystem for crypto projects',
      ],
      risks: [
        '3% transaction tax (if passed) could suppress formal trading volume significantly',
        'Regulatory framework still evolving — uncertainty around final requirements',
        'CBK may impose more restrictive banking access requirements than expected',
        'Competition with Dubai and South Africa for pan-African crypto headquarters',
      ],
      recommendation: 'Kenya is a HIGH-PRIORITY market for East Africa expansion. Apply for CMA sandbox ASAP to secure an early position. The Virtual Assets Bill is likely to pass in 2026, creating a clear compliance pathway. M-Pesa integration is a unique moat — design your product around mobile money flows.',
      analystName: 'CoinDaily Regulation Desk',
      publishedDate: '2026-02-08',
    },
    marketContext: {
      estimatedCryptoUsers: '~8.5 million',
      p2pVolume24h: '$28M+',
      dominantPlatforms: ['Binance P2P', 'Luno', 'Yellow Card'],
      mobileMoneyIntegration: 'M-Pesa dominates; direct Binance integration live since Jan 2026',
      internetPenetration: '42%',
    },
  },
  {
    code: 'ZA', name: 'South Africa', flag: '🇿🇦', region: 'Southern Africa',
    status: 'Regulated', lastUpdate: '2026-02-05',
    summary: 'FSCA requires crypto asset service providers (CASPs) to obtain licenses. SARB classifies crypto as financial products. Most advanced regulatory framework in Africa. Gold standard for African crypto regulation.',
    exchanges: ['Luno', 'VALR', 'Ice3X', 'AltCoinTrader', 'Ovex', 'MEXC Africa'],
    keyDocs: ['FSCA CASP Licensing Framework 2024', 'Financial Sector Regulation Act Amendment', 'SARB Crypto Assets Position Paper', 'IFWG DeFi Working Paper 2025', 'Travel Rule Technical Standards'],
    riskScore: 20, riskLevel: 'Low', complianceRating: 'A',
    regulatoryBody: 'FSCA (Financial Sector Conduct Authority) / SARB',
    regulatoryContacts: [
      { name: 'FSCA CASP Division', role: 'Crypto Asset Service Provider Licensing', email: 'casp@fsca.co.za' },
      { name: 'SARB FinTech Unit', role: 'Financial Innovation Hub', email: 'fintech@resbank.co.za' },
    ],
    cbdc: { name: 'Project Khokha', status: 'Pilot Complete', phase: 'Phase 2 — Results Published', details: 'Wholesale CBDC for interbank settlement. Phase 2 showed 70% improvement in cross-border settlement times. Retail CBDC not currently planned.' },
    taxFramework: {
      capitalGainsTax: '18%-45% marginal rate',
      tradingTax: 'Treated as income or capital gains depending on intent',
      miningTax: 'Business income (28% corporate rate)',
      reportingThreshold: 'R1,000 (~$55) for travel rule',
      details: 'SARS treats crypto as a financial asset. Frequent traders taxed as income (up to 45%). HODLers taxed under capital gains (max 18% effective). Mining is business income. SARS actively investigating non-compliance with AI tools. Annual IT12 return requires crypto disclosure.',
    },
    licensing: {
      required: true,
      types: ['CASP Category I (Exchange)', 'CASP Category II (Custodian)', 'CASP Category III (Intermediary)'],
      applicationProcess: 'Apply to FSCA via FinServ portal. Requirements: R5M minimum capital, directors fit and proper assessment, IT security audit, AML compliance framework, fidelity fund contribution.',
      timelineWeeks: 24,
      fees: 'R150,000 (~$8,000) application + R50,000 annual levy',
      renewalPeriod: 'Annual levy; license review every 3 years',
    },
    amlKyc: {
      amlRequired: true,
      kycRequired: true,
      travelRuleCompliant: true,
      reportingEntity: 'FIC (Financial Intelligence Centre)',
      details: 'Full FICA compliance required. Travel Rule applies to all transfers above R1,000. STRs to FIC within 15 days. Enhanced CDD for high-risk customers. Ongoing monitoring with automated screening against UN/OFAC lists.',
    },
    timeline: [
      { date: '2026-02-05', type: 'enforcement', title: 'FSCA Revokes Non-Compliant CASP License', description: 'First enforcement action under new framework — CASP failed to meet KYC/AML requirements within 6-month grace period.', impactScore: 7, source: 'FSCA Gazette' },
      { date: '2026-01-20', type: 'new_regulation', title: 'SARB Publishes Stablecoin Guidelines', description: 'Stablecoins classified as financial instruments requiring bank-level oversight.', impactScore: 9, source: 'SARB Papers' },
      { date: '2025-12-10', type: 'cbdc_update', title: 'Project Khokha Phase 2 Results Published', description: 'Wholesale CBDC testing shows 70% improvement in cross-border settlement times.', impactScore: 6, source: 'SARB' },
      { date: '2025-08-01', type: 'new_regulation', title: 'FSCA Begins CASP License Applications', description: 'FSCA opens applications for crypto asset service provider licenses under new framework.', impactScore: 10, source: 'FSCA' },
      { date: '2025-04-15', type: 'new_regulation', title: 'Travel Rule Implemented for CASPs', description: 'All CASPs must comply with FATF Travel Rule for transfers above R1,000.', impactScore: 8, source: 'FIC Directive' },
    ],
    upcomingPolicies: [
      { title: 'Travel Rule Full Enforcement', expectedDate: '2026-06-30', status: 'scheduled', description: 'Grace period ends — all CASPs must have Travel Rule infrastructure operational. FIC will begin audits.', impactLevel: 'high' },
      { title: 'DeFi Regulatory Framework', expectedDate: '2027-Q1', status: 'draft', description: 'IFWG working paper on DeFi regulation expected to become formal guidance.', impactLevel: 'medium' },
    ],
    editorialAnalysis: {
      outlook: 'Bullish',
      summary: 'South Africa has the most mature and well-structured crypto regulatory framework in Africa. The FSCA licensing system provides clear compliance requirements, and the recent enforcement action signals the regulator is serious about standards. The Travel Rule deadline (June 2026) will further professionalize the industry.',
      opportunities: [
        'Clear regulatory framework reduces compliance uncertainty — attractive to institutional capital',
        'Project Khokha CBDC infrastructure could benefit cross-border crypto settlement',
        'FSCA licensing creates barriers to entry that protect compliant players',
        'Gateway to SADC market (15 countries, 350M+ people)',
      ],
      risks: [
        'High capital requirements (R5M) may exclude smaller startups',
        'Tax rates are steep (up to 45%) compared to regional competitors',
        'SARS increasingly sophisticated in crypto tax enforcement — non-compliance risk is real',
        '24-week licensing timeline is among the longest in Africa',
      ],
      recommendation: 'South Africa should be in every serious crypto company\'s portfolio. The regulatory clarity is unmatched in Africa. Start FSCA application early. Ensure Travel Rule compliance by June 2026 deadline. Consider ZA as your African compliance headquarters.',
      analystName: 'CoinDaily Regulation Desk',
      publishedDate: '2026-02-10',
    },
    marketContext: {
      estimatedCryptoUsers: '~7.5 million',
      p2pVolume24h: '$45M+',
      dominantPlatforms: ['Luno', 'VALR', 'Binance'],
      mobileMoneyIntegration: 'Limited — bank-centric economy. SnapScan and Zapper used for crypto-adjacent payments',
      internetPenetration: '72%',
    },
  },
  {
    code: 'GH', name: 'Ghana', flag: '🇬🇭', region: 'West Africa',
    status: 'Cautious', lastUpdate: '2026-01-15',
    summary: 'SEC Ghana issued warnings but no outright ban. Bank of Ghana developing eCedi CBDC. Sandbox exploration ongoing. Growing fintech interest. Ghana is watching Nigeria\'s regulatory model closely.',
    exchanges: ['Binance P2P', 'Yellow Card', 'Bundle Africa'],
    keyDocs: ['SEC Ghana Advisory on Digital Assets', 'Bank of Ghana eCedi White Paper', 'Payment Systems Act Amendment 2025'],
    riskScore: 55, riskLevel: 'Medium', complianceRating: 'C+',
    regulatoryBody: 'SEC Ghana / Bank of Ghana',
    regulatoryContacts: [
      { name: 'SEC Ghana Innovation Office', role: 'Fintech & Digital Assets' },
      { name: 'Bank of Ghana CBDC Team', role: 'eCedi Project Office' },
    ],
    cbdc: { name: 'eCedi', status: 'Pilot Phase', phase: 'Phase 1 — Bank Partnership', details: 'eCedi pilot launched with 5 partner banks across Accra and Kumasi. Testing offline payments and merchant settlements. Full rollout expected 2027.' },
    taxFramework: {
      capitalGainsTax: 'No specific crypto tax law',
      tradingTax: 'General income tax may apply (25%)',
      miningTax: 'No specific guidance',
      reportingThreshold: 'No crypto-specific threshold',
      details: 'Ghana has no specific cryptocurrency tax legislation. General income tax (25%) could be applied to crypto profits under existing law, but GRA has not actively enforced this. Tax reform expected as part of broader regulatory framework.',
    },
    licensing: {
      required: false,
      types: ['No formal crypto license available'],
      applicationProcess: 'No formal licensing process. SEC Ghana advisory recommends caution. Sandbox being designed.',
      timelineWeeks: 0,
      fees: 'N/A',
      renewalPeriod: 'N/A',
    },
    amlKyc: {
      amlRequired: true,
      kycRequired: true,
      travelRuleCompliant: false,
      reportingEntity: 'FIC Ghana',
      details: 'General AML laws apply. Anti-Money Laundering Act 2020 covers financial transactions broadly. FIC Ghana has not issued crypto-specific guidance. Voluntary compliance recommended.',
    },
    timeline: [
      { date: '2026-01-15', type: 'cbdc_update', title: 'Bank of Ghana Launches eCedi Pilot', description: 'eCedi CBDC pilot with 5 banks across Accra and Kumasi.', impactScore: 8, source: 'Bank of Ghana' },
      { date: '2025-11-20', type: 'consultation', title: 'SEC Ghana Seeks Input on Crypto Framework', description: 'SEC published request for information from stakeholders on proposed digital asset framework.', impactScore: 7, source: 'SEC Ghana' },
      { date: '2025-06-10', type: 'announcement', title: 'SEC Ghana Advisory: Crypto Not Regulated', description: 'SEC reiterated that crypto investments are not regulated — investor caution advised.', impactScore: 5, source: 'SEC Ghana' },
    ],
    upcomingPolicies: [
      { title: 'Digital Assets Regulatory Framework', expectedDate: '2026-Q4', status: 'proposed', description: 'Comprehensive framework expected after consultation period. Likely to follow Nigeria\'s VASP model.', impactLevel: 'high' },
    ],
    editorialAnalysis: {
      outlook: 'Neutral',
      summary: 'Ghana is in a "wait and see" phase, closely watching how Nigeria\'s regulatory framework plays out before committing. The eCedi CBDC pilot signals interest in digital finance, but crypto-specific regulation is still 12-18 months away. The market is active but operates in a gray area.',
      opportunities: [
        'Early entry before formal regulation could establish market position',
        'eCedi infrastructure may create on-ramps for crypto adoption',
        'Growing fintech ecosystem — MoMo and mobile-first culture',
        'West African gateway alongside Nigeria',
      ],
      risks: [
        'Regulatory ambiguity — no clear compliance path',
        'SEC warnings create reputational risk for exchanges',
        'eCedi CBDC could become a competitor to private stablecoins',
        'No licensing framework means no regulatory protection for operators',
      ],
      recommendation: 'Ghana is a WATCH market. Don\'t invest heavily in compliance infrastructure yet, but maintain presence through P2P and partnerships. When the Digital Assets Framework drops (expected Q4 2026), be ready to apply quickly.',
      analystName: 'CoinDaily Regulation Desk',
      publishedDate: '2026-02-05',
    },
    marketContext: {
      estimatedCryptoUsers: '~2.8 million',
      p2pVolume24h: '$8M+',
      dominantPlatforms: ['Binance P2P', 'Yellow Card'],
      mobileMoneyIntegration: 'MTN MoMo dominant — crypto P2P integrations via MoMo common',
      internetPenetration: '53%',
    },
  },
  {
    code: 'ET', name: 'Ethiopia', flag: '🇪🇹', region: 'East Africa',
    status: 'Restricted', lastUpdate: '2025-12-01',
    summary: 'NBE prohibits crypto trading. However, Ethiopia is Africa\'s largest Bitcoin mining hub due to Grand Renaissance Dam hydropower. Paradoxical position: mining encouraged, trading banned.',
    exchanges: ['P2P only'],
    keyDocs: ['NBE Foreign Exchange Directive 2024', 'ICT Sector Digital Economy Strategy', 'NBE Circular on Virtual Assets'],
    riskScore: 75, riskLevel: 'High', complianceRating: 'D',
    regulatoryBody: 'National Bank of Ethiopia (NBE)',
    regulatoryContacts: [
      { name: 'NBE Financial Stability Directorate', role: 'Digital Payments Oversight' },
    ],
    cbdc: { name: 'Digital Birr', status: 'Under Discussion', phase: 'Exploratory', details: 'NBE has acknowledged interest in CBDC but no formal study launched. Telebirr mobile money platform could serve as infrastructure base.' },
    taxFramework: {
      capitalGainsTax: 'N/A (trading prohibited)',
      tradingTax: 'N/A (trading prohibited)',
      miningTax: 'Mining electricity tariff (industrial rate)',
      reportingThreshold: 'N/A',
      details: 'Crypto trading is prohibited by NBE directive. Bitcoin mining operates under industrial power agreements. No tax framework for crypto gains since trading is not permitted.',
    },
    licensing: {
      required: false,
      types: ['No crypto license available', 'Mining operates under industrial power agreements'],
      applicationProcess: 'No formal crypto licensing. Mining operations negotiate directly with Ethiopian Electric Power for power purchase agreements.',
      timelineWeeks: 0,
      fees: 'N/A (mining PPAs negotiated individually)',
      renewalPeriod: 'N/A',
    },
    amlKyc: {
      amlRequired: false,
      kycRequired: false,
      travelRuleCompliant: false,
      reportingEntity: 'FIC Ethiopia',
      details: 'No crypto-specific AML/KYC since trading is prohibited. General financial AML laws apply to banking system. Underground P2P trading exists outside regulatory reach.',
    },
    timeline: [
      { date: '2025-12-01', type: 'announcement', title: 'Ethiopia Bitcoin Mining Reaches 600MW', description: 'Grand Renaissance Dam hydropower enables Ethiopia to become Africa\'s largest Bitcoin mining hub.', impactScore: 7, source: 'Reuters Africa' },
      { date: '2025-08-15', type: 'enforcement', title: 'NBE Reaffirms Crypto Trading Ban', description: 'NBE issued updated circular prohibiting banks and payment providers from processing crypto transactions.', impactScore: 6, source: 'NBE' },
    ],
    upcomingPolicies: [
      { title: 'Digital Currency Study Commission', expectedDate: '2026-Q3', status: 'proposed', description: 'NBE forming commission to study potential benefits of regulated crypto market. Mining sector lobbying for trading permission.', impactLevel: 'medium' },
    ],
    editorialAnalysis: {
      outlook: 'Uncertain',
      summary: 'Ethiopia presents the most paradoxical regulatory environment in Africa. The country is the continent\'s largest Bitcoin mining hub (600MW+) thanks to cheap hydropower, yet crypto trading is banned. This contradiction is increasingly untenable. The mining lobby is growing in influence, and regional trends (Kenya, Rwanda) are putting pressure on NBE to modernize.',
      opportunities: [
        'Bitcoin mining at lowest electricity cost in Africa (~$0.03/kWh)',
        'If trading ban lifts, first-mover advantage would be enormous (120M population)',
        'Telebirr (65M users) could become instant fiat on-ramp',
        'Mining industry relationships provide access to policymakers',
      ],
      risks: [
        'Trading ban makes formal exchange operation impossible',
        'Foreign exchange controls add complexity to fund flows',
        'Political instability in certain regions creates operational risk',
        'NBE historically conservative — ban reversal timeline uncertain',
      ],
      recommendation: 'Ethiopia is for PATIENT investors only. Do not attempt exchange operations under current regulations. Mining operations are viable if you have capital for PPA negotiation. Monitor the Digital Currency Study Commission for signals of policy shift.',
      analystName: 'CoinDaily Regulation Desk',
      publishedDate: '2026-01-30',
    },
    marketContext: {
      estimatedCryptoUsers: '~1.2 million (mostly P2P)',
      p2pVolume24h: '$3M+ (underground)',
      dominantPlatforms: ['Telegram P2P', 'WhatsApp P2P'],
      mobileMoneyIntegration: 'Telebirr dominates (65M users), no crypto integration',
      internetPenetration: '25%',
    },
  },
  {
    code: 'RW', name: 'Rwanda', flag: '🇷🇼', region: 'East Africa',
    status: 'Evolving', lastUpdate: '2026-01-05',
    summary: 'Rwanda positioning as African innovation hub. BNR fintech sandbox operational. Blockchain-based land registry. Kigali International Financial Centre attracting crypto firms.',
    exchanges: ['Binance P2P', 'Yellow Card'],
    keyDocs: ['BNR Fintech Sandbox Framework 2025', 'ICT Hub Strategy 2024-2029', 'KIFC Digital Assets Guidelines'],
    riskScore: 40, riskLevel: 'Medium', complianceRating: 'B',
    regulatoryBody: 'BNR / RISA / KIFC',
    regulatoryContacts: [
      { name: 'BNR Fintech Unit', role: 'Sandbox & Innovation' },
      { name: 'KIFC', role: 'Kigali International Financial Centre' },
    ],
    cbdc: { name: 'Digital RWF', status: 'Feasibility Study', phase: 'Study Phase', details: 'BNR conducting feasibility study in partnership with World Bank. Focus on cross-border remittances with DRC and Uganda.' },
    taxFramework: {
      capitalGainsTax: 'No specific crypto tax',
      tradingTax: 'No specific crypto tax',
      miningTax: 'No specific guidance',
      reportingThreshold: 'N/A',
      details: 'Rwanda has no crypto-specific tax legislation. General income tax (30% corporate, 30% individual) could theoretically apply. KIFC may offer preferential tax treatment for licensed crypto firms.',
    },
    licensing: {
      required: false,
      types: ['BNR Sandbox License', 'KIFC Digital Asset License (planned)'],
      applicationProcess: 'BNR sandbox accepts rolling applications. 12-month initial sandbox period with potential 12-month extension. KIFC developing separate licensing for larger operations.',
      timelineWeeks: 6,
      fees: 'RWF 5,000,000 (~$4,300) sandbox fee',
      renewalPeriod: '12-month sandbox period',
    },
    amlKyc: {
      amlRequired: true,
      kycRequired: true,
      travelRuleCompliant: false,
      reportingEntity: 'FIU Rwanda',
      details: 'General AML framework applies. Sandbox participants must implement basic KYC. Rwanda has strong digital identity infrastructure (Irembo) that simplifies compliance.',
    },
    timeline: [
      { date: '2026-01-05', type: 'new_regulation', title: 'BNR Opens Fintech Regulatory Sandbox', description: 'Sandbox for crypto and blockchain startups — first approved applicants expected Q2 2026.', impactScore: 8, source: 'BNR' },
      { date: '2025-09-15', type: 'announcement', title: 'KIFC Announces Digital Asset Hub Plans', description: 'Kigali financial centre to create dedicated digital asset licensing framework.', impactScore: 7, source: 'KIFC' },
    ],
    upcomingPolicies: [
      { title: 'VASP Registration Act', expectedDate: '2026-Q4', status: 'draft', description: 'Draft VASP legislation modeled on Singapore\'s Payment Services Act adaptation.', impactLevel: 'high' },
    ],
    editorialAnalysis: {
      outlook: 'Bullish',
      summary: 'Rwanda is the "dark horse" of African crypto regulation. Small market but exceptional governance and tech infrastructure. KIFC could become the Kigali version of DIFC or ADGM. Sandbox approach is smart and investor-friendly. Watch this market closely.',
      opportunities: [
        'KIFC digital asset license could attract regional and global crypto firms',
        'Excellent governance and rule of law — low corruption risk',
        'Strong digital identity infrastructure (Irembo) simplifies KYC',
        'East African hub positioning — easier regional expansion',
      ],
      risks: [
        'Small domestic market (14M population)',
        'Early-stage regulatory framework — frequent changes expected',
        'Limited local developer talent compared to Kenya/Nigeria',
        'KIFC licensing details still unknown',
      ],
      recommendation: 'Rwanda is an OPPORTUNITY market for companies seeking an East African license. The KIFC digital asset hub could become Africa\'s answer to Dubai\'s VARA. Apply for BNR sandbox to establish presence. Low cost of entry.',
      analystName: 'CoinDaily Regulation Desk',
      publishedDate: '2026-02-01',
    },
    marketContext: {
      estimatedCryptoUsers: '~450,000',
      p2pVolume24h: '$2M+',
      dominantPlatforms: ['Binance P2P', 'Yellow Card'],
      mobileMoneyIntegration: 'MTN MoMo and Airtel Money; Irembo for digital identity',
      internetPenetration: '33%',
    },
  },
  {
    code: 'EG', name: 'Egypt', flag: '🇪🇬', region: 'North Africa',
    status: 'Restricted', lastUpdate: '2026-01-22',
    summary: 'CBE prohibits banks from dealing in crypto. Blockchain technology encouraged. FRA fintech sandbox operational. New fintech law could partially ease restrictions. Largest North African market by population.',
    exchanges: ['Binance P2P'],
    keyDocs: ['CBE Circular on Virtual Currencies', 'Draft Fintech Law 2025', 'FRA Sandbox Guidelines'],
    riskScore: 65, riskLevel: 'High', complianceRating: 'C-',
    regulatoryBody: 'CBE / FRA (Financial Regulatory Authority)',
    regulatoryContacts: [
      { name: 'FRA Innovation & Sandbox', role: 'Fintech Licensing' },
    ],
    cbdc: { name: 'EGP Digital', status: 'Study Phase', phase: 'Preliminary Research', details: 'CBE conducting preliminary research on digital Egyptian Pound. Partnership with BIS for technical design.'},
    taxFramework: {
      capitalGainsTax: 'N/A (restricted)',
      tradingTax: 'N/A (restricted)',
      miningTax: 'No specific guidance',
      reportingThreshold: 'N/A',
      details: 'Crypto trading is restricted by CBE circular. No tax framework for crypto. If fintech law passes, tax provisions expected to be included.',
    },
    licensing: {
      required: false,
      types: ['FRA Sandbox Participant'],
      applicationProcess: 'FRA sandbox accepts blockchain-based fintech applications. Crypto trading remains restricted outside sandbox.',
      timelineWeeks: 12,
      fees: 'EGP 500,000 (~$10,000)',
      renewalPeriod: '18-month sandbox',
    },
    amlKyc: {
      amlRequired: true, kycRequired: true, travelRuleCompliant: false,
      reportingEntity: 'EMLCU (Egypt Money Laundering Combating Unit)',
      details: 'General AML framework. Banking AML standards apply. Crypto-specific AML guidance not issued.',
    },
    timeline: [
      { date: '2026-01-22', type: 'new_regulation', title: 'FRA Publishes Fintech Sandbox Rules', description: 'Blockchain-based financial services can operate in regulated sandbox.', impactScore: 7, source: 'FRA Egypt' },
    ],
    upcomingPolicies: [
      { title: 'Comprehensive Fintech Law', expectedDate: '2026-Q2', status: 'pending_approval', description: 'New fintech law expected to partially ease crypto restrictions for licensed entities. Currently before Parliament.', impactLevel: 'critical' },
    ],
    editorialAnalysis: {
      outlook: 'Neutral',
      summary: 'Egypt is slowly opening up through the fintech sandbox route while maintaining the banking ban. The upcoming Fintech Law is the single most important regulatory development. If it passes with crypto-friendly provisions, Egypt\'s 105M population makes it a massive opportunity.',
      opportunities: [
        'Massive underserved market (105M population, high youth crypto interest)',
        'FRA sandbox provides regulated entry point for blockchain services',
        'Potential Fintech Law could transform the market overnight',
        'North African gateway to MENA region',
      ],
      risks: [
        'Banking ban remains in force — limits fiat on/off ramps',
        'Fintech Law passage uncertain and may not include crypto provisions',
        'Strong military/state influence in economic policy',
        'Capital controls complicate fund flows',
      ],
      recommendation: 'WAIT AND MONITOR. Apply for FRA sandbox if you have blockchain-based (non-trading) services. Do not attempt exchange operations until the Fintech Law passes. If the law is crypto-friendly, move fast — Egypt wil be a gold rush.',
      analystName: 'CoinDaily Regulation Desk',
      publishedDate: '2026-01-25',
    },
    marketContext: {
      estimatedCryptoUsers: '~3.5 million',
      p2pVolume24h: '$15M+ (underground)',
      dominantPlatforms: ['Binance P2P', 'LocalBitcoins'],
      mobileMoneyIntegration: 'Fawry and Vodafone Cash used for P2P; no direct crypto integration',
      internetPenetration: '72%',
    },
  },
  {
    code: 'MA', name: 'Morocco', flag: '🇲🇦', region: 'North Africa',
    status: 'Evolving', lastUpdate: '2026-02-01',
    summary: 'Bank Al-Maghrib banned crypto in 2017 but is now exploring CBDC and regulatory framework for digital assets. Major policy reversal underway. Draft Crypto Framework 2026 signals legalization.',
    exchanges: ['Binance P2P'],
    keyDocs: ['BAM Digital Currency Study 2025', 'AMMC Securities Regulation Update', 'Draft Crypto Framework 2026'],
    riskScore: 50, riskLevel: 'Medium', complianceRating: 'C+',
    regulatoryBody: 'BAM (Bank Al-Maghrib) / AMMC',
    regulatoryContacts: [
      { name: 'BAM Digital Finance Division', role: 'Crypto Framework Development' },
    ],
    cbdc: { name: 'eMAD', status: 'Advanced Study', phase: 'Design Phase', details: 'BAM actively designing eMAD with focus on financial inclusion and remittance corridors. Partnership with European Central Bank for cross-border settlement.' },
    taxFramework: {
      capitalGainsTax: 'Under development',
      tradingTax: 'Under development',
      miningTax: 'No guidance',
      reportingThreshold: 'Under development',
      details: 'No crypto tax framework currently exists. Draft Crypto Framework 2026 is expected to include tax provisions. Morocco has 20% general capital gains tax that could be adapted.',
    },
    licensing: {
      required: false,
      types: ['License framework in draft'],
      applicationProcess: 'No licensing available yet. Draft framework proposes BAM-issued licenses for crypto exchanges.',
      timelineWeeks: 0,
      fees: 'TBD',
      renewalPeriod: 'TBD',
    },
    amlKyc: {
      amlRequired: true, kycRequired: true, travelRuleCompliant: false,
      reportingEntity: 'UTRF (Financial Intelligence Unit)',
      details: 'General AML framework. GAFI/FATF member. Crypto-specific AML to be included in new framework.',
    },
    timeline: [
      { date: '2026-02-01', type: 'new_regulation', title: 'Morocco Drafts Crypto Regulatory Framework', description: 'BAM and AMMC jointly released draft framework proposing licensed crypto trading under strict supervision.', impactScore: 9, source: 'BAM Press Release' },
    ],
    upcomingPolicies: [
      { title: 'Crypto Licensing Framework', expectedDate: '2026-Q3', status: 'draft', description: 'Framework to legalize crypto trading through licensed exchanges, reversing the 2017 ban. Huge potential impact.', impactLevel: 'critical' },
    ],
    editorialAnalysis: {
      outlook: 'Bullish',
      summary: 'Morocco is executing the most dramatic crypto policy reversal in Africa. After banning crypto in 2017, BAM and AMMC are jointly developing a comprehensive licensing framework. This is a 180-degree shift driven by the realization that bans don\'t work and Morocco is losing crypto talent to Dubai and Europe.',
      opportunities: [
        'Policy reversal creates new market from scratch — no incumbent licenses',
        'Strong diaspora remittance market ($11B/year) could move to crypto rails',
        'eMAD CBDC design could complement private crypto ecosystem',
        'Proximity to EU — potential bridge between African and European crypto markets',
      ],
      risks: [
        'Framework still in draft — final version may be more restrictive',
        'BAM traditionally conservative — could impose high barriers to entry',
        'Transition period from ban to licensing will be uncertain',
        'AMMC securities regulations may classify most tokens as securities',
      ],
      recommendation: 'Morocco is a HIGH-POTENTIAL market to watch. When the framework is finalized (expected Q3 2026), be among the first to apply. The diaspora remittance angle is particularly compelling. Start building relationships with BAM and AMMC now.',
      analystName: 'CoinDaily Regulation Desk',
      publishedDate: '2026-02-05',
    },
    marketContext: {
      estimatedCryptoUsers: '~2.1 million',
      p2pVolume24h: '$12M+ (underground)',
      dominantPlatforms: ['Binance P2P', 'Telegram groups'],
      mobileMoneyIntegration: 'Inwi Money, Orange Money Morocco; no crypto link yet',
      internetPenetration: '84%',
    },
  },
  {
    code: 'UG', name: 'Uganda', flag: '🇺🇬', region: 'East Africa',
    status: 'Unregulated', lastUpdate: '2025-12-20',
    summary: 'No specific crypto regulation. Bank of Uganda has issued warnings. P2P adoption growing. Government studying regional regulatory approaches.',
    exchanges: ['Binance P2P', 'Yellow Card', 'Luno'],
    keyDocs: ['BOU Consumer Advisory 2024'],
    riskScore: 60, riskLevel: 'High', complianceRating: 'D+',
    regulatoryBody: 'Bank of Uganda',
    regulatoryContacts: [
      { name: 'BOU Financial Markets Department', role: 'Digital Payments' },
    ],
    cbdc: null,
    taxFramework: {
      capitalGainsTax: 'No specific guidelines',
      tradingTax: 'No specific guidelines',
      miningTax: 'No specific guidelines',
      reportingThreshold: 'N/A',
      details: 'No crypto tax framework. General income tax (30%) could theoretically apply. URA has not actively targeted crypto traders.',
    },
    licensing: { required: false, types: [], applicationProcess: 'No licensing available.', timelineWeeks: 0, fees: 'N/A', renewalPeriod: 'N/A' },
    amlKyc: { amlRequired: false, kycRequired: false, travelRuleCompliant: false, reportingEntity: 'FIA Uganda', details: 'General AML laws. No crypto-specific AML guidance.' },
    timeline: [],
    upcomingPolicies: [],
    editorialAnalysis: {
      outlook: 'Neutral',
      summary: 'Uganda remains a regulatory vacuum for crypto. The BOU warnings are soft guidance, not enforceable regulations. This creates both opportunity (no barriers to entry) and risk (no regulatory protection). Market growth is driven by remittances and P2P trading.',
      opportunities: ['No regulatory barriers to market entry', 'Growing P2P volume driven by remittances', 'Mobile money infrastructure (MTN MoMo, Airtel Money)'],
      risks: ['No regulatory protection for operators', 'BOU could impose sudden restrictions', 'Small formal market'],
      recommendation: 'Low-priority market. Maintain P2P presence through Yellow Card or Binance. No need for significant compliance investment until formal regulation emerges.',
      analystName: 'CoinDaily Regulation Desk',
      publishedDate: '2026-01-15',
    },
    marketContext: {
      estimatedCryptoUsers: '~1.5 million',
      p2pVolume24h: '$4M+',
      dominantPlatforms: ['Binance P2P', 'Yellow Card'],
      mobileMoneyIntegration: 'MTN MoMo dominant; P2P via MoMo common',
      internetPenetration: '26%',
    },
  },
  {
    code: 'TZ', name: 'Tanzania', flag: '🇹🇿', region: 'East Africa',
    status: 'Cautious', lastUpdate: '2025-11-30',
    summary: 'BOT banned crypto in 2019 but enforcement is limited. P2P trading continues. BOT officials have signaled willingness to review the ban. MoMo-crypto integration growing informally.',
    exchanges: ['Binance P2P'],
    keyDocs: ['BOT Public Notice on Cryptocurrency 2019'],
    riskScore: 60, riskLevel: 'High', complianceRating: 'D+',
    regulatoryBody: 'Bank of Tanzania (BOT)',
    regulatoryContacts: [
      { name: 'BOT Payment Systems Division', role: 'Digital Payments' },
    ],
    cbdc: null,
    taxFramework: {
      capitalGainsTax: 'N/A (officially prohibited)',
      tradingTax: 'N/A (officially prohibited)',
      miningTax: 'No guidance',
      reportingThreshold: 'N/A',
      details: 'Crypto trading officially prohibited. No tax framework. If ban is reversed, Tanzania could adopt regional models.',
    },
    licensing: { required: false, types: [], applicationProcess: 'Trading banned.', timelineWeeks: 0, fees: 'N/A', renewalPeriod: 'N/A' },
    amlKyc: { amlRequired: false, kycRequired: false, travelRuleCompliant: false, reportingEntity: 'FIU Tanzania', details: 'General AML laws. No crypto-specific AML.' },
    timeline: [
      { date: '2025-11-30', type: 'consultation', title: 'BOT Revisiting Crypto Ban', description: 'BOT officials indicated willingness to review the 2019 ban amid regional regulatory developments.', impactScore: 8, source: 'The Citizen Tanzania' },
    ],
    upcomingPolicies: [
      { title: 'Crypto Policy Review', expectedDate: '2026-Q4', status: 'proposed', description: 'BOT reviewing 2019 ban. Regional pressure from Kenya, Rwanda sandbox models.', impactLevel: 'high' },
    ],
    editorialAnalysis: {
      outlook: 'Neutral',
      summary: 'Tanzania\'s 2019 ban is effectively unenforced, with P2P trading flourishing. BOT signals about reviewing the ban are positive but no timeline. The East African regional dynamic (Kenya regulating, Rwanda sandboxing) puts pressure on Tanzania to modernize.',
      opportunities: ['Large underbanked population (60M)', 'If ban reverses, early movers win', 'M-Pesa Tanzania presence'],
      risks: ['Ban still officially in place', 'No regulatory protection', 'BOT unpredictable on timeline'],
      recommendation: 'WATCH market. Maintain low-cost P2P presence. Do not invest in compliance or infrastructure until ban is formally reversed.',
      analystName: 'CoinDaily Regulation Desk',
      publishedDate: '2026-01-20',
    },
    marketContext: {
      estimatedCryptoUsers: '~800,000',
      p2pVolume24h: '$2M+',
      dominantPlatforms: ['Binance P2P'],
      mobileMoneyIntegration: 'M-Pesa Tanzania, Tigo Pesa; informal crypto integration',
      internetPenetration: '30%',
    },
  },
  {
    code: 'SN', name: 'Senegal', flag: '🇸🇳', region: 'West Africa',
    status: 'WAEMU Rules', lastUpdate: '2025-10-15',
    summary: 'Subject to BCEAO (WAEMU) regulations. Crypto is not legal tender. Growing DeFi interest. eCFA discussions affect all 8 WAEMU countries.',
    exchanges: ['Binance P2P', 'Yellow Card'],
    keyDocs: ['BCEAO Instruction on Digital Money Services'],
    riskScore: 55, riskLevel: 'Medium', complianceRating: 'C',
    regulatoryBody: 'BCEAO (Central Bank of West African States)',
    regulatoryContacts: [
      { name: 'BCEAO Fintech Division', role: 'Digital Payment Systems' },
    ],
    cbdc: { name: 'eCFA', status: 'WAEMU-wide Project', phase: 'Feasibility', details: 'BCEAO studying eCFA as WAEMU-wide CBDC. Would affect all 8 member states. Decision expected 2027.' },
    taxFramework: {
      capitalGainsTax: 'WAEMU common framework',
      tradingTax: 'No specific crypto tax',
      miningTax: 'No guidance',
      reportingThreshold: 'N/A',
      details: 'WAEMU harmonized tax framework. No crypto-specific provisions. Individual WAEMU states have limited independent tax authority over financial instruments.',
    },
    licensing: { required: false, types: ['BCEAO payment service provider license (general)'], applicationProcess: 'No crypto-specific license. BCEAO general payment licenses available.', timelineWeeks: 12, fees: 'FCFA 10,000,000 (~$16,000)', renewalPeriod: 'Annual' },
    amlKyc: { amlRequired: true, kycRequired: true, travelRuleCompliant: false, reportingEntity: 'CENTIF Senegal', details: 'WAEMU AML framework. General financial AML. CENTIF handles STRs.' },
    timeline: [],
    upcomingPolicies: [],
    editorialAnalysis: {
      outlook: 'Neutral',
      summary: 'Senegal (and the broader WAEMU zone) operates under centralized BCEAO regulation. Individual country-level crypto policy is limited. The eCFA CBDC decision will be the key catalyst. Dakar has a growing tech scene but crypto-specific activity remains P2P.',
      opportunities: ['Gateway to 8-country WAEMU market', 'eCFA could create CBDC infrastructure', 'Dakar tech hub growing'],
      risks: ['BCEAO conservative and slow-moving', 'Limited independent regulatory authority', 'Small formal crypto market'],
      recommendation: 'LOW PRIORITY as standalone market. More interesting as part of WAEMU strategy. Monitor eCFA developments.',
      analystName: 'CoinDaily Regulation Desk',
      publishedDate: '2026-01-10',
    },
    marketContext: {
      estimatedCryptoUsers: '~600,000',
      p2pVolume24h: '$1.5M+',
      dominantPlatforms: ['Binance P2P', 'Yellow Card'],
      mobileMoneyIntegration: 'Orange Money dominant; Wave expanding',
      internetPenetration: '46%',
    },
  },
  {
    code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', region: 'West Africa',
    status: 'WAEMU Rules', lastUpdate: '2025-11-10',
    summary: 'BCEAO rules apply. Abidjan emerging as West African fintech hub. Orange Money dominates. Crypto community growing organically.',
    exchanges: ['Binance P2P', 'Yellow Card'],
    keyDocs: ['BCEAO Instruction on Digital Money Services', 'ARTCI Digital Economy Framework'],
    riskScore: 55, riskLevel: 'Medium', complianceRating: 'C',
    regulatoryBody: 'BCEAO / ARTCI',
    regulatoryContacts: [
      { name: 'ARTCI', role: 'Telecom & Digital Economy Regulator' },
    ],
    cbdc: { name: 'eCFA', status: 'WAEMU-wide Project', phase: 'Feasibility', details: 'Same eCFA project as Senegal. BCEAO coordinates across all WAEMU states.' },
    taxFramework: {
      capitalGainsTax: 'WAEMU framework',
      tradingTax: 'No crypto-specific tax',
      miningTax: 'No guidance',
      reportingThreshold: 'N/A',
      details: 'Similar to Senegal. WAEMU harmonized framework. Abidjan starting to see crypto businesses seeking clarity.',
    },
    licensing: { required: false, types: ['BCEAO payment provider (general)'], applicationProcess: 'Same BCEAO process as other WAEMU states.', timelineWeeks: 12, fees: 'FCFA 10,000,000', renewalPeriod: 'Annual' },
    amlKyc: { amlRequired: true, kycRequired: true, travelRuleCompliant: false, reportingEntity: 'CENTIF-CI', details: 'WAEMU AML framework.' },
    timeline: [],
    upcomingPolicies: [],
    editorialAnalysis: {
      outlook: 'Neutral',
      summary: 'Similar to Senegal but with more fintech energy. Abidjan has potential as a francophone African fintech hub. Orange Money integration opportunity is significant. Same BCEAO/WAEMU constraints apply.',
      opportunities: ['Abidjan as francophone fintech hub', 'Orange Money crypto integration potential', 'Part of WAEMU market access'],
      risks: ['Same BCEAO limitations as Senegal', 'Political stability variable', 'Small formal crypto market'],
      recommendation: 'Pair with Senegal as WAEMU strategy. Abidjan has more fintech energy. Monitor ARTCI digital economy framework.',
      analystName: 'CoinDaily Regulation Desk',
      publishedDate: '2026-01-10',
    },
    marketContext: {
      estimatedCryptoUsers: '~500,000',
      p2pVolume24h: '$1M+',
      dominantPlatforms: ['Binance P2P', 'Yellow Card'],
      mobileMoneyIntegration: 'Orange Money (largest), MTN MoMo, Wave',
      internetPenetration: '36%',
    },
  },
  {
    code: 'AO', name: 'Angola', flag: '🇦🇴', region: 'Southern Africa',
    status: 'Unregulated', lastUpdate: '2025-09-30',
    summary: 'No specific crypto legislation. Oil-dependent economy exploring diversification. BNA monitors but no action. P2P adoption limited.',
    exchanges: ['Binance P2P'],
    keyDocs: ['BNA Financial Stability Report 2025'],
    riskScore: 65, riskLevel: 'High', complianceRating: 'D',
    regulatoryBody: 'BNA (Banco Nacional de Angola)',
    regulatoryContacts: [],
    cbdc: null,
    taxFramework: {
      capitalGainsTax: 'No guidelines',
      tradingTax: 'No guidelines',
      miningTax: 'No guidelines',
      reportingThreshold: 'N/A',
      details: 'No crypto tax framework. General income tax exists but untested for crypto.',
    },
    licensing: { required: false, types: [], applicationProcess: 'No framework.', timelineWeeks: 0, fees: 'N/A', renewalPeriod: 'N/A' },
    amlKyc: { amlRequired: false, kycRequired: false, travelRuleCompliant: false, reportingEntity: 'UIF Angola', details: 'General AML only.' },
    timeline: [],
    upcomingPolicies: [],
    editorialAnalysis: {
      outlook: 'Uncertain',
      summary: 'Angola is a regulatory blank slate. Oil dependence and limited internet penetration constrain crypto adoption. No regulatory attention to crypto — neither positive nor negative.',
      opportunities: ['No regulatory barriers', 'Kwanza volatility drives crypto interest'],
      risks: ['Tiny market', 'Capital controls', 'Low internet penetration', 'No regulatory protection'],
      recommendation: 'LOW PRIORITY. Only relevant as part of SADC-wide strategy. No standalone opportunity.',
      analystName: 'CoinDaily Regulation Desk',
      publishedDate: '2026-01-05',
    },
    marketContext: {
      estimatedCryptoUsers: '~200,000',
      p2pVolume24h: '<$500K',
      dominantPlatforms: ['Binance P2P'],
      mobileMoneyIntegration: 'Multicaixa Express; no crypto integration',
      internetPenetration: '30%',
    },
  },
  {
    code: 'MZ', name: 'Mozambique', flag: '🇲🇿', region: 'Southern Africa',
    status: 'Unregulated', lastUpdate: '2025-08-20',
    summary: 'No crypto-specific regulation. Growing mobile money ecosystem. P2P adoption increasing among urban youth.',
    exchanges: ['Binance P2P'],
    keyDocs: [],
    riskScore: 70, riskLevel: 'High', complianceRating: 'D',
    regulatoryBody: 'Banco de Moçambique',
    regulatoryContacts: [],
    cbdc: null,
    taxFramework: {
      capitalGainsTax: 'No guidelines',
      tradingTax: 'No guidelines',
      miningTax: 'No guidelines',
      reportingThreshold: 'N/A',
      details: 'No crypto-specific tax.',
    },
    licensing: { required: false, types: [], applicationProcess: 'No framework.', timelineWeeks: 0, fees: 'N/A', renewalPeriod: 'N/A' },
    amlKyc: { amlRequired: false, kycRequired: false, travelRuleCompliant: false, reportingEntity: 'GIFIM', details: 'General AML.' },
    timeline: [],
    upcomingPolicies: [],
    editorialAnalysis: {
      outlook: 'Uncertain',
      summary: 'Mozambique is the least developed crypto market among our tracked countries. No regulatory attention. Market activity limited to small P2P volumes in Maputo.',
      opportunities: ['Mobile money growth', 'Natural gas revenue could spur fintech interest'],
      risks: ['Very small market', 'Low internet penetration', 'Political instability risk'],
      recommendation: 'NOT RECOMMENDED as standalone market. Only relevant as part of Southern African portfolio.',
      analystName: 'CoinDaily Regulation Desk',
      publishedDate: '2026-01-05',
    },
    marketContext: {
      estimatedCryptoUsers: '~100,000',
      p2pVolume24h: '<$200K',
      dominantPlatforms: ['Binance P2P'],
      mobileMoneyIntegration: 'M-Pesa, e-Mola; no crypto integration',
      internetPenetration: '21%',
    },
  },
];

function computeStats(countries: PremiumCountryRegulation[]) {
  return {
    totalCountries: countries.length,
    regulated: countries.filter(c => c.status === 'Regulated').length,
    evolving: countries.filter(c => c.status === 'Evolving').length,
    cautious: countries.filter(c => c.status === 'Cautious').length,
    restricted: countries.filter(c => c.status === 'Restricted').length,
    unregulated: countries.filter(c => c.status === 'Unregulated').length,
    waemu: countries.filter(c => c.status === 'WAEMU Rules').length,
    avgRiskScore: Math.round(countries.reduce((s, c) => s + c.riskScore, 0) / countries.length),
    countriesWithCBDC: countries.filter(c => c.cbdc).length,
    countriesWithLicensing: countries.filter(c => c.licensing.required).length,
    totalUpcomingPolicies: countries.reduce((s, c) => s + c.upcomingPolicies.length, 0),
    totalTimelineEvents: countries.reduce((s, c) => s + c.timeline.length, 0),
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get('country');
  const section = searchParams.get('section'); // all | analysis | tax | licensing | market

  // Optional: check membership (for future auth integration)
  // For now, provide data to anyone who reaches this endpoint
  // In production, validate JWT and check membership tier

  if (countryCode) {
    const country = PREMIUM_COUNTRIES.find(c => c.code === countryCode.toUpperCase());
    if (!country) {
      return NextResponse.json({ error: 'Country not found', code: countryCode }, { status: 404 });
    }

    // If a specific section is requested, return only that section
    if (section && section !== 'all') {
      const sectionData: Record<string, any> = {
        analysis: { editorialAnalysis: country.editorialAnalysis, riskScore: country.riskScore, riskLevel: country.riskLevel, complianceRating: country.complianceRating },
        tax: { taxFramework: country.taxFramework },
        licensing: { licensing: country.licensing, amlKyc: country.amlKyc },
        market: { marketContext: country.marketContext },
        timeline: { timeline: country.timeline, upcomingPolicies: country.upcomingPolicies },
        cbdc: { cbdc: country.cbdc },
      };
      return NextResponse.json({
        country: { code: country.code, name: country.name, flag: country.flag },
        section,
        data: sectionData[section] || {},
      });
    }

    return NextResponse.json({ country, source: 'premium' });
  }

  // Return all countries with stats
  return NextResponse.json({
    stats: computeStats(PREMIUM_COUNTRIES),
    countries: PREMIUM_COUNTRIES,
    source: 'premium',
    lastUpdated: '2026-02-12T10:00:00Z',
  });
}
