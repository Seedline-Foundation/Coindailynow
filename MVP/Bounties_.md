Bounties:

**Dune Analytics Tracking (On-Chain Data)**  
Dune is for metrics you can pull directly from the blockchain (EVM chains, Solana, etc.) by querying transaction logs, smart contract events, and wallet balances.

| KPI Category | Dune Tracking KPI | Query Focus (What you'll track) |
| :---- | :---- | :---- |
| **Financial Health** | **Total Value Locked (TVL)** | Track the total $ value of tokens locked in the platform's staking/LP contracts. |
|  | **Protocol Revenue (Fees)** | Sum the token or stablecoin fees collected by the protocol's contracts from swaps, transactions, etc. |
|  | **Trading Volume** | Aggregate daily/weekly token swap volume against major pairs (e.g., TOKEN/ETH, TOKEN/USDC) on DEXs. |
| **Ecosystem Activity** | **Number of Active Users/Wallets** | Count unique wallet addresses that interact with the main protocol contracts (e.g., staking, swap, governance) daily/monthly. |
|  | **Token Velocity** | Calculate the ratio: Total Transferred Value / Market Cap (Requires off-chain price data, but transaction data is on-chain). |
|  | **Governance Participation Rate** | Count unique wallets that submit/vote on DAO proposals and the total *amount* of token staked for voting. |
| **Community Strength** | **LP (Liquidity Provider) Count** | Count unique wallets that have deposited tokens into the primary liquidity pools. |
|  | **Distribution (Gini/Nakamoto)** | Analyze the Gini Coefficient or the token distribution across top holders to measure decentralization. |

---

## **📈 Google Sheets Tracking (Off-Chain & Blended Data)**

Google Sheets is for data pulled from outside sources (APIs like CoinGecko/CoinMarketCap), manual team input, or data exported from Dune for further financial calculation.

| KPI Category | Google Sheets Tracking KPI | Data Source / Calculation Focus |
| :---- | :---- | :---- |
| **Financial Health** | **Token Price & Market Cap** | Use APIs (CoinGecko, etc.) or Google Finance function to track real-time price, market cap, and 24h % change. |
|  | **TGE Circulating Supply** | Manually input the planned circulating supply and track the **actual** monthly token unlocks based on the vesting schedule. |
|  | **Treasury Balance/Runway** | Manually track the non-token assets (stablecoins, fiat) in the Treasury to monitor the runway (the $10,000 monthly budget). |
| **Ecosystem Activity** | **Core Product Milestones** | Track progress using a simple **Status** column (e.g., "Planned," "In Progress," "Deployed") against the official roadmap. |
| **Community Strength** | **Social Sentiment & Reach** | Track follower growth on Twitter/Discord/Telegram and use external tools to log a weekly "Sentiment Score" (e.g., $1-5$). |
|  | **Community Contributor Growth** | Manually input the number of unique wallets/usernames rewarded with the **$15\\%$ OG bonus** from the DAO/Treasury each month. |
|  | **ROI / PnL Tracking** | Calculate returns for key cohort wallets (like OG presale wallets) by importing their transaction history and current price. |

By separating the data sources, you ensure the integrity of the on-chain metrics (Dune) while maintaining flexibility for financial and community data (Google Sheets).

\#\#\# Comprehensive Bounties Proposal for the Community

To further incentivize community participation and drive traction for the Coindaily platform and JY token, I propose an expanded bounty program. This builds on the existing ecosystem by allocating a total pool of 600,000 JY tokens (approximately 10% of total supply) from the Ecosystem category, distributed over 12 months post-launch. The program rewards contributions that enhance platform adoption, content quality, and token value, with a focus on original contributors (OGs) who demonstrate long-term commitment.

Bounties are structured into categories with clear tasks, token rewards, eligibility criteria (including staking rules to ensure alignment), and vesting schedules to prevent dumps. Submissions are verified via a DAO governance process (e.g., on Snapshot or Aragon), with on-chain tracking for transparency. Eligibility requires participants to stake a minimum amount in the Whale Prison or sinkhole, tying rewards to ecosystem health. Payouts are automated via smart contracts, with penalties (e.g., 20% burn) for early unstaking of rewarded tokens.

| Bounty Category | Description & Tasks | Token Rewards | Staking Rules for Eligibility | Vesting Schedule |
| ----- | ----- | ----- | ----- | ----- |
| **Content Creation (News & Educational Material)** | Produce high-quality articles, videos, research on crypto and blockchain or infographics on African crypto news, blockchain tutorials, or Coindaily features. Submit via DAO with metrics \- views \>1,000, shares \>200).  | 1000 JY per submission that meet metrics.Accepted \*\*\*Research on crypto and blockchain submission is 5k JY (top 20/month receive 10,000 JY bonus). Total pool: 100,000 JY. | Stake at least 15,000 JY for 4 months minimum in Whale Prison (90% APY eligible). 1.5x multiplier for sinkhole stakers. Non-stakers ineligible. | 0% upfront; 4-month cliff \+ 12-month linear. Full vest accelerates by 25% if content achieves 5,000+ engagements. |
| **Meme & Viral Marketing** | Create and distribute memes, short-form videos, or social campaigns promoting JY or Coindaily. Track via X impressions or viral score \- \>10,000 views). Emphasize scarcity narratives and platform utility. | 1500 JY per entry (monthly winners get 5,000 JY). Total pool: 50,000 JY. | Stake 10,000 JY for 3 months in Whale Prison. 2x rewards for OGs with proven prior traction (DAO-verified). | 10% upfront if staked; 3-month cliff \+ 9-month linear. Unvested portion burns if no follow-up activity. |
| **Shilling & Community AMAs** | Host or participate in AMAs, tweet threads, or referral drives to onboard users (\>500 referrals). Use on-chain referral codes for tracking. Target crypto communities and beyond. | 3000 JY per event ( 8,000 JY for AMA with 2,000 attendees). Total pool: 100,000 JY. Bonuses: 7,000 JY for top referrers. | OG presale holders priority first 6 months; stake10,000 JY for 5 months. 2.5x APY boost in Whale Prison for high-impact shillers. | 15% at approval (staked only); 6-month cliff \+ 15-month linear. Tied to sustained traction (e.g., 20% clawback if referrals inactive). |
| **Liquidity Farming & Pair Contributions** | Provide liquidity to secondary pairs (JY/ETH, JY/BNB, JY/POL, JY/USDT) with minimum 2-year locks. Submit proof via on-chain transactions. | 5,000 JY per qualifying farm (10,000 JY for \>$10,000 TVL added). Total pool: 100,000 JY. | Stake 20,000 JY for 6 months in sinkhole or Whale Prison. 2.5x multiplier for permanent locks. | 0% upfront; 6-month cliff \+ 18-month linear. Accelerates by 50% if TVL milestone (e.g., $1 million) hit. |
| **Bug Hunts & Technical Improvements** | Report vulnerabilities in Coindaily MVP, suggest code enhancements, or contribute SDK integrations/PRs on GitHub. Prioritize features like AI data tools, crypto tools, bots., news tools or news distribution. | 1,500 JY per valid contribution (8,000 JY for critical bug fix). Total pool: 50,000 JY. | Stake 5,000 JY for 4 months. Tech-focused OGs get 2x rewards if in top 40 stakers. | 20% upfront for critical issues; 9-month cliff \+ 12-month linear. Full vest upon implementation verification. |
| **Partnership & Ecosystem Building** | Secure \*\*affiliations with top and medium traffic crypto/AI/Blockchain/Finance sites or real lists not bots (1000 sites with real verified contacts). Track growth metrics. | 3,000 JY per milestone ( 2,000 JY for 1,000/site). Total pool: 20,000 JY. | Stake 5,000 JY for 6 months in LP farming pools. Priority for OGs with referral history. | 0% upfront; 5-month cliff \+ 18-month linear. DAO extensions if growth doubles quarterly. |

Affiliation means website platforms willing to  onboard on our network. Remember, it is free to join. No monthly fee for ever. We make money only when they make money.our fee will 3.7%-7% of whatever fee charge

\*\*\*Crypto and block chain research must contact admin for research topic and scope

\*\*Program Rules\*\*:  
\- \*\*Total Pool Management\*\*: 600,000 JY, capped at 50,000 JY/month to align with supply limits. Unused portions roll over or burn.  
\- \*\*Verification & Distribution\*\*: DAO votes on approvals (minimum 100 votes required); automated payouts via multisig.  
\- \*\*Staking Integration\*\*: All participants must meet category-specific staking thresholds to qualify, promoting long-term holding.  
\- \*\*Penalties\*\*: 20–30% burn on rewarded tokens if unstaked early or if contributions are deemed low-quality post-review.  
\- \*\*Monitoring\*\*: Track overall impact via KPIs like user growth (+20% monthly) and token price stability (\<15% volatility).

This program fosters a vibrant community while ensuring rewards align with ecosystem growth and dump protection.

