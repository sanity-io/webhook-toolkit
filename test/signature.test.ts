import {describe, expect, test} from 'vitest'

import {
  assertValidRequest,
  assertValidSignature,
  decodeSignatureHeader,
  encodeSignatureHeader,
  isValidRequest,
  isValidSignature,
  SIGNATURE_HEADER_NAME,
} from '../src'

const isWebCrypto = typeof globalThis.crypto !== 'undefined'

describe.runIf(isWebCrypto)('signature', () => {
  describe('isValidSignature', () => {
    const secret = 'test'

    test('returns true on valid signatures', async () => {
      const payload = JSON.stringify({_id: 'resume'})
      const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(await isValidSignature(payload, signature, secret)).toBe(true)
    })

    test('returns false on invalid signatures (timestamp)', async () => {
      const payload = JSON.stringify({_id: 'resume'})
      const signature = 't=1633519811128,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(await isValidSignature(payload, signature, secret)).toBe(false)
    })

    test('returns false on invalid signatures (hash)', async () => {
      const payload = JSON.stringify({_id: 'resume'})
      const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N1'
      expect(await isValidSignature(payload, signature, secret)).toBe(false)
    })

    test('returns false on invalid signatures (payload)', async () => {
      const payload = JSON.stringify({_id: 'structure'})
      const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(await isValidSignature(payload, signature, secret)).toBe(false)
    })

    test('returns false on invalid signature', async () => {
      const payload = JSON.stringify({_id: 'structure'})
      const signature = 't=1633519811129,v5=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(await isValidSignature(payload, signature, secret)).toBe(false)
    })
  })

  describe('isValidRequest', () => {
    const secret = 'test'
    const getRequest = ({signature, body}: {signature?: string; body?: unknown}) => ({
      body: body || JSON.stringify({_id: 'resume'}),
      headers: {
        [SIGNATURE_HEADER_NAME]:
          signature || 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0',
      },
    })

    test('returns true on valid requests', async () => {
      expect(await isValidRequest(getRequest({}), secret)).toBe(true)
    })

    test('returns false on invalid signatures (timestamp)', async () => {
      const signature = 't=1633519811128,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(await isValidRequest(getRequest({signature}), secret)).toBe(false)
    })

    test('returns false on invalid signatures (hash)', async () => {
      const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N1'
      expect(await isValidRequest(getRequest({signature}), secret)).toBe(false)
    })

    test('returns false on invalid signatures (payload)', async () => {
      const body = JSON.stringify({_id: 'structure'})
      expect(await isValidRequest(getRequest({body}), secret)).toBe(false)
    })

    test('returns false on invalid signature', async () => {
      const signature = 't=1633519811129,v5=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(await isValidRequest(getRequest({signature}), secret)).toBe(false)
    })
  })

  describe('assertValidSignature', () => {
    const secret = 'test'

    test('returns true on valid signatures', async () => {
      const payload = JSON.stringify({_id: 'resume'})
      const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      await expect(assertValidSignature(payload, signature, secret)).resolves.not.toThrowError()
    })

    test('returns false on invalid signatures (timestamp)', async () => {
      const payload = JSON.stringify({_id: 'resume'})
      const signature = 't=1633519811128,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      await expect(() =>
        assertValidSignature(payload, signature, secret),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Signature is invalid]`)
    })

    test('returns false on invalid signatures (hash)', async () => {
      const payload = JSON.stringify({_id: 'resume'})
      const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N1'
      await expect(() =>
        assertValidSignature(payload, signature, secret),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Signature is invalid]`)
    })

    test('returns false on invalid signatures (payload)', async () => {
      const payload = JSON.stringify({_id: 'structure'})
      const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      await expect(() =>
        assertValidSignature(payload, signature, secret),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Signature is invalid]`)
    })

    test('returns false on invalid signature', async () => {
      const payload = JSON.stringify({_id: 'structure'})
      const signature = 't=1633519811129,v5=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      await expect(() =>
        assertValidSignature(payload, signature, secret),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Invalid signature payload format]`)
    })
  })

  describe('assertValidRequest', () => {
    const secret = 'test'
    const getRequest = ({signature, body}: {signature?: string; body?: unknown}) => ({
      body: body || Buffer.from(JSON.stringify({_id: 'resume'})),
      headers: {
        [SIGNATURE_HEADER_NAME]:
          signature || 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0',
      },
    })

    test('returns true on valid requests', async () => {
      expect(async () => await assertValidRequest(getRequest({}), secret)).not.toThrowError()
    })

    test('returns false on invalid signatures (timestamp)', async () => {
      const signature = 't=1633519811128,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      await expect(() =>
        assertValidRequest(getRequest({signature}), secret),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Signature is invalid]`)
    })

    test('returns false on invalid signatures (hash)', async () => {
      const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N1'
      await expect(() =>
        assertValidRequest(getRequest({signature}), secret),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Signature is invalid]`)
    })

    test('returns false on invalid signatures (payload)', async () => {
      const body = JSON.stringify({_id: 'structure'})
      await expect(() =>
        assertValidRequest(getRequest({body}), secret),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Signature is invalid]`)
    })

    test('returns false on invalid signature', async () => {
      const signature = 't=1633519811129,v5=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(() =>
        assertValidRequest(getRequest({signature}), secret),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Invalid signature payload format]`)
    })
  })

  describe('decodeSignatureHeader', () => {
    test('decodes valid signatures', async () => {
      const header = 't=1633470609222,v1=7kTYPaw6SmCoN2VJzFL24oEjV-ac7lRwbljOkh7d13A'
      const decoded = decodeSignatureHeader(header)

      expect(decoded.timestamp).toBe(1633470609222)
      expect(decoded.hashedPayload).toBe('7kTYPaw6SmCoN2VJzFL24oEjV-ac7lRwbljOkh7d13A')
    })

    test('allows space in signature header', async () => {
      const header = 't=1633470609222, v1=7kTYPaw6SmCoN2VJzFL24oEjV-ac7lRwbljOkh7d13A'
      const decoded = decodeSignatureHeader(header)

      expect(decoded.timestamp).toBe(1633470609222)
      expect(decoded.hashedPayload).toBe('7kTYPaw6SmCoN2VJzFL24oEjV-ac7lRwbljOkh7d13A')
    })

    test('throws on invalid signatures', async () => {
      const header = 't=1633470609222,v3=7kTYPaw6SmCoN2VJzFL24oEjV-ac7lRwbljOkh7d13A'

      expect(() => decodeSignatureHeader(header)).toThrowErrorMatchingInlineSnapshot(
        `[Error: Invalid signature payload format]`,
      )
    })
  })

  describe('encodeSignatureHeader', () => {
    const secret = 'try-me'
    const timestamp = 1633518820676
    const stringifiedPayload = JSON.stringify({title: 'GROQ-Hooks are neat'})

    test('encodes signatures', async () => {
      const encoded = await encodeSignatureHeader(stringifiedPayload, timestamp, secret)
      expect(encoded).toBe('t=1633518820676,v1=e7C9h2sfbFfc4V7TEz7PSOp4IoNzl0UdVsBV-1wgdeA')
    })

    test('throws on empty payload', async () => {
      await expect(() =>
        encodeSignatureHeader('', timestamp, secret),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: Can not create signature for empty payload]`,
      )
    })

    test('throws on non-string payload', async () => {
      await expect(
        // @ts-expect-error (testing invalid input)
        () => encodeSignatureHeader({}, timestamp, secret),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Payload must be a JSON-encoded string]`)
    })

    test('throws on invalid timestamp type (invalid type)', async () => {
      await expect(() =>
        // @ts-expect-error (testing invalid input)
        encodeSignatureHeader(stringifiedPayload, 'foo', secret),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: Invalid signature timestamp, must be a unix timestamp with millisecond precision]`,
      )
    })

    test('throws on invalid timestamp (NaN)', async () => {
      await expect(() =>
        encodeSignatureHeader(stringifiedPayload, parseInt('foo', 10), secret),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: Invalid signature timestamp, must be a unix timestamp with millisecond precision]`,
      )
    })

    test('throws on invalid timestamp (invalid precision)', async () => {
      await expect(() =>
        encodeSignatureHeader(stringifiedPayload, Date.now() / 1000, secret),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `[Error: Invalid signature timestamp, must be a unix timestamp with millisecond precision]`,
      )
    })
  })
})

describe.skipIf(isWebCrypto)('detects if Web Crypto is available', () => {
  const secret = 'test'
  test('throws on missing crypto', async () => {
    const payload = JSON.stringify({_id: 'resume'})
    const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
    await expect(() =>
      isValidSignature(payload, signature, secret),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[TypeError: The Web Crypto API is not available in this environment, either polyfill \`globalThis.crypto\` or downgrade to \`@sanity/webhook@3\` which uses the Node.js \`crypto\` module.]`,
    )
  })
})
