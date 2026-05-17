// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Subscription is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public joyToken;
    address public treasuryWallet;

    struct Plan {
        uint256 price; // Price in Joy Token
        uint256 duration; // Duration in seconds
        bool isActive;
    }

    mapping(uint256 => Plan) public plans;
    
    // User -> PlanId -> Expiry Timestamp
    mapping(address => mapping(uint256 => uint256)) public userSubscriptions;

    event Subscribed(address indexed user, uint256 planId, uint256 expiry);
    event PlanUpdated(uint256 planId, uint256 price, uint256 duration);

    constructor(address _joyToken, address _treasury) Ownable(msg.sender) {
        joyToken = IERC20(_joyToken);
        treasuryWallet = _treasury;
    }

    function createPlan(uint256 _planId, uint256 _price, uint256 _duration) external onlyOwner {
        plans[_planId] = Plan({
            price: _price,
            duration: _duration,
            isActive: true
        });
        emit PlanUpdated(_planId, _price, _duration);
    }

    function subscribe(uint256 _planId) external {
        Plan memory plan = plans[_planId];
        require(plan.isActive, "Plan not active");

        // Transfer tokens from user to treasury
        joyToken.safeTransferFrom(msg.sender, treasuryWallet, plan.price);

        // Update expiry
        uint256 currentExpiry = userSubscriptions[msg.sender][_planId];
        if (currentExpiry < block.timestamp) {
            currentExpiry = block.timestamp;
        }
        
        uint256 newExpiry = currentExpiry + plan.duration;
        userSubscriptions[msg.sender][_planId] = newExpiry;

        emit Subscribed(msg.sender, _planId, newExpiry);
    }

    function setTreasury(address _newTreasury) external onlyOwner {
        treasuryWallet = _newTreasury;
    }
}
