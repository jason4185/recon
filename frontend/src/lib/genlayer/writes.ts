import { CalldataAddress } from "genlayer-js/types";
import { hexToBytes, isAddress, zeroAddress, type Address } from "viem";
import { RECON_CONTRACT_ADDRESS } from "./network";
import { parseGenAmount } from "./amounts";
import type { ContractWrite } from "./types";

export const MAX_REQUESTS = 5;

/** Encode a Python/GenVM Address using the SDK's address calldata tag. */
export function toCalldataAddress(value: string): CalldataAddress {
  if (!isAddress(value) || value.toLowerCase() === zeroAddress) {
    throw new Error("Provider must be a valid nonzero EVM address.");
  }
  return new CalldataAddress(hexToBytes(value as `0x${string}`));
}

export function isValidProviderAddress(value: string): value is Address {
  return isAddress(value) && value.toLowerCase() !== zeroAddress;
}

export function createAgreementWrite(input: {
  provider: Address;
  title: string;
  description: string;
  requests: { requestId: string; task: string; acceptanceCriteria: string }[];
  rewardPerRequestWei: bigint;
  deadline: number;
}): ContractWrite {
  return {
    kind: "write",
    address: RECON_CONTRACT_ADDRESS,
    method: "create_agreement",
    args: [
      toCalldataAddress(input.provider),
      input.title,
      input.description,
      input.requests.map((request) => ({
        request_id: request.requestId,
        task: request.task,
        acceptance_criteria: request.acceptanceCriteria,
      })),
      input.rewardPerRequestWei,
      BigInt(input.deadline),
    ],
    value: BigInt(input.requests.length) * input.rewardPerRequestWei,
  };
}

export function submitEvidenceWrite(id: string, url: string, sha256: string): ContractWrite {
  return { kind: "write", address: RECON_CONTRACT_ADDRESS, method: "submit_evidence", args: [BigInt(id), url, sha256] };
}

export function expireAgreementWrite(id: string): ContractWrite {
  return { kind: "write", address: RECON_CONTRACT_ADDRESS, method: "expire_agreement", args: [BigInt(id)] };
}

export function claimProviderPaymentWrite(id: string): ContractWrite {
  return { kind: "write", address: RECON_CONTRACT_ADDRESS, method: "claim_provider_payment", args: [BigInt(id)] };
}

export function claimCustomerRefundWrite(id: string): ContractWrite {
  return { kind: "write", address: RECON_CONTRACT_ADDRESS, method: "claim_customer_refund", args: [BigInt(id)] };
}

export { isAddress, parseGenAmount };
