/* --------------------
 * react-async-ssr module
 * Abort descendents function
 * ------------------*/

'use strict';

// Imports
const {TYPE_PROMISE} = require('./constants');

// Exports

/**
 * Abort promise.
 * @param {Promise} promise - Promise to abort
 * @returns {undefined}
 */
function abort(promise) {
	promise.then(() => {}, () => {});
	if (typeof promise.abort === 'function') promise.abort();
}

/**
 * Abort all descendents (children, children's children etc) of a node inactive.
 * They will then abandon rendering and any errors thrown will be silently
 * swallowed.
 * If promise on lazy component has `.abort()` method, it is called.
 * If `lazyNodes` array provided, node is removed from it.
 *
 * @param {Object} node - Starting node
 * @param {Array} [lazyNodes] - Array of lazy nodes
 * @returns {undefined}
 */
function abortDescendents(node, lazyNodes) {
	for (let child of node.children) {
		// Abort if promise not resolved already
		if (child.type === TYPE_PROMISE && !child.resolved && !child.aborted) {
			abort(child.promise);
			child.aborted = true;

			// Remove from lazy nodes array
			if (lazyNodes) {
				const index = lazyNodes.indexOf(child);
				lazyNodes.splice(index, 1);
			}
		}

		if (child.children) abortDescendents(child);
	}
}

module.exports = {
	abort,
	abortDescendents
};
