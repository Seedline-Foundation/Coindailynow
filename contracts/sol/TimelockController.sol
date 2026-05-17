// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { TimelockController as OZTimelock } from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * C-2-3: Timelock for privileged ops — deploy with multisig as proposers/executors.
 */
contract CoinDailyTimelock is OZTimelock {
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) OZTimelock(minDelay, proposers, executors, admin) {}
}
