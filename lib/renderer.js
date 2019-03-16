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

		// Init suspense state
		this.suspenseNode = null;
		this.suspended = false;

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

		// Init var to track position relative to DOM root
		// TODO Remove this once PR to do same lands in React
		// https://github.com/facebook/react/pull/15023
		this.domRootIndex = 0;

		// Set footer on root stack frame to prevent thread being freed at end of render
		this.stack[0].footer = '_';
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

		if (this.numAwaiting !== 0 || this.suspended) return;

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
			node = this.createChildWithStackState(TYPE_SUSPENSE, frame);
			node.fallback = fallback;
			node.suspended = false;
			this.suspenseNode = node;
			this.suspended = false;
		} else {
			node = this.createChild(null);
		}

		this.node = node;

		// Record frame on node.
		// It is used in `.stackPop()` method below to identify when this
		// suspense boundary is exited.
		node.frame = frame;
	}

	handlePromise(element, promise) {
		// Pop frame from stack
		const {stack} = this;
		const frame = this.stackPopOriginal.call(stack);

		// If not rendering because inside suspense boundary which is suspended,
		// abort promise and ignore
		// TODO Check this works if promise resolves sync.
		// I think it won't because on client side it will render immediately
		// and that could include more lazy elements.
		if (this.suspended) {
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
			node = this.createChild(TYPE_PROMISE);
			node.resolved = true;

			node.frame = frame;
			this.node = node;

			// Push element onto stack
			frame.children = toArray(element);
			stack.push(frame);

			return;
		}

		// Awaiting promise - create tree node
		node = this.createChildWithStackState(TYPE_PROMISE, frame);
		node.element = element;
		node.promise = promise;
		node.resolved = false;

		this.numAwaiting++;
	}

	resolved(node) {
		// If node is no longer going to be rendered because boundary
		// fallback above has already triggered, ignore result.
		if (node.resolved) return;

		// Promise is no longer awaited
		node.resolved = true;
		this.numAwaiting--;

		// Re-render element
		this.rerender(node, node.element);
	}

	rerender(node, element) {
		// Step into node and reinstate stack state with element on stack ready to render
		this.node = node;
		const suspenseNode = node.parentSuspense;
		this.suspenseNode = suspenseNode;
		this.suspended = suspenseNode ? suspenseNode.suspended : false;
		this.restoreStack(node.stackState, element);

		// Render element
		this.cycle();

		// If errored, exit
		if (this.exhausted) return;

		// Clear contexts added in `.restoreStack()`
		this.resetProviders();

		// If suspended, render fallback of suspense boundary
		if (!this.suspended) return;

		// Convert node to fallback and discard children
		const {fallback} = suspenseNode;
		this.convertNodeToFallback(suspenseNode);

		// Render fallback
		if (isRenderableElement(fallback)) this.rerender(suspenseNode, fallback);

		// Clear frame to free memory
		suspenseNode.frame = null;
	}

	rejected(node, err) {
		// If node is no longer going to be rendered because boundary
		// fallback above has already triggered, swallow error.
		if (node.resolved) return;

		// Promise is no longer awaited
		node.resolved = true;
		this.numAwaiting--;

		// Abort all rendering
		this.halt(err);
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

		// Restore `currentSelectValue` + `domRootIndex`
		this.currentSelectValue = stackState.currentSelectValue;
		this.domRootIndex = stackState.domRootAbove ? 1 : 0;
		this.previousWasTextNode = false;
	}

	handleNoSsrPromise(promise) {
		// Abort this promise
		followAndAbort(promise);

		// If no enclosing suspense boundary, exit with error
		const {suspenseNode} = this;
		if (!suspenseNode) return this.halt(promise);

		// Abort all promises within boundary
		this.abortDescendents(suspenseNode);

		// Suspend
		this.suspended = true;
		suspenseNode.suspended = true;
	}

	createChildWithStackState(type, frame) {
		const child = this.createChild(type);

		// Get current contexts from new Context API
		const {threadID} = this;
		const contexts = [];
		for (let i = 0; i <= this.contextIndex; i++) {
			const context = this.contextStack[i];
			const ctx = {context, value: context[threadID]};
			if (isDev) ctx.provider = this.contextProviderStack[i];
			contexts.push(ctx);
		}

		// Record parent suspense node
		child.parentSuspense = this.suspenseNode;

		// Record stackState
		child.stackState = {
			context: frame.context, // Contexts from legacy Context API
			contexts, // Contexts from new Context API
			domNamespace: frame.domNamespace,
			currentSelectValue: this.currentSelectValue,
			domRootAbove: this.domRootIndex !== 0
		};

		return child;
	}

	createChild(type) {
		const parent = this.node;

		const child = {
			type,
			parent,
			children: []
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
		const {suspended} = this,
			{fallback} = node;

		// Step down suspense stack
		const {parentSuspense} = node;
		this.suspenseNode = parentSuspense;
		this.suspended = parentSuspense ? parentSuspense.suspended : false;

		if (!suspended) return;

		// Was suspended
		// Convert node to fallback
		this.convertNodeToFallback(node);
		node.stackState = null;

		if (!isRenderableElement(fallback)) return;

		// Render fallback
		frame.children = toArray(fallback);
		frame.childIndex = 0;

		this.stack.push(frame);

		this.node = node;
		node.frame = frame;
	}

	convertNodeToFallback(node) {
		node.type = null;
		node.fallback = null;
		node.children.length = 0;
	}

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

	/*
	 * Reset all Providers in stack.
	 * ReactDOM's native `.clearProviders()` method resets the content of all
	 * Providers, but does not reset `.contextIndex`.
	 */
	resetProviders() {
		this.clearProviders();
		this.contextIndex = -1;
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
 * Follow promise (to catch rejections) and abort if does not resolve synchronously
 * @param {Promise} promise - Promise to abort
 * @returns {undefined}
 */
function followAndAbort(promise) {
	let resolved = false;
	const resolve = () => resolved = true;
	promise.then(resolve, resolve);
	if (!resolved) abort(promise);
}

/**
 * Abort promise.
 * @param {Promise} promise - Promise to abort
 * @returns {undefined}
 */
function abort(promise) {
	if (typeof promise.abort === 'function') promise.abort();
}

module.exports = PartialRenderer;
