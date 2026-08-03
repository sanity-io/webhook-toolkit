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

/**
 * A Connect/Express-like response object with `status` and `json` methods.
 *
 * @public
 */
export interface ConnectLikeResponse {
  status(code: number): {json(body: unknown): void}
}

/**
 * A Connect/Express-like next function.
 *
 * @public
 */
export type ConnectLikeNextFunction = (err?: unknown) => void

/**
 * A Connect/Express-compatible request handler (middleware).
 *
 * @public
 */
export type ConnectLikeRequestHandler = (
  req: ConnectLikeRequest,
  res: ConnectLikeResponse,
  next: ConnectLikeNextFunction,
) => void
