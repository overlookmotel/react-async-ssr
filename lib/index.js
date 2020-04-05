/* --------------------
 * react-async-ssr module
 * Main export
 * ------------------*/

'use strict';

// Imports
const Renderer = require('./renderer.js');

// Exports

module.exports = {
	renderToStringAsync(element, options) {
		return render(element, false, options);
	},

	renderToStaticMarkupAsync(element, options) {
		return render(element, true, options);
	}
};

/**
 * Async render function.
 * @param {Object} element - React element to render
 * @param {boolean} makeStaticMarkup - `true` for a `renderToStaticMarkup()`-style render
 * @param {Object} [options] - Options object
 * @param {boolean} [options.fallbackFast=false] - `true` to bail out of Suspense
 *     nodes as soon as suspended
 * @return {Promise} - Resolves to HTML result of render
 */
function render(element, makeStaticMarkup, options) {
	const fallbackFast = !!(options && options.fallbackFast);
	const renderer = new Renderer(element, makeStaticMarkup, fallbackFast);

	return new Promise((resolve, reject) => {
		renderer.readAsync((err, out) => {
			// NB Check for absence of `out` rather than existence of `err`
			// to handle if a falsy value has been thrown
			if (out === undefined) {
				reject(err);
			} else {
				resolve(out);
			}
		});
	});
}
