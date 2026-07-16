"use client";

import { useCallback, useEffect, useState } from "react";
import { ADDRESSES } from "@/lib/config";
import { erc20Read, vaultRead } from "@/lib/contracts";

export type MarketData = {
  paused: boolean;
  totalSupplied: bigint;
  totalBorrows: bigint;
  borrowCash: bigint;
  totalCollateral: bigint;
  utilizationWad: bigint;
  maxLtv: bigint;
  liqThreshold: bigint;
};

export type Position = {
  supplied: bigint;
  debt: bigint;
  collateral: bigint;
  healthFactor: bigint;
  collateralBalance: bigint;
  borrowBalance: bigint;
  collateralAllowance: bigint;
  borrowAllowance: bigint;
};

export type Deficit = {
  detected: boolean;
  collateralShortfall: bigint;
  borrowShortfall: bigint;
};

export type MarketState = {
  market: MarketData | null;
  position: Position | null;
  deficit: Deficit;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const NO_DEFICIT: Deficit = { detected: false, collateralShortfall: 0n, borrowShortfall: 0n };
const POLL_MS = 15_000;

export function useMarketData(address: string | null): MarketState {
  const [market, setMarket] = useState<MarketData | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [deficit, setDeficit] = useState<Deficit>(NO_DEFICIT);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const vault = vaultRead();
      const collateral = erc20Read(ADDRESSES.collateral);
      const borrow = erc20Read(ADDRESSES.borrow);

      const [
        paused,
        totalSupplied,
        totalBorrows,
        borrowCash,
        totalCollateral,
        utilizationWad,
        maxLtv,
        liqThreshold,
        vaultCollateralBal,
        vaultBorrowBal,
      ] = await Promise.all([
        vault.paused(),
        vault.totalSupplied(),
        vault.totalBorrows(),
        vault.borrowCash(),
        vault.totalCollateral(),
        vault.utilization(),
        vault.MAX_LTV(),
        vault.LIQUIDATION_THRESHOLD(),
        collateral.balanceOf(ADDRESSES.vault),
        borrow.balanceOf(ADDRESSES.vault),
      ]);

      setMarket({
        paused,
        totalSupplied,
        totalBorrows,
        borrowCash,
        totalCollateral,
        utilizationWad,
        maxLtv,
        liqThreshold,
      });

      // ethers view calls are typed `any`; cast to bigint so arithmetic stays bigint (any - any => number).
      const tc = totalCollateral as bigint;
      const vcb = vaultCollateralBal as bigint;
      const bc = borrowCash as bigint;
      const vbb = vaultBorrowBal as bigint;
      const collateralShortfall = vcb < tc ? tc - vcb : 0n;
      const borrowShortfall = vbb < bc ? bc - vbb : 0n;
      setDeficit({
        detected: collateralShortfall > 0n || borrowShortfall > 0n,
        collateralShortfall,
        borrowShortfall,
      });

      if (address) {
        const [supplied, debt, userCollateral, healthFactor, colBal, borBal, colAllow, borAllow] =
          await Promise.all([
            vault.suppliedOf(address),
            vault.debtOf(address),
            vault.collateralOf(address),
            vault.healthFactor(address),
            collateral.balanceOf(address),
            borrow.balanceOf(address),
            collateral.allowance(address, ADDRESSES.vault),
            borrow.allowance(address, ADDRESSES.vault),
          ]);
        setPosition({
          supplied,
          debt,
          collateral: userCollateral,
          healthFactor,
          collateralBalance: colBal,
          borrowBalance: borBal,
          collateralAllowance: colAllow,
          borrowAllowance: borAllow,
        });
      } else {
        setPosition(null);
      }
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to read on-chain state");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    // Syncing with an external system (the chain): setState runs after async reads, not in render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const id = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { market, position, deficit, loading, error, refresh };
}
