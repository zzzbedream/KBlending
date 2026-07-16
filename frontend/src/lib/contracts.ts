import { Contract, JsonRpcProvider, type Signer } from "ethers";
import { ERC20_ABI, ORACLE_ABI, VAULT_ABI } from "./abi";
import { ADDRESSES, KUB_TESTNET } from "./config";

/** Shared read-only provider pointed at the configured KUB RPC. */
export function readProvider(): JsonRpcProvider {
  return new JsonRpcProvider(KUB_TESTNET.rpcUrl, KUB_TESTNET.chainId);
}

export function vaultRead(): Contract {
  return new Contract(ADDRESSES.vault, VAULT_ABI, readProvider());
}

export function erc20Read(address: string): Contract {
  return new Contract(address, ERC20_ABI, readProvider());
}

export function oracleRead(): Contract {
  return new Contract(ADDRESSES.oracle, ORACLE_ABI, readProvider());
}

export function vaultWith(signer: Signer): Contract {
  return new Contract(ADDRESSES.vault, VAULT_ABI, signer);
}

export function erc20With(address: string, signer: Signer): Contract {
  return new Contract(address, ERC20_ABI, signer);
}
