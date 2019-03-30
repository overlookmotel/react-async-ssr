/* eslint-disable no-console, no-unused-vars */
'use strict';

process.on('unhandledRejection', err => {
	console.log('Unhandled rejection');
	throw err;
});

require('util').inspect.defaultOptions.depth = 5;

// Modules
const React = require('react'),
	{Suspense} = React,
	pretty = require('pretty');

const ssr = require('../index');

// Lazy component factories
function lazy(component, options) {
	if (!options) options = {};

	let loaded = false, promise;
	const Lazy = function Lazy(props) {
		if (loaded) return React.createElement(component, props);

		if (!promise) {
			if (options.noSsr) {
				promise = new Promise(() => {});
				promise.noSsr = true;
			} else if (options.noResolve) {
				promise = new Promise(() => {});
			} else if (options.delay != null) {
				promise = new Promise(resolve => {
					setTimeout(() => {
						loaded = true;
						resolve();
					}, options.delay);
				});
			} else {
				promise = new Promise(resolve => {
					loaded = true;
					resolve();
				});
			}

			Lazy.promise = promise;
		}

		throw promise;
	};

	return Lazy;
}

function lazySync(component) {
	let loaded = false;
	return function LazyComponent(props) {
		if (loaded) return React.createElement(component, props);

		loaded = true;
		throw {then: fn => fn()};
	};
}

/*
 * Tests
 */

/*
const LazyInner = lazy(() => <div>Lazy inner</div>, {noSsr: true});
const Lazy = lazy(() => <div>Before Lazy Layer 1<LazyInner/>After Lazy Layer 1</div>);

const e = (
	<div>
		<div>Before Suspense</div>
		<Suspense fallback={<span>Fallback</span>}>
			<div>Before Lazy</div>
			<Lazy/>
			<div>After Lazy</div>
		</Suspense>
		<div>After Suspense</div>
	</div>
);

ssr.renderToStringAsync(e).then(
	out => {
		console.log('Output:', out);
		console.log('-----');
		console.log(pretty(out));
	},
	err => console.log('ERROR:', err)
);
*/

const LazyInner = lazy(() => <div>Lazy</div>);
const Lazy = lazy(() => <LazyInner/>);
const Fallback = () => <span>Fallback 1</span>;

const e = (
	<div>
		<Suspense fallback={<span>Fallback outer</span>}>
			<Lazy/>
		</Suspense>
	</div>
);

async function run() {
	const out = await ssr.renderToStringAsync(e);

	console.log('Output:', out);
	console.log('-----');
	console.log(pretty(out));
}

run().then(
	() => console.log('DONE'),
	err => console.log('ERROR:', err)
);
