/* --------------------
 * react-async-ssr module
 * Main export
 * ------------------*/

'use strict';

// Imports
const render = require('./render');

// Exports
module.exports = {
	renderToStringAsync(element) {
		return render(element, false);
	},

	renderToStaticMarkupAsync(element) {
		return render(element, true);
	}
};
