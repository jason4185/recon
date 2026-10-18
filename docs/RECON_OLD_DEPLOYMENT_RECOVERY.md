# RECON Old Deployment Recovery

This document is intentionally separate from the active frontend configuration. The frontend must use only the new deployment.

## Retired deployment

- Contract: `0x5a3Ced8669650e99C868df2873A884Edb642C484`
- Agreement ID: `1`
- Customer: `0xC8Ba5DA455b011863F2ECa76a6fa21E62Cc91B87`
- Original escrow: `1 GEN`
- Deadline: `2026-10-20 18:00 WAT`

Read-only Studio Next calls confirmed the agreement remained `FUNDED` with `1 GEN` recorded and no claims at the time of this document. Recovery has not been executed or assumed successful.

After the deadline, the customer should:

1. Call `expire_agreement(1)` on the retired contract and wait for successful finalization.
2. Call `claim_customer_refund(1)` as the same customer.
3. Verify the parent transaction and the outgoing child transfer separately.

Native GEN transfers are asynchronous. A finalized parent claim does not by itself prove that the customer wallet received the refund, and no automatic retry should be assumed.
