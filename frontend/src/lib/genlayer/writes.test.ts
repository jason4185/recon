import { describe, expect, it } from 'vitest'
import { CalldataAddress } from 'genlayer-js/types'
import { zeroAddress } from 'viem'
import { RECON_CONTRACT_ADDRESS } from './network'
import { createAgreementWrite, claimCustomerRefundWrite, claimProviderPaymentWrite, expireAgreementWrite, isValidProviderAddress, submitEvidenceWrite, toCalldataAddress } from './writes'

const provider = '0x1111111111111111111111111111111111111111' as `0x${string}`
const failedAttemptProvider = '0x69885Aeb09f8cB62FFF8b2224C66791bFCaed317'

describe('RECON write adapters', () => {
  it('serializes one request and exact payable escrow', () => {
    const write = createAgreementWrite({
      provider,
      title: 'A',
      description: 'B',
      requests: [{ requestId: 'request_1', task: 'Task', acceptanceCriteria: 'Criteria' }],
      rewardPerRequestWei: 2000000000000000000n,
      deadline: 2000000000,
    })
    expect(write.address).toBe(RECON_CONTRACT_ADDRESS)
    expect(write.method).toBe('create_agreement')
    expect(write.value).toBe(2000000000000000000n)
    expect(write.args[0]).toBeInstanceOf(CalldataAddress)
    expect(Array.from((write.args[0] as CalldataAddress).bytes)).toEqual(Array.from({ length: 20 }, () => 0x11))
    expect(write.args.slice(1)).toEqual(['A', 'B', [{ request_id: 'request_1', task: 'Task', acceptance_criteria: 'Criteria' }], 2000000000000000000n, 2000000000n])
  })

  it('multiplies escrow with bigint for five requests', () => {
    const write = createAgreementWrite({ provider, title: 'A', description: 'B', requests: Array.from({ length: 5 }, (_, index) => ({ requestId: `request_${index + 1}`, task: 'Task', acceptanceCriteria: 'Criteria' })), rewardPerRequestWei: 2000000000000000000n, deadline: 2000000000 })
    expect(write.value).toBe(10000000000000000000n)
  })

  it('keeps a one-GEN escrow value separate from the fee deposit', () => {
    const write = createAgreementWrite({
      provider,
      title: 'A',
      description: 'B',
      requests: [{ requestId: 'request_1', task: 'Task', acceptanceCriteria: 'Criteria' }],
      rewardPerRequestWei: 1000000000000000000n,
      deadline: 2000000000,
    })
    expect(write.value).toBe(1000000000000000000n)
    expect(write.args[4]).toBe(1000000000000000000n)
  })

  it('rejects malformed and zero provider addresses before calldata construction', () => {
    expect(() => toCalldataAddress('not-an-address')).toThrow('valid nonzero')
    expect(() => toCalldataAddress('0x111111111111111111111111111111111111111')).toThrow('valid nonzero')
    expect(() => toCalldataAddress(zeroAddress)).toThrow('valid nonzero')
    expect(isValidProviderAddress('0x1111111111111111111111111111111111111111')).toBe(true)
    expect(isValidProviderAddress(failedAttemptProvider)).toBe(true)
    expect(isValidProviderAddress(zeroAddress)).toBe(false)
  })

  it('does not pass a provider as a plain string', () => {
    const encoded = toCalldataAddress(provider)
    expect(encoded).toBeInstanceOf(CalldataAddress)
    expect(encoded).not.toBe(provider)
    expect(encoded.bytes).toBeInstanceOf(Uint8Array)
    expect(encoded.bytes).toHaveLength(20)
  })

  it('uses the exact public method names and agreement argument', () => {
    const writes = [
      submitEvidenceWrite('4', 'https://site.netlify.app/evidence.json', 'a'.repeat(64)),
      expireAgreementWrite('4'),
      claimProviderPaymentWrite('4'),
      claimCustomerRefundWrite('4'),
    ]
    expect(writes.every((write) => write.address === RECON_CONTRACT_ADDRESS)).toBe(true)
    expect(writes[0]?.args).toEqual([4n, 'https://site.netlify.app/evidence.json', 'a'.repeat(64)])
    expect(writes[1]?.args).toEqual([4n])
    expect(writes[2]?.method).toBe('claim_provider_payment')
    expect(writes[3]?.method).toBe('claim_customer_refund')
  })
})
