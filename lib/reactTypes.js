/* --------------------
 * react-async-ssr module
 * Capture internal React symbols
 * ------------------*/

'use strict';

// Modules
const React = require('react');

// Exports
const suspenseElement = React.createElement(React.Suspense);

module.exports = {
	REACT_ELEMENT_TYPE: suspenseElement.$$typeof,
	REACT_SUSPENSE_TYPE: suspenseElement.type,
	REACT_FRAGMENT_TYPE: React.createElement(React.Fragment).type
};
