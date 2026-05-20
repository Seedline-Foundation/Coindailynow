const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('ReputationSBT (C-4-1)', function () {
  let sbt, owner, alice, bob;

  beforeEach(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    const ReputationSBT = await ethers.getContractFactory('ReputationSBT');
    sbt = await ReputationSBT.deploy();
    await sbt.waitForDeployment();
  });

  it('mints exactly one reputation token per wallet', async function () {
    await sbt.mintReputation(alice.address);
    expect(await sbt.walletToToken(alice.address)).to.equal(1n);
    await expect(sbt.mintReputation(alice.address)).to.be.revertedWith(
      'Wallet already has reputation token',
    );
  });

  it('is soulbound — transfers revert', async function () {
    await sbt.mintReputation(alice.address);
    const tokenId = await sbt.walletToToken(alice.address);
    await expect(
      sbt.connect(alice).transferFrom(alice.address, bob.address, tokenId),
    ).to.be.revertedWith('Soulbound: non-transferable');
  });

  it('records transactions and updates score', async function () {
    await sbt.mintReputation(alice.address);
    await sbt.recordTransaction(alice.address, 100_00n, true, true);
    await sbt.recordTransaction(alice.address, 500_00n, true, true);
    const rep = await sbt.getReputation(alice.address);
    expect(rep.totalTransactions).to.equal(2n);
    expect(rep.successfulTransactions).to.equal(2n);
    expect(rep.score).to.be.gt(0n);
  });

  it('penalizes disputes', async function () {
    await sbt.mintReputation(alice.address);
    await sbt.recordTransaction(alice.address, 1000_00n, true, true);
    const before = await sbt.calculateScore(alice.address);
    await sbt.recordDispute(alice.address);
    const after = await sbt.calculateScore(alice.address);
    expect(after).to.be.lt(before);
  });

  it('awards HIGH_VOLUME_TRADER badge at $10K cumulative volume', async function () {
    await sbt.mintReputation(alice.address);
    await sbt.recordTransaction(alice.address, 1_000_000n, true, true);
    expect(await sbt.checkBadge(alice.address, 4 /* HIGH_VOLUME_TRADER */)).to.equal(true);
  });

  it('blocks unauthorized callers', async function () {
    await expect(sbt.connect(alice).mintReputation(bob.address)).to.be.reverted;
  });
});
