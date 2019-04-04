/* --------------------
 * react-async-ssr module
 * Expect extensions
 * ------------------*/

/* eslint-disable no-multi-assign */

'use strict';

// Modules
const {ABORT, ON_MOUNT} = require('../../symbols');

// Imports
const {TEST_LAZY} = require('./symbols');

// Exports

/*
 * Expect extensions
 */
const extensions = {};

extensions.toBeAborted = extensions.toAbort = function(Component) {
	const message = `Expected ${componentName(Component)} ${this.isNot ? 'not ' : ''}to be aborted`;

	// Check `[ABORT]` called correctly if was called
	const {fail, mock, notCalled} = calledCorrectly(Component, ABORT);

	// Make `expect(C).not.toBeAborted()` not error if `C` never called
	if (notCalled && this.isNot) return failed(message);

	if (fail) return passedFailed(this, message, fail);

	// Check `[ABORT]` called no more than once
	const {calls} = mock;
	if (calls.length > 1) return passedFailed(this, message, `it was aborted ${calls.length} times`);

	// Check aborted
	if (mock.calls.length === 0) return failed(message);
	return passed(message);
};

extensions.toBeMounted = extensions.toMount = function(Component) {
	const message = mountBaseMessage(this, Component);

	// Check `[ON_MOUNT]` called no more than once and with 1 boolean arg only
	const {fail, mock, notCalled} = mountCalledCorrectly(Component);

	// Make `expect(C).not.toBeMounted()` not error if `C` never called
	if (notCalled && this.isNot) return failed(message);

	if (fail) return passedFailed(this, message, fail);

	// Check mounted
	if (mock.calls.length === 0) return failed(message);
	return passed(message);
};

extensions.toBeMountedWith = extensions.toMountWith = function(Component, value) {
	// Disallow `.not.toBeMountedWith()`
	if (this.isNot) return passed('`.toBeMountedWith()` cannot be modified with `.not`');

	const message = `${mountBaseMessage(this, Component)} with ${value}`;

	// Check was mounted and and mount called correctly
	const {fail, mock} = wasMounted(Component);
	if (fail) return passedFailed(this, message, fail);

	// Check mounted with correct value
	const actualValue = mock.calls[0][0];
	if (actualValue !== value) return failed(message, `it was mounted with ${actualValue}`);

	// Passed
	return passed(message);
};

extensions.toBeMountedBefore = extensions.toMountBefore = function(Component1, Component2) {
	// Disallow `.not.toBeMountedBefore()`
	if (this.isNot) return passed('`.toBeMountedBefore()` cannot be modified with `.not`');

	const message = `${mountBaseMessage(this, Component1)} before ${componentName(Component2)}`;

	// Check both were mounted and mount called correctly
	const {fail: fail1, mock: mock1} = wasMounted(Component1, true);
	if (fail1) return passedFailed(this, message, fail1);
	const {fail: fail2, mock: mock2} = wasMounted(Component2, true);
	if (fail2) return passedFailed(this, message, fail2);

	// Check mounted in correct order
	if (mock1.invocationCallOrder[0] > mock2.invocationCallOrder[0]) return failed(message, 'it was mounted after');

	// Passed
	return passed(message);
};

extensions.toBeMountedAfter = extensions.toMountAfter = function(Component1, Component2) {
	// Disallow `.not.toBeMountedAfter()`
	if (this.isNot) return passed('`.toBeMountedAfter()` cannot be modified with `.not`');

	const message = `${mountBaseMessage(this, Component1)} after ${componentName(Component2)}`;

	// Check both were mounted and and mount called correctly
	const {fail: fail1, mock: mock1} = wasMounted(Component1, true);
	if (fail1) return passedFailed(this, message, fail1);
	const {fail: fail2, mock: mock2} = wasMounted(Component2, true);
	if (fail2) return passedFailed(this, message, fail2);

	// Check mounted in correct order
	if (mock1.invocationCallOrder[0] < mock2.invocationCallOrder[0]) return failed(message, 'it was mounted before');

	// Passed
	return passed(message);
};

module.exports = extensions;

/*
 * Helper functions
 */

/**
 * Get component name
 * @param {*} Component - Component
 * @returns {string} - Component name
 */
function componentName(Component) {
	if (typeof Component !== 'function') return 'component';
	return componentNameSimple(Component);
}

