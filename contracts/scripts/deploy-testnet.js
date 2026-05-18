/**
 * N19: Deploy all contracts to a testnet with safety checks and verification.
 *
 * Usage:
 *   npx hardhat run scripts/deploy-testnet.js --network amoy
 *
 * Required env vars:
 *   DEPLOYER_PRIVATE_KEY   — wallet private key (funded on testnet)
 *   POLYGONSCAN_API_KEY    — for contract verification on Polygonscan
 */
const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

const TESTNETS = {
  amoy: { chainId: 80002, explorer: 'https://amoy.polygonscan.com' },
};

async function preflight() {
  const network = hre.network.name;
  const cfg = TESTNETS[network];

  if (network === 'hardhat' || network === 'localhost') {
    throw new Error('This script targets live testnets. Use --network amoy (or another testnet).');
  }

  if (!cfg) {
    console.warn(`WARNING: '${network}' is not in the known-testnet list. Proceeding anyway.`);
  }

  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error('DEPLOYER_PRIVATE_KEY is not set. Export it before deploying.');
  }

  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceEth = hre.ethers.formatEther(balance);

  console.log('=== Testnet Deployment Preflight ===');
  console.log(`  Network:    ${network} (chainId ${hre.network.config.chainId})`);
  console.log(`  Deployer:   ${deployer.address}`);
  console.log(`  Balance:    ${balanceEth} native token`);

  if (balance === 0n) {
    throw new Error('Deployer wallet has zero balance. Fund it from a testnet faucet first.');
  }

  const MIN_BALANCE = hre.ethers.parseEther('0.01');
  if (balance < MIN_BALANCE) {
    console.warn(`  ⚠ Low balance (< 0.01). Deployment may fail mid-way.`);
  }

  console.log('  Preflight passed ✓\n');
  return deployer;
}

async function deploy(deployer) {
  const results = {};

  console.log('--- Deploying JoyToken ---');
  const JoyToken = await hre.ethers.getContractFactory('JoyToken');
  const joyToken = await JoyToken.deploy();
  await joyToken.waitForDeployment();
  results.JoyToken = { address: await joyToken.getAddress(), args: [deployer.address] };
  console.log('  JoyToken:', results.JoyToken.address);

  console.log('--- Deploying CDPPoints ---');
  const CDPPoints = await hre.ethers.getContractFactory('CDPPoints');
  const cdpPoints = await CDPPoints.deploy(results.JoyToken.address);
  await cdpPoints.waitForDeployment();
  results.CDPPoints = { address: await cdpPoints.getAddress(), args: [results.JoyToken.address] };
  console.log('  CDPPoints:', results.CDPPoints.address);

  console.log('--- Deploying ReputationSBT ---');
  const ReputationSBT = await hre.ethers.getContractFactory('ReputationSBT');
  const reputationSBT = await ReputationSBT.deploy();
  await reputationSBT.waitForDeployment();
  results.ReputationSBT = { address: await reputationSBT.getAddress(), args: [] };
  console.log('  ReputationSBT:', results.ReputationSBT.address);

  console.log('--- Deploying StakingVault ---');
  const StakingVault = await hre.ethers.getContractFactory('StakingVault');
  const stakingVault = await StakingVault.deploy(results.JoyToken.address);
  await stakingVault.waitForDeployment();
  results.StakingVault = { address: await stakingVault.getAddress(), args: [results.JoyToken.address] };
  console.log('  StakingVault:', results.StakingVault.address);

  console.log('--- Deploying PressDistribution ---');
  const PressDistribution = await hre.ethers.getContractFactory('PressDistribution');
  const pressDist = await PressDistribution.deploy(results.JoyToken.address);
  await pressDist.waitForDeployment();
  results.PressDistribution = { address: await pressDist.getAddress(), args: [results.JoyToken.address] };
  console.log('  PressDistribution:', results.PressDistribution.address);

  console.log('--- Deploying Airdrop ---');
  const Airdrop = await hre.ethers.getContractFactory('Airdrop');
  const airdrop = await Airdrop.deploy(results.JoyToken.address);
  await airdrop.waitForDeployment();
  results.Airdrop = { address: await airdrop.getAddress(), args: [results.JoyToken.address] };
  console.log('  Airdrop:', results.Airdrop.address);

  return results;
}

async function saveDeployment(deployer, results) {
  const network = hre.network.name;
  const deploymentsDir = path.join(__dirname, '..', 'contracts', 'deployments');
  fs.mkdirSync(deploymentsDir, { recursive: true });

  const contracts = {};
  for (const [name, info] of Object.entries(results)) {
    contracts[name] = info.address;
  }

  const output = {
    network,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts,
  };

  const outPath = path.join(deploymentsDir, `${network}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nDeployment addresses saved to ${outPath}`);
}

async function verifyContracts(results) {
  if (!process.env.POLYGONSCAN_API_KEY) {
    console.warn('\nPOLYGONSCAN_API_KEY not set — skipping contract verification.');
    return;
  }

  console.log('\nVerifying contracts on block explorer...');
  for (const [name, info] of Object.entries(results)) {
    try {
      await hre.run('verify:verify', {
        address: info.address,
        constructorArguments: info.args,
      });
      console.log(`  ✓ ${name} verified`);
    } catch (err) {
      if (err.message.includes('Already Verified')) {
        console.log(`  ✓ ${name} already verified`);
      } else {
        console.log(`  ✗ ${name} verification failed: ${err.message}`);
      }
    }
  }
}

async function main() {
  const deployer = await preflight();
  const results = await deploy(deployer);
  await saveDeployment(deployer, results);
  await verifyContracts(results);

  console.log('\n=== Testnet deployment complete ===');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Deployment failed:', error.message || error);
    process.exit(1);
  });
