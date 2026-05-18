const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('ReputationSBT', function () {
  let sbt, deployer, updater, merchant, other;

  beforeEach(async function () {
    [deployer, updater, merchant, other] = await ethers.getSigners();

    const ReputationSBT = await ethers.getContractFactory('ReputationSBT');
    sbt = await ReputationSBT.deploy();
    await sbt.waitForDeployment();

    const UPDATER = await sbt.UPDATER_ROLE();
    await sbt.grantRole(UPDATER, updater.address);
  });

  describe('Deployment', function () {
    it('has correct name and symbol', async function () {
      expect(await sbt.name()).to.equal('CoinDaily Eco-Zone Reputation');
      expect(await sbt.symbol()).to.equal('CDREP');
    });

    it('deployer has all admin roles', async function () {
      expect(await sbt.hasRole(await sbt.DEFAULT_ADMIN_ROLE(), deployer.address)).to.be.true;
      expect(await sbt.hasRole(await sbt.UPDATER_ROLE(), deployer.address)).to.be.true;
      expect(await sbt.hasRole(await sbt.DISPUTE_RESOLVER_ROLE(), deployer.address)).to.be.true;
      expect(await sbt.hasRole(await sbt.ZK_VERIFIER_ROLE(), deployer.address)).to.be.true;
    });
  });

  describe('Minting', function () {
    it('updater can mint reputation SBT', async function () {
      await expect(sbt.connect(updater).mintReputation(merchant.address))
        .to.emit(sbt, 'ReputationMinted');

      expect(await sbt.walletToToken(merchant.address)).to.equal(1);
      expect(await sbt.ownerOf(1)).to.equal(merchant.address);
    });

    it('reverts minting to zero address', async function () {
      await expect(
        sbt.connect(updater).mintReputation(ethers.ZeroAddress),
      ).to.be.revertedWith('Cannot mint to zero address');
    });

    it('reverts duplicate mint for same wallet', async function () {
      await sbt.connect(updater).mintReputation(merchant.address);
      await expect(
        sbt.connect(updater).mintReputation(merchant.address),
      ).to.be.revertedWith('Wallet already has reputation token');
    });

    it('non-updater cannot mint', async function () {
      await expect(
        sbt.connect(other).mintReputation(merchant.address),
      ).to.be.revertedWithCustomError(sbt, 'AccessControlUnauthorizedAccount');
    });
  });

  describe('Soulbound (non-transferable)', function () {
    beforeEach(async function () {
      await sbt.connect(updater).mintReputation(merchant.address);
    });

    it('transfer to another address is blocked', async function () {
      await expect(
        sbt.connect(merchant).transferFrom(merchant.address, other.address, 1),
      ).to.be.revertedWith('Soulbound: non-transferable');
    });

    it('safeTransferFrom is also blocked', async function () {
      await expect(
        sbt.connect(merchant)['safeTransferFrom(address,address,uint256)'](
          merchant.address,
          other.address,
          1,
        ),
      ).to.be.revertedWith('Soulbound: non-transferable');
    });
  });

  describe('Record transaction & scoring', function () {
    beforeEach(async function () {
      await sbt.connect(updater).mintReputation(merchant.address);
    });

    it('records a successful transaction', async function () {
      await expect(
        sbt.connect(updater).recordTransaction(merchant.address, 50000, true, true),
      ).to.emit(sbt, 'ReputationUpdated');

      const rep = await sbt.getReputation(merchant.address);
      expect(rep.totalTransactions).to.equal(1);
      expect(rep.successfulTransactions).to.equal(1);
      expect(rep.volumeUsd).to.equal(50000);
    });

    it('reverts for merchant without token', async function () {
      await expect(
        sbt.connect(updater).recordTransaction(other.address, 100, true, true),
      ).to.be.revertedWith('Merchant has no reputation token');
    });

    it('score is zero for unregistered wallet', async function () {
      expect(await sbt.calculateScore(other.address)).to.equal(0);
    });
  });

  describe('Dispute recording', function () {
    beforeEach(async function () {
      await sbt.connect(updater).mintReputation(merchant.address);
    });

    it('dispute resolver can record dispute', async function () {
      await expect(sbt.recordDispute(merchant.address))
        .to.emit(sbt, 'DisputeRecorded');

      const rep = await sbt.getReputation(merchant.address);
      expect(rep.disputeCount).to.equal(1);
    });
  });

  describe('ZK verification', function () {
    beforeEach(async function () {
      await sbt.connect(updater).mintReputation(merchant.address);
    });

    it('zk verifier can set verified', async function () {
      await expect(sbt.setZKVerified(merchant.address))
        .to.emit(sbt, 'ZKVerificationCompleted');

      const rep = await sbt.getReputation(merchant.address);
      expect(rep.zkVerified).to.be.true;
    });
  });

  describe('Badges', function () {
    beforeEach(async function () {
      await sbt.connect(updater).mintReputation(merchant.address);
    });

    it('updater can award badge manually', async function () {
      await expect(sbt.connect(updater).awardBadge(merchant.address, 1)) // VERIFIED_MERCHANT
        .to.emit(sbt, 'BadgeEarned');
      expect(await sbt.checkBadge(merchant.address, 1)).to.be.true;
    });

    it('reverts awarding NONE badge', async function () {
      await expect(
        sbt.connect(updater).awardBadge(merchant.address, 0),
      ).to.be.revertedWith('Invalid badge type');
    });

    it('reverts duplicate badge', async function () {
      await sbt.connect(updater).awardBadge(merchant.address, 1);
      await expect(
        sbt.connect(updater).awardBadge(merchant.address, 1),
      ).to.be.revertedWith('Badge already awarded');
    });

    it('getBadges returns correct list', async function () {
      await sbt.connect(updater).awardBadge(merchant.address, 1);
      await sbt.connect(updater).awardBadge(merchant.address, 2);
      const badges = await sbt.getBadges(merchant.address);
      expect(badges.length).to.equal(2);
    });

    it('getBadges returns empty for unknown wallet', async function () {
      const badges = await sbt.getBadges(other.address);
      expect(badges.length).to.equal(0);
    });
  });

  describe('supportsInterface', function () {
    it('supports ERC721 and AccessControl', async function () {
      // ERC721 interfaceId = 0x80ac58cd
      expect(await sbt.supportsInterface('0x80ac58cd')).to.be.true;
      // AccessControl interfaceId = 0x7965db0b
      expect(await sbt.supportsInterface('0x7965db0b')).to.be.true;
    });
  });
});
