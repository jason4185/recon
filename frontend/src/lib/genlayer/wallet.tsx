import { createTransactionKit, type TransactionKit } from "@genlayer/transaction-kit";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getConnectedClient, getInjectedProvider, type BrowserProvider, type GenLayerClient } from "./client";
import { STUDIO_NEXT_CHAIN_ID, STUDIO_NEXT_CHAIN_ID_HEX, STUDIO_NEXT_EXPLORER_URL, STUDIO_NEXT_RPC_URL, studioNext } from "./network";
import { normalizeReconError } from "./errors";
import { Button } from "../../components/ui/button";

type WalletStatus = "disconnected" | "connecting" | "connected" | "wrong-network" | "error";

type WalletContextValue = {
  address?: `0x${string}`;
  chainId?: number;
  status: WalletStatus;
  error?: string;
  provider?: BrowserProvider;
  kit?: TransactionKit;
  connectedClient?: GenLayerClient;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToStudioNext: () => Promise<void>;
  refresh: () => Promise<void>;
};

function asAddress(value: unknown) {
  return typeof value === "string" && /^0x[0-9a-fA-F]{40}$/.test(value)
    ? (value as `0x${string}`)
    : undefined;
}

function asChainId(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value !== "string") return undefined;
  const parsed = value.startsWith("0x") ? Number.parseInt(value.slice(2), 16) : Number.parseInt(value, 10);
  return Number.isInteger(parsed) ? parsed : undefined;
}

async function switchWallet(provider: BrowserProvider) {
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: STUDIO_NEXT_CHAIN_ID_HEX }] });
  } catch (reason) {
    if ((reason as { code?: number }).code !== 4902) throw reason;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: STUDIO_NEXT_CHAIN_ID_HEX,
        chainName: "GenLayer Studio Next",
        rpcUrls: [STUDIO_NEXT_RPC_URL],
        nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
        blockExplorerUrls: [STUDIO_NEXT_EXPLORER_URL],
      }],
    });
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: STUDIO_NEXT_CHAIN_ID_HEX }] });
  }
}

export function shortAddress(address: string, start = 6, end = 4) {
  return address.length > start + end + 3 ? `${address.slice(0, start)}…${address.slice(-end)}` : address;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider>();
  const [address, setAddress] = useState<`0x${string}`>();
  const [chainId, setChainId] = useState<number>();
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    const injected = provider ?? getInjectedProvider();
    if (!injected) {
      setProvider(undefined);
      setAddress(undefined);
      setChainId(undefined);
      setStatus("disconnected");
      return;
    }
    try {
      const [accounts, rawChainId] = await Promise.all([
        injected.request({ method: "eth_accounts" }),
        injected.request({ method: "eth_chainId" }),
      ]);
      const nextAddress = Array.isArray(accounts) ? asAddress(accounts[0]) : undefined;
      const nextChainId = asChainId(rawChainId);
      setProvider(injected);
      setAddress(nextAddress);
      setChainId(nextChainId);
      setStatus(nextAddress ? (nextChainId === STUDIO_NEXT_CHAIN_ID ? "connected" : "wrong-network") : "disconnected");
      setError(undefined);
    } catch (reason) {
      setStatus("error");
      setError(normalizeReconError(reason));
    }
  }, [provider]);

  useEffect(() => {
    const injected = getInjectedProvider();
    if (!injected) return;
    // Wallet discovery is an external subscription; the refresh updates state from its provider response.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const events = injected as BrowserProvider & {
      on?: (event: string, listener: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
    };
    const onAccounts = () => void refresh();
    const onChain = () => void refresh();
    events.on?.("accountsChanged", onAccounts);
    events.on?.("chainChanged", onChain);
    return () => {
      events.removeListener?.("accountsChanged", onAccounts);
      events.removeListener?.("chainChanged", onChain);
    };
  }, [refresh]);

  const connect = useCallback(async () => {
    if (status === "connecting") return;
    const injected = provider ?? getInjectedProvider();
    if (!injected) {
      setStatus("error");
      setError("No injected EIP-1193 wallet was detected.");
      return;
    }
    setStatus("connecting");
    setError(undefined);
    try {
      await injected.request({ method: "eth_requestAccounts" });
      setProvider(injected);
      await refresh();
    } catch (reason) {
      setStatus("error");
      setError(normalizeReconError(reason));
    }
  }, [provider, refresh, status]);

  const disconnect = useCallback(() => {
    setAddress(undefined);
    setStatus("disconnected");
    setError(undefined);
  }, []);

  const switchToStudioNext = useCallback(async () => {
    const injected = provider ?? getInjectedProvider();
    if (!injected) {
      setStatus("error");
      setError("Connect an injected wallet before switching networks.");
      return;
    }
    try {
      await switchWallet(injected);
      setProvider(injected);
      await refresh();
    } catch (reason) {
      setError(normalizeReconError(reason));
      setStatus("wrong-network");
    }
  }, [provider, refresh]);

  const kit = useMemo(
    () => (status === "connected" && provider && address
      ? createTransactionKit({ chain: studioNext, provider, account: address })
      : undefined),
    [address, provider, status],
  );
  const connectedClient = useMemo(
    () => (status === "connected" && provider && address ? getConnectedClient(provider, address) : undefined),
    [address, provider, status],
  );
  const value = useMemo<WalletContextValue>(
    () => ({ address, chainId, status, error, provider, kit, connectedClient, connect, disconnect, switchToStudioNext, refresh }),
    [address, chainId, status, error, provider, kit, connectedClient, connect, disconnect, switchToStudioNext, refresh],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used inside WalletProvider.");
  return context;
}

export function WalletControl({ compact = false }: { compact?: boolean }) {
  const wallet = useWallet();
  const action = wallet.status === "connecting"
    ? <Button size="sm" disabled>Connecting…</Button>
    : wallet.status === "wrong-network"
      ? <Button size={compact ? "sm" : undefined} onClick={() => void wallet.switchToStudioNext()}>Switch to Studio Next</Button>
      : wallet.address
        ? <button type="button" onClick={wallet.disconnect} className="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-white/20 hover:text-white" title="Disconnect this frontend session">{shortAddress(wallet.address)}</button>
        : <Button size={compact ? "sm" : undefined} onClick={() => void wallet.connect()}>Connect wallet</Button>;
  return <div className="flex flex-col items-end gap-1">{action}{wallet.error ? <span className="max-w-[260px] text-right text-[10px] leading-4 text-red-200/70">{wallet.error}</span> : null}</div>;
}
