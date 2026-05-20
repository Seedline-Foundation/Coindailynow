const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('PressDistribution (C-4-1)', function () {
  let joy, press, owner, alice, bob, carol;

  beforeEach(async function () {
    [owner, alice, bob, carol] = await ethers.getSigners();
    const JoyToken = await ethers.getContractFactory('JoyToken');
    joy = await JoyToken.deploy();
    await joy.waitForDeployment();

    const PressDistribution = await ethers.getContractFactory('PressDistribution');
    press = await PressDistribution.deploy(await joy.getAddress());
    await press.waitForDeployment();

    await joy.transfer(await press.getAddress(), ethers.parseUnits('100000', 12));
  });

  it('pays a single press recipient', async function () {
    const amt = ethers.parseUnits('500', 12);
    await press.payPress(alice.address, amt, 'launch_coverage');
    expect(await joy.balanceOf(alice.address)).to.equal(amt);
  });

  it('batch pays multiple recipients', async function () {
    const recipients = [alice.address, bob.address, carol.address];
    const amounts = [
      ethers.parseUnits('100', 12),
      ethers.parseUnits('200', 12),
      ethers.parseUnits('300', 12),
    ];
    await press.batchPayPress(recipients, amounts);
    expect(await joy.balanceOf(alice.address)).to.equal(amounts[0]);
    expect(await joy.balanceOf(bob.address)).to.equal(amounts[1]);
    expect(await joy.balanceOf(carol.address)).to.equal(amounts[2]);
  });

  it('rejects mismatched array lengths', async function () {
    await expect(
      press.batchPayPress([alice.address], [1n, 2n]),
    ).to.be.revertedWith('Arrays length mismatch');
  });

  it('enforces batch size limit (≤200)', async function () {
    const big = Array.from({ length: 201 }, () => alice.address);
    const amts = Array.from({ length: 201 }, () => 1n);
    await expect(press.batchPayPress(big, amts)).to.be.revertedWith(
      'Batch too large, max 200 per tx',
    );
  });

  it('non-owner cannot pay', async function () {
    await expect(
      press.connect(alice).payPress(alice.address, 1n, 'self'),
    ).to.be.reverted;
  });

  it('rejects zero address recipient', async function () {
    await expect(
      press.payPress(ethers.ZeroAddress, 1n, 'x'),
    ).to.be.revertedWith('Invalid recipient');
  });
});
