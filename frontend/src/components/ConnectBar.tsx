"use client";

import { Wallet, TriangleAlert, LoaderCircle, ShieldCheck } from "lucide-react";
import type { WalletState } from "@/hooks/useWallet";
import { KUB_TESTNET } from "@/lib/config";
import { shortenAddress } from "@/lib/format";

export function ConnectBar({ wallet }: { wallet: WalletState }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]">
          <ShieldCheck className="h-5 w-5 text-[#0d1117]" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gradient">KBlending</h1>
          <p className="text-xs text-[rgba(230,237,243,0.5)]">KAP-20 lending on KUB Chain</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {wallet.isWrongChain && (
          <button className="btn btn-ghost" onClick={() => void wallet.switchChain()}>
            <TriangleAlert className="h-4 w-4 text-[#d29922]" />
            Switch to {KUB_TESTNET.chainName}
          </button>
        )}
        {wallet.isConnected ? (
          <span className="badge font-mono text-[rgba(230,237,243,0.8)]">
            <span className="h-2 w-2 rounded-full bg-[#3fb950]" />
            {shortenAddress(wallet.address ?? "")}
          </span>
        ) : (
          <button className="btn btn-primary" onClick={() => void wallet.connect()} disabled={wallet.connecting}>
            {wallet.connecting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <Wallet className="h-4 w-4" />
            )}
            {wallet.connecting ? "Connecting…" : "Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  );
}
