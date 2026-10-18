# RECON frontend

RECON is a React/TanStack frontend for the deployed GenLayer Intelligent Contract. It reads the live contract and sends wallet-approved writes through Transaction Kit RC2. There is no demo state, seeded agreement data, localStorage persistence, simulated evaluation, or simulated GEN payment in the application.

## Network

- Network: GenLayer Studio Next
- Chain ID: `61997` (`0xf1cd`)
- RPC: `https://studio-next.genlayer.com/api` (override with `VITE_GENLAYER_RPC_URL` when required)
- Contract: `0x1e01dCfaaCd4D7EbE5a6Ff3249Bff2331e546463`
- Explorer: `https://explorer-studio-dev.genlayer.com`

The contract address is centralized in `src/lib/genlayer/network.ts`. The RPC URL is configured there from `VITE_GENLAYER_RPC_URL` or the verified Studio Next endpoint. The frontend does not deploy or switch to another network.

## Run locally

```bash
bun install
bun run dev
```

Open `http://localhost:3000`. A browser wallet with injected EIP-1193 support is needed for writes. The wallet must be on Studio Next. The application may read public state only after a wallet connection in the app workspace; disconnected pages show a connection prompt.

## Integration architecture

- `src/lib/genlayer/network.ts` — Studio Next chain and RECON address.
- `src/lib/genlayer/client.ts` — read client and connected wallet client.
- `src/lib/genlayer/wallet.tsx` — injected wallet discovery, account/network changes, and chain switching.
- `src/lib/genlayer/reads.ts` — typed contract views using `latest-nonfinal` reads and bounded agreement enumeration.
- `src/lib/genlayer/writes.ts` — exact RECON call arguments and bigint escrow calculations.
- `src/lib/genlayer/transaction.tsx` — PITCH-derived Transaction Kit RC2 review, hold-to-sign, accepted tracking, finalized tracking, and external-message fee handling.

The interface derives permissions from the connected address and each agreement's onchain customer/provider fields. No customer/provider role selector exists.

## Contract workflow

Creation calls `create_agreement(provider, title, description, requests, reward_per_request, deadline)` with request objects shaped as `{ request_id, task, acceptance_criteria }`. Displayed GEN amounts are converted exactly to 18-decimal base units with bigint arithmetic. The payable value is `request_count × reward_per_request`.

Evidence submission starts with only a direct HTTPS `*.netlify.app` URL. A TanStack Start `createServerFn` fetches the deployed file server-side with no-store headers, rejects credentials, ports, unsafe hosts, redirects, non-2xx responses, invalid UTF-8, malformed/duplicate-key JSON, unknown or duplicate request IDs, and bodies over the contract's 8,192-byte limit. It hashes the exact response bytes with Web Crypto SHA-256 and returns a lowercase hexadecimal commitment; the UI keeps that field read-only and rechecks the same URL immediately before opening Transaction Kit. The write is `submit_evidence(agreement_id, evidence_url, evidence_sha256)`. The contract and GenLayer validators retrieve the Netlify document again, hash exact bytes, parse it, and evaluate the registered requests. Frontend verification is a preflight convenience, not a guarantee that the later validator fetch will see identical bytes or accept the work.

Claims call `claim_provider_payment`, `claim_customer_refund`, or `expire_agreement` only when the current contract read and connected address permit the action. A claim transaction can be submitted, accepted, or finalized independently. Because RECON uses asynchronous native GEN external messages, a finalized claim parent does not by itself prove the recipient wallet received GEN; the UI intentionally does not claim that it does.

## Validation

```bash
bun run typecheck
bun run lint
bun run test
bun run build
```

No live write transaction is executed by these checks. Manual Studio Next verification is still required for wallet signing, payable creation, evidence consensus, external-message fee allocation, and claim settlement.
