// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title JoyToken (JY)
 * @dev Scarcity-Driven & Real Yield Focused Token for CoinDaily Platform
 * 
 * KEY SPECIFICATIONS:
 * - Total Supply: 5,000,000 JY (FIXED - No inflation, extreme scarcity)
 * - Network: Polygon (low transaction fees)
 * - Staking APR: 30% (funded by protocol revenue, not inflation)
 * - Conversion: 100 CE Points = 1 JY
 * - Utility: Subscriptions, Premium Content, Governance, Marketplace
 * 
 * TOKENOMICS MODEL:
 * - Scarcity: Ultra-low supply creates natural value appreciation
 * - Real Yield: 30% APR paid from actual protocol revenue (not token inflation)
 * - Deflationary: Burn mechanism reduces supply over time
 * - Revenue Sources: Subscriptions, ads, marketplace fees, premium content
 * - Sustainable: Yield funded by real business cash flow
 * 
 * DISTRIBUTION:
 * - Community Rewards: 40% (2,000,000 JY)
 * - Staking Pool: 25% (1,250,000 JY)
 * - Team & Advisors: 15% (750,000 JY - 2 year vesting)
 * - Treasury: 15% (750,000 JY - protocol operations)
 * - Initial Liquidity: 5% (250,000 JY)
 */
