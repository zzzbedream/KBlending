"use client";

import { useMemo, useState } from "react";
import { LoaderCircle, Droplets } from "lucide-react";
import { MaxUint256 } from "ethers";
import type { WalletState } from "@/hooks/useWallet";
import type { MarketData, Position } from "@/hooks/useMarketData";
import { ADDRESSES, TOKENS } from "@/lib/config";
import { formatAmount, parseAmount } from "@/lib/format";
import * as actions from "@/lib/actions";

type TabKey = "supply" | "withdrawSupply" | "deposit" | "withdraw" | "borrow" | "repay";

type TabDef = {
  key: TabKey;
  label: string;
  tokenSymbol: string;
  approveToken?: string; // token that must be approved before the action
};

const TABS: TabDef[] = [
  { key: "supply", label: "Supply", tokenSymbol: TOKENS.borrow.symbol, approveToken: ADDRESSES.borrow },
  { key: "withdrawSupply", label: "Withdraw Supply", tokenSymbol: TOKENS.borrow.symbol },
  { key: "deposit", label: "Add Collateral", tokenSymbol: TOKENS.collateral.symbol, approveToken: ADDRESSES.collateral },
  { key: "withdraw", label: "Withdraw Collateral", tokenSymbol: TOKENS.collateral.symbol },
  { key: "borrow", label: "Borrow", tokenSymbol: TOKENS.borrow.symbol },
  { key: "repay", label: "Repay", tokenSymbol: TOKENS.borrow.symbol, approveToken: ADDRESSES.borrow },
];

const FAUCET_AMOUNT = 10_000n * 10n ** 18n;

type Props = {
  wallet: WalletState;
  market: MarketData | null;
  position: Position | null;
  disabled: boolean;
  onRefresh: () => Promise<void>;
};

export function ActionPanel({ wallet, position, disabled, onRefresh }: Props) {
  const [tab, setTab] = useState<TabKey>("supply");
  const [amount, setAmount] = useState("");
  const [maxSelected, setMaxSelected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  const active = useMemo(() => TABS.find((t) => t.key === tab)!, [tab]);

  const maxAmount = useMemo<bigint | null>(() => {
    if (!position) return null;
    switch (tab) {
      case "supply":
        return position.borrowBalance;
      case "withdrawSupply":
        return position.supplied;
      case "deposit":
        return position.collateralBalance;
      case "withdraw":
        return position.collateral;
      case "repay":
        return position.debt < position.borrowBalance ? position.debt : position.borrowBalance;
      default:
        return null; // borrow has no simple max on the client
    }
  }, [tab, position]);

  function selectTab(key: TabKey) {
    setTab(key);
    setAmount("");
    setMaxSelected(false);
    setMessage(null);
  }

  function fillMax() {
    if (maxAmount === null) return;
    setAmount(formatAmount(maxAmount, 18, 18));
    setMaxSelected(true);
    setMessage(null);
  }

  async function submit() {
    setMessage(null);
    let value: bigint;
    try {
      value = parseAmount(amount);
      if (value <= 0n) throw new Error("Enter an amount greater than zero");
    } catch {
      setMessage({ kind: "error", text: "Invalid amount" });
      return;
    }

    setBusy(true);
    try {
      const signer = await wallet.getSigner();
      // "Max" on full-exit actions sends the uint256 sentinel to avoid dust from interest accrual.
      const useSentinel = maxSelected && (tab === "withdrawSupply" || tab === "repay");
      const sendValue = useSentinel ? MaxUint256 : value;

      if (active.approveToken) {
        const current =
          active.approveToken === ADDRESSES.borrow
            ? (position?.borrowAllowance ?? 0n)
            : (position?.collateralAllowance ?? 0n);
        await actions.ensureAllowance(signer, active.approveToken, value, current);
      }

      switch (tab) {
        case "supply":
          await actions.supply(signer, value);
          break;
        case "withdrawSupply":
          await actions.withdrawSupply(signer, sendValue);
          break;
        case "deposit":
          await actions.depositCollateral(signer, value);
          break;
        case "withdraw":
          await actions.withdrawCollateral(signer, value);
          break;
        case "borrow":
          await actions.borrow(signer, value);
          break;
        case "repay":
          await actions.repay(signer, wallet.address!, sendValue);
          break;
      }

      setAmount("");
      setMaxSelected(false);
      setMessage({ kind: "ok", text: "Transaction confirmed" });
      await onRefresh();
    } catch (e: unknown) {
      setMessage({ kind: "error", text: friendlyError(e) });
    } finally {
      setBusy(false);
    }
  }

  async function faucet() {
    if (!wallet.address) return;
    setBusy(true);
    setMessage(null);
    try {
      const signer = await wallet.getSigner();
      await actions.faucetMint(signer, ADDRESSES.collateral, wallet.address, FAUCET_AMOUNT);
      await actions.faucetMint(signer, ADDRESSES.borrow, wallet.address, FAUCET_AMOUNT);
      setMessage({ kind: "ok", text: "Minted 10,000 of each test token" });
      await onRefresh();
    } catch (e: unknown) {
      setMessage({ kind: "error", text: friendlyError(e) });
    } finally {
      setBusy(false);
    }
  }

  const canAct = wallet.isConnected && !wallet.isWrongChain && !disabled && !busy;

  return (
    <div className="glass-panel p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[rgba(230,237,243,0.6)]">
        Actions
      </h2>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? "tab-active" : ""}`}
            style={{ flex: "1 1 30%" }}
            onClick={() => selectTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            className="input pr-16"
            inputMode="decimal"
            placeholder="0.0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setMaxSelected(false);
            }}
          />
          {maxAmount !== null && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold text-[var(--primary)]"
              onClick={fillMax}
            >
              MAX
            </button>
          )}
        </div>
        <span className="w-16 text-sm text-[rgba(230,237,243,0.6)]">{active.tokenSymbol}</span>
      </div>

      {maxAmount !== null && (
        <p className="mt-2 text-xs text-[rgba(230,237,243,0.45)]">
          Available: {formatAmount(maxAmount)} {active.tokenSymbol}
        </p>
      )}

      <button className="btn btn-primary mt-4 w-full" onClick={() => void submit()} disabled={!canAct}>
        {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {active.label}
      </button>

      {message && (
        <p className={`mt-3 text-sm ${message.kind === "error" ? "hf-danger" : "hf-safe"}`}>{message.text}</p>
      )}

      <div className="mt-5 border-t border-[var(--card-border)] pt-4">
        <button className="btn btn-ghost w-full" onClick={() => void faucet()} disabled={!canAct}>
          <Droplets className="h-4 w-4" />
          Get test tokens (faucet)
        </button>
      </div>
    </div>
  );
}

function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/user rejected|ACTION_REJECTED/i.test(msg)) return "Transaction rejected in wallet";
  if (/Undercollateralized/.test(msg)) return "Would exceed the max LTV (40%)";
  if (/InsufficientLiquidity/.test(msg)) return "Not enough liquidity in the market";
  if (/DeficitDetected/.test(msg)) return "Protocol is paused (deficit detected)";
  if (/NotLiquidatable/.test(msg)) return "Position is healthy";
  return msg.length > 120 ? msg.slice(0, 120) + "…" : msg;
}
