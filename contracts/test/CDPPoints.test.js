const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('CDPPoints', function () {
  let joy, cdp, deployer, operator, alice, bob;
  const JOY_DECIMALS = 12;

  beforeEach(async function () {
    [deployer, operator, alice, bob] = await ethers.getSigners();

    const JoyToken = await ethers.getContractFactory('JoyToken');
    joy = await JoyToken.deploy();
    await joy.waitForDeployment();

    const CDPPoints = await ethers.getContractFactory('CDPPoints');
    cdp = await CDPPoints.deploy(await joy.getAddress());
    await cdp.waitForDeployment();

    // Grant operator role
    const OPERATOR_ROLE = await cdp.OPERATOR_ROLE();
    await cdp.grantRole(OPERATOR_ROLE, operator.address);

    // Fund CDPPoints contract with JOY for conversions
    const fund = ethers.parseUnits('1000000', JOY_DECIMALS);
    await joy.transfer(await cdp.getAddress(), fund);
  });

  describe('Deployment', function () {
    it('sets joyToken address', async function () {
      expect(await cdp.joyToken()).to.equal(await joy.getAddress());
    });

    it('default cdpPerJoy is 100', async function () {
      expect(await cdp.cdpPerJoy()).to.equal(100);
    });

    it('deployer has DEFAULT_ADMIN_ROLE', async function () {
      const ADMIN = await cdp.DEFAULT_ADMIN_ROLE();
      expect(await cdp.hasRole(ADMIN, deployer.address)).to.be.true;
    });

    it('reverts with zero JOY address', async function () {
      const CDPPoints = await ethers.getContractFactory('CDPPoints');
      await expect(CDPPoints.deploy(ethers.ZeroAddress)).to.be.revertedWith(
        'Invalid JOY address',
      );
    });
  });

  describe('Award points', function () {
    it('operator can award points', async function () {
      await expect(cdp.connect(operator).awardPoints(alice.address, 500, 'daily_login'))
        .to.emit(cdp, 'PointsAwarded')
        .withArgs(alice.address, 500, 'daily_login');

      expect(await cdp.balanceOf(alice.address)).to.equal(500);
      expect(await cdp.totalMinted()).to.equal(500);
      expect(await cdp.totalSupply()).to.equal(500);
    });

    it('reverts for zero address user', async function () {
      await expect(
        cdp.connect(operator).awardPoints(ethers.ZeroAddress, 100, 'test'),
      ).to.be.revertedWith('Invalid user');
    });

    it('reverts for zero amount', async function () {
      await expect(
        cdp.connect(operator).awardPoints(alice.address, 0, 'test'),
      ).to.be.revertedWith('Amount must be > 0');
    });

    it('non-operator cannot award points', async function () {
      await expect(
        cdp.connect(alice).awardPoints(bob.address, 100, 'test'),
      ).to.be.revertedWithCustomError(cdp, 'AccessControlUnauthorizedAccount');
    });
  });

  describe('Batch award points', function () {
    it('awards to multiple users', async function () {
      await cdp.connect(operator).batchAwardPoints(
        [alice.address, bob.address],
        [100, 200],
        'batch',
      );
      expect(await cdp.balanceOf(alice.address)).to.equal(100);
      expect(await cdp.balanceOf(bob.address)).to.equal(200);
      expect(await cdp.totalSupply()).to.equal(300);
    });

    it('reverts on length mismatch', async function () {
      await expect(
        cdp.connect(operator).batchAwardPoints([alice.address], [100, 200], 'batch'),
      ).to.be.revertedWith('Length mismatch');
    });
  });

  describe('Deduct points', function () {
    beforeEach(async function () {
      await cdp.connect(operator).awardPoints(alice.address, 1000, 'seed');
    });

    it('operator can deduct points', async function () {
      await expect(cdp.connect(operator).deductPoints(alice.address, 300, 'penalty'))
        .to.emit(cdp, 'PointsDeducted');
      expect(await cdp.balanceOf(alice.address)).to.equal(700);
    });

    it('reverts when deducting more than balance', async function () {
      await expect(
        cdp.connect(operator).deductPoints(alice.address, 1001, 'too much'),
      ).to.be.revertedWith('Insufficient balance');
    });
  });

  describe('Convert to JOY', function () {
    beforeEach(async function () {
      await cdp.connect(operator).awardPoints(alice.address, 1000, 'seed');
    });

    it('user converts CDP to JOY', async function () {
      const cdpAmount = 100; // exactly 1 JOY (at rate 100)
      const expectedJoy = (BigInt(cdpAmount) * 10n ** 12n) / 100n;

      const balBefore = await joy.balanceOf(alice.address);
      await cdp.connect(alice).convertToJOY(cdpAmount);
      const balAfter = await joy.balanceOf(alice.address);

      expect(balAfter - balBefore).to.equal(expectedJoy);
      expect(await cdp.balanceOf(alice.address)).to.equal(900);
      expect(await cdp.totalBurned()).to.equal(100);
    });

    it('reverts below minimum conversion', async function () {
      await expect(
        cdp.connect(alice).convertToJOY(50), // less than cdpPerJoy (100)
      ).to.be.revertedWith('Below minimum conversion');
    });

    it('reverts with insufficient CDP balance', async function () {
      await expect(
        cdp.connect(bob).convertToJOY(100),
      ).to.be.revertedWith('Insufficient CDP');
    });

    it('reverts when conversions paused', async function () {
      await cdp.setConversionsPaused(true);
      await expect(
        cdp.connect(alice).convertToJOY(100),
      ).to.be.revertedWith('Conversions paused');
    });
  });

  describe('Admin functions', function () {
    it('admin can update conversion rate', async function () {
      await expect(cdp.setConversionRate(200))
        .to.emit(cdp, 'ConversionRateUpdated')
        .withArgs(100, 200);
      expect(await cdp.cdpPerJoy()).to.equal(200);
    });

    it('reverts setting rate to zero', async function () {
      await expect(cdp.setConversionRate(0)).to.be.revertedWith('Rate must be > 0');
    });

    it('admin can set JOY token address', async function () {
      await cdp.setJoyToken(bob.address);
      expect(await cdp.joyToken()).to.equal(bob.address);
    });

    it('admin can withdraw JOY', async function () {
      const amt = ethers.parseUnits('100', JOY_DECIMALS);
      await cdp.withdrawJOY(amt);
      // no revert
    });

    it('non-admin cannot update rate', async function () {
      await expect(
        cdp.connect(alice).setConversionRate(200),
      ).to.be.revertedWithCustomError(cdp, 'AccessControlUnauthorizedAccount');
    });
  });
});
