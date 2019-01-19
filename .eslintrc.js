'use strict';

module.exports = {
	env: {
		node: true
	},
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module'
	},
	extends: [
		'eslint:recommended'
	],
	rules: {
		// Basic rules
		indent: ['error', 'tab'],
		'linebreak-style': ['error', 'unix'],
		quotes: ['error', 'single'],
		semi: ['error', 'always'],

		// Enable all "Possible Errors" rules not already enabled in `eslint:recommended`
		// https://eslint.org/docs/rules/#possible-errors
		'no-async-promise-executor': ['error'],
		'no-extra-parens': ['error'],
		'no-misleading-character-class': ['error'],
		'no-prototype-builtins': ['error'],
		'no-template-curly-in-string': ['error'],
		'require-atomic-updates': ['error'],
		'valid-jsdoc': ['error'],

		// Various other rules
		'no-use-before-define': ['error', {functions: false}],
		'no-unused-expressions': ['error'],
		'no-var': ['error'],
		'no-loop-func': ['error'],
		'no-useless-call': ['error'],
		'no-eval': ['error'],
		'no-shadow-restricted-names': ['error']
	},
	globals: {
		Promise: true
	}
};
