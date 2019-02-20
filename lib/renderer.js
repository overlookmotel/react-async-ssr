/* --------------------
 * react-async-ssr module
 * Async render function
 * ------------------*/

'use strict';

// Modules
const {renderToNodeStream} = require('react-dom/server'),
	{toArray} = require('react').Children;

// Imports
const {TYPE_SUSPENSE, TYPE_PROMISE, TYPE_TEXT, NO_SSR} = require('./constants'),
	treeToHtml = require('./treeToHtml'),
	walkTree = require('./walkTree'),
	{
		isPromise, isReactElement, isRenderableElement, isReactClassComponent, isSuspenseType, last
	} = require('./utils');

// Capture ReactDOMServerRenderer class from React
const ReactDOMServerRenderer = renderToNodeStream('').partialRenderer.constructor;

// Identify if running in dev mode
const isDev = !!(new ReactDOMServerRenderer('')).stack[0].debugElementStack;

// Exports
class PartialRenderer extends ReactDOMServerRenderer {
	/**
	 * @constructor
	 * @param {*} children - React element(s)
	 * @param {boolean} makeStaticMarkup - `true` for equivalent of `renderToStaticMarkup()`
	 */
	constructor(children, makeStaticMarkup) {
		super(children, makeStaticMarkup);

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

		// Init interrupt signal
		this.interrupt = null;

		// Init read callback
		this.callback = null;

		// Init error state
		this.error = null;
		this.hasErrored = false;

		// Shim `stack.pop()` method to catch when boundary completes processing
		this.stackPopOriginal = this.stack.pop;
		this.stack.pop = () => this.stackPop();

		// Init vars to track position relative to DOM root
		this.isRootElement = true;
		this.nonDomFrames = 0;

		// Set footer on root stack frame to prevent thread being freed at end of render
		this.stack[0].footer = '_';
	}

	/*
	 * `.destroy()` and `.clearProviders()` methods are added here to fix bug in
	 * ReactDOM 16.7.0-16.8.2.
	 * See https://github.com/facebook/react/issues/14705
	 * This bug will have worse effects with this extension of the class, as
	 * contexts are added to the context stack without adding to the frame
	 * stack, so leftover context values crossing over into other threads will
	 * be much more common.
	 * `.destroy()` prototype method is removed again at bottom of this script
	 * if `.clearProviders()` prototype method exists already on
	 * ReactDOMServerRenderer.
	 *
	 * TODO Alter this when updating to ReactDOM > 16.8.2 which includes
	 * commit fixing this lands in stable release.
	 * https://github.com/facebook/react/commit/ab7a67b1dc0e44bf74545ccf51a8c143b3af7402
	 */
	destroy() {
		if (!this.exhausted) this.clearProviders();
		super.destroy();
	}

	clearProviders() {
		// Restore any remaining providers on the stack to previous values
		for (let index = this.contextIndex; index >= 0; index--) {
			const context = this.contextStack[index];
			const previousValue = this.contextValueStack[index];
			context[this.threadID] = previousValue;
		}
	}

	resetProviders() {
		this.clearProviders();
		this.contextIndex = -1;
	}

	/*
	 * Read async
	 */
	readAsync(cb) {
		this.callback = cb;

		// Render
		this.cycle();
	}

	cycle() {
		try {
			this.read(1);
		} catch (err) {
			this.errored(err);
		}

		if (this.numAwaiting !== 0) return;

		// Finished processing
		this.destroy();

		const cb = this.callback;
		if (this.hasErrored) {
			cb(this.error);
			return;
		}

		// Convert tree to HTML
		const out = treeToHtml(this.tree, this.makeStaticMarkup);
		cb(null, out);
	}

	halt(err) {
		// Halt React rendering
		this.stack.length = 1;

		this.errored(err);
	}

