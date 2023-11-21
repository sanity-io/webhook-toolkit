import base64Url from 'base64url'
import {WebhookSignatureFormatError, WebhookSignatureValueError} from './errors'
import type {DecodedSignature, ConnectLikeRequest} from './types'

/**
 * We didn't send signed payloads prior to 2021 (2021-01-01T00:00:00.000Z)
 */
const MINIMUM_TIMESTAMP = 1609459200000

const SIGNATURE_HEADER_REGEX = /^t=(\d+)[, ]+v1=([^, ]+)$/

export const SIGNATURE_HEADER_NAME = 'sanity-webhook-signature'

export function assertValidSignature(
  stringifiedPayload: string,
  signature: string,
  secret: string
): void {
  const {timestamp} = decodeSignatureHeader(signature)
  const encoded = encodeSignatureHeader(stringifiedPayload, timestamp, secret)
  if (signature !== encoded) {
    throw new WebhookSignatureValueError('Signature is invalid')
  }
}

export function isValidSignature(
  stringifiedPayload: string,
  signature: string,
  secret: string
): boolean {
  try {
    assertValidSignature(stringifiedPayload, signature, secret)
    return true
  } catch (err) {
    return false
  }
}

export function assertValidRequest(request: ConnectLikeRequest, secret: string): void {
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
    assertValidSignature(request.body.toString('utf8'), signature, secret)
  } else {
    throw new Error(
      '[@sanity/webhook] `request.body` was not a string/buffer - this can lead to invalid signatures. See the [migration docs](https://github.com/sanity-io/webhook-toolkit#from-parsed-to-unparsed-body) for details on how to fix this.'
    )
  }
}

export function isValidRequest(request: ConnectLikeRequest, secret: string): boolean {
  try {
    assertValidRequest(request, secret)
    return true
  } catch (err) {
    return false
  }
}

export function encodeSignatureHeader(
  stringifiedPayload: string,
  timestamp: number,
  secret: string
): string {
  const signature = createHS256Signature(stringifiedPayload, timestamp, secret)
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
  // Same validations checks.
  if (!secret || typeof secret !== 'string') {
    // ...
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
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    enc.encode(signaturePayload),
  )
  return base64Url(new Uint8Array(signature))
}
