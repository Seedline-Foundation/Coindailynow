const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('CoinDailyTimelock (C-4-1)', function () {
  it('exposes the OZ TimelockController surface with the configured delay', async function () {
    const [admin, alice] = await ethers.getSigners();
    const Timelock = await ethers.getContractFactory('CoinDailyTimelock');
    const timelock = await Timelock.deploy(
      60 * 60, // 1-hour delay
      [admin.address],
      [admin.address],
      admin.address,
    );
    await timelock.waitForDeployment();

    expect(await timelock.getMinDelay()).to.equal(BigInt(60 * 60));

    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    expect(await timelock.hasRole(PROPOSER_ROLE, admin.address)).to.equal(true);
    expect(await timelock.hasRole(EXECUTOR_ROLE, admin.address)).to.equal(true);
    expect(await timelock.hasRole(PROPOSER_ROLE, alice.address)).to.equal(false);
  });

  it('schedules and refuses early execution', async function () {
    const [admin] = await ethers.getSigners();
    const Timelock = await ethers.getContractFactory('CoinDailyTimelock');
    const delay = 60 * 60; // 1h
    const timelock = await Timelock.deploy(
      delay,
      [admin.address],
      [admin.address],
      admin.address,
    );
    await timelock.waitForDeployment();

    // Schedule a no-op call to itself (just to exercise scheduling).
    const target = await timelock.getAddress();
    const value = 0;
    const data = '0x';
    const predecessor = ethers.ZeroHash;
    const salt = ethers.id('noop-test');

    await timelock.schedule(target, value, data, predecessor, salt, delay);

    await expect(
      timelock.execute(target, value, data, predecessor, salt),
    ).to.be.reverted;
  });
});
