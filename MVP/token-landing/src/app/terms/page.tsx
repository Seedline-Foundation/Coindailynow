'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-20">
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-center">
              <span className="gradient-text">Terms of Service</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 text-center">
              Last Updated: November 9, 2025
            </p>
            <p className="text-gray-400 text-center mb-8">
              Please read these Terms carefully before using our Services
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-12">

          {/* CRITICAL: NOT A SECURITY */}
          <div className="p-8 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border-2 border-yellow-500/50">
            <h2 className="text-3xl font-bold mb-6 text-yellow-400 text-center">
              ⚠️ IMPORTANT: JOY TOKEN IS NOT A SECURITY
            </h2>
            <div className="space-y-4 text-gray-200">
              <p>
                <strong>Joy Token ($JY) is a utility token</strong> designed to provide access to features, 
                services, and benefits within the CoinDaily ecosystem. It is <strong>NOT</strong>:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>An investment contract</li>
                <li>A security as defined by the U.S. Securities Act of 1933 or similar laws</li>
                <li>A share, equity, or ownership stake in any company or entity</li>
                <li>A promise of profits from the efforts of others</li>
                <li>A dividend-bearing instrument or profit-sharing arrangement</li>
              </ul>
              <p className="mt-4">
                <strong>By purchasing or using $JY, you acknowledge that:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You are obtaining a utility token for platform access, NOT making an investment</li>
                <li>Token value may fluctuate based on utility and market demand, not company profits</li>
                <li>No promises of financial returns, dividends, or profits have been made</li>
                <li>You have NO ownership rights, equity interest, or governance over the issuing entity</li>
                <li>Staking rewards come from platform revenue allocation, not investment returns</li>
              </ul>
              <p className="mt-4 text-yellow-300 font-bold">
                READ THE FULL TERMS BELOW FOR COMPLETE DETAILS ON TOKEN UTILITY AND RESTRICTIONS.
              </p>
            </div>
          </div>

          {/* Acceptance */}
          <Section title="1. Acceptance of Terms">
            <p className="text-gray-300 mb-4">
              These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," 
              or "your") and Joy Token Foundation ("we," "us," or "our") governing your use of:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-4">
              <li>The Joy Token website at joytoken.io</li>
              <li>The CoinDaily platform at coindaily.online</li>
              <li>Joy Token ($JY) utility tokens</li>
              <li>All associated services, tools, and features (collectively, the "Services")</li>
            </ul>
            <p className="text-gray-300 mb-4">
              By accessing, using, or purchasing $JY tokens, you agree to be bound by these Terms. If you do not 
              agree, <strong>DO NOT</strong> use our Services or purchase tokens.
            </p>
            <p className="text-gray-300">
              You must be at least 18 years old and have the legal capacity to enter into contracts. If you are 
              using our Services on behalf of an organization, you represent that you have authority to bind that entity.
            </p>
          </Section>

          {/* Token Utility - NOT A SECURITY */}
          <Section title="2. Joy Token Utility - NOT A SECURITY">
            <h3 className="text-2xl font-bold text-primary-400 mb-4">2.1 Utility Token Classification</h3>
            <p className="text-gray-300 mb-4">
              Joy Token ($JY) is a <strong>utility token</strong> that grants access to specific platform features 
              and services within the CoinDaily ecosystem. <strong>IT IS NOT A SECURITY</strong> under the Howey Test 
              or similar legal frameworks because:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li><strong>No Investment Contract:</strong> Token purchase is a transaction for utility access, not investment capital</li>
              <li><strong>No Common Enterprise:</strong> Users do not pool funds; each purchases tokens individually for personal use</li>
              <li><strong>No Expectation of Profits from Others' Efforts:</strong> Token value derives from utility and market demand, not company performance</li>
              <li><strong>Active User Participation Required:</strong> Users must actively use platform features; tokens have no passive value</li>
            </ul>

            <h3 className="text-2xl font-bold text-primary-400 mb-4">2.2 Permitted Uses of $JY (Utility Functions)</h3>
            <p className="text-gray-300 mb-4">$JY tokens may ONLY be used for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li><strong>Premium Content Access:</strong> Unlock exclusive market analysis, whale alerts, investigative reports</li>
              <li><strong>Advertising Discounts:</strong> Pay for platform advertising at 50% discount compared to fiat</li>
              <li><strong>Staking for Rewards:</strong> Lock tokens to earn rewards from platform revenue allocation (NOT investment returns)</li>
              <li><strong>Governance Voting:</strong> Participate in platform decisions with everlasting voting power (content priorities, feature development, treasury allocation, partnership approvals, regional expansion, editorial guidelines). Core team retains veto power for critical security matters.</li>
              <li><strong>Transaction Fee Reduction:</strong> Reduced or waived fees for certain platform actions</li>
              <li><strong>Early Feature Access:</strong> Beta testing and early access to new platform features</li>
              <li><strong>Community Recognition:</strong> Highly engaged token holders can be celebrated, recognized, and invited to join core team roles as the platform matures</li>
            </ul>

            <h3 className="text-2xl font-bold text-primary-400 mb-4">2.3 What $JY Is NOT</h3>
            <p className="text-gray-300 mb-4">Joy Token explicitly does NOT represent:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>❌ Equity, shares, or ownership in Joy Token Foundation or any affiliated entity</li>
              <li>❌ Rights to dividends, profits, or revenue shares</li>
              <li>❌ Debt obligation, loan, or promise of repayment</li>
              <li>❌ Investment opportunity or financial instrument</li>
              <li>❌ Voting rights over corporate governance, management decisions, or entity control (governance voting is limited to platform operations only)</li>
              <li>❌ Legal or beneficial ownership of platform assets or intellectual property</li>
              <li>❌ Right to participate in liquidation proceeds or asset distribution</li>
            </ul>

            <h3 className="text-2xl font-bold text-primary-400 mb-4">2.4 Staking Rewards Are Utility Incentives</h3>
            <div className="p-6 bg-gray-900 rounded-lg">
              <p className="text-gray-300 mb-4">
                <strong className="text-white">IMPORTANT CLARIFICATION:</strong> Staking rewards are NOT:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-4">
                <li>Investment returns or interest payments</li>
                <li>Profits derived from the efforts of management or third parties</li>
                <li>Dividends from company earnings</li>
              </ul>
              <p className="text-gray-300 mb-4">
                <strong className="text-white">Staking rewards ARE:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li><strong>Utility incentives</strong> funded by platform revenue allocation to encourage ecosystem participation</li>
                <li><strong>User rewards</strong> for actively contributing to platform liquidity and stability</li>
                <li><strong>Service fees</strong> redistributed to users who lock tokens (similar to cashback programs)</li>
                <li><strong>Voluntary opt-in program</strong> requiring active user participation and decision-making</li>
              </ul>
              <p className="text-gray-400 text-sm mt-4">
                Staking does NOT create a passive income stream. Users must actively choose lock periods, 
                manage positions, claim rewards, and participate in governance—demonstrating active involvement, 
                not passive investment.
              </p>
            </div>
          </Section>

          {/* Eligibility and Restrictions */}
          <Section title="3. Eligibility and Restrictions">
            <h3 className="text-xl font-bold text-accent-400 mb-4">3.1 Geographic Restrictions</h3>
            <p className="text-gray-300 mb-4">
              <strong>The following persons are PROHIBITED from purchasing or using $JY tokens:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li><strong>U.S. Persons:</strong> Citizens, residents, or entities organized under U.S. law</li>
              <li><strong>OFAC-Sanctioned Countries:</strong> Cuba, Iran, North Korea, Syria, Crimea region</li>
              <li><strong>Restricted Jurisdictions:</strong> China, Afghanistan, any jurisdiction where token sales are prohibited</li>
            </ul>
            <p className="text-gray-300 mb-4">
              By purchasing $JY, you represent and warrant that you are NOT a resident, citizen, or entity in any 
              restricted jurisdiction. We implement IP blocking and KYC verification to enforce these restrictions.
            </p>

            <h3 className="text-xl font-bold text-accent-400 mb-4">3.2 Accredited Investor Status (Non-U.S. Only)</h3>
            <p className="text-gray-300 mb-4">
              While $JY is a utility token (not a security), we require participants to meet accredited investor 
              criteria in their jurisdiction OR demonstrate financial capacity to bear risk:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Annual income exceeding $100,000 USD (or equivalent)</li>
              <li>Net worth exceeding $1,000,000 USD (or equivalent)</li>
              <li>Demonstrated crypto experience (minimum 2 years)</li>
            </ul>

            <h3 className="text-xl font-bold text-accent-400 mb-4">3.3 KYC/AML Compliance</h3>
            <p className="text-gray-300 mb-4">
              All presale participants must complete Know Your Customer (KYC) and Anti-Money Laundering (AML) verification:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Government-issued photo ID (passport, driver's license)</li>
              <li>Proof of address (utility bill, bank statement)</li>
              <li>Selfie verification</li>
              <li>Source of funds declaration (for purchases above $10,000)</li>
            </ul>
          </Section>

          {/* Token Sale Terms */}
          <Section title="4. Token Sale Terms">
            <h3 className="text-xl font-bold text-primary-400 mb-4">4.1 Presale Structure</h3>
            <div className="p-6 bg-gray-800/50 rounded-lg mb-6">
              <ul className="space-y-2 text-gray-300">
                <li><strong>Total Supply:</strong> 6,000,000 $JY (fixed, immutable)</li>
                <li><strong>Presale Allocation:</strong> 800,000 $JY (16% of total supply)</li>
                <li><strong>Presale Target:</strong> $917,500 USD</li>
                <li><strong>Pricing:</strong> 3 rounds at $0.25, $0.40, $0.78 per token</li>
                <li><strong>Listing Price:</strong> $0.90 per token (subject to market forces)</li>
                <li><strong>Vesting:</strong> 100% unlocked at Token Generation Event (TGE)</li>
                <li><strong>Accepted Payment:</strong> USDC, BNB, ETH</li>
              </ul>
            </div>

            <h3 className="text-xl font-bold text-primary-400 mb-4">4.2 Purchase Process</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Complete KYC/AML verification</li>
              <li>Connect compatible Web3 wallet (MetaMask, Trust Wallet, Coinbase Wallet)</li>
              <li>Specify purchase amount (minimum $100, maximum $10,000 per wallet)</li>
              <li>Send payment to presale smart contract</li>
              <li>Receive confirmation of purchase (blockchain transaction hash)</li>
              <li>Claim tokens after TGE via claiming portal</li>
            </ol>

            <h3 className="text-xl font-bold text-primary-400 mb-4">4.3 No Refunds - Final Sale</h3>
            <div className="p-6 bg-red-900/20 rounded-lg border border-red-500/30">
              <p className="text-red-300 font-bold mb-4">⚠️ ALL TOKEN PURCHASES ARE FINAL</p>
              <p className="text-gray-300 mb-4">
                By participating in the presale, you acknowledge and agree that:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>Token purchases are <strong>NON-REFUNDABLE</strong> under any circumstances</li>
                <li>Blockchain transactions are irreversible once confirmed</li>
                <li>We have no obligation to buy back tokens or provide liquidity</li>
                <li>Token value may decrease or become zero—you may lose your entire purchase amount</li>
                <li>Regulatory changes may impact token utility or tradability</li>
              </ul>
            </div>
          </Section>

          {/* Risks and Disclaimers */}
          <Section title="5. Risks and Disclaimers">
            <div className="p-8 bg-yellow-900/20 rounded-lg border-2 border-yellow-500/50 mb-6">
              <h3 className="text-2xl font-bold text-yellow-400 mb-4">🚨 CRITICAL: READ CAREFULLY</h3>
              <p className="text-gray-200 mb-4">
                <strong>Cryptocurrency and utility tokens involve SIGNIFICANT RISK. You may lose your ENTIRE investment.</strong>
              </p>
            </div>

            <h3 className="text-xl font-bold text-accent-400 mb-4">5.1 Financial Risks</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li><strong>Loss of Value:</strong> $JY price may decline to zero; no guaranteed floor price</li>
              <li><strong>No Liquidity Guarantee:</strong> We do not promise exchange listings or market liquidity</li>
              <li><strong>Volatility:</strong> Token prices can fluctuate wildly based on market sentiment</li>
              <li><strong>Platform Failure:</strong> If CoinDaily fails, tokens may become worthless</li>
              <li><strong>No Revenue Guarantee:</strong> Platform revenue may not materialize; staking rewards may be lower than projected</li>
            </ul>

            <h3 className="text-xl font-bold text-accent-400 mb-4">5.2 Technical Risks</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li><strong>Smart Contract Bugs:</strong> Despite audits, code vulnerabilities may exist</li>
              <li><strong>Blockchain Risks:</strong> Network congestion, forks, or attacks may impact tokens</li>
              <li><strong>Wallet Security:</strong> Loss of private keys results in permanent loss of tokens</li>
              <li><strong>Hacking:</strong> Exchanges, wallets, or smart contracts may be hacked</li>
            </ul>

            <h3 className="text-xl font-bold text-accent-400 mb-4">5.3 Regulatory Risks</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li><strong>Legal Uncertainty:</strong> Crypto regulations are evolving and vary by jurisdiction</li>
              <li><strong>Classification Changes:</strong> Regulators may reclassify $JY as a security in the future</li>
              <li><strong>Trading Restrictions:</strong> Governments may ban or restrict token trading</li>
              <li><strong>Tax Implications:</strong> You are responsible for all taxes; consult a tax advisor</li>
            </ul>

            <h3 className="text-xl font-bold text-accent-400 mb-4">5.4 No Promises or Guarantees</h3>
            <div className="p-6 bg-gray-900 rounded-lg">
              <p className="text-gray-300 mb-4">
                <strong className="text-white">WE MAKE NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, INCLUDING:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>❌ NO guarantee of token price appreciation</li>
                <li>❌ NO promise of exchange listings (CEX or DEX)</li>
                <li>❌ NO assurance of liquidity or tradability</li>
                <li>❌ NO guarantee of platform success or user adoption</li>
                <li>❌ NO warranty that roadmap features will be delivered</li>
                <li>❌ NO promise that staking rewards will meet projections</li>
              </ul>
              <p className="text-red-300 font-bold mt-4">
                ONLY INVEST WHAT YOU CAN AFFORD TO LOSE COMPLETELY.
              </p>
            </div>
          </Section>

          {/* Platform Use */}
          <Section title="6. Platform Use and Conduct">
            <h3 className="text-xl font-bold text-primary-400 mb-4">6.1 Prohibited Activities</h3>
            <p className="text-gray-300 mb-4">You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-6">
              <li>Use Services for illegal activities (money laundering, terrorist financing, fraud)</li>
              <li>Impersonate others or provide false KYC information</li>
              <li>Manipulate token prices or engage in wash trading</li>
              <li>Reverse engineer, hack, or exploit platform vulnerabilities</li>
              <li>Use bots, scripts, or automated tools without permission</li>
              <li>Spam, harass, or abuse other users or staff</li>
              <li>Violate intellectual property rights</li>
              <li>Circumvent geographic restrictions using VPNs or proxies</li>
            </ul>

            <h3 className="text-xl font-bold text-primary-400 mb-4">6.2 Account Termination</h3>
            <p className="text-gray-300">
              We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraud, 
              or pose security risks. Terminated accounts forfeit access to platform features but retain token 
              ownership (tokens remain in user wallets).
            </p>
          </Section>

          {/* Intellectual Property */}
          <Section title="7. Intellectual Property">
            <p className="text-gray-300 mb-4">
              All content, trademarks, logos, and intellectual property on our platform are owned by Joy Token 
              Foundation or licensed from third parties. You may NOT:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Copy, modify, or redistribute platform content without written permission</li>
              <li>Use our trademarks or branding for commercial purposes</li>
              <li>Claim ownership of any platform materials</li>
              <li>Create derivative works based on our content</li>
            </ul>
          </Section>

          {/* Disclaimers */}
          <Section title="8. Disclaimers">
            <div className="p-6 bg-gray-900 rounded-lg space-y-4">
              <p className="text-gray-200 font-bold">
                THE SERVICES AND TOKENS ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.
              </p>
              <p className="text-gray-300">
                WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                <li>MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT</li>
                <li>ACCURACY, RELIABILITY, OR COMPLETENESS OF INFORMATION</li>
                <li>UNINTERRUPTED OR ERROR-FREE SERVICE</li>
                <li>SECURITY OF DATA OR TRANSACTIONS</li>
              </ul>
              <p className="text-gray-300 mt-4">
                Your use of our Services is at your sole risk. We do not guarantee any specific outcomes or results.
              </p>
            </div>
          </Section>

          {/* Limitation of Liability */}
          <Section title="9. Limitation of Liability">
            <div className="p-8 bg-red-900/20 rounded-lg border-2 border-red-500/50">
              <p className="text-red-300 font-bold mb-4 text-xl">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <p className="text-gray-200 mb-4">
                <strong>WE ARE NOT LIABLE FOR ANY DAMAGES ARISING FROM USE OF OUR SERVICES OR TOKEN PURCHASES, INCLUDING:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-4">
                <li>Direct, indirect, incidental, consequential, or punitive damages</li>
                <li>Loss of profits, revenue, data, or token value</li>
                <li>Business interruption or opportunity cost</li>
                <li>Unauthorized access to accounts or wallets</li>
                <li>Smart contract bugs, exploits, or hacks</li>
                <li>Regulatory actions or legal proceedings</li>
                <li>Third-party actions (exchanges, service providers)</li>
              </ul>
              <p className="text-gray-200 font-bold">
                OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR TOKENS IN THE PAST 12 MONTHS, 
                OR $100 USD, WHICHEVER IS LESS.
              </p>
            </div>
          </Section>

          {/* Indemnification */}
          <Section title="10. Indemnification">
            <p className="text-gray-300 mb-4">
              You agree to indemnify, defend, and hold harmless Joy Token Foundation, its affiliates, directors, 
              employees, and agents from any claims, damages, liabilities, costs, or expenses (including legal fees) 
              arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Your violation of these Terms</li>
              <li>Your use or misuse of Services or tokens</li>
              <li>Your violation of any laws or third-party rights</li>
              <li>False representations made during KYC or presale</li>
              <li>Tax liabilities arising from token ownership or transactions</li>
            </ul>
          </Section>

          {/* Dispute Resolution */}
          <Section title="11. Dispute Resolution and Arbitration">
            <h3 className="text-xl font-bold text-accent-400 mb-4">11.1 Informal Resolution</h3>
            <p className="text-gray-300 mb-4">
              Before filing legal claims, you agree to contact us at legal@coindaily.online and attempt to resolve 
              disputes informally for 60 days.
            </p>

            <h3 className="text-xl font-bold text-accent-400 mb-4">11.2 Binding Arbitration</h3>
            <p className="text-gray-300 mb-4">
              If informal resolution fails, disputes shall be resolved through <strong>binding arbitration</strong> 
              under the rules of [Arbitration Body - e.g., Singapore International Arbitration Centre] rather than 
              in court. Arbitration will be conducted in English.
            </p>

            <h3 className="text-xl font-bold text-accent-400 mb-4">11.3 Class Action Waiver</h3>
            <p className="text-gray-300">
              <strong>YOU WAIVE THE RIGHT TO PARTICIPATE IN CLASS ACTIONS, CLASS ARBITRATIONS, OR REPRESENTATIVE ACTIONS.</strong> 
              All disputes must be brought individually.
            </p>
          </Section>

          {/* Governing Law */}
          <Section title="12. Governing Law and Jurisdiction">
            <p className="text-gray-300 mb-4">
              These Terms are governed by the laws of [Jurisdiction - to be determined based on incorporation location, 
              e.g., Cayman Islands, Switzerland, etc.], without regard to conflict of law principles.
            </p>
            <p className="text-gray-300">
              For disputes not subject to arbitration, you consent to the exclusive jurisdiction of courts in [Location].
            </p>
          </Section>

          {/* Changes to Terms */}
          <Section title="13. Changes to Terms">
            <p className="text-gray-300 mb-4">
              We may update these Terms at any time. When we make material changes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4 mb-4">
              <li>We will update the "Last Updated" date</li>
              <li>We will notify users via email and prominent website notice</li>
              <li>Continued use after changes constitutes acceptance</li>
              <li>If you do not agree, discontinue use of Services</li>
            </ul>
            <p className="text-gray-300">
              For presale participants, changes will not retroactively alter token purchase terms without consent.
            </p>
          </Section>

          {/* Miscellaneous */}
          <Section title="14. Miscellaneous">
            <h3 className="text-xl font-bold text-primary-400 mb-4">14.1 Entire Agreement</h3>
            <p className="text-gray-300 mb-6">
              These Terms, together with our Privacy Policy and any additional agreements, constitute the entire 
              agreement between you and Joy Token Foundation.
            </p>

            <h3 className="text-xl font-bold text-primary-400 mb-4">14.2 Severability</h3>
            <p className="text-gray-300 mb-6">
              If any provision is found invalid or unenforceable, the remaining provisions remain in effect.
            </p>

            <h3 className="text-xl font-bold text-primary-400 mb-4">14.3 No Waiver</h3>
            <p className="text-gray-300 mb-6">
              Failure to enforce any right or provision does not constitute a waiver of that right.
            </p>

            <h3 className="text-xl font-bold text-primary-400 mb-4">14.4 Assignment</h3>
            <p className="text-gray-300">
              We may assign these Terms to affiliates or successors. You may not assign your rights without our consent.
            </p>
          </Section>

          {/* Contact */}
          <Section title="15. Contact Information">
            <div className="p-6 bg-gray-800/50 rounded-lg">
              <p className="text-gray-300 mb-4">
                For questions, disputes, or legal inquiries:
              </p>
              <p className="text-gray-300 mb-2"><strong className="text-white">Legal Department:</strong> legal@coindaily.online</p>
              <p className="text-gray-300 mb-2"><strong className="text-white">Support:</strong> support@coindaily.online</p>
              <p className="text-gray-300 mb-2"><strong className="text-white">Compliance:</strong> compliance@coindaily.online</p>
              <p className="text-gray-300 mt-4"><strong className="text-white">Mailing Address:</strong></p>
              <p className="text-gray-400 ml-4">
                Joy Token Foundation<br />
                Attn: Legal Department<br />
                [Address to be determined based on incorporation jurisdiction]
              </p>
            </div>
          </Section>

          {/* Final Warning */}
          <div className="p-8 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg border-2 border-red-500/50 mt-12">
            <h2 className="text-3xl font-bold mb-6 text-red-400 text-center">
              ⚠️ FINAL ACKNOWLEDGMENT
            </h2>
            <div className="space-y-4 text-gray-200">
              <p className="font-bold text-lg">
                BY PURCHASING OR USING JOY TOKENS, YOU ACKNOWLEDGE AND AGREE THAT:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You have read and understood these Terms in their entirety</li>
                <li>$JY is a utility token, NOT a security or investment</li>
                <li>You may lose your entire investment—tokens may become worthless</li>
                <li>There are no refunds, buybacks, or guaranteed returns</li>
                <li>Regulatory changes may impact token utility or legality</li>
                <li>You are solely responsible for tax compliance in your jurisdiction</li>
                <li>You have consulted with legal and financial advisors (or chosen not to)</li>
                <li>You accept all risks and release Joy Token Foundation from all liability</li>
              </ul>
              <p className="text-red-300 font-bold text-center mt-6 text-xl">
                IF YOU DO NOT AGREE WITH THESE TERMS, DO NOT PURCHASE OR USE $JY TOKENS.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Back to Home */}
      <section className="py-12 bg-gradient-to-r from-primary-500/20 to-accent-500/20">
        <div className="container mx-auto px-4 text-center">
          <Link 
            href="/"
            className="inline-block px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg font-semibold hover:scale-105 transition-transform"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}

// Helper Component
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="scroll-mt-20"
    >
      <h2 className="text-3xl font-bold mb-6 text-white border-b border-gray-700 pb-4">{title}</h2>
      {children}
    </motion.section>
  );
}
