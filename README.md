# @sanity/webhook

Toolkit for dealing with [GROQ-powered webhooks](https://www.sanity.io/docs/webhooks) delivered by [Sanity.io](https://www.sanity.io/).

## Installing

```sh
$ npm install @sanity/webhook
```

## Usage

```js
// ESM / TypeScript
import {isValidSignature} from '@sanity/webhook'

// CommonJS
const {isValidSignature} = require('@sanity/webhook')
```

### Usage with Express.js (or similar)

```ts
import express from 'express'
import bodyParser from 'body-parser'
import {requireSignedRequest} from '@sanity/webhook'

express()
  .use(bodyParser.text({type: 'application/json'}))
  .post(
    '/hook',
    requireSignedRequest({secret: process.env.MY_WEBHOOK_SECRET, parseBody: true}),
    function myRequestHandler(req, res) {
      // Note that `req.body` is now a parsed version, set `parseBody` to `false`
      // if you want the raw text version of the request body
    }
  )
  .listen(1337)
```

### Usage with Next.js

```ts
// pages/api/hook.js
import {isValidRequest, SIGNATURE_HEADER_NAME} from '@sanity/webhook'

const secret = process.env.MY_WEBHOOK_SECRET

export default async function handler(req, res) {
  const signature = request.headers[SIGNATURE_HEADER_NAME]
  const body = await readBody(req) // Read the body into a string
  if (!isValidSignature(body, signature, secret)) {
    res.status(401).json({success: false, message: 'Invalid signature'})
    return
  }

  const jsonBody = JSON.parse(body)
  doSomeMagicWithPayload(jsonBody)
  res.json({success: true})
}

// Next.js will by default parse the body, which can lead to invalid signatures
export const config = {
  api: {
    bodyParser: false,
  },
}

async function readBody(readable) {
  const chunks = []
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks).toString('utf8')
}
```

## Documentation

Note that the functions `requireSignedRequest`, `assertValidRequest` and `isValidRequest` all require that the request object should have a text `body` property.
E.g. if you're using Express.js or Connect, make sure you have a [Text body-parser](https://github.com/expressjs/body-parser#bodyparsertextoptions) middleware registered for the route (with `{type: 'application/json'}`).

### Functions

- [requireSignedRequest](README.md#requiresignedrequest)
- [assertValidSignature](README.md#assertvalidsignature)
- [isValidSignature](README.md#isvalidsignature)
- [assertValidRequest](README.md#assertvalidrequest)
- [isValidRequest](README.md#isvalidrequest)

### requireSignedRequest

**requireSignedRequest**(`options`: _SignatureMiddlewareOptions_): _RequestHandler_

Returns an Express.js/Connect-compatible middleware which validates incoming requests to ensure they are correctly signed.
This middleware will also parse the request body into JSON: The next handler will have `req.body` parsed into a plain JavaScript object.

**Options**:

- `secret` (_string_, **required**) - the secret to use for validating the request.
- `parseBody` (_boolean_, optional, default: _true_) - whether or not to parse the body as JSON and set `request.body` to the parsed value.
- `respondOnError` (_boolean_, optional, default: _true_) - whether or not the request should automatically respond to the request with an error, or (if `false`) pass the error on to the next registered error middleware.

### assertValidSignature

**assertValidSignature**(`stringifiedPayload`: _string_, `signature`: _string_, `secret`: _string_): _void_

Asserts that the given payload and signature matches and is valid, given the specified secret. If it is not valid, the function will throw an error with a descriptive `message` property.

### isValidSignature

**isValidSignature**(`stringifiedPayload`: _string_, `signature`: _string_, `secret`: _string_): _boolean_

Returns whether or not the given payload and signature matches and is valid, given the specified secret. On invalid, missing or mishaped signatures, this function will return `false` instead of throwing.

### assertValidRequest

**assertValidRequest**(`request`: _ConnectLikeRequest_, `secret`: _string_): _void_

Asserts that the given request has a request body which matches the received signature, and that the signature is valid given the specified secret. If it is not valid, the function will throw an error with a descriptive `message` property.

### isValidRequest

**isValidRequest**(`request`: _ConnectLikeRequest_, `secret`: _string_): _boolean_

Returns whether or not the given request has a request body which matches the received signature, and that the signature is valid given the specified secret.

## Migration

### From parsed to unparsed body

In versions 1.0.2 and below, this library would accept a parsed request body as the input for `requireSignedRequest()`, `assertValidRequest()` and `isValidRequest()`.

These methods would internally call `JSON.stringify()` on the body in these cases, then compare it to the signature. This works in _most_ cases, but because of slightly different JSON-encoding behavior between environments, it could sometimes lead to a mismatch in signatures.

To prevent these situations from occuring, we now _highly_ recommend that you aquire the raw request body when using these methods.

See the usage examples further up for how to do this:

- [Express.js or similar](#usage-with-expressjs-or-similar)
- [Next.js](#usage-with-nextjs)

Differences in behavior:

- In version 2.0.0 and above, an error will be thrown if the request body is not a string or a buffer.
- In version 1.1.0, a warning will be printed to the console if the request body is not a string or buffer.

## License

MIT-licensed. See LICENSE.
