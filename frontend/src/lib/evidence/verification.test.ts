import { describe, expect, it } from 'vitest'
import {
  fetchAndVerifyEvidence,
  isCurrentEvidenceVerification,
  isEvidenceVerificationForAgreement,
  parseEvidenceDocument,
  sha256Hex,
  validateNetlifyEvidenceUrl,
} from './verification'

const url = 'https://recon-evidence.netlify.app/invoice-001.json'
const expected = { agreementId: '1', requestIds: ['request_1', 'request_2'] }
const compactBody = '{"agreement_id":1,"responses":[{"request_id":"request_1","response":"Done"}]}'
const compactHash = '93a8aa612e603a57f76082781cc5faaf850968a329529d98e5520e27d41ffe7e'

function fetchResponse(body: BodyInit | null, status = 200, headers?: HeadersInit) {
  return async (_input: RequestInfo | URL, init?: RequestInit) => {
    expect(init?.redirect).toBe('manual')
    expect(init?.cache).toBe('no-store')
    return new Response(body, { status, headers })
  }
}

describe('Netlify evidence verification', () => {
  it('validates the contract shape and hashes exact raw bytes', async () => {
    const result = await fetchAndVerifyEvidence({ url, ...expected }, fetchResponse(compactBody))
    expect(result).toMatchObject({ url, filename: 'invoice-001.json', byteLength: new TextEncoder().encode(compactBody).byteLength, agreementId: '1', responseCount: 1, requestIds: ['request_1'], sha256: compactHash })
  })

  it('produces different commitments for different whitespace', async () => {
    const formatted = '{\n  "agreement_id": 1,\n  "responses": [{"request_id":"request_1","response":"Done"}]\n}'
    const compact = await fetchAndVerifyEvidence({ url, ...expected }, fetchResponse(compactBody))
    const spaced = await fetchAndVerifyEvidence({ url, ...expected }, fetchResponse(formatted))
    expect(spaced.sha256).toBe('52e2e38b460923a4ffb29ef144d05a9bb16fa4b9572697eec5274d39289542f1')
    expect(spaced.sha256).not.toBe(compact.sha256)
    expect(await sha256Hex(new TextEncoder().encode(compactBody))).toBe(compactHash)
  })

  it('allows missing responses because the contract evaluates them as missing work', async () => {
    const result = await fetchAndVerifyEvidence({ url, ...expected }, fetchResponse('{"agreement_id":1,"responses":[]}'))
    expect(result.responseCount).toBe(0)
  })

  it.each([
    ['wrong agreement id', '{"agreement_id":2,"responses":[]}'],
    ['unknown request id', '{"agreement_id":1,"responses":[{"request_id":"request_9","response":"Done"}]}'],
    ['duplicate request id', '{"agreement_id":1,"responses":[{"request_id":"request_1","response":"A"},{"request_id":"request_1","response":"B"}]}'],
    ['wrong response type', '{"agreement_id":1,"responses":[{"request_id":"request_1","response":3}]}'],
    ['duplicate top-level key', '{"agreement_id":1,"agreement_id":1,"responses":[]}'],
  ])('rejects %s', async (_name, body) => {
    await expect(fetchAndVerifyEvidence({ url, ...expected }, fetchResponse(body))).rejects.toThrow()
  })

  it.each([
    'http://recon-evidence.netlify.app/file.json',
    'https://recon-evidence.netlify.app.evil.example/file.json',
    'https://user:pass@recon-evidence.netlify.app/file.json',
    'https://recon-evidence.netlify.app:443/file.json',
    'https://localhost/file.json',
    'https://netlify.app/file.json',
  ])('rejects unsafe URL %s', (unsafeUrl) => {
    expect(() => validateNetlifyEvidenceUrl(unsafeUrl)).toThrow()
  })

  it('rejects HTTP failures, redirects and oversized bodies', async () => {
    await expect(fetchAndVerifyEvidence({ url, ...expected }, fetchResponse('{}', 404))).rejects.toThrow('HTTP 404')
    await expect(fetchAndVerifyEvidence({ url, ...expected }, fetchResponse('{}', 500))).rejects.toThrow('HTTP 500')
    await expect(fetchAndVerifyEvidence({ url, ...expected }, fetchResponse('', 302))).rejects.toThrow('redirects')
    await expect(fetchAndVerifyEvidence({ url, ...expected }, fetchResponse(new Uint8Array(8_193)))).rejects.toThrow('8,192')
  })

  it('rejects invalid UTF-8 and malformed JSON', async () => {
    await expect(fetchAndVerifyEvidence({ url, ...expected }, fetchResponse(new Uint8Array([0xff, 0xfe])))).rejects.toThrow('UTF-8')
    await expect(fetchAndVerifyEvidence({ url, ...expected }, fetchResponse('{"agreement_id":1'))).rejects.toThrow('JSON')
  })

  it('keeps stale verification results from becoming current', () => {
    expect(isCurrentEvidenceVerification(1, 2, 'url-a', 'url-b')).toBe(false)
    expect(isCurrentEvidenceVerification(2, 2, 'url-a', 'url-a')).toBe(true)
    expect(isCurrentEvidenceVerification(2, 2, 'agreement-a', 'agreement-b')).toBe(false)
  })

  it('binds a verified result to the current URL and loaded agreement requests', () => {
    const result = { url, filename: 'invoice-001.json', byteLength: 75, agreementId: '1', responseCount: 1, requestIds: ['request_1'], sha256: compactHash }
    expect(isEvidenceVerificationForAgreement(result, { url, agreementId: '1', requestIds: ['request_1', 'request_2'] })).toBe(true)
    expect(isEvidenceVerificationForAgreement(result, { url: `${url} `, agreementId: '1', requestIds: ['request_1', 'request_2'] })).toBe(false)
    expect(isEvidenceVerificationForAgreement(result, { url, agreementId: '2', requestIds: ['request_1', 'request_2'] })).toBe(false)
    expect(isEvidenceVerificationForAgreement(result, { url, agreementId: '1', requestIds: ['request_2'] })).toBe(false)
  })

  it('rejects non-integer agreement IDs just as the contract does', () => {
    expect(() => parseEvidenceDocument(new TextEncoder().encode('{"agreement_id":1.0,"responses":[]}'), expected)).toThrow('agreement_id')
    expect(() => parseEvidenceDocument(new TextEncoder().encode('{"agreement_id":true,"responses":[]}'), expected)).toThrow('agreement_id')
  })
})
