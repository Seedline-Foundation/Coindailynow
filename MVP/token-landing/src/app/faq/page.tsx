'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FAQ {
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQ[] = [
    {
      question: 'What is the Joy Token presale?',
      answer: `The Joy Token presale is an exclusive early investment opportunity before our public launch. Early supporters get access to $JOY tokens at discounted prices with bonus allocation tiers. The presale happens in phases with increasing prices, rewarding early believers. All participants are whitelisted and verified to ensure fair distribution. Presale tokens are subject to vesting schedules to promote long-term holding and prevent dumps.`,
    },
    {
      question: 'How do I join the whitelist?',
      answer: `Joining the whitelist is simple:
      
1. Visit our homepage and submit your email via the waitlist form
2. Follow us on Twitter/X (@Coindaily001) and join our Telegram (@CoindailyNewz)
3. You'll receive an email with your unique whitelist application link
4. Complete KYC verification (required for compliance)
5. You'll be notified 48 hours before presale goes live

Whitelist members get early access, bonus tokens, and exclusive perks. Spots are limited, so register early!`,
    },
    {
      question: 'When does the presale start and end?',
      answer: `The Joy Token presale launches in Q1 2026 and runs for 60 days or until hard cap is reached.

Phase 1 (Days 1-20): $0.2 per token + 20% bonus
Phase 2 (Days 21-40): $0.5 per token + 10% bonus
Phase 3 (Days 41-60): $0.7 per token + 5% bonus

Public listing price will be $0.9 giving early investors up to 200% instant gains. Subscribe to our newsletter for exact launch date announcements.`,
    },
    {
      question: 'What payment methods are accepted?',
      answer: `We accept multiple payment methods for maximum accessibility:

• Crypto: USDC, BNB, ETH (BEP-20 and ERC-20)

All transactions are processed securely through PinkSale, a trusted launchpad platform. Minimum purchase is $100, maximum per wallet is $10,000/wallet to ensure fair distribution.`,
    },
    {
      question: 'Is Joy Token safe and audited?',
      answer: `Absolutely. Security is our top priority:

✅ Smart contract audited by Cyberscope (top blockchain security firm)
✅ Team KYC verified through PinkSale
✅ Liquidity locked for 2 years on PinkLock
✅ No backdoors or malicious functions
✅ Multi-sig wallet for presale funds
✅ Transparent tokenomics and vesting schedules

Our contract address will be published before presale. You can verify everything on-chain. We're building for the long term, not a pump and dump.`,
    },
    {
      question: 'What are the tokenomics and vesting schedules?',
      answer: `Total Supply: 6,000,000 $JOY

Allocation:
• 30% - Presale (800,000 tokens)
• 20% - Liquidity Pool (locked permanently)
• 20% - Ecosystem & Rewards (vested over 5 years)
• 15% - Team & Advisors (1-year cliff, 4-year vesting)
• 10% - Marketing & Partnerships (vested over 2 years)
• 5% - Reserve Fund (locked 10 year)

Presale Vesting:
• 30% unlocked at TGE (Token Generation Event)
• 70% vested over 6 months (linear release)

This structure ensures long-term alignment and prevents token dumps.`,
    },
    {
      question: 'Why should I invest in Joy Token now?',
      answer: `Here's why early investment makes sense:

🚀 **First-Mover Advantage**: Get in before millions discover CoinDaily
💰 **Presale Discount**: Up to 200% discount vs public listing price  
📈 **Revenue-Backed**: Token utility tied to platform revenue (not just speculation)
🌍 **Real Problem Solved**: Africa needs trusted crypto news - we're the solution
📊 **Growing Market**: African crypto market projected to hit $7.1B by 2027
🎁 **Exclusive Benefits**: Governance rights, premium content, ad-free experience, profit sharing

We're not just another meme coin. Joy Token will power Africa's premier crypto news platform with multi-language support across 13 countries. Real utility = real value. Miss the presale, miss the ground-floor opportunity.

Still skeptical? Join our Telegram and ask the community!`,
    },
  ];

  return (
    <div className="min-h-screen bg-black py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">Frequently Asked Questions</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Everything you need to know about the Joy Token presale
          </p>
        </motion.div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div
                className={`bg-gray-900 border-2 rounded-2xl overflow-hidden transition-all ${
                  openIndex === index ? 'border-primary-500' : 'border-gray-800'
                }`}
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full text-left p-6 flex justify-between items-center gap-4 hover:bg-gray-800/50 transition-colors"
                >
                  <h3 className="text-xl font-bold text-white pr-4">{faq.question}</h3>
                  <ChevronDownIcon
                    className={`w-6 h-6 text-primary-500 flex-shrink-0 transition-transform ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 text-gray-300 whitespace-pre-line leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 bg-gradient-to-br from-primary-600/20 to-accent-600/20 border border-primary-500/50 rounded-2xl p-8 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Still Have Questions?</h2>
          <p className="text-gray-300 mb-6">
            Join our community and get answers from our team and other investors
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://t.me/CoindailyNewz"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-primary-500 to-accent-500 text-white px-8 py-4 rounded-full font-bold hover:shadow-lg hover:shadow-primary-500/50 transition-all"
            >
              Join Telegram
            </a>
            <a
              href="https://twitter.com/Coindaily001"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-primary-500 text-primary-500 px-8 py-4 rounded-full font-bold hover:bg-primary-500/10 transition-all"
            >
              Follow on X
            </a>
          </div>
        </motion.div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <Link href="/" className="inline-block bg-gray-800 hover:bg-gray-700 text-white px-8 py-4 rounded-full font-bold transition-all">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