contract JoyToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ReentrancyGuard {
    
    // ========== CONSTANTS ==========
    
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant REVENUE_MANAGER_ROLE = keccak256("REVENUE_MANAGER_ROLE");
    bytes32 public constant STAKING_MANAGER_ROLE = keccak256("STAKING_MANAGER_ROLE");
    
    // Supply constraints (FIXED - No minting after deployment)
    uint256 public constant TOTAL_SUPPLY = 5_000_000 * 10**18;        // 5 Million JY
    uint256 public constant MAX_SUPPLY = 5_000_000 * 10**18;          // Hard cap - NEVER increase
    
    // Staking parameters
    uint256 public constant BASE_APR = 30;                             // 30% APR base rate
    uint256 public constant APR_DENOMINATOR = 100;
    uint256 public constant SECONDS_PER_YEAR = 365 days;
    uint256 public constant MIN_STAKE_AMOUNT = 10 * 10**18;           // Minimum 10 JY
    uint256 public constant UNSTAKE_COOLDOWN = 7 days;                // 7 day unstaking period
    
    // CE Points conversion
    uint256 public constant CE_TO_JY_RATE = 100;                      // 100 CE Points = 1 JY
    
    // Anti-whale protection (can be disabled for exchanges)
    uint256 public maxTransactionAmount = 50_000 * 10**18;            // 1% of supply per tx
    uint256 public maxWalletBalance = 100_000 * 10**18;               // 2% of supply per wallet
    
    // ========== STATE VARIABLES ==========
    
    // Protocol wallets
    address public treasuryWallet;
    address public revenueWallet;        // Collects protocol revenue for staking rewards
    address public cePointsContract;     // Contract that manages CE Points conversion
    
    // Revenue tracking for real yield
    uint256 public totalRevenueDeposited;
    uint256 public totalYieldDistributed;
    uint256 public availableYieldPool;   // Revenue available for staking rewards
    
    // Staking data structures
    struct StakeInfo {
        uint256 amount;              // Amount staked
        uint256 startTime;           // When stake started
        uint256 lastClaimTime;       // Last reward claim
        uint256 accruedRewards;      // Unclaimed rewards
        uint256 unstakeRequestTime;  // When unstake was requested (0 if not requested)
    }
    
    mapping(address => StakeInfo) public stakes;
    uint256 public totalStaked;
    uint256 public totalStakers;
    
    // Vesting for team (prevents dump)
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 claimedAmount;
        uint256 startTime;
        uint256 vestingDuration;
        bool revoked;
    }
    mapping(address => VestingSchedule) public vestingSchedules;
    
    // Access control
    mapping(address => bool) public isExemptFromLimits;
    mapping(address => bool) public isBlacklisted;
    
    // Statistics
    uint256 public totalBurned;
    uint256 public totalCEPointsConverted;
    
    // Feature flags
    bool public tradingEnabled;
    bool public stakingEnabled;
    bool public ceConversionEnabled;
    
    // ========== EVENTS ==========
    
    event TradingEnabled(uint256 timestamp);
    event StakingEnabled(uint256 timestamp);
    event CEConversionEnabled(uint256 timestamp);
    
    // Staking events
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event UnstakeRequested(address indexed user, uint256 amount, uint256 unlockTime);
    event Unstaked(address indexed user, uint256 amount, uint256 rewards);
    event RewardsClaimed(address indexed user, uint256 amount);
    
    // Revenue events (Real Yield Model)
    event RevenueDeposited(address indexed from, uint256 amount, string source);
    event YieldDistributed(uint256 amount, uint256 totalStakers);
    event YieldPoolReplenished(uint256 amount);
    
    // CE Points conversion
    event CEPointsConverted(address indexed user, uint256 cePoints, uint256 jyAmount);
    
    // Governance
    event TreasuryUpdated(address indexed newTreasury);
    event RevenueWalletUpdated(address indexed newRevenueWallet);
    event CEPointsContractUpdated(address indexed newContract);
    event LimitsUpdated(uint256 maxTx, uint256 maxWallet);
    
    // Vesting
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount, uint256 duration);
    event VestingClaimed(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary);
    
    // ========== CONSTRUCTOR ==========
    
    constructor(
        address _treasuryWallet,
        address _revenueWallet
    ) ERC20("Joy Token", "JY") {
        require(_treasuryWallet != address(0), "Treasury cannot be zero address");
        require(_revenueWallet != address(0), "Revenue wallet cannot be zero address");
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(REVENUE_MANAGER_ROLE, msg.sender);
        _grantRole(STAKING_MANAGER_ROLE, msg.sender);
        
        // Store wallet addresses
        treasuryWallet = _treasuryWallet;
        revenueWallet = _revenueWallet;
        
        // Mint total supply ONCE (no future minting possible)
        _mint(address(this), TOTAL_SUPPLY);
        
        // Initial distribution
        _distributeInitialSupply();
        
        // Exempt critical addresses from limits
        isExemptFromLimits[address(this)] = true;
        isExemptFromLimits[_treasuryWallet] = true;
        isExemptFromLimits[_revenueWallet] = true;
        
        emit TreasuryUpdated(_treasuryWallet);
        emit RevenueWalletUpdated(_revenueWallet);
    }
    
    // ========== INITIAL DISTRIBUTION ==========
    
    /**
     * @dev Distributes initial supply according to tokenomics
     * This happens ONCE at deployment
     */
    function _distributeInitialSupply() private {
        uint256 communityRewards = (TOTAL_SUPPLY * 40) / 100;    // 2,000,000 JY
        uint256 stakingPool = (TOTAL_SUPPLY * 25) / 100;         // 1,250,000 JY
        uint256 teamAdvisors = (TOTAL_SUPPLY * 15) / 100;        // 750,000 JY
        uint256 treasury = (TOTAL_SUPPLY * 15) / 100;            // 750,000 JY
        uint256 liquidity = (TOTAL_SUPPLY * 5) / 100;            // 250,000 JY
        
        // Transfer allocations
        _transfer(address(this), treasuryWallet, treasury);
        _transfer(address(this), treasuryWallet, liquidity); // Treasury manages liquidity
        
        // Community rewards and staking pool stay in contract
        // Team allocation stays locked for vesting
    }
    
    // ========== STAKING FUNCTIONS (Real Yield Model) ==========
    
    /**
     * @dev Stake JY tokens to earn 30% APR from protocol revenue
     * Real yield means rewards come from actual business revenue, not inflation
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(stakingEnabled, "Staking not enabled");
        require(amount >= MIN_STAKE_AMOUNT, "Below minimum stake");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        StakeInfo storage userStake = stakes[msg.sender];
        
        // Claim any pending rewards first
        if (userStake.amount > 0) {
            _claimRewards(msg.sender);
        } else {
            totalStakers++;
        }
        
        // Transfer tokens to contract
        _transfer(msg.sender, address(this), amount);
        
        // Update stake info
        userStake.amount += amount;
        userStake.startTime = block.timestamp;
        userStake.lastClaimTime = block.timestamp;
        userStake.unstakeRequestTime = 0; // Reset unstake request
        
        totalStaked += amount;
        
        emit Staked(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Calculate pending rewards based on 30% APR
     * Rewards are calculated from revenue pool (real yield)
     */
    function calculateRewards(address user) public view returns (uint256) {
        StakeInfo memory userStake = stakes[user];
        
        if (userStake.amount == 0) {
            return 0;
        }
        
        uint256 timeStaked = block.timestamp - userStake.lastClaimTime;
        
        // Calculate APR-based rewards: (amount * APR * time) / (100 * seconds_per_year)
        uint256 rewards = (userStake.amount * BASE_APR * timeStaked) / (APR_DENOMINATOR * SECONDS_PER_YEAR);
        
        return rewards + userStake.accruedRewards;
    }
    
    /**
     * @dev Claim staking rewards (paid from protocol revenue)
     */
    function claimRewards() external nonReentrant {
        _claimRewards(msg.sender);
    }
    
    function _claimRewards(address user) private {
        uint256 rewards = calculateRewards(user);
        
        if (rewards == 0) {
            return;
        }
        
        require(availableYieldPool >= rewards, "Insufficient yield pool - revenue needed");
        
        StakeInfo storage userStake = stakes[user];
        
        // Update state
        userStake.lastClaimTime = block.timestamp;
        userStake.accruedRewards = 0;
        
        availableYieldPool -= rewards;
        totalYieldDistributed += rewards;
        
        // Transfer rewards from contract
        _transfer(address(this), user, rewards);
        
        emit RewardsClaimed(user, rewards);
    }
    
    /**
     * @dev Request to unstake (starts 7-day cooldown)
     */
    function requestUnstake() external {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount > 0, "No stake found");
        require(userStake.unstakeRequestTime == 0, "Unstake already requested");
        
        userStake.unstakeRequestTime = block.timestamp;
        
        emit UnstakeRequested(msg.sender, userStake.amount, block.timestamp + UNSTAKE_COOLDOWN);
    }
    
    /**
     * @dev Unstake tokens after cooldown period
     */
    function unstake() external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        
        require(userStake.amount > 0, "No stake found");
        require(userStake.unstakeRequestTime > 0, "Must request unstake first");
        require(block.timestamp >= userStake.unstakeRequestTime + UNSTAKE_COOLDOWN, "Cooldown not completed");
        
        // Claim any pending rewards
        uint256 rewards = calculateRewards(msg.sender);
        if (rewards > 0 && availableYieldPool >= rewards) {
            availableYieldPool -= rewards;
            totalYieldDistributed += rewards;
        }
        
        uint256 stakedAmount = userStake.amount;
        uint256 totalAmount = stakedAmount + rewards;
        
        // Update state
        totalStaked -= stakedAmount;
        totalStakers--;
        
        delete stakes[msg.sender];
        
        // Transfer tokens back to user
        _transfer(address(this), msg.sender, totalAmount);
        
        emit Unstaked(msg.sender, stakedAmount, rewards);
    }
    
    // ========== REAL YIELD - REVENUE DEPOSIT ==========
    
    /**
     * @dev Deposit protocol revenue to fund staking rewards
     * This is the "Real Yield" mechanism - rewards come from actual business revenue
     * Revenue sources: subscriptions, ads, marketplace fees, premium content
     */
    function depositRevenue(uint256 amount, string calldata source) external onlyRole(REVENUE_MANAGER_ROLE) {
        require(amount > 0, "Amount must be positive");
        
        // Transfer JY tokens from revenue wallet to contract
        _transfer(msg.sender, address(this), amount);
        
        // Add to yield pool
        availableYieldPool += amount;
        totalRevenueDeposited += amount;
        
        emit RevenueDeposited(msg.sender, amount, source);
        emit YieldPoolReplenished(amount);
    }
    
    /**
     * @dev View available yield pool and sustainability metrics
     */
    function getYieldPoolStatus() external view returns (
        uint256 available,
        uint256 totalDeposited,
        uint256 totalDistributed,
        uint256 currentAPR,
        uint256 projectedDays
    ) {
        available = availableYieldPool;
        totalDeposited = totalRevenueDeposited;
        totalDistributed = totalYieldDistributed;
        currentAPR = BASE_APR;
        
        // Calculate how many days the pool can sustain at current rate
        if (totalStaked > 0 && availableYieldPool > 0) {
            uint256 dailyRewards = (totalStaked * BASE_APR) / (APR_DENOMINATOR * 365);
            projectedDays = availableYieldPool / dailyRewards;
        } else {
            projectedDays = 0;
        }
        
        return (available, totalDeposited, totalDistributed, currentAPR, projectedDays);
    }
    
    // ========== CE POINTS CONVERSION ==========
    
    /**
     * @dev Convert CE Points to JY tokens
     * Rate: 100 CE Points = 1 JY
     * Only callable by CE Points contract
     */
    function convertCEPointsToJY(address user, uint256 cePoints) external {
        require(msg.sender == cePointsContract, "Only CE Points contract");
        require(ceConversionEnabled, "Conversion not enabled");
        require(cePoints >= CE_TO_JY_RATE, "Minimum 100 CE Points");
        
        uint256 jyAmount = (cePoints * 10**18) / CE_TO_JY_RATE;
        
        require(balanceOf(address(this)) >= jyAmount, "Insufficient JY in contract");
        
        totalCEPointsConverted += cePoints;
        
        // Transfer JY to user
        _transfer(address(this), user, jyAmount);
        
        emit CEPointsConverted(user, cePoints, jyAmount);
    }
    
    // ========== VESTING (Team & Advisors) ==========
    
    /**
     * @dev Create vesting schedule for team/advisors
     * 2-year vesting prevents token dumps
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 vestingDuration
    ) external onlyRole(ADMIN_ROLE) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(amount > 0, "Amount must be positive");
        require(vestingSchedules[beneficiary].totalAmount == 0, "Schedule exists");
        
        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            claimedAmount: 0,
            startTime: block.timestamp,
            vestingDuration: vestingDuration,
            revoked: false
        });
        
        emit VestingScheduleCreated(beneficiary, amount, vestingDuration);
    }
    
    /**
     * @dev Claim vested tokens
     */
    function claimVested() external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        
        require(schedule.totalAmount > 0, "No vesting schedule");
        require(!schedule.revoked, "Schedule revoked");
        
        uint256 vested = calculateVestedAmount(msg.sender);
        uint256 claimable = vested - schedule.claimedAmount;
        
        require(claimable > 0, "Nothing to claim");
        
        schedule.claimedAmount += claimable;
        
        _transfer(address(this), msg.sender, claimable);
        
        emit VestingClaimed(msg.sender, claimable);
    }
    
    /**
     * @dev Calculate vested amount for beneficiary
     */
    function calculateVestedAmount(address beneficiary) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        
        if (schedule.totalAmount == 0 || schedule.revoked) {
            return 0;
        }
        
        if (block.timestamp >= schedule.startTime + schedule.vestingDuration) {
            return schedule.totalAmount;
        }
        
        uint256 elapsed = block.timestamp - schedule.startTime;
        return (schedule.totalAmount * elapsed) / schedule.vestingDuration;
    }
    
    // ========== TRANSFER HOOKS & ANTI-WHALE ==========
    
    /**
     * @dev Hook that is called before any transfer of tokens
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
        
        // Skip checks for minting/burning
        if (from == address(0) || to == address(0)) {
            return;
        }
        
        // Check blacklist
        require(!isBlacklisted[from], "Sender blacklisted");
        require(!isBlacklisted[to], "Recipient blacklisted");
        
        // Check if trading is enabled
        require(tradingEnabled || isExemptFromLimits[from] || isExemptFromLimits[to], "Trading not enabled");
        
        // Anti-whale limits (skip for exempt addresses)
        if (!isExemptFromLimits[from] && !isExemptFromLimits[to]) {
            require(amount <= maxTransactionAmount, "Exceeds max transaction");
            
            if (to != address(this)) {
                require(balanceOf(to) + amount <= maxWalletBalance, "Exceeds max wallet");
            }
        }
    }
    
    // ========== ADMIN FUNCTIONS ==========
    
    /**
     * @dev Enable trading (one-time activation)
     */
    function enableTrading() external onlyRole(ADMIN_ROLE) {
        require(!tradingEnabled, "Already enabled");
        tradingEnabled = true;
        emit TradingEnabled(block.timestamp);
    }
    
    /**
     * @dev Enable staking
     */
    function enableStaking() external onlyRole(ADMIN_ROLE) {
        require(!stakingEnabled, "Already enabled");
        stakingEnabled = true;
        emit StakingEnabled(block.timestamp);
    }
    
    /**
     * @dev Enable CE Points conversion
     */
    function enableCEConversion() external onlyRole(ADMIN_ROLE) {
        require(!ceConversionEnabled, "Already enabled");
        ceConversionEnabled = true;
        emit CEConversionEnabled(block.timestamp);
    }
    
    /**
     * @dev Update CE Points contract address
     */
    function setCEPointsContract(address _cePointsContract) external onlyRole(ADMIN_ROLE) {
        require(_cePointsContract != address(0), "Invalid address");
        cePointsContract = _cePointsContract;
        isExemptFromLimits[_cePointsContract] = true;
        emit CEPointsContractUpdated(_cePointsContract);
    }
    
    /**
     * @dev Update treasury wallet
     */
    function setTreasuryWallet(address _treasuryWallet) external onlyRole(ADMIN_ROLE) {
        require(_treasuryWallet != address(0), "Invalid address");
        treasuryWallet = _treasuryWallet;
        isExemptFromLimits[_treasuryWallet] = true;
        emit TreasuryUpdated(_treasuryWallet);
    }
    
    /**
     * @dev Update revenue wallet
     */
    function setRevenueWallet(address _revenueWallet) external onlyRole(ADMIN_ROLE) {
        require(_revenueWallet != address(0), "Invalid address");
        revenueWallet = _revenueWallet;
        isExemptFromLimits[_revenueWallet] = true;
        emit RevenueWalletUpdated(_revenueWallet);
    }
    
    /**
     * @dev Update anti-whale limits
     */
    function updateLimits(uint256 _maxTx, uint256 _maxWallet) external onlyRole(ADMIN_ROLE) {
        require(_maxTx > 0 && _maxWallet > 0, "Invalid limits");
        maxTransactionAmount = _maxTx;
        maxWalletBalance = _maxWallet;
        emit LimitsUpdated(_maxTx, _maxWallet);
    }
    
    /**
     * @dev Set address exempt from limits
     */
    function setExemptFromLimits(address account, bool exempt) external onlyRole(ADMIN_ROLE) {
        isExemptFromLimits[account] = exempt;
    }
    
    /**
     * @dev Blacklist address
     */
    function setBlacklisted(address account, bool blacklisted) external onlyRole(ADMIN_ROLE) {
        isBlacklisted[account] = blacklisted;
    }
    
    /**
     * @dev Pause contract (emergency)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Revoke vesting schedule (emergency)
     */
    function revokeVesting(address beneficiary) external onlyRole(ADMIN_ROLE) {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        require(schedule.totalAmount > 0, "No schedule");
        require(!schedule.revoked, "Already revoked");
        
        schedule.revoked = true;
        emit VestingRevoked(beneficiary);
    }
    
    // ========== VIEW FUNCTIONS ==========
    
    /**
     * @dev Get user stake info
     */
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 lastClaimTime,
        uint256 pendingRewards,
        uint256 unstakeRequestTime,
        uint256 unstakeUnlockTime
    ) {
        StakeInfo memory userStake = stakes[user];
        return (
            userStake.amount,
            userStake.startTime,
            userStake.lastClaimTime,
            calculateRewards(user),
            userStake.unstakeRequestTime,
            userStake.unstakeRequestTime > 0 ? userStake.unstakeRequestTime + UNSTAKE_COOLDOWN : 0
        );
    }
    
    /**
     * @dev Get global staking stats
     */
    function getStakingStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalStakers,
        uint256 _currentAPR,
        uint256 _totalYieldDistributed,
        uint256 _availableYieldPool
    ) {
        return (
            totalStaked,
            totalStakers,
            BASE_APR,
            totalYieldDistributed,
            availableYieldPool
        );
    }
    
    /**
     * @dev Get token stats
     */
    function getTokenStats() external view returns (
        uint256 _totalSupply,
        uint256 _circulatingSupply,
        uint256 _totalBurned,
        uint256 _totalStaked,
        uint256 _contractBalance
    ) {
        return (
            TOTAL_SUPPLY,
            TOTAL_SUPPLY - totalBurned - balanceOf(address(this)),
            totalBurned,
            totalStaked,
            balanceOf(address(this))
        );
    }
}
