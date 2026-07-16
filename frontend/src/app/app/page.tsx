"use client";

import Link from "next/link";
import { ExternalLink, TriangleAlert } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useMarketData } from "@/hooks/useMarketData";
import { ConnectBar } from "@/components/ConnectBar";
import { DeficitBanner } from "@/components/DeficitBanner";
import { MarketOverview } from "@/components/MarketOverview";
import { PositionPanel } from "@/components/PositionPanel";
import { ActionPanel } from "@/components/ActionPanel";
import { ADDRESSES, KUB_TESTNET, isConfigured, explorerAddress } from "@/lib/config";

export default function AppPage() {
  const wallet = useWallet();
  const { market, position, deficit, error, refresh } = useMarketData(wallet.address);
  const configured = isConfigured();
  const actionsDisabled = !!market?.paused || deficit.detected;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold text-[rgba(230,237,243,0.7)] hover:text-[var(--primary)]">
          ← KBlending
        </Link>
      </div>

      <ConnectBar wallet={wallet} />

      {!configured ? (
        <NotConfigured />
      ) : (
        <>
          <DeficitBanner deficit={deficit} paused={!!market?.paused} />

          {error && (
            <div className="banner-warn flex items-center gap-2 p-3 text-sm text-[rgba(230,237,243,0.8)]">
              <TriangleAlert className="h-4 w-4 text-[#d29922]" />
              Could not read on-chain state. Check the RPC / contract address.
            </div>
          )}

          <MarketOverview market={market} />

          <div className="grid gap-5 lg:grid-cols-2">
            <PositionPanel position={position} />
            <ActionPanel
              wallet={wallet}
              market={market}
              position={position}
              disabled={actionsDisabled}
              onRefresh={refresh}
            />
          </div>

          <Footer />
        </>
      )}
    </main>
  );
}

function NotConfigured() {
  return (
    <div className="glass-panel p-8 text-center">
      <h2 className="text-lg font-semibold">Contract addresses not configured</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-[rgba(230,237,243,0.6)]">
        Deploy the KBlending contracts to {KUB_TESTNET.chainName} and set{" "}
        <code>NEXT_PUBLIC_VAULT_ADDRESS</code>, <code>NEXT_PUBLIC_REALX_ADDRESS</code> and{" "}
        <code>NEXT_PUBLIC_KUSDT_ADDRESS</code> in your environment (see <code>.env.example</code>).
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--card-border)] pt-4 text-xs text-[rgba(230,237,243,0.5)]">
      <span>
        {KUB_TESTNET.chainName} · chainId {KUB_TESTNET.chainId} · testnet demo
      </span>
      <a
        className="inline-flex items-center gap-1 hover:text-[var(--primary)]"
        href={explorerAddress(ADDRESSES.vault)}
        target="_blank"
        rel="noopener noreferrer"
      >
        LendingVault on explorer <ExternalLink className="h-3 w-3" />
      </a>
    </footer>
  );
}
