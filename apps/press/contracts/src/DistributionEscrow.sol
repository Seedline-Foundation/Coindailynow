// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title DistributionEscrow
 * @notice Escrow contract for SENDPRESS PR distribution payments
 * @dev Locks JOY tokens during PR distribution, releases on verification
 */
contract DistributionEscrow is AccessControl, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");

    IERC20 public immutable joyToken;
    
    // Platform fee percentage (basis points, 100 = 1%)
    uint256 public platformFeeBps = 500; // 5% default
    address public feeRecipient;
    
    // Distribution status
    enum DistributionStatus {
        Pending,
        Processing,
        Verified,
        Released,
        Refunded,
        Failed
    }
    
    struct Distribution {
        address publisher;
        uint256 totalAmount;
        uint256 feeAmount;
        uint256 partnerAmount;
        address[] partners;
        uint256[] partnerShares;
        DistributionStatus status;
        uint256 createdAt;
        uint256 verifiedAt;
        uint256 releasedAt;
    }
    
    // distributionId => Distribution
    mapping(bytes32 => Distribution) public distributions;
    
    // Track publisher deposits
    mapping(address => uint256) public publisherBalances;
    
    // Events
    event CreditsLocked(
        bytes32 indexed distributionId,
        address indexed publisher,
        uint256 amount,
        uint256 fee
    );
    
    event DistributionVerified(
        bytes32 indexed distributionId,
        address indexed verifier
    );
    
    event CreditsReleased(
        bytes32 indexed distributionId,
        address indexed beneficiary,
        uint256 amount
    );
    
    event CreditsRefunded(
        bytes32 indexed distributionId,
        address indexed publisher,
        uint256 amount
    );
    
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address oldRecipient, address newRecipient);

    constructor(address _joyToken, address _feeRecipient) {
        require(_joyToken != address(0), "Invalid token address");
        require(_feeRecipient != address(0), "Invalid fee recipient");
        
        joyToken = IERC20(_joyToken);
        feeRecipient = _feeRecipient;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    /**
     * @notice Lock credits for a distribution
     * @param distributionId Unique distribution ID
     * @param partners Array of partner addresses to receive payments
     * @param partnerShares Array of payment shares for each partner
     */
    function lockCredits(
        bytes32 distributionId,
        address[] calldata partners,
        uint256[] calldata partnerShares
    ) external nonReentrant whenNotPaused {
        require(distributions[distributionId].publisher == address(0), "Distribution exists");
        require(partners.length > 0, "No partners");
        require(partners.length == partnerShares.length, "Length mismatch");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < partnerShares.length; i++) {
            require(partners[i] != address(0), "Invalid partner");
            totalAmount += partnerShares[i];
        }
        require(totalAmount > 0, "Zero amount");
        
        // Calculate platform fee
        uint256 feeAmount = (totalAmount * platformFeeBps) / 10000;
        uint256 totalRequired = totalAmount + feeAmount;
        
        // Transfer tokens to escrow
        joyToken.safeTransferFrom(msg.sender, address(this), totalRequired);
        
        // Create distribution record
        distributions[distributionId] = Distribution({
            publisher: msg.sender,
            totalAmount: totalRequired,
            feeAmount: feeAmount,
            partnerAmount: totalAmount,
            partners: partners,
            partnerShares: partnerShares,
            status: DistributionStatus.Pending,
            createdAt: block.timestamp,
            verifiedAt: 0,
            releasedAt: 0
        });
        
        emit CreditsLocked(distributionId, msg.sender, totalRequired, feeAmount);
    }

    /**
     * @notice Mark distribution as verified (called by AI verification service)
     * @param distributionId Distribution ID to verify
     */
    function verifyDistribution(bytes32 distributionId) 
        external 
        onlyRole(VERIFIER_ROLE) 
    {
        Distribution storage dist = distributions[distributionId];
        require(dist.publisher != address(0), "Distribution not found");
        require(dist.status == DistributionStatus.Pending || dist.status == DistributionStatus.Processing, "Invalid status");
        
        dist.status = DistributionStatus.Verified;
        dist.verifiedAt = block.timestamp;
        
        emit DistributionVerified(distributionId, msg.sender);
    }

    /**
     * @notice Release locked credits to partners after verification
     * @param distributionId Distribution ID to release
     */
    function release(bytes32 distributionId) 
        external 
        nonReentrant 
        onlyRole(ADMIN_ROLE) 
    {
        Distribution storage dist = distributions[distributionId];
        require(dist.publisher != address(0), "Distribution not found");
        require(dist.status == DistributionStatus.Verified, "Not verified");
        
        dist.status = DistributionStatus.Released;
        dist.releasedAt = block.timestamp;
        
        // Transfer fee to platform
        if (dist.feeAmount > 0) {
            joyToken.safeTransfer(feeRecipient, dist.feeAmount);
        }
        
        // Transfer to each partner
        for (uint256 i = 0; i < dist.partners.length; i++) {
            if (dist.partnerShares[i] > 0) {
                joyToken.safeTransfer(dist.partners[i], dist.partnerShares[i]);
                emit CreditsReleased(distributionId, dist.partners[i], dist.partnerShares[i]);
            }
        }
    }

    /**
     * @notice Refund locked credits to publisher
     * @param distributionId Distribution ID to refund
     */
    function refund(bytes32 distributionId) 
        external 
        nonReentrant 
        onlyRole(ADMIN_ROLE) 
    {
        Distribution storage dist = distributions[distributionId];
        require(dist.publisher != address(0), "Distribution not found");
        require(
            dist.status == DistributionStatus.Pending || 
            dist.status == DistributionStatus.Processing ||
            dist.status == DistributionStatus.Failed, 
            "Cannot refund"
        );
        
        dist.status = DistributionStatus.Refunded;
        
        // Refund full amount to publisher
        joyToken.safeTransfer(dist.publisher, dist.totalAmount);
        
        emit CreditsRefunded(distributionId, dist.publisher, dist.totalAmount);
    }

    /**
     * @notice Get locked amount for a distribution
     */
    function getLockedAmount(bytes32 distributionId) external view returns (uint256) {
        Distribution storage dist = distributions[distributionId];
        if (dist.status == DistributionStatus.Pending || 
            dist.status == DistributionStatus.Processing ||
            dist.status == DistributionStatus.Verified) {
            return dist.totalAmount;
        }
        return 0;
    }

    /**
     * @notice Get distribution details
     */
    function getDistribution(bytes32 distributionId) external view returns (
        address publisher,
        uint256 totalAmount,
        uint256 feeAmount,
        DistributionStatus status,
        uint256 createdAt,
        uint256 verifiedAt
    ) {
        Distribution storage dist = distributions[distributionId];
        return (
            dist.publisher,
            dist.totalAmount,
            dist.feeAmount,
            dist.status,
            dist.createdAt,
            dist.verifiedAt
        );
    }

    /**
     * @notice Get partners for a distribution
     */
    function getDistributionPartners(bytes32 distributionId) 
        external 
        view 
        returns (address[] memory, uint256[] memory) 
    {
        Distribution storage dist = distributions[distributionId];
        return (dist.partners, dist.partnerShares);
    }

    // Admin functions
    
    function setPlatformFee(uint256 newFeeBps) external onlyRole(ADMIN_ROLE) {
        require(newFeeBps <= 2000, "Fee too high"); // Max 20%
        emit PlatformFeeUpdated(platformFeeBps, newFeeBps);
        platformFeeBps = newFeeBps;
    }
    
    function setFeeRecipient(address newRecipient) external onlyRole(ADMIN_ROLE) {
        require(newRecipient != address(0), "Invalid address");
        emit FeeRecipientUpdated(feeRecipient, newRecipient);
        feeRecipient = newRecipient;
    }
    
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Emergency withdraw stuck tokens (admin only)
     */
    function emergencyWithdraw(address token, uint256 amount) 
        external 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        IERC20(token).safeTransfer(msg.sender, amount);
    }
}
