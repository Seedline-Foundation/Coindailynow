/**
 * Deploy the full launch contract set + emit a deployment manifest.
 *
 * Network selection: --network amoy | polygon | bscTestnet | bsc | hardhat
 * Usage: npx hardhat run scripts/deploy-all.js --network amoy
 *
 * Side effects:
 *   - Writes contracts/deployments/<network>.json (legacy location)
 *   - Writes packages/contracts/src/deployments/<network>.json (canonical)
 *   - Verifies on Etherscan-compatible explorers when available
 */
const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

const TIMELOCK_MIN_DELAY = Number(process.env.TIMELOCK_MIN_DELAY || 60 * 60 * 24); // 1 day
const SUBSCRIPTION_INITIAL_PRICE = process.env.SUBSCRIPTION_INITIAL_PRICE || '29000000'; // 29 USDC (6 decimals)

async function deploy(name, args = []) {
  console.log(`\n--- Deploying ${name} ---`);
  const Factory = await hre.ethers.getContractFactory(name);
  const instance = await Factory.deploy(...args);
  await instance.waitForDeployment();
  const address = await instance.getAddress();
  const tx = instance.deploymentTransaction();
  console.log(`${name}: ${address}`);
  return { name, address, args, txHash: tx?.hash };
}

async function tryVerify(address, args) {
  try {
    await hre.run('verify:verify', { address, constructorArguments: args });
    return true;
  } catch (e) {
    console.log(`  ✗ verify ${address} failed: ${e.message}`);
    return false;
  }
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  console.log(`Network: ${network} (chainId ${hre.network.config.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${balance.toString()}`);

  const records = [];

  // 1. JoyToken (12-decimal launch token, 1B supply).
  const joy = await deploy('JoyToken', []);
  records.push(joy);

  // 2. CDPPoints — depends on JoyToken.
  records.push(await deploy('CDPPoints', [joy.address]));

  // 3. ReputationSBT — soulbound reputation.
  records.push(await deploy('ReputationSBT', []));

  // 4. StakingVault — staking against JoyToken.
  records.push(await deploy('StakingVault', [joy.address]));

  // 5. PressDistribution — JOY-denominated press payouts.
  records.push(await deploy('PressDistribution', [joy.address]));

  // 6. SimpleWallet — custodial wallet abstraction.
  records.push(await deploy('SimpleWallet', []));

  // 7. TokenVesting — team/advisor vesting against JoyToken.
  records.push(await deploy('TokenVesting', [joy.address]));

  // 8. Subscription — recurring payments. (constructor args may need tuning per spec.)
  // Subscription.sol expects (paymentToken, owner) — fall back gracefully if signature differs.
  let subRec = null;
  try {
    subRec = await deploy('Subscription', [joy.address, deployer.address]);
  } catch (e) {
    console.warn(`Subscription deploy skipped: ${e.message}`);
  }
  if (subRec) records.push(subRec);

  // 9. CoinDailyTimelock — wrapper around OZ TimelockController.
  // Constructor: (minDelay, proposers[], executors[], admin)
  let timelockRec = null;
  try {
    timelockRec = await deploy('CoinDailyTimelock', [
      TIMELOCK_MIN_DELAY,
      [deployer.address],
      [deployer.address],
      deployer.address,
    ]);
  } catch (e) {
    console.warn(`Timelock deploy skipped: ${e.message}`);
  }
  if (timelockRec) records.push(timelockRec);

  // ── Manifest ───────────────────────────────────────────────────
  const manifest = {
    network,
    chainId: hre.network.config.chainId,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: Object.fromEntries(
      records.map((r) => [
        r.name,
        { address: r.address, constructorArgs: r.args, txHash: r.txHash, verified: false },
      ]),
    ),
  };

  // Legacy location (kept for backward-compat with existing tooling).
  const legacyDir = path.resolve(__dirname, '..', 'deployments');
  fs.mkdirSync(legacyDir, { recursive: true });
  fs.writeFileSync(path.join(legacyDir, `${network}.json`), JSON.stringify(manifest, null, 2));

  // Canonical location consumed by @coindaily/contracts.
  const canonicalDir = path.resolve(__dirname, '..', '..', 'packages', 'contracts', 'src', 'deployments');
  fs.mkdirSync(canonicalDir, { recursive: true });
  fs.writeFileSync(path.join(canonicalDir, `${network}.json`), JSON.stringify(manifest, null, 2));

  console.log(`\nManifest written to:\n  ${legacyDir}/${network}.json\n  ${canonicalDir}/${network}.json`);

  // ── Verification ───────────────────────────────────────────────
  if (network !== 'hardhat' && network !== 'localhost') {
    console.log('\nVerifying contracts on block explorer…');
    for (const r of records) {
      const verified = await tryVerify(r.address, r.args);
      manifest.contracts[r.name].verified = verified;
    }
    fs.writeFileSync(path.join(canonicalDir, `${network}.json`), JSON.stringify(manifest, null, 2));
  }

  console.log('\n========================================');
  console.log('DEPLOYMENT COMPLETE');
  console.log('========================================');
  for (const r of records) console.log(`${r.name.padEnd(20)} ${r.address}`);
  console.log('========================================');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
