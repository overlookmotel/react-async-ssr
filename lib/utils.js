/* --------------------
 * react-async-ssr module
 * Utility methods
 * ------------------*/

'use strict';

// Modules
const React = require('react');

// Capture React element types
const {$$typeof: REACT_ELEMENT_TYPE, type: REACT_SUSPENSE_TYPE} = React.createElement(React.Suspense);

// Exports
module.exports = {
	isObject,
	isPromise,
	isReactElement,
	isRenderableElement,
	isSuspenseType,
	isReactClassComponent,
	last
};

function isObject(o) {
	return o != null && typeof o === 'object';
}

function isPromise(o) {
	return isObject(o) && typeof o.then === 'function';
}

function isReactElement(e) {
	return isObject(e) && e.$$typeof === REACT_ELEMENT_TYPE;
}

function isRenderableElement(e) {
	return e !== null && e !== false && e !== '';
}

function isSuspenseType(type) {
	return type === REACT_SUSPENSE_TYPE;
}

function isReactClassComponent(c) {
	return !!c.prototype && !!c.prototype.isReactComponent;
}

function last(arr) {
	return arr[arr.length - 1];
}
