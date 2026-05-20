const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('JoyToken (C-4-1)', function () {
  it('mints max supply with 12 decimals to deployer', async function () {
    const [deployer] = await ethers.getSigners();
    const JoyToken = await ethers.getContractFactory('JoyToken');
    const joy = await JoyToken.deploy();
    await joy.waitForDeployment();

    expect(await joy.decimals()).to.equal(12);
    const max = ethers.parseUnits('1000000000', 12);
    expect(await joy.balanceOf(deployer.address)).to.equal(max);
  });

  it('allows burn', async function () {
    const [deployer] = await ethers.getSigners();
    const JoyToken = await ethers.getContractFactory('JoyToken');
    const joy = await JoyToken.deploy();
    await joy.waitForDeployment();

    const amt = ethers.parseUnits('1000', 12);
    await joy.burn(amt);
    expect(await joy.balanceOf(deployer.address)).to.equal(
      ethers.parseUnits('1000000000', 12) - amt,
    );
  });
});
