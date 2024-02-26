import {WebhookSignatureFormatError, WebhookSignatureValueError, isSignatureError} from './errors'
import type {DecodedSignature, ConnectLikeRequest} from './types'

/**
 * We didn't send signed payloads prior to 2021 (2021-01-01T00:00:00.000Z)
 */
const MINIMUM_TIMESTAMP = 1609459200000

const SIGNATURE_HEADER_REGEX = /^t=(\d+)[, ]+v1=([^, ]+)$/

/**
 * The name of the header that contains the signature.
 *
 * @public
 */
export const SIGNATURE_HEADER_NAME = 'sanity-webhook-signature'

/**
 * Asserts that the given signature is valid.
 * Throws an error if the signature is invalid.
 *
 * @param stringifiedPayload - The stringified payload to verify - should be straight from the request, not a re-encoded JSON string, as this in certain cases will yield mismatches due to inconsistent encoding.
 * @param signature - The signature to verify against
 * @param secret - The secret to use for verifying the signature
 * @public
 */
export async function assertValidSignature(
  stringifiedPayload: string,
  signature: string,
  secret: string,
): Promise<void> {
  const {timestamp} = decodeSignatureHeader(signature)
  const encoded = await encodeSignatureHeader(stringifiedPayload, timestamp, secret)
  if (signature !== encoded) {
    throw new WebhookSignatureValueError('Signature is invalid')
  }
}

/**
 * Checks if the given signature is valid.
 *
 * @param stringifiedPayload - The stringified payload to verify - should be straight from the request, not a re-encoded JSON string, as this in certain cases will yield mismatches due to inconsistent encoding.
 * @param signature - The signature to verify against
 * @param secret - The secret to use for verifying the signature
 * @returns A promise that resolves to `true` if the signature is valid, `false` otherwise.
 * @public
 */
export async function isValidSignature(
  stringifiedPayload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  try {
    await assertValidSignature(stringifiedPayload, signature, secret)
    return true
  } catch (err) {
    if (isSignatureError(err)) {
      return false
    }
    throw err
  }
}

/**
 * Asserts that the given request is valid.
 * Throws an error if the request is invalid.
 *
 * @param request - The Connect/Express-like request to verify
 * @param secret - The secret to use for verifying the signature
 * @public
 */
export async function assertValidRequest(
  request: ConnectLikeRequest,
  secret: string,
): Promise<void> {
  const signature = request.headers[SIGNATURE_HEADER_NAME]
  if (Array.isArray(signature)) {
    throw new WebhookSignatureFormatError('Multiple signature headers received')
  }

  if (typeof signature !== 'string') {
    throw new WebhookSignatureValueError('Request contained no signature header')
  }

  if (typeof request.body === 'undefined') {
    throw new WebhookSignatureFormatError('Request contained no parsed request body')
  }

  if (typeof request.body === 'string' || Buffer.isBuffer(request.body)) {
    await assertValidSignature(request.body.toString('utf8'), signature, secret)
  } else {
    throw new Error(
      '[@sanity/webhook] `request.body` was not a string/buffer - this can lead to invalid signatures. See the [migration docs](https://github.com/sanity-io/webhook-toolkit#from-parsed-to-unparsed-body) for details on how to fix this.',
    )
  }
}

/**
 * Checks if the given request is valid.
 *
 * @param request - The Connect/Express-like request to verify
 * @param secret - The secret to use for verifying the signature
 * @returns Promise that resolves to `true` if the request is valid, `false` otherwise.
 * @public
 */
export async function isValidRequest(
  request: ConnectLikeRequest,
  secret: string,
): Promise<boolean> {
  try {
    await assertValidRequest(request, secret)
    return true
  } catch (err) {
    if (isSignatureError(err)) {
      return false
    }
    throw err
  }
}

/**
 * Encodes a signature header for the given payload and timestamp.
 *
 * @param stringifiedPayload - The stringified payload to verify - should be straight from the request, not a re-encoded JSON string, as this in certain cases will yield mismatches due to inconsistent encoding.
 * @param timestamp - The timestamp to use for the signature
 * @param secret - The secret to use for verifying the signature
 * @returns A promise that resolves to the encoded signature header
 * @public
 */
export async function encodeSignatureHeader(
  stringifiedPayload: string,
  timestamp: number,
  secret: string,
): Promise<string> {
  const signature = await createHS256Signature(stringifiedPayload, timestamp, secret)
  return `t=${timestamp},v1=${signature}`
}

/**
 * Decode a signature header into a timestamp and hashed payload.
 *
 * @param signaturePayload - The signature header to decode
 * @returns An object with the decoded timestamp and hashed payload
 * @public
 */
export function decodeSignatureHeader(signaturePayload: string): DecodedSignature {
  if (!signaturePayload) {
    throw new WebhookSignatureFormatError('Missing or empty signature header')
  }

  const [, timestamp, hashedPayload] = signaturePayload.trim().match(SIGNATURE_HEADER_REGEX) || []
  if (!timestamp || !hashedPayload) {
    throw new WebhookSignatureFormatError('Invalid signature payload format')
  }

  return {
    timestamp: parseInt(timestamp, 10),
    hashedPayload,
  }
}

/**
 * Creates a HS256 signature for the given payload and timestamp.
 *
 * @param stringifiedPayload - The stringified payload to verify - should be straight from the request, not a re-encoded JSON string, as this in certain cases will yield mismatches due to inconsistent encoding.
 * @param timestamp - The timestamp to use for the signature
 * @param secret - The secret to use for verifying the signature
 * @returns A promise that resolves to the encoded signature
 * @internal
 */
async function createHS256Signature(
  stringifiedPayload: string,
  timestamp: number,
  secret: string,
): Promise<string> {
  if (typeof crypto === 'undefined') {
    throw new TypeError(
      'The Web Crypto API is not available in this environment, either polyfill `globalThis.crypto` or downgrade to `@sanity/webhook@3` which uses the Node.js `crypto` module.',
    )
  }
  if (!secret || typeof secret !== 'string') {
    throw new WebhookSignatureFormatError('Invalid secret provided')
  }

  if (!stringifiedPayload) {
    throw new WebhookSignatureFormatError('Can not create signature for empty payload')
  }

  if (typeof stringifiedPayload !== 'string') {
    throw new WebhookSignatureFormatError('Payload must be a JSON-encoded string')
  }

  if (typeof timestamp !== 'number' || isNaN(timestamp) || timestamp < MINIMUM_TIMESTAMP) {
    throw new WebhookSignatureFormatError(
      'Invalid signature timestamp, must be a unix timestamp with millisecond precision',
    )
  }

  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    {name: 'HMAC', hash: 'SHA-256'},
    false,
    ['sign'],
  )
  const signaturePayload = `${timestamp}.${stringifiedPayload}`
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(signaturePayload))

  // Encode as base64url
  let signatureArray = Array.from(new Uint8Array(signature))
  return btoa(String.fromCharCode.apply(null, signatureArray))
    .replace(/\+/g, '-') // Replace '+' with '-'
    .replace(/\//g, '_') // Replace '/' with '_'
    .replace(/=+$/, '') // Remove padding
}
