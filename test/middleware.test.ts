import express, {Express, NextFunction, Request, RequestHandler, Response} from 'express'
import {json, text} from 'body-parser'
import request from 'supertest'
import {isSignatureError, requireSignedRequest, SIGNATURE_HEADER_NAME} from '../src'

describe('middleware', () => {
  const payload = {_id: 'resume'}
  const signature = 't=1633519811129,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0'
  const secret = 'test'

  describe.each([
    ['json', json()],
    ['text', text({type: 'application/json'})],
  ])('%s middleware', (_, middleware) => {
    describe('requireSignedRequest (respond on success)', () => {
      test('passes valid requests', () => {
        return request(getApp(middleware, requireSignedRequest({secret})))
          .post('/hook')
          .set('Content-Type', 'application/json')
          .set(SIGNATURE_HEADER_NAME, signature)
          .send(payload)
          .expect({success: true, payload})
          .expect(200)
      })

      test('passes valid requests', () => {
        return request(getApp(middleware, requireSignedRequest({secret})))
          .post('/hook')
          .set('Content-Type', 'application/json')
          .set(SIGNATURE_HEADER_NAME, signature)
          .send(payload)
          .expect({success: true, payload})
          .expect(200)
      })

      test('fails if no signature is present', () => {
        return request(getApp(middleware, requireSignedRequest({secret})))
          .post('/hook')
          .set('Content-Type', 'application/json')
          .send(payload)
          .expect({message: 'Request contained no signature header'})
          .expect(401)
      })

      test('fails if signature is invalid (hash)', () => {
        return request(getApp(middleware, requireSignedRequest({secret})))
          .post('/hook')
          .set('Content-Type', 'application/json')
          .set(SIGNATURE_HEADER_NAME, signature.slice(0, -5))
          .send(payload)
          .expect({message: 'Signature is invalid'})
          .expect(401)
      })

      test('fails if signature format is invalid (timestamp)', () => {
        return request(getApp(middleware, requireSignedRequest({secret})))
          .post('/hook')
          .set('Content-Type', 'application/json')
          .set(SIGNATURE_HEADER_NAME, 't=1633519811,v1=tLa470fx7qkLLEcMOcEUFuBbRSkGujyskxrNXcoh0N0')
          .send(payload)
          .expect({
            message:
              'Invalid signature timestamp, must be a unix timestamp with millisecond precision',
          })
          .expect(400)
      })

      test('fails if signature format is invalid (format)', () => {
        return request(getApp(middleware, requireSignedRequest({secret})))
          .post('/hook')
          .set('Content-Type', 'application/json')
          .set(SIGNATURE_HEADER_NAME, 't=1633519811123,v4=tLa470fx7qkLLEcMOcEUFuBbRS')
          .send(payload)
          .expect({message: 'Invalid signature payload format'})
          .expect(400)
      })

      test('fails if signature format is invalid (payload)', () => {
        return request(getApp(middleware, requireSignedRequest({secret})))
          .post('/hook')
          .set('Content-Type', 'application/json')
          .set(SIGNATURE_HEADER_NAME, signature)
          .send({foo: 'bar'})
          .expect({message: 'Signature is invalid'})
          .expect(401)
      })
    })

    describe('requireSignedRequest (use error handler)', () => {
      test('passes valid requests', () => {
        return request(getApp(middleware, requireSignedRequest({secret, respondOnError: false})))
          .post('/hook')
          .set('Content-Type', 'application/json')
          .set(SIGNATURE_HEADER_NAME, signature)
          .send(payload)
          .expect({success: true, payload})
          .expect(200)
      })

      test('fails if no signature is present', () => {
        return request(getApp(middleware, requireSignedRequest({secret, respondOnError: false})))
          .post('/hook')
          .set('Content-Type', 'application/json')
          .send(payload)
          .expect({message: 'Request contained no signature header', success: false})
          .expect(401)
      })
    })
  })

  test('fails if no body parsing middleware present', () => {
    return request(getApp(requireSignedRequest({secret})))
      .post('/hook')
      .set('Content-Type', 'application/json')
      .set(SIGNATURE_HEADER_NAME, signature)
      .send(payload)
      .expect({message: 'Request contained no parsed request body'})
      .expect(400)
  })
})

/**
 * Test helpers
 */
function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (!isSignatureError(err)) {
    next(err)
    return
  }

  res.status(err.statusCode).json({message: err.message, success: false})
}

function getApp(...middleware: RequestHandler[]): Express {
  const app = express()
  app.post('/hook', ...middleware, (req, res) => res.json({success: true, payload: req.body}))
  app.use(errorHandler)
  return app
}
