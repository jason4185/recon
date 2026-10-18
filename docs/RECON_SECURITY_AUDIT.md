# RECON V1 Security Audit

Date: 2026-10-17

Scope: `contracts/recon.py`, its host adversarial tests, and the read-only GAVEL, VETO, and MANDATE reference projects. No deployment, wallet transaction, or real GEN transfer was performed.

## Verdict

The deterministic escrow arithmetic, authorization, state gates, request immutability, evidence commitment checks, and leader/validator comparison are coherent in source and pass the host security suite. The contract is not financially deployment-ready until Studio Next verifies the external child-transfer path. GenLayer documents that value is deducted when a message is emitted and is not automatically returned if the child transaction fails. RECON records a claim after emission and has no child-receipt callback or safe retry primitive. A downstream failure can therefore make an entitlement permanently inaccessible and can close an agreement without proving recipient receipt.

Final verdict: **BLOCKED for deployment; suitable for controlled Studio Next verification only.**

## Findings

### HIGH — deployed evaluation used an unavailable nondeterministic API — fixed locally; redeployment required

Affected function: `_run_evaluation`.

The deployed source called `gl.vm.run_nondet_unsafe`, but the Studio Next runtime exposes the supported consensus entrypoint as `gl.vm.run_nondet`. The failed transaction `0x497decd6d1f127b7ae1ac416b801c3ed6d9a312d056849553e59f2a8b62eb316` finalized with a contract error before evaluation because the attribute lookup failed. The local source now uses `gl.vm.run_nondet(leader_fn, validator_fn)`, matching the working PITCH, VETO, and MANDATE contracts and a successful Studio Next PITCH evaluation.

This cannot repair the already deployed bytecode. A new deployment is required before RECON can execute `submit_evidence` successfully.

### CRITICAL — downstream GEN transfer failure has no recovery path — unresolved

Affected functions: `claim_provider_payment`, `claim_customer_refund`, `_send_value`.

The contract emits an external transfer to the stored provider or customer address. The claim flag and cumulative accounting are written after emission, which protects against a synchronous emission exception. However, GenLayer external messages execute asynchronously at finalization and the documented value-flow rule does not return value when the child transaction fails. Once the parent finalizes, RECON cannot observe that child result, cannot safely retry, and cannot restore the entitlement. If both sides have claim flags set, `_maybe_close` can move the agreement to `CLOSED` even when one or both recipients did not receive GEN.

Impact: the failed child amount can be unavailable to the intended recipient and unavailable to the contract. On expiry, a failed customer refund can strand the whole escrow because the provider side is already marked as the zero-entitlement side. This is a real runtime/finality risk, not a host-test failure.

Remediation implemented: emit before writing one-way claim state, matching the safer VETO pattern for synchronous failures. Automatic rollback or retry was deliberately not invented because the verified APIs do not expose an authenticated child-success callback. Studio must verify ordinary EOA transfers, child failure behavior, triggered transaction IDs, and final balances before any deployment decision.

### HIGH — Netlify evidence is not proof of real-world service activity — unresolved by design

Affected functions: `_fetch_evidence`, `_parse_evidence_body`, `_evaluation_prompt`, `_run_evaluation`.

The provider can publish a coherent, fabricated JSON record on a Netlify site it controls. SHA-256 proves that validators evaluated the same committed bytes; it does not prove who authored the bytes or that the claimed service occurred. Independent validators can therefore reach a correct consensus over false provider-controlled content.

This is an evidence-authenticity limitation of the requested V1 model, not a parser bypass. A trusted authority, signed attestation, or onchain oracle would be required to close it; none is specified and adding an unverified authority would be unsafe.

### MEDIUM — ambiguous JSON parsing and ignored schema fields — fixed

The original parser used default `json.loads`, which accepts duplicate object keys with last-key-wins behavior and accepted unrelated top-level/item fields. This could create ambiguous evidence and unnecessary parser surface, although those fields were not used to calculate payment.

