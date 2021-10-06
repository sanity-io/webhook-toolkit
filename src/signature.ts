import crypto from 'crypto'
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

  const payload = JSON.stringify(request.body)
  assertValidSignature(payload, signature, secret)
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
  const [, timestamp, hashedPayload] = signaturePayload.trim().match(SIGNATURE_HEADER_REGEX) || []
  if (!timestamp || !hashedPayload) {
    throw new WebhookSignatureFormatError('Invalid signature payload format')
  }

  return {
    timestamp: parseInt(timestamp, 10),
    hashedPayload,
  }
}

function createHS256Signature(
  stringifiedPayload: string,
  timestamp: number,
  secret: string
): string {
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
      'Invalid signature timestamp, must be a unix timestamp with millisecond precision'
    )
  }

  const hmac = crypto.createHmac('sha256', secret)
  const signaturePayload = `${timestamp}.${stringifiedPayload}`
  const signature = hmac.update(signaturePayload, 'utf8').digest()
  return base64Url(signature)
}
