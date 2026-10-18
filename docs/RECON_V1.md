# RECON V1

RECON is a service-payment and invoice-verification Intelligent Contract. The customer defines the work and acceptance criteria onchain, locks native GEN, and assigns one provider. The provider submits one externally hosted evidence document. GenLayer validators independently verify and assess that document; deterministic contract code performs all settlement arithmetic.

## Customer and provider workflow

1. The customer calls `create_agreement` with the provider address, title, description, request definitions, reward per request, and an absolute Unix deadline. The transaction sender is always the customer; there is no customer address argument. The payable value must equal `request_count × reward_per_request` exactly.
2. The agreement starts `FUNDED`. Request IDs, task descriptions, acceptance criteria, provider, reward, escrow, and deadline cannot be changed.
3. Before the deadline, the assigned provider calls `submit_evidence` with one HTTPS Netlify URL and its lowercase SHA-256 commitment. `EVALUATING` is an in-flight execution phase; it is not written as a durable status before consensus.
4. The leader and each validator independently fetch the URL, hash the exact raw response bytes, decode UTF-8, parse and bound the JSON, and evaluate the supplied response text against the stored requirements.
5. A successful consensus stores one bounded `accepted_mask` and moves the agreement to `EVALUATED`. No customer approval is performed or required.
6. The provider calls `claim_provider_payment`; the customer calls `claim_customer_refund`. Claims are independent and protected by per-agreement claim flags and a cumulative escrow counter. Once both sides have no remaining claim, the state is `CLOSED`.
7. If the provider has not committed a successful evaluation by the deadline, the customer calls `expire_agreement`. This moves `FUNDED` to `EXPIRED` and disables provider payment. The customer then claims the full escrow with `claim_customer_refund`.

An expiry call is allowed only from `FUNDED`. GenLayer orders transactions for one Intelligent Contract, so an in-flight submission and a queued expiry cannot execute concurrently. The submission commits `EVALUATED` only after consensus; if it fails because evidence is invalid or consensus fails, no evaluation state is written and the provider can retry while the deadline remains open.

## Limits and storage

The contract constants are authoritative:

| Field | Limit |
| --- | ---: |
| Agreements | 10,000 |
| Requests per agreement | 1–5 |
| Request ID | 64 lowercase ASCII characters |
| Title | 160 characters |
| Agreement description | 4,000 characters |
| Task description | 2,000 characters |
| Acceptance criteria | 2,000 characters |
| Evidence URL | 2,048 characters |
| Raw evidence body | 8,192 bytes |
| Individual response | 2,048 characters |

There is no persistent dynamic-array storage. Agreement-level fields use fixed typed scalar values and `TreeMap`; request records are keyed by `agreement_id:slot`, and request ID lookup is keyed by `agreement_id:request_id`. The accepted outcomes are a five-bit mask. All persistent fields are declared in the `Recon` class body.

GEN amounts are `u256` native base units. A reward of `2` means two units in the transaction's native GEN denomination; callers must perform any wallet-side denomination conversion.

## Evidence JSON

The committed response body must be a UTF-8 JSON object with exactly `agreement_id` and `responses`. Each response object must have exactly `request_id` and `response`. Duplicate keys, non-standard JSON constants, unknown fields, wrong types, and deeply malformed JSON are rejected before evaluation. A payment total, score, or acceptance status is not an accepted evidence field and can never be authoritative.

```json
{
  "agreement_id": 17,
  "responses": [
    {"request_id": "request-1", "response": "The completed result..."},
    {"request_id": "request-3", "response": "Another completed result..."}
  ]
}
```

Each response must use a registered request ID, and IDs cannot repeat. Unknown IDs, duplicate IDs, wrong agreement IDs, malformed JSON, invalid UTF-8, non-2xx responses, oversized bodies, and SHA-256 mismatches are invalid and cannot produce a payment. Missing registered requests are validly represented by omission and always receive a zero bit. An empty response is bounded but can only be accepted if the independent evaluator determines that it satisfies the onchain criteria.

Submission URLs must use `https://`, contain a `*.netlify.app` host, and have no whitespace, userinfo, port, fragment, or backslash. If the GenLayer web response exposes its final URL, it must equal the committed URL; a different final URL is rejected. The contract commits and hashes raw response bytes before UTF-8 decoding.

## GenLayer evaluation and consensus

The nondeterministic operation uses the Studio Next-supported `gl.vm.run_nondet` entrypoint and returns only:

