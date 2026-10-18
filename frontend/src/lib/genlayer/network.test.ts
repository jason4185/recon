import { describe, expect, it } from 'vitest'
import { RECON_CONTRACT_ADDRESS, STUDIO_NEXT_CHAIN_ID, STUDIO_NEXT_RPC_URL, studioNext } from './network'

describe('Studio Next configuration', () => {
  it('pins the deployed RECON contract and chain', () => {
    expect(RECON_CONTRACT_ADDRESS).toBe('0x1e01dCfaaCd4D7EbE5a6Ff3249Bff2331e546463')
    expect(STUDIO_NEXT_CHAIN_ID).toBe(61997)
    expect(studioNext.id).toBe(61997)
    expect(STUDIO_NEXT_RPC_URL).toBeTruthy()
  })
})
