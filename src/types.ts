export interface DecodedSignature {
  timestamp: number
  hashedPayload: string
}

export interface ConnectLikeRequest<B = unknown> {
  headers: Record<string, string | string[] | undefined>
  body: B
}
