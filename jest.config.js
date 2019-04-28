'use strict';

module.exports = {
	testEnvironment: 'node',
	clearMocks: true,
	coverageDirectory: 'coverage',
	collectCoverageFrom: [
		'**/*.js',
		'!.**',
		'!**/.**',
		'!**/node_modules/**',
		'!test/**',
		'!jest.config.js'
	]
};
