const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Airdrop', function () {
  let joy, airdrop, deployer, alice, bob, carol;
  const FUND = ethers.parseUnits('100000', 12);

  beforeEach(async function () {
    [deployer, alice, bob, carol] = await ethers.getSigners();

    const JoyToken = await ethers.getContractFactory('JoyToken');
    joy = await JoyToken.deploy();
    await joy.waitForDeployment();

    const Airdrop = await ethers.getContractFactory('Airdrop');
    airdrop = await Airdrop.deploy(await joy.getAddress());
    await airdrop.waitForDeployment();

    // Fund the airdrop contract
    await joy.transfer(await airdrop.getAddress(), FUND);
  });

  describe('Deployment', function () {
    it('sets the token address', async function () {
      expect(await airdrop.token()).to.equal(await joy.getAddress());
    });

    it('sets deployer as owner', async function () {
      expect(await airdrop.owner()).to.equal(deployer.address);
    });

    it('reverts with zero token address', async function () {
      const Airdrop = await ethers.getContractFactory('Airdrop');
      await expect(Airdrop.deploy(ethers.ZeroAddress)).to.be.revertedWith(
        'Invalid token address',
      );
    });
  });

  describe('Batch airdrop', function () {
    it('distributes tokens to multiple recipients', async function () {
      const amt1 = ethers.parseUnits('100', 12);
      const amt2 = ethers.parseUnits('200', 12);

      await expect(
        airdrop.batchAirdrop([alice.address, bob.address], [amt1, amt2]),
      ).to.emit(airdrop, 'AirdropExecuted').withArgs(2, amt1 + amt2);

      expect(await joy.balanceOf(alice.address)).to.equal(amt1);
      expect(await joy.balanceOf(bob.address)).to.equal(amt2);
    });

    it('reverts on array length mismatch', async function () {
      await expect(
        airdrop.batchAirdrop([alice.address], [100, 200]),
      ).to.be.revertedWith('Array length mismatch');
    });

    it('reverts on zero address recipient', async function () {
      await expect(
        airdrop.batchAirdrop([ethers.ZeroAddress], [100]),
      ).to.be.revertedWith('Invalid recipient');
    });

    it('reverts when batch exceeds 200', async function () {
      const recipients = Array(201).fill(alice.address);
      const amounts = Array(201).fill(1);
      await expect(
        airdrop.batchAirdrop(recipients, amounts),
      ).to.be.revertedWith('Batch limit: 200 max');
    });

    it('non-owner cannot airdrop', async function () {
      await expect(
        airdrop.connect(alice).batchAirdrop([bob.address], [100]),
      ).to.be.revertedWithCustomError(airdrop, 'OwnableUnauthorizedAccount');
    });
  });

  describe('Emergency withdraw', function () {
    it('owner can withdraw tokens', async function () {
      const balBefore = await joy.balanceOf(deployer.address);
      await airdrop.emergencyWithdraw(await joy.getAddress());
      const balAfter = await joy.balanceOf(deployer.address);
      expect(balAfter - balBefore).to.equal(FUND);
    });

    it('reverts when no tokens to withdraw', async function () {
      await airdrop.emergencyWithdraw(await joy.getAddress());
      await expect(
        airdrop.emergencyWithdraw(await joy.getAddress()),
      ).to.be.revertedWith('No tokens to withdraw');
    });

    it('non-owner cannot emergency withdraw', async function () {
      await expect(
        airdrop.connect(alice).emergencyWithdraw(await joy.getAddress()),
      ).to.be.revertedWithCustomError(airdrop, 'OwnableUnauthorizedAccount');
    });
  });
});
