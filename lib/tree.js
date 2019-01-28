/* --------------------
 * react-async-ssr module
 * Boundary tree manipulation functions
 * ------------------*/

'use strict';

// Imports
const {TYPE_PROMISE, PLACEHOLDER} = require('./constants');

// Exports
module.exports = {
	treeAddHtml,
	treeToHtml
};

/**
 * Take boundary tree + HTML returned from renderer and add HTML onto tree nodes.
 * Identifies all lazy nodes and records them as `tree.lazyNodes`.
 * @param {Object} tree - Boundary tree
 * @param {string} html - HTML returned from renderer
 * @returns {undefined}
 */
function treeAddHtml(tree, html) {
	// Split into parts
	const parts = html.split(PLACEHOLDER);

	// Add text to tree nodes as header + footer
	// and identify lazy nodes
	let node = tree;
	let depth = 0;
	const childNumStack = [0];
	let childNum = 0;

	for (let part of parts) {
		const child = node.children[childNum];

		if (!child) {
			// Completed boundary.
			// Record text after all children.
			node.footer = part;

			// Move back up tree
			node = node.parent;
			childNumStack.pop();
			depth--;
			childNum = ++childNumStack[depth];
			continue;
		}

		// Record text preceding child
		child.header = part;

		if (child.type === TYPE_PROMISE) {
			// Move on to next child
			childNum = ++childNumStack[depth];
			continue;
		}

		// Entering boundary - Move down tree into child
		node = child;
		childNum = 0;
		childNumStack.push(0);
		depth++;
	}
}

/*
 * HtmlRenderer class
 * Used by `treeToHtml()` function below.
 * Renders tree to HTML, inserting '<!-- -->' between text nodes
 */
class HtmlRenderer {
	constructor(makeStaticMarkup) {
		this.makeStaticMarkup = makeStaticMarkup;
		this.lastText = false;
		this.html = '';
	}

	render(node) {
		this.append(node.header);
		for (let child of node.children) {
			this.render(child);
		}
		this.append(node.footer);
	}

	append(html) {
		if (html == null || html === '') return;

		if (this.lastText && html.slice(0, 1) !== '<') this.html += '<!-- -->';
		this.html += html;
		if (!this.makeStaticMarkup) this.lastText = html.slice(-1) !== '>';
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
	return renderer.html;
}
