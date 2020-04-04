/* --------------------
 * react-async-ssr module
 * Handle interrupts
 * ------------------*/

'use strict';

// Modules
const {toArray} = require('react').Children;
const {last} = require('lodash');

// Imports
const {TYPE_SUSPENSE, TYPE_PROMISE} = require('./constants'),
	{NO_SSR} = require('./symbols'),
	{followAndAbort} = require('./abort'),
	walkTree = require('./walkTree');

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
		node.suspendedAbove = parentSuspense
			? parentSuspense.suspended || parentSuspense.suspendedAbove
			: false;
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
				'A React component suspended while rendering, but no fallback UI was specified.\n\n'
				+ 'Add a <Suspense fallback=...> component higher in the tree to provide a loading indicator or placeholder to display.'
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
			// Abort promise
			followAndAbort(promise);

			// Create tree node
			if (!this.fallbackFast) {
				const node = this.createNode(TYPE_PROMISE);
				node.resolved = true;
				node.promise = promise;
			}

			return;
		}

		// Handle no SSR promise
		if (promise[NO_SSR]) {
			this.handleNoSsrPromise(promise);
			return;
		}

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
			(err) => {
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
			node.promise = promise;

			node.frame = frame;
			this.node = node;

			// Push element onto stack
			frame.children = toArray(element);
			stack.push(frame);

			return;
		}

		// Awaiting promise - create tree node
		node = this.createNodeWithStackState(TYPE_PROMISE, frame);
		node.resolved = false;
		node.promise = promise;
		node.element = element;

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
		// Abort promise
		followAndAbort(promise);

		// Create tree node
		if (!this.fallbackFast) {
			const node = this.createNode(TYPE_PROMISE);
			node.resolved = true;
			node.promise = promise;
		}

		// Suspend suspense
		const {suspenseNode} = this;
		suspenseNode.suspended = true;

		const suspenseFrame = suspenseNode.frame;
		if (!suspenseFrame) {
			// Outside current render cycle - Add to fallbacks queue
			this.fallbacksQueue.push(suspenseNode);
		} else if (this.fallbackFast) {
			// Suspense is in current render cycle and `fallbackFast` option set.
			// Skip all further rendering within current Suspense boundary.
			// Stack will unwind down to Suspense and fallback will be rendered.
			const {stack} = this;
			let stackIndex = stack.length - 1;
			while (true) { // eslint-disable-line no-constant-condition
				const frame = stack[stackIndex];
				frame.childIndex = frame.children.length;
				if (frame === suspenseFrame) break;
				stackIndex--;
			}
		}

		// Abort all promises within Suspense and trigger fallbacks of nested Suspenses
		for (const child of suspenseNode.children) {
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
		walkTree(node, (node, inLazy) => { // eslint-disable-line no-shadow
			const {type} = node;
			if (type === TYPE_SUSPENSE) {
				if (node.suspended) return walkTree.STOP;

				// NB If `fallbackFast` option set, do not suspend nested Suspenses
				if (!inLazy && !this.fallbackFast) {
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
