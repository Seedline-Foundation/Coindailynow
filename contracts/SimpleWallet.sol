// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleWallet
 * @dev Simple wallet contract for holding tokens
 * Used for: Staking Pool, Liquidity Pool, Development Fund
 */
contract SimpleWallet is Ownable {
    
    event TokensReceived(address indexed token, address indexed from, uint256 amount);
    event TokensWithdrawn(address indexed token, address indexed to, uint256 amount);
    event EtherReceived(address indexed from, uint256 amount);
    event EtherWithdrawn(address indexed to, uint256 amount);
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Receive Ether
     */
    receive() external payable {
        emit EtherReceived(msg.sender, msg.value);
    }
    
    /**
     * @dev Withdraw ERC20 tokens
     */
    function withdrawToken(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        
        IERC20(token).transfer(to, amount);
        emit TokensWithdrawn(token, to, amount);
    }
    
    /**
     * @dev Withdraw Ether
     */
    function withdrawEther(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");
        require(address(this).balance >= amount, "Insufficient balance");
        
        to.transfer(amount);
        emit EtherWithdrawn(to, amount);
    }
    
    /**
     * @dev Get token balance
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
    
    /**
     * @dev Get Ether balance
     */
    function getEtherBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
