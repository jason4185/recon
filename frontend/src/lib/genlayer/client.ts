import { createClient } from "genlayer-js";
import type { Eip1193Provider } from "@genlayer/transaction-kit";
import { assertGenLayerConfiguration, studioNext } from "./network";

export type BrowserProvider = Eip1193Provider;
export type GenLayerClient = ReturnType<typeof createClient>;

let readClient: GenLayerClient | undefined;

export function getReadClient() {
  assertGenLayerConfiguration();
  return (readClient ??= createClient({ chain: studioNext }));
}

export function getConnectedClient(provider: BrowserProvider, account: `0x${string}`) {
  assertGenLayerConfiguration();
  return createClient({ chain: studioNext, provider, account });
}

export function getInjectedProvider(): BrowserProvider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { ethereum?: BrowserProvider }).ethereum;
}
