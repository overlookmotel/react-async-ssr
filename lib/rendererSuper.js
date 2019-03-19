/* --------------------
 * react-async-ssr module
 * Capture ReactDOMServerRenderer class from ReactDOMServer
 * ------------------*/

'use strict';

// Modules
const {renderToNodeStream} = require('react-dom/server');

// Capture ReactDOMServerRenderer class from React
const ReactDOMServerRenderer = renderToNodeStream('').partialRenderer.constructor;

// Identify if running in dev mode
const isDev = !!(new ReactDOMServerRenderer('')).stack[0].debugElementStack;

// Exports
module.exports = {
	ReactDOMServerRenderer,
	isDev
};
