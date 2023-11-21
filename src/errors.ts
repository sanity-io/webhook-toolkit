export type WebhookSignatureError = WebhookSignatureValueError | WebhookSignatureFormatError

export class WebhookSignatureValueError extends Error {
  public type = 'WebhookSignatureValueError'
  public statusCode = 401
}

export class WebhookSignatureFormatError extends Error {
  public type = 'WebhookSignatureFormatError'
  public statusCode = 400
}

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
