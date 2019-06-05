/* --------------------
 * react-async-ssr module
 * Tests
 * `wrapItRenders` utility function
 * ------------------*/

'use strict';

// Exports
module.exports = wrapItRenders;

/**
 * Wrap `itRenders...` function to add `.only`, `.skip` and `.extend` properties.
 * `describe` function is passed to `itRenders...`.
 * The `itRenders...` function should use provided `describe` for root test blocks.
 *
 * @param {Function} fn - `itRenders...` function
 * @param {Function} upstream - Upstream function (e.g. `describe`)
 * @returns {Function} - Wrapped function
 */
function wrapItRenders(fn, upstream) {
	const wrapped = (testName, options) => fn(testName, options, upstream);
	wrapped.only = (testName, options) => fn(testName, options, upstream.only);
	wrapped.skip = (testName, options) => fn(testName, options, upstream.skip);
	wrapped.extend = options => extend(wrapped, options);
	return wrapped;
}

/**
 * Extend `itRenders` function with template.
 * Parameters in template are added before the options are applied.
 * @param {Function} itRenders - `itRenders` method to extend
 * @param {Object} template - Template
 * @param {Function} [template.prep] - Prep function extension
 * @param {Function} [template.element] - Element function
 * @returns {Function} - Wrapped `itRenders` function
 */
function extend(itRenders, template) {
	function extended(testName, options, itRendersSuper) {
		// Compose prep function with template prep function
		const templatePrep = template.prep,
			{prep} = options;
		if (templatePrep) {
			if (prep) {
				options.prep = composePrep(templatePrep, prep);
			} else {
				options.prep = templatePrep;
			}
		}

		// Add element function from template if not defined
		if (!options.element) options.element = template.element;

		return itRendersSuper(testName, options);
	}

	return wrapItRenders(extended, itRenders);
}

/**
 * Compose 2 or more prep functions.
 * @param {...Function} prepFns - Prep functions
 * @returns {Function} - Composed function
 */
function composePrep(...prepFns) {
	return function(context) {
		for (const prep of prepFns) {
			Object.assign(context, prep(context));
		}
		return context;
	};
}
