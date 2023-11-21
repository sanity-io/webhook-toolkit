import {WebhookSignatureFormatError, WebhookSignatureValueError} from './errors'
import type {DecodedSignature, ConnectLikeRequest} from './types'

/**
 * We didn't send signed payloads prior to 2021 (2021-01-01T00:00:00.000Z)
 */
const MINIMUM_TIMESTAMP = 1609459200000

const SIGNATURE_HEADER_REGEX = /^t=(\d+)[, ]+v1=([^, ]+)$/

export const SIGNATURE_HEADER_NAME = 'sanity-webhook-signature'

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

export async function isValidSignature(
  stringifiedPayload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  try {
    await assertValidSignature(stringifiedPayload, signature, secret)
    return true
  } catch (err) {
    return false
  }
}

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

export async function isValidRequest(
  request: ConnectLikeRequest,
  secret: string,
): Promise<boolean> {
  try {
    await assertValidRequest(request, secret)
    return true
  } catch (err) {
    return false
  }
}

export async function encodeSignatureHeader(
  stringifiedPayload: string,
  timestamp: number,
  secret: string,
): Promise<string> {
  const signature = await createHS256Signature(stringifiedPayload, timestamp, secret)
  return `t=${timestamp},v1=${signature}`
}

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

async function createHS256Signature(
  stringifiedPayload: string,
  timestamp: number,
  secret: string,
): Promise<string> {
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
