/* --------------------
 * react-async-ssr module
 * Utility methods
 * ------------------*/

'use strict';

// Modules
const {REACT_ELEMENT_TYPE, REACT_SUSPENSE_TYPE} = require('./reactTypes');

// Exports
module.exports = {
	isObject,
	isPromise,
	isReactElement,
	isSuspense,
	isSuspenseType,
	isReactClassComponent,
	promiseTry,
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

function isSuspense(e) {
	return isReactElement(e) && isSuspenseType(e.type);
}

function isSuspenseType(type) {
	return type === REACT_SUSPENSE_TYPE;
}

function isReactClassComponent(c) {
	return !!c.prototype && !!c.prototype.isReactComponent;
}

function promiseTry(fn) {
	try {
		return Promise.resolve(fn());
	} catch (err) {
		return Promise.reject(err);
	}
}

function last(arr) {
	return arr[arr.length - 1];
}
