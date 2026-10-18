import { describe, expect, it, vi } from 'vitest'
import type { GenLayerClient } from './client'
import { RECON_CONTRACT_ADDRESS } from './network'
import { getAgreement, getAgreementDetail, getConfig } from './reads'

function fakeClient(responder: (method: string, args: unknown[]) => unknown) {
  const readContract = vi.fn(async (input: { functionName: string; args?: unknown[]; transactionHashVariant?: string }) => responder(input.functionName, input.args ?? []))
  return { client: { readContract } as unknown as GenLayerClient, readContract }
}

const rawAgreement = (id = 7) => ({
  id,
  customer: '0x1111111111111111111111111111111111111111',
  provider: '0x2222222222222222222222222222222222222222',
  title: 'Agreement', description: 'Description', request_count: 1,
  reward_per_request: 2000000000000000000n, escrow: 2000000000000000000n,
  created_at: 1700000000, deadline: 1800000000, status: 'FUNDED',
  evaluation_started_at: 0, evaluated_at: 0, closed_at: 0, evidence_url: '', evidence_sha256: '',
  accepted_mask: 0, accepted_request_count: 0, rejected_request_count: 0,
  provider_entitlement: 0, customer_refund_entitlement: 0, provider_claimed: false,
  customer_refund_claimed: false, claimed_total: 0, remaining_escrow: 2000000000000000000n,
})

describe('RECON read adapter', () => {
  it('uses accepted/latest-nonfinal reads and maps bigint fields', async () => {
    const { client, readContract } = fakeClient(() => rawAgreement())
    const agreement = await getAgreement('7', client)
    expect(agreement.id).toBe('7')
    expect(agreement.escrowWei).toBe(2000000000000000000n)
    expect(readContract).toHaveBeenCalledWith(expect.objectContaining({
      address: RECON_CONTRACT_ADDRESS,
      functionName: 'get_agreement',
      transactionHashVariant: 'latest-nonfinal',
      args: [7n],
    }))
  })

  it('loads each registered request using the onchain request count', async () => {
    const { client } = fakeClient((method, args) => method === 'get_agreement' ? rawAgreement() : { agreement_id: args[0], slot: args[1], request_id: 'request_1', task: 'Task', acceptance_criteria: 'Criteria', outcome: 'PENDING', accepted: false, reward: 0n })
    const detail = await getAgreementDetail('7', client)
    expect(detail.requests).toHaveLength(1)
    expect(detail.requests[0]?.requestId).toBe('request_1')
  })

  it('maps the bounded contract configuration', async () => {
    const { client } = fakeClient(() => ({ max_agreements: 10000, max_requests: 5, max_request_id_length: 64, max_title_length: 160, max_description_length: 4000, max_task_length: 2000, max_criteria_length: 2000, max_evidence_url_length: 2048, max_evidence_bytes: 8192, max_response_length: 2048, statuses: ['FUNDED', 'EVALUATED', 'EXPIRED', 'CLOSED'], evidence_host: '*.netlify.app' }))
    const config = await getConfig(client)
    expect(config.maxRequests).toBe(5)
    expect(config.evidenceHost).toBe('*.netlify.app')
  })
})
