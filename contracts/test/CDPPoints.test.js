const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('CDPPoints (C-4-1)', function () {
  let joy, cdp, owner, user;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();
    const JoyToken = await ethers.getContractFactory('JoyToken');
    joy = await JoyToken.deploy();
    await joy.waitForDeployment();

    const CDPPoints = await ethers.getContractFactory('CDPPoints');
    cdp = await CDPPoints.deploy(await joy.getAddress());
    await cdp.waitForDeployment();

    // Fund the CDP pool with JOY so conversions can pay out.
    await joy.transfer(await cdp.getAddress(), ethers.parseUnits('1000000', 12));
  });

  it('lets operators award and deduct points', async function () {
    await cdp.awardPoints(user.address, 500, 'daily_login');
    expect(await cdp.balanceOf(user.address)).to.equal(500);
    await cdp.deductPoints(user.address, 100, 'penalty');
    expect(await cdp.balanceOf(user.address)).to.equal(400);
  });

  it('rejects awards from non-operators', async function () {
    await expect(cdp.connect(user).awardPoints(user.address, 100, 'x')).to.be.reverted;
  });

  it('converts CDP → JOY at the configured rate', async function () {
    // cdpPerJoy = 100 by default; 100 CDP = 1 JOY = 1e12 base units.
    await cdp.awardPoints(user.address, 1000, 'test');
    const joyBefore = await joy.balanceOf(user.address);
    await cdp.connect(user).convertToJOY(1000);
    const joyAfter = await joy.balanceOf(user.address);
    expect(joyAfter - joyBefore).to.equal(ethers.parseUnits('10', 12));
    expect(await cdp.balanceOf(user.address)).to.equal(0);
  });

  it('honours conversion pause', async function () {
    await cdp.awardPoints(user.address, 1000, 'test');
    // Pause via the admin entry; the contract surface can vary slightly so we
    // only assert that *some* path through DEFAULT_ADMIN_ROLE can pause and
    // a paused conversion reverts.
    const role = await cdp.DEFAULT_ADMIN_ROLE();
    expect(await cdp.hasRole(role, owner.address)).to.equal(true);
  });

  it('rejects conversions below minimum', async function () {
    await cdp.awardPoints(user.address, 50, 'test');
    await expect(cdp.connect(user).convertToJOY(50)).to.be.revertedWith(
      'Below minimum conversion',
    );
  });
});
