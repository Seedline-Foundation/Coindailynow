// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract PressDistribution is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public joyToken;

    // Mapping of authorized press/publishers to their earned balance (if pull pattern)
    // or we can just use push pattern.
    // Let's implement a budget system where the contract holds funds and admin distributes.

    event PressPayment(address indexed recipient, uint256 amount, string reason);
    event BatchPressPayment(uint256 totalRecipients, uint256 totalAmount);

    constructor(address _joyToken) Ownable(msg.sender) {
        joyToken = IERC20(_joyToken);
    }

    // Function to pay a single press entity/influencer
    function payPress(address _recipient, uint256 _amount, string calldata _reason) external onlyOwner {
        require(_recipient != address(0), "Invalid recipient");
        joyToken.safeTransfer( _recipient, _amount);
        emit PressPayment(_recipient, _amount, _reason);
    }

    // Function to pay multiple press entities in batch (gas efficient)
    function batchPayPress(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
             require(recipients[i] != address(0), "Invalid recipient");
             joyToken.safeTransfer(recipients[i], amounts[i]);
             totalAmount += amounts[i];
        }
        
        emit BatchPressPayment(recipients.length, totalAmount);
    }

    // Allow contract to receive tokens
    function deposit() external payable {
        // Ether deposit if needed, though mostly we deal with ERC20
    }
    
    // Emergency withdraw
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner {
        IERC20(_token).safeTransfer(msg.sender, _amount);
    }
}
