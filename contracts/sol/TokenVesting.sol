// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenVesting (C-1-3)
 * @dev Linear vesting for team/advisors — 12-decimal JOY compatible.
 */
contract TokenVesting is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    uint256 public immutable start;
    uint256 public immutable duration;
    uint256 public immutable totalAmount;
    address public immutable beneficiary;

    uint256 public released;

    event Released(address indexed beneficiary, uint256 amount);

    constructor(
        address _token,
        address _beneficiary,
        uint256 _totalAmount,
        uint256 _start,
        uint256 _duration
    ) Ownable(msg.sender) {
        require(_token != address(0) && _beneficiary != address(0), "zero addr");
        require(_duration > 0 && _totalAmount > 0, "bad params");
        token = IERC20(_token);
        beneficiary = _beneficiary;
        totalAmount = _totalAmount;
        start = _start;
        duration = _duration;
        token.safeTransferFrom(msg.sender, address(this), _totalAmount);
    }

    function vestedAmount() public view returns (uint256) {
        if (block.timestamp < start) return 0;
        if (block.timestamp >= start + duration) return totalAmount;
        return (totalAmount * (block.timestamp - start)) / duration;
    }

    function releasable() public view returns (uint256) {
        return vestedAmount() - released;
    }

    function release() external {
        uint256 amount = releasable();
        require(amount > 0, "nothing to release");
        released += amount;
        token.safeTransfer(beneficiary, amount);
        emit Released(beneficiary, amount);
    }
}
