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
  .post('/hook', requireSignedRequest({secret: process.env.MY_WEBHOOK_SECRET}))
  .listen(1337)
```

### Usage with Next.js

```ts
// pages/api/hook.js
import {isValidRequest} from '@sanity/webhook'

const secret = process.env.MY_WEBHOOK_SECRET

export default function handler(req, res) {
  if (!isValidRequest(req, secret)) {
    res.status(401).json({success: false, message: 'Invalid signature'})
    return
  }

  doSomeMagicWithPayload(req.body)
  res.json({success: true})
}
```

## Documentation

Note that the functions `requireSignedRequest`, `assertValidRequest` and `isValidRequest` all require that the request object should have a text `body` property.
E.g. if you're using Express.js or Connect, make sure you have a [Text body-parser](https://github.com/expressjs/body-parser#bodyparsertextoptions) middleware registered for the route (with `{type: 'application/json'}`).

(An earlier version of this library supported that the request body had a JSON `body` property. This is still supported for backwards compatibility, but is not recommended since it can cause signature errors on certain payloads.)

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

- `secret` (_string_, **required**) - the secret to use for validating the request
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

## License

MIT-licensed. See LICENSE.
