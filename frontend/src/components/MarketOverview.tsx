"use client";

import type { ComponentType } from "react";
import { Landmark, HandCoins, Droplets, Gauge, Coins } from "lucide-react";
import type { MarketData } from "@/hooks/useMarketData";
import { formatAmount, formatWadPercent } from "@/lib/format";
import { TOKENS } from "@/lib/config";

type IconType = ComponentType<{ className?: string }>;

function StatCard({ icon: Icon, label, value, unit }: { icon: IconType; label: string; value: string; unit?: string }) {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--primary)]" />
        <span className="stat-label">{label}</span>
      </div>
      <p className="stat-value mt-2">
        {value}
        {unit && <span className="ml-1 text-sm text-[rgba(230,237,243,0.5)]">{unit}</span>}
      </p>
    </div>
  );
}

export function MarketOverview({ market }: { market: MarketData | null }) {
  const dash = "—";
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[rgba(230,237,243,0.6)]">
        Market Overview
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          icon={Landmark}
          label="Total Supplied"
          value={market ? formatAmount(market.totalSupplied) : dash}
          unit={TOKENS.borrow.symbol}
        />
        <StatCard
          icon={HandCoins}
          label="Total Borrowed"
          value={market ? formatAmount(market.totalBorrows) : dash}
          unit={TOKENS.borrow.symbol}
        />
        <StatCard
          icon={Droplets}
          label="Available Liquidity"
          value={market ? formatAmount(market.borrowCash) : dash}
          unit={TOKENS.borrow.symbol}
        />
        <StatCard
          icon={Coins}
          label="Collateral Locked"
          value={market ? formatAmount(market.totalCollateral) : dash}
          unit={TOKENS.collateral.symbol}
        />
        <StatCard
          icon={Gauge}
          label="Utilization"
          value={market ? formatWadPercent(market.utilizationWad) : dash}
        />
      </div>
    </section>
  );
}