Fix: `_json_object` rejects duplicate keys, non-standard constants are rejected, the evidence object and every response object must have exactly the documented keys, and malformed/deep parser errors are converted to a user error. Regression coverage includes duplicate keys, fake payment fields, `NaN`, and deep nesting.

### MEDIUM — redirect destination depends on the web response metadata — partially fixed / Studio verification required

The submitted URL is strictly `https://<site>.netlify.app`, with no credentials, port, fragment, whitespace, backslash, malformed hostname, or suffix bypass. When the GenLayer web response exposes `response.url`, RECON rejects a final URL different from the committed URL. The public web-access documentation does not guarantee that every runtime response exposes a final URL field. If a runtime follows redirects but omits that field, the contract cannot prove the final destination from the response bytes alone.

Impact is evidence-integrity risk, not direct escrow arithmetic corruption. Studio must verify redirect behavior and the response object shape. A deployment policy should require either reliable final-URL metadata or a Netlify endpoint that does not redirect.

### LOW — protocol-pending evaluation can delay expiry — runtime/liveness dependency

An evaluation call is the only transaction that enters temporary `EVALUATING`; it is not persisted before consensus. If the call remains pending in GenLayer consensus, later calls to the same contract are ordered behind it. This is not a committed stuck state: GenLayer documents that an undetermined transaction does not modify contract state, and a contract-error transaction is not a successful execution. After the failed transaction is resolved, the customer can expire while `FUNDED` if the deadline has passed. A protocol-level transaction that never resolves would delay later calls and requires network-level intervention; the contract cannot add a privileged bypass without creating a race.

## Source-level lifecycle and accounting conclusions

- Customer identity comes from `gl.message.sender_address`; provider and customer are required to be distinct nonzero addresses.
- Request definitions, reward, escrow, deadline, and role addresses are written once during `create_agreement` and have no mutator.
- `submit_evidence` is provider-only and allowed only while `FUNDED` and strictly before the deadline.
- `expire_agreement` is customer-only and allowed only while `FUNDED` and at or after the deadline.
- A successful evaluation stores only the bounded accepted-request mask; provider-supplied status, score, or amount fields cannot enter settlement.
- Every payment is computed from the immutable reward and the accepted mask. No claim reads another agreement’s entitlement.
- The cumulative claim counter is checked against that agreement’s original escrow, and per-role flags reject repeated claims.
- Zero-entitlement sides are marked claimed during evaluation, so full acceptance or full rejection does not require a zero-value child transfer.
- No owner, treasury, arbitrary recipient, fallback withdrawal, or cross-agreement sweep exists.
- There is no persistent `DynArray`; all storage fields are typed scalars or typed `TreeMap`s.

## Consensus assessment

`_run_evaluation` uses `gl.vm.run_nondet`. The leader fetches and hashes the evidence, parses the exact bounded schema, and evaluates the onchain snapshot. The validator receives the leader result only as a candidate, then independently repeats the fetch, hash, parse, and evaluator call. Consensus requires normalized equality of `accepted_mask` and `present_mask`. Invalid leader output, invalid validator output, fetch failure, malformed JSON, mismatched hash, missing/unknown/duplicate IDs, or disagreement cannot produce a settlement result.

The prompt marks evidence as untrusted and keeps all payment policy in deterministic code. Prompt injection can influence an LLM’s answer as an ordinary model-risk issue, but evidence cannot directly change the reward, wallet, request set, or amount. The model still cannot authenticate real-world service provenance.

## References

- [GenLayer non-determinism and custom validators](https://docs.genlayer.com/developers/intelligent-contracts/features/non-determinism)
- [GenLayer value transfers and failed child transactions](https://docs.genlayer.com/developers/intelligent-contracts/features/value-transfers)
- [GenLayer messages and finalization](https://docs.genlayer.com/developers/intelligent-contracts/features/messages)
- [GenLayer equivalence and undetermined transactions](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle)
