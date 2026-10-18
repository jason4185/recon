# RECON V1 Payout Safety

## Accounting model

For each agreement `a`:

```text
escrow[a] = request_count[a] × reward[a]
provider_entitlement[a] = popcount(accepted_mask[a]) × reward[a]
customer_entitlement[a] = escrow[a] − provider_entitlement[a]
```

Before evaluation both entitlements are unavailable. On expiry, provider entitlement is zero and the customer entitlement is the original escrow. The accepted mask is bounded to the registered request count and can contain no bit for a missing response.

The source enforces these invariants:

```text
0 ≤ provider_entitlement ≤ escrow
0 ≤ customer_entitlement ≤ escrow
provider_entitlement + customer_entitlement = escrow
claimed_total[a] ≤ escrow[a]
provider_claimed[a] and customer_refund_claimed[a] are one-way flags
```

`claimed_total` is per agreement, not global. No claim computes an amount from the contract’s aggregate balance, so one agreement cannot consume another agreement’s funds. There is no owner withdrawal or arbitrary-recipient withdrawal. A payable creation call accepts only its exact escrow; nonpayable methods do not define a funding path. The contract defines no `__receive__` fallback for unsolicited no-method transfers, so that path must be verified as rejected by the target runtime rather than treated as protocol revenue.

Arithmetic uses explicit u256 range checks for addition and multiplication. Maximum five requests bounds the mask and popcount. The exact value comparison rejects both underfunding and unexpected attached value.

## Claim sequence

Each nonzero claim performs the following deterministic sequence:

1. Check agreement existence, lifecycle state, role, and one-way claim flag.
2. Compute the immutable entitlement and verify the new cumulative total is at most original escrow.
3. Compute a possible close timestamp before emitting a message.
4. Emit the external native-GEN transfer to the stored role address.
5. Only after emission returns, write `claimed_total` and the claim flag.
6. Close only when both entitlement sides are marked claimed.

The emit-first order makes an ordinary synchronous `emit_transfer` exception leave host-observable claim state unchanged and therefore retryable. It is not equivalent to transactional receipt confirmation.

## GenLayer external-message semantics

Native GEN transfers to EOA/EVM addresses use the external-message interface. GenLayer documents that:

```text
sender balance → message → recipient balance
```

The sender balance is debited when the message is emitted, the child transaction is created/executed at finalization, and a failed child transaction is not automatically returned to the sender. RECON has no supported callback that authenticates a child result back into the Intelligent Contract and no safe way to distinguish “not yet finalized” from “failed” inside a later claim call.

Consequences:

- A parent claim transaction can be successful while the child transfer is still pending.
- A child failure after parent finalization can leave the recipient unpaid and the value absent from the contract.
- The claim flag prevents duplicate payout, but also prevents an unsafe blind retry.
- If both claim flags are set, `CLOSED` means the two claim obligations were recorded, not that a wallet balance was independently observed.
- A failed customer refund after expiry can strand the full agreement escrow.
- A failed provider payment can strand only the provider entitlement; the customer refund remains a separate claim unless it also fails.

No automatic rollback, synchronous delivery confirmation, retry, treasury sweep, or privileged rescue has been added. Such a mechanism would need a verified child receipt/finality API and replay-safe identity. Until Studio Next verifies this exact transfer path, the payout-loss risk is a deployment blocker.

## Required Studio verification

Before deployment, run controlled tests on the pinned runner and Studio Next using disposable test accounts only:

- successful provider and customer EOA transfers;
- triggered child transaction IDs for both claim methods;
- parent accepted/finalized status and child final status;
- recipient balance before and after child finalization;
- a deliberately failing child transfer if the environment can safely create one;
- confirmation that a failed child does not silently return value;
- confirmation that a parent with a transfer message cannot be replayed to double-pay;
- appeal/finality behavior for the parent and external finalization message;
- expiry refund behavior under the same conditions.

The host suite can test only the call boundary and accounting transitions. It cannot prove child-message finality or recipient balance conservation.
