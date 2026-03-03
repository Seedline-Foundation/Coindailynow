const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  console.log('Account balance:', (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // ── 1. Deploy JoyToken ─────────────────────────────────────────
  console.log('\n--- Deploying JoyToken ---');
  const JoyToken = await hre.ethers.getContractFactory('JoyToken');
  const joyToken = await JoyToken.deploy(deployer.address);
  await joyToken.waitForDeployment();
  const joyAddr = await joyToken.getAddress();
  console.log('JoyToken deployed to:', joyAddr);

  // ── 2. Deploy CDPPoints ────────────────────────────────────────
  console.log('\n--- Deploying CDPPoints ---');
  const CDPPoints = await hre.ethers.getContractFactory('CDPPoints');
  const cdpPoints = await CDPPoints.deploy(joyAddr);
  await cdpPoints.waitForDeployment();
  const cdpAddr = await cdpPoints.getAddress();
  console.log('CDPPoints deployed to:', cdpAddr);

  // ── 3. Deploy ReputationSBT ────────────────────────────────────
  console.log('\n--- Deploying ReputationSBT ---');
  const ReputationSBT = await hre.ethers.getContractFactory('ReputationSBT');
  const reputationSBT = await ReputationSBT.deploy();
  await reputationSBT.waitForDeployment();
  const repAddr = await reputationSBT.getAddress();
  console.log('ReputationSBT deployed to:', repAddr);

  // ── 4. Deploy StakingVault ─────────────────────────────────────
  console.log('\n--- Deploying StakingVault ---');
  const StakingVault = await hre.ethers.getContractFactory('StakingVault');
  const stakingVault = await StakingVault.deploy(joyAddr);
  await stakingVault.waitForDeployment();
  const stakeAddr = await stakingVault.getAddress();
  console.log('StakingVault deployed to:', stakeAddr);

  // ── 5. Deploy PressDistribution ────────────────────────────────
  console.log('\n--- Deploying PressDistribution ---');
  const PressDistribution = await hre.ethers.getContractFactory('PressDistribution');
  const pressDist = await PressDistribution.deploy(joyAddr);
  await pressDist.waitForDeployment();
  const pressAddr = await pressDist.getAddress();
  console.log('PressDistribution deployed to:', pressAddr);

  // ── Summary ────────────────────────────────────────────────────
  console.log('\n========================================');
  console.log('DEPLOYMENT SUMMARY');
  console.log('========================================');
  console.log(`Network:           ${hre.network.name}`);
  console.log(`JoyToken:          ${joyAddr}`);
  console.log(`CDPPoints:         ${cdpAddr}`);
  console.log(`ReputationSBT:     ${repAddr}`);
  console.log(`StakingVault:      ${stakeAddr}`);
  console.log(`PressDistribution: ${pressAddr}`);
  console.log('========================================');

  // ── Save addresses to file ─────────────────────────────────────
  const fs = require('fs');
  const addresses = {
    network: hre.network.name,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      JoyToken: joyAddr,
      CDPPoints: cdpAddr,
      ReputationSBT: repAddr,
      StakingVault: stakeAddr,
      PressDistribution: pressAddr,
    },
  };
  const outPath = `./contracts/deployments/${hre.network.name}.json`;
  fs.mkdirSync('./contracts/deployments', { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log(`\nAddresses saved to ${outPath}`);

  // ── Verify on explorer (if not local) ──────────────────────────
  if (hre.network.name !== 'hardhat' && hre.network.name !== 'localhost') {
    console.log('\nVerifying contracts on block explorer...');
    const contracts = [
      { address: joyAddr, args: [deployer.address] },
      { address: cdpAddr, args: [joyAddr] },
      { address: repAddr, args: [] },
      { address: stakeAddr, args: [joyAddr] },
      { address: pressAddr, args: [joyAddr] },
    ];
    for (const c of contracts) {
      try {
        await hre.run('verify:verify', { address: c.address, constructorArguments: c.args });
        console.log(`  ✓ Verified ${c.address}`);
      } catch (e) {
        console.log(`  ✗ Verification failed for ${c.address}: ${e.message}`);
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
