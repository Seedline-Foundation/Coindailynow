// SPDX-License-Identifier: MIT
// Deploy script for JOY (Joy Token) on Polygon

const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying JOY (Joy Token)...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log(
    "Account balance:",
    (await hre.ethers.provider.getBalance(deployer.address)).toString(),
    "\n"
  );

  // Deploy JoyToken (no constructor arguments — mints MAX_SUPPLY to deployer)
  console.log("Deploying JoyToken contract...");
  const JoyToken = await hre.ethers.getContractFactory("JoyToken");
  const joyToken = await JoyToken.deploy();
  await joyToken.waitForDeployment();

  const joyAddr = await joyToken.getAddress();
  console.log("✅ JoyToken deployed to:", joyAddr);
  console.log("");

  // Wait for block confirmations on live networks
  if (
    hre.network.name !== "hardhat" &&
    hre.network.name !== "localhost"
  ) {
    console.log("Waiting for block confirmations...");
    const tx = joyToken.deploymentTransaction();
    if (tx) await tx.wait(5);
    console.log("✅ Confirmed!\n");
  }

  // Get token info
  const name = await joyToken.name();
  const symbol = await joyToken.symbol();
  const decimals = await joyToken.decimals();
  const maxSupply = await joyToken.MAX_SUPPLY();

  console.log("Token Information:");
  console.log("- Name:", name);
  console.log("- Symbol:", symbol);
  console.log(
    "- Max Supply:",
    hre.ethers.formatUnits(maxSupply, decimals),
    "JOY"
  );
  console.log("- Decimals:", decimals.toString());
  console.log("");

  // Verify deployer received all tokens
  const deployerBalance = await joyToken.balanceOf(deployer.address);
  console.log("Initial Distribution:");
  console.log(
    "- Deployer:",
    hre.ethers.formatUnits(deployerBalance, decimals),
    "JOY"
  );
  console.log("");

  // Verify contract on block explorer (if not local)
  if (
    hre.network.name !== "hardhat" &&
    hre.network.name !== "localhost" &&
    process.env.POLYGONSCAN_API_KEY
  ) {
    console.log("Verifying contract on block explorer...");
    try {
      await hre.run("verify:verify", {
        address: joyAddr,
        constructorArguments: [],
      });
      console.log("✅ Contract verified");
    } catch (error) {
      console.log("⚠️ Verification failed:", error.message);
    }
  }

  const deployTx = joyToken.deploymentTransaction();
  console.log("\n=== Deployment Complete ===\n");
  console.log("Summary:");
  console.log("- JOY Token Address:", joyAddr);
  console.log("- Network:", hre.network.name);
  console.log("- Block:", deployTx ? deployTx.blockNumber : "n/a");
  console.log("- Deployer:", deployer.address);
  console.log("");

  console.log("Next Steps:");
  console.log(
    "1. Save contract address to .env: JOY_TOKEN_ADDRESS=" + joyAddr
  );
  console.log("2. Fund distribution contracts (PressDistribution, Airdrop)");
  console.log("3. Add liquidity to DEX");
  console.log("");

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    joyToken: {
      address: joyAddr,
      deployer: deployer.address,
      blockNumber: deployTx ? deployTx.blockNumber : null,
      transactionHash: deployTx ? deployTx.hash : null,
      maxSupply: hre.ethers.formatUnits(maxSupply, decimals),
      decimals: Number(decimals),
      timestamp: new Date().toISOString(),
    },
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
