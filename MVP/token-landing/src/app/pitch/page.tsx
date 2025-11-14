'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const slides = [
  {
    id: 1,
    title: "Joy Token ($JY)",
    subtitle: "Exclusive Currency for Africa's Largest Web3 Distribution Network",
    content: (
      <div className="text-center space-y-8">
        <div className="text-6xl font-bold gradient-text mb-4">$JY</div>
        <p className="text-2xl text-gray-300 max-w-2xl mx-auto">
          Infrastructure-level utility powering 21.1M publisher partnerships. Real infrastructure. Real demand. Real opportunity.
        </p>
        <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
          <div className="p-6 bg-gray-800/50 rounded-lg">
            <p className="text-4xl font-bold text-primary-500">21.1M</p>
            <p className="text-gray-400 mt-2">Target Partnerships</p>
          </div>
          <div className="p-6 bg-gray-800/50 rounded-lg">
            <p className="text-4xl font-bold text-accent-500">$11.4B</p>
            <p className="text-gray-400 mt-2">Market TAM</p>
          </div>
          <div className="p-6 bg-gray-800/50 rounded-lg">
            <p className="text-4xl font-bold text-green-500">5M</p>
            <p className="text-gray-400 mt-2">Fixed Supply</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: "The Problem",
    subtitle: "Web3 Distribution is Broken",
    content: (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <ProblemBox 
            number="1"
            title="Fragmented Distribution"
            description="Publishers pay $500-2000 per PR to centralized platforms (PRNewswire, BusinessWire). No unified African network exists."
            impact="$7.2B PR distribution market remains USD-based and inefficient"
          />
          <ProblemBox 
            number="2"
            title="Cross-Border Friction"
            description="Wire transfers incur 5-15% fees + 3-7 day delays for international PR services"
            impact="African publishers excluded from global networks"
          />
          <ProblemBox 
            number="3"
            title="No Verification Infrastructure"
            description="Publishers pay upfront with zero guarantee PR appears as promised"
            impact="Billions lost to fraud, disputes, and failed placements"
          />
          <ProblemBox 
            number="4"
            title="No Web3 Alternative"
            description="Crypto projects need distribution but legacy platforms don't accept blockchain payments"
            impact="$4.2B crypto advertising spend stuck in Web2 infrastructure"
          />
        </div>
        <div className="mt-8 p-6 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-lg text-center">
          <p className="text-2xl font-bold text-white mb-2">The Opportunity?</p>
          <p className="text-xl text-gray-300">Build blockchain-native infrastructure for an $11.4B market with no dominant Web3 player</p>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: "The Solution",
    subtitle: "Joy Token: Infrastructure Currency for Web3 Distribution",
    content: (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-primary-400 mb-4">Network Scale</h3>
            <MetricCard label="Tier 1 (DA 80-100)" value="100,000" />
            <MetricCard label="Tier 2 (DA 60-80)" value="1,000,000" />
            <MetricCard label="Tier 3 (DA 40-60)" value="20,000,000" />
            <MetricCard label="Total Partnerships" value="21.1M" />
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-accent-400 mb-4">Infrastructure Features</h3>
            <UtilityItem 
              icon="⚡"
              title="Universal SDK"
              description="JavaScript SDK compatible with any website tech stack"
            />
            <UtilityItem 
              icon="🤖"
              title="AI Verification"
              description="Automated placement verification before payment release"
            />
            <UtilityItem 
              icon="�"
              title="Blockchain Rails"
              description="Instant settlements via Polygon—no wire transfer fees"
            />
            <UtilityItem 
              icon="�"
              title="Exclusive Currency"
              description="Joy Token ONLY—no USD, no alternatives"
            />
          </div>
        </div>
      </div>
    )
  },
  {
    id: 4,
    title: "Market Opportunity",
    subtitle: "$11.4B TAM with No Web3 Competitor",
    content: (
      <div className="space-y-8">
        <div className="grid md:grid-cols-3 gap-6">
          <MarketStat 
            value="$7.2B"
            label="PR Distribution Market (2024)"
            change="+11.3% CAGR"
          />
          <MarketStat 
            value="$4.2B"
            label="Crypto Advertising Spend (2024)"
            change="Growing rapidly"
          />
          <MarketStat 
            value="88%"
            label="Africa Crypto Adoption YoY"
            change="Fastest globally"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="p-6 bg-gray-800/50 rounded-lg">
            <h4 className="text-xl font-bold text-primary-400 mb-4">Why Africa First?</h4>
            <ul className="space-y-2 text-gray-300">
              <li>✓ 420M internet users, 70% under 30</li>
              <li>✓ 88% YoY crypto adoption growth (Chainalysis 2023)</li>
              <li>✓ Mobile money dominance (M-Pesa, MTN Money)</li>
              <li>✓ Currency instability drives crypto demand</li>
              <li>✓ $2.5T crypto economy projected by 2030</li>
            </ul>
          </div>
          <div className="p-6 bg-gray-800/50 rounded-lg">
            <h4 className="text-xl font-bold text-accent-400 mb-4">Competitive Advantages</h4>
            <ul className="space-y-2 text-gray-300">
              <li>✓ First Web3-native PR distribution network in Africa</li>
              <li>✓ Network effects: 21M partnerships create lock-in</li>
              <li>✓ Exclusive payment token = mandatory demand</li>
              <li>✓ AI verification solves trust problem</li>
              <li>✓ Blockchain rails = instant, low-cost settlements</li>
            </ul>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-lg text-center">
          <p className="text-xl text-gray-300">
            <strong className="text-white">The Thesis:</strong> Capture 1% of $11.4B market = <strong className="text-primary-400">$114M annual transaction volume</strong>
          </p>
          <p className="text-gray-400 mt-2">With 5M token supply, even conservative adoption creates supply shock</p>
        </div>
      </div>
    )
  },
  {
    id: 5,
    title: "Tokenomics",
    subtitle: "Extreme Scarcity Meets Real Utility",
    content: (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold text-primary-400 mb-4">Supply Allocation</h3>
            <div className="space-y-3">
              <AllocationRow label="Ecosystem & Staking" percentage={36} color="bg-blue-500" />
              <AllocationRow label="Reserve Fund (10yr)" percentage={20} color="bg-purple-500" />
              <AllocationRow label="Public Sale" percentage={16} color="bg-green-500" />
              <AllocationRow label="Team (4yr vest)" percentage={14} color="bg-yellow-500" />
              <AllocationRow label="Seed (2yr vest)" percentage={10} color="bg-pink-500" />
              <AllocationRow label="Liquidity Locked" percentage={4} color="bg-red-500" />
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-accent-400 mb-4">Staking Tiers</h3>
            <div className="space-y-3">
              <StakingRow period="24 Months" apr="70%" multiplier="3x" highlight />
              <StakingRow period="12 Months" apr="30%" multiplier="2x" highlight />
              <StakingRow period="6 Months" apr="8%" multiplier="1.5x" />
              <StakingRow period="Flexible" apr="2%" multiplier="1x" />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <KeyFeature 
            title="Real Yield"
            description="Rewards from platform revenue, not inflation"
            icon="💎"
          />
          <KeyFeature 
            title="Deflationary"
            description="Quarterly burns reduce supply permanently"
            icon="🔥"
          />
          <KeyFeature 
            title="Long-Term Aligned"
            description="Team: 4yr vest. Reserve: 10yr vest"
            icon="🔒"
          />
        </div>
      </div>
    )
  },
  {
    id: 6,
    title: "Business Model",
    subtitle: "Sustainable Revenue Powering Real Yield",
    content: (
      <div className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <RevenueStream 
            title="Premium Subscriptions"
            current="Pre-Launch"
            projected="$20K MRR (Y1)"
            description="1,000 subs @ $19.99/mo from 100K users — Whale alerts, AI analysis"
            benchmark="CoinDesk: 3.5% conversion rate | We target 1%"
          />
          <RevenueStream 
            title="Advertising"
            current="Pre-Launch"
            projected="$60K MRR (Y1)"
            description="Banner ads, sponsored content, featured listings"
            benchmark="Cointelegraph: $8 CPM average | 100K users × 75 views/mo"
          />
          <RevenueStream 
            title="Token Utility Revenue"
            current="Pre-Launch"
            projected="$40K MRR (Y1)"
            description="Projects pay in $JY for ads (50% discount) — creates buy pressure"
            benchmark="Early-stage: 8-10 projects/mo @ $4-5K each"
          />
          <RevenueStream 
            title="Partnerships & Data"
            current="Pre-Launch"
            projected="$15K MRR (Y1)"
            description="Exchange affiliates, API access, white-label content licensing"
            benchmark="CMC: $3 RPM | Conservative estimate for new platform"
          />
        </div>

        <div className="p-6 bg-gray-800/50 rounded-lg">
          <h4 className="text-2xl font-bold text-center mb-6">Revenue Distribution Model</h4>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-500 mb-2">70%</div>
              <p className="text-gray-400">Staking Rewards</p>
              <p className="text-sm text-gray-500 mt-2">Direct to token holders</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-accent-500 mb-2">20%</div>
              <p className="text-gray-400">Treasury</p>
              <p className="text-sm text-gray-500 mt-2">Governance controlled</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-500 mb-2">10%</div>
              <p className="text-gray-400">Buyback & Burn</p>
              <p className="text-sm text-gray-500 mt-2">Reduce supply</p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg text-center">
          <p className="text-xl text-white mb-2">
            <strong>Year 1 Target:</strong> $135K MRR → $1.62M ARR
          </p>
          <p className="text-gray-300">
            Based on achieving 100K MAU by Q4 2026 (realistic for African-focused platform)
          </p>
        </div>
      </div>
    )
  },
  {
    id: 7,
    title: "Roadmap",
    subtitle: "18-Month Execution Plan",
    content: (
      <div className="space-y-6">
        <RoadmapQuarter 
          quarter="Q4 2025"
          status="CURRENT"
          items={[
            { text: "Smart contracts development & audit", done: true },
            { text: "Presale launch ($350K target)", done: false },
            { text: "Whitelist campaign & community building", done: false },
            { text: "Exchange partnership discussions", done: false }
          ]}
        />
        
        <RoadmapQuarter 
          quarter="Q1 2026"
          status="NEXT"
          items={[
            { text: "TGE + DEX launch (Uniswap V3)", done: false },
            { text: "Staking platform goes live", done: false },
            { text: "Premium content integration", done: false },
            { text: "Mobile app v1.0 released", done: false }
          ]}
        />

        <RoadmapQuarter 
          quarter="Q2 2026"
          status="PLANNED"
          items={[
            { text: "CEX listings (2+ Tier 2 exchanges)", done: false },
            { text: "Governance launch (community voting)", done: false },
            { text: "First quarterly burn event", done: false },
            { text: "Target 50K+ active users milestone", done: false }
          ]}
        />

        <RoadmapQuarter 
          quarter="Q3 2026"
          status="PLANNED"
          items={[
            { text: "BSC bridge + multi-chain expansion", done: false },
            { text: "Revenue sharing distribution begins", done: false },
            { text: "Africa expansion fund ($500K)", done: false },
            { text: "Partnerships with 3+ African govts", done: false }
          ]}
        />
      </div>
    )
  },
  {
    id: 8,
    title: "Competitive Advantage",
    subtitle: "Why We Win",
    content: (
      <div className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <ComparisonCard 
            title="Traditional Crypto Media"
            items={[
              { text: "No token/ownership", bad: true },
              { text: "Western-focused", bad: true },
              { text: "Ad-revenue only", bad: true },
              { text: "Zero user incentives", bad: true },
              { text: "English only", bad: true }
            ]}
          />
          <ComparisonCard 
            title="Joy Token + CoinDaily"
            items={[
              { text: "Token ownership & governance", bad: false },
              { text: "Africa-first strategy", bad: false },
              { text: "Multiple revenue streams", bad: false },
              { text: "Staking rewards + utility", bad: false },
              { text: "13 African languages", bad: false }
            ]}
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <EdgeCard 
            title="First-Mover"
            description="Pre-launch positioning to dominate African crypto news before competition arrives"
          />
          <EdgeCard 
            title="Network Effects"
            description="More users → more revenue → higher rewards → attracts more users"
          />
          <EdgeCard 
            title="Local Expertise"
            description="10+ years team experience in African markets, regulations, and culture"
          />
        </div>
      </div>
    )
  },
  {
    id: 9,
    title: "The Ask",
    subtitle: "Presale Investment Opportunity",
    content: (
      <div className="space-y-8">
        <div className="text-center">
          <div className="text-5xl font-bold gradient-text mb-4">$350,000</div>
          <p className="text-2xl text-gray-300 mb-8">Presale Target (16% of total supply)</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-primary-400 mb-4">Use of Funds</h3>
            <div className="space-y-3">
              <FundRow label="Liquidity Lock (permanently)" amount="$200,000" percentage={57} />
              <FundRow label="Legal & Compliance" amount="$50,000" percentage={14} />
              <FundRow label="Platform Development" amount="$50,000" percentage={14} />
              <FundRow label="Marketing & Growth" amount="$50,000" percentage={14} />
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-accent-400 mb-4">Presale Terms</h3>
            <div className="space-y-3 text-gray-300">
              <TermRow label="Price per Token" value="$0.25" />
              <TermRow label="Tokens Available" value="800,000 JY" />
              <TermRow label="Min Investment" value="$100" />
              <TermRow label="Max Investment" value="$10,000/wallet" />
              <TermRow label="Vesting" value="100% at TGE" highlight />
              <TermRow label="Listing Price" value="$0.9 (260% markup)" highlight />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <InvestorBenefit 
            icon="⚡"
            title="Early Access"
            description="40% discount vs. public listing price"
          />
          <InvestorBenefit 
            icon="🎁"
            title="Bonus Tokens"
            description="Additional 10% bonus for investments >$10K"
          />
          <InvestorBenefit 
            icon="👑"
            title="VIP Status"
            description="Whitelist priority + lifetime premium access"
          />
        </div>

        <div className="p-8 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-lg text-center">
          <p className="text-2xl font-bold text-white mb-4">Limited Time Opportunity</p>
          <p className="text-xl text-gray-300 mb-6">
            Secure your position in Africa's first tokenized crypto news platform
          </p>
          <Link 
            href="/presale"
            className="inline-block px-12 py-4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg font-bold text-xl hover:scale-105 transition-transform"
          >
            Join Presale Now →
          </Link>
        </div>
      </div>
    )
  },
  {
    id: 10,
    title: "Investment Highlights",
    subtitle: "Why Joy Token Wins",
    content: (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <HighlightBox 
            number="1"
            title="Market Opportunity"
            points={[
              "Africa's crypto market: $2.5T by 2030",
              "No dominant African crypto news platform yet",
              "First-mover advantage in 13 local languages"
            ]}
          />
          <HighlightBox 
            number="2"
            title="Extreme Scarcity"
            points={[
              "Only 5M tokens (vs. billions for competitors)",
              "14% team allocation locked for 4 years",
              "Quarterly burns reduce supply permanently"
            ]}
          />
          <HighlightBox 
            number="3"
            title="Real Utility"
            points={[
              "Required for premium platform features",
              "Discounts on advertising spend (50% off with $JY)",
              "Governance rights over platform decisions"
            ]}
          />
          <HighlightBox 
            number="4"
            title="Sustainable Model"
            points={[
              "Staking rewards from revenue, not inflation",
              "Multiple revenue streams diversify risk",
              "Flywheel effect: growth begets growth"
            ]}
          />
        </div>

        <div className="p-8 bg-gray-900 rounded-lg mt-8">
          <h3 className="text-3xl font-bold text-center mb-8 gradient-text">Risk Factors</h3>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <p className="font-semibold text-white mb-2">Crypto Market Risk</p>
              <p className="text-sm">Token value depends on overall crypto market conditions</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">Regulatory Risk</p>
              <p className="text-sm">Changing regulations may impact token utility or trading</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">Execution Risk</p>
              <p className="text-sm">Platform growth may not meet projections</p>
            </div>
            <div>
              <p className="font-semibold text-white mb-2">Competition Risk</p>
              <p className="text-sm">Competitors may enter African crypto media market</p>
            </div>
          </div>
          <p className="text-center text-gray-400 text-sm mt-6">
            <strong>Important:</strong> Cryptocurrency investments are high-risk. Only invest what you can afford to lose.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 11,
    title: "Contact & Next Steps",
    subtitle: "Let's Build Africa's Crypto Future Together",
    content: (
      <div className="space-y-8">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xl text-gray-300 mb-8">
            Ready to be part of Africa's $2.5T crypto revolution? Join our community and 
            secure your position in Joy Token presale.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <NextStepCard 
            step="1"
            title="Join Whitelist"
            description="Get priority access and exclusive updates"
            action="Sign Up Now"
          />
          <NextStepCard 
            step="2"
            title="Review Materials"
            description="Download whitepaper and investment deck"
            action="Get Documents"
          />
          <NextStepCard 
            step="3"
            title="Participate"
            description="Secure your tokens at presale price"
            action="Join Presale"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-8 mt-12">
          <div className="p-6 bg-gray-800/50 rounded-lg">
            <h4 className="text-xl font-bold mb-4 text-primary-400">Contact Information</h4>
            <div className="space-y-3 text-gray-300">
              <p>📧 Email: <a href="mailto:partnerships@coindaily.online" className="text-primary-400 hover:underline">partnerships@coindaily.online</a></p>
              <p>🐦 Twitter: <a href="https://twitter.com/coindaily001" className="text-primary-400 hover:underline">@coindaily001</a></p>
              <p>💬 Telegram: <a href="https://t.me/coindailynewz" className="text-primary-400 hover:underline">t.me/coindailynewz</a></p>
              <p>🌐 Website: <a href="https://coindaily.online" className="text-primary-400 hover:underline">coindaily.online</a></p>
              <p>💻 GitHub: <a href="https://github.com/seedline_foundation/coindaily" className="text-primary-400 hover:underline">seedline_foundation/coindaily</a></p>
            </div>
          </div>

          <div className="p-6 bg-gray-800/50 rounded-lg">
            <h4 className="text-xl font-bold mb-4 text-accent-400">Important Links</h4>
            <div className="space-y-3">
              <LinkButton href="/whitepaper" label="📄 Technical Whitepaper" />
              <LinkButton href="/presale" label="🚀 Join Presale" />
              <LinkButton href="https://github.com/seedline_foundation/coindaily" label="💻 GitHub" external />
              <LinkButton href="https://coindaily.online" label="🏠 Main Platform" external />
            </div>
          </div>
        </div>

        <div className="p-8 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-lg text-center mt-12">
          <p className="text-3xl font-bold text-white mb-4">Thank You</p>
          <p className="text-xl text-gray-300">
            Questions? We're here to help. Reach out anytime.
          </p>
        </div>
      </div>
    )
  }
];

export default function PitchDeckPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const slideContainerRef = useRef<HTMLDivElement>(null);

  // PDF Generation Function (Client-side using jsPDF + html2canvas)
  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Save current slide
      const originalSlide = currentSlide;
      
      for (let i = 0; i < slides.length; i++) {
        setCurrentSlide(i);
        
        // Wait for slide to render
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const slideElement = document.getElementById(`slide-content-${i}`);
        if (slideElement) {
          const canvas = await html2canvas(slideElement, {
            scale: 2,
            backgroundColor: '#000000',
            logging: false,
          });
          
          const imgData = canvas.toDataURL('image/png');
          
          if (i > 0) {
            pdf.addPage();
          }
          
          // Calculate dimensions to fit page
          const imgWidth = pageWidth;
          const imgHeight = (canvas.height * pageWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        }
      }
      
      // Restore original slide
      setCurrentSlide(originalSlide);
      
      pdf.save('joy-token-pitch-deck.pdf');
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
    // Link to pre-generated PDF file
    const link = document.createElement('a');
    link.href = '/pdfs/joy-token-pitch-deck.pdf';
    link.download = 'joy-token-pitch-deck.pdf';
    link.click();
    setShowDownloadMenu(false);
  };

  const nextSlide = () => {
    setDirection(1);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-lg flex items-center justify-center font-bold">
              JY
            </div>
            <span className="font-bold">Joy Token Pitch</span>
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-gray-400">
              {currentSlide + 1} / {slides.length}
            </span>
            
            {/* PDF Download Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                disabled={isGeneratingPDF}
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
              </button>
              
              {showDownloadMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden z-50">
                  <button
                    onClick={generatePDF}
                    className="w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors flex items-center gap-3"
                  >
                    <DocumentArrowDownIcon className="w-5 h-5 text-primary-500" />
                    <div>
                      <div className="font-medium">Generate PDF</div>
                      <div className="text-xs text-gray-400">Create PDF from slides</div>
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
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Slide Area */}
      <div className="pt-20 min-h-screen flex items-center justify-center relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div 
              id={`slide-content-${currentSlide}`}
              className="container mx-auto px-4 py-12 max-w-6xl"
            >
              <div className="mb-8 text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-3">
                  {slides[currentSlide].title}
                </h1>
                <p className="text-xl text-gray-400">{slides[currentSlide].subtitle}</p>
              </div>
              <div className="mt-8">
                {slides[currentSlide].content}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-gray-800/50 hover:bg-gray-700 rounded-full transition-colors backdrop-blur z-10"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-gray-800/50 hover:bg-gray-700 rounded-full transition-colors backdrop-blur z-10"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Progress Dots */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <div className="flex gap-2 bg-black/90 backdrop-blur-lg px-4 py-3 rounded-full border border-gray-800">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide 
                  ? 'bg-primary-500 w-8' 
                  : 'bg-gray-600 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Keyboard Navigation Hint */}
      <div className="fixed bottom-8 left-8 text-gray-600 text-sm">
        Use ← → or click arrows to navigate
      </div>
    </div>
  );
}

// Helper Components
function ProblemBox({ number, title, description, impact }: { number: string; title: string; description: string; impact: string }) {
  return (
    <div className="p-6 bg-gray-800/50 rounded-lg border-l-4 border-red-500/50">
      <div className="flex items-start gap-3 mb-2">
        <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-red-400">
          {number}
        </div>
        <div>
          <h4 className="font-bold text-white mb-2">{title}</h4>
          <p className="text-gray-300 text-sm mb-2">{description}</p>
          <p className="text-red-400 text-sm font-semibold">→ {impact}</p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-gray-800/50 rounded-lg">
      <p className="text-3xl font-bold text-primary-500 mb-1">{value}</p>
      <p className="text-gray-400 text-sm">{label}</p>
    </div>
  );
}

function UtilityItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex gap-3 items-start p-3 bg-gray-800/30 rounded-lg">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className="font-semibold text-white mb-1">{title}</p>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  );
}

