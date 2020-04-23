# Changelog

## 0.7.2

No code:

* Fix comment typo

Tests:

* Import module by name [refactor]

Dev:

* Update dev dependencies
* Run tests on CI on Node v14
* Replace `.npmignore` with `files` list in `package.json`
* `.editorconfig` config
* Simplify Jest config

Docs:

* Fix whitespace in README [fix]

## 0.7.1

Docs:

* Update docs

## 0.7.0

Breaking changes:

* Drop support for Node v8

Refactor:

* Replace utils with packages
* Import file extensions
* Fix lint error

No code:

* NPM ignore `.DS_Store` files
* Header code comments
* Fix spacing

Tests:

* Check no client-side hydration warnings except where fallbacks triggered

Dev:

* Update dev dependencies
* ESLint ignore coverage dir
* ESLint not ignore dot files
* Tab width 2 in `.editorconfig`
* Remove `npm-debug.log` from `.gitignore`
* Remove `sudo` from Travis CI config

Docs:

* Versioning policy
* Reformat code examples
* Update license year

## 0.6.0

Breaking changes:

* Drop support for React 16.11.0+
* Use strings in place of Symbols

Dev:

* Update dev dependencies

No code:

* Fix comment typo

## 0.5.4

No code:

* NPM ignore `.DS_Store` files

## 0.5.3

Bug fixes:

* Exclude React v16.10.x

Dev:

* Update dev dependencies
* Travis CI run tests on Node v13
* Travis CI run coverage on Node v12

## 0.5.2

Bug fixes:

* Update `react-dom` to 16.9.x

## 0.5.1

Bug fixes:

* Lock React version to 16.8.x

## 0.5.0

Breaking changes:

* Drop support for Node v6
* Symbols are actual Symbols

Refactor:

* ESLint comments

Tests:

* Major refactor and test all against sync HTML
* Client-side hydration

Dev:

* Travis CI run tests on Node v12
* Jest config coverage blacklist
* Update dev dependencies
* Add `package-lock.json`

Docs:

* Readme update

## 0.4.6

Other:

* Update `react-dom` dependency
* Update linting rules
* Fix ESLint errors [refactor]

## 0.4.5

Features:

* Call `[ON_MOUNT]` on promises

Other:

* Tests: Refactor with expect extensions

## 0.4.4

Bug fixes:

* Prevent calling callback twice when NO_SSR promise thrown

## 0.4.3

Other:

* Fix Changelog for v0.4.2

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
