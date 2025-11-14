## **The Joy Token (JY) Handbook: A Real Yield & Deflationary Asset**

### **Section 1: Creation, Vision, and Core Philosophy**

## 

| Parameter | Detail |
| :---- | :---- |
| **Token Name** | **Joy Token** |
| **Ticker** | **JY** |
| **Token Standard** | **ERC-20 (or equivalent on a chosen base-layer)** |
| **Protocol Utility** | **The utility and governance token for the core Protocol Ecosystem. Required for premium features, governance voting, and access to select services.** |
| **Core Philosophy** | **Scarcity-Driven & Real Yield Focused. The model prioritizes long-term value accrual through extreme supply constraint (scarcity) and sustainable yield generation (real yield) funded by protocol revenue, not inflation.** |

### **Section 2: Tokenomics: The Scarcity Model**

## **The Joy Token is designed as a highly deflationary asset with an immutable, low maximum supply and a strategy of heavy lock-ups to align the interests of all stakeholders with the long-term success of the protocol.**

#### **2.1 Max Supply and Distribution**

## **The maximum total supply of Joy Token ($JY) is strictly capped at 5,000,000 JY. No further tokens can ever be minted.**

## 

| Allocation Pool | Allocation (JY) | Percentage of Total Supply | Vesting / Lock-up Strategy |
| :---- | :---- | :---- | :---- |
| **Ecosystem & Staking Rewards** | **1,800,000** | **36.0%** | **Dedicated pool for Staking rewards (Real Yield). Gradually unlocked over 5+ years. Airdrops and rewards** |
| **Core Team & Advisors** | **700,000** | **14.0%** | **4-Year Vesting: 1-year cliff, followed by linear monthly release over the remaining 3 years.** |
| **Strategic Reserve (Treasury)** | **1,000,000** | **20.0%** | **10 years Vesting: 2-years cliff, and followed by quarterly unlocked controlled by DAO/Governance, unlocked gradually based on protocol milestones.** |
| **Seed & Strategic Investors** | **500,000** | **10.0%** | **2-Year Vesting: 6-12 month cliff, followed by linear monthly release.** |
| **Public Sale / Initial Liquidity** | **800,000** | **16.0%** | **Used for initial liquidity bootstrapping and public distribution. Unlocked at launch.** |
| **LIQUIDITY** | **200,000** | **4.0%** | **To be locked for liquidity for ever** |
| **TOTAL** | **5,000,000 JY** | **100.0%** | **Heavy Lock-up Strategy to limit initial circulating supply.** |

## 

## **Use Of Fund:** **1\. Liquidity Locking \= 200,000 USDC** **2\. Legal \= 50,000 USDC** **3\. MVP Development \= 50,000 USDC** **4\. Marketing \= 50,000 USDC**          **Total \= 350,000 USDC**

## 

## 

## **Technical Staking Contract Blueprint**

### **1\. Core Contract Architecture (Solidity)**

The entire staking system would likely be implemented across a few main smart contracts, following the **ERC-20** standard for the $JY token.

| Contract | Primary Role | Key Requirements to Implement |
| :---- | :---- | :---- |
| **JoyToken.sol** | The main ERC-20 token. | Must be *Ownable* (for initial setup) and have a transferFrom function for the staking contract to move tokens. |
| **StakingVault.sol** | Handles all community staking, rewards, and tiered lock-ups. | Stores user stakes, tracks lock-up periods, and calculates real yield. |
| **InstitutionalVesting.sol** | Handles the project owner's 1M $JY stake. | **This is the most specialized contract** and requires the unique 10-year cliff and auto-restake logic. |
| **RewardDistributor.sol** | Manages the "Real Yield" distribution. | Collects protocol revenue (e.g., $ETH, $USDC) and distributes it as rewards to stakers in the StakingVault. |

This staking contract is a complex blend of standard tiered staking, institutional lock-up, and a unique, automated restaking/penalty mechanism. Building it requires careful smart contract architecture, likely in **Solidity** on a platform like Ethereum, Arbitrum, or Polygon.

Here is a high-level plan for how to build this contract, focusing on the specialized requirements we've defined:

---

## **Technical Staking Contract Blueprint**

### **1\. Core Contract Architecture (Solidity)**

