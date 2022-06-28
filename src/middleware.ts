import type {RequestHandler} from 'express'
import {isSignatureError} from '.'
import {assertValidRequest} from './signature'

export interface SignatureMiddlewareOptions {
  secret: string
  respondOnError?: boolean
}

export function requireSignedRequest(options: SignatureMiddlewareOptions): RequestHandler {
  const respondOnError =
    typeof options.respondOnError === 'undefined' ? true : options.respondOnError

  return function ensureSignedRequest(request, response, next) {
    try {
      assertValidRequest(request, options.secret)
      if (typeof request.body === 'string') {
        request.body = JSON.parse(request.body)
      }
      next()
    } catch (err) {
      if (!respondOnError || !isSignatureError(err)) {
        next(err)
        return
      }

      response.status(err.statusCode).json({message: err.message})
    }
  }
}
