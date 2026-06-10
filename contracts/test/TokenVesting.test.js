const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('TokenVesting (C-4-1)', function () {
  let joy, vesting, owner, beneficiary;
  const TOTAL = ethers.parseUnits('1000000', 12);
  const DURATION = 365 * 24 * 60 * 60; // 1 year

  beforeEach(async function () {
    [owner, beneficiary] = await ethers.getSigners();
    const JoyToken = await ethers.getContractFactory('JoyToken');
    joy = await JoyToken.deploy();
    await joy.waitForDeployment();

    const start = (await ethers.provider.getBlock('latest')).timestamp + 60;

    await joy.approve(beneficiary.address, 0); // sanity reset
    const TokenVesting = await ethers.getContractFactory('TokenVesting');
    await joy.approve(owner.address, TOTAL);
    // The vesting constructor pulls TOTAL from the deployer; allow it.
    await joy.approve(await ethers.resolveAddress(joy), TOTAL); // self-allowance no-op
    await joy.approve((await joy.getAddress()), TOTAL);

    // Approve the future vesting address — predict it to grant allowance.
    // Easier: use approve to a dynamically-deployed contract: we approve on
    // the deployer then deploy; OZ SafeERC20.safeTransferFrom will pull from
    // the deployer who is msg.sender = constructor caller.
    await joy.approve(owner.address, TOTAL);
    // Predict address via nonce. Hardhat default deterministic.
    const factoryNonce = await ethers.provider.getTransactionCount(owner.address);
    const expectedVestingAddr = ethers.getCreateAddress({
      from: owner.address,
      nonce: factoryNonce + 1,
    });
    await joy.approve(expectedVestingAddr, TOTAL);

    vesting = await TokenVesting.deploy(
      await joy.getAddress(),
      beneficiary.address,
      TOTAL,
      start,
      DURATION,
    );
    await vesting.waitForDeployment();
    expect(await vesting.getAddress()).to.equal(expectedVestingAddr);
  });

  it('reverts release before start', async function () {
    await expect(vesting.release()).to.be.revertedWith('nothing to release');
  });

  it('linearly vests over duration', async function () {
    // Halfway.
    await ethers.provider.send('evm_increaseTime', [60 + DURATION / 2]);
    await ethers.provider.send('evm_mine', []);
    const releasable = await vesting.releasable();
    // Allow ±1% tolerance (block-timestamp granularity).
    const expected = TOTAL / 2n;
    const diff = expected > releasable ? expected - releasable : releasable - expected;
    expect(diff).to.be.lt(TOTAL / 100n);
  });

  it('fully vests after duration and pays beneficiary', async function () {
    await ethers.provider.send('evm_increaseTime', [60 + DURATION + 1]);
    await ethers.provider.send('evm_mine', []);
    expect(await vesting.releasable()).to.equal(TOTAL);
    const before = await joy.balanceOf(beneficiary.address);
    await vesting.release();
    expect(await joy.balanceOf(beneficiary.address)).to.equal(before + TOTAL);
  });
});
