/* --------------------
 * react-async-ssr module
 * Render tree to HTML
 * ------------------*/

'use strict';

// Imports
const {TYPE_TEXT} = require('./constants'),
	walkTree = require('./walkTree');

// Exports

/**
 * Render boundary tree to HTML.
 * All lazy nodes must be resolved before calling this.
 * @param {Object} tree - Boundary tree
 * @param {boolean} makeStaticMarkup - `true` for `renderToStaticMarkup()`-style rendering
 * @returns {string} - HTML output
 */
function treeToHtml(tree, makeStaticMarkup) {
	let out = '',
		lastText = false;

	walkTree(tree, node => {
		if (node.type !== TYPE_TEXT) return;

		const thisOut = node.out;
		if (lastText && thisOut.slice(0, 1) !== '<') out += '<!-- -->';
		out += thisOut;
		if (!makeStaticMarkup) lastText = thisOut.slice(-1) !== '>';
	});

	return out;
}

module.exports = treeToHtml;
