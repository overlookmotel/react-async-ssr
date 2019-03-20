/* --------------------
 * react-async-ssr module
 * Handle interrupts
 * ------------------*/

'use strict';

// Modules
const {toArray} = require('react').Children;

// Imports
const {TYPE_SUSPENSE, TYPE_PROMISE, NO_SSR} = require('./constants'),
	{followAndAbort} = require('./abort'),
	walkTree = require('./walkTree'),
	{last} = require('./utils');

// Exports

/*
 * Handle interrupts
 */
module.exports = {
	handleInterrupt() {
		const {interrupt} = this;
		this.interrupt = null;

		const {type} = interrupt;
		if (type === TYPE_SUSPENSE) {
			this.handleSuspense(interrupt.element);
		} else {
			this.handlePromise(interrupt.element, interrupt.promise);
		}
	},

	handleSuspense(element) {
		// If fallback is undefined, it's not treated as a suspense boundary
		const {fallback} = element.props;
		if (fallback === undefined) return;

		// Add boundary node to tree and step into it
		const frame = last(this.stack);
		const node = this.createNodeWithStackState(TYPE_SUSPENSE, frame);
		node.fallback = fallback;
		node.suspended = false;
		const parentSuspense = this.suspenseNode;
		node.suspendedAbove = parentSuspense ?
			parentSuspense.suspended || parentSuspense.suspendedAbove :
			false;
		node.containsLazy = false;
		this.suspenseNode = node;

		this.node = node;

		// Record frame on node.
		// It is used in `.stackPop()` method below to identify when this
		// suspense boundary is exited.
		node.frame = frame;
	},

	handlePromise(element, promise) {
		// If no enclosing suspense boundary, abort promise and exit with error
		const {suspenseNode} = this;
		if (!suspenseNode) {
			followAndAbort(promise);
			throw new Error(
				'A React component suspended while rendering, but no fallback UI was specified.\n\n' +
				'Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.'
			);
		}

		// Pop frame from stack
		const {stack} = this;
		const frame = this.stackPopOriginal.call(stack);

		// Flag suspense as containing lazy
		if (!suspenseNode.containsLazy) suspenseNode.containsLazy = true;

		// If above suspense boundary suspended, suspend this too
		if (suspenseNode.suspendedAbove && !suspenseNode.suspended) suspenseNode.suspended = true;

		// If not rendering because inside suspense boundary which is suspended,
		// abort promise and ignore
		// TODO Check this works if promise resolves sync.
		// I think it won't because on client side it will render immediately
		// and that could include more lazy elements.
		// Update 17/3/19: It does work on React 16.8.4 - does not render immediately on client.
		// TODO Write a test to check behavior does not change in future React version.
		if (suspenseNode.suspended) {
			followAndAbort(promise);
			return;
		}

		// Handle no SSR promise
		if (promise[NO_SSR]) return this.handleNoSsrPromise(promise);

		// Follow promise
		let node;
		promise.then(
			() => {
				// Handle synchronous callback
				if (!node) {
					node = {resolved: true};
					return;
				}

				this.resolved(node);
			},
			err => {
				// Handle synchronous callback - throw error
				if (!node) {
					node = {resolved: true};
					throw err;
				}

				this.rejected(node, err);
			}
		);

		// If Promise resolved synchronously, push element back onto stack so it renders again
		if (node) {
			// Create tree node and step into it
			node = this.createNode(TYPE_PROMISE);
			node.resolved = true;

			node.frame = frame;
			this.node = node;

			// Push element onto stack
			frame.children = toArray(element);
			stack.push(frame);

			return;
		}

		// Awaiting promise - create tree node
		node = this.createNodeWithStackState(TYPE_PROMISE, frame);
		node.element = element;
		node.promise = promise;
		node.resolved = false;

		this.numAwaiting++;
	},

	resolved(node) {
		// If node is no longer going to be rendered because boundary
		// fallback above has already triggered, ignore result.
		if (node.resolved) return;

		// Promise is no longer awaited
		node.resolved = true;
		this.numAwaiting--;

		// Re-render element
		this.rerender(node, node.element);
	},

	rejected(node, err) {
		// If node is no longer going to be rendered because boundary
		// fallback above has already triggered, swallow error.
		if (node.resolved) return;

		// Promise is no longer awaited
		node.resolved = true;
		node.stackState = null;
		this.numAwaiting--;

		// Abort with error
		this.errored(err);
	},

	handleNoSsrPromise(promise) {
		// Abort this promise
		followAndAbort(promise);

		// Suspend suspense and add to fallbacks queue if it is outside of current render cycle
		const {suspenseNode} = this;
		suspenseNode.suspended = true;
		if (!suspenseNode.frame) this.fallbacksQueue.push(suspenseNode);

		// Abort all promises within Suspense and trigger fallbacks of nested Suspenses
		for (let child of suspenseNode.children) {
			this.suspendDescendents(child);
		}
	},

	/*
	 * A Suspense boundary above this node has been suspended.
	 * Traverse tree and abort all promises.
	 * Suspend any suspense boundaries nested within this tree which contain lazy nodes.
	 * Suspense boundaries within lazy nodes are skipped, since these lazy nodes will no
	 * longer be loaded, and therefore the suspense boundaries within them will not
	 * be rendered.
	 * Add suspense nodes requiring fallback to be rendered to the fallbacks queue.
	 */
	suspendDescendents(node) {
		walkTree(node, (node, inLazy) => {
			const {type} = node;
			if (type === TYPE_SUSPENSE) {
				if (node.suspended) return walkTree.STOP;

				if (!inLazy) {
					if (node.containsLazy) {
						node.suspended = true;
						this.fallbacksQueue.push(node);
					} else {
						node.suspendedAbove = true;
					}
				}
			} else if (type === TYPE_PROMISE) {
				if (!node.resolved) this.abort(node);
				inLazy = true;
			}

			return inLazy;
		}, false);
	}
};
