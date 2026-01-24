// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CoinDailyToken (CDT)
 * @dev ERC-20 Token for CoinDaily Platform - Africa's Premier Crypto News Platform
 * 
 * Features:
 * - Total Supply: 1,000,000,000 CDT (1 Billion)
 * - Burnable: Deflationary mechanism
 * - Pausable: Emergency security control
 * - Access Control: Multi-role management
 * - Anti-Whale: Max transaction and wallet limits
 * - Fee Structure: 0.5% transaction fee (distributed to ecosystem)
 * - Vesting: Team and advisor vesting schedules
 */
contract CoinDailyToken is ERC20, ERC20Burnable, ERC20Pausable, AccessControl, ReentrancyGuard {
    
    // ========== CONSTANTS ==========
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant FEE_MANAGER_ROLE = keccak256("FEE_MANAGER_ROLE");
    
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 10**18; // 1 Billion CDT
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;     // Hard cap
    
    // Anti-whale limits (adjustable by admin)
    uint256 public maxTransactionAmount = 1_000_000 * 10**18;  // 0.1% of supply
    uint256 public maxWalletBalance = 10_000_000 * 10**18;      // 1% of supply
    uint256 public cooldownPeriod = 30 seconds;                 // Time between transfers
    
    // Fee structure (in basis points: 100 = 1%)
    uint256 public transactionFee = 50;        // 0.5% total fee
    uint256 public burnFee = 10;               // 0.1% burn
    uint256 public stakingRewardFee = 20;      // 0.2% to staking pool
    uint256 public liquidityFee = 10;          // 0.1% to liquidity
    uint256 public developmentFee = 10;        // 0.1% to development
    
    // ========== STATE VARIABLES ==========
    
    // Wallet addresses for fee distribution
    address public stakingRewardPool;
    address public liquidityPool;
    address public developmentFund;
    
    // Anti-whale tracking
    mapping(address => uint256) public lastTransferTimestamp;
    mapping(address => bool) public isExemptFromFees;
    mapping(address => bool) public isExemptFromLimits;
    mapping(address => bool) public isBlacklisted;
    
    // Staking tracking
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public stakingStartTime;
    mapping(address => uint256) public stakingRewards;
    
    // Vesting schedules
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 claimedAmount;
        uint256 startTime;
        uint256 cliffDuration;
        uint256 vestingDuration;
        bool revoked;
    }
    mapping(address => VestingSchedule) public vestingSchedules;
    
    // Statistics
    uint256 public totalBurned;
    uint256 public totalStaked;
    uint256 public totalFeesCollected;
    
    // Feature flags
    bool public tradingEnabled;
    bool public feesEnabled = true;
    bool public limitsEnabled = true;
    
    // ========== EVENTS ==========
    
    event TradingEnabled(uint256 timestamp);
    event FeesUpdated(uint256 transactionFee, uint256 burnFee, uint256 stakingFee, uint256 liquidityFee, uint256 devFee);
    event LimitsUpdated(uint256 maxTx, uint256 maxWallet, uint256 cooldown);
    event ExemptFromFees(address indexed account, bool exempt);
    event ExemptFromLimits(address indexed account, bool exempt);
    event Blacklisted(address indexed account, bool blacklisted);
    event PoolAddressUpdated(string poolType, address indexed newAddress);
    
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 rewards, uint256 timestamp);
    event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp);
    
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount, uint256 startTime, uint256 cliff, uint256 duration);
    event VestingClaimed(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary, uint256 remainingAmount);
    
    // ========== CONSTRUCTOR ==========
    
    constructor(
        address _stakingRewardPool,
        address _liquidityPool,
        address _developmentFund
    ) ERC20("CoinDaily Token", "CDT") {
        require(_stakingRewardPool != address(0), "Invalid staking pool");
        require(_liquidityPool != address(0), "Invalid liquidity pool");
        require(_developmentFund != address(0), "Invalid development fund");
        
        stakingRewardPool = _stakingRewardPool;
        liquidityPool = _liquidityPool;
        developmentFund = _developmentFund;
        
        // Grant roles to deployer
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(FEE_MANAGER_ROLE, msg.sender);
        
        // Exempt key addresses from fees and limits
        isExemptFromFees[msg.sender] = true;
        isExemptFromFees[address(this)] = true;
        isExemptFromFees[_stakingRewardPool] = true;
        isExemptFromFees[_liquidityPool] = true;
        isExemptFromFees[_developmentFund] = true;
        
        isExemptFromLimits[msg.sender] = true;
        isExemptFromLimits[address(this)] = true;
        isExemptFromLimits[_stakingRewardPool] = true;
        isExemptFromLimits[_liquidityPool] = true;
        isExemptFromLimits[_developmentFund] = true;
        
        // Mint initial supply to deployer for distribution
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    // ========== PUBLIC FUNCTIONS ==========
    
    /**
     * @dev Enable trading (one-time function)
     */
    function enableTrading() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!tradingEnabled, "Trading already enabled");
        tradingEnabled = true;
        emit TradingEnabled(block.timestamp);
    }
    
    /**
     * @dev Override transfer to add fees and anti-whale protection
     */
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        _beforeTokenTransfer(msg.sender, to, amount);
        
        if (feesEnabled && !isExemptFromFees[msg.sender] && !isExemptFromFees[to]) {
            return _transferWithFees(msg.sender, to, amount);
        } else {
            return super.transfer(to, amount);
        }
    }
    
    /**
     * @dev Override transferFrom to add fees and anti-whale protection
     */
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        _beforeTokenTransfer(from, to, amount);
        
        if (feesEnabled && !isExemptFromFees[from] && !isExemptFromFees[to]) {
            _spendAllowance(from, msg.sender, amount);
            return _transferWithFees(from, to, amount);
        } else {
            return super.transferFrom(from, to, amount);
        }
    }
    
    // ========== STAKING FUNCTIONS ==========
    
    /**
     * @dev Stake CDT tokens
     */
    function stake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Cannot stake 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Claim existing rewards first
        if (stakedBalance[msg.sender] > 0) {
            _claimStakingRewards(msg.sender);
        }
        
        // Transfer tokens to this contract
        _transfer(msg.sender, address(this), amount);
        
        // Update staking records
        stakedBalance[msg.sender] += amount;
        stakingStartTime[msg.sender] = block.timestamp;
        totalStaked += amount;
        
        emit Staked(msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Unstake CDT tokens
     */
    function unstake(uint256 amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Cannot unstake 0");
        require(stakedBalance[msg.sender] >= amount, "Insufficient staked balance");
        
        // Calculate and claim rewards
        uint256 rewards = _claimStakingRewards(msg.sender);
        
        // Update staking records
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;
        
        // Transfer tokens back to user
        _transfer(address(this), msg.sender, amount);
        
        emit Unstaked(msg.sender, amount, rewards, block.timestamp);
    }
    
    /**
     * @dev Claim staking rewards
     */
    function claimStakingRewards() external nonReentrant whenNotPaused returns (uint256) {
        return _claimStakingRewards(msg.sender);
    }
    
    /**
     * @dev Calculate pending staking rewards
     */
    function pendingRewards(address user) public view returns (uint256) {
        if (stakedBalance[user] == 0) return 0;
        
        uint256 timeStaked = block.timestamp - stakingStartTime[user];
        // Simple reward calculation: 15% APR
        // Formula: (stakedAmount * 15% * timeStaked) / (365 days)
        uint256 reward = (stakedBalance[user] * 15 * timeStaked) / (365 days * 100);
        return reward + stakingRewards[user];
    }
    
    // ========== VESTING FUNCTIONS ==========
    
    /**
     * @dev Create vesting schedule for team/advisors
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 cliffDuration,
        uint256 vestingDuration
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(amount > 0, "Amount must be > 0");
        require(vestingDuration > 0, "Duration must be > 0");
        require(vestingSchedules[beneficiary].totalAmount == 0, "Schedule exists");
        
        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            claimedAmount: 0,
            startTime: block.timestamp,
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration,
            revoked: false
        });
        
        // Transfer tokens to this contract for vesting
        _transfer(msg.sender, address(this), amount);
        
        emit VestingScheduleCreated(beneficiary, amount, block.timestamp, cliffDuration, vestingDuration);
    }
    
    /**
     * @dev Claim vested tokens
     */
    function claimVestedTokens() external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(schedule.totalAmount > 0, "No vesting schedule");
        require(!schedule.revoked, "Schedule revoked");
        require(block.timestamp >= schedule.startTime + schedule.cliffDuration, "Cliff not reached");
        
        uint256 vestedAmount = _calculateVestedAmount(msg.sender);
        uint256 claimableAmount = vestedAmount - schedule.claimedAmount;
        require(claimableAmount > 0, "No tokens to claim");
        
        schedule.claimedAmount += claimableAmount;
        _transfer(address(this), msg.sender, claimableAmount);
        
        emit VestingClaimed(msg.sender, claimableAmount);
    }
    
    /**
     * @dev Revoke vesting schedule (admin only)
     */
    function revokeVesting(address beneficiary) external onlyRole(DEFAULT_ADMIN_ROLE) {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        require(schedule.totalAmount > 0, "No vesting schedule");
        require(!schedule.revoked, "Already revoked");
        
        uint256 vestedAmount = _calculateVestedAmount(beneficiary);
        uint256 claimableAmount = vestedAmount - schedule.claimedAmount;
        
        // Transfer claimable amount to beneficiary
        if (claimableAmount > 0) {
            _transfer(address(this), beneficiary, claimableAmount);
            schedule.claimedAmount += claimableAmount;
        }
        
        // Return remaining tokens to admin
        uint256 remainingAmount = schedule.totalAmount - schedule.claimedAmount;
        if (remainingAmount > 0) {
            _transfer(address(this), msg.sender, remainingAmount);
        }
        
        schedule.revoked = true;
        emit VestingRevoked(beneficiary, remainingAmount);
    }
    
    // ========== ADMIN FUNCTIONS ==========
    
    /**
     * @dev Update fee structure
     */
    function updateFees(
        uint256 _transactionFee,
        uint256 _burnFee,
        uint256 _stakingFee,
        uint256 _liquidityFee,
        uint256 _devFee
    ) external onlyRole(FEE_MANAGER_ROLE) {
        require(_transactionFee <= 1000, "Fee too high"); // Max 10%
        require(_burnFee + _stakingFee + _liquidityFee + _devFee == _transactionFee, "Fee breakdown mismatch");
        
        transactionFee = _transactionFee;
        burnFee = _burnFee;
        stakingRewardFee = _stakingFee;
        liquidityFee = _liquidityFee;
        developmentFee = _devFee;
        
        emit FeesUpdated(_transactionFee, _burnFee, _stakingFee, _liquidityFee, _devFee);
    }
    
    /**
     * @dev Update anti-whale limits
     */
    function updateLimits(
        uint256 _maxTx,
        uint256 _maxWallet,
        uint256 _cooldown
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxTransactionAmount = _maxTx;
        maxWalletBalance = _maxWallet;
        cooldownPeriod = _cooldown;
        
        emit LimitsUpdated(_maxTx, _maxWallet, _cooldown);
    }
    
    /**
     * @dev Set fee exemption
     */
    function setFeeExemption(address account, bool exempt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        isExemptFromFees[account] = exempt;
        emit ExemptFromFees(account, exempt);
    }
    
    /**
     * @dev Set limit exemption
     */
    function setLimitExemption(address account, bool exempt) external onlyRole(DEFAULT_ADMIN_ROLE) {
        isExemptFromLimits[account] = exempt;
        emit ExemptFromLimits(account, exempt);
    }
    
    /**
     * @dev Blacklist address
     */
    function setBlacklist(address account, bool blacklisted) external onlyRole(DEFAULT_ADMIN_ROLE) {
        isBlacklisted[account] = blacklisted;
        emit Blacklisted(account, blacklisted);
    }
    
    /**
     * @dev Update pool addresses
     */
    function updatePoolAddress(string memory poolType, address newAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newAddress != address(0), "Invalid address");
        
        if (keccak256(bytes(poolType)) == keccak256(bytes("staking"))) {
            stakingRewardPool = newAddress;
        } else if (keccak256(bytes(poolType)) == keccak256(bytes("liquidity"))) {
            liquidityPool = newAddress;
        } else if (keccak256(bytes(poolType)) == keccak256(bytes("development"))) {
            developmentFund = newAddress;
        } else {
            revert("Invalid pool type");
        }
        
        emit PoolAddressUpdated(poolType, newAddress);
    }
    
    /**
     * @dev Enable/disable fees
     */
    function setFeesEnabled(bool enabled) external onlyRole(FEE_MANAGER_ROLE) {
        feesEnabled = enabled;
    }
    
    /**
     * @dev Enable/disable limits
     */
    function setLimitsEnabled(bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        limitsEnabled = enabled;
    }
    
    /**
     * @dev Pause token transfers (emergency only)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }
    
    // ========== INTERNAL FUNCTIONS ==========
    
    /**
     * @dev Transfer with fee deduction
     */
    function _transferWithFees(address from, address to, uint256 amount) internal returns (bool) {
        uint256 feeAmount = (amount * transactionFee) / 10000;
        uint256 amountAfterFee = amount - feeAmount;
        
        // Distribute fees
        uint256 burnAmount = (feeAmount * burnFee) / transactionFee;
        uint256 stakingAmount = (feeAmount * stakingRewardFee) / transactionFee;
        uint256 liquidityAmount = (feeAmount * liquidityFee) / transactionFee;
        uint256 devAmount = (feeAmount * developmentFee) / transactionFee;
        
        // Execute transfers
        _transfer(from, to, amountAfterFee);
        
        if (burnAmount > 0) {
            _burn(from, burnAmount);
            totalBurned += burnAmount;
        }
        if (stakingAmount > 0) _transfer(from, stakingRewardPool, stakingAmount);
        if (liquidityAmount > 0) _transfer(from, liquidityPool, liquidityAmount);
        if (devAmount > 0) _transfer(from, developmentFund, devAmount);
        
        totalFeesCollected += feeAmount;
        
        return true;
    }
    
    /**
     * @dev Claim staking rewards (internal)
     */
    function _claimStakingRewards(address user) internal returns (uint256) {
        uint256 rewards = pendingRewards(user);
        if (rewards > 0) {
            stakingRewards[user] = 0;
            stakingStartTime[user] = block.timestamp;
            
            // Mint rewards from staking pool
            _transfer(stakingRewardPool, user, rewards);
            
            emit RewardsClaimed(user, rewards, block.timestamp);
        }
        return rewards;
    }
    
    /**
     * @dev Calculate vested amount
     */
    function _calculateVestedAmount(address beneficiary) internal view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }
        
        if (block.timestamp >= schedule.startTime + schedule.vestingDuration) {
            return schedule.totalAmount;
        }
        
        uint256 timeVested = block.timestamp - schedule.startTime;
        return (schedule.totalAmount * timeVested) / schedule.vestingDuration;
    }
    
    /**
     * @dev Hook before token transfer
     */
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual {
        require(!isBlacklisted[from] && !isBlacklisted[to], "Blacklisted address");
        
        if (!tradingEnabled) {
            require(
                from == address(0) || // Minting
                to == address(0) || // Burning
                isExemptFromLimits[from] || // Exempt from
                isExemptFromLimits[to], // Exempt to
                "Trading not enabled"
            );
        }
        
        if (limitsEnabled && !isExemptFromLimits[from] && !isExemptFromLimits[to]) {
            // Check transaction amount limit
            require(amount <= maxTransactionAmount, "Exceeds max transaction amount");
            
            // Check wallet balance limit (for buys)
            if (to != address(0)) {
                require(balanceOf(to) + amount <= maxWalletBalance, "Exceeds max wallet balance");
            }
            
            // Check cooldown period
            require(
                block.timestamp >= lastTransferTimestamp[from] + cooldownPeriod,
                "Cooldown period not elapsed"
            );
            
            lastTransferTimestamp[from] = block.timestamp;
        }
    }
    
    /**
     * @dev Required override for Pausable
     */
    function _update(address from, address to, uint256 value) internal virtual override(ERC20, ERC20Pausable) {
        super._update(from, to, value);
    }
}
