/* --------------------
 * react-async-ssr module
 * Renderer class
 * ------------------*/

'use strict';

// Modules
const {toArray} = require('react').Children;

// Imports
const {TYPE_SUSPENSE, TYPE_PROMISE, TYPE_FALLBACK, TYPE_TEXT} = require('./constants'),
	{ReactDOMServerRenderer, isDev} = require('./rendererSuper'),
	shimMethods = require('./shim'),
	handleMethods = require('./handle'),
	nodeMethods = require('./nodes'),
	{abort} = require('./abort'),
	treeToHtml = require('./treeToHtml'),
	walkTree = require('./walkTree'),
	{isRenderableElement, last} = require('./utils');

// Exports
class Renderer extends ReactDOMServerRenderer {
	/**
	 * @constructor
	 * @param {*} children - React element(s)
	 * @param {boolean} makeStaticMarkup - `true` for equivalent of `renderToStaticMarkup()`
	 * @param {boolean} fallbackFast - `true` to bail out of Suspense nodes as soon as suspended
	 */
	constructor(children, makeStaticMarkup, fallbackFast) {
		super(children, makeStaticMarkup);

		// Record options
		this.fallbackFast = fallbackFast;

		// Init boundary tree
		const tree = {
			type: null,
			parent: null,
			children: [],
			frame: null
		};
		this.tree = tree;
		this.node = tree;
		this.suspenseNode = null;

		// Init lazy node awaiting counter
		this.numAwaiting = 0;
		this.fallbacksQueue = [];

		// Init interrupt signal
		this.interrupt = null;

		// Init read callback
		this.callback = null;

		// Shim `stack.pop()` method to catch when boundary completes processing
		this.stackPopOriginal = this.stack.pop;
		this.stack.pop = () => this.stackPop();

		// Init var to track position relative to DOM root
		// TODO Remove this once PR to do same lands in React
		// https://github.com/facebook/react/pull/15023
		this.domRootIndex = 0;

		// Set footer on root stack frame to prevent thread being freed at end of render
		this.stack[0].footer = '_';
	}

	/**
	 * Read async.
	 * Async equivalent of ReactDOM's `.read()`.
	 * @param {Function} cb - Callback to call with HTML output
	 * @returns {undefined}
	 */
	readAsync(cb) {
		this.callback = cb;

		// Render
		this.cycle();

		// If done or errored, exit
		if (this.exhausted) return;

		// Process fallbacks requiring render
		this.drainFallbacksQueue();
	}

	/**
	 * Enter sync render cycle.
	 * Renders using ReactDOM's `.read()` method.
	 *
	 * If promises are pending at end of cycle, exit - a new cycle will begin
	 * when promises resolve.
	 * If no promises pending, call callback with rendered HTML output.
	 * If error thrown during render, call callback with error.
	 *
	 * Stack must be have only 1 frame when calling this method.
	 *
	 * @returns {undefined}
	 */
	cycle() {
		try {
			// Call React's `.read()` method to read 1 byte.
			// Read only 1 so thread is not destroyed at end of cycle.
			// (bottom stack frame outputs 1 char which stops rendering before stack unwinds completely)
			this.read(1);
		} catch (err) {
			this.errored(err);
			return;
		}

		if (this.numAwaiting === 0 && this.fallbacksQueue.length === 0) this.done();
	}

	/*
	 * If a promise marked no SSR is thrown during render, a Suspense boundary's
	 * fallback needs to be triggered.
	 * If the Suspense boundary is being rendered in current render cycle,
	 * fallback will be rendered synchronously during cycle.
	 * But if the Suspense boundary was introduced in a previous cycle, it is
	 * added to the fallbacks queue.
	 * This method renders the next fallback in the queue in its correct
	 * position in the node tree.
	 * When queue is fully drained, and if no pending promises remain, render is
	 * complete and callback is called.
	 */
	drainFallbacksQueue() {
		// Process fallbacks queue - convert nodes to fallbacks.
		// Find first fallback that requires rendering, and render it.
		const {fallbacksQueue} = this;
		let suspenseNode, fallback;
		while (true) { // eslint-disable-line no-constant-condition
			if (fallbacksQueue.length === 0) {
				if (this.numAwaiting === 0) this.done();
				return;
			}

			// Convert node to fallback and discard children
			suspenseNode = fallbacksQueue.pop();
			fallback = suspenseNode.fallback;
			convertNodeToFallback(suspenseNode);

			// Stop when found a fallback that requires rendering
			if (isRenderableElement(fallback)) break;

			suspenseNode.stackState = null;
		}

		// Render fallback
		this.rerender(suspenseNode, fallback);
	}

