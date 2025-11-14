// SPDX-License-Identifier: MIT
// Deploy script for JY (Joy Token) on Polygon

const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying JY (Joy Token) to Polygon...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString(), "\n");

  // Configuration
  const TREASURY_WALLET = process.env.TREASURY_WALLET || deployer.address;
  const REVENUE_WALLET = process.env.REVENUE_WALLET || deployer.address;

  console.log("Configuration:");
  console.log("- Treasury Wallet:", TREASURY_WALLET);
  console.log("- Revenue Wallet:", REVENUE_WALLET);
  console.log("");

  // Deploy JoyToken
  console.log("Deploying JoyToken contract...");
  const JoyToken = await ethers.getContractFactory("JoyToken");
  const joyToken = await JoyToken.deploy(TREASURY_WALLET, REVENUE_WALLET);

  await joyToken.deployed();

  console.log("✅ JoyToken deployed to:", joyToken.address);
  console.log("");

  // Wait for block confirmations
  console.log("Waiting for block confirmations...");
  await joyToken.deployTransaction.wait(5);
  console.log("✅ Confirmed!\n");

  // Get token info
  const name = await joyToken.name();
  const symbol = await joyToken.symbol();
  const totalSupply = await joyToken.TOTAL_SUPPLY();
  const decimals = 18;

  console.log("Token Information:");
  console.log("- Name:", name);
  console.log("- Symbol:", symbol);
  console.log("- Total Supply:", ethers.utils.formatEther(totalSupply), "JY");
  console.log("- Decimals:", decimals);
  console.log("");

  // Verify initial distribution
  const treasuryBalance = await joyToken.balanceOf(TREASURY_WALLET);
  const contractBalance = await joyToken.balanceOf(joyToken.address);

  console.log("Initial Distribution:");
  console.log("- Treasury:", ethers.utils.formatEther(treasuryBalance), "JY");
  console.log("- Contract (for staking/rewards):", ethers.utils.formatEther(contractBalance), "JY");
  console.log("");

  // Verify contract on Polygonscan
  if (process.env.POLYGONSCAN_API_KEY) {
    console.log("Verifying contract on Polygonscan...");
    try {
      await hre.run("verify:verify", {
        address: joyToken.address,
        constructorArguments: [TREASURY_WALLET, REVENUE_WALLET],
      });
      console.log("✅ Contract verified on Polygonscan");
    } catch (error) {
      console.log("⚠️ Verification failed:", error.message);
    }
  }

  console.log("\n=== Deployment Complete ===\n");
  console.log("Summary:");
  console.log("- JY Token Address:", joyToken.address);
  console.log("- Network:", hre.network.name);
  console.log("- Block:", joyToken.deployTransaction.blockNumber);
  console.log("- Deployer:", deployer.address);
  console.log("");

  console.log("Next Steps:");
  console.log("1. Save contract address to .env: JY_TOKEN_ADDRESS=" + joyToken.address);
  console.log("2. Enable trading: await joyToken.enableTrading()");
  console.log("3. Enable staking: await joyToken.enableStaking()");
  console.log("4. Set CE Points contract: await joyToken.setCEPointsContract(address)");
  console.log("5. Add liquidity to DEX");
  console.log("6. Announce to community");
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    joyToken: {
      address: joyToken.address,
      deployer: deployer.address,
      treasuryWallet: TREASURY_WALLET,
      revenueWallet: REVENUE_WALLET,
      blockNumber: joyToken.deployTransaction.blockNumber,
      transactionHash: joyToken.deployTransaction.hash,
      totalSupply: ethers.utils.formatEther(totalSupply),
      timestamp: new Date().toISOString()
    }
  };

  console.log("Deployment Info (save this):");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
