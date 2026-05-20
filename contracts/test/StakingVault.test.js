const { expect } = require('chai');
const { ethers } = require('hardhat');
const { time } = require('@nomicfoundation/hardhat-network-helpers');

describe('StakingVault', function () {
  let joy, vault, deployer, alice, bob;
  const TIER_ID = 1;
  const LOCKUP = 30 * 24 * 3600; // 30 days
  const MULTIPLIER = 500; // 5 % reward (500 / 10000)
  const STAKE_AMT = ethers.parseUnits('10000', 12);

  beforeEach(async function () {
    [deployer, alice, bob] = await ethers.getSigners();

    const JoyToken = await ethers.getContractFactory('JoyToken');
    joy = await JoyToken.deploy();
    await joy.waitForDeployment();

    const StakingVault = await ethers.getContractFactory('StakingVault');
    vault = await StakingVault.deploy(await joy.getAddress());
    await vault.waitForDeployment();

    // Setup tier
    await vault.addTier(TIER_ID, LOCKUP, MULTIPLIER);

    // Fund alice for staking
    await joy.transfer(alice.address, STAKE_AMT * 2n);
    await joy.connect(alice).approve(await vault.getAddress(), ethers.MaxUint256);

    // Fund vault reward pool
    const rewardFund = ethers.parseUnits('1000000', 12);
    await joy.approve(await vault.getAddress(), rewardFund);
    await vault.fundRewardPool(rewardFund);
  });

  describe('Deployment', function () {
    it('sets joyToken address', async function () {
      expect(await vault.joyToken()).to.equal(await joy.getAddress());
    });

    it('sets deployer as owner', async function () {
      expect(await vault.owner()).to.equal(deployer.address);
    });
  });

  describe('Tier management', function () {
    it('owner can add a tier', async function () {
      const tier = await vault.tiers(TIER_ID);
      expect(tier.lockupDuration).to.equal(LOCKUP);
      expect(tier.rewardMultiplier).to.equal(MULTIPLIER);
      expect(tier.isAllowed).to.equal(true);
    });

    it('non-owner cannot add a tier', async function () {
      await expect(
        vault.connect(alice).addTier(2, 60, 100),
      ).to.be.revertedWithCustomError(vault, 'OwnableUnauthorizedAccount');
    });
  });

  describe('Staking', function () {
    it('allows a user to stake', async function () {
      await expect(vault.connect(alice).stake(STAKE_AMT, TIER_ID))
        .to.emit(vault, 'Staked');
      expect(await vault.totalStaked()).to.equal(STAKE_AMT);
    });

    it('reverts on zero amount', async function () {
      await expect(
        vault.connect(alice).stake(0, TIER_ID),
      ).to.be.revertedWith('Amount must be > 0');
    });

    it('reverts on invalid tier', async function () {
      await expect(
        vault.connect(alice).stake(STAKE_AMT, 99),
      ).to.be.revertedWith('Invalid tier');
    });
  });

  describe('Unstaking', function () {
    beforeEach(async function () {
      await vault.connect(alice).stake(STAKE_AMT, TIER_ID);
    });

    it('reverts before lockup ends', async function () {
      await expect(
        vault.connect(alice).unstake(0),
      ).to.be.revertedWith('Lockup not ended');
    });

    it('allows unstake after lockup with reward', async function () {
      await time.increase(LOCKUP);
      const balBefore = await joy.balanceOf(alice.address);
      await vault.connect(alice).unstake(0);
      const balAfter = await joy.balanceOf(alice.address);

      const expectedReward = (STAKE_AMT * BigInt(MULTIPLIER)) / 10000n;
      expect(balAfter - balBefore).to.equal(STAKE_AMT + expectedReward);
      expect(await vault.totalStaked()).to.equal(0);
    });

    it('reverts when already claimed', async function () {
      await time.increase(LOCKUP);
      await vault.connect(alice).unstake(0);
      await expect(
        vault.connect(alice).unstake(0),
      ).to.be.revertedWith('Already claimed');
    });

    it('reverts on invalid stake index', async function () {
      await expect(
        vault.connect(alice).unstake(99),
      ).to.be.revertedWith('Invalid stake index');
    });
  });

  describe('Reward pool funding', function () {
    it('owner can fund reward pool', async function () {
      const extra = ethers.parseUnits('5000', 12);
      await joy.approve(await vault.getAddress(), extra);
      await expect(vault.fundRewardPool(extra))
        .to.emit(vault, 'RewardPoolFunded');
      expect(await vault.rewardPoolBalance()).to.be.gt(0);
    });

    it('reverts funding with zero amount', async function () {
      await expect(
        vault.fundRewardPool(0),
      ).to.be.revertedWith('Amount must be > 0');
    });

    it('non-owner cannot fund reward pool', async function () {
      await expect(
        vault.connect(alice).fundRewardPool(1n),
      ).to.be.revertedWithCustomError(vault, 'OwnableUnauthorizedAccount');
    });
  });

  describe('Emergency withdraw', function () {
    it('owner can emergency withdraw', async function () {
      const amt = ethers.parseUnits('100', 12);
      await vault.emergencyWithdraw(amt);
    });

    it('non-owner cannot emergency withdraw', async function () {
      await expect(
        vault.connect(alice).emergencyWithdraw(1n),
      ).to.be.revertedWithCustomError(vault, 'OwnableUnauthorizedAccount');
    });
  });
});