function MarketStat({ value, label, change }: { value: string; label: string; change: string }) {
  return (
    <div className="p-6 bg-gray-800/50 rounded-lg text-center">
      <p className="text-4xl font-bold gradient-text mb-2">{value}</p>
      <p className="text-gray-300 mb-2">{label}</p>
      <p className="text-green-400 text-sm font-semibold">{change}</p>
    </div>
  );
}

function AllocationRow({ label, percentage, color }: { label: string; percentage: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-white text-sm">{label}</span>
        <span className="text-gray-400 text-sm">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function StakingRow({ period, apr, multiplier, highlight }: { period: string; apr: string; multiplier: string; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-gray-800/30'}`}>
      <div className="flex justify-between items-center">
        <span className="text-white font-semibold">{period}</span>
        <div className="text-right">
          <p className="text-primary-400 font-bold">{apr}</p>
          <p className="text-gray-400 text-xs">{multiplier} voting</p>
        </div>
      </div>
    </div>
  );
}

function KeyFeature({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="p-6 bg-gray-800/50 rounded-lg text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h4 className="font-bold text-white mb-2">{title}</h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function RevenueStream({ title, current, projected, description, benchmark }: { title: string; current: string; projected: string; description: string; benchmark?: string }) {
  return (
    <div className="p-6 bg-gray-800/50 rounded-lg">
      <h4 className="font-bold text-white mb-3">{title}</h4>
      <div className="flex justify-between mb-2">
        <span className="text-gray-400">Current:</span>
        <span className="text-white font-semibold">{current}</span>
      </div>
      <div className="flex justify-between mb-3">
        <span className="text-gray-400">Year 1:</span>
        <span className="text-primary-400 font-semibold">{projected}</span>
      </div>
      <p className="text-gray-400 text-sm mb-2">{description}</p>
      {benchmark && (
        <p className="text-xs text-gray-500 italic border-t border-gray-700 pt-2 mt-2">
          📊 Benchmark: {benchmark}
        </p>
      )}
    </div>
  );
}

function RoadmapQuarter({ quarter, status, items }: { quarter: string; status: string; items: { text: string; done: boolean }[] }) {
  const statusColors: Record<string, string> = {
    CURRENT: 'bg-green-500',
    NEXT: 'bg-primary-500',
    PLANNED: 'bg-gray-500'
  };

  return (
    <div className="p-6 bg-gray-800/50 rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className={`px-3 py-1 ${statusColors[status]} rounded-full text-xs font-bold`}>
          {status}
        </div>
        <h4 className="text-xl font-bold text-white">{quarter}</h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${item.done ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
              {item.done && <span className="text-white text-xs">✓</span>}
            </div>
            <span className={item.done ? 'text-gray-400 line-through' : 'text-gray-300'}>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ComparisonCard({ title, items }: { title: string; items: { text: string; bad: boolean }[] }) {
  return (
    <div className="p-6 bg-gray-800/50 rounded-lg">
      <h4 className="text-xl font-bold mb-4 text-center">{title}</h4>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={item.bad ? 'text-red-400' : 'text-green-400'}>
              {item.bad ? '✗' : '✓'}
            </span>
            <span className="text-gray-300">{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function EdgeCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 bg-gray-800/50 rounded-lg text-center">
      <h4 className="font-bold text-primary-400 mb-2">{title}</h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function FundRow({ label, amount, percentage }: { label: string; amount: string; percentage: number }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-white">{label}</span>
        <span className="text-gray-400">{amount}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

function TermRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between p-2 rounded ${highlight ? 'bg-primary-500/10' : ''}`}>
      <span className="text-gray-400">{label}:</span>
      <span className={highlight ? 'text-primary-400 font-bold' : 'text-white font-semibold'}>{value}</span>
    </div>
  );
}

function InvestorBenefit({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-6 bg-gray-800/50 rounded-lg text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h4 className="font-bold text-white mb-2">{title}</h4>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function HighlightBox({ number, title, points }: { number: string; title: string; points: string[] }) {
  return (
    <div className="p-6 bg-gray-800/50 rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center font-bold">
          {number}
        </div>
        <h4 className="text-xl font-bold text-white">{title}</h4>
      </div>
      <ul className="space-y-2">
        {points.map((point, i) => (
          <li key={i} className="text-gray-300 flex items-start gap-2">
            <span className="text-primary-400 mt-1">→</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NextStepCard({ step, title, description, action }: { step: string; title: string; description: string; action: string }) {
  return (
    <div className="p-6 bg-gray-800/50 rounded-lg text-center">
      <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
        {step}
      </div>
      <h4 className="font-bold text-white mb-2">{title}</h4>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      <button className="px-6 py-2 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors">
        {action}
      </button>
    </div>
  );
}

function LinkButton({ href, label, external }: { href: string; label: string; external?: boolean }) {
  if (external) {
    return (
      <a 
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
      >
        {label}
      </a>
    );
  }
  
  return (
    <Link 
      href={href}
      className="block p-3 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
    >
      {label}
    </Link>
  );
}
