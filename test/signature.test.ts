import {
  assertValidRequest,
  assertValidSignature,
  decodeSignatureHeader,
  encodeSignatureHeader,
  isValidRequest,
  isValidSignature,
  SIGNATURE_HEADER_NAME,
} from '../src'

describe('signature', () => {
  describe('isValidSignature', () => {
    const secret = 'test'

    test('returns true on valid signatures', () => {
      const payload = JSON.stringify({_id: 'resume'})
      const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(isValidSignature(payload, signature, secret)).toBe(true)
    })

    test('returns false on invalid signatures (timestamp)', () => {
      const payload = JSON.stringify({_id: 'resume'})
      const signature = 't=1633519811128,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(isValidSignature(payload, signature, secret)).toBe(false)
    })

    test('returns false on invalid signatures (hash)', () => {
      const payload = JSON.stringify({_id: 'resume'})
      const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N1'
      expect(isValidSignature(payload, signature, secret)).toBe(false)
    })

    test('returns false on invalid signatures (payload)', () => {
      const payload = JSON.stringify({_id: 'structure'})
      const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(isValidSignature(payload, signature, secret)).toBe(false)
    })

    test('returns false on invalid signature', () => {
      const payload = JSON.stringify({_id: 'structure'})
      const signature = 't=1633519811129,v5=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(isValidSignature(payload, signature, secret)).toBe(false)
    })
  })

  describe('isValidRequest', () => {
    const secret = 'test'
    const getRequest = ({signature, body}: {signature?: string; body?: unknown}) => ({
      body: body || {_id: 'resume'},
      headers: {
        [SIGNATURE_HEADER_NAME]:
          signature || 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0',
      },
    })

    test('returns true on valid requests', () => {
      expect(isValidRequest(getRequest({}), secret)).toBe(true)
    })

    test('returns false on invalid signatures (timestamp)', () => {
      const signature = 't=1633519811128,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(isValidRequest(getRequest({signature}), secret)).toBe(false)
    })

    test('returns false on invalid signatures (hash)', () => {
      const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N1'
      expect(isValidRequest(getRequest({signature}), secret)).toBe(false)
    })

    test('returns false on invalid signatures (payload)', () => {
      const body = {_id: 'structure'}
      expect(isValidRequest(getRequest({body}), secret)).toBe(false)
    })

    test('returns false on invalid signature', () => {
      const signature = 't=1633519811129,v5=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(isValidRequest(getRequest({signature}), secret)).toBe(false)
    })
  })

  describe('assertValidSignature', () => {
    const secret = 'test'

    test('returns true on valid signatures', () => {
      const payload = JSON.stringify({_id: 'resume'})
      const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(() => assertValidSignature(payload, signature, secret)).not.toThrowError()
    })

    test('returns false on invalid signatures (timestamp)', () => {
      const payload = JSON.stringify({_id: 'resume'})
      const signature = 't=1633519811128,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(() =>
        assertValidSignature(payload, signature, secret)
      ).toThrowErrorMatchingInlineSnapshot(`"Signature is invalid"`)
    })

    test('returns false on invalid signatures (hash)', () => {
      const payload = JSON.stringify({_id: 'resume'})
      const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N1'
      expect(() =>
        assertValidSignature(payload, signature, secret)
      ).toThrowErrorMatchingInlineSnapshot(`"Signature is invalid"`)
    })

    test('returns false on invalid signatures (payload)', () => {
      const payload = JSON.stringify({_id: 'structure'})
      const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(() =>
        assertValidSignature(payload, signature, secret)
      ).toThrowErrorMatchingInlineSnapshot(`"Signature is invalid"`)
    })

    test('returns false on invalid signature', () => {
      const payload = JSON.stringify({_id: 'structure'})
      const signature = 't=1633519811129,v5=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(() =>
        assertValidSignature(payload, signature, secret)
      ).toThrowErrorMatchingInlineSnapshot(`"Invalid signature payload format"`)
    })
  })

  describe('assertValidRequest', () => {
    const secret = 'test'
    const getRequest = ({signature, body}: {signature?: string; body?: unknown}) => ({
      body: body || {_id: 'resume'},
      headers: {
        [SIGNATURE_HEADER_NAME]:
          signature || 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0',
      },
    })

    test('returns true on valid requests', () => {
      expect(() => assertValidRequest(getRequest({}), secret)).not.toThrowError()
    })

    test('returns false on invalid signatures (timestamp)', () => {
      const signature = 't=1633519811128,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(() =>
        assertValidRequest(getRequest({signature}), secret)
      ).toThrowErrorMatchingInlineSnapshot(`"Signature is invalid"`)
    })

    test('returns false on invalid signatures (hash)', () => {
      const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N1'
      expect(() =>
        assertValidRequest(getRequest({signature}), secret)
      ).toThrowErrorMatchingInlineSnapshot(`"Signature is invalid"`)
    })

    test('returns false on invalid signatures (payload)', () => {
      const body = {_id: 'structure'}
      expect(() =>
        assertValidRequest(getRequest({body}), secret)
      ).toThrowErrorMatchingInlineSnapshot(`"Signature is invalid"`)
    })

    test('returns false on invalid signature', () => {
      const signature = 't=1633519811129,v5=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
      expect(() =>
        assertValidRequest(getRequest({signature}), secret)
      ).toThrowErrorMatchingInlineSnapshot(`"Invalid signature payload format"`)
    })
  })

  describe('decodeSignatureHeader', () => {
    test('decodes valid signatures', () => {
      const header = 't=1633470609222,v1=7kTYPaw6SmCoN2VJzFL24oEjV-ac7lRwbljOkh7d13A'
      const decoded = decodeSignatureHeader(header)

      expect(decoded.timestamp).toBe(1633470609222)
      expect(decoded.hashedPayload).toBe('7kTYPaw6SmCoN2VJzFL24oEjV-ac7lRwbljOkh7d13A')
    })

    test('allows space in signature header', () => {
      const header = 't=1633470609222, v1=7kTYPaw6SmCoN2VJzFL24oEjV-ac7lRwbljOkh7d13A'
      const decoded = decodeSignatureHeader(header)

      expect(decoded.timestamp).toBe(1633470609222)
      expect(decoded.hashedPayload).toBe('7kTYPaw6SmCoN2VJzFL24oEjV-ac7lRwbljOkh7d13A')
    })

    test('throws on invalid signatures', () => {
      const header = 't=1633470609222,v3=7kTYPaw6SmCoN2VJzFL24oEjV-ac7lRwbljOkh7d13A'

      expect(() => decodeSignatureHeader(header)).toThrowErrorMatchingInlineSnapshot(
        `"Invalid signature payload format"`
      )
    })
  })

  describe('encodeSignatureHeader', () => {
    const secret = 'try-me'
    const timestamp = 1633518820676
    const stringifiedPayload = JSON.stringify({title: 'GROQ-Hooks are neat'})

    test('encodes signatures', () => {
      const encoded = encodeSignatureHeader(stringifiedPayload, timestamp, secret)
      expect(encoded).toBe('t=1633518820676,v1=e7C9h2sfbFfc4V7TEz7PSOp4IoNzl0UdVsBV-1wgdeA')
    })

    test('throws on empty payload', () => {
      expect(() => encodeSignatureHeader('', timestamp, secret)).toThrowErrorMatchingInlineSnapshot(
        `"Can not create signature for empty payload"`
      )
    })

    test('throws on non-string payload', () => {
      // @ts-expect-error
      expect(() => encodeSignatureHeader({}, timestamp, secret)).toThrowErrorMatchingInlineSnapshot(
        `"Payload must be a JSON-encoded string"`
      )
    })

    test('throws on invalid timestamp type (invalid type)', () => {
      expect(() =>
        // @ts-expect-error
        encodeSignatureHeader(stringifiedPayload, 'foo', secret)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Invalid signature timestamp, must be a unix timestamp with millisecond precision"`
      )
    })

    test('throws on invalid timestamp (NaN)', () => {
      expect(() =>
        encodeSignatureHeader(stringifiedPayload, parseInt('foo', 10), secret)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Invalid signature timestamp, must be a unix timestamp with millisecond precision"`
      )
    })

    test('throws on invalid timestamp (invalid precision)', () => {
      expect(() =>
        encodeSignatureHeader(stringifiedPayload, Date.now() / 1000, secret)
      ).toThrowErrorMatchingInlineSnapshot(
        `"Invalid signature timestamp, must be a unix timestamp with millisecond precision"`
      )
    })
  })
})