```json
{"accepted_mask": 5, "present_mask": 7}
```

Bit `0` corresponds to the first registered request. `present_mask` is procedural evidence metadata; only `accepted_mask` affects settlement. The leader fetches and parses the evidence, then prompts an evaluator. A validator independently repeats the fetch, parsing, and evaluation, and consensus requires the same bounded mask and presence mask. A validator does not merely check the leader's JSON shape.

The prompt treats provider responses as untrusted data. It instructs the evaluator not to follow response-contained commands, payment claims, scores, or status declarations, to reject missing requests, and to use only the original customer-defined task and acceptance criteria. The LLM cannot select a wallet, amount, reward, refund, or payment percentage. Deterministic code derives payment from the accepted mask.

The evidence document is a commitment to bytes available at evaluation time. It does not prove that a real-world service happened, that the provider authored the document, or that an external event described by the response occurred. A Netlify redirect or hosting compromise is also outside the contract's evidence-authenticity guarantees; the contract validates the submitted URL's structure and the fetched bytes' commitment.

## Settlement calculations

For `n` requests and reward `r`:

```text
escrow = n × r
provider entitlement = popcount(accepted_mask) × r
customer refund entitlement = escrow − provider entitlement
```

For example, five requests at two GEN each create a 10 GEN escrow. An accepted mask with three bits set gives the provider 6 GEN and the customer 4 GEN. Zero accepted bits gives the customer the full escrow; all five bits gives the provider the full escrow.

The provider can never change the reward or accepted mask. Each agreement has separate provider/customer claim flags and `claimed_total`; a claim is rejected if it would exceed that agreement's escrow. The transfer is emitted before one-way claim state is written, so a synchronous emission error leaves the claim retryable. Role checks use the stored customer/provider addresses. Repeated claims, cross-agreement IDs, wrong wallets, and claims before evaluation/expiry are rejected.

## Public contract interface

Configuration and views:

- `get_config() -> dict`: limits, statuses, and evidence host.
- `get_agreement_count() -> u256`.
- `get_agreement(agreement_id) -> dict`: agreement, evidence, mask, counts, entitlements, claim flags, and accounting state.
- `get_status(agreement_id) -> str`.
- `get_expiry_status(agreement_id) -> dict`: deadline, current deadline boundary, expiry eligibility, and state.
- `get_request(agreement_id, slot) -> dict`: zero-based slot, immutable request fields, outcome, acceptance, and reward.
- `get_request_by_id(agreement_id, request_id) -> dict`.
- `get_evidence(agreement_id) -> dict`: committed URL and SHA-256.
- `get_claim_status(agreement_id) -> dict`: entitlements, flags, claimed total, and remaining escrow.

State-changing methods:

- `create_agreement(provider, title, description, requests, reward_per_request, deadline) -> u256` (`payable`). Each request object is exactly `{request_id, task, acceptance_criteria}`. The transaction sender becomes the customer.
- `submit_evidence(agreement_id, evidence_url, evidence_sha256) -> u256`: provider-only; returns the agreed accepted mask on success.
- `expire_agreement(agreement_id) -> None`: customer-only after the deadline, only from `FUNDED`.
- `claim_provider_payment(agreement_id) -> None`: provider-only after `EVALUATED`.
- `claim_customer_refund(agreement_id) -> None`: customer-only after `EVALUATED` or `EXPIRED`.

Persistent statuses are `FUNDED → EVALUATED → CLOSED`, or `FUNDED → EXPIRED → CLOSED`; `EVALUATING` is a temporary execution phase. It is not a retryable stored outcome after a failed transaction.

## Payout and finality limitations

Payouts use the GenLayer external-message interface to the stored EOA addresses. The contract emits the transfer before recording the one-way claim state, which protects against a synchronous emission error. External messages execute at finalization; the child transfer is asynchronous, and a failed child transaction is not automatically refunded to this contract. V1 therefore prevents duplicate claims but does not promise automatic payout retry after a downstream transfer failure. Studio and network verification of that failure behavior remains required before deployment.

## Validation

Host tests are under `tests/test_recon_security.py`. They exercise validation, state transitions, authorization, independent-call structure through a stub, consensus disagreement, and settlement arithmetic without claiming full GenVM execution.

```bash
PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 python3 -m pytest -q
genvm-lint check contracts/recon.py
```

The pinned runner artifact must be locally available for semantic validation. No deployment, GEN transfer, live wallet transaction, or frontend is included in V1 implementation.
