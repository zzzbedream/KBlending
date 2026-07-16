// Human-readable ABIs (ethers v6 accepts signature-string arrays).

export const VAULT_ABI = [
  // --- config / views ---
  "function collateralToken() view returns (address)",
  "function borrowToken() view returns (address)",
  "function oracle() view returns (address)",
  "function paused() view returns (bool)",
  "function MAX_LTV() view returns (uint256)",
  "function LIQUIDATION_THRESHOLD() view returns (uint256)",
  // --- market state ---
  "function borrowCash() view returns (uint256)",
  "function totalCollateral() view returns (uint256)",
  "function totalSupplied() view returns (uint256)",
  "function totalBorrows() view returns (uint256)",
  "function totalReserves() view returns (uint256)",
  "function utilization() view returns (uint256)",
  // --- per-user position ---
  "function suppliedOf(address user) view returns (uint256)",
  "function debtOf(address user) view returns (uint256)",
  "function collateralOf(address user) view returns (uint256)",
  "function healthFactor(address user) view returns (uint256)",
  // --- actions ---
  "function supply(uint256 amount)",
  "function withdrawSupply(uint256 amount)",
  "function deposit(uint256 amount)",
  "function withdraw(uint256 amount)",
  "function borrow(uint256 amount)",
  "function repay(address borrower, uint256 amount)",
  "function liquidate(address borrower, uint256 repayAmount)",
] as const;

export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  // MockKAP20 faucet — testnet convenience only.
  "function mint(address to, uint256 amount)",
] as const;

export const ORACLE_ABI = ["function getPrice(address token) view returns (uint256)"] as const;
