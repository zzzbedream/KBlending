"use client";

import { ShieldAlert, CirclePause } from "lucide-react";
import type { Deficit } from "@/hooks/useMarketData";
import { formatAmount } from "@/lib/format";
import { TOKENS } from "@/lib/config";

type Props = {
  deficit: Deficit;
  paused: boolean;
};

/**
 * Surfaces the two protective states of the vault:
 *  - `paused`: the guardian manually halted the market.
 *  - `deficit`: the on-chain balance dropped below the vault's internal accounting,
 *    i.e. the KAP-20 `adminTransfer` defense has tripped and user actions are frozen.
 */
export function DeficitBanner({ deficit, paused }: Props) {
  if (deficit.detected) {
    return (
      <div className="banner-danger flex items-start gap-3 p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#f85149]" />
        <div className="text-sm">
          <p className="font-semibold text-[#f85149]">Deficit detected — protocol auto-paused</p>
          <p className="mt-1 text-[rgba(230,237,243,0.75)]">
            The vault&apos;s real token balance fell below its internal accounting, which on KUB Chain
            signals a KAP-20 <code className="text-[#f85149]">adminTransfer</code> drain. All user actions are
            blocked until balances reconcile — depositor funds are protected by design.
          </p>
          {deficit.collateralShortfall > 0n && (
            <p className="mt-1 font-mono text-xs text-[rgba(230,237,243,0.6)]">
              Collateral shortfall: {formatAmount(deficit.collateralShortfall)} {TOKENS.collateral.symbol}
            </p>
          )}
          {deficit.borrowShortfall > 0n && (
            <p className="font-mono text-xs text-[rgba(230,237,243,0.6)]">
              Liquidity shortfall: {formatAmount(deficit.borrowShortfall)} {TOKENS.borrow.symbol}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (paused) {
    return (
      <div className="banner-warn flex items-center gap-3 p-4">
        <CirclePause className="h-5 w-5 shrink-0 text-[#d29922]" />
        <p className="text-sm text-[rgba(230,237,243,0.8)]">
          <span className="font-semibold text-[#d29922]">Market paused</span> by the guardian. Actions are
          temporarily disabled.
        </p>
      </div>
    );
  }

  return null;
}
