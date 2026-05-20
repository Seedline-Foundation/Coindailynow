const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('StakingVault (C-4-1)', function () {
  let joy, vault, owner, alice;

  beforeEach(async function () {
    [owner, alice] = await ethers.getSigners();
    const JoyToken = await ethers.getContractFactory('JoyToken');
    joy = await JoyToken.deploy();
    await joy.waitForDeployment();

    const StakingVault = await ethers.getContractFactory('StakingVault');
    vault = await StakingVault.deploy(await joy.getAddress());
    await vault.waitForDeployment();

    // Tier 1: 30-day lockup, 1.5x multiplier (150 bps).
    await vault.addTier(1, 30 * 24 * 60 * 60, 150);

    // Seed alice and the vault.
    const oneM = ethers.parseUnits('1000000', 12);
    await joy.transfer(alice.address, oneM);
    await joy.transfer(await vault.getAddress(), oneM);
  });

  it('rejects staking on an unconfigured tier', async function () {
    const amt = ethers.parseUnits('100', 12);
    await joy.connect(alice).approve(await vault.getAddress(), amt);
    await expect(vault.connect(alice).stake(amt, 99)).to.be.revertedWith('Invalid tier');
  });

  it('lets a user stake and unstake after lockup with reward', async function () {
    const amt = ethers.parseUnits('1000', 12);
    await joy.connect(alice).approve(await vault.getAddress(), amt);
    await vault.connect(alice).stake(amt, 1);

    expect(await vault.totalStaked()).to.equal(amt);

    // Fast-forward 30 days + 1.
    await ethers.provider.send('evm_increaseTime', [30 * 24 * 60 * 60 + 1]);
    await ethers.provider.send('evm_mine', []);

    const balBefore = await joy.balanceOf(alice.address);
    await vault.connect(alice).unstake(0);
    const balAfter = await joy.balanceOf(alice.address);
    // Principal + 1.5% reward (150 bps / 10000 of amount).
    const expected = amt + (amt * 150n) / 10000n;
    expect(balAfter - balBefore).to.equal(expected);
  });

  it('refuses unstake before lockup ends', async function () {
    const amt = ethers.parseUnits('500', 12);
    await joy.connect(alice).approve(await vault.getAddress(), amt);
    await vault.connect(alice).stake(amt, 1);
    await expect(vault.connect(alice).unstake(0)).to.be.revertedWith('Lockup not ended');
  });

  it('owner can fund the reward pool and reads pool balance', async function () {
    const amt = ethers.parseUnits('100000', 12);
    await joy.approve(await vault.getAddress(), amt);
    await vault.fundRewards(amt);
    expect(await vault.rewardPoolBalance()).to.be.gte(amt);
  });

  it('non-owner cannot add tiers', async function () {
    await expect(vault.connect(alice).addTier(2, 60, 100)).to.be.reverted;
  });
});
