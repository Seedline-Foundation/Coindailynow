'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { DocumentArrowDownIcon, ChartBarIcon, ShieldCheckIcon, CpuChipIcon, GlobeAltIcon, UserGroupIcon, PrinterIcon } from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function WhitepaperPage() {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const whitepaperRef = useRef<HTMLDivElement>(null);

  // PDF Generation Function (Client-side)
  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const element = whitepaperRef.current;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#000000',
        logging: false,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('joy-token-whitepaper.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
      setShowDownloadMenu(false);
    }
  };

  // Print-to-PDF Function
  const printToPDF = () => {
    window.print();
    setShowDownloadMenu(false);
  };

  // Download Pre-generated PDF
  const downloadPreGeneratedPDF = () => {
    const link = document.createElement('a');
    link.href = '/pdfs/joy-token-whitepaper.pdf';
    link.download = 'joy-token-whitepaper.pdf';
    link.click();
    setShowDownloadMenu(false);
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20" ref={whitepaperRef}>
      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/10 to-transparent" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="gradient-text">Technical Whitepaper</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              A comprehensive guide to Joy Token's technology, tokenomics, and vision for Africa's crypto revolution
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {/* PDF Download Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  disabled={isGeneratingPDF}
                  className="px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg font-semibold hover:scale-105 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <DocumentArrowDownIcon className="w-6 h-6" />
                  {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
                </button>
                
                {showDownloadMenu && (
                  <div className="absolute top-full mt-2 left-0 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                    <button
                      onClick={generatePDF}
                      className="w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors flex items-center gap-3"
                    >
                      <DocumentArrowDownIcon className="w-5 h-5 text-primary-500" />
                      <div>
                        <div className="font-medium">Generate PDF</div>
                        <div className="text-xs text-gray-400">Create PDF from content</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={printToPDF}
                      className="w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors flex items-center gap-3 border-t border-gray-800"
                    >
                      <PrinterIcon className="w-5 h-5 text-accent-500" />
                      <div>
                        <div className="font-medium">Print to PDF</div>
                        <div className="text-xs text-gray-400">Use browser print dialog</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={downloadPreGeneratedPDF}
                      className="w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors flex items-center gap-3 border-t border-gray-800"
                    >
                      <DocumentArrowDownIcon className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="font-medium">Download PDF</div>
                        <div className="text-xs text-gray-400">Pre-generated version</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
              
              <Link 
                href="/"
                className="px-8 py-4 border border-primary-500 rounded-lg font-semibold hover:bg-primary-500/10 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-12 bg-gray-900/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Table of Contents</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: '1. Executive Summary', href: '#executive' },
                { title: '2. Problem Statement', href: '#problem' },
                { title: '3. Solution', href: '#solution' },
                { title: '4. Technology', href: '#technology' },
                { title: '5. Tokenomics', href: '#tokenomics' },
                { title: '6. Staking Mechanism', href: '#staking' },
                { title: '7. Governance', href: '#governance' },
                { title: '8. Roadmap', href: '#roadmap' },
                { title: '9. Team & Advisors', href: '#team' },
                { title: '10. Legal & Compliance', href: '#legal' },
              ].map((item, index) => (
                <motion.a
                  key={index}
                  href={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors border border-gray-700 hover:border-primary-500"
                >
                  {item.title}
                </motion.a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-20">
          
          {/* Executive Summary */}
          <Section id="executive" icon={<ChartBarIcon />} title="Executive Summary">
            <p className="text-gray-300 mb-4">
              Joy Token ($JY) is the exclusive payment currency for Africa's largest Web3 PR and advertising distribution 
              network, built to power CoinDaily—Africa's premier cryptocurrency news platform launching with 13-language 
              support across 13+ African countries.
            </p>
            <div className="grid md:grid-cols-3 gap-6 my-8">
              <StatBox label="Max Supply" value="6,000,000 JY" highlight />
              <StatBox label="Ever Circulating" value="4,000,000 JY" highlight />
              <StatBox label="Market Opportunity" value="$11.4B TAM" highlight />
            </div>
            <p className="text-gray-300 mb-4">
              Unlike speculative tokens, JY derives mandatory demand from infrastructure-level utility: every PR 
              distribution, ad placement, and partnership transaction across our distribution network 
              requires Joy Token. With only 4M tokens ever circulating from a 6M supply, extreme scarcity is built into the model. 
              Our revenue model combines platform transaction fees with premium content subscriptions, funding industry-leading staking rewards up to 90% APR.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong className="text-white">Infrastructure Monopoly:</strong> Exclusive payment token for the largest Web3 PR distribution network in Africa</li>
              <li><strong className="text-white">$11.4B Market:</strong> Targeting combined $7.2B PR distribution + $4.2B crypto advertising markets</li>
              <li><strong className="text-white">Extreme Scarcity:</strong> Only 6M total supply, with only 4M ever circulating—built-in supply shock</li>
              <li><strong className="text-white">Real Yield Model:</strong> Staking rewards from actual transaction fees, not inflation (up to 90% APR)</li>
              <li><strong className="text-white">Community-Funded:</strong> Zero VCs. 100% funded by the community through transparent presale</li>
              <li><strong className="text-white">Network Effects:</strong> Value compounds exponentially as distribution network scales</li>
            </ul>
          </Section>

          {/* Problem Statement */}
          <Section id="problem" icon={<ShieldCheckIcon />} title="Problem Statement">
            <h3 className="text-2xl font-bold mb-4 text-primary-400">The Web3 Distribution Bottleneck</h3>
            <p className="text-gray-300 mb-4">
              The global PR distribution and crypto advertising markets are worth $11.4B combined ($7.2B PR distribution 
              + $4.2B crypto ads), yet Africa—despite 88% YoY crypto adoption growth and 420M internet users—remains 
              underserved by centralized, USD-based legacy platforms. This creates a massive opportunity for blockchain-native infrastructure.
            </p>
            <div className="space-y-4 mb-6">
              <ProblemCard 
                title="1. Fragmented Distribution Networks"
                description="Publishers use expensive, centralized PR services (PRNewswire, BusinessWire) charging $500-2000 per release. No unified African network exists, forcing manual outreach and limiting reach."
              />
              <ProblemCard 
                title="2. Cross-Border Payment Friction"
                description="International USD wire transfers for PR services incur 5-15% fees and 3-7 day delays. African publishers and distributors need instant, low-cost settlements."
              />
              <ProblemCard 
                title="3. Lack of Verification Infrastructure"
                description="No automated system verifies PR placements or prevents fraud. Publishers pay upfront with no guarantee of delivery, leading to disputes and mistrust."
              />
              <ProblemCard 
                title="4. No Tokenized Incentive Layer"
                description="Traditional platforms extract value through fees but don't reward ecosystem participants (publishers, distributors, verifiers) with ownership or governance rights."
              />
            </div>
            <div className="p-6 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-lg border border-primary-500/20">
              <p className="text-lg font-semibold text-white mb-2">Market Opportunity</p>
              <p className="text-gray-300 mb-3">
                <strong className="text-primary-400">$11.4B Total Addressable Market:</strong> Global PR distribution ($7.2B, 
                growing 11.3% CAGR) + Crypto advertising spend ($4.2B and accelerating). Africa's crypto economy projected 
                to reach $2.5 trillion by 2030.
              </p>
              <p className="text-gray-300">
                CoinDaily's distribution network targets <strong className="text-accent-400">21.1 million publisher partnerships</strong> 
                (100K Tier 1, 1M Tier 2, 20M Tier 3) with Joy Token as the mandatory payment currency. Early holders capture 
                exponential value as network effects compound.
              </p>
            </div>
          </Section>

          {/* Solution */}
          <Section id="solution" icon={<CpuChipIcon />} title="Solution: Joy Token Distribution Network">
            <p className="text-gray-300 mb-6">
              Joy Token powers Africa's largest blockchain-native PR and advertising distribution network. Our infrastructure 
              connects publishers with 21.1 million targeted partnerships across three quality tiers, with JY as the exclusive 
              payment currency for all transactions.
            </p>
            
            <div className="space-y-6">
              <SolutionCard
                number="1"
                title="Universal SDK & Distribution Network"
                description="Publishers integrate our JavaScript SDK (compatible with all tech stacks) to instantly distribute content to 100K Tier-1 (DA 80-100), 1M Tier-2 (DA 60-80), and 20M Tier-3 (DA 40-60) partner websites. Payment in JY tokens only."
              />
              <SolutionCard
                number="2"
                title="AI-Powered Verification System"
                description="Automated verification ensures PR placements happen as promised. Headless browsers + ML verify content appears correctly. Payment released only after verification—eliminating fraud and building trust."
              />
              <SolutionCard
                number="3"
                title="Blockchain Payment Rails"
                description="Instant, low-cost settlements via Polygon blockchain. No 5-15% wire transfer fees, no 3-7 day delays. Publishers buy JY credits, distributors earn JY rewards—all on-chain, transparent, automated."
              />
              <SolutionCard
                number="4"
                title="Tiered Partnership Model"
                description="Network scales through quality tiers: T1 sites (premium) get fastest distribution, T2 (high-authority) priority access, T3 (quality publishers) maximum reach. Publishers choose tier mix based on budget and goals."
              />
              <SolutionCard
                number="5"
                title="Real Yield Staking"
                description="Platform transaction fees (from PR distributions, ad placements, partnership subscriptions) fund staking rewards up to 70% APR. Not inflation—real revenue from real network activity."
              />
            </div>

            <div className="mt-8 p-6 bg-gray-900 rounded-lg border border-accent-500/30">
              <h4 className="text-xl font-bold mb-4 text-accent-400">Network Effect Flywheel</h4>
              <div className="space-y-3 text-gray-300">
                <p>→ Publishers join to access our 21M partnership network</p>
                <p>→ Distributors join for instant JY revenue and automated payments</p>
                <p>→ More publishers = more content = more value for distributors</p>
                <p>→ More distributors = better reach = more value for publishers</p>
                <p>→ Transaction volume increases exponentially (not linearly)</p>
                <p>→ Staking rewards grow from real fees, attracting token holders</p>
                <p>→ Token scarcity increases (6M supply vs 21M partnerships)</p>
                <p className="text-primary-400 font-semibold">→ Metcalfe's Law: Network value = n² = exponential growth</p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-br from-primary-600/10 to-purple-600/10 rounded-lg border border-primary-500/30">
              <h4 className="text-xl font-bold mb-4 text-white">Why Joy Token Captures This Value</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                <div>
                  <p className="mb-2">✓ <strong>Exclusive Payment Method:</strong> No USD, no alternatives—only JY accepted</p>
                  <p className="mb-2">✓ <strong>Mandatory Demand:</strong> Every transaction across 21M partnerships requires JY</p>
                  <p>✓ <strong>Supply Shock Economics:</strong> 6M tokens for network projected to handle millions of monthly PRs</p>
                </div>
                <div>
                  <p className="mb-2">✓ <strong>First-Mover Dominance:</strong> No competitor building at this scale in Africa</p>
                  <p className="mb-2">✓ <strong>Network Lock-In:</strong> Once publishers/distributors integrate SDK, switching costs are high</p>
                  <p>✓ <strong>Deflationary Pressure:</strong> 10-year team cliff + burns + staking locks tighten circulating supply</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Technology */}
          <Section id="technology" icon={<CpuChipIcon />} title="Technology Architecture">
            <h3 className="text-2xl font-bold mb-4 text-primary-400">Smart Contract Design</h3>
            <p className="text-gray-300 mb-6">
              Joy Token is built on Polygon (with Binance Smart Chain bridge planned) using battle-tested ERC-20 
              standards with custom extensions for staking and governance.
            </p>

            <div className="space-y-6">
              <TechCard
                title="Token Contract (ERC-20)"
                features={[
                  'Fixed supply of 6,000,000 JY (immutable)',
                  'Pausable for emergency situations',
                  'Blacklist function for regulatory compliance',
                  'Gas-optimized transfers'
                ]}
              />
              
              <TechCard
                title="Staking Contract"
                features={[
                  '4 lock periods: Flexible, 6mo, 12mo, 24mo',
                  'Dynamic APR based on total staked amount',
                  'Governance multipliers (1x to 3x voting power)',
                  'Automatic reward distribution from revenue pool',
                  'Early unlock penalty (50% of earned rewards)'
                ]}
              />

              <TechCard
                title="Governance Contract"
                features={[
                  'Time-weighted voting power',
                  'Proposal threshold: 10,000 JY staked',
                  'Voting period: 7 days',
                  'Timelock: 2 days before execution',
                  'Emergency veto by multisig (first 6 months only)'
                ]}
              />

              <TechCard
                title="Revenue Distribution Contract"
                features={[
                  'Automated revenue collection from platform',
                  'Smart allocation: 70% staking, 20% treasury, 10% buyback',
                  'Transparent on-chain accounting',
                  'Monthly distribution schedule'
                ]}
              />
            </div>

            <div className="mt-8 p-6 bg-gray-800/50 rounded-lg">
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShieldCheckIcon className="w-6 h-6 text-green-400" />
                Security Measures
              </h4>
              <ul className="space-y-2 text-gray-300">
                <li>✓ Audited by Cyberscope (Q1 2026)</li>
                <li>✓ Multi-signature wallet for treasury (3/5)</li>
                <li>✓ Timelock on governance actions (48 hours)</li>
                <li>✓ Bug bounty program ($50K pool)</li>
                <li>✓ Balanced governance with community participation</li>
              </ul>
            </div>
          </Section>

          {/* Tokenomics */}
          <Section id="tokenomics" icon={<ChartBarIcon />} title="Tokenomics">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-2xl font-bold mb-4 text-primary-400">Supply Distribution</h3>
                <div className="space-y-3">
                  <AllocationBar label="Public Sale" percentage={28.3} amount="1,700,000 JY" />
                  <AllocationBar label="Treasury" percentage={23.3} amount="1,400,000 JY" />
                  <AllocationBar label="Ecosystem" percentage={18.3} amount="1,100,000 JY" />
                  <AllocationBar label="Team" percentage={11.7} amount="700,000 JY" />
                  <AllocationBar label="Legal" percentage={8.3} amount="500,000 JY" />
                  <AllocationBar label="Liquidity" percentage={5} amount="300,000 JY" />
                  <AllocationBar label="Seed" percentage={5} amount="300,000 JY" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-4 text-accent-400">Vesting Schedule</h3>
                <div className="space-y-4 text-gray-300">
                  <VestingItem 
                    category="Public Sale" 
                    schedule="9-month cliff, then 24-month linear vesting"
                  />
                  <VestingItem 
                    category="Liquidity" 
                    schedule="Locked permanently (paired with $270K USDC)"
                  />
                  <VestingItem 
                    category="Ecosystem" 
                    schedule="48-month linear (60% committed to 10-year sinkhole)"
                  />
                  <VestingItem 
                    category="Team" 
                    schedule="24-month cliff, then 4-year linear vesting"
                  />
                  <VestingItem 
                    category="Seed" 
                    schedule="9-month cliff, then 12-month linear vesting"
                  />
                  <VestingItem 
                    category="Treasury" 
                    schedule="1M in 10-year sinkhole (2-year start), 400K for runway (6-month start)"
                  />
                  <VestingItem 
                    category="Legal" 
                    schedule="100K monthly after 6 months, 400K quarterly after 12 months"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-lg border border-primary-500/30">
              <h4 className="text-2xl font-bold mb-4">Use of Funds ($917.5K USDC)</h4>
              <div className="grid md:grid-cols-3 gap-6">
                <UseOfFunds label="Liquidity Locking" amount="$270K" percentage={29} />
                <UseOfFunds label="CEX Listings" amount="$300K" percentage={33} />
                <UseOfFunds label="12-Month Runway" amount="$120K" percentage={13} />
                <UseOfFunds label="Marketing" amount="$100K" percentage={11} />
                <UseOfFunds label="Legal & Compliance" amount="$50K" percentage={5} />
                <UseOfFunds label="Contingencies" amount="$77.5K" percentage={8} />
              </div>
              <p className="text-center text-gray-400 text-sm mt-6">
                100% community-funded • No VC backing • Full transparency
              </p>
            </div>
          </Section>

          {/* Staking Mechanism */}
          <Section id="staking" icon={<ShieldCheckIcon />} title="Staking Mechanism">
            <p className="text-gray-300 mb-6">
              Joy Token offers industry-leading staking rewards backed by real platform revenue, not token inflation.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <StakingTier
                name="Flexible (7 days)"
                apr="1%"
                lockPeriod="7 days"
                govMultiplier="0x"
                description="Minimal lock with minimal rewards. Perfect for short-term liquidity needs."
              />
              <StakingTier
                name="6-Month Lock"
                apr="10%"
                lockPeriod="180 days"
                govMultiplier="1.2x"
                description="Moderate commitment with steady rewards and increased governance power."
              />
              <StakingTier
                name="9-Month Lock"
                apr="70%"
                lockPeriod="270 days"
                govMultiplier="1.5x"
                popular
                description="Whale Prison tier with significantly boosted APR and governance weight."
              />
              <StakingTier
                name="24-Month Lock"
                apr="90%"
                lockPeriod="730 days"
                govMultiplier="2.5x"
                popular
                description="Diamond Hands tier. Maximum rewards (90% APR after 9th month) with 2.5x governance weight."
              />
            </div>

            <div className="space-y-4 mb-6">
              <InfoBox
                title="How Rewards are Funded"
                content="Staking rewards come from platform revenue (premium subscriptions, advertising, partnerships), NOT token inflation. This creates sustainable, real yield that grows with platform adoption."
              />
              <InfoBox
                title="Dynamic APR"
                content="Displayed APRs are target rates. Actual APR adjusts monthly based on total staked supply and revenue. Lower staking participation = higher individual rewards."
              />
              <InfoBox
                title="Early Unlock Penalty"
                content="Unstaking before lock period ends forfeits 50% of earned rewards. This ensures staking pool stability and discourages mercenary capital."
              />
            </div>

            <div className="p-6 bg-gray-900 rounded-lg">
              <h4 className="text-xl font-bold mb-4 text-primary-400">Example: 24-Month Staking (Diamond Hands)</h4>
              <div className="space-y-2 text-gray-300">
                <p>• Stake: 10,000 JY tokens</p>
                <p>• Lock Period: 730 days (24 months)</p>
                <p>• Target APR: 90% (after 9th month)</p>
                <p className="text-white font-semibold">→ Expected Rewards: 9,000 JY ($1,800 at $0.20/token)</p>
                <p className="text-accent-400">→ Governance Power: 25,000 votes (2.5x multiplier)</p>
                <p className="text-sm text-gray-500 mt-4">* Rewards come from platform revenue, not inflation</p>
              </div>
            </div>
          </Section>

          {/* Governance */}
          <Section id="governance" icon={<UserGroupIcon />} title="Governance">
            <p className="text-gray-300 mb-6">
              Joy Token implements a balanced governance model combining community participation with core team oversight for long-term platform stability and security.
            </p>

            <div className="space-y-6">
              <PhaseCard
                phase="Phase 1: Foundation (0-6 months)"
                description="Core team retains governance control with emergency veto power. Focus on stability and security."
                rights={[
                  'Community can submit proposals',
                  'Core team votes on behalf of treasury',
                  'Emergency multisig active',
                  'Building governance infrastructure'
                ]}
              />

              <PhaseCard
                phase="Phase 2: Community Voting (6+ months)"
                description="Community voting goes live. Core team retains veto power for critical security issues to ensure platform stability."
                rights={[
                  'Token holders vote directly on proposals',
                  '10,000 JY threshold to submit proposals',
                  '7-day voting period',
                  'Simple majority (>50%) to pass',
                  'Core team maintains emergency veto power'
                ]}
              />
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-lg border border-primary-500/30">
              <h4 className="text-xl font-bold mb-4 text-white">🏆 Token Holder Benefits</h4>
              <p className="text-gray-300 mb-4">
                Joy Token holders are valued partners in the ecosystem with permanent governance rights and recognition:
              </p>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 font-bold">✓</span>
                  <span><strong className="text-white">Everlasting Voting Power</strong> - Your voice matters in every major platform decision</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 font-bold">✓</span>
                  <span><strong className="text-white">Governance Multipliers</strong> - Longer stakes = greater voting weight (up to 2.5x)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 font-bold">✓</span>
                  <span><strong className="text-white">Community Recognition</strong> - Top contributors celebrated and highlighted</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 font-bold">✓</span>
                  <span><strong className="text-white">Executive Opportunities</strong> - Highly engaged holders can join core team roles as platform matures</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400 font-bold">✓</span>
                  <span><strong className="text-white">Direct Platform Influence</strong> - Shape the future of Africa's premier crypto news platform</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 p-6 bg-gray-800/50 rounded-lg">
              <h4 className="text-xl font-bold mb-4 text-accent-400">Governance Scope</h4>
              <p className="text-gray-300 mb-4">Token holders can vote on:</p>
              <ul className="grid md:grid-cols-2 gap-3 text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-primary-400">→</span>
                  Platform feature priorities
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400">→</span>
                  Treasury fund allocation
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400">→</span>
                  Staking reward adjustments
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400">→</span>
                  Partnership approvals
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400">→</span>
                  Content editorial guidelines
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary-400">→</span>
                  Regional expansion plans
                </li>
              </ul>
              <p className="text-sm text-gray-500 mt-4 italic">
                * Core team retains veto power to ensure platform security and long-term stability
              </p>
            </div>
          </Section>

          {/* Roadmap */}
          <Section id="roadmap" icon={<GlobeAltIcon />} title="Roadmap">
            <div className="space-y-6">
              <RoadmapPhase
                quarter="Q4 2025"
                status="CURRENT"
                milestones={[
                  { title: 'Smart contracts development & audit', done: true },
                  { title: 'Presale launch ($917.5K target)', done: false },
                  { title: 'Whitelist campaign & community building', done: false },
                  { title: 'Exchange partnership discussions', done: false }
                ]}
              />

              <RoadmapPhase
                quarter="Q1 2026"
                status="UPCOMING"
                milestones={[
                  { title: 'TGE + DEX launch (Uniswap V3)', done: false },
                  { title: 'Staking platform goes live', done: false },
                  { title: 'Premium content integration', done: false },
                  { title: 'Mobile app v1.0 released', done: false }
                ]}
              />

              <RoadmapPhase
                quarter="Q2 2026"
                status="PLANNED"
                milestones={[
                  { title: 'CEX listings (2+ Tier 2 exchanges)', done: false },
                  { title: 'Governance launch (community voting)', done: false },
                  { title: 'First quarterly burn event', done: false },
                  { title: 'Target 50K+ active users milestone', done: false }
                ]}
              />

              <RoadmapPhase
                quarter="Q3 2026"
                status="PLANNED"
                milestones={[
                  { title: 'BSC bridge + multi-chain expansion', done: false },
                  { title: 'Revenue sharing distribution begins', done: false },
                  { title: 'Africa expansion fund ($500K)', done: false },
                  { title: 'Partnerships with 3+ African govts', done: false }
                ]}
              />
            </div>
          </Section>

          {/* Team */}
          <Section id="team" icon={<UserGroupIcon />} title="Team & Advisors">
            <p className="text-gray-300 mb-8">
              Joy Token is built by an experienced team with deep crypto industry expertise and a proven track record in blockchain development, UI/UX design, and system architecture.
            </p>
            
            {/* Team Members */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Niceface */}
              <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700">
                <h4 className="text-xl font-bold text-white mb-2">Niceface</h4>
                <p className="text-primary-400 font-semibold mb-3">Founder/CEO</p>
                <p className="text-gray-300 text-sm mb-3">
                  Developer, Blockchain Analyst And Growth executor. Experienced Crypto developer and innovator building Web3 products, media platforms, and smart-contract solutions with a focus on impact, clarity, and excellence.
                </p>
                <ul className="space-y-1 text-sm text-gray-400">
                  <li>• Founder of Nice Studio</li>
                  <li>• Dune Analytics Wizard</li>
                  <li>• <a href="https://twitter.com/Iheanyichima" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300">@Iheanyichima</a></li>
                </ul>
              </div>

              {/* Denis */}
              <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700">
                <h4 className="text-xl font-bold text-white mb-2">Denis</h4>
                <p className="text-primary-400 font-semibold mb-3">UI/UX Specialist</p>
                <p className="text-gray-300 text-sm mb-3">
                  Highly-motivated, creative and pro-active designer and web developer able to research, design and develop user experiences for various digital products including mobile applications, websites and web applications.
                </p>
                <ul className="space-y-1 text-sm text-gray-400">
                  <li>• Expert in User Experience Design</li>
                  <li>• Full-Stack Web Developer</li>
                  <li>• <a href="https://www.denniskimathi.dev/resume" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300">Portfolio</a></li>
                </ul>
              </div>

              {/* Elhassan */}
              <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700">
                <h4 className="text-xl font-bold text-white mb-2">Elhassan</h4>
                <p className="text-primary-400 font-semibold mb-3">Fullstack Developer</p>
                <p className="text-gray-300 text-sm mb-3">
                  Experienced software engineer, successful in project management for software and system development. Looking for challenges that allow joining dynamic, ambitious organisations to build new products and solve technical problems.
                </p>
                <ul className="space-y-1 text-sm text-gray-400">
                  <li>• Expert in Project Management</li>
                  <li>• System Development Specialist</li>
                  <li>• <a href="https://hassandiv.github.io/" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300">Portfolio</a></li>
                </ul>
              </div>

              {/* Warren */}
              <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700">
                <h4 className="text-xl font-bold text-white mb-2">Warren</h4>
                <p className="text-primary-400 font-semibold mb-3">Fullstack Developer</p>
                <p className="text-gray-300 text-sm mb-3">
                  Computer Science graduate from Technical University of Mombasa. Versatile Full-Stack Developer with expertise in both traditional web and Web3 technologies. Passionate about building the decentralized future through innovative blockchain solutions.
                </p>
                <ul className="space-y-1 text-sm text-gray-400">
                  <li>• Web3 Technology Expert</li>
                  <li>• Frontend & Backend Specialist</li>
                  <li>• <a href="https://github.com/warrenshiv" target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:text-primary-300">GitHub</a></li>
                </ul>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-lg border border-primary-500/20 mb-8">
              <p className="text-gray-300 mb-4">
                <strong className="text-white">Team Experience & Vision:</strong>
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• <strong className="text-white">10+ years combined experience</strong> in crypto industry, blockchain development, and African fintech markets</li>
                <li>• Building relationships with major exchanges (Binance, Luno, Quidax) for partnerships</li>
                <li>• Pre-launch stage with comprehensive go-to-market strategy</li>
                <li>• Focus on sustainable revenue: ads, premium subs, token utility, partnerships</li>
                <li>• Target: 100K users Year 1, scaling to 500K+ by Year 3</li>
                <li>• <strong className="text-white">Growing team:</strong> Actively seeking more senior professionals to join our mission</li>
              </ul>
            </div>
            <div className="mt-8 p-6 bg-gray-900 rounded-lg">
              <h4 className="text-xl font-bold mb-4">Team Token Allocation</h4>
              <p className="text-gray-300 mb-4">
                11.7% of total supply (700,000 JY) allocated to core team with industry-leading vesting:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• <strong className="text-white">24-month cliff</strong> ensures long-term commitment</li>
                <li>• <strong className="text-white">4-year linear vesting</strong> after cliff (industry standard is 2 years)</li>
                <li>• <strong className="text-white">No early unlocks</strong> - full alignment with long-term success</li>
                <li>• Tokens locked in multi-sig contract (audited by Cyberscope)</li>
              </ul>
            </div>
          </Section>

          {/* Legal */}
          <Section id="legal" icon={<ShieldCheckIcon />} title="Legal & Compliance">
            <div className="space-y-6">
              <div className="p-6 bg-gray-800/50 rounded-lg">
                <h4 className="text-xl font-bold mb-4 text-primary-400">Regulatory Status</h4>
                <p className="text-gray-300 mb-4">
                  Joy Token is structured as a <Link href="/terms" className="text-primary-400 hover:text-primary-300 underline">utility token</Link> with no expectation of profit from the efforts of others. 
                  Token sale conducted under Reg D (506c) exemption for accredited investors and international participants.
                </p>
                <ul className="space-y-2 text-gray-300">
                  <li>• Legal opinion obtained from blockchain-specialized law firm</li>
                  <li>• Incorporated in business-friendly jurisdiction (Cayman Islands)</li>
                  <li>• KYC/AML procedures via PinkSale partnership</li>
                  <li>• US persons excluded from presale (geographical blocking)</li>
                </ul>
              </div>

              <div className="p-6 bg-gray-800/50 rounded-lg">
                <h4 className="text-xl font-bold mb-4 text-accent-400">Risk Disclosures</h4>
                <ul className="space-y-2 text-gray-300">
                  <li>• Cryptocurrency investments are highly speculative and volatile</li>
                  <li>• Token value may fluctuate significantly based on market conditions</li>
                  <li>• Regulatory changes could impact token utility or tradability</li>
                  <li>• Smart contract risks despite audits (no code is 100% bug-free)</li>
                  <li>• Platform revenue may not meet projections, affecting staking rewards</li>
                  <li>• Early-stage project with execution risk</li>
                </ul>
                <p className="mt-4 text-gray-400 text-sm">
                  <strong>IMPORTANT:</strong> Only invest what you can afford to lose. Do your own research (DYOR). 
                  This whitepaper does not constitute investment advice.
                </p>
              </div>
            </div>
          </Section>

        </div>
      </div>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500/20 to-accent-500/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Join the Future?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Secure your position in Africa's premier crypto platform token
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/presale"
              className="px-8 py-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg font-semibold hover:scale-105 transition-transform"
            >
              Join Presale Now
            </Link>
            <button 
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              disabled={isGeneratingPDF}
              className="px-8 py-4 border border-primary-500 rounded-lg font-semibold hover:bg-primary-500/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="w-6 h-6" />
              {isGeneratingPDF ? 'Generating...' : 'Download Full PDF'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

// Helper Components
function Section({ id, icon, title, children }: { id: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="scroll-mt-20"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
          {React.cloneElement(icon as React.ReactElement, { className: 'w-6 h-6' })}
        </div>
        <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
      </div>
      <div className="pl-0 md:pl-15">
        {children}
      </div>
    </motion.section>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-6 rounded-lg text-center ${highlight ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-500/30' : 'bg-gray-800/50'}`}>
      <p className="text-3xl font-bold text-white mb-2">{value}</p>
      <p className="text-gray-400">{label}</p>
    </div>
  );
}

function ProblemCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-4 bg-gray-800/50 rounded-lg border-l-4 border-red-500/50">
      <h4 className="font-bold text-white mb-2">{title}</h4>
      <p className="text-gray-300 text-sm">{description}</p>
    </div>
  );
}

function SolutionCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4 p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h4 className="font-bold text-white mb-1">{title}</h4>
        <p className="text-gray-300 text-sm">{description}</p>
      </div>
    </div>
  );
}

function TechCard({ title, features }: { title: string; features: string[] }) {
  return (
    <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
      <h4 className="text-xl font-bold mb-4 text-primary-400">{title}</h4>
      <ul className="space-y-2">
        {features.map((feature, i) => (
          <li key={i} className="text-gray-300 flex items-start gap-2">
            <span className="text-accent-400 mt-1">→</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AllocationBar({ label, percentage, amount }: { label: string; percentage: number; amount: string }) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="text-white font-semibold">{label}</span>
        <span className="text-gray-400">{amount}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3">
        <div 
          className="bg-gradient-to-r from-primary-500 to-accent-500 h-3 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-sm text-gray-400 mt-1">{percentage}%</p>
    </div>
  );
}

function VestingItem({ category, schedule }: { category: string; schedule: string }) {
  return (
    <div className="pb-4 border-b border-gray-700 last:border-0">
      <p className="font-semibold text-white mb-1">{category}</p>
      <p className="text-sm text-gray-400">{schedule}</p>
    </div>
  );
}

function UseOfFunds({ label, amount, percentage }: { label: string; amount: string; percentage: number }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-white mb-2">{amount}</p>
      <p className="text-gray-300 mb-1">{label}</p>
      <p className="text-sm text-gray-400">{percentage}% of total</p>
    </div>
  );
}

function StakingTier({ name, apr, lockPeriod, govMultiplier, description, popular }: { name: string; apr: string; lockPeriod: string; govMultiplier: string; description: string; popular?: boolean }) {
  return (
    <div className={`p-6 rounded-lg border-2 relative ${popular ? 'border-primary-500 bg-primary-500/5' : 'border-gray-700 bg-gray-800/50'}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full text-xs font-bold">
          POPULAR
        </div>
      )}
      <h4 className="text-xl font-bold mb-2 text-white">{name}</h4>
      <p className="text-4xl font-bold text-primary-400 mb-4">{apr} APR</p>
      <div className="space-y-2 mb-4 text-sm">
        <p className="text-gray-300">Lock Period: <span className="text-white">{lockPeriod}</span></p>
        <p className="text-gray-300">Governance: <span className="text-white">{govMultiplier}</span></p>
      </div>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function InfoBox({ title, content }: { title: string; content: string }) {
  return (
    <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
      <h5 className="font-semibold text-white mb-2">{title}</h5>
      <p className="text-gray-300 text-sm">{content}</p>
    </div>
  );
}

function PhaseCard({ phase, description, rights }: { phase: string; description: string; rights: string[] }) {
  return (
    <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
      <h4 className="text-xl font-bold mb-2 text-primary-400">{phase}</h4>
      <p className="text-gray-300 mb-4">{description}</p>
      <ul className="space-y-2">
        {rights.map((right, i) => (
          <li key={i} className="text-gray-300 flex items-start gap-2">
            <span className="text-accent-400">•</span>
            <span>{right}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RoadmapPhase({ quarter, status, milestones }: { quarter: string; status: string; milestones: { title: string; done: boolean }[] }) {
  const statusColors: Record<string, string> = {
    CURRENT: 'bg-green-500',
    UPCOMING: 'bg-primary-500',
    PLANNED: 'bg-gray-500'
  };

  return (
    <div className="p-6 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex items-center gap-3 mb-4">
        <div className={`px-3 py-1 ${statusColors[status]} rounded-full text-xs font-bold`}>
          {status}
        </div>
        <h4 className="text-2xl font-bold text-white">{quarter}</h4>
      </div>
      <ul className="space-y-2">
        {milestones.map((milestone, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${milestone.done ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
              {milestone.done && <span className="text-white text-xs">✓</span>}
            </div>
            <span className={milestone.done ? 'text-gray-400 line-through' : 'text-gray-300'}>{milestone.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
