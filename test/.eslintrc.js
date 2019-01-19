'use strict';

module.exports = {
	env: {
		mocha: true
	},
	plugins: [
		'chai-friendly'
	],
	rules: {
		'no-unused-expressions': ['off'],
		'chai-friendly/no-unused-expressions': ['error']
	}
};
