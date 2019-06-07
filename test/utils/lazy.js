/* --------------------
 * react-async-ssr module
 * Tests utility functions
 * Functions to create "lazy" components
 * ------------------*/

'use strict';

// Modules
const React = require('react'),
	{NO_SSR, ABORT, ON_MOUNT} = require('../../symbols');

// Imports
const {TEST_LAZY} = require('./symbols');

// Exports
module.exports = {
	lazy,
	lazySync,
	lazyClient
};

/**
 * Function to simulate lazy components.
 * Returns a component which throws a promise when first rendered,
 * and if re-rendered after promise has resolved, returns an element made from
 * the provided component.
 * If `.noSsr` option set, throws a promise with `[NO_SSR]` property.
 *
 * @param {Function} component - Component to render
 * @param {Object} [options] - Options object
 * @param {boolean} [options.noSsr=false] - If `true`, throws promise with `[NO_SSR]` property
 * @param {boolean} [options.noResolve=false] - If `true`, throws promise that never resolves
 * @param {number} [options.delay=undefined] - If provided, throws promise that delays
 *   provided number of ms before resolving
 * @returns {Function} - React component
 */
function lazy(component, options) {
	if (!options) options = {};

	let loaded = false,
		promise;
	let Lazy = function LazyComponent(props) {
		if (loaded) return React.createElement(component, props);

		if (!promise) {
			if (options.noSsr) {
				promise = new Promise(() => {});
				promise[NO_SSR] = true;
			} else if (options.noResolve) {
				promise = new Promise(() => {});
			} else if (options.delay != null) {
				promise = new Promise((resolve) => {
					setTimeout(() => {
						loaded = true;
						resolve();
					}, options.delay);
				});
			} else {
				promise = new Promise((resolve) => {
					loaded = true;
					resolve();
				});
			}

			promise[ABORT] = jest.fn(); // Spy
			promise[ON_MOUNT] = jest.fn(); // Spy
			Lazy.promise = promise;
		}

		throw promise;
	};

	Lazy = jest.fn(Lazy); // Spy
	Lazy.displayName = 'Lazy';

	Lazy[TEST_LAZY] = true;

	return Lazy;
}

/**
 * Sync version of `lazy()` for sync rendering.
 * Returns a component which just wraps the input component.
 * @param {Function} component - Component to render
 * @returns {Function} - React component
 */
function lazySync(component) {
	return function LazyComponent(props) {
		return React.createElement(component, props);
	};
}

/**
 * Client-side version of `lazy()`.
 * Return a component which:
 *   - If no-SSR mode, throw Promise which never resolves.
 *   - Otherwise, renders input component.
 *
 * @param {Function} component - Component to render
 * @param {Object} [options] - Options object
 * @param {Object} loadCounter - Load counter object - used in client-side render
 * @returns {Function} - React component
 */
function lazyClient(component, options, loadCounter) {
	if (!options) options = {};
	if (options.noResolve) throw new Error('Cannot render on client with `noResolve` option');

	// If not No SSR, return component which renders input component immediately
	if (!options.noSsr) return lazySync(component);

	// Return component which loads async
	let loaded = false,
		promise;
	return function LazyComponent(props) {
		if (loaded) return React.createElement(component, props);

		if (!promise) {
			loadCounter.loading();

			promise = new Promise((resolve) => {
				setTimeout(() => {
					loaded = true;
					resolve();
					loadCounter.loaded();
				}, 0);
			});
		}

		throw promise;
	};
}
