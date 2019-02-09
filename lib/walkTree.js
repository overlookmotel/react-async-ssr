/* --------------------
 * react-async-ssr module
 * Function to walk tree and call function on each node
 * ------------------*/

'use strict';

// Exports

/**
 * Walk tree and call `fn()` on each node.
 * Stop walking branch if `fn()` returns `false`.
 * @param {Object} node - Boundary tree node
 * @param {Function} fn - Function to call on each node
 * @returns {undefined}
 */
function walkTree(node, fn) {
	const continueWalking = fn(node);
	if (!continueWalking) return;

	for (let child of node.children) {
		walkTree(child, fn);
	}
}

module.exports = walkTree;
