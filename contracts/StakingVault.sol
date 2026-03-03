// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StakingVault is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public joyToken;

    struct StakingTier {
        uint256 lockupDuration; // in seconds
        uint256 rewardMultiplier; // Basis points: 150 = 1.5x
        bool isAllowed;
    }

    struct UserStake {
        uint256 amount;
        uint256 startTime;
        uint256 lockupEnd;
        uint256 tierId;
        bool claimed;
        uint256 rewardsAccumulated;
    }

    // Tier configuration
    mapping(uint256 => StakingTier) public tiers;
    // User stakes: user address -> stake ID -> stake data
    mapping(address => UserStake[]) public userStakes;
    
    // Total staked amount
    uint256 public totalStaked;

    event Staked(address indexed user, uint256 amount, uint256 tierId, uint256 lockupEnd);
    event Unstaked(address indexed user, uint256 amount, uint256 rewards);
    event RewardClaimed(address indexed user, uint256 amount);

    constructor(address _joyToken) Ownable(msg.sender) {
        joyToken = IERC20(_joyToken);
    }

    function addTier(uint256 _tierId, uint256 _lockupDuration, uint256 _rewardMultiplier) external onlyOwner {
        tiers[_tierId] = StakingTier({
            lockupDuration: _lockupDuration,
            rewardMultiplier: _rewardMultiplier,
            isAllowed: true
        });
    }

    function stake(uint256 _amount, uint256 _tierId) external nonReentrant {
        require(_amount > 0, "Amount must be > 0");
        require(tiers[_tierId].isAllowed, "Invalid tier");

        joyToken.safeTransferFrom(msg.sender, address(this), _amount);

        uint256 lockupEnd = block.timestamp + tiers[_tierId].lockupDuration;

        userStakes[msg.sender].push(UserStake({
            amount: _amount,
            startTime: block.timestamp,
            lockupEnd: lockupEnd,
            tierId: _tierId,
            claimed: false,
            rewardsAccumulated: 0
        }));

        totalStaked += _amount;
        emit Staked(msg.sender, _amount, _tierId, lockupEnd);
    }

    function unstake(uint256 _stakeIndex) external nonReentrant {
        require(_stakeIndex < userStakes[msg.sender].length, "Invalid stake index");
        UserStake storage s = userStakes[msg.sender][_stakeIndex];
        
        require(!s.claimed, "Already claimed");
        require(block.timestamp >= s.lockupEnd, "Lockup not ended");

        uint256 reward = calculateReward(s);
        uint256 totalReturn = s.amount + reward;
        
        s.claimed = true;
        totalStaked -= s.amount;

        // In a real automated yield system, rewards come from a RewardDistributor.
        // For simplicity here, assuming this contract holds enough reward tokens
        // or mints them (if it had minting rights, which it doesn't).
        // This usually requires a "Reward Pool" balance check.
        require(joyToken.balanceOf(address(this)) >= totalReturn, "Insufficient contract balance");

        joyToken.safeTransfer(msg.sender, totalReturn);

        emit Unstaked(msg.sender, s.amount, reward);
    }

    function calculateReward(UserStake memory _stake) public view returns (uint256) {
        // Simplified yield calculation logic
        // Reward = Amount * Multiplier * Time (if dynamic)
        // Here using a fixed multiplier logic for simplicity based on the tier
        // Assuming multiplier is basis points (100 = 1%)
        // Example: 1.5x multiplier logic would likely be implemented differently in production
        // This is a placeholder for the "Real Yield" logic distributed by RewardDistributor
        
        uint256 multiplier = tiers[_stake.tierId].rewardMultiplier;
        // Simple Example: Reward is percentage of stake
        return (_stake.amount * multiplier) / 10000; 
    }

    // Admin function to withdraw tokens in case of emergency or migration
    function emergencyWithdraw(uint256 _amount) external onlyOwner {
        joyToken.safeTransfer(msg.sender, _amount);
    }
}
