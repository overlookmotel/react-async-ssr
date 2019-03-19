/* --------------------
 * react-async-ssr module
 * Abort promise
 * ------------------*/

'use strict';

/**
 * Abort promise.
 * @param {Promise} promise - Promise to abort
 * @returns {undefined}
 */
function abort(promise) {
	if (typeof promise.abort === 'function') promise.abort();
}

/**
 * Follow promise (to catch rejections) and abort if does not resolve
 * synchronously.
 * @param {Promise} promise - Promise to abort
 * @returns {undefined}
 */
function followAndAbort(promise) {
	let resolved = false;
	const resolve = () => resolved = true;
	promise.then(resolve, resolve);
	if (!resolved) abort(promise);
}

module.exports = {
	abort,
	followAndAbort
};
