const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Subscription (C-4-1)', function () {
  let joy, sub, owner, treasury, user;

  beforeEach(async function () {
    [owner, treasury, user] = await ethers.getSigners();
    const JoyToken = await ethers.getContractFactory('JoyToken');
    joy = await JoyToken.deploy();
    await joy.waitForDeployment();

    const Subscription = await ethers.getContractFactory('Subscription');
    sub = await Subscription.deploy(await joy.getAddress(), treasury.address);
    await sub.waitForDeployment();

    // Pro plan: 29 JOY for 30 days.
    const price = ethers.parseUnits('29', 12);
    const duration = 30 * 24 * 60 * 60;
    await sub.createPlan(1, price, duration);

    // Fund + approve user.
    await joy.transfer(user.address, ethers.parseUnits('1000', 12));
    await joy.connect(user).approve(await sub.getAddress(), ethers.MaxUint256);
  });

  it('rejects subscription to an unknown / inactive plan', async function () {
    await expect(sub.connect(user).subscribe(99)).to.be.revertedWith('Plan not active');
  });

  it('charges treasury and extends expiry on subscribe', async function () {
    const tx = await sub.connect(user).subscribe(1);
    await tx.wait();
    expect(await joy.balanceOf(treasury.address)).to.equal(ethers.parseUnits('29', 12));
    const expiry = await sub.userSubscriptions(user.address, 1);
    const block = await ethers.provider.getBlock('latest');
    expect(Number(expiry)).to.be.gte(block.timestamp + 30 * 24 * 60 * 60 - 5);
  });

  it('stacks renewals — second subscribe extends from current expiry', async function () {
    await sub.connect(user).subscribe(1);
    const exp1 = await sub.userSubscriptions(user.address, 1);
    await sub.connect(user).subscribe(1);
    const exp2 = await sub.userSubscriptions(user.address, 1);
    expect(exp2 - exp1).to.equal(BigInt(30 * 24 * 60 * 60));
  });

  it('owner can update treasury address', async function () {
    await sub.setTreasury(owner.address);
    expect(await sub.treasuryWallet()).to.equal(owner.address);
  });

  it('non-owner cannot create plans', async function () {
    await expect(
      sub.connect(user).createPlan(2, ethers.parseUnits('1', 12), 60),
    ).to.be.reverted;
  });
});
