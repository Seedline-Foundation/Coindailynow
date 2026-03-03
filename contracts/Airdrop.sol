// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Airdrop is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public joyToken;

    event AirdropDistributed(uint256 totalRecipients, uint256 totalAmount);

    constructor(address _joyToken) Ownable(msg.sender) {
        joyToken = IERC20(_joyToken);
    }

    function distribute(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0, "No recipients");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid address");
            joyToken.safeTransferFrom(msg.sender, recipients[i], amounts[i]);
            totalAmount += amounts[i];
        }

        emit AirdropDistributed(recipients.length, totalAmount);
    }
}
