/* --------------------
 * react-async-ssr module
 * Tests
 * Set-up
 * ------------------*/

'use strict';

// Add `jest-each-object` patches
require('jest-each-object/register');

// Add expect extensions
const extensions = require('./expectExtensions');

expect.extend(extensions);

// Throw any unhandled promise rejections
process.on('unhandledRejection', (err) => {
	console.log('Unhandled rejection'); // eslint-disable-line no-console
	throw err;
});