	/**
	 * Render element in tree.
	 * Stack state of node is restored, and element is rendered.
	 * @param {Object} node - Tree node to render in
	 * @param {Object} element - React element to render
	 * @returns {undefined}
	 */
	rerender(node, element) {
		// Reinstate stack state with element on stack ready to render
		// NB Stack should always be length 0 at this point
		const {stackState} = node;
		node.stackState = null;

		const frame = {
			type: null,
			domNamespace: stackState.domNamespace,
			children: toArray(element),
			childIndex: 0,
			context: stackState.context, // Legacy Context API
			footer: '_' // Prevent thread being freed at end of render
		};
		if (isDev) frame.debugElementStack = [];

		this.stack[0] = frame;

		// Restore contexts from new Context API
		for (const ctx of stackState.contexts) {
			this.pushProvider(
				isDev ? ctx.provider : {type: {_context: ctx.context}, props: {value: ctx.value}}
			);
		}

		// Restore `currentSelectValue` + `domRootIndex`
		this.currentSelectValue = stackState.currentSelectValue;
		this.domRootIndex = stackState.domRootAbove ? 1 : 0;
		this.previousWasTextNode = false;

		// Step into node
		this.node = node;
		this.suspenseNode = node.parentSuspense;

		// Render element
		this.cycle();

		// If errored, exit
		if (this.exhausted) return;

		// Clear contexts added in `.restoreStack()`
		// NB ReactDOM's native `.clearProviders()` method resets the content of all
		// Providers, but does not reset `.contextIndex`.
		this.clearProviders();
		this.contextIndex = -1;

		// Process fallbacks requiring render
		this.drainFallbacksQueue();
	}

	/*
	 * Rendering complete.
	 * Call callback with HTML output.
	 */
	done() {
		// Finished processing
		this.destroy();

		// Convert tree to HTML and callback with result
		// NB Do not leak `this` to callback
		const out = treeToHtml(this.tree, this.makeStaticMarkup, this.fallbackFast);
		const {callback} = this;
		callback(null, out);
	}

	/**
	 * Render has failed. Call callback with error.
	 * Clean up prior to exit involves aborting all pending promises.
	 * Either an error has occured synchronously during a render cycle, or
	 * a promise which was previously thrown was rejected.
	 * @param {*} err - Error from render/rejected promise
	 * @returns {undefined}
	 */
	errored(err) {
		// Abort all promises
		walkTree(this.tree, (node) => { // eslint-disable-line consistent-return
			const {type} = node;
			if (type === TYPE_SUSPENSE) {
				if (node.suspended) return walkTree.STOP;
			} else if (type === TYPE_PROMISE && !node.resolved) {
				this.abort(node);
			}
		});

		// Clear fallbacks queue
		this.fallbacksQueue.length = 0;

		// Destroy + callback with error
		// NB Do not leak `this` to callback
		this.destroy();
		const {callback} = this;
		callback(err);
	}

	/*
	 * Abort a promise node.
	 * Mark node as resolved and call promise's `[ABORT]()` method.
	 */
	abort(node) {
		node.resolved = true;
		node.stackState = null;
		abort(node.promise);
		this.numAwaiting--;
	}

	/*
	 * Extension of superclass's `.render()` method.
	 * Allows capturing Suspense elements and Promises thrown while rendering
	 * elements ("interrupts").
	 */
	render(element, context, parentNamespace) {
		// Shim element to capture thrown errors + suspense elements
		element = this.shimElement(element);

		// Call original render method
		const out = super.render(element, context, parentNamespace);

		// Handle interrupts (i.e. Suspense element or thrown Promise)
		if (this.interrupt !== null) {
			this.handleInterrupt();
		} else {
			// No interrupts - add output to tree
			this.output(out);
		}

		return '';
	}

