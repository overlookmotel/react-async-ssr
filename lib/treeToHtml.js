/* --------------------
 * react-async-ssr module
 * Render tree to HTML
 * ------------------*/

'use strict';

// Imports
const {TYPE_TEXT} = require('./constants');

// Exports

/*
 * HtmlRenderer class
 * Used by `treeToHtml()` function below.
 * Renders tree to HTML, inserting '<!-- -->' between text nodes
 */
class HtmlRenderer {
	constructor(makeStaticMarkup) {
		this.makeStaticMarkup = makeStaticMarkup;
		this.lastText = false;
		this.out = '';
	}

	render(node) {
		const {children} = node;
		if (children) {
			for (let child of children) {
				this.render(child);
			}
		} else if (node.type === TYPE_TEXT) {
			this.append(node.out);
		}
	}

	append(out) {
		if (this.lastText && out.slice(0, 1) !== '<') this.out += '<!-- -->';
		this.out += out;
		if (!this.makeStaticMarkup) this.lastText = out.slice(-1) !== '>';
	}
}

/**
 * Render boundary tree to HTML.
 * All lazy nodes must be resolved before calling this.
 * @param {Object} tree - Boundary tree
 * @param {boolean} makeStaticMarkup - `true` for `renderToStaticMarkup()`-style rendering
 * @returns {string} - HTML output
 */
function treeToHtml(tree, makeStaticMarkup) {
	const renderer = new HtmlRenderer(makeStaticMarkup);
	renderer.render(tree);
	return renderer.out;
}

module.exports = treeToHtml;
