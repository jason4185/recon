import { studioDevnet } from "genlayer-js/chains";
import type { GenLayerChain } from "@genlayer/transaction-kit";
import { isAddress, type Address } from "viem";

export const STUDIO_NEXT_CHAIN_ID = 61997;
export const STUDIO_NEXT_CHAIN_ID_HEX = `0x${STUDIO_NEXT_CHAIN_ID.toString(16)}`;
export const STUDIO_NEXT_RPC_URL =
  import.meta.env.VITE_GENLAYER_RPC_URL || "https://studio-next.genlayer.com/api";
export const STUDIO_NEXT_EXPLORER_URL = "https://explorer-studio-dev.genlayer.com";
export const RECON_CONTRACT_ADDRESS =
  "0x1e01dCfaaCd4D7EbE5a6Ff3249Bff2331e546463" as Address;

export const studioNext = {
  ...studioDevnet,
  id: STUDIO_NEXT_CHAIN_ID,
  name: "GenLayer Studio Next",
  rpcUrls: { default: { http: [STUDIO_NEXT_RPC_URL] } },
  blockExplorers: {
    default: { name: "GenLayer Studio Explorer", url: STUDIO_NEXT_EXPLORER_URL },
  },
} satisfies GenLayerChain;

export function assertGenLayerConfiguration() {
  if (!STUDIO_NEXT_RPC_URL) {
    throw new Error("Studio Next RPC is not configured. Set VITE_GENLAYER_RPC_URL.");
  }
  if (!isAddress(RECON_CONTRACT_ADDRESS)) {
    throw new Error("The RECON contract address is invalid.");
  }
}

export function explorerTransactionUrl(txId: string) {
  return `${STUDIO_NEXT_EXPLORER_URL}/tx/${txId}`;
}
