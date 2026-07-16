import { formatUnits } from "ethers";
import { vaultContract } from "../chain/provider.js";

const WAD = 10n ** 18n;

/** WAD fraction (1e18 == 100%) to a percentage number. */
function wadToPercent(wad: bigint): number {
  return Number(formatUnits(wad, 16));
}

export type MarketSnapshot = {
  paused: boolean;
  totalSupplied: string;
  totalBorrows: string;
  availableLiquidity: string;
  totalCollateral: string;
  totalReserves: string;
  utilizationPct: number;
  borrowAprPct: number;
  supplyAprPct: number;
  maxLtvPct: number;
  liquidationThresholdPct: number;
};

/** Live market snapshot read straight from the vault, with APRs derived from the rate model. */
export async function getMarketSnapshot(): Promise<MarketSnapshot> {
  const vault = vaultContract();
  const [
    paused,
    totalSupplied,
    totalBorrows,
    borrowCash,
    totalCollateral,
    totalReserves,
    util,
    base,
    slope,
    reserveFactor,
    maxLtv,
    liqThreshold,
  ] = await Promise.all([
    vault.paused(),
    vault.totalSupplied(),
    vault.totalBorrows(),
    vault.borrowCash(),
    vault.totalCollateral(),
    vault.totalReserves(),
    vault.utilization(),
    vault.baseRatePerYearWad(),
    vault.slopePerYearWad(),
    vault.reserveFactorWad(),
    vault.MAX_LTV(),
    vault.LIQUIDATION_THRESHOLD(),
  ]);

  const borrowRateWad = base + (util * slope) / WAD;
  const supplyRateWad = (((borrowRateWad * util) / WAD) * (WAD - reserveFactor)) / WAD;

  return {
    paused,
    totalSupplied: totalSupplied.toString(),
    totalBorrows: totalBorrows.toString(),
    availableLiquidity: borrowCash.toString(),
    totalCollateral: totalCollateral.toString(),
    totalReserves: totalReserves.toString(),
    utilizationPct: wadToPercent(util),
    borrowAprPct: wadToPercent(borrowRateWad),
    supplyAprPct: wadToPercent(supplyRateWad),
    maxLtvPct: Number(maxLtv),
    liquidationThresholdPct: Number(liqThreshold),
  };
}
