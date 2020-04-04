/* --------------------
 * react-async-ssr module
 * Utility methods
 * ------------------*/

'use strict';

// Modules
const React = require('react');
const {isObject} = require('is-it-type');

// Capture React element types
const {$$typeof: REACT_ELEMENT_TYPE, type: REACT_SUSPENSE_TYPE} = React.createElement(React.Suspense);

// Exports
module.exports = {
	isReactElement,
	isRenderableElement,
	isSuspenseType
};

function isReactElement(e) {
	return isObject(e) && e.$$typeof === REACT_ELEMENT_TYPE;
}

function isRenderableElement(e) {
	return e !== null && e !== false && e !== '';
}

function isSuspenseType(type) {
	return type === REACT_SUSPENSE_TYPE;
}
