/* --------------------
 * react-async-ssr module
 * Async render function
 * ------------------*/

'use strict';

// Modules
const {renderToNodeStream} = require('react-dom/server');

// Imports
const {TYPE_SUSPENSE, TYPE_PROMISE, PLACEHOLDER, NO_SSR} = require('./constants'),
	{REACT_FRAGMENT_TYPE} = require('./reactTypes'),
	{isPromise, isReactElement, isReactClassComponent, isSuspenseType, last} = require('./utils'),
	{treeAddHtml} = require('./tree');

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
	 * @param {Object} [stackState] - Stack state from parent render
	 * @param {Object} stackState.context - Legacy context object
	 * @param {Array} stackState.contexts - New context objects in form `{context: Context, value: *}`
	 * @param {string} stackState.domNamespace - domNamespace from parent render
	 * @param {*} stackState.currentSelectValue - currentSelectValue from parent render
	 * @param {boolean} stackState.isRootElement - `false` if this will not be root HTML node
	 */
	constructor(children, makeStaticMarkup, stackState) {
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

		// Init array of lazy nodes
		this.lazyNodes = [];

		// Init interrupt signal
		this.interrupt = null;

		// Shim `stack.pop()` method to catch when boundary completes processing
		this.stackPopOriginal = this.stack.pop;
		this.stack.pop = () => this.stackPop();

		// Vars to track position relative to root
		this.isRootElement = stackState ? stackState.isRootElement : true;
		this.boundaryDepth = 0;

		// If not nested render, no state to inject so exit - render as usual
		if (!stackState) return;

		// Nested render.
		// Reinstate stack state from parent render.
		const frame = this.stack[0];
		frame.domNamespace = stackState.domNamespace;
		frame.context = stackState.context;

		// Restore contexts from new Context API
		for (let ctx of stackState.contexts) {
			this.pushProvider(
				isDev ? ctx.provider :
					{type: {_context: ctx.context}, props: {value: ctx.value}}
			);
		}

		// Restore `currentSelectValue`
		this.currentSelectValue = stackState.currentSelectValue;
	}

	/*
	 * `.destroy()` and `.clearProviders()` methods are added here to fix bug in ReactDOM 16.7.0.
	 * See https://github.com/facebook/react/issues/14705
	 * This bug will have worse effects with this extension of the class, as contexts are added
	 * to the context stack without adding to the frame stack, so leftover context values
	 * crossing over into other threads will be much more common.
	 * These prototype methods are removed again at bottom of this script if `.clearProviders()`
	 * prototype method exists already on ReactDOMServerRenderer.
	 * TODO Alter this depending on outcome of ReactDOM issue and how it is fixed.
	 */
	destroy() {
		if (!this.exhausted) this.clearProviders();
		super.destroy();
	}

	clearProviders() {
		while (this.contextIndex > -1) {
			if (isDev) {
				this.popProvider(this.contextProviderStack[this.contextIndex]);
			} else {
				this.popProvider();
			}
		}
	}

	readTree() {
		let html;
		try {
			html = this.read(Infinity);
		} finally {
			this.destroy();
		}

		// Add HTML into tree
		const {tree} = this;
		treeAddHtml(tree, html);

		// Return tree and array of lazy nodes
		return {tree, lazyNodes: this.lazyNodes};
	}

	/*
	 * Extension of superclass's `.render()` method.
	 * Allows capturing Suspense elements and Promises thrown while rendering
	 * elements ("interrupts").
	 */
	render(element, context, parentNamespace) {
		// Reset interrupt signal
		this.interrupt = null;

		// Shim element to capture thrown errors + suspense elements
		element = this.shimElement(element);

		// Call original render method
		let res = super.render(element, context, parentNamespace);

		// Handle interrupts (i.e. Suspense element or thrown Promise)
		if (this.interrupt === TYPE_SUSPENSE) {
			// Record context from stack frame to suspense node
			const {node} = this,
				{stackState} = node,
				frame = last(this.stack);
			stackState.context = frame.context;
			stackState.domNamespace = parentNamespace;

			// Record frame on node.
			// It is used in `.stackPop()` method below to identify when this
			// suspense boundary is exited.
			node.frame = frame;

			// Make frame output placeholder when popped off stack, to indicate
			// boundary is being exited
			frame.footer = PLACEHOLDER;

			res = PLACEHOLDER;
		} else if (this.interrupt === TYPE_PROMISE) {
			// Record context from stack frame to lazy node (pop off stack)
			const {stackState} = last(this.node.children),
				frame = this.stackPopOriginal.call(this.stack);
			stackState.context = frame.context;
			stackState.domNamespace = parentNamespace;

			res = PLACEHOLDER;
		}

		return res;
	}

	/*
	 * Clone element to capture any Promises thrown when rendering it.
	 *
	 * This cannot be done directly in `partialRenderer.render()` method above
	 * because React renderer's `.render()` method calls an internal function
	 * `resolve()` which iteratively resolves user-defined function/class
	 * components, until it finds a React element or DOM element.
	 * When an error is thrown in a component, it exits immediately and it is
	 * not possible to determine which element threw. Any contexts populated
	 * in previous components (legacy context API) are also lost.
	 *
	 * So this method catches any Promises which are thrown when rendering the
	 * element.
	 * When a Promise is thrown, the shim creates a node in the boundary tree,
	 * including reference to the element which threw the Promise, and the
	 * Promise itself.
	 * The method then returns an empty Fragment element, which causes
	 * `resolve()` to exit.
	 * React pushes the Fragment onto the stack, along with the current legacy
	 * context, which is then read back in the `.render()` method above, and
	 * recorded on the tree node.
	 *
	 * If a Suspense element is encountered, it is also recorded in the tree,
	 * along with its fallback. The element is converted to a Fragment so
	 * React does not throw an error when it encounters it.
	 * Same as a thrown Promise, the legacy context can also be accessed from
	 * the stack frame React creates, and is attached to the tree node in
	 * `.render()` method above.
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
				return this.handleError(element, err);
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
				return render(Component, null, props, context, updater);
			};
			Object.assign(shimmedComponent, Component);
		}
		shimmedElement.type = shimmedComponent;

		return shimmedElement;
	}

	shimSuspense(element) {
		// Clone element and change type to Fragment
		const {children, fallback} = element.props;

		element = Object.assign({}, element);
		element.type = REACT_FRAGMENT_TYPE;
		element.props = {children};

		// Add boundary node to tree and step into it
		const child = this.createChild(TYPE_SUSPENSE);
		child.fallback = fallback;
		this.node = child;

		this.boundaryDepth++;

		// Signal interrupt
		this.interrupt = TYPE_SUSPENSE;

		return element;
	}

	handleError(element, err) {
		if (isPromise(err)) return this.handlePromise(element, err);
		throw err;
	}

	handlePromise(element, promise) {
		if (promise[NO_SSR]) this.handleNoSsrPromise(promise);

		// Add node to tree
		const child = this.createChild(TYPE_PROMISE);
		child.element = element;
		child.promise = promise;

		// Record child in lazy nodes array
		this.lazyNodes.push(child);

		// Signal interrupt
		this.interrupt = TYPE_PROMISE;

		// Return empty array which will cause React to push a frame to the
		// stack. Stack frame can then be read to capture legacy context.
		return [];
	}

	handleNoSsrPromise() {
		// Prevent further rendering of all children in frames down to suspense boundary.
		const boundaryFrame = this.node.frame;
		const {stack} = this;
		for (let i = stack.length - 1; i >= 0; i--) {
			const frame = stack[i];
			frame.childIndex = frame.children.length;
			if (frame === boundaryFrame) break;
		}
	}

	createChild(type) {
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
			children: [],
			stackState: {
				contexts, // Contexts from new Context API
				currentSelectValue: this.currentSelectValue,
				isRootElement: this.isRootElement && this.stack.length === this.boundaryDepth + 1
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

		// If boundary completed processing, traverse back up tree
		const {node} = this;
		if (frame === node.frame) {
			node.frame = null;
			this.node = node.parent;
			this.boundaryDepth--;
		}

		return frame;
	}

	renderDOM(element, context, parentNamespace) {
		let html = super.renderDOM(element, context, parentNamespace);
		if (this.makeStaticMarkup) return html;

		// Remove `data-reactroot=""` if nested render, or add if inside boundary.
		// NB `super.renderDOM()` has added a frame to the stack.
		if (this.stack.length === 2) {
			if (!this.isRootElement) {
				// Remove tag
				html = html.replace(
					/^(<.+?) data-reactroot=""(\/?>)/,
					(whole, start, end) => `${start}${end}`
				);
			}
		} else {
			if (this.isRootElement && this.stack.length === this.boundaryDepth + 2) {
				// Add tag
				html = html.replace(
					/^(<.+?)(\/?>)/,
					(whole, start, end) => `${start} data-reactroot=""${end}`
				);
			}
		}

		return html;
	}
}

// If ReactDOM is version which already has `.clearProviders()` method,
// remove the version added in the subclass (see comments above on methods)
if (ReactDOMServerRenderer.prototype.clearProviders) {
	delete PartialRenderer.prototype.clearProviders;
	delete PartialRenderer.prototype.destroy;
}

module.exports = PartialRenderer;
