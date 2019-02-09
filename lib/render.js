/* --------------------
 * react-async-ssr module
 * Async render function
 * ------------------*/

'use strict';

// Modules
const async = require('async');

// Imports
const PartialRenderer = require('./renderer'),
	{TYPE_SUSPENSE, TYPE_PROMISE, TYPE_TEXT, NO_SSR} = require('./constants'),
	treeToHtml = require('./treeToHtml'),
	walkTree = require('./walkTree'),
	{packError, unpackError} = require('./error');

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
	 * @callback outputCallback
	 * @param {*} [err] - Error encountered in function
	 * @param {string} [out] - HTML output
	 */

	/**
	 * Async render method.
	 * Render element and call callback with rendered HTML output when all
	 * lazy components resolved.
	 * @param {Object} element - React element to render
	 * @param {outputCallback} cb - Callback - called with args `(err, out)`
	 * @returns {undefined}
	 */
	render(element, cb) {
		this.renderTree(element, null, (err, tree, lazyNodes) => {
			if (err) return cb(err);

			this.tree = tree;

			// Resolve all lazy nodes and return HTML
			this.resolveLazyNodes(lazyNodes, err => {
				if (err) return cb(err);

				const out = treeToHtml(tree, this.makeStaticMarkup);
				cb(null, out);
			});
		});
	}

	/**
	* @callback treeCallback
	* @param {*} [err] - Error encountered in function
	* @param {Object} [tree] - Boundary tree object
	* @param {Array} [lazyNodes] - Array of lazy nodes
	*/

	/**
	 * Render element to a boundary tree.
	 * Callback with tree and array of all lazy nodes in tree.
	 * Callback is called synchronously.
	 * @param {Object} element - React element to render
	 * @param {Object} [stackState] - Stack state from parent render
	 * @param {treeCallback} cb - Callback - called with args `(err, tree, lazyNodes)`
	 * @returns {undefined}
	 */
	renderTree(element, stackState, cb) {
		// Render element to HTML
		const renderer = new PartialRenderer(element, this.makeStaticMarkup, stackState);

		let res;
		try {
			res = renderer.readTree();
		} catch (err) {
			return cb(packError(err));
		}

		cb(null, res.tree, res.lazyNodes);
	}

	/**
	 * @callback errorOnlyCallback
	 * @param {*} [err] - Error encountered in function
	 */

	/**
	 * Resolve all lazy nodes.
	 * For each lazy node: await the promise, re-render the element, and add
	 * result into the boundary tree.
	 * @param {Array} lazyNodes - Array of lazy nodes
	 * @param {errorOnlyCallback} cb - Callback - called with args `(err)`
	 * @returns {undefined}
	 */
	resolveLazyNodes(lazyNodes, cb) {
		async.map(lazyNodes, (node, cb) => {
			node.callback = cb;
			return this.resolveLazy(node);
		}, cb);
	}

	/**
	 * Resolve a lazy node.
	 * Await the node's promise, then re-render the element, and add result
	 * as child of the node.
	 * If node is flagged as not for render on server side, trigger the closest
	 * suspense boundary's fallback.
	 * @param {Object} node - Lazy node
	 * @returns {undefined}
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
				const {callback} = node;
				if (!callback) return;
				node.callback = null;
				this.renderChild(node, callback);
			},
			err => {
				// Swallow errors where node is not going to be rendered
				const {callback} = node;
				if (!callback) return;
				node.callback = null;
				callback(err);
			}
		);
	}

	/**
	 * Trigger the fallback of closest suspense boundary, render the fallback,
	 * and insert fallback as child of the suspense node.
	 * Abandon all other rendering within the suspense boundary.
	 * @param {Object} node - Lazy node which does not render server side
	 * @returns {undefined}
	 */
	resolveFailedLazy(node) {
		// Remove callback so it doesn't get aborted again
		const {callback} = node;
		node.callback = null;

		// Find closest suspense boundary further up tree
		const boundary = findParentSuspense(node);

		// Abort rendering on all boundary's descendents
		abortDescendents(boundary || this.tree);

		// If no boundary found, call callback with promise as error
		if (!boundary) return callback(node.promise);

		// Empty contents of boundary
		boundary.children = [];

		// Convert boundary node to plain node, so a thrown promise in fallback
		// does not propagate up to this boundary again - it will instead
		// propagate up to next boundary above this
		boundary.type = null;
		boundary.element = boundary.fallback;
		boundary.fallback = null;

		// Render fallback and add to tree
		this.renderChild(boundary, callback);
	}

	/**
	 * Render a node's element, and insert result into tree as child of this node.
	 * @param {Object} node - Node to render
	 * @param {errorOnlyCallback} cb - Callback - called with args `(err)`
	 * @returns {undefined}
	 */
	renderChild(node, cb) {
		this.renderTree(node.element, node.stackState, (err, child, lazyNodes) => {
			if (err) return cb(err);

			node.children[0] = child;
			child.parent = node;

			this.resolveLazyNodes(lazyNodes, cb);
		});
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
	return new Promise((resolve, reject) => {
		renderer.render(element, (err, out) => {
			if (err) return reject(unpackError(err));
			resolve(out);
		});
	});
};

/**
 * Abort all descendents (children, children's children etc) of a node.
 * They will then abandon rendering and any rejection errors will be silently ignored.
 * If promise on lazy component has `.abort()` method, it is called.
 * @param {Object} tree - Starting node
 * @returns {undefined}
 */
function abortDescendents(tree) {
	walkTree(tree, node => {
		const {type} = node;
		if (type === TYPE_TEXT) return false;
		if (type !== TYPE_PROMISE) return true;

		// Exit if already resolved/aborted
		const {callback} = node;
		if (!callback) return true;

		const {promise} = node;
		if (typeof promise.abort === 'function') promise.abort();

		// Call callback so promise is not awaited
		node.callback = null;
		callback();

		return true;
	});
}