	errored(err) {
		// Abort all promises
		this.abortDescendents(this.tree);

		// Record error
		this.error = err;
		this.hasErrored = true;
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
	 * Shim element to capture any Promises thrown when rendering it, or any
	 * Suspense boundaries produced during rendering.
	 *
	 * This cannot be done directly in `partialRenderer.render()` method above
	 * because React renderer's `.render()` method calls an internal function
	 * `resolve()` which iteratively resolves user-defined function/class
	 * components, until it finds a React element or DOM element.
	 * When an error is thrown in a component, it exits immediately and it is
	 * not possible to determine which element threw. Any contexts populated
	 * in previous components (legacy context API) are also lost.
	 * Similarly, when a <Suspense> element is encountered, it causes React to
	 * throw and contexts are lost.
	 *
	 * So this method captures these events and records their details as
	 * `.interrupt`. The method returns instead an element which causes
	 * `resolve()` to exit and React to push a frame to the stack including the
	 * context. That frame is then grabbed and the details recovered in
	 * `.handleInterrupt()` below.
	 *
	 * When a Promise is thrown, an empty array is returned instead, which
	 * causes `resolve()` to exit.
	 *
	 * When a Suspense element is encountered, an array of the Suspense
	 * element's children is returned. Again, this causes `resolve()` to exit.
	 */
	shimElement(element) {
		// If not function component, return unchanged
		if (typeof element === 'string' || typeof element === 'number') return element;
		if (!isReactElement(element)) return element;

		const Component = element.type;
		if (typeof Component === 'string') return element;

		// Handle Suspense
		if (isSuspenseType(Component)) return this.shimSuspense(element);

		// If not function component, return unchanged
		if (typeof Component !== 'function') return element;

		// Clone element and shim
		const shimmedElement = Object.assign({}, element);

		const render = (renderFn, instance, props, context, updater) => {
			let e;
			try {
				e = renderFn.call(instance, props, context, updater);
			} catch (err) {
				return this.shimError(element, err);
			}
			return this.shimElement(e);
		};

		let shimmedComponent;
		if (isReactClassComponent(Component)) {
			// Class component
			shimmedComponent = class extends Component {
				render(props, context, updater) {
					return render(super.render, this, props, context, updater);
				}
			};
		} else {
			// Function component
			shimmedComponent = function(props, context, updater) {
				return render(Component, this, props, context, updater);
			};
			Object.assign(shimmedComponent, Component);
		}
		shimmedElement.type = shimmedComponent;

		return shimmedElement;
	}

	shimSuspense(element) {
		// Record interrupt
		this.interrupt = {
			type: TYPE_SUSPENSE,
			element
		};

		// Return array of children
		return toArray(element.props.children);
	}

	shimError(element, err) {
		// If error is not promise, rethrow it
		if (!isPromise(err)) throw err;

		// Record interrupt
		this.interrupt = {
			type: TYPE_PROMISE,
			element,
			promise: err
		};

		// Return empty array
		return [];
	}

	/*
	 * Handle interrupts
	 */
	handleInterrupt() {
		const {interrupt} = this;
		this.interrupt = null;

		const {type} = interrupt;
		if (type === TYPE_SUSPENSE) {
			this.handleSuspense(interrupt.element);
		} else if (type === TYPE_PROMISE) {
			this.handlePromise(interrupt.element, interrupt.promise);
		} else {
			throw new Error(`Unexpected interrupt type '${type}'`);
		}
	}

	handleSuspense(element) {
		// Add boundary node to tree and step into it
		// NB If fallback is undefined, it's not treated as a suspense boundary
		const frame = last(this.stack);

		let node;
		const {fallback} = element.props;
		if (fallback !== undefined) {
			node = this.createChild(TYPE_SUSPENSE, frame);
			node.fallback = fallback;
			this.suspenseNode = node;
		} else {
			node = this.createChild(null, frame);
		}

		this.node = node;
		this.nonDomFrames++;

		// Record frame on node.
		// It is used in `.stackPop()` method below to identify when this
		// suspense boundary is exited.
		node.frame = frame;
	}

	handlePromise(element, promise) {
		if (promise[NO_SSR]) return this.handleNoSsrPromise(promise);

		// Pop frame from stack
		const {stack} = this;
		const frame = this.stackPopOriginal.call(stack);

		// Add node to tree
		const node = this.createChild(TYPE_PROMISE, frame);
		node.element = element;
		node.promise = promise;
		node.resolved = false;

		// Follow promise
		this.numAwaiting++;

		let sync = true, resolvedSync = false;
		promise.then(
			() => {
				// If node is no longer going to be rendered because boundary
				// fallback above has already triggered, ignore result.
				// Also ignore if callback called more than once.
				if (node.resolved) return;
				node.resolved = true;

				// Handle synchronous callback
				if (sync) {
					resolvedSync = true;
					return;
				}

				this.resolved(node);
			},
			err => {
				// Swallow errors where node is not going to be rendered
				if (node.resolved) return;
				node.resolved = true;

				// Promise is no longer awaited
				this.numAwaiting--;

				// Abort all rendering
				this.halt(err);
			}
		);
		sync = false;

		// If Promise resolved synchronously, push element back onto stack so it renders again
		if (resolvedSync) {
			// Push element onto stack
			frame.children = toArray(element);
			stack.push(frame);

			// Step into this node
			node.frame = frame;
			this.node = node;
			this.nonDomFrames++;

			// Promise is no longer awaited
			this.numAwaiting--;
		}
	}

	resolved(node) {
		// Promise is no longer awaited
		this.numAwaiting--;

		// Step into node and reinstate stack state with element on stack ready to render
		this.node = node;
		this.suspenseNode = node.parentSuspense;
		this.restoreStack(node.stackState, node.element);

		// Render element
		this.cycle();

		// Clear contexts added in `.restoreStack()`
		this.resetProviders();
	}

	restoreStack(stackState, element) {
		// Reinstate stack state with element on stack ready to render
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
		for (let ctx of stackState.contexts) {
			this.pushProvider(
				isDev ? ctx.provider : {type: {_context: ctx.context}, props: {value: ctx.value}}
			);
		}

		// Restore `currentSelectValue` + `isRootElement`
		this.currentSelectValue = stackState.currentSelectValue;
		this.isRootElement = stackState.isRootElement;
		this.nonDomFrames = 0;
		this.previousWasTextNode = false;
	}

	handleNoSsrPromise(promise) {
		// Abort this promise
		let resolved = false;
		const resolve = () => resolved = true;
		promise.then(resolve, resolve);
		if (!resolved) abort(promise);

		// If no enclosing suspense boundary, exit with error
		const {node, suspenseNode} = this;
		if (!suspenseNode) return this.halt(promise);

		// Abort all promises within boundary
		this.abortDescendents(suspenseNode);

		// Convert boundary node to fallback node (+ remove all children)
		const {frame: suspenseFrame, fallback, stackState} = suspenseNode;
		suspenseNode.type = null;
		suspenseNode.children.length = 0;
		suspenseNode.fallback = null;
		suspenseNode.stackState = null;

		// Move back down tree into this node
		this.node = suspenseNode;
		this.suspenseNode = suspenseNode.parentSuspense;
		this.previousWasTextNode = false;

		// If boundary not in current render cycle, abandon this render cycle,
		// and render fallback.
		if (!suspenseFrame) {
			// Clear current render cycle state
			this.stack.length = 1;
			this.resetProviders();

			// Restore stack and render fallback.
			// NB Render cycle already in progress, so no need to call `.read()` again.
			if (isRenderableElement(fallback)) this.restoreStack(stackState, fallback);
			return;
		}

		// Boundary is in current render cycle.
		// Prevent further rendering of all children in frames down to suspense boundary.
		const {stack} = this;
		let thisNode = node;
		for (let i = stack.length - 1; i >= 0; i--) {
			const frame = stack[i];
			frame.childIndex = frame.children.length;
			frame._footer = '';

			if (frame === suspenseFrame) break;

			if (frame === thisNode.frame) {
				this.nonDomFrames--;
				thisNode = thisNode.parent;
			}
		}

		// Add fallback to stack ready to render
		if (isRenderableElement(fallback)) suspenseFrame.children.push(fallback);
	}

	createChild(type, frame) {
		// Get current contexts from new Context API
		const {threadID} = this;
		const contexts = [];
		for (let i = 0; i <= this.contextIndex; i++) {
			const context = this.contextStack[i];
			const ctx = {context, value: context[threadID]};
			if (isDev) ctx.provider = this.contextProviderStack[i];
			contexts.push(ctx);
		}

		const parent = this.node;

		const child = {
			type,
			parent,
			parentSuspense: this.suspenseNode,
			children: [],
			stackState: {
				context: frame.context, // Contexts from legacy Context API
				contexts, // Contexts from new Context API
				domNamespace: frame.domNamespace,
				currentSelectValue: this.currentSelectValue,
				isRootElement: this.isRootElement && this.stack.length === this.nonDomFrames + 1
			}
		};

		parent.children.push(child);

		// Prevent insertion of '<!-- -->'.
		// '<!-- -->' will be re-inserted later if required once content of the
		// boundary/lazy element is known.
		this.previousWasTextNode = false;

		return child;
	}

	// Shim of `this.stack.pop()`. Shim is applied in constructor above.
	stackPop() {
		const frame = this.stackPopOriginal.call(this.stack);

		// If node completed processing, traverse back up tree
		const {node} = this;
		if (frame === node.frame) {
			node.frame = null;
			this.node = node.parent;
			if (node === this.suspenseNode) this.suspenseNode = node.parentSuspense;
			this.nonDomFrames--;
			this.previousWasTextNode = false;
		} else if (frame._footer !== undefined) {
			this.output(frame._footer);
		}

		return frame;
	}

	renderDOM(element, context, parentNamespace) {
		// Render
		let out = super.renderDOM(element, context, parentNamespace);

		// Fix markup where whether root node incorrectly identified
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
		if (this.stack.length === 2) {
			if (!this.isRootElement) {
				// Remove tag
				out = out.replace(
					/^(<.+?) data-reactroot=""(\/?>)/,
					(whole, start, end) => `${start}${end}`
				);
			}
		} else if (this.isRootElement && this.stack.length === this.nonDomFrames + 2) {
			// Add tag
			out = out.replace(
				/^(<.+?)(\/?>)/,
				(whole, start, end) => `${start} data-reactroot=""${end}`
			);
		}

		return out;
	}

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

	/**
	 * Abort all descendents (children, children's children etc) of a node.
	 * If promise on lazy component has `.abort()` method, it is called.
	 * @param {Object} tree - Starting node
	 * @returns {undefined}
	 */
	abortDescendents(tree) {
		walkTree(tree, node => {
			const {type} = node;
			if (type === TYPE_TEXT) return false;

			if (type === TYPE_PROMISE && !node.resolved) {
				node.resolved = true;
				this.numAwaiting--;
				abort(node.promise);
			}

			return true;
		});
	}
}

/**
 * Abort promise.
 * @param {Promise} promise - Promise to abort
 * @returns {undefined}
 */
function abort(promise) {
	if (typeof promise.abort === 'function') promise.abort();
}

/*
 * If ReactDOM is version which already has `.clearProviders()` method on
 * `PartialRenderer` class, remove `.destroy()` and `.clearProviders()` methods
 * overrides in this subclass.
 * (see comments above on `.destroy()` method)
 */
if (ReactDOMServerRenderer.prototype.clearProviders) {
	delete PartialRenderer.prototype.clearProviders;
	delete PartialRenderer.prototype.destroy;
}

module.exports = PartialRenderer;