The entire staking system would likely be implemented across a few main smart contracts, following the **ERC-20** standard for the $JY token.

| Contract | Primary Role | Key Requirements to Implement |
| :---- | :---- | :---- |
| **JoyToken.sol** | The main ERC-20 token. | Must be *Ownable* (for initial setup) and have a transferFrom function for the staking contract to move tokens. |
| **StakingVault.sol** | Handles all community staking, rewards, and tiered lock-ups. | Stores user stakes, tracks lock-up periods, and calculates real yield. |
| **InstitutionalVesting.sol** | Handles the project owner's 2.5M $JY stake. | **This is the most specialized contract** and requires the unique 10-year cliff and auto-restake logic. |
| **RewardDistributor.sol** | Manages the "Real Yield" distribution. | Collects protocol revenue (e.g., $ETH, $USDC) and distributes it as rewards to stakers in the StakingVault. |

### 

### 

### 

### **2\. Implementing Community Staking (Tiered System)**

The StakingVault.sol would need the following data structures and functions:

#### **Data Structure for Tiers:**

$$\\text{mapping}(\\text{uint256} \\Rightarrow \\text{struct StakingTier})$$

* **StakingTier Struct:**  
  * lockupDuration: Time in seconds (e.g., 6 months, 12 months, 24 months).  
  * rewardMultiplier: A factor used to calculate the APR (e.g., $1.5\\text{x}, 2\\text{x}, 3\\text{x}$).  
  * isAllowed: Boolean to toggle the tier on/off.

#### **User Stake Data:**

$$\\text{mapping}(\\text{address} \\Rightarrow \\text{struct UserStake})$$

* **UserStake Struct:**  
  * stakedAmount: Total $JY staked.  
  * lockupEnd: Timestamp when the chosen cliff (6/12/24 months) expires.  
  * tierID: The tier chosen (to determine the reward multiplier).  
  * unstakeRequestTime: Timestamp when the cool-down period begins.

| Function | Logic Required |
| :---- | :---- |
| stake(uint256 amount, uint256 tierID) | **1\. Transfer:** Use transferFrom to pull $JY from the user's wallet. **2\. Set Cliff:** Set lockupEnd \= block.timestamp \+ lockupDuration\[tierID\]. |
| claimRewards() | **Real-Yield Calculation:** Calculate accrued rewards based on stakedAmount, rewardMultiplier, and the time elapsed since the last claim. Distribute the rewards (in $JY and other tokens). |
| requestUnstake() | **Cliff Check:** **require(block.timestamp \> lockupEnd, "Cliff not expired");** If successful, set unstakeRequestTime \= block.timestamp. |
| unstake() | **Cool-Down Check:** **require(block.timestamp \> unstakeRequestTime \+ 7 days, "Cool-down active");** If successful, transfer the tokens back to the user. |

This staking contract is a complex blend of standard tiered staking, institutional lock-up, and a unique, automated restaking/penalty mechanism. Building it requires careful smart contract architecture, likely in **Solidity** on a platform like Ethereum, Arbitrum, or Polygon.

Here is a high-level plan for how to build this contract, focusing on the specialized requirements we've defined:

---

## **Technical Staking Contract Blueprint**

### **1\. Core Contract Architecture (Solidity)**

The entire staking system would likely be implemented across a few main smart contracts, following the **ERC-20** standard for the $JY token.

| Contract | Primary Role | Key Requirements to Implement |
| :---- | :---- | :---- |
| **JoyToken.sol** | The main ERC-20 token. | Must be *Ownable* (for initial setup) and have a transferFrom function for the staking contract to move tokens. |
| **StakingVault.sol** | Handles all community staking, rewards, and tiered lock-ups. | Stores user stakes, tracks lock-up periods, and calculates real yield. |
| **InstitutionalVesting.sol** | Handles the project owner's 2.5M $JY stake. | **This is the most specialized contract** and requires the unique 10-year cliff and auto-restake logic. |
| **RewardDistributor.sol** | Manages the "Real Yield" distribution. | Collects protocol revenue (e.g., $ETH, $USDC) and distributes it as rewards to stakers in the StakingVault. |

### **2\. Implementing Community Staking (Tiered System)**

The StakingVault.sol would need the following data structures and functions:

