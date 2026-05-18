const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('PressDistribution', function () {
  let joy, press, deployer, alice, bob, carol;
  const FUND = ethers.parseUnits('500000', 12);

  beforeEach(async function () {
    [deployer, alice, bob, carol] = await ethers.getSigners();

    const JoyToken = await ethers.getContractFactory('JoyToken');
    joy = await JoyToken.deploy();
    await joy.waitForDeployment();

    const PressDistribution = await ethers.getContractFactory('PressDistribution');
    press = await PressDistribution.deploy(await joy.getAddress());
    await press.waitForDeployment();

    // Fund the press contract
    await joy.transfer(await press.getAddress(), FUND);
  });

  describe('Deployment', function () {
    it('sets joyToken address', async function () {
      expect(await press.joyToken()).to.equal(await joy.getAddress());
    });

    it('sets deployer as owner', async function () {
      expect(await press.owner()).to.equal(deployer.address);
    });
  });

  describe('Single payment', function () {
    it('pays a single press entity', async function () {
      const amt = ethers.parseUnits('1000', 12);
      await expect(press.payPress(alice.address, amt, 'article'))
        .to.emit(press, 'PressPayment')
        .withArgs(alice.address, amt, 'article');

      expect(await joy.balanceOf(alice.address)).to.equal(amt);
    });

    it('reverts on zero address', async function () {
      await expect(
        press.payPress(ethers.ZeroAddress, 100, 'test'),
      ).to.be.revertedWith('Invalid recipient');
    });

    it('non-owner cannot pay', async function () {
      await expect(
        press.connect(alice).payPress(bob.address, 100, 'test'),
      ).to.be.revertedWithCustomError(press, 'OwnableUnauthorizedAccount');
    });
  });

  describe('Batch payment', function () {
    it('pays multiple recipients', async function () {
      const amt1 = ethers.parseUnits('100', 12);
      const amt2 = ethers.parseUnits('200', 12);

      await expect(
        press.batchPayPress([alice.address, bob.address], [amt1, amt2]),
      ).to.emit(press, 'BatchPressPayment').withArgs(2, amt1 + amt2);

      expect(await joy.balanceOf(alice.address)).to.equal(amt1);
      expect(await joy.balanceOf(bob.address)).to.equal(amt2);
    });

    it('reverts on array length mismatch', async function () {
      await expect(
        press.batchPayPress([alice.address], [100, 200]),
      ).to.be.revertedWith('Arrays length mismatch');
    });

    it('reverts on zero address in batch', async function () {
      await expect(
        press.batchPayPress([ethers.ZeroAddress], [100]),
      ).to.be.revertedWith('Invalid recipient');
    });

    it('reverts when batch exceeds 200', async function () {
      const recipients = Array(201).fill(alice.address);
      const amounts = Array(201).fill(1);
      await expect(
        press.batchPayPress(recipients, amounts),
      ).to.be.revertedWith('Batch too large, max 200 per tx');
    });

    it('non-owner cannot batch pay', async function () {
      await expect(
        press.connect(alice).batchPayPress([bob.address], [100]),
      ).to.be.revertedWithCustomError(press, 'OwnableUnauthorizedAccount');
    });
  });

  describe('Emergency withdraw ERC20', function () {
    it('owner can withdraw tokens', async function () {
      const amt = ethers.parseUnits('1000', 12);
      const balBefore = await joy.balanceOf(deployer.address);
      await press.emergencyWithdraw(await joy.getAddress(), amt);
      const balAfter = await joy.balanceOf(deployer.address);
      expect(balAfter - balBefore).to.equal(amt);
    });

    it('non-owner cannot withdraw', async function () {
      await expect(
        press.connect(alice).emergencyWithdraw(await joy.getAddress(), 1),
      ).to.be.revertedWithCustomError(press, 'OwnableUnauthorizedAccount');
    });
  });

  describe('ETH recovery', function () {
    it('contract can receive ETH', async function () {
      await deployer.sendTransaction({
        to: await press.getAddress(),
        value: ethers.parseEther('1'),
      });
      const bal = await ethers.provider.getBalance(await press.getAddress());
      expect(bal).to.equal(ethers.parseEther('1'));
    });

    it('owner can recover ETH', async function () {
      await deployer.sendTransaction({
        to: await press.getAddress(),
        value: ethers.parseEther('1'),
      });
      await press.emergencyWithdrawETH();
      const bal = await ethers.provider.getBalance(await press.getAddress());
      expect(bal).to.equal(0);
    });

    it('reverts when no ETH to withdraw', async function () {
      await expect(press.emergencyWithdrawETH()).to.be.revertedWith('No ETH to withdraw');
    });

    it('non-owner cannot recover ETH', async function () {
      await expect(
        press.connect(alice).emergencyWithdrawETH(),
      ).to.be.revertedWithCustomError(press, 'OwnableUnauthorizedAccount');
    });
  });
});
