// Human-readable ABI for the parts of LendingVault the backend consumes.
export const VAULT_ABI = [
  // events (used by the indexer)
  "event Supplied(address indexed user, uint256 amount)",
  "event SupplyWithdrawn(address indexed user, uint256 amount)",
  "event CollateralDeposited(address indexed user, uint256 amount)",
  "event CollateralWithdrawn(address indexed user, uint256 amount)",
  "event Borrowed(address indexed user, uint256 amount)",
  "event Repaid(address indexed payer, address indexed borrower, uint256 amount)",
  "event Liquidated(address indexed liquidator, address indexed borrower, uint256 repaidAmount, uint256 seizedCollateral)",
  // market views
  "function paused() view returns (bool)",
  "function totalSupplied() view returns (uint256)",
  "function totalBorrows() view returns (uint256)",
  "function borrowCash() view returns (uint256)",
  "function totalCollateral() view returns (uint256)",
  "function totalReserves() view returns (uint256)",
  "function utilization() view returns (uint256)",
  "function borrowIndex() view returns (uint256)",
  "function supplyIndex() view returns (uint256)",
  "function baseRatePerYearWad() view returns (uint256)",
  "function slopePerYearWad() view returns (uint256)",
  "function reserveFactorWad() view returns (uint256)",
  "function MAX_LTV() view returns (uint256)",
  "function LIQUIDATION_THRESHOLD() view returns (uint256)",
  // per-user views
  "function suppliedOf(address user) view returns (uint256)",
  "function debtOf(address user) view returns (uint256)",
  "function collateralOf(address user) view returns (uint256)",
  "function healthFactor(address user) view returns (uint256)",
] as const;
