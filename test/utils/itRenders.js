/* --------------------
 * react-async-ssr module
 * Tests
 * `itRenders` utility function
 * ------------------*/

'use strict';

// Modules
const React = require('react'),
	{renderToString, renderToStaticMarkup} = require('react-dom/server'),
	{renderToStringAsync, renderToStaticMarkupAsync} = require('react-async-ssr');

// Imports
const {lazy, lazySync, lazyClient} = require('./lazy.js'),
	{SuspenseSync, SuspendedSync} = require('./suspense.js'),
	wrapItRenders = require('./wrapItRenders.js'),
	renderClient = require('./renderClient.js');

// Exports

// Wrap `itRenders` to add `.only`, `.skip` and `.extend` methods
module.exports = wrapItRenders(itRenders, describe); // eslint-disable-line jest/no-export

/**
 * Render a React element
 *   - both non-statically (`renderToStringAsync`) and statically (`renderToStaticMarkupAsync`)
 *   - in both fallback fast modes - disabled / enabled
 * and run provided test functions or compare HTML to expected.
 *
 * Behaviour depends on options provided. Options are taken as an options object.
 *
 * The following options are compulsory:
 *   - `element`
 *   - At least one of `html` (or both `htmlStatic` and `htmlNonStatic`), `test` or `testPromise`
 *
 * DEFINING COMPONENT UNDER TEST
 * Define the component under test by providing an `element` function.
 *
 * `element` function will be called with a `context` object containing:
 *   - `Suspense` - `React.Suspense` for async render, a mock for sync render
 *   - `Suspended` - Use this in place of `Suspense` for Suspense boundaries which will have
 *     fallback triggered. Is `React.Suspense` for async render, a mock for sync render.
 *   - `lazy` - Function to create a lazy element. Should be passed a function which returns
 *     a component, and can be provided options as 2nd arg e.g. `{noSsr: true}`
 *   - `isStatic` (boolean) - `true` if is static render, `false` if non-static
 *   - `openTag` (string) - `' data-reactroot=""'` if static render, `''` if not
 *   - `fallbackFast` (boolean) - `true` if fallbackFast mode enabled, `false` if disabled
 *
 * Optionally, can also provide `prep` function.
 * `prep` function is called before `element` function, and can be used to add components to the
 * `context` object which is passed to `element`, `test`, `testPromise` and `html`.
 * Return value of `prep` is merged into `context`.
 * Useful if you want to check properties of the component later in `test` or `testPromise`.
 *
 * e.g.:
 * ```js
 * itRenders('div inside functional component', {
 *   prep: () => ( { Foo: jest.fn( () => <div>Foo!</div> ) } ),
 *   element: ( { Foo } ) => <Foo />,
 *   html: ( { openTag } ) => `<div${openTag}>Foo!</div>`,
 *   test: ( { Foo } ) => { expect(Foo).toHaveBeenCalled(); }
 * });
 * ```
 *
 * TESTING CORRECT HTML RENDERED
 * To test if rendered HTML is correct, provide either:
 *   - `html` option - will be used for both static and non-static renders
 *   - `htmlStatic` and `htmlNonStatic` options - will be used for their respective cases
 * Any of above options can be either a string or function.
 * If a function, function will be called with `context` object and expected to return HTML.
 *
 * Testing HTML output will be done 3 times:
 *   1. Test HTML matches expected (provided by `html` / `htmlStatic` / `htmlNonStatic`)
 *   2. Test HTML from async render is same as from sync render using `ReactDOM.renderToString()`
 *   3. Test HTML hydrates correctly on client
 *
 * TESTING OTHER THINGS
 * Provide a `test` or `testPromise` function.
 * Both functions will be called with `context` object, and its return value awaited,
 * so `testPromise` can be async.
 *
 *   - `testPromise` is called after render has begun, but promise is not resolved/rejected yet.
 *     `context.promise` contains the promise. Can be used to check e.g. for promise rejections.
 *   - `test` is called after render promise has resolved. `context.html` contains the rendered HTML.
 *
 * Can be combined with HTML testing too. Just provide both `test` / `testPromise` and `html` options.
 *
 * SKIPPING FALLBACK FAST MODES
 * By default, tests are run in both fallback fast modes - enabled and disabled.
 * To run in only one mode or the other, provide `fallbackFast` option.
 *   - `true` = Run with fallback fast mode enabled only
 *   - `false` = Run with fallback fast mode disabled only
 *   - `null` / `undefined` = Run in both modes (default)
 *
 * @param {string} testName - Test name
 * @param {Object} options - Options object
 * @param {Function} options.element - Function which returns element to render
 * @param {Function} [options.prep] - Prep function, is run before `element`
 * @param {Function} [options.test] - Test function
 * @param {Function} [options.testPromise] - Test function to run before promise awaited
 * @param {Function} [options.html] - Function to produce expected HTML
 * @param {boolean} [options.fallbackFast=null] - `true` or `false` to only run with fallback fast mode
 *   enabled/disabled. Default is to run in both modes.
 * @param {Function} _describe - `describe` method to use - injected by `wrapItRenders`
 * @returns {undefined}
 */
