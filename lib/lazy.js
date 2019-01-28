/* --------------------
 * react-async-ssr module
 * `lazy` method
 * ------------------*/

'use strict';

// Modules
const {createElement} = require('react');

// Imports
const {NO_SSR} = require('./constants');

// Exports
const isServer = typeof window === 'undefined';
const noSsrPromise = new Promise(() => {});
noSsrPromise[NO_SSR] = true;

/**
 * Create a lazy-loaded component, to work with `React.Suspense`.
 * When returned component is first rendered, it calls `ctor()` which should return a Promise.
 * Component throws the Promise.
 * Once promise resolves, further renders will render the loaded component.
 *
 * If `options.ssr === false`, and is rendered on server side, promise will be flagged `noSsr`,
 * `ctor()` will not be called, and promise will never resolve.
 *
 * @param {Function} ctor - Function to call to load component. Must return a Promise.
 * @param {Object} [options] - Options object
 * @param {boolean} [options.ssr = true] - If falsy then component will not be rendered on server
 * @returns {Function} - Lazy component
 */
module.exports = function lazy(ctor, options) {
	let noSsr = options ? options.ssr !== undefined && !options.ssr : false;

	let loaded = false, errored = false, error, promise, component;
	return function LazyComponent(props) {
		if (loaded) return createElement(component, props);
		if (errored) throw error;

		if (noSsr && isServer) throw noSsrPromise;

		if (!promise) {
			promise = Promise.resolve(ctor()).then(
				c => {
					loaded = true;
					component = c;
				},
				err => {
					errored = true;
					error = err;
				}
			);
		}

		throw promise;
	};
};
