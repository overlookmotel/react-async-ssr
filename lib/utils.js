/* --------------------
 * react-async-ssr module
 * Utility methods
 * ------------------*/

'use strict';

// Modules
const React = require('react');
const {isObject} = require('is-it-type');

// Capture React element types
const { $$typeof: REACT_ELEMENT_TYPE, type: REACT_SUSPENSE_TYPE } = React.createElement(React.Suspense);
const { $$typeof: REACT_FORWARD_REF_TYPE } = React.forwardRef(() => {})

// Exports

module.exports = {
	isReactElement,
	isRenderableElement,
	isSuspenseType,
	isReactForwardedRefComponent
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

function isReactForwardedRefComponent(Component) {
	return isObject(Component) && Component.$$typeof === REACT_FORWARD_REF_TYPE;
}
