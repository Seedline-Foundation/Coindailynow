// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title ReputationSBT - Soulbound Token for Eco-Zone Merchant Reputation
 * @notice Feature 07: On-Chain Reputation & Merchant Scoring System
 * @dev Non-transferable ERC721 tokens representing merchant/trader reputation
 * 
 * Deployed on Polygon for low gas fees (essential for African users)
 * 
 * Badge Types:
 * - VERIFIED_MERCHANT: KYC completed, registered business
 * - ECO_EARLY_ADOPTER: Active before ECO official launch
 * - FAST_SETTLER: 95%+ same-day settlement rate
 * - HIGH_VOLUME_TRADER: Cumulative trade volume over $10,000 USD
 * - DISPUTE_FREE: 50+ transactions with zero disputes
 */
contract ReputationSBT is ERC721, AccessControl {
    using Counters for Counters.Counter;

    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    bytes32 public constant DISPUTE_RESOLVER_ROLE = keccak256("DISPUTE_RESOLVER_ROLE");
    bytes32 public constant ZK_VERIFIER_ROLE = keccak256("ZK_VERIFIER_ROLE");

    Counters.Counter private _tokenIdCounter;

    // Badge type enum
    enum BadgeType {
        NONE,
        VERIFIED_MERCHANT,
        ECO_EARLY_ADOPTER,
        FAST_SETTLER,
        HIGH_VOLUME_TRADER,
        DISPUTE_FREE
    }

    // Reputation score structure
    struct ReputationScore {
        uint256 totalTransactions;
        uint256 successfulTransactions;
        uint256 volumeUsd;           // Total volume in cents (avoid decimals)
        uint256 firstTxTimestamp;
        uint256 disputeCount;
        uint256 settlementScore;     // 0-100 representing % same-day settlement
        bool zkVerified;
        uint256 lastUpdated;
        BadgeType[] badges;
    }

    // Mapping from wallet address to token ID (one per wallet)
    mapping(address => uint256) public walletToToken;
    
    // Mapping from token ID to reputation data
    mapping(uint256 => ReputationScore) public reputations;
    
    // Mapping from wallet to badges earned
    mapping(address => mapping(BadgeType => bool)) public hasBadge;
    
    // Metadata URI base
    string private _baseTokenURI;

    // Events
    event ReputationMinted(address indexed merchant, uint256 indexed tokenId);
    event ReputationUpdated(address indexed merchant, uint256 newScore);
    event BadgeEarned(address indexed merchant, BadgeType badge);
    event DisputeRecorded(address indexed merchant, uint256 newDisputeCount);
    event ZKVerificationCompleted(address indexed merchant);

    constructor() ERC721("CoinDaily Eco-Zone Reputation", "CDREP") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(UPDATER_ROLE, msg.sender);
        _grantRole(DISPUTE_RESOLVER_ROLE, msg.sender);
        _grantRole(ZK_VERIFIER_ROLE, msg.sender);
    }

    /**
     * @notice Mint a new reputation SBT for a wallet (one-time, non-transferable)
     * @param to The wallet address to receive the SBT
     */
    function mintReputation(address to) external onlyRole(UPDATER_ROLE) returns (uint256) {
        require(walletToToken[to] == 0, "Wallet already has reputation token");
        require(to != address(0), "Cannot mint to zero address");

        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        _safeMint(to, tokenId);
        walletToToken[to] = tokenId;
        
        // Initialize reputation
        reputations[tokenId] = ReputationScore({
            totalTransactions: 0,
            successfulTransactions: 0,
            volumeUsd: 0,
            firstTxTimestamp: block.timestamp,
            disputeCount: 0,
            settlementScore: 100, // Start at 100%
            zkVerified: false,
            lastUpdated: block.timestamp,
            badges: new BadgeType[](0)
        });

        emit ReputationMinted(to, tokenId);
        return tokenId;
    }

    /**
     * @notice Update reputation based on completed transaction
     * @param merchant The merchant wallet address
     * @param volumeCentsUsd Transaction volume in USD cents
     * @param successful Whether the transaction completed successfully
     * @param sameDaySettlement Whether it was settled same day
     */
    function recordTransaction(
        address merchant,
        uint256 volumeCentsUsd,
        bool successful,
        bool sameDaySettlement
    ) external onlyRole(UPDATER_ROLE) {
        uint256 tokenId = walletToToken[merchant];
        require(tokenId != 0, "Merchant has no reputation token");

        ReputationScore storage rep = reputations[tokenId];
        
        rep.totalTransactions++;
        if (successful) {
            rep.successfulTransactions++;
        }
        rep.volumeUsd += volumeCentsUsd;
        
        // Update settlement score (weighted average)
        uint256 currentSameDayPct = sameDaySettlement ? 100 : 0;
        rep.settlementScore = (rep.settlementScore * (rep.totalTransactions - 1) + currentSameDayPct) / rep.totalTransactions;
        
        rep.lastUpdated = block.timestamp;

        // Check for badge eligibility
        _checkAndAwardBadges(merchant, tokenId);

        emit ReputationUpdated(merchant, calculateScore(merchant));
    }

    /**
     * @notice Record a dispute against a merchant
     * @param merchant The merchant wallet address
     */
    function recordDispute(address merchant) external onlyRole(DISPUTE_RESOLVER_ROLE) {
        uint256 tokenId = walletToToken[merchant];
        require(tokenId != 0, "Merchant has no reputation token");

        reputations[tokenId].disputeCount++;
        reputations[tokenId].lastUpdated = block.timestamp;

        emit DisputeRecorded(merchant, reputations[tokenId].disputeCount);
    }

    /**
     * @notice Mark a merchant as ZK-verified (privacy-preserving identity proof)
     * @param merchant The merchant wallet address
     */
    function setZKVerified(address merchant) external onlyRole(ZK_VERIFIER_ROLE) {
        uint256 tokenId = walletToToken[merchant];
        require(tokenId != 0, "Merchant has no reputation token");

        reputations[tokenId].zkVerified = true;
        reputations[tokenId].lastUpdated = block.timestamp;

        emit ZKVerificationCompleted(merchant);
        emit ReputationUpdated(merchant, calculateScore(merchant));
    }

    /**
     * @notice Award a specific badge to a merchant
     * @param merchant The merchant wallet address
     * @param badge The badge type to award
     */
    function awardBadge(address merchant, BadgeType badge) external onlyRole(UPDATER_ROLE) {
        require(badge != BadgeType.NONE, "Invalid badge type");
        require(!hasBadge[merchant][badge], "Badge already awarded");

        uint256 tokenId = walletToToken[merchant];
        require(tokenId != 0, "Merchant has no reputation token");

        hasBadge[merchant][badge] = true;
        reputations[tokenId].badges.push(badge);
        reputations[tokenId].lastUpdated = block.timestamp;

        emit BadgeEarned(merchant, badge);
    }

    /**
     * @notice Calculate reputation score (0-1000) based on Blueprint algorithm
     * @param walletAddress The wallet to calculate score for
     * @return score The calculated reputation score (0-1000)
     * 
     * Algorithm from Blueprint:
     * - success_rate = successful / max(total, 1) * 300
     * - volume_score = min(volumeUsd / 10000, 500)
     * - dispute_penalty = disputes * 50
     * - longevity_bonus = min(age_days / 30, 100)
     * - zk_bonus = 100 if verified else 0
     * - final = clamp(success + volume + longevity - dispute + zk, 0, 1000)
     */
    function calculateScore(address walletAddress) public view returns (uint256) {
        uint256 tokenId = walletToToken[walletAddress];
        if (tokenId == 0) return 0;

        ReputationScore storage rep = reputations[tokenId];
        
        // Success rate component (max 300 points)
        uint256 totalTx = rep.totalTransactions > 0 ? rep.totalTransactions : 1;
        uint256 successRate = (rep.successfulTransactions * 300) / totalTx;
        
        // Volume score component (max 500 points, $10,000 = max)
        // volumeUsd is in cents, so $10,000 = 1,000,000 cents
        uint256 volumeScore = rep.volumeUsd / 2000; // Divide by 2000 to get 0-500 range
        if (volumeScore > 500) volumeScore = 500;
        
        // Longevity bonus (max 100 points, 1 point per 30 days up to 100)
        uint256 ageSeconds = block.timestamp - rep.firstTxTimestamp;
        uint256 ageDays = ageSeconds / 86400;
        uint256 longevityBonus = ageDays / 30;
        if (longevityBonus > 100) longevityBonus = 100;
        
        // Dispute penalty (50 points per dispute)
        uint256 disputePenalty = rep.disputeCount * 50;
        
        // ZK verification bonus
        uint256 zkBonus = rep.zkVerified ? 100 : 0;
        
        // Calculate final score
        uint256 rawScore = successRate + volumeScore + longevityBonus + zkBonus;
        
        // Apply penalty (prevent underflow)
        if (disputePenalty >= rawScore) {
            return 0;
        }
        uint256 finalScore = rawScore - disputePenalty;
        
        // Clamp to 0-1000
        return finalScore > 1000 ? 1000 : finalScore;
    }

    /**
     * @notice Get full reputation data for a wallet
     */
    function getReputation(address walletAddress) external view returns (
        uint256 score,
        uint256 totalTransactions,
        uint256 successfulTransactions,
        uint256 volumeUsd,
        uint256 disputeCount,
        uint256 settlementScore,
        bool zkVerified,
        uint256 badgeCount
    ) {
        uint256 tokenId = walletToToken[walletAddress];
        if (tokenId == 0) {
            return (0, 0, 0, 0, 0, 0, false, 0);
        }

        ReputationScore storage rep = reputations[tokenId];
        return (
            calculateScore(walletAddress),
            rep.totalTransactions,
            rep.successfulTransactions,
            rep.volumeUsd,
            rep.disputeCount,
            rep.settlementScore,
            rep.zkVerified,
            rep.badges.length
        );
    }

    /**
     * @notice Get badges earned by a wallet
     */
    function getBadges(address walletAddress) external view returns (BadgeType[] memory) {
        uint256 tokenId = walletToToken[walletAddress];
        if (tokenId == 0) {
            return new BadgeType[](0);
        }
        return reputations[tokenId].badges;
    }

    /**
     * @notice Check if wallet has a specific badge
     */
    function checkBadge(address walletAddress, BadgeType badge) external view returns (bool) {
        return hasBadge[walletAddress][badge];
    }

    /**
     * @dev Internal function to check and award eligible badges
     */
    function _checkAndAwardBadges(address merchant, uint256 tokenId) internal {
        ReputationScore storage rep = reputations[tokenId];

        // HIGH_VOLUME_TRADER: $10,000+ USD volume (1,000,000 cents)
        if (!hasBadge[merchant][BadgeType.HIGH_VOLUME_TRADER] && rep.volumeUsd >= 1000000) {
            hasBadge[merchant][BadgeType.HIGH_VOLUME_TRADER] = true;
            rep.badges.push(BadgeType.HIGH_VOLUME_TRADER);
            emit BadgeEarned(merchant, BadgeType.HIGH_VOLUME_TRADER);
        }

        // FAST_SETTLER: 95%+ same-day settlement rate
        if (!hasBadge[merchant][BadgeType.FAST_SETTLER] && 
            rep.settlementScore >= 95 && 
            rep.totalTransactions >= 20) {
            hasBadge[merchant][BadgeType.FAST_SETTLER] = true;
            rep.badges.push(BadgeType.FAST_SETTLER);
            emit BadgeEarned(merchant, BadgeType.FAST_SETTLER);
        }

        // DISPUTE_FREE: 50+ transactions with zero disputes
        if (!hasBadge[merchant][BadgeType.DISPUTE_FREE] && 
            rep.totalTransactions >= 50 && 
            rep.disputeCount == 0) {
            hasBadge[merchant][BadgeType.DISPUTE_FREE] = true;
            rep.badges.push(BadgeType.DISPUTE_FREE);
            emit BadgeEarned(merchant, BadgeType.DISPUTE_FREE);
        }
    }

    /**
     * @dev Override transfer to make token soulbound (non-transferable)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override {
        require(from == address(0) || to == address(0), "Soulbound: non-transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev Required override for AccessControl + ERC721
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice Set base URI for token metadata
     */
    function setBaseURI(string memory baseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseTokenURI = baseURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }
}
