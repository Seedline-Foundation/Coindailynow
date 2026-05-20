// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VestingWallet (N13)
 * @dev Team token vesting with cliff and linear release schedule.
 *      Owner may revoke unvested tokens at any time.
 */
contract VestingWallet is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    address public immutable beneficiary;
    uint64 public immutable start;
    uint64 public immutable cliffEnd;
    uint64 public immutable end;
    uint256 public immutable allocation;

    uint256 public released;
    bool public revoked;

    event TokensReleased(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary, uint256 refunded);

    constructor(
        address _token,
        address _beneficiary,
        uint64 _startTimestamp,
        uint64 _cliffDuration,
        uint64 _vestingDuration
    ) Ownable(msg.sender) {
        require(_token != address(0) && _beneficiary != address(0), "zero addr");
        require(_vestingDuration > 0, "duration=0");
        require(_cliffDuration <= _vestingDuration, "cliff>duration");

        token = IERC20(_token);
        beneficiary = _beneficiary;
        start = _startTimestamp;
        cliffEnd = _startTimestamp + _cliffDuration;
        end = _startTimestamp + _vestingDuration;
        allocation = token.balanceOf(address(this));
    }

    /**
     * @dev Tokens vested at a given `timestamp`.
     *      Returns 0 before cliff; linearly interpolates between cliff and end.
     */
    function vestedAmount(uint64 timestamp) public view returns (uint256) {
        uint256 total = _totalAllocation();
        if (timestamp < cliffEnd) return 0;
        if (timestamp >= end) return total;
        return (total * (timestamp - start)) / (end - start);
    }

    /** @dev Currently claimable tokens (vested minus already released). */
    function releasable() public view returns (uint256) {
        return vestedAmount(uint64(block.timestamp)) - released;
    }

    /** @dev Transfer all currently vested-and-unreleased tokens to the beneficiary. */
    function release() external {
        uint256 amount = releasable();
        require(amount > 0, "nothing to release");
        released += amount;
        token.safeTransfer(beneficiary, amount);
        emit TokensReleased(beneficiary, amount);
    }

    /**
     * @dev Owner revokes unvested tokens, sending them back to the owner.
     *      Already-vested tokens remain claimable by the beneficiary.
     */
    function revoke() external onlyOwner {
        require(!revoked, "already revoked");
        revoked = true;

        uint256 vested = vestedAmount(uint64(block.timestamp));
        uint256 refund = _totalAllocation() - vested;

        if (refund > 0) {
            token.safeTransfer(owner(), refund);
        }
        emit VestingRevoked(beneficiary, refund);
    }

    function _totalAllocation() private view returns (uint256) {
        return token.balanceOf(address(this)) + released;
    }
}
