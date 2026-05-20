/**
 * @coindaily/contracts — shared workspace package consumed by backend, CFIS,
 * and any frontend that needs to talk to deployed contracts.
 *
 * The Solidity source of truth lives in /contracts. After `cd contracts &&
 * npm run artifacts` (compile + typechain + export ABIs), this package's
 * `src/abis/*.json` and `typechain-types/` are refreshed.
 *
 * Network deployments are recorded in `src/deployments/<network>.json` and
 * surfaced as `Deployments[<network>]` below.
 */

import JoyTokenAbi from './abis/JoyToken.json';
import StakingVaultAbi from './abis/StakingVault.json';
import CDPPointsAbi from './abis/CDPPoints.json';
import TokenVestingAbi from './abis/TokenVesting.json';

import amoyDeployment from './deployments/amoy.json';
import polygonDeployment from './deployments/polygon.json';

export const Abis = {
  JoyToken: JoyTokenAbi,
  StakingVault: StakingVaultAbi,
  CDPPoints: CDPPointsAbi,
  TokenVesting: TokenVestingAbi,
} as const;

export type ContractName = keyof typeof Abis;

export interface DeploymentManifest {
  network: string;
  chainId: number;
  deployer?: string;
  deployedAt?: string;
  contracts: Partial<
    Record<
      ContractName | 'PressDistribution' | 'SimpleWallet' | 'ReputationSBT' | 'Subscription' | 'CoinDailyTimelock',
      {
        address: string;
        constructorArgs?: unknown[];
        verified?: boolean;
        txHash?: string;
      }
    >
  >;
}

export const Deployments: Record<string, DeploymentManifest> = {
  amoy: amoyDeployment as DeploymentManifest,
  polygon: polygonDeployment as DeploymentManifest,
};

/**
 * Get a contract address for a given network name. Returns null if the
 * contract has not been deployed on that network yet.
 */
export function addressOf(
  network: keyof typeof Deployments,
  contract: keyof DeploymentManifest['contracts'],
): string | null {
  return Deployments[network]?.contracts?.[contract]?.address ?? null;
}

/**
 * Lookup helper for ethers v5/v6 — returns `{ abi, address }` ready to feed
 * into `new ethers.Contract(address, abi, providerOrSigner)`.
 */
export function contractOf(
  network: keyof typeof Deployments,
  contract: ContractName,
): { abi: any; address: string } | null {
  const address = addressOf(network, contract);
  if (!address) return null;
  return { abi: (Abis as any)[contract].abi, address };
}
