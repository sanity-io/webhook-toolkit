/**
 * Error types used on signature errors.
 * Includes `type` and `statusCode` properties.
 *
 * @public
 */
export type WebhookSignatureError = WebhookSignatureValueError | WebhookSignatureFormatError

/**
 * Error thrown when the signature value does not match the expected value.
 *
 * @public
 */
export class WebhookSignatureValueError extends Error {
  public type = 'WebhookSignatureValueError'
  public statusCode = 401
}

/**
 * Error thrown when the signature format is invalid.
 * This can happen when the signature is not a string or is not in the format of `t=<timestamp>,v=<signature>`.
 * This error is also thrown when the timestamp is not a number or is not within the tolerance time.
 *
 * @public
 */
export class WebhookSignatureFormatError extends Error {
  public type = 'WebhookSignatureFormatError'
  public statusCode = 400
}

/**
 * Checks whether or not the given error is a signature error.
 *
 * @param error - The error to check.
 * @returns `true` if the error is a signature error, otherwise `false`.
 * @public
 */
export function isSignatureError(error: unknown): error is WebhookSignatureError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    ['WebhookSignatureValueError', 'WebhookSignatureFormatError'].includes(
      (error as WebhookSignatureError).type,
    )
  )
}