function itRenders(testName, options, _describe) {
	describeRenderMethods(testName, (props) => {
		// Get correct HTML depending on whether static test or not
		let htmlFn = props.isStatic ? options.htmlStatic : options.htmlNonStatic;
		if (htmlFn == null) htmlFn = options.html;

		// If expected HTML provided, check for it.
		// Either way, run any `test` or `testPromise` functions.
		if (htmlFn != null) {
			describe(props.methodName, () => {
				if (options.test || options.testPromise) {
					itHasBehavior('has expected behavior', props, options);
				}

				itRendersExpectedHtml(props, options, htmlFn);
			});
		} else {
			if (!options.test && !options.testPromise) throw new Error('Test contains nothing to test');
			itHasBehavior(props.methodName, props, options);
		}
	}, options.fallbackFast, _describe);
}

function itRendersExpectedHtml(props, options, htmlFn) {
	it('renders expected', async () => {
		// Render element async
		const context = renderAsync(props, options);
		const html = await context.promise;

		// Check HTML output is as expected
		// NB Remove line breaks and spacing around them in expected HTML
		// to allow easy layout of HTML in tests - '<div>  \n  <span>' => '<div><span>'
		let expectedHtml = htmlFn;
		if (typeof expectedHtml === 'function') expectedHtml = expectedHtml(context);
		expectedHtml = expectedHtml.replace(/\s*(?:\r?\n|^|$)\s*/g, '');

		expect(html).toBe(expectedHtml);
	});

	it('renders same as sync', async () => {
		// Render element async
		const html = await renderAsync(props, options).promise;

		// Render element sync
		const contextSync = makeElement(props, options, {
			React,
			Suspense: SuspenseSync,
			Suspended: SuspendedSync,
			lazy: lazySync
		});

		const {renderSync} = props;
		const syncHtml = renderSync(contextSync.element);

		// Check async + sync HTML output match
		expect(html).toBe(syncHtml);
	});

	if (!props.isStatic) {
		it('rehydrates correctly on client', async () => { // eslint-disable-line jest/expect-expect
			// Render element on server
			const html = await renderAsync(props, options).promise;

			// Render final HTML expected after loading of all lazy components
			const contextFinal = makeElement(props, options, {
				React,
				Suspense: SuspenseSync,
				Suspended: SuspenseSync,
				lazy: lazySync
			});

			const {renderSync} = props;
			const finalHtml = renderSync(contextFinal.element);

			// Render in JSDOM client (`renderClient()` throws if HTML mismatch)
			await renderClient(html, finalHtml, options.hydrationWarning, (ReactClient, loadCounter) => (
				makeElement(props, options, {
					React: ReactClient,
					Suspense: ReactClient.Suspense,
					Suspended: ReactClient.Suspense,
					lazy: (component, lazyOptions) => lazyClient(component, lazyOptions, loadCounter)
				}).element
			));
		});
	}
}

