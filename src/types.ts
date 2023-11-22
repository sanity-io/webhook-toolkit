/**
 * A decoded signature header
 *
 * @public
 */
export interface DecodedSignature {
  /**
   * The timestamp the signature was created
   */
  timestamp: number

  /**
   * The hashed payload (base64url encoded)
   */
  hashedPayload: string
}

/**
 * A Connect/Express-like request object, containing a `headers` object and a `body` property.
 *
 * @public
 */
export interface ConnectLikeRequest<B = unknown> {
  headers: Record<string, string | string[] | undefined>
  body: B
}
