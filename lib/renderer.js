/* --------------------
 * react-async-ssr module
 * Async render function
 * ------------------*/

'use strict';

// Modules
const {renderToNodeStream} = require('react-dom/server'),
	{toArray} = require('react').Children;

// Imports
const {TYPE_SUSPENSE, TYPE_PROMISE, PLACEHOLDER} = require('./constants'),
	{isPromise, isSuspense, last} = require('./utils'),
	{treeAddHtml} = require('./tree'),
	renderCapture = require('./renderCapture');

// Capture ReactDOMServerRenderer class from React
const ReactDOMServerRenderer = renderToNodeStream('').partialRenderer.constructor;

// Identify if running in dev mode
const isDev = !!(new ReactDOMServerRenderer('')).stack[0].debugElementStack;

// Function to identify Suspense errors
const isSuspenseError = isDev ?
	err => err.message === 'ReactDOMServer does not yet support Suspense.' :
	err => /^Minified React error #294;/.test(err.message);

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

	render(element, context, parentNamespace) {
		renderCapture.enter();

		try {
			return super.render(element, context, parentNamespace);
		} catch (err) {
			// Get current element and context
			({element, context} = renderCapture.result(context));

			// React throws error on Suspense element
			if (isSuspense(element) && isSuspenseError(err)) {
				// Remove entry for Suspense element from debug stack
				if (isDev) last(this.stack).debugElementStack.pop();

				return this.handleSuspense(element, context, parentNamespace, element);
			}

			if (isPromise(err)) {
				// Thrown promise
				return this.handlePromise(element, context, parentNamespace, err);
			}

			// Unknown error - rethrow it
			throw err;
		} finally {
			renderCapture.exit();
		}
	}

	handleSuspense(element, context, domNamespace) {
		const {children, fallback} = element.props;

		// Add frame to stack
		const frame = {
			type: null,
			domNamespace,
			children: toArray(children),
			childIndex: 0,
			context: context,
			footer: PLACEHOLDER
		};
		if (isDev) frame.debugElementStack = [];

		this.stack.push(frame);
		this.boundaryDepth++;

		// Add boundary node to tree
		const child = this.createChild(TYPE_SUSPENSE, frame, context, domNamespace, {fallback});
		this.node = child;

		return PLACEHOLDER;
	}

	handlePromise(element, context, domNamespace, promise) {
		// Add node to tree
		// TODO Identify here if promise is flagged for no server render,
		// and throw if so, to prevent later elements executing further async
		// actions (fetch data etc) the results of which will never be rendered
		// as the part of the tree within the boundary will be replaced by
		// fallback.
		const child = this.createChild(TYPE_PROMISE, null, context, domNamespace, {element, promise});

		// Record child in lazy nodes array
		this.lazyNodes.push(child);

		// Return placeholder text.
		// It will be replaced by result of promise in next render cycle.
		return PLACEHOLDER;
	}

	createChild(type, frame, context, domNamespace, props) {
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
			frame,
			stackState: {
				context, // Context from legacy Context API
				contexts, // Contexts from new Context API
				domNamespace,
				currentSelectValue: this.currentSelectValue,
				isRootElement: this.isRootElement && this.stack.length === this.boundaryDepth + 1
			}
		};
		Object.assign(child, props);

		parent.children.push(child);

		// Prevent insertion of '<!-- -->'.
		// '<!-- -->' will be re-inserted later if required once content of the
		// boundary/lazy element is known.
		this.previousWasTextNode = false;

		return child;
	}

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
