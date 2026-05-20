const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('JoyToken', function () {
  let joy, deployer, alice, bob;
  const MAX_SUPPLY = ethers.parseUnits('1000000000', 12);

  beforeEach(async function () {
    [deployer, alice, bob] = await ethers.getSigners();
    const JoyToken = await ethers.getContractFactory('JoyToken');
    joy = await JoyToken.deploy();
    await joy.waitForDeployment();
  });

  describe('Deployment', function () {
    it('has correct name and symbol', async function () {
      expect(await joy.name()).to.equal('Joy Token');
      expect(await joy.symbol()).to.equal('JOY');
    });

    it('uses 12 decimals', async function () {
      expect(await joy.decimals()).to.equal(12);
    });

    it('mints MAX_SUPPLY to deployer', async function () {
      expect(await joy.totalSupply()).to.equal(MAX_SUPPLY);
      expect(await joy.balanceOf(deployer.address)).to.equal(MAX_SUPPLY);
    });

    it('sets deployer as owner', async function () {
      expect(await joy.owner()).to.equal(deployer.address);
    });
  });

  describe('ERC20 transfers', function () {
    it('transfers tokens between accounts', async function () {
      const amount = ethers.parseUnits('1000', 12);
      await joy.transfer(alice.address, amount);
      expect(await joy.balanceOf(alice.address)).to.equal(amount);
      expect(await joy.balanceOf(deployer.address)).to.equal(MAX_SUPPLY - amount);
    });

    it('reverts transfer when sender has insufficient balance', async function () {
      await expect(
        joy.connect(alice).transfer(bob.address, 1n),
      ).to.be.revertedWithCustomError(joy, 'ERC20InsufficientBalance');
    });

    it('approve and transferFrom work correctly', async function () {
      const amount = ethers.parseUnits('500', 12);
      await joy.approve(alice.address, amount);
      await joy.connect(alice).transferFrom(deployer.address, bob.address, amount);
      expect(await joy.balanceOf(bob.address)).to.equal(amount);
    });
  });

  describe('Burn', function () {
    it('allows holder to burn their tokens', async function () {
      const burnAmt = ethers.parseUnits('1000', 12);
      await joy.burn(burnAmt);
      expect(await joy.balanceOf(deployer.address)).to.equal(MAX_SUPPLY - burnAmt);
      expect(await joy.totalSupply()).to.equal(MAX_SUPPLY - burnAmt);
    });

    it('allows burnFrom with approval', async function () {
      const amount = ethers.parseUnits('500', 12);
      await joy.transfer(alice.address, amount);
      await joy.connect(alice).approve(deployer.address, amount);
      await joy.burnFrom(alice.address, amount);
      expect(await joy.balanceOf(alice.address)).to.equal(0);
    });

    it('reverts burn when exceeding balance', async function () {
      await expect(
        joy.connect(alice).burn(1n),
      ).to.be.revertedWithCustomError(joy, 'ERC20InsufficientBalance');
    });
  });
});
