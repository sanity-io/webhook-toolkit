<!-- markdownlint-disable --><!-- textlint-disable -->

# 📓 Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [4.0.0](https://github.com/sanity-io/webhook-toolkit/compare/v3.0.1...v4.0.0) (2023-11-27)

### ⚠ BREAKING CHANGES

- Replace the Node.js `crypto` API with the Web Crypto API,
  enabling usage in more environments. All assertion/checking functions are
  now async, eg return Promises instead of straight booleans.
- Only Node.js version 18 and higher is now supported.

- feat: add tsdoc for all exported members

- test: only test on lts node.js engines

### Features

- use Web Crypto API ([#41](https://github.com/sanity-io/webhook-toolkit/issues/41)) ([fb19bac](https://github.com/sanity-io/webhook-toolkit/commit/fb19bac5dc4a55ffdf3dd91eda4327605eb59f3a))

## [3.0.1](https://github.com/sanity-io/webhook-toolkit/compare/v3.0.0...v3.0.1) (2023-08-19)

### Bug Fixes

- improve TS export of definitions ([77770e7](https://github.com/sanity-io/webhook-toolkit/commit/77770e744f307296cdfdc126b02ecfb7f9d355f1))

## [3.0.0](https://github.com/sanity-io/webhook-toolkit/compare/v2.0.0...v3.0.0) (2023-08-18)

### Features

- ship ESM ([e495e26](https://github.com/sanity-io/webhook-toolkit/commit/e495e26921f0c74aa94a858e3946449eba245a1e))

## 2.0.0

### BREAKING

- BREAKING: The `requireSignedRequest()`, `assertValidRequest()` and `isValidRequest()` methods now _require_ a body in string/buffer format, and will throw an error if it is already parsed. This is due to potential signature mismatches when re-encoding JSON. See the [migration docs](https://github.com/sanity-io/webhook-toolkit#from-parsed-to-unparsed-body) for more information.

## 1.1.0

### Changed

- Generating signatures should now be done based on the raw body of the request (as text/buffer) instead of re-encoding the body to JSON and comparing it. This fixes a few issues where the JSON encoding in v8 would differ from the JSON encoding of the server, leading to signature mismatches. A warning is now emitted when comparing a parsed body - see the [migration docs](https://github.com/sanity-io/webhook-toolkit#from-parsed-to-unparsed-body) for more information.
- The `requireSignedRequest()` method now takes an additional option - `parseBody`. By default, it is set to `true`, and will parse the incoming JSON request and assign it to `request.body`. If set to `false`, the body is left untouched and has to be parsed by the user.
