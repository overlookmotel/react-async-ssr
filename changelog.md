# Changelog

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
