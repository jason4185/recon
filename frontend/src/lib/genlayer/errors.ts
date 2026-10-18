export function normalizeReconError(reason: unknown) {
  const message = reason instanceof Error ? reason.message : String(reason);
  const normalized = message.replace(/^Error:\s*/i, "").trim();
  if (/user rejected|rejected the request|denied/i.test(normalized)) return "Wallet request rejected.";
  if (/already known|replacement transaction/i.test(normalized)) return "A transaction with this request is already pending.";
  if (/insufficient funds|insufficient balance/i.test(normalized)) return "The connected wallet does not have enough GEN for this transaction and its fees.";
  return normalized || "The transaction could not be completed.";
}
