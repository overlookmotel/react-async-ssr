'use strict';

module.exports = {
	extends: [
		'@overlookmotel/eslint-config-jest',
		'@overlookmotel/eslint-config-react'
	],
	rules: {
		'react/no-multi-comp': ['off'],
		'react/jsx-filename-extension': ['error', {extensions: ['.jsx', '.test.js']}]
	}
};
