/* --------------------
 * react-async-ssr module
 * Capture internal React render state
 * ------------------*/

'use strict';

// Modules
const React = require('react');

// Imports
const {isObject} = require('./utils');

// Constants
const SHIMMED = Symbol('shimmed');

// Exports

/*
 * Shim `React.isValidElement()` to capture elements resolved in render.
 * Renderer's `.render()` method calls private `resolve()` function inside React.
 * `resolve()` iterates through user-defined React components, calling each's
 * `.render()` method and then resolving the element returned in turn.
 * This shim keeps track of the current element being rendered
 * (i.e. the one returned by `resolve()`).
 * This shim also shims the `.getChildContext()` prototype method of any
 * components in the tree to capture any legacy context emitted as tree is
 * iterated through in `resolve()`.
 */

// Capture state vars
let active = false,
	element = null,
	contextStack = [];

// Shim `React.isValidElement()`
const {isValidElement} = React;
React.isValidElement = function(object) {
	const isElement = isValidElement(object);

	if (active && isElement) {
		element = object;
		shimGetChildContext(object);
	}

	return isElement;
};

function shimGetChildContext(element) {
	const {type} = element;
	if (typeof type !== 'function') return;

	const {prototype} = type;
	if (!isObject(prototype)) return;

	const {getChildContext} = prototype;
	if (typeof getChildContext !== 'function' || getChildContext[SHIMMED]) return;

	const getChildContextShim = function() {
		const context = getChildContext.call(this);
		if (active) contextStack.push(context);
		return context;
	};
	getChildContextShim[SHIMMED] = true;

	prototype.getChildContext = getChildContextShim;
}

/*
 * Export methods to access capture state
 */
module.exports = {
	// Activate capturing
	enter() {
		active = true;
	},

	// Return current element and context
	result(context) {
		// Merge contexts from stack into contexts
		if (contextStack.length > 0) {
			contextStack.unshift({}, context);
			context = Object.assign.apply(null, contextStack);
		}

		return {element, context};
	},

	// Clear render capture state
	exit() {
		active = false;
		element = null;
		contextStack.length = 0;
	}
};
