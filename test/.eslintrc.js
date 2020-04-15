/* --------------------
 * react-async-ssr module
 * ESLint tests config
 * ------------------*/

'use strict';

// Exports

module.exports = {
	extends: [
		'@overlookmotel/eslint-config-jest',
		'@overlookmotel/eslint-config-react'
	],
	parserOptions: {
		sourceType: 'script'
	},
	rules: {
		'react/no-multi-comp': ['off'],
		'react/jsx-filename-extension': ['error', {extensions: ['.jsx', '.test.js']}],
		'import/no-unresolved': ['error', {ignore: ['^react-async-ssr$']}],
		'node/no-missing-require': ['error', {allowModules: ['react-async-ssr']}]
	}
};
