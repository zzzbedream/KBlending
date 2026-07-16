"use client";

import { Activity } from "lucide-react";
import type { Position } from "@/hooks/useMarketData";
import { formatAmount, formatHealthFactor, healthTier } from "@/lib/format";
import { TOKENS } from "@/lib/config";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[rgba(230,237,243,0.6)]">{label}</span>
      <span className="font-mono text-sm">{value}</span>
    </div>
  );
}

export function PositionPanel({ position }: { position: Position | null }) {
  const hfTier = position ? healthTier(position.healthFactor) : "safe";
  const hfClass = hfTier === "danger" ? "hf-danger" : hfTier === "warn" ? "hf-warn" : "hf-safe";

  return (
    <div className="glass-panel p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[rgba(230,237,243,0.6)]">
          Your Position
        </h2>
        <div className="flex items-center gap-1.5">
          <Activity className={`h-4 w-4 ${hfClass}`} />
          <span className={`font-mono text-sm font-semibold ${hfClass}`}>
            HF {position ? formatHealthFactor(position.healthFactor) : "—"}
          </span>
        </div>
      </div>

      {position ? (
        <div className="divide-y divide-[var(--card-border)]">
          <Row label="Supplied" value={`${formatAmount(position.supplied)} ${TOKENS.borrow.symbol}`} />
          <Row label="Collateral" value={`${formatAmount(position.collateral)} ${TOKENS.collateral.symbol}`} />
          <Row label="Debt" value={`${formatAmount(position.debt)} ${TOKENS.borrow.symbol}`} />
          <Row
            label={`Wallet ${TOKENS.collateral.symbol}`}
            value={formatAmount(position.collateralBalance)}
          />
          <Row label={`Wallet ${TOKENS.borrow.symbol}`} value={formatAmount(position.borrowBalance)} />
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-[rgba(230,237,243,0.5)]">
          Connect your wallet to see your position.
        </p>
      )}
    </div>
  );
}
