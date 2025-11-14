'use client';

import Hero from '@/components/Hero';
import Tokenomics from '@/components/Tokenomics';
import WhyJoyToken from '@/components/WhyJoyToken';
import StakingStrategy from '@/components/StakingStrategy';
import Roadmap from '@/components/Roadmap';
import HowToBuy from '@/components/HowToBuy';
import EmailCapture from '@/components/EmailCapture';
import Stats from '@/components/Stats';
import MarketOpportunity from '@/components/MarketOpportunity';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <MarketOpportunity />
      <WhyJoyToken />
      <div id="tokenomics">
        <Tokenomics />
      </div>
      <div id="staking">
        <StakingStrategy />
      </div>
      <Roadmap />
      <HowToBuy />
      <EmailCapture />
    </>
  );
}
