/* --------------------
 * react-async-ssr module
 * Async render function
 * ------------------*/

'use strict';

// Imports
const PartialRenderer = require('./renderer'),
	{TYPE_SUSPENSE, NO_SSR} = require('./constants'),
	treeToHtml = require('./treeToHtml'),
	{abortDescendents} = require('./abort'),
	{promiseTry} = require('./utils');

// Exports

/**
 * AsyncRenderer class
 * A class is used basically to avoid need to keep passing `makeStaticMarkup` around.
 */
class AsyncRenderer {
	constructor(makeStaticMarkup) {
		this.makeStaticMarkup = makeStaticMarkup;
		this.tree = null;
	}

	/**
	 * Async render method.
	 * Render element and return a promise which resolves when all lazy components
	 * have been resolved. The promise resolves to rendered HTML.
	 * Promise rejects if an error is thrown during render or a lazy component's
	 * promise rejects.
	 * @param {Object} element - React element to render
	 * @returns {Promise<string>} - Promise of rendered HTML
	 */
	render(element) {
		return promiseTry(() => {
			const {tree, lazyNodes} = this.renderTree(element, null);
			this.tree = tree;

			// Resolve all lazy nodes and return HTML
			return this.resolveLazyNodes(lazyNodes)
				.then(() => treeToHtml(tree, this.makeStaticMarkup));
		});
	}

	/**
	 * Render element to a boundary tree.
	 * Also returns array of all lazy nodes in tree.
	 * @param {Object} element - React element to render
	 * @param {Object} [stackState] - Stack state from parent render
	 * @returns {Object} - Result object
	 * @returns {Object} .tree - Boundary tree
	 * @returns {Array} .lazyNodes - Array of lazy nodes
	 */
	renderTree(element, stackState) {
		// Render element to HTML
		const renderer = new PartialRenderer(element, this.makeStaticMarkup, stackState);
		return renderer.readTree();
	}

	/**
	 * Resolve all lazy nodes.
	 * For each lazy node: await the promise, re-render the element, and add
	 * result into the boundary tree.
	 * @param {Array} lazyNodes - Array of lazy nodes
	 * @returns {Promise<*>} - Resolves when all rendered (resolution value is useless)
	 * @throws {Promise} - If a node is flagged no SSR and no suspense boundary above it
	 */
	resolveLazyNodes(lazyNodes) {
		return Promise.all(
			lazyNodes.map(node => this.resolveLazy(node))
		);
	}

	/**
	 * Resolve a lazy node.
	 * Awaits the node's promise, then re-renders the element, and adds result
	 * as child of the node.
	 * If node is flagged as not for render on server side, triggers the closest
	 * suspense boundary's fallback.
	 * @param {Object} node - Lazy node
	 * @returns {Promise<*>} - Resolves when rendered (resolution value is useless)
	 * @throws {Promise} - If node flagged no SSR and no suspense boundary above it
	 */
	resolveLazy(node) {
		// If terminally lazy promise, find parent suspense
		const {promise} = node;
		if (promise[NO_SSR]) return this.resolveFailedLazy(node);

		// Resolve promise, then render element again
		return promise.then(
			() => {
				// If node is no longer going to be rendered because boundary
				// fallback above has already triggered, exit
				if (node.aborted) return;
				node.resolved = true;
				return this.renderChild(node);
			},
			err => {
				// Swallow errors where node is not going to be rendered
				if (node.aborted) return;
				node.resolved = true;
				throw err;
			}
		);
	}

	/**
	 * Triggers the fallback of closest suspense boundary, renders the fallback,
	 * and inserts fallback as child of the suspense node.
	 * All other rendering within the suspense boundary is abandoned.
	 * @param {Object} node - Lazy node which does not render server side
	 * @returns {Promise<*>} - Resolves when rendered (resolution value is useless)
	 * @throws {Promise} - If no suspense boundary above this node
	 */
	resolveFailedLazy(node) {
		// Find closest suspense boundary further up tree
		const boundary = findParentSuspense(node);

		// Abort rendering on all boundary's descendents
		abortDescendents(boundary || this.tree);

		// If no boundary found, throw promise
		if (!boundary) throw node.promise;

		// Empty contents of boundary
		boundary.children = [];

		// Convert boundary node to plain node, so a thrown promise in fallback
		// does not propagate up to this boundary again - it will instead
		// propagate up to next boundary above this
		boundary.type = null;
		boundary.element = boundary.fallback;
		boundary.fallback = null;

		// Render fallback and add to tree
		return this.renderChild(boundary);
	}

	/**
	 * Render a node's element, and insert result into tree as child of this node.
	 * @param {Object} node - Node to render
	 * @returns {Promise} - Resolves when rendered (resolution value is useless)
	 * @throws {Promise} - If a child node is flagged no SSR and no suspense boundary above it
	 */
	renderChild(node) {
		const {tree: child, lazyNodes} = this.renderTree(node.element, node.stackState);
		node.children[0] = child;
		child.parent = node;
		return this.resolveLazyNodes(lazyNodes);
	}
}

/**
 * Find closest suspense boundary in tree above this node.
 * @param {Object} node - Starting node
 * @returns {Object|undefined} - Boundary node, or undefined if none found
 */
function findParentSuspense(node) {
	// eslint-disable-next-line no-cond-assign
	while (node = node.parent) {
		if (node.type === TYPE_SUSPENSE) return node;
	}
}

/**
 * Exported async render function.
 * @param {Object} element - React element to render
 * @param {boolean} makeStaticMarkup - `true` for a `renderToStaticMarkup()`-style render
 * @return {Promise} - Resolves to HTML result of render
 */
module.exports = function render(element, makeStaticMarkup) {
	const renderer = new AsyncRenderer(makeStaticMarkup);
	return renderer.render(element);
};
