import { Contract, JsonRpcProvider } from "ethers";
import { config } from "../config.js";
import { VAULT_ABI } from "../abi.js";

/** Typed view of the vault reads the backend uses (ethers Contract is otherwise untyped). */
export interface VaultReads {
  paused(): Promise<boolean>;
  totalSupplied(): Promise<bigint>;
  totalBorrows(): Promise<bigint>;
  borrowCash(): Promise<bigint>;
  totalCollateral(): Promise<bigint>;
  totalReserves(): Promise<bigint>;
  utilization(): Promise<bigint>;
  borrowIndex(): Promise<bigint>;
  supplyIndex(): Promise<bigint>;
  baseRatePerYearWad(): Promise<bigint>;
  slopePerYearWad(): Promise<bigint>;
  reserveFactorWad(): Promise<bigint>;
  MAX_LTV(): Promise<bigint>;
  LIQUIDATION_THRESHOLD(): Promise<bigint>;
  suppliedOf(user: string): Promise<bigint>;
  debtOf(user: string): Promise<bigint>;
  collateralOf(user: string): Promise<bigint>;
  healthFactor(user: string): Promise<bigint>;
}

let providerSingleton: JsonRpcProvider | null = null;

export function provider(): JsonRpcProvider {
  if (!providerSingleton) {
    providerSingleton = new JsonRpcProvider(config.rpcUrl, config.chainId, { staticNetwork: true });
  }
  return providerSingleton;
}

export function vaultContract(): Contract & VaultReads {
  return new Contract(config.vaultAddress, VAULT_ABI, provider()) as Contract & VaultReads;
}
