// Chain + contract configuration. Addresses come from NEXT_PUBLIC_* env vars so the
// same build points at whatever KUB deployment you configure (see .env.example).

export const KUB_TESTNET = {
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 25925),
  chainName: "KUB Testnet",
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? "https://rpc-testnet.bitkubchain.io",
  explorer: process.env.NEXT_PUBLIC_EXPLORER ?? "https://testnet.bkcscan.com",
  nativeCurrency: { name: "KUB", symbol: "KUB", decimals: 18 },
} as const;

export const ADDRESSES = {
  vault: process.env.NEXT_PUBLIC_VAULT_ADDRESS ?? "",
  collateral: process.env.NEXT_PUBLIC_REALX_ADDRESS ?? "", // RealX (KAP-20 collateral)
  borrow: process.env.NEXT_PUBLIC_KUSDT_ADDRESS ?? "", // KUSDT (KAP-20 borrow asset)
  oracle: process.env.NEXT_PUBLIC_ORACLE_ADDRESS ?? "",
} as const;

// Bitkub NEXT (custodial OAuth wallet). Left disabled until a NEXT dApp is registered
// and these credentials exist; the injected EVM wallet path works without them.
export const BITKUB_NEXT = {
  clientId: process.env.NEXT_PUBLIC_BITKUB_CLIENT_ID ?? "",
  sdkId: process.env.NEXT_PUBLIC_BITKUB_SDK_ID ?? "",
  get enabled() {
    return this.clientId !== "" && this.sdkId !== "";
  },
} as const;

export const TOKENS = {
  collateral: { symbol: "REALX", label: "RealX", decimals: 18 },
  borrow: { symbol: "KUSDT", label: "KUB Tether", decimals: 18 },
} as const;

export function isConfigured(): boolean {
  return ADDRESSES.vault !== "" && ADDRESSES.collateral !== "" && ADDRESSES.borrow !== "";
}

export function explorerAddress(address: string): string {
  return `${KUB_TESTNET.explorer}/address/${address}`;
}
