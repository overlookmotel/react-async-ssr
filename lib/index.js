/* --------------------
 * react-async-ssr module
 * Main export
 * ------------------*/

'use strict';

// Imports
const PartialRenderer = require('./renderer');

// Exports
module.exports = {
	renderToStringAsync(element) {
		return render(element, false);
	},

	renderToStaticMarkupAsync(element) {
		return render(element, true);
	}
};

/**
 * Async render function.
 * @param {Object} element - React element to render
 * @param {boolean} makeStaticMarkup - `true` for a `renderToStaticMarkup()`-style render
 * @return {Promise} - Resolves to HTML result of render
 */
function render(element, makeStaticMarkup) {
	const renderer = new PartialRenderer(element, makeStaticMarkup);

	return new Promise((resolve, reject) => {
		renderer.readAsync((err, out) => {
			// NB Check for absence of `out` rather than existence of `err`
			// to handle if a falsy value has been thrown
			if (out === undefined) return reject(err);
			resolve(out);
		});
	});
}
