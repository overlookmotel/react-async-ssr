/* --------------------
 * react-async-ssr module
 * Utility methods
 * ------------------*/

'use strict';

// Modules
const React = require('react');

// Exports
module.exports = {
	isObject,
	isPromise,
	isReactElement,
	isSuspense,
	promiseTry,
	last
};

function isObject(o) {
	return o != null && typeof o === 'object';
}

function isPromise(o) {
	return isObject(o) && typeof o.then === 'function';
}

const {$$typeof: ELEMENT_TYPE, type: SUSPENSE_TYPE} = React.createElement(React.Suspense, null);

function isReactElement(e) {
	return isObject(e) && e.$$typeof === ELEMENT_TYPE;
}

function isSuspense(e) {
	return isReactElement(e) && e.type === SUSPENSE_TYPE;
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
