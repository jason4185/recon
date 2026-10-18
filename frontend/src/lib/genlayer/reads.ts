import type { GenLayerClient } from "./client";
import { getReadClient } from "./client";
import { RECON_CONTRACT_ADDRESS } from "./network";
import type {
  ReconAgreement,
  ReconAgreementDetail,
  ReconClaimStatus,
  ReconConfig,
  ReconEvidence,
  ReconExpiryStatus,
  ReconRequest,
} from "./types";

type RecordValue = Record<string, unknown>;

function record(value: unknown, field: string): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Contract returned invalid ${field}.`);
  return value as RecordValue;
}

function integer(value: unknown, field: string) {
  try {
    if (typeof value === "bigint") return value;
    if (typeof value === "number" && Number.isSafeInteger(value)) return BigInt(value);
    if (typeof value === "string" && /^\d+$/.test(value)) return BigInt(value);
  } catch {
    // Use the stable error below.
  }
  throw new Error(`Contract returned invalid ${field}.`);
}

function numberValue(value: unknown, field: string) {
  const parsed = integer(value, field);
  const result = Number(parsed);
  if (!Number.isSafeInteger(result)) throw new Error(`Contract returned unsafe ${field}.`);
  return result;
}

function stringValue(value: unknown, field: string) {
  if (typeof value !== "string") throw new Error(`Contract returned invalid ${field}.`);
  return value;
}

function booleanValue(value: unknown, field: string) {
  if (typeof value !== "boolean") throw new Error(`Contract returned invalid ${field}.`);
  return value;
}

function addressValue(value: unknown, field: string) {
  const result = stringValue(value, field);
  if (!/^0x[0-9a-fA-F]{40}$/.test(result)) throw new Error(`Contract returned invalid ${field}.`);
  return result as `0x${string}`;
}

async function read(client: GenLayerClient, method: string, args: unknown[] = []) {
  return await client.readContract({
    address: RECON_CONTRACT_ADDRESS,
    functionName: method,
    args: args as never[],
    transactionHashVariant: "latest-nonfinal" as never,
  });
}

function mapConfig(raw: unknown): ReconConfig {
  const value = record(raw, "configuration");
  const statuses = Array.isArray(value.statuses)
    ? value.statuses.map((item) => stringValue(item, "status")) as ReconConfig["statuses"]
    : [];
  return {
    maxAgreements: numberValue(value.max_agreements, "maximum agreements"),
    maxRequests: numberValue(value.max_requests, "maximum requests"),
    maxRequestIdLength: numberValue(value.max_request_id_length, "request id length"),
    maxTitleLength: numberValue(value.max_title_length, "title length"),
    maxDescriptionLength: numberValue(value.max_description_length, "description length"),
    maxTaskLength: numberValue(value.max_task_length, "task length"),
    maxCriteriaLength: numberValue(value.max_criteria_length, "criteria length"),
    maxEvidenceUrlLength: numberValue(value.max_evidence_url_length, "evidence URL length"),
    maxEvidenceBytes: numberValue(value.max_evidence_bytes, "evidence byte limit"),
    maxResponseLength: numberValue(value.max_response_length, "response length"),
    statuses,
    evidenceHost: stringValue(value.evidence_host, "evidence host"),
  };
}

function mapAgreement(raw: unknown): ReconAgreement {
  const value = record(raw, "agreement");
  return {
    id: integer(value.id, "agreement id").toString(),
    customer: addressValue(value.customer, "customer"),
    provider: addressValue(value.provider, "provider"),
    title: stringValue(value.title, "title"),
    description: stringValue(value.description, "description"),
    requestCount: numberValue(value.request_count, "request count"),
    rewardPerRequestWei: integer(value.reward_per_request, "reward per request"),
    escrowWei: integer(value.escrow, "escrow"),
    createdAt: numberValue(value.created_at, "creation time"),
    deadline: numberValue(value.deadline, "deadline"),
    status: stringValue(value.status, "status") as ReconAgreement["status"],
    evaluationStartedAt: numberValue(value.evaluation_started_at, "evaluation start"),
    evaluatedAt: numberValue(value.evaluated_at, "evaluation time"),
    closedAt: numberValue(value.closed_at, "close time"),
    evidenceUrl: stringValue(value.evidence_url, "evidence URL"),
    evidenceSha256: stringValue(value.evidence_sha256, "evidence hash"),
    acceptedMask: integer(value.accepted_mask, "accepted mask"),
    acceptedRequestCount: numberValue(value.accepted_request_count, "accepted request count"),
    rejectedRequestCount: numberValue(value.rejected_request_count, "rejected request count"),
    providerEntitlementWei: integer(value.provider_entitlement, "provider entitlement"),
    customerRefundEntitlementWei: integer(value.customer_refund_entitlement, "customer refund"),
    providerClaimed: booleanValue(value.provider_claimed, "provider claim status"),
    customerRefundClaimed: booleanValue(value.customer_refund_claimed, "customer claim status"),
    claimedTotalWei: integer(value.claimed_total, "claimed total"),
    remainingEscrowWei: integer(value.remaining_escrow, "remaining escrow"),
  };
}

function mapRequest(raw: unknown): ReconRequest {
  const value = record(raw, "request");
  return {
    agreementId: integer(value.agreement_id, "request agreement id").toString(),
    slot: numberValue(value.slot, "request slot"),
    requestId: stringValue(value.request_id, "request id"),
    task: stringValue(value.task, "request task"),
    acceptanceCriteria: stringValue(value.acceptance_criteria, "acceptance criteria"),
    outcome: stringValue(value.outcome, "request outcome") as ReconRequest["outcome"],
    accepted: booleanValue(value.accepted, "request acceptance"),
    rewardWei: integer(value.reward, "request reward"),
  };
}

function mapEvidence(raw: unknown): ReconEvidence {
  const value = record(raw, "evidence");
  return {
    agreementId: integer(value.agreement_id, "evidence agreement id").toString(),
    url: stringValue(value.url, "evidence URL"),
    sha256: stringValue(value.sha256, "evidence hash"),
  };
}

function mapExpiry(raw: unknown): ReconExpiryStatus {
  const value = record(raw, "expiry status");
  return {
    deadline: numberValue(value.deadline, "deadline"),
    deadlinePassed: booleanValue(value.deadline_passed, "deadline status"),
    canExpire: booleanValue(value.can_expire, "expiry eligibility"),
    status: stringValue(value.status, "expiry status") as ReconExpiryStatus["status"],
  };
}

function mapClaims(raw: unknown): ReconClaimStatus {
  const value = record(raw, "claim status");
  return {
    agreementId: integer(value.agreement_id, "claim agreement id").toString(),
    providerEntitlementWei: integer(value.provider_entitlement, "provider entitlement"),
    customerRefundEntitlementWei: integer(value.customer_refund_entitlement, "customer refund"),
    providerClaimed: booleanValue(value.provider_claimed, "provider claim status"),
    customerRefundClaimed: booleanValue(value.customer_refund_claimed, "customer claim status"),
    claimedTotalWei: integer(value.claimed_total, "claimed total"),
    remainingEscrowWei: integer(value.remaining_escrow, "remaining escrow"),
  };
}

export async function getConfig(client = getReadClient()) {
  return mapConfig(await read(client, "get_config"));
}

export async function getAgreementCount(client = getReadClient()) {
  return numberValue(await read(client, "get_agreement_count"), "agreement count");
}

export async function getAgreement(id: string, client = getReadClient()) {
  return mapAgreement(await read(client, "get_agreement", [BigInt(id)]));
}

export async function getStatus(id: string, client = getReadClient()) {
  return stringValue(await read(client, "get_status", [BigInt(id)]), "status") as ReconAgreement["status"];
}

export async function getExpiryStatus(id: string, client = getReadClient()) {
  return mapExpiry(await read(client, "get_expiry_status", [BigInt(id)]));
}

export async function getRequest(id: string, slot: number, client = getReadClient()) {
  return mapRequest(await read(client, "get_request", [BigInt(id), BigInt(slot)]));
}

export async function getRequestById(id: string, requestId: string, client = getReadClient()) {
  return mapRequest(await read(client, "get_request_by_id", [BigInt(id), requestId]));
}

export async function getEvidence(id: string, client = getReadClient()) {
  return mapEvidence(await read(client, "get_evidence", [BigInt(id)]));
}

export async function getClaimStatus(id: string, client = getReadClient()) {
  return mapClaims(await read(client, "get_claim_status", [BigInt(id)]));
}

export async function getAgreementDetail(id: string, client = getReadClient()): Promise<ReconAgreementDetail> {
  const agreement = await getAgreement(id, client);
  const requests = await Promise.all(
    Array.from({ length: agreement.requestCount }, (_, slot) => getRequest(id, slot, client)),
  );
  return { ...agreement, requests };
}

export async function listAgreements(
  options: { offset?: number; limit?: number } = {},
  client = getReadClient(),
) {
  const count = await getAgreementCount(client);
  const offset = Math.max(0, Math.min(options.offset ?? 0, count));
  const limit = Math.max(1, Math.min(options.limit ?? 50, 50));
  const end = Math.min(offset + limit, count);
  const agreements = await Promise.all(
    Array.from({ length: end - offset }, (_, index) => getAgreement(String(offset + index + 1), client)),
  );
  return { agreements, offset, nextOffset: end, total: count, hasMore: end < count };
}
