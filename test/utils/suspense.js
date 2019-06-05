/* --------------------
 * react-async-ssr module
 * Tests
 * `Suspense` replacements for sync rendering
 * ------------------*/

'use strict';

// Exports
module.exports = {
	SuspenseSync,
	SuspendedSync
};

// Substitute for `<Suspense>` in sync rendering - just returns children.
function SuspenseSync(props) {
	return props.children || null;
}

// Substitute for `<Suspense fallback={...}>` - just returns fallback.
function SuspendedSync(props) {
	const {fallback} = props;
	if (fallback === undefined) return null;
	return fallback;
}