	/*
	 * Extension of superclass's `.renderDOM()` method.
	 *
	 * Hide `footer` from ReactDOM to prevent output which would halt render
	 * cycle (due to `.read()` being called with length of 1 bytes).
	 * Footer is instead stored in `._footer` which is added to output when
	 * frame is popped in `.stackPop()` method below.
	 *
	 * Also fix `data-reactroot=""` markup to workaround bug in ReactDOM.
	 * https://github.com/facebook/react/issues/15012
	 */
	renderDOM(element, context, parentNamespace) {
		// Render
		let out = super.renderDOM(element, context, parentNamespace);

		// Set `domRootIndex` if this is root DOM element
		// TODO Remove this once PR to do same lands in React
		// https://github.com/facebook/react/pull/15023
		if (this.domRootIndex === 0) this.domRootIndex = this.stack.length;

		// Fix markup where root node incorrectly identified
		// TODO Remove this once PR to add `.domRootIndex` lands in React
		// https://github.com/facebook/react/pull/15023
		if (!this.makeStaticMarkup) out = this.fixMarkup(out);

		// Move footer into _footer
		const frame = last(this.stack);
		frame._footer = frame.footer;
		frame.footer = '';

		return out;
	}

	fixMarkup(out) {
		// Remove `data-reactroot=""` if nested render, or add if inside boundary.
		// NB `super.renderDOM()` has added a frame to the stack.
		const isDomRoot = this.domRootIndex === this.stack.length;
		if (this.stack.length === 2) {
			if (!isDomRoot) {
				// Remove tag
				out = out.replace(
					/^(<.+?) data-reactroot=""(\/?>)/,
					(whole, start, end) => `${start}${end}`
				);
			}
		} else if (isDomRoot) {
			// Add tag
			out = out.replace(
				/^(<.+?)(\/?>)/,
				(whole, start, end) => `${start} data-reactroot=""${end}`
			);
		}

		return out;
	}

	/*
	 * Shim of `this.stack.pop()`. Shim is applied in class constructor.
	 * Used to detect when existing a Suspense or Promise node in the tree.
	 * If exiting a Suspense node which has been suspended, fallback is
	 * rendered.
	 */
	stackPop() {
		// Reset `domRootIndex` if DOM root element is being popped from stack
		// TODO Remove this once PR to do same lands in React
		// https://github.com/facebook/react/pull/15023
		if (this.stack.length === this.domRootIndex) this.domRootIndex = 0;

		// Call original `.pop()` method
		const frame = this.stackPopOriginal.call(this.stack);

		// If node completed processing, traverse back up tree
		const {node} = this;
		if (frame === node.frame) {
			node.frame = null;
			this.node = node.parent;
			this.previousWasTextNode = false;
			if (node === this.suspenseNode) this.popSuspense(node, frame);
		} else if (frame._footer !== undefined) {
			this.output(frame._footer);
		}

		return frame;
	}

	popSuspense(node, frame) {
		const {fallback} = node;

		// Step down suspense stack
		this.suspenseNode = node.parentSuspense;

		// TODO Clear stack state of Suspense nodes when definitively resolved

		if (!node.suspended) return;

		// Was suspended
		// Convert node to fallback
		convertNodeToFallback(node);
		node.stackState = null;

		if (!isRenderableElement(fallback)) return;

		// Render fallback
		frame.children = toArray(fallback);
		frame.childIndex = 0;

		this.stack.push(frame);

		this.node = node;
		node.frame = frame;
	}

	/**
	 * Add output to tree.
	 * @param {string} out - HTML output
	 * @returns {undefined}
	 */
	output(out) {
		if (out === '') return;

		const {children} = this.node;
		const lastChild = children.length === 0 ? null : last(children);
		if (lastChild && lastChild.type === TYPE_TEXT) {
			// Existing text node - append to it
			lastChild.out += out;
		} else {
			// Create new text node
			children.push({type: TYPE_TEXT, out});
		}
	}
}

function convertNodeToFallback(node) {
	node.type = TYPE_FALLBACK;
	node.fallback = null;
	node.suspendedChildren = node.children;
	node.children = [];
}

// Add shim, handle and node methods
Object.assign(Renderer.prototype, shimMethods, handleMethods, nodeMethods);

module.exports = Renderer;
