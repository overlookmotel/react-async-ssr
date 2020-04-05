/* --------------------
 * react-async-ssr module
 * Babel tests config
 * ------------------*/

'use strict';

// Exports

module.exports = {
	presets: [
		['@babel/preset-env', {targets: {node: 'current'}}],
		'@babel/preset-react'
	]
};
