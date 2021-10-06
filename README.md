# @sanity/webhook

Toolkit for dealing with webhooks delivered by Sanity

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
  .use(bodyParser.json())
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

  doSomeMagicWithPayload()
  res.json({success: true})
}
```

## Documentation

### Functions

- [requireSignedRequest](README.md#requiresignedrequest)
- [assertValidSignature](README.md#assertvalidsignature)
- [isValidSignature](README.md#isvalidsignature)
- [assertValidRequest](README.md#assertvalidrequest)
- [isValidRequest](README.md#isvalidrequest)

### requireSignedRequest

**assertValidSignature**(`options`: _SignatureMiddlewareOptions_): _RequestHandler_

Returns an express/connect-compatible middleware which validates incoming requests to ensure they are correctly signed.

**Options**:

- `secret` (_string_, **required**) - the secret to use for validating the request
- `respondOnError` (_boolean_, optional, default: _true_) - whether or not the request should automatically respond to the request with an error, or (if `false`) pass the error on to the next registered error middleware.

### assertValidSignature

**assertValidSignature**(`stringifiedPayload`: _string_, `signature`: _string_, `secret`: _string_): _void_

Asserts that the given payload and signature matches and is valid, given the specified secret. If it is not valid, the function will throw an error with a descriptive `message` property.

**Note**: The payload should be a JSON-encoded string, eg if you have a plain old Javascript object, pass it to `JSON.stringify()` before passing it to this function.

### isValidSignature

**isValidSignature**(`stringifiedPayload`: _string_, `signature`: _string_, `secret`: _string_): _boolean_

Returns whether or not the given payload and signature matches and is valid, given the specified secret. On invalid, missing or mishaped signatures, this function will return `false` instead of throwing.

**Note**: The payload should be a JSON-encoded string, eg if you have a plain old Javascript object, pass it to `JSON.stringify()` before passing it to this function.

### assertValidRequest

**assertValidRequest**(`request`: _ConnectLikeRequest_, `secret`: _string_): _void_

Asserts that the given request has a request body which matches the received signature, and that the signature is valid given the specified secret. If it is not valid, the function will throw an error with a descriptive `message` property.

**Note**: The request object passed should have a parsed `body` property, eg if you're using express or connect, make sure you have a [JSON body-parser](https://github.com/expressjs/body-parser#bodyparserjsonoptions) middleware registered for the route.

### isValidRequest

**isValidRequest**(`request`: _ConnectLikeRequest_, `secret`: _string_): _boolean_

Returns whether or not the given request has a request body which matches the received signature, and that the signature is valid given the specified secret.

**Note**: The request object passed should have a parsed `body` property, eg if you're using express or connect, make sure you have a [JSON body-parser](https://github.com/expressjs/body-parser#bodyparserjsonoptions) middleware registered for the route.

## License

MIT-licensed. See LICENSE.
