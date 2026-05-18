// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title TimelockGovernance (N16)
 * @dev Thin wrapper around OpenZeppelin TimelockController.
 *      Deploy with a multisig as proposer/executor and set this contract
 *      as the owner of critical protocol contracts (StakingVault,
 *      PressDistribution, Airdrop, etc.) so that privileged operations
 *      are subject to a mandatory time delay.
 *
 *      Default minimum delay: 24 hours (86 400 seconds).
 */
contract TimelockGovernance is TimelockController {
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin
    ) TimelockController(minDelay, proposers, executors, admin) {}
}
