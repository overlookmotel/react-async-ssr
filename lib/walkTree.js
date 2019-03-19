/* --------------------
 * react-async-ssr module
 * Function to walk tree and call function on each node
 * ------------------*/

'use strict';

// Constants
const STOP = {};

// Exports

/**
 * Walk tree and call `fn()` on each node.
 * `fn()` can return state which is passed to its child nodes.
 * Stop walking branch if `fn()` returns `walkTree.STOP`.
 * @param {Object} node - Boundary tree node
 * @param {Function} fn - Function to call on each node
 * @param {*} [state] - Optional state to pass to `fn()`
 * @returns {undefined}
 */
function walkTree(node, fn, state) {
	state = fn(node, state);
	if (state === STOP) return;

	const {children} = node;
	if (!children) return;

	for (let child of children) {
		walkTree(child, fn, state);
	}
}

walkTree.STOP = STOP;

module.exports = walkTree;
