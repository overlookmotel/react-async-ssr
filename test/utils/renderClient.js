/* --------------------
 * react-async-ssr module
 * Tests utility functions
 * Client-side render (hydration)
 * ------------------*/

'use strict';

// Modules
const util = require('util'),
	{JSDOM, VirtualConsole} = require('jsdom'),
	cheerio = require('cheerio'),
	fs = require('fs-extra');

// Exports

module.exports = renderClient;

// Init vars to hold React + ReactDOM javascript file contents
// They will be loaded when required
let reactScript, reactDomScript;
const envPostfix = process.env.NODE_ENV === 'production' ? 'production.min' : 'development';

/**
 * LoadCounter class.
 * `.loading()` / `.loaded()` increment/decrement a counter.
 * `.await()` returns a promise which resolves when counter reaches zero.
 */
class LoadCounter {
	constructor() {
		this._numPending = 0;
		this._promise = new Promise((resolve) => {
			this._resolve = resolve;
		});
	}

	loading() {
		this._numPending++;
	}

	loaded() {
		this._numPending--;
		if (this._numPending === 0) this._resolve();
	}

	await() {
		if (this._numPending === 0) return Promise.resolve();
		return this._promise;
	}
}

/**
 * Hydrate React element in browser DOM (JSDOM) and:
 *   - Check client HTML after hydration is same as server-rendered HTML
 *   - Check no hydration errors (this check currently disabled due to problem in ReactDOM)
 *   - Wait for all lazy components to load (ones which were not rendered on server), and check
 *     final HTML is what it should be
 *
 * @param {string} html - Server-rendered HTML of element
 * @param {string} finalHtml - HTML expected after all lazy elements resolved
 * @param {Function} makeElement - Function to make React element to hydrate in place of HTML.
 *   Is called with `(React, loadCounter)`.
 * @returns {undefined}
 */
async function renderClient(html, finalHtml, makeElement) {
	// Load React + ReactDOM Javascript
	if (!reactScript) {
		reactScript = await readModuleFile(`react/umd/react.${envPostfix}.js`);
		reactDomScript = await readModuleFile(`react-dom/umd/react-dom.${envPostfix}.js`);
	}

	// Init virtual console - save any output to output array
	const virtualConsole = new VirtualConsole();
	const output = [];
	for (const method of ['log', 'error', 'warn', 'info', 'debug', 'trace', 'dir', 'dirxml']) {
		virtualConsole.on(
			method, (message, ...args) => output.push([method, util.format(message, ...args)])
		);
	}

	// Init loading counter
	const loadCounter = new LoadCounter();

	// Init DOM with server-rendered HTML
	const dom = new JSDOM(`<html><body><div id="app">${html}</div></body></html>`, {
		runScripts: 'dangerously',
		virtualConsole
	});
	const {window} = dom;

	window.eval(reactScript);
	window.eval(reactDomScript);
	window._element = makeElement(window.React, loadCounter);

	// Hydrate
	await new Promise((resolve) => {
		window._done = resolve;
		window.eval("ReactDOM.hydrate(window._element, document.querySelector('#app'), _done);");
	});

	// Check HTML matches server rendered HTML.
	// Strip out invisible elements first.
	// ReactDOM 16.8.6 renders elements inside a suspended `Suspense`, but with `display:none` style.
	// It does rehydrate as it should, but logs errors to console about missing server-rendered content.
	// So to check HTML is what it should be after hydration, need to strip out the elements with
	// `style="display:none"` from client-side HTML.
	// Hydrated client-side HTML also includes some `<!-- -->` blocks in wrong places and
	// sometimes `<div data-reactroot>` rather than `<div data-reactroot="">`.
	// Standardize these too, before comparing HTML.
	const appDiv = window.document.querySelector('#app');
	const clientHtml = removeHiddenElements(appDiv.innerHTML);

	expectHtmlMatch(clientHtml, html, 'hydration');

	// Output console errors
	// Ignore console output as ReactDOM erroneously warns when it shouldn't
	// TODO Try to fix this is ReactDOM!

	// expect(output).toEqual([]);

	// Wait for all lazy components to load + check final HTML matches expected
	await loadCounter.await();
	expectHtmlMatch(appDiv.innerHTML, finalHtml, 'loaded');
}

function readModuleFile(path) {
	return fs.readFile(require.resolve(path), 'utf8');
}


/**
 * Expect client-side HTML to match expected.
 * Calls `expect()` and re-writes error message to include what phase the mismatch occurred in.
 * @param {string} html - Client HTML
 * @param {string} expectedHtml - Expected HTML
 * @param {string} phase - Phase where testing (hydration or loaded)
 */
function expectHtmlMatch(html, expectedHtml, phase) {
	try {
		expect(standardizeHtml(html)).toBe(standardizeHtml(expectedHtml));
	} catch (err) {
		const [, message] = err.message.match(/^.+\n\n([\s\S]+)$/) || [];
		if (message) err.message = `Client HTML not as expected after ${phase}.\n\n${message}`;

		throw err;
	}
}

/**
 * Standardize HTML - remove differences between server and client rendered HTML
 * which make no difference to render.
 * Remove:
 *   - `data-reactroot` + `data-reactroot=""` attributes
 *   - `style=""` attributes
 *   - `<!-- -->` blocks
 *
 * @param {string} html - Input HTML
 * @returns {string} - Standardized HTML
 */
function standardizeHtml(html) {
	return html.replace(/^(<[^ ]+) data-reactroot(?:="")?/, (_, tag) => tag)
		.replace(/(<[^ ]+) style=""/g, (_, tag) => tag)
		.replace(/<!-- -->/g, '');
}

/**
 * Remove elements from HTML with `style="display:none"`.
 * @param {string} html - HTML
 * @returns {string} - HTML with hidden elements removed
 */
function removeHiddenElements(html) {
	const $ = cheerio.load(`<div id="app">${html}</div>`);
	$('*').each((index, element) => {
		element = $(element);
		if (element.css('display') === 'none') element.remove();
	});
	return $('#app').html();
}
