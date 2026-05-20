const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('SimpleWallet', function () {
  let joy, wallet, deployer, alice;

  beforeEach(async function () {
    [deployer, alice] = await ethers.getSigners();

    const JoyToken = await ethers.getContractFactory('JoyToken');
    joy = await JoyToken.deploy();
    await joy.waitForDeployment();

    const SimpleWallet = await ethers.getContractFactory('SimpleWallet');
    wallet = await SimpleWallet.deploy();
    await wallet.waitForDeployment();

    // Fund wallet with tokens
    const fund = ethers.parseUnits('10000', 12);
    await joy.transfer(await wallet.getAddress(), fund);
  });

  describe('Deployment', function () {
    it('sets deployer as owner', async function () {
      expect(await wallet.owner()).to.equal(deployer.address);
    });
  });

  describe('ERC20 deposit & withdraw', function () {
    it('receives ERC20 tokens and reports balance', async function () {
      const bal = await wallet.getTokenBalance(await joy.getAddress());
      expect(bal).to.equal(ethers.parseUnits('10000', 12));
    });

    it('owner can withdraw tokens', async function () {
      const amt = ethers.parseUnits('500', 12);
      await expect(wallet.withdrawToken(await joy.getAddress(), alice.address, amt))
        .to.emit(wallet, 'TokensWithdrawn')
        .withArgs(await joy.getAddress(), alice.address, amt);

      expect(await joy.balanceOf(alice.address)).to.equal(amt);
    });

    it('reverts withdraw to zero address', async function () {
      await expect(
        wallet.withdrawToken(await joy.getAddress(), ethers.ZeroAddress, 100),
      ).to.be.revertedWith('Invalid recipient');
    });

    it('reverts withdraw of zero amount', async function () {
      await expect(
        wallet.withdrawToken(await joy.getAddress(), alice.address, 0),
      ).to.be.revertedWith('Amount must be > 0');
    });

    it('non-owner cannot withdraw tokens', async function () {
      await expect(
        wallet.connect(alice).withdrawToken(await joy.getAddress(), alice.address, 1),
      ).to.be.revertedWithCustomError(wallet, 'OwnableUnauthorizedAccount');
    });
  });

  describe('ETH deposit & withdraw', function () {
    const ONE_ETH = ethers.parseEther('1');

    beforeEach(async function () {
      await deployer.sendTransaction({
        to: await wallet.getAddress(),
        value: ONE_ETH,
      });
    });

    it('receives ETH and reports balance', async function () {
      expect(await wallet.getEtherBalance()).to.equal(ONE_ETH);
    });

    it('owner can withdraw ETH', async function () {
      await expect(wallet.withdrawEther(alice.address, ONE_ETH))
        .to.emit(wallet, 'EtherWithdrawn')
        .withArgs(alice.address, ONE_ETH);
    });

    it('reverts withdraw to zero address', async function () {
      await expect(
        wallet.withdrawEther(ethers.ZeroAddress, ONE_ETH),
      ).to.be.revertedWith('Invalid recipient');
    });

    it('reverts withdraw of zero amount', async function () {
      await expect(
        wallet.withdrawEther(alice.address, 0),
      ).to.be.revertedWith('Amount must be > 0');
    });

    it('reverts when insufficient ETH balance', async function () {
      await expect(
        wallet.withdrawEther(alice.address, ONE_ETH * 2n),
      ).to.be.revertedWith('Insufficient balance');
    });

    it('non-owner cannot withdraw ETH', async function () {
      await expect(
        wallet.connect(alice).withdrawEther(alice.address, ONE_ETH),
      ).to.be.revertedWithCustomError(wallet, 'OwnableUnauthorizedAccount');
    });
  });
});
