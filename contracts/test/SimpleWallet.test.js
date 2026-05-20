const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('SimpleWallet (C-4-1)', function () {
  let wallet, joy, owner, alice;

  beforeEach(async function () {
    [owner, alice] = await ethers.getSigners();
    const SimpleWallet = await ethers.getContractFactory('SimpleWallet');
    wallet = await SimpleWallet.deploy();
    await wallet.waitForDeployment();

    const JoyToken = await ethers.getContractFactory('JoyToken');
    joy = await JoyToken.deploy();
    await joy.waitForDeployment();

    await joy.transfer(await wallet.getAddress(), ethers.parseUnits('1000', 12));
    await owner.sendTransaction({
      to: await wallet.getAddress(),
      value: ethers.parseEther('1'),
    });
  });

  it('reports balances', async function () {
    expect(await wallet.getEtherBalance()).to.equal(ethers.parseEther('1'));
    expect(await wallet.getTokenBalance(await joy.getAddress())).to.equal(
      ethers.parseUnits('1000', 12),
    );
  });

  it('owner can withdraw ERC20', async function () {
    const amt = ethers.parseUnits('400', 12);
    await wallet.withdrawToken(await joy.getAddress(), alice.address, amt);
    expect(await joy.balanceOf(alice.address)).to.equal(amt);
  });

  it('owner can withdraw Ether', async function () {
    const before = await ethers.provider.getBalance(alice.address);
    await wallet.withdrawEther(alice.address, ethers.parseEther('0.5'));
    const after = await ethers.provider.getBalance(alice.address);
    expect(after - before).to.equal(ethers.parseEther('0.5'));
  });

  it('non-owner cannot withdraw', async function () {
    await expect(
      wallet.connect(alice).withdrawEther(alice.address, ethers.parseEther('0.1')),
    ).to.be.reverted;
    await expect(
      wallet.connect(alice).withdrawToken(await joy.getAddress(), alice.address, 1n),
    ).to.be.reverted;
  });

  it('rejects zero address recipient', async function () {
    await expect(
      wallet.withdrawEther(ethers.ZeroAddress, ethers.parseEther('0.1')),
    ).to.be.revertedWith('Invalid recipient');
  });
});