function itHasBehavior(testName, props, options) {
	it(testName, async () => { // eslint-disable-line jest/expect-expect
		const {test: testFn, testPromise} = options;

		// Render element
		const context = renderAsync(props, options);

		// Run `testPromise` tests prior to promise resolving
		if (testPromise) await testPromise(context);

		// Run `test` function if provided
		const {promise} = context;
		if (testFn) {
			// Wait for render to complete
			context.html = await promise;

			await testFn(context);
		} else {
			// Wait for render to complete, ignoring errors
			await promise.catch(() => {});
		}
	});
}

/**
 * Render async.
 * @param {Object} props - Properties
 * @param {Object} options - Options
 * @returns {Object} - Context object
 */
function renderAsync(props, options) {
	// Make element
	const context = makeElement(props, options, {
		React,
		Suspense: React.Suspense,
		Suspended: React.Suspense,
		lazy
	});

	// Render
	const renderAsyncFn = props.renderAsync;
	const promise = renderAsyncFn(context.element);
	context.promise = promise;

	// Prevent unhandled rejection
	promise.catch(() => {});

	// Return context (which includes promise)
	return context;
}

/**
 * Make context and create element using `prep` and `element` functions.
 * @param {Object} props - Properties
 * @param {Object} options - Options
 * @param {Object} renderFunctions - Render functions
 * @returns {Object} - Context object
 */
function makeElement({isStatic, fallbackFast}, {element: elementFn, prep}, renderFunctions) {
	// Init context object which is passed to all test functions
	const context = {
		isStatic,
		fallbackFast,
		openTag: isStatic ? '' : ' data-reactroot=""',
		...renderFunctions
	};

	// Run prep
	if (prep) Object.assign(context, prep(context));

	// Render element
	context.element = elementFn(context);

	// Return context
	return context;
}

/**
 * Describe render methods.
 *
 * Matrix of:
 *   - Non-static (`renderToStringAsync`) / static (`renderToStaticMarkupAsync`)
 *   - Fallback mode enabled / disabled
 *
 * If `fallbackFast` arg is non-null, only one of fallbackFast enabled/disabled cases is run:
 *   - `true` = enabled
 *   - `false` = disabled
 *   - `null` = both cases
 *
 * Calls callback for each of above cases, with an object with properties:
 *   - `.methodName` (string) - Name of method being tested
 *   - `.renderAsync` (function) - `renderToStringAsync` or `renderToStaticMarkupAsync`
 *   - `.renderSync` (function) - ReactDOMServer's `renderToString` or `renderToStaticMarkup`
 *   - `.isStatic` (boolean) - `true` if static render
 *   - `.fallbackFast` (boolean) - `true` if fallbackFast mode enabled
 *
 * @param {string} testName - Test name
 * @param {Function} fn - Callback
 * @param {boolean|null} fallbackFast - `true` or `false` to only run in 1 mode, `null` for both
 * @param {Function} _describe - Describe function to use for outer test block
 *   (can equal `describe`, `describe.only` or `describe.skip`)
 * @returns {undefined}
 */
function describeRenderMethods(testName, fn, fallbackFast, _describe) {
	_describe(testName, () => {
		if (fallbackFast != null) {
			// Fallback option specified - only run in that mode
			callbackWithRenderMethods(fn, fallbackFast);
		} else {
			// Not specified - run in both modes
			describe.eachObject([
				{mode: 'off', fallbackFast: false},
				{mode: 'on', fallbackFast: true}
			])('fallbackFast mode $mode', (props) => {
				callbackWithRenderMethods(fn, props.fallbackFast);
			});
		}
	});
}

function callbackWithRenderMethods(fn, fallbackFast) {
	const cases = [
		{
			methodName: 'renderToStringAsync',
			renderAsync: element => renderToStringAsync(element, {fallbackFast}),
			renderSync: renderToString,
			isStatic: false
		},
		{
			methodName: 'renderToStaticMarkupAsync',
			renderAsync: element => renderToStaticMarkupAsync(element, {fallbackFast}),
			renderSync: renderToStaticMarkup,
			isStatic: true
		}
	];

	for (const _case of cases) {
		_case.fallbackFast = fallbackFast;
		fn(_case);
	}
}
