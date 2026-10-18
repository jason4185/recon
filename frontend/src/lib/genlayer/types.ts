import type { Address } from "viem";

export type AgreementStatus = "FUNDED" | "EVALUATING" | "EVALUATED" | "EXPIRED" | "CLOSED";

export type ReconRequest = {
  agreementId: string;
  slot: number;
  requestId: string;
  task: string;
  acceptanceCriteria: string;
  outcome: "PENDING" | "ACCEPTED" | "REJECTED";
  accepted: boolean;
  rewardWei: bigint;
};

export type ReconEvidence = {
  agreementId: string;
  url: string;
  sha256: string;
};

export type ReconAgreement = {
  id: string;
  customer: Address;
  provider: Address;
  title: string;
  description: string;
  requestCount: number;
  rewardPerRequestWei: bigint;
  escrowWei: bigint;
  createdAt: number;
  deadline: number;
  status: AgreementStatus;
  evaluationStartedAt: number;
  evaluatedAt: number;
  closedAt: number;
  evidenceUrl: string;
  evidenceSha256: string;
  acceptedMask: bigint;
  acceptedRequestCount: number;
  rejectedRequestCount: number;
  providerEntitlementWei: bigint;
  customerRefundEntitlementWei: bigint;
  providerClaimed: boolean;
  customerRefundClaimed: boolean;
  claimedTotalWei: bigint;
  remainingEscrowWei: bigint;
};

export type ReconAgreementDetail = ReconAgreement & { requests: ReconRequest[] };

export type ReconConfig = {
  maxAgreements: number;
  maxRequests: number;
  maxRequestIdLength: number;
  maxTitleLength: number;
  maxDescriptionLength: number;
  maxTaskLength: number;
  maxCriteriaLength: number;
  maxEvidenceUrlLength: number;
  maxEvidenceBytes: number;
  maxResponseLength: number;
  statuses: AgreementStatus[];
  evidenceHost: string;
};

export type ReconExpiryStatus = {
  deadline: number;
  deadlinePassed: boolean;
  canExpire: boolean;
  status: AgreementStatus;
};

export type ReconClaimStatus = {
  agreementId: string;
  providerEntitlementWei: bigint;
  customerRefundEntitlementWei: bigint;
  providerClaimed: boolean;
  customerRefundClaimed: boolean;
  claimedTotalWei: bigint;
  remainingEscrowWei: bigint;
};

export type ContractWrite = {
  kind: "write";
  address: Address;
  method: string;
  args: unknown[];
  value?: bigint;
};
