/**
 * C-3-3: Export ABIs + typechain-friendly JSON for frontend/CFIS.
 * Usage: npx hardhat compile && node scripts/export-abis.js
 */
const fs = require('fs');
const path = require('path');

const artifactsDir = path.join(__dirname, '../artifacts');
// Hardhat 2 layout: artifacts/contracts/JoyToken.sol/JoyToken.json
const outDir = path.join(__dirname, '../../packages/types/src/abis');

const contracts = ['JoyToken.sol', 'StakingVault.sol', 'TokenVesting.sol', 'CDPPoints.sol'];

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function resolveArtifact(name) {
  const candidates = [
    path.join(artifactsDir, 'sol', `${name}.sol`, `${name}.json`),
    path.join(artifactsDir, 'contracts', 'sol', `${name}.sol`, `${name}.json`),
    path.join(artifactsDir, 'contracts', `${name}.sol`, `${name}.json`),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

for (const file of contracts) {
  const name = file.replace('.sol', '');
  const artifactPath = resolveArtifact(name);
  if (!artifactPath) {
    console.warn('Skip (not compiled):', name);
    continue;
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  fs.writeFileSync(
    path.join(outDir, `${name}.json`),
    JSON.stringify({ abi: artifact.abi, bytecode: artifact.bytecode }, null, 2),
  );
  console.log('Exported', name);
}
