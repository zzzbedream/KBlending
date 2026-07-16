"use client";

import { useCallback, useEffect, useState } from "react";
import { BrowserProvider, type Eip1193Provider } from "ethers";
import { KUB_TESTNET } from "@/lib/config";

type InjectedProvider = Eip1193Provider & {
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

function getInjected(): InjectedProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { ethereum?: InjectedProvider }).ethereum;
}

const CHAIN_ID_HEX = "0x" + KUB_TESTNET.chainId.toString(16);

export type WalletState = {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  isWrongChain: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  switchChain: () => Promise<void>;
  disconnect: () => void;
  getSigner: () => Promise<import("ethers").Signer>;
};

export function useWallet(): WalletState {
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const injected = getInjected();
    if (!injected) return;
    const provider = new BrowserProvider(injected);
    const accounts = await provider.send("eth_accounts", []);
    const net = await provider.getNetwork();
    setAddress(accounts.length ? (accounts[0] as string) : null);
    setChainId(Number(net.chainId));
  }, []);

  useEffect(() => {
    const injected = getInjected();
    if (!injected?.on) return;
    const onAccounts = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      setAddress(accounts?.length ? accounts[0] : null);
    };
    const onChain = (...args: unknown[]) => setChainId(Number(args[0] as string));
    injected.on("accountsChanged", onAccounts);
    injected.on("chainChanged", onChain);
    // Syncing with an external system (the wallet): setState happens after async reads, not in render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    return () => {
      injected.removeListener?.("accountsChanged", onAccounts);
      injected.removeListener?.("chainChanged", onChain);
    };
  }, [refresh]);

  const switchChain = useCallback(async () => {
    const injected = getInjected();
    if (!injected) return;
    try {
      await injected.request({ method: "wallet_switchEthereumChain", params: [{ chainId: CHAIN_ID_HEX }] });
    } catch {
      // Chain not added to the wallet yet — add it, then it becomes selected.
      await injected.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: CHAIN_ID_HEX,
            chainName: KUB_TESTNET.chainName,
            rpcUrls: [KUB_TESTNET.rpcUrl],
            nativeCurrency: KUB_TESTNET.nativeCurrency,
            blockExplorerUrls: [KUB_TESTNET.explorer],
          },
        ],
      });
    }
    await refresh();
  }, [refresh]);

  const connect = useCallback(async () => {
    const injected = getInjected();
    if (!injected) {
      setError("No EVM wallet detected. Install MetaMask or a compatible wallet.");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const provider = new BrowserProvider(injected);
      await provider.send("eth_requestAccounts", []);
      await refresh();
      const net = await provider.getNetwork();
      if (Number(net.chainId) !== KUB_TESTNET.chainId) await switchChain();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  }, [refresh, switchChain]);

  const getSigner = useCallback(async () => {
    const injected = getInjected();
    if (!injected) throw new Error("No wallet");
    const provider = new BrowserProvider(injected);
    return provider.getSigner();
  }, []);

  const disconnect = useCallback(() => setAddress(null), []);

  return {
    address,
    chainId,
    isConnected: !!address,
    isWrongChain: !!address && chainId !== null && chainId !== KUB_TESTNET.chainId,
    connecting,
    error,
    connect,
    switchChain,
    disconnect,
    getSigner,
  };
}
