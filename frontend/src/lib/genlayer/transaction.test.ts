import { describe, expect, it } from 'vitest'
import { verifySuccessfulTransaction } from './transaction'

describe('transaction execution verification', () => {
  it('rejects a finalized transaction whose execution rolled back', async () => {
    await expect(verifySuccessfulTransaction({
      phase: 'finalized',
      genlayerTxId: `0x${'ab'.repeat(32)}`,
      statusName: 'FINALIZED',
      executionResultName: 'FINISHED_WITH_ERROR',
      successful: false,
    }, {} as never)).rejects.toThrow('Transaction execution failed')
  })
})
