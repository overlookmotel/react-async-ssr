/* --------------------
 * react-async-ssr module
 * Shim element's render method
 * ------------------*/

'use strict';

// Modules
const {toArray} = require('react').Children;
const isPromise = require('is-promise');
const isReactClassComponent = require('is-class-component');

// Imports
const {TYPE_SUSPENSE, TYPE_PROMISE} = require('./constants.js'),
	{isReactElement, isSuspenseType, isReactForwardedRefComponent} = require('./utils.js');

// Exports

/*
 * Methods to shim elements to capture any Promises thrown when rendering it,
 * or any Suspense boundaries produced during rendering.
 *
 * This cannot be done directly in `partialRenderer.render()` method
 * because React renderer's `.render()` method calls an internal function
 * `resolve()` which iteratively resolves user-defined function/class
 * components, until it finds a React element or DOM element.
 * When an error is thrown in a component, it exits immediately and it is
 * not possible to determine which element threw. Any contexts populated
 * in previous components (legacy context API) are also lost.
 * Similarly, when a <Suspense> element is encountered, it causes React to
 * throw and contexts are lost.
 *
 * So `.shimElement()` captures these events and records their details as
 * `.interrupt`. The method returns instead an element which causes
 * `resolve()` to exit and React to push a frame to the stack including the
 * context. That frame is then grabbed and the details recovered in
 * `.handleInterrupt()`.
 *
 * When a Promise is thrown, an empty array is returned instead, which
 * causes `resolve()` to exit.
 *
 * When a Suspense element is encountered, an array of the Suspense
 * element's children is returned. Again, this causes `resolve()` to exit.
 */
module.exports = {
	shimElement(element) {
		// If not function component, return unchanged
		if (typeof element === 'string' || typeof element === 'number') return element;
		if (!isReactElement(element)) return element;

		const Component = element.type;
		if (typeof Component === 'string') return element;

		// Handle Suspense
		if (isSuspenseType(Component)) return this.interruptSuspense(element);

		// If not component, return unchanged
		if (typeof Component !== 'function' && !isReactForwardedRefComponent(Component)) return element;

		// Clone element and shim
		const shimmedElement = {...element};

		const render = (renderFn, instance, props, context, updater) => {
			let e;
			try {
				e = renderFn.call(instance, props, context, updater);
			} catch (err) {
				return this.interruptError(element, err);
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
		} else if (isReactForwardedRefComponent(Component)) {
			shimmedComponent = {...Component};
			shimmedComponent.render = function(props, ref) {
				return render(Component.render, this, props, ref);
			};
		} else {
			// Function component
			shimmedComponent = function(props, context, updater) {
				// eslint-disable-next-line no-invalid-this
				return render(Component, this, props, context, updater);
			};
			Object.assign(shimmedComponent, Component);
		}
		shimmedElement.type = shimmedComponent;

		return shimmedElement;
	},

	interruptSuspense(element) {
		// Record interrupt
		this.interrupt = {
			type: TYPE_SUSPENSE,
			element
		};

		// Return array of children
		return toArray(element.props.children);
	},

	interruptError(element, err) {
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
};
