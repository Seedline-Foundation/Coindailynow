const { expect } = require('chai');
const { ethers } = require('hardhat');
const { time } = require('@nomicfoundation/hardhat-network-helpers');

describe('VestingWallet', function () {
  let joy, vesting, deployer, beneficiary;
  const ALLOCATION = ethers.parseUnits('100000', 12);
  const CLIFF = 90 * 24 * 3600; // 90 days
  const DURATION = 365 * 24 * 3600; // 1 year
  let startTime;

  beforeEach(async function () {
    [deployer, beneficiary] = await ethers.getSigners();

    const JoyToken = await ethers.getContractFactory('JoyToken');
    joy = await JoyToken.deploy();
    await joy.waitForDeployment();

    startTime = BigInt(await time.latest()) + 10n;

    // Pre-fund a temporary address that will become the vesting contract
    // VestingWallet reads token.balanceOf(address(this)) in constructor,
    // so we deploy first, then fund, then the allocation = 0.
    // To have allocation > 0 at construction we need to predict the address
    // or accept allocation = 0 and rely on _totalAllocation().

    const VestingWallet = await ethers.getContractFactory('VestingWallet');
    vesting = await VestingWallet.deploy(
      await joy.getAddress(),
      beneficiary.address,
      startTime,
      CLIFF,
      DURATION,
    );
    await vesting.waitForDeployment();

    // Fund the vesting contract after deployment
    await joy.transfer(await vesting.getAddress(), ALLOCATION);
  });

  describe('Deployment', function () {
    it('sets immutable fields correctly', async function () {
      expect(await vesting.token()).to.equal(await joy.getAddress());
      expect(await vesting.beneficiary()).to.equal(beneficiary.address);
      expect(await vesting.start()).to.equal(startTime);
      expect(await vesting.cliffEnd()).to.equal(startTime + BigInt(CLIFF));
      expect(await vesting.end()).to.equal(startTime + BigInt(DURATION));
    });

    it('reverts with zero token address', async function () {
      const VW = await ethers.getContractFactory('VestingWallet');
      await expect(
        VW.deploy(ethers.ZeroAddress, beneficiary.address, startTime, CLIFF, DURATION),
      ).to.be.revertedWith('zero addr');
    });

    it('reverts with zero beneficiary', async function () {
      const VW = await ethers.getContractFactory('VestingWallet');
      await expect(
        VW.deploy(await joy.getAddress(), ethers.ZeroAddress, startTime, CLIFF, DURATION),
      ).to.be.revertedWith('zero addr');
    });

    it('reverts when duration is zero', async function () {
      const VW = await ethers.getContractFactory('VestingWallet');
      await expect(
        VW.deploy(await joy.getAddress(), beneficiary.address, startTime, 0, 0),
      ).to.be.revertedWith('duration=0');
    });

    it('reverts when cliff > duration', async function () {
      const VW = await ethers.getContractFactory('VestingWallet');
      await expect(
        VW.deploy(await joy.getAddress(), beneficiary.address, startTime, DURATION + 1, DURATION),
      ).to.be.revertedWith('cliff>duration');
    });
  });

  describe('Cliff', function () {
    it('nothing vested before cliff', async function () {
      await time.increaseTo(startTime + BigInt(CLIFF) - 1n);
      expect(await vesting.vestedAmount(startTime + BigInt(CLIFF) - 1n)).to.equal(0);
    });

    it('vested amount > 0 at cliff', async function () {
      const ts = startTime + BigInt(CLIFF);
      const vested = await vesting.vestedAmount(ts);
      expect(vested).to.be.gt(0);
    });
  });

  describe('Linear vesting', function () {
    it('fully vested at end', async function () {
      const endTs = startTime + BigInt(DURATION);
      expect(await vesting.vestedAmount(endTs)).to.equal(ALLOCATION);
    });

    it('approximately 50% vested at midpoint', async function () {
      const midTs = startTime + BigInt(DURATION) / 2n;
      const vested = await vesting.vestedAmount(midTs);
      const expected = ALLOCATION / 2n;
      // Allow 1% tolerance
      const tolerance = ALLOCATION / 100n;
      expect(vested).to.be.closeTo(expected, tolerance);
    });
  });

  describe('Release', function () {
    it('reverts when nothing to release (before cliff)', async function () {
      await expect(vesting.release()).to.be.revertedWith('nothing to release');
    });

    it('releases tokens after cliff', async function () {
      await time.increaseTo(startTime + BigInt(CLIFF) + 1n);
      const balBefore = await joy.balanceOf(beneficiary.address);
      await vesting.release();
      const balAfter = await joy.balanceOf(beneficiary.address);
      expect(balAfter - balBefore).to.be.gt(0);
    });

    it('releases full allocation after end', async function () {
      await time.increaseTo(startTime + BigInt(DURATION) + 1n);
      await vesting.release();
      expect(await joy.balanceOf(beneficiary.address)).to.equal(ALLOCATION);
      expect(await vesting.released()).to.equal(ALLOCATION);
    });
  });

  describe('Revocation', function () {
    it('owner can revoke', async function () {
      await time.increaseTo(startTime + BigInt(CLIFF) + 1n);
      await expect(vesting.revoke()).to.emit(vesting, 'VestingRevoked');
      expect(await vesting.revoked()).to.be.true;
    });

    it('reverts double revoke', async function () {
      await vesting.revoke();
      await expect(vesting.revoke()).to.be.revertedWith('already revoked');
    });

    it('non-owner cannot revoke', async function () {
      await expect(
        vesting.connect(beneficiary).revoke(),
      ).to.be.revertedWithCustomError(vesting, 'OwnableUnauthorizedAccount');
    });
  });
});
