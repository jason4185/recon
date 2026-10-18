import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { fetchAndVerifyEvidence, type EvidenceVerificationInput } from "./verification";

function validateInput(value: unknown): EvidenceVerificationInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Evidence verification input is invalid.");
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.url !== "string" || typeof candidate.agreementId !== "string" || !Array.isArray(candidate.requestIds) || !candidate.requestIds.every((item) => typeof item === "string")) {
    throw new Error("Evidence verification input is invalid.");
  }
  return { url: candidate.url, agreementId: candidate.agreementId, requestIds: candidate.requestIds };
}

export const verifyNetlifyEvidence = createServerFn({ method: "POST" })
  .validator(validateInput)
  .handler(async ({ data }) => {
    setResponseHeader("cache-control", "no-store");
    setResponseHeader("pragma", "no-cache");
    setResponseHeader("vary", "*");
    return fetchAndVerifyEvidence(data);
  });