#### **Data Structure for Tiers:**

$$\\text{mapping}(\\text{uint256} \\Rightarrow \\text{struct StakingTier})$$

* **StakingTier Struct:**  
  * lockupDuration: Time in seconds (e.g., 6 months, 12 months, 24 months).  
  * rewardMultiplier: A factor used to calculate the APR (e.g., $1.5\\text{x}, 2\\text{x}, 3\\text{x}$).  
  * isAllowed: Boolean to toggle the tier on/off.

#### **User Stake Data:**

$$\\text{mapping}(\\text{address} \\Rightarrow \\text{struct UserStake})$$

* **UserStake Struct:**  
  * stakedAmount: Total $JY staked.  
  * lockupEnd: Timestamp when the chosen cliff (6/12/24 months) expires.  
  * tierID: The tier chosen (to determine the reward multiplier).  
  * unstakeRequestTime: Timestamp when the cool-down period begins.

#### **Key Functions:**

| Function | Logic Required |
| :---- | :---- |
| stake(uint256 amount, uint256 tierID) | **1\. Transfer:** Use transferFrom to pull $JY from the user's wallet. **2\. Set Cliff:** Set lockupEnd \= block.timestamp \+ lockupDuration\[tierID\]. |
| claimRewards() | **Real-Yield Calculation:** Calculate accrued rewards based on stakedAmount, rewardMultiplier, and the time elapsed since the last claim. Distribute the rewards (in $JY and other tokens). |
| requestUnstake() | **Cliff Check:** **require(block.timestamp \> lockupEnd, "Cliff not expired");** If successful, set unstakeRequestTime \= block.timestamp. |
| unstake() | **Cool-Down Check:** **require(block.timestamp \> unstakeRequestTime \+ 7 days, "Cool-down active");** If successful, transfer the tokens back to the user. |

### 

### 

### **3\. Implementing the Project Owner Institutional Stake**

The InstitutionalVesting.sol contract would handle the 2.5 million $JY specifically.

#### **Data Structure & Variables:**

* TotalLockupAmount: 2,500,000 $JY  
* LockupDuration: 10 years (fixed)  
* QuarterlyUnlockAmount: 62,500 $JY  
* NextUnlockTime: Timestamp of the next quarterly unlock.  
* LastClaimTime: Timestamp of the last successful claim.

| Function | Logic Required |
| :---- | :---- |
| constructor() | **Deployment:** Transfer the entire 1,000,000 $JY to this contract and set the initial NextUnlockTime to 3 months from deployment. |
| claimUnlock() | **1\. Unlock Check:** require(block.timestamp \> NextUnlockTime, "Not yet unlocked");. **2\. Transfer:** Transfer QuarterlyUnlockAmount to the designated project owner address. **3\. Advance Time:** Set NextUnlockTime \= NextUnlockTime \+ 3 months. |
| **Automated Restake (The Critical Part)** | This requires a mechanism that is **triggered externally** (e.g., a **Chainlink Keeper** or a simple bot run by the DAO/team). **Keeper Function (autoRestakePenalty()):** |

