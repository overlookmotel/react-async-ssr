# Changelog

## 0.4.2

Other:

* Changelog for v0.4.1

## 0.4.1

Features:

* `fallbackFast` option

Other:

* Docs: README update
* Tests: Trivial refactor

## 0.4.0

Breaking changes:

* Rename promise abort method from `.abort` to symbol `[ABORT]`

Features:

* `NO_SSR` promise signal to prevent server rendering

Other:

* Trivial refactors

## 0.3.1

Bug fixes:

* No hang on null fallback

Other:

* Refactor PartialRenderer class into multiple files

## 0.3.0

Breaking changes:

* Reject when promise thrown outside Suspense
* Rejection error when promise thrown outside Suspense
* Continue rendering within suspense boundary once fallback triggered
* Render fallbacks of nested Suspenses when suspend

Bug fixes:

* Ignore Suspense with undefined fallback
* Fix hang on promise rejection
* Shimmed function components transmit `this` context

Dependencies:

* Update `react-dom` dependency to 16.8.4

Other:

* Remove undocumented `lazy` method
* Render within a single thread
* Tests for spacing in HTML output around fallbacks
* Minor performance improvements
* Major refactor
* Update docs

## 0.2.0

Breaking changes:

* Stop rendering within Suspense boundary once fallback triggered
* Promises thrown within a Suspense boundary whose fallback is triggered are not awaited

Features:

* Support React hooks
* Call `.abort()` on promise where result will not be rendered

Other:

* Major refactor

## 0.1.0

* Initial release
