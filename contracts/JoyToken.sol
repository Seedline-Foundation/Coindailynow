// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title JoyToken (JOY)
 * @dev CoinDaily's ERC-20 utility token for microservice payments.
 *
 * - Name: Joy Token
 * - Symbol: JOY
 * - Total Supply: 1,000,000,000 (1 Billion)
 * - Decimals: 12 (optimised for microservice micro-transactions)
 */
contract JoyToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**12; // 1 Billion with 12 decimals

    constructor() ERC20("Joy Token", "JOY") Ownable(msg.sender) {
        _mint(msg.sender, MAX_SUPPLY);
    }

    function decimals() public view virtual override returns (uint8) {
        return 12;
    }
}
