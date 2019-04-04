'use strict';

module.exports = {
	testEnvironment: 'node',
	clearMocks: true,
	coverageDirectory: 'coverage',
	collectCoverageFrom: [
		'*.js',
		'lib/**/*.js',
		'!jest.config.js'
	]
};
