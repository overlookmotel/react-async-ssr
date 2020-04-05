/* --------------------
 * react-async-ssr module
 * Render tree to HTML
 * ------------------*/

'use strict';

// Imports
const {TYPE_TEXT, TYPE_PROMISE, TYPE_FALLBACK} = require('./constants.js'),
	{ON_MOUNT} = require('./symbols.js');

// Exports

class Walker {
	constructor(tree, makeStaticMarkup, fallbackFast) {
		this.tree = tree;
		this.makeStaticMarkup = makeStaticMarkup;
		this.fallbackFast = fallbackFast;
		this.out = '';
		this.lastText = false;
	}

	walk() {
		this.process(this.tree, false);
		return this.out;
	}

	process(node, suspended) {
		const {type} = node;
		if (type === TYPE_TEXT) {
			// Flush output.
			// If is within suspended Suspense boundary, do not output as will not render.
			if (!suspended) {
				const {out} = node;
				if (this.lastText && out.slice(0, 1) !== '<') this.out += '<!-- -->';
				this.out += out;
				if (!this.makeStaticMarkup) this.lastText = out.slice(-1) !== '>';
			}

			return;
		}

		if (type === TYPE_PROMISE) {
			const {promise} = node;
			// Call `[ON_MOUNT]()` on promise with `true` if being rendered,
			// or `false` if not (inside suspensed Suspense boundary)
			if (typeof promise[ON_MOUNT] === 'function') promise[ON_MOUNT](!suspended);

			// If inside suspended boundary, exit - promise is not resolved,
			// so children will not render
			if (suspended) return;
		} else if (type === TYPE_FALLBACK && !this.fallbackFast) {
			// Is a suspended suspense node.
			// Iterate over suspended children to call `[ON_MOUNT]()` callbacks on promises.
			for (const child of node.suspendedChildren) {
				this.process(child, true);
			}
		}

		for (const child of node.children) {
			this.process(child, suspended);
		}
	}
}

/**
 * Render node tree to HTML.
 * `[ON_MOUNT]()` is called on all promises that have this method.
 * All promise nodes must be resolved before calling this.
 * @param {Object} tree - Node tree
 * @param {boolean} makeStaticMarkup - `true` for `renderToStaticMarkup()`-style rendering
 * @param {boolean} fallbackFast - `fallbackFast` option
 * @returns {string} - HTML output
 */
function treeToHtml(tree, makeStaticMarkup, fallbackFast) {
	const walker = new Walker(tree, makeStaticMarkup, fallbackFast);
	return walker.walk();
}

module.exports = treeToHtml;
