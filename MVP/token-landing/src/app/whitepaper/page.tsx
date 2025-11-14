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
              <StatBox label="Max Supply" value="5,000,000 JY" highlight />
              <StatBox label="Target Network" value="21.1M Partners" highlight />
              <StatBox label="Market Opportunity" value="$11.4B TAM" highlight />
            </div>
            <p className="text-gray-300 mb-4">
              Unlike speculative tokens, JY derives mandatory demand from infrastructure-level utility: every PR 
              distribution, ad placement, and partnership transaction across our 21.1 million target partnerships 
              requires Joy Token. Our revenue model combines platform transaction fees (from distribution network) 
              with premium content subscriptions, funding industry-leading staking rewards up to 70% APR.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300">
              <li><strong className="text-white">Infrastructure Monopoly:</strong> Exclusive payment token for the largest Web3 distribution network in Africa</li>
              <li><strong className="text-white">$11.4B Market:</strong> Targeting combined $7.2B PR distribution + $4.2B crypto advertising markets</li>
              <li><strong className="text-white">Extreme Scarcity:</strong> Only 5M tokens for 21.1M partnerships—built-in supply shock</li>
              <li><strong className="text-white">Real Yield Model:</strong> Staking rewards from actual transaction fees, not inflation (up to 70% APR)</li>
              <li><strong className="text-white">Network Effects:</strong> Value compounds exponentially as partnerships scale from 10K to 21M</li>
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
                <p>→ Token scarcity increases (5M supply vs 21M partnerships)</p>
                <p className="text-primary-400 font-semibold">→ Metcalfe's Law: Network value = n² = exponential growth</p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-br from-primary-600/10 to-purple-600/10 rounded-lg border border-primary-500/30">
              <h4 className="text-xl font-bold mb-4 text-white">Why Joy Token Captures This Value</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                <div>
                  <p className="mb-2">✓ <strong>Exclusive Payment Method:</strong> No USD, no alternatives—only JY accepted</p>
                  <p className="mb-2">✓ <strong>Mandatory Demand:</strong> Every transaction across 21M partnerships requires JY</p>
                  <p>✓ <strong>Supply Shock Economics:</strong> 5M tokens for network projected to handle millions of monthly PRs</p>
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
                  'Fixed supply of 5,000,000 JY (immutable)',
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
                <li>✓ Audited by CertiK (Q1 2026)</li>
                <li>✓ Multi-signature wallet for treasury (3/5)</li>
                <li>✓ Timelock on governance actions (48 hours)</li>
                <li>✓ Bug bounty program ($50K pool)</li>
                <li>✓ Gradual decentralization plan</li>
              </ul>
            </div>
          </Section>

          {/* Tokenomics */}
          <Section id="tokenomics" icon={<ChartBarIcon />} title="Tokenomics">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-2xl font-bold mb-4 text-primary-400">Supply Distribution</h3>
                <div className="space-y-3">
                  <AllocationBar label="Ecosystem & Staking" percentage={36} amount="1,800,000 JY" />
                  <AllocationBar label="Reserve Fund" percentage={20} amount="1,000,000 JY" />
                  <AllocationBar label="Public Sale" percentage={16} amount="800,000 JY" />
                  <AllocationBar label="Team & Advisors" percentage={13.34} amount="667,000 JY" />
                  <AllocationBar label="Seed Investors" percentage={10} amount="500,000 JY" />
                  <AllocationBar label="Liquidity" percentage={4.46} amount="223,000 JY" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-4 text-accent-400">Vesting Schedule</h3>
                <div className="space-y-4 text-gray-300">
                  <VestingItem 
                    category="Public Sale" 
                    schedule="100% unlocked at TGE (Token Generation Event)"
                  />
                  <VestingItem 
                    category="Team & Advisors" 
                    schedule="4-year vest, 1-year cliff (3.125% quarterly)"
                  />
                  <VestingItem 
                    category="Seed Investors" 
                    schedule="2-year vest, 6-month cliff (6.25% quarterly)"
                  />
                  <VestingItem 
                    category="Reserve Fund" 
                    schedule="10-year vest, 2-year cliff (2.5% quarterly)"
                  />
                  <VestingItem 
                    category="Ecosystem" 
                    schedule="Released based on platform milestones"
                  />
                  <VestingItem 
                    category="Liquidity" 
                    schedule="Locked on PinkSale for 1 year"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-lg border border-primary-500/30">
              <h4 className="text-2xl font-bold mb-4">Use of Funds ($350K Presale)</h4>
              <div className="grid md:grid-cols-2 gap-6">
                <UseOfFunds label="Liquidity Lock" amount="$200,000" percentage={57} />
                <UseOfFunds label="Legal & Compliance" amount="$50,000" percentage={14} />
                <UseOfFunds label="Platform Development" amount="$50,000" percentage={14} />
                <UseOfFunds label="Marketing & Growth" amount="$50,000" percentage={14} />
              </div>
            </div>
          </Section>

          {/* Staking Mechanism */}
          <Section id="staking" icon={<ShieldCheckIcon />} title="Staking Mechanism">
            <p className="text-gray-300 mb-6">
              Joy Token offers industry-leading staking rewards backed by real platform revenue, not token inflation.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <StakingTier
                name="Flexible"
                apr="2%"
                lockPeriod="None"
                govMultiplier="1x"
                description="Unstake anytime with no penalties. Perfect for liquidity-conscious holders."
              />
              <StakingTier
                name="6-Month Lock"
                apr="8%"
                lockPeriod="180 days"
                govMultiplier="1.5x"
                description="Moderate commitment with boosted rewards and governance power."
              />
              <StakingTier
                name="12-Month Lock"
                apr="30%"
                lockPeriod="365 days"
                govMultiplier="2x"
                popular
                description="Most popular tier. Strong APR with doubled voting power."
              />
              <StakingTier
                name="24-Month Lock"
                apr="70%"
                lockPeriod="730 days"
                govMultiplier="3x"
                popular
                description="Maximum rewards for long-term believers. Triple governance weight."
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
              <h4 className="text-xl font-bold mb-4 text-primary-400">Example: 12-Month Staking</h4>
              <div className="space-y-2 text-gray-300">
                <p>• Stake: 10,000 JY tokens</p>
                <p>• Lock Period: 365 days</p>
                <p>• Target APR: 30%</p>
                <p className="text-white font-semibold">→ Expected Rewards: 3,000 JY ($600 at $0.20/token)</p>
                <p className="text-accent-400">→ Governance Power: 20,000 votes (2x multiplier)</p>
              </div>
            </div>
          </Section>

          {/* Governance */}
          <Section id="governance" icon={<UserGroupIcon />} title="Governance">
            <p className="text-gray-300 mb-6">
              Joy Token implements a progressive decentralization model, gradually shifting control to the community.
            </p>

            <div className="space-y-6">
              <PhaseCard
                phase="Phase 1: Launch (0-6 months)"
                description="Core team retains governance control with emergency veto power. Focus on stability and security."
                rights={[
                  'Community can submit proposals',
                  'Core team votes on behalf of treasury',
                  'Emergency multisig active'
                ]}
              />

              <PhaseCard
                phase="Phase 2: Transition (6-18 months)"
                description="Community voting goes live. Core team veto power reduced to critical security issues only."
                rights={[
                  'Token holders vote directly',
                  '10,000 JY threshold to submit proposals',
                  '7-day voting period',
                  'Simple majority (>50%) to pass'
                ]}
              />

              <PhaseCard
                phase="Phase 3: Full Decentralization (18+ months)"
                description="Complete community control. Team multisig disbanded. On-chain governance only."
                rights={[
                  'No team veto power',
                  'Time-weighted voting (longer stakes = more weight)',
                  'Treasury controlled by governance',
                  'On-chain execution of proposals'
                ]}
              />
            </div>

            <div className="mt-8 p-6 bg-gray-800/50 rounded-lg">
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
            </div>
          </Section>

          {/* Roadmap */}
          <Section id="roadmap" icon={<GlobeAltIcon />} title="Roadmap">
            <div className="space-y-6">
              <RoadmapPhase
                quarter="Q4 2025"
                status="CURRENT"
                milestones={[
                  { title: 'Token Smart Contracts Development', done: true },
                  { title: 'Security Audit by CertiK', done: false },
                  { title: 'Presale Launch on PinkSale', done: false },
                  { title: 'Community Building & Whitelist', done: false }
                ]}
              />

              <RoadmapPhase
                quarter="Q1 2026"
                status="UPCOMING"
                milestones={[
                  { title: 'Token Generation Event (TGE)', done: false },
                  { title: 'DEX Launch (Uniswap V3)', done: false },
                  { title: 'Staking Platform Live', done: false },
                  { title: 'Premium Content Integration', done: false }
                ]}
              />

              <RoadmapPhase
                quarter="Q2 2026"
                status="PLANNED"
                milestones={[
                  { title: 'CEX Listings (Target: Tier 2 exchanges)', done: false },
                  { title: 'Mobile App with Token Features', done: false },
                  { title: 'Governance Launch (Phase 2)', done: false },
                  { title: 'First Quarterly Burn Event', done: false }
                ]}
              />

              <RoadmapPhase
                quarter="Q3 2026"
                status="PLANNED"
                milestones={[
                  { title: 'BSC Bridge Launch', done: false },
                  { title: '1M+ Platform Users Milestone', done: false },
                  { title: 'Revenue Sharing Distribution Begins', done: false },
                  { title: 'Africa Expansion Fund Launch', done: false }
                ]}
              />
            </div>
          </Section>

          {/* Team */}
          <Section id="team" icon={<UserGroupIcon />} title="Team & Advisors">
            <p className="text-gray-300 mb-8">
              Joy Token is built by the proven CoinDaily team with deep Africa crypto market expertise.
            </p>
            <div className="p-6 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-lg border border-primary-500/20">
              <p className="text-gray-300 mb-4">
                <strong className="text-white">Team Experience & Vision:</strong>
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• 10+ years combined experience in African crypto and fintech markets</li>
                <li>• Building relationships with major exchanges (Binance, Luno, Quidax) for partnerships</li>
                <li>• Pre-launch stage with comprehensive go-to-market strategy</li>
                <li>• Focus on sustainable revenue: ads, premium subs, token utility, partnerships</li>
                <li>• Target: 100K users Year 1, scaling to 500K+ by Year 3</li>
              </ul>
            </div>
            <div className="mt-8 p-6 bg-gray-900 rounded-lg">
              <h4 className="text-xl font-bold mb-4">Team Token Allocation</h4>
              <p className="text-gray-300 mb-4">
                13.34% of total supply (667,000 JY) allocated to core team with industry-leading vesting:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li>• <strong className="text-white">4-year vesting period</strong> (industry standard is 2 years)</li>
                <li>• <strong className="text-white">1-year cliff</strong> ensures long-term commitment</li>
                <li>• <strong className="text-white">Quarterly unlocks</strong> (3.125% every 3 months after cliff)</li>
                <li>• Tokens locked in multi-sig contract (audited by CertiK)</li>
              </ul>
            </div>
          </Section>

          {/* Legal */}
          <Section id="legal" icon={<ShieldCheckIcon />} title="Legal & Compliance">
            <div className="space-y-6">
              <div className="p-6 bg-gray-800/50 rounded-lg">
                <h4 className="text-xl font-bold mb-4 text-primary-400">Regulatory Status</h4>
                <p className="text-gray-300 mb-4">
                  Joy Token is structured as a utility token with no expectation of profit from the efforts of others. 
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
