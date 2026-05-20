// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Airdrop
 * @dev Batch-airdrop any ERC-20 token. Owner loads the contract with tokens
 *      and then calls batchAirdrop to distribute them.
 */
contract Airdrop is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public token;

    event AirdropExecuted(uint256 totalRecipients, uint256 totalAmount);

    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token address");
        token = IERC20(_token);
    }

    /**
     * @notice Send tokens to multiple recipients in a single transaction.
     * @param recipients Array of destination addresses.
     * @param amounts    Array of token amounts (in smallest unit).
     */
    function batchAirdrop(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(recipients.length <= 200, "Batch limit: 200 max");
        require(recipients.length == amounts.length, "Array length mismatch");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            token.safeTransfer(recipients[i], amounts[i]);
            totalAmount += amounts[i];
        }

        emit AirdropExecuted(recipients.length, totalAmount);
    }

    /**
     * @notice Recover any ERC-20 token accidentally sent to this contract.
     * @param _token Address of the token to withdraw.
     */
    function emergencyWithdraw(address _token) external onlyOwner {
        uint256 balance = IERC20(_token).balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        IERC20(_token).safeTransfer(msg.sender, balance);
    }
}
