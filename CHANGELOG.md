<!-- markdownlint-disable --><!-- textlint-disable -->

# 📓 Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [3.0.0](https://github.com/sanity-io/webhook-toolkit/compare/v2.0.0...v3.0.0) (2023-08-18)

### ⚠ BREAKING CHANGES

- ship ESM

### Features

- ship ESM ([e495e26](https://github.com/sanity-io/webhook-toolkit/commit/e495e26921f0c74aa94a858e3946449eba245a1e))

# Change Log

All notable changes will be documented in this file.

## 2.0.0

### BREAKING

- BREAKING: The `requireSignedRequest()`, `assertValidRequest()` and `isValidRequest()` methods now _require_ a body in string/buffer format, and will throw an error if it is already parsed. This is due to potential signature mismatches when re-encoding JSON. See the [migration docs](https://github.com/sanity-io/webhook-toolkit#from-parsed-to-unparsed-body) for more information.

## 1.1.0

### Changed

- Generating signatures should now be done based on the raw body of the request (as text/buffer) instead of re-encoding the body to JSON and comparing it. This fixes a few issues where the JSON encoding in v8 would differ from the JSON encoding of the server, leading to signature mismatches. A warning is now emitted when comparing a parsed body - see the [migration docs](https://github.com/sanity-io/webhook-toolkit#from-parsed-to-unparsed-body) for more information.
- The `requireSignedRequest()` method now takes an additional option - `parseBody`. By default, it is set to `true`, and will parse the incoming JSON request and assign it to `request.body`. If set to `false`, the body is left untouched and has to be parsed by the user.
