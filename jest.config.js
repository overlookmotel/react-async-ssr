/* --------------------
 * react-async-ssr module
 * Jest config
 * ------------------*/

'use strict';

// Exports

module.exports = {
	testEnvironment: 'node',
	clearMocks: true,
	coverageDirectory: 'coverage',
	collectCoverageFrom: ['index.js', 'symbols.js', 'lib/**/*.js']
};