function componentNameSimple(Component) {
	return Component.displayName || Component.name || 'component';
}

/**
 * Produce base for message for success/failure of expectations about mounting
 * @param {Object} expectation - Expectation object which `expect.extend` function called with
 * @param {*} Component - Component
 * @returns {string} - Message base
 */
function mountBaseMessage(expectation, Component) {
	return `Expected ${componentName(Component)} ${expectation.isNot ? 'not ' : ''}to be mounted`;
}

/**
 * Check component provided is a test lazy component (created by `lazy()` in test utils),
 * that component was called, and that `[ON_MOUNT]` was called correctly.
 * @param {*} Component - Component to check
 * @param {boolean} [useName=false] - `true` if error messages should contain component name
 * @returns {Object} - Result object
 * @returns {string} [.fail] - Failure message (if failed)
 * @returns {string} .name - Component name
 * @returns {Object} .mock - Jest mock object for function under test
 */
function wasMounted(Component, useName) {
	// Check mount called correctly
	const res = mountCalledCorrectly(Component, useName);
	if (res.fail) return res;

	// Check was mounted
	if (res.mock.calls.length === 0) res.fail = `${useName ? res.name : 'it'} was not mounted`;
	return res;
}

/**
 * Check component provided is a test lazy component (created by `lazy()` in test utils),
 * that component was called, and that `[ON_MOUNT]` was called correctly.
 * @param {*} Component - Component to check
 * @param {boolean} [useName=false] - `true` if error messages should contain component name
 * @returns {Object} - Result object
 * @returns {string} [.fail] - Failure message (if failed)
 * @returns {string} .name - Component name
 * @returns {Object} .mock - Jest mock object for function under test
 */
function mountCalledCorrectly(Component, useName) {
	// Check is valid test lazy component and mock present
	const res = calledCorrectly(Component, ON_MOUNT, useName);
	if (res.fail) return res;

	// Check mount called correctly
	res.fail = mountCalledCorrectlyFailMessage(res, useName);
	return res;
}

function mountCalledCorrectlyFailMessage(res, useName) {
	// Check was not mounted more than once
	const {mock, name} = res,
		{calls} = mock;
	if (calls.length > 1) return `${useName ? name : 'it'} was mounted ${calls.length} times`;
	if (calls.length === 0) return null;

	// Check was called with 1 arg only and arg was boolean
	const [call] = calls;
	if (call.length === 0) return `${useName ? name : ''}[ON_MOUNT] was called with no arguments`;
	if (call.length > 1) return `${useName ? name : ''}[ON_MOUNT] was called with ${call.length} arguments`;
	if (typeof call[0] !== 'boolean') return `${useName ? name : ''}[ON_MOUNT] was not called with a boolean - called with ${call[0]}`;
	return null;
}

/**
 * Check component provided is a test lazy component (created by `lazy()` in test utils)
 * and component was called.
 * @param {*} Component - Component to check
 * @param {string} key - Key on promise to check e.g. `ON_MOUNT`
 * @param {boolean} [useName=false] - `true` if error messages should contain component name
 * @returns {Object} - Result object
 * @returns {string} [.fail] - Failure message (if failed)
 * @returns {string} .name - Component name
 * @returns {Object} .mock - Jest mock object for function under test
 */
function calledCorrectly(Component, key, useName) {
	if (typeof Component !== 'function') return {fail: 'it is not a component'};

	const name = componentNameSimple(Component);
	if (!Component[TEST_LAZY]) return {fail: `${useName ? name : 'it'} is not a test lazy component`, name};

	const {promise} = Component;
	if (!promise) return {fail: `${useName ? name : 'it'} was not called`, name, notCalled: true};

	return {name, mock: promise[key].mock};
}

/*
 * Functions to return result in format jest requires
 */
function passed(message, message2) {
	return result(true, message, message2);
}

function failed(message1, message2) {
	return result(false, message1, message2);
}

// Return pass or fail depending on whether expectation is negated
// e.g. `expect(C).not.toBe...`
function passedFailed(expectation, message1, message2) {
	return result(expectation.isNot, message1, message2);
}

function result(pass, message, message2) {
	if (message2) message += ` - ${message2}`;
	return {pass, message: () => message};
}
