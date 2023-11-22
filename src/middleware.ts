import type {RequestHandler} from 'express'
import {isSignatureError} from './errors'
import {assertValidRequest} from './signature'

/**
 * Options for the `requireSignedRequest` middleware
 *
 * @public
 */
export interface SignatureMiddlewareOptions {
  /**
   * The secret to use for verifying the signature
   */
  secret: string

  /**
   * Whether or not to parse the request body as JSON on success (assigns it to `request.body`).
   * Default: `true`
   */
  parseBody?: boolean

  /**
   * Whether or not to respond with an error when the signature is invalid.
   * If `false`, it will call the `next` function with the error instead.
   * Default: `true`
   */
  respondOnError?: boolean
}

/**
 * Express/Connect style middleware that verifies the signature of a request.
 * Should be added _after_ a body parser that parses the request body to _text_, not parsed JSON.
 *
 * @example
 * ```ts
 * import express from 'express'
 * import bodyParser from 'body-parser'
 * import {requireSignedRequest} from '@sanity/webhook'
 *
 * express()
 *   .use(bodyParser.text({type: 'application/json'}))
 *   .post(
 *     '/hook',
 *     requireSignedRequest({secret: process.env.MY_WEBHOOK_SECRET, parseBody: true}),
 *     function myRequestHandler(req, res) {
 *       // Note that `req.body` is now a parsed version, set `parseBody` to `false`
 *       // if you want the raw text version of the request body
 *     },
 *   )
 *   .listen(1337)
 * ```
 *
 * @param options - Options for the middleware
 * @returns A middleware function
 * @public
 */
export function requireSignedRequest(options: SignatureMiddlewareOptions): RequestHandler {
  const parseBody = typeof options.parseBody === 'undefined' ? true : options.parseBody
  const respondOnError =
    typeof options.respondOnError === 'undefined' ? true : options.respondOnError

  return async function ensureSignedRequest(request, response, next) {
    try {
      await assertValidRequest(request, options.secret)
      if (parseBody && typeof request.body === 'string') {
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