\* Check if \*\*24 hours\*\* have passed since the unlock and if the \`claimUnlock()\` function has \*\*not\*\* been called for that specific tranche. \* If the condition is met, call an internal function to \*\*automatically reset the 10-year lock\*\* on the unclaimed 62,500 $JY, \*\*updating the internal records\*\* to reflect the new lock-up time. |

| Parameter | Detail |
| :---- | :---- |
| **Reward Structure** | **Real Yield Model:** Rewards are paid in both $JY (from staking pool) and in non-native assets (e.g., $USDC or $ETH) derived directly from protocol revenue (fees). |
| **Reward Compounding** | Rewards are automatically compounded (re-staked) into your chosen staking pool to maximize returns. |
| **Cliff / Vesting** | The chosen lock-up period (6, 12, or 24 months) acts as a **strict cliff**. Tokens are fully vested/liquid at the moment the cliff expires. |
| **Penalties (Early Unstaking)** | **No Early Unstaking Allowed.** To maintain scarcity and long-term alignment, the smart contract will **prevent any withdrawal** until the chosen lock-up period has fully expired. There is no partial unstaking option. |
| **Unstaking Schedule (Cool-Down)** | After the lock-up period expires, a standard **7-day unstaking cool-down period** is enforced. This is a security measure to prevent rapid market exits and give other stakers time to react to large withdrawals. |
| **Penalties (General)** | Penalties for malicious governance behavior or slashing for validator node operation (if implemented) will result in a percentage of staked $JY being burned, further enhancing the deflationary nature. |

### **4\. Security & Audit Considerations**

Given the heavy financial commitment and unique penalty/restaking logic, security is paramount:

1. **Audits:** The contracts must be rigorously audited by multiple reputable third-party firms.  
2. **Open Source:** Publish the verified Solidity code on Etherscan (or the chosen chain's explorer) for community transparency.  
3. **Owner Privileges:** Restrict critical functions (like changing the base APR, adding new tiers, or distributing Real Yield) to a **Multi-Signature (Multi-Sig) Wallet** for governance and security.  
4. **Reentrancy Guard:** Use the OpenZeppelin `ReentrancyGuard` utility on all withdrawal and transfer functions.  
5. **Time Management:** Ensure all lock-up and restake timings use `block.timestamp` and are thoroughly tested to handle different timeframes correctly.

### **II. Community Staking Pools (Real Yield)**

The community pools incentivize long-term participation and governance through a tiered lock-up system, with rewards funded by protocol revenue.

| Staking Period (Cliff) | Reward Percentage (APR) | Primary Funding Source | Governance Weight Multiplier |
| :---- | :---- | :---- | :---- |
| **Flexible (7 days notice)** | **2% APR** | Protocol Revenue / Buyback & Burn | 1x |
| **6 Months Lock-up** | **8% APR** | Ecosystem & Staking Pool (initial) | 1.5x |
| **12 Months Lock-up** | **30% APR** | Ecosystem & Staking Pool (initial) | 2x |
| **24 Months Lock-up** | **70% APR** | Ecosystem & Staking Pool (initial) | 3x |
| **TOTAL** | **110% APR** |  |  |

### **. Project Owner Institutional Stake (Hard-Coded Commitment)**

This foundational stake is designed to lock up a significant portion of $JY for a decade, providing a massive signal of confidence and long-term liquidity support for the protocol. This lock up token will act as a reserve, community reward, Development activities all in Future

| Parameter | Detail |
| :---- | :---- |
| **Stake Amount** | **1,000,000 $JY** (20% of Total Max Supply) |
| **Initial Lock-up / Cliff** | **10 Years** (Irrevocable initial lock). |
| **Reward Earning** | Earns the standard **Long-Term Sustainable APR** (4-7% Real Yield) to ensure alignment with protocol health. |
| **Yearly Unlocking (Vesting)** | **125,000 $JY** (1/10th of the stake) is unlocked per year. |
| **Unstaking Schedule** | Unlocking starts after 24 months. The yearly unlock is made available in **4 quarterly tranches** of **31,250 $JY** each. |
| **Unclaimed Token Penalty / Recurrence** | **Mandatory Restake for 10 Years:** Any unlocked $JY (31,250$JY per tranche) that is **unclaimed (not withdrawn) within 24 hours** of the unlock event will be automatically restaked for a **new, irreversible 10-year lock-up period.** |

**JOY TOKEN TRACTION:**

Getting a token to achieve **traction and huge speculation** post-sale requires a multi-faceted strategy that focuses on **real utility, scarcity mechanisms, and continuous community engagement.** Since dilution is excluded, the focus shifts to creating sustainable demand and buzz.

Here are the key strategies, broken down into three main categories:

---

## **🚀 I. Enhancing Utility and Adoption1**

The most sustainable source of long-term value and speculation is the token's **fundamental utility**.

* **Implement a Core Use Case:** The token must be **essential** for interacting with the project's ecosystem.  
  * **Access & Fees:** Use the token to pay for platform services, transaction fees, or premium features.  
  * **Staking/Yield:** Offer attractive staking rewards where users lock up their tokens to secure the network or earn a yield, directly reducing circulating supply.2  
  * **Governance:** Grant token holders voting rights on important project decisions, making the token a form of digital "share."  
* **Establish Partnerships & Integrations:** Integrate the token into other established platforms or real-world use cases.3  
  * **DeFi Integrations:** List the token on lending/borrowing protocols or use it as collateral on other DeFi applications.  
  * **Major Exchange Listings:** Listing on reputable, high-volume exchanges significantly increases accessibility and trading volume.  
* **Continuous Development:** Consistently ship new features, expand the product roadmap, and demonstrate that the team is executing on its promises. A growing ecosystem naturally attracts new users and investors.

---

## **🔥 II. Creating Scarcity and Deflationary Pressure4**

Reducing the circulating supply post-sale creates scarcity, which is a powerful driver of speculation, without relying on dilution.5

* **Token Burning Mechanisms:** Implement a mechanism to permanently remove tokens from the circulating supply.6  
  * **Fee Burns:** Automatically burn a percentage of the transaction fees or platform revenue generated.7 For example, a DEX could burn 50% of its trading fees.  
  * **Buyback and Burn:** Use a portion of the project's treasury or revenue to purchase tokens from the open market (creating buy pressure) and then immediately burn them (reducing supply).  
* **Vesting and Lock-ups:** For team, advisors, and early investors, ensure long, transparent **vesting schedules** to prevent a massive dump immediately after the public sale. This manages the release of new tokens into the market over time.  
* **Collateral and Bonding:** Require the token to be locked or bonded for a specific period to gain access to certain services, like running a node, securing an insurance pool, or participating in a launchpad.

---

## **🗣️ III. Marketing, Community, and Narrative**

High-quality execution must be paired with consistent buzz and community building to drive speculation.

* **Targeted Airdrops and Giveaways:** Instead of indiscriminate airdrops, target specific, valuable community members (e.g., holders of related NFTs, active participants in a partner's community) to acquire high-quality, long-term holders.  
* **Influencer and Media Outreach:** Engage crypto thought leaders, reputable news outlets, and well-known industry personalities to generate discussion and positive press.8 **Authenticity is key**; paid promotions should be transparent and secondary to genuine excitement about the project.  
* **Create a Strong Narrative:** Develop a compelling story that clearly explains **why** the project matters and how it will disrupt an existing market. This narrative drives the speculation and FOMO (Fear Of Missing Out).  
  * *Example:* Positioning the token as a "Layer-2 scaling solution for X," a "GameFi powerhouse," or the "decentralized future of Y."  
* **Community Incentives:** Move beyond basic Telegram/Discord chat. Reward active contributors, content creators, and bug reporters with token incentives to foster a vibrant, engaged community that acts as the project's biggest advocate.9

Track the **volume of $JY$ transacted** ($\\text{100 kJY}$), calculate a dollar value from that ($\\text{50\\$}$), and then use that dollar value ($\\text{25\\$}$ after the $50\\%$ split) to execute a **Buy-and-Burn** on the market.

| Action | Party | Token Flow | Market Impact |
| :---- | :---- | :---- | :---- |
| **1\. Protocol collects fee.** | Users | Users pay $\\text{50\\$}$ in fees (e.g., in $\\text{USDC}$ or $\\text{ETH}$). | **None.** |
| **2\. Buyback is executed.** | Proxy Contract | $\\text{25\\$}$ (the $50\\%$ you dedicated) is used to **buy $JY$ from the open market** (e.g., from the $\\text{USDC/JY}$ pool). | **Major: Creates Buy Pressure.** |
| **3\. Burn is executed.** | Proxy Contract | The $JY$ tokens just purchased are sent to a burn address. | **Major: Creates Scarcity.** |
| **4\. Project is funded.** | Project Treasury | The remaining $\\text{25\\$}$ is sent to the project's treasury. | **None.** |

| Feature | Buy-and-Burn (Standard) | Value-Based Burn (Your Proposal) |
| :---- | :---- | :---- |
| **Token Source for Burn** | Tokens purchased **from the market** with protocol revenue. | Tokens taken **from the project's treasury** (or newly minted/fee tokens). |
| **Market Impact** | **High.** Creates demand (buy pressure) AND scarcity (supply reduction). | **Low.** Only creates scarcity. No impact on the buying side of the order book. |
| **Project Funding** | Protocol revenue ($25) is spent on the buyback; the project only keeps the *other* 50% ($25). | Protocol revenue ($25) is kept by the project; the cost of the burn is a draw on the $JY **token supply** (or treasury). |

The **automatic buy and burn** mechanism is the key component that transforms the protocol's revenue (the "Real Yield" source) into scarcity for the native token ($JY).

It operates **outside** of the main staking contract but is fundamentally linked to the **Reward Distributor** contract.

Here is where the mechanism fits into the overall architecture:

### **1\. The Revenue Collection Layer (Source)**

The process starts with the protocol's earnings, which are typically collected in non-native assets (e.g., $ETH, $USDC, or transaction fees).

* **Contract:** `RevenueDistributor.sol` (or a similar treasury contract).  
* **Action:** This contract accumulates the protocol's revenue.

### **2\. The Automatic Buy-Back Mechanism (The "Buy")**

This is an essential intermediary step that requires interacting with a **Decentralized Exchange (DEX)**. Since the revenue is in other tokens, it must be converted into the native token ($JY) before it can be burned.

* **Contract/Function:** A dedicated function within the `RevenueDistributor.sol` or a separate `BuybackManager.sol` contract.  
* **Mechanism:** This function executes a trade on a DEX (like Uniswap or a similar Automated Market Maker).  
  * It takes the collected non-native tokens (e.g., $USDC).  
  * It swaps them for the native staking token ($JY).  
* **Automation:** This function must be called on a schedule (e.g., daily, weekly). This is typically automated by a reliable external service like:  
  * **Chainlink Keepers:** A decentralized, on-chain service that triggers the function when conditions are met.  
  * **A DAO-controlled Bot/Relayer:** A script run by the core team or DAO that calls the function periodically.

### **3\. The Burn Mechanism (The "Burn")**

Once the native tokens ($JY) have been acquired from the market in the buy-back step, they are immediately destroyed.

* **Contract/Function:** This happens either in the `BuybackManager.sol` or directly within the **`JoyToken.sol`**'s ERC-20 contract (if it has a built-in `burn` function).  
* **Action:** The purchased $JY tokens are sent to a **"Burn Address"** (a known, non-recoverable address like `address(0x00...00)`) or a specific `burn(amount)` function on the token contract is called.

### **Summary of Flow and Contract Location**

| Step | Location (Contract) | Asset | Purpose |
| :---- | :---- | :---- | :---- |
| **1\. Collect Revenue** | RevenueDistributor.sol | $USDC / $ETH | Protocol collects fees/revenue. |
| **2\. Buy-Back (The "Buy")** | BuybackManager.sol *(Triggered by Keeper)* | $USDC $\\rightarrow$ $JY$ | Sells collected revenue on a DEX to purchase $JY$ from the open market. |
| **3\. Token Burn (The "Burn")** | JoyToken.sol / BuybackManager.sol | $JY$ | Permanently removes the newly-bought $JY$ from the total supply, creating **deflation**. |
| **4\. Distribute Yield** | RewardDistributor.sol | $JY$ \+ Remaining Revenue | The remaining protocol revenue (if any) and/or a portion of the *newly-bought $JY$* is sent to the **StakingVault** to pay out stakers. |

| Parameter | Detail |
| :---- | :---- |
| **Reward Structure** | **Real Yield Model:** Rewards are paid in both $JY (from staking pool) and in non-native assets (e.g., $USDC or $ETH) derived directly from protocol revenue (fees). |
| **Reward Compounding** | Rewards are automatically compounded (re-staked) into your chosen staking pool to maximize returns. |
| **Cliff / Vesting** | The chosen lock-up period (6, 12, or 24 months) acts as a **strict cliff**. Tokens are fully vested/liquid at the moment the cliff expires. |
| **Penalties (Early Unstaking)** | **No Early Unstaking Allowed.** To maintain scarcity and long-term alignment, the smart contract will **prevent any withdrawal** until the chosen lock-up period has fully expired. There is no partial unstaking option. |
| **Unstaking Schedule (Cool-Down)** | After the lock-up period expires, a standard **7-day unstaking cool-down period** is enforced. This is a security measure to prevent rapid market exits and give other stakers time to react to large withdrawals. |
| **Penalties (General)** | Penalties for malicious governance behavior or slashing for validator node operation (if implemented) will result in a percentage of staked $JY being burned, further enhancing the deflationary nature. |

