/* --------------------
 * react-async-ssr module
 * Tests
 * ------------------*/

'use strict';

// Modules
const React = require('react');

// Imports
const itRenders = require('./utils/itRenders');

// Init
require('./utils');

// Tests

describe('suspense spaces correctly', () => {
	const itRendersWithFallback = itRenders.extend({
		prep: () => ({
			fallback: <div>Loading...</div>
		})
	});

	describe('with string inside Suspense', () => {
		itRendersWithFallback('only', {
			element: ({Suspense, fallback}) => (
				<Suspense fallback={fallback}>Inside</Suspense>
			),
			html: 'Inside'
		});

		describe('and string(s)', () => {
			itRendersWithFallback('before', {
				element: ({Suspense, fallback}) => (
					<div>
						Before
						<Suspense fallback={fallback}>Inside</Suspense>
					</div>
				),
				htmlStatic: '<div>BeforeInside</div>',
				htmlNonStatic: '<div data-reactroot="">Before<!-- -->Inside</div>'
			});

			itRendersWithFallback('after', {
				element: ({Suspense, fallback}) => (
					<div>
						<Suspense fallback={fallback}>Inside</Suspense>
						After
					</div>
				),
				htmlStatic: '<div>InsideAfter</div>',
				htmlNonStatic: '<div data-reactroot="">Inside<!-- -->After</div>'
			});

			itRendersWithFallback('before and after', {
				element: ({Suspense, fallback}) => (
					<div>
						Before
						<Suspense fallback={fallback}>Inside</Suspense>
						After
					</div>
				),
				htmlStatic: '<div>BeforeInsideAfter</div>',
				htmlNonStatic: '<div data-reactroot="">Before<!-- -->Inside<!-- -->After</div>'
			});
		});

		describe('and div(s)', () => {
			itRendersWithFallback('before', {
				element: ({Suspense, fallback}) => (
					<div>
						<div>Before</div>
						<Suspense fallback={fallback}>Inside</Suspense>
					</div>
				),
				html: ({openTag}) => `<div${openTag}><div>Before</div>Inside</div>`
			});

			itRendersWithFallback('after', {
				element: ({Suspense, fallback}) => (
					<div>
						<Suspense fallback={fallback}>Inside</Suspense>
						<div>After</div>
					</div>
				),
				html: ({openTag}) => `<div${openTag}>Inside<div>After</div></div>`
			});

			itRendersWithFallback('before and after', {
				element: ({Suspense, fallback}) => (
					<div>
						<div>Before</div>
						<Suspense fallback={fallback}>Inside</Suspense>
						<div>After</div>
					</div>
				),
				html: ({openTag}) => `<div${openTag}><div>Before</div>Inside<div>After</div></div>`
			});
		});
	});

	describe('with empty inside Suspense', () => {
		itRendersWithFallback('only', {
			element: ({Suspense, fallback}) => <Suspense fallback={fallback} />,
			html: ''
		});

		describe('and string(s)', () => {
			itRendersWithFallback('before', {
				element: ({Suspense, fallback}) => (
					<div>
						Before
						<Suspense fallback={fallback} />
					</div>
				),
				html: ({openTag}) => `<div${openTag}>Before</div>`
			});

			itRendersWithFallback('after', {
				element: ({Suspense, fallback}) => (
					<div>
						<Suspense fallback={fallback} />
						After
					</div>
				),
				html: ({openTag}) => `<div${openTag}>After</div>`
			});

			itRendersWithFallback('before and after', {
				element: ({Suspense, fallback}) => (
					<div>
						Before
						<Suspense fallback={fallback} />
						After
					</div>
				),
				htmlStatic: '<div>BeforeAfter</div>',
				htmlNonStatic: '<div data-reactroot="">Before<!-- -->After</div>'
			});
		});

		describe('and div(s)', () => {
			itRendersWithFallback('before', {
				element: ({Suspense, fallback}) => (
					<div>
						<div>Before</div>
						<Suspense fallback={fallback} />
					</div>
				),
				html: ({openTag}) => `<div${openTag}><div>Before</div></div>`
			});

			itRendersWithFallback('after', {
				element: ({Suspense, fallback}) => (
					<div>
						<Suspense fallback={fallback} />
						<div>After</div>
					</div>
				),
				html: ({openTag}) => `<div${openTag}><div>After</div></div>`
			});

			itRendersWithFallback('before and after', {
				element: ({Suspense, fallback}) => (
					<div>
						<div>Before</div>
						<Suspense fallback={fallback} />
						<div>After</div>
					</div>
				),
				html: ({openTag}) => `<div${openTag}><div>Before</div><div>After</div></div>`
			});
		});
	});

	describe('with div inside Suspense', () => {
		itRendersWithFallback('only', {
			element: ({Suspense, fallback}) => (
				<Suspense fallback={fallback}><div>Inside</div></Suspense>
			),
			html: ({openTag}) => `<div${openTag}>Inside</div>`
		});

		describe('and string(s)', () => {
			itRendersWithFallback('before', {
				element: ({Suspense, fallback}) => (
					<div>
						Before
						<Suspense fallback={fallback}><div>Inside</div></Suspense>
					</div>
				),
				html: ({openTag}) => `<div${openTag}>Before<div>Inside</div></div>`
			});

			itRendersWithFallback('after', {
				element: ({Suspense, fallback}) => (
					<div>
						<Suspense fallback={fallback}><div>Inside</div></Suspense>
						After
					</div>
				),
				html: ({openTag}) => `<div${openTag}><div>Inside</div>After</div>`
			});

			itRendersWithFallback('before and after', {
				element: ({Suspense, fallback}) => (
					<div>
						Before
						<Suspense fallback={fallback}><div>Inside</div></Suspense>
						After
					</div>
				),
				html: ({openTag}) => `<div${openTag}>Before<div>Inside</div>After</div>`
			});
		});

		describe('and div(s)', () => {
			itRendersWithFallback('before', {
				element: ({Suspense, fallback}) => (
					<div>
						<div>Before</div>
						<Suspense fallback={fallback}><div>Inside</div></Suspense>
					</div>
				),
				html: ({openTag}) => `<div${openTag}><div>Before</div><div>Inside</div></div>`
			});

			itRendersWithFallback('after', {
				element: ({Suspense, fallback}) => (
					<div>
						<Suspense fallback={fallback}><div>Inside</div></Suspense>
						<div>After</div>
					</div>
				),
				html: ({openTag}) => `<div${openTag}><div>Inside</div><div>After</div></div>`
			});

			itRendersWithFallback('before and after', {
				element: ({Suspense, fallback}) => (
					<div>
						<div>Before</div>
						<Suspense fallback={fallback}><div>Inside</div></Suspense>
						<div>After</div>
					</div>
				),
				html: ({openTag}) => `<div${openTag}><div>Before</div><div>Inside</div><div>After</div></div>`
			});
		});
	});
});
