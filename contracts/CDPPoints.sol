// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CDPPoints — CoinDaily Points
 * @dev Off-chain-compatible on-chain ledger for CoinDaily Points (CDP).
 *
 *      CDP is NOT an ERC-20 token. It is a non-transferable points system
 *      used for engagement rewards, leaderboard ranking, and conversion
 *      into JOY tokens at a rate set by the platform admin.
 *
 *      Points are:
 *        - Earned through reading, sharing, commenting, referrals, etc.
 *        - Non-transferable between users.
 *        - Convertible to JOY tokens (one-way) via the `convertToJOY` function.
 *        - Managed by OPERATOR_ROLE (backend services) and ADMIN_ROLE (super admin).
 */
contract CDPPoints is AccessControl, ReentrancyGuard {

    // ═══════════════════════════════════════════════════════════════════════
    // Roles
    // ═══════════════════════════════════════════════════════════════════════
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // ═══════════════════════════════════════════════════════════════════════
    // State
    // ═══════════════════════════════════════════════════════════════════════

    /// @dev User address → CDP balance
    mapping(address => uint256) public balanceOf;

    /// @dev Total CDP ever minted
    uint256 public totalMinted;

    /// @dev Total CDP ever burned (converted to JOY)
    uint256 public totalBurned;

    /// @dev Total CDP currently in circulation (minted - burned)
    uint256 public totalSupply;

    /// @dev Conversion rate: how many CDP = 1 JOY min-unit (12 decimals).
    ///      Default 100 → 100 CDP = 1e12 JOY base-units = 1 JOY
    uint256 public cdpPerJoy = 100;

    /// @dev The JOY token contract used for conversions.
    address public joyToken;

    /// @dev Pause conversions in emergencies.
    bool public conversionsPaused;

    // ═══════════════════════════════════════════════════════════════════════
    // Events
    // ═══════════════════════════════════════════════════════════════════════

    event PointsAwarded(address indexed user, uint256 amount, string reason);
    event PointsDeducted(address indexed user, uint256 amount, string reason);
    event PointsConverted(address indexed user, uint256 cdpBurned, uint256 joyReceived);
    event ConversionRateUpdated(uint256 oldRate, uint256 newRate);
    event ConversionsPaused(bool paused);

    // ═══════════════════════════════════════════════════════════════════════
    // Constructor
    // ═══════════════════════════════════════════════════════════════════════

    constructor(address _joyToken) {
        require(_joyToken != address(0), "Invalid JOY address");
        joyToken = _joyToken;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Operator functions (called by backend services)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @dev Award CDP to a user. Only callable by OPERATOR_ROLE (backend).
     * @param user   Recipient address.
     * @param amount Number of CDP to award.
     * @param reason Human-readable reason (e.g. "daily_login", "article_read").
     */
    function awardPoints(
        address user,
        uint256 amount,
        string calldata reason
    ) external onlyRole(OPERATOR_ROLE) {
        require(user != address(0), "Invalid user");
        require(amount > 0, "Amount must be > 0");

        balanceOf[user] += amount;
        totalMinted += amount;
        totalSupply += amount;

        emit PointsAwarded(user, amount, reason);
    }

    /**
     * @dev Batch award CDP to multiple users.
     */
    function batchAwardPoints(
        address[] calldata users,
        uint256[] calldata amounts,
        string calldata reason
    ) external onlyRole(OPERATOR_ROLE) {
        require(users.length == amounts.length, "Length mismatch");

        for (uint256 i = 0; i < users.length; i++) {
            require(users[i] != address(0), "Invalid user");
            balanceOf[users[i]] += amounts[i];
            totalMinted += amounts[i];
            totalSupply += amounts[i];

            emit PointsAwarded(users[i], amounts[i], reason);
        }
    }

    /**
     * @dev Deduct CDP from a user (penalty, refund clawback, etc.).
     */
    function deductPoints(
        address user,
        uint256 amount,
        string calldata reason
    ) external onlyRole(OPERATOR_ROLE) {
        require(balanceOf[user] >= amount, "Insufficient balance");

        balanceOf[user] -= amount;
        totalBurned += amount;
        totalSupply -= amount;

        emit PointsDeducted(user, amount, reason);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // User functions
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @dev Convert CDP points to JOY tokens (one-way).
     *      The contract must hold enough JOY balance to fulfill conversions.
     * @param cdpAmount Number of CDP to convert.
     */
    function convertToJOY(uint256 cdpAmount) external nonReentrant {
        require(!conversionsPaused, "Conversions paused");
        require(cdpAmount >= cdpPerJoy, "Below minimum conversion");
        require(balanceOf[msg.sender] >= cdpAmount, "Insufficient CDP");

        uint256 joyAmount = (cdpAmount * 1e12) / cdpPerJoy; // 1e12 = JOY decimal base

        // Check JOY balance in this contract
        (bool success, bytes memory data) = joyToken.call(
            abi.encodeWithSignature("balanceOf(address)", address(this))
        );
        require(success, "JOY balance check failed");
        uint256 joyBal = abi.decode(data, (uint256));
        require(joyBal >= joyAmount, "Insufficient JOY in pool");

        // Burn CDP
        balanceOf[msg.sender] -= cdpAmount;
        totalBurned += cdpAmount;
        totalSupply -= cdpAmount;

        // Transfer JOY
        (bool txSuccess, ) = joyToken.call(
            abi.encodeWithSignature("transfer(address,uint256)", msg.sender, joyAmount)
        );
        require(txSuccess, "JOY transfer failed");

        emit PointsConverted(msg.sender, cdpAmount, joyAmount);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Admin functions
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @dev Update the conversion rate (CDP per 1 JOY min-unit).
     */
    function setConversionRate(uint256 newRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRate > 0, "Rate must be > 0");
        uint256 oldRate = cdpPerJoy;
        cdpPerJoy = newRate;
        emit ConversionRateUpdated(oldRate, newRate);
    }

    /**
     * @dev Pause/unpause CDP → JOY conversions.
     */
    function setConversionsPaused(bool paused) external onlyRole(DEFAULT_ADMIN_ROLE) {
        conversionsPaused = paused;
        emit ConversionsPaused(paused);
    }

    /**
     * @dev Update the JOY token address (in case of migration).
     */
    function setJoyToken(address newJoy) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newJoy != address(0), "Invalid address");
        joyToken = newJoy;
    }

    /**
     * @dev Withdraw JOY tokens from the contract (admin only).
     */
    function withdrawJOY(uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) {
        (bool success, ) = joyToken.call(
            abi.encodeWithSignature("transfer(address,uint256)", msg.sender, amount)
        );
        require(success, "JOY withdrawal failed");
    }
}
