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

describe('lazy-loaded components space correctly', () => {
	const itRendersWithFallback = itRenders.extend({
		prep: () => ({
			fallback: <div>Fallback</div>
		})
	});

	describe('with string inside lazy', () => {
		const itRendersWithLazy = itRendersWithFallback.extend({
			prep: ({lazy}) => ({
				Lazy: lazy(() => 'Inside')
			})
		});

		itRendersWithLazy('only', {
			element: ({Suspense, Lazy, fallback}) => (
				<Suspense fallback={fallback}><Lazy /></Suspense>
			),
			html: 'Inside'
		});

		describe('and string(s)', () => {
			itRendersWithLazy('before', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							Before
							<Lazy />
						</div>
					</Suspense>
				),
				htmlStatic: '<div>BeforeInside</div>',
				htmlNonStatic: '<div data-reactroot="">Before<!-- -->Inside</div>'
			});

			itRendersWithLazy('after', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							<Lazy />
							After
						</div>
					</Suspense>
				),
				htmlStatic: '<div>InsideAfter</div>',
				htmlNonStatic: '<div data-reactroot="">Inside<!-- -->After</div>'
			});

			itRendersWithLazy('before and after', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							Before
							<Lazy />
							After
						</div>
					</Suspense>
				),
				htmlStatic: '<div>BeforeInsideAfter</div>',
				htmlNonStatic: '<div data-reactroot="">Before<!-- -->Inside<!-- -->After</div>'
			});
		});

		describe('and div(s)', () => {
			itRendersWithLazy('before', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							<div>Before</div>
							<Lazy />
						</div>
					</Suspense>
				),
				html: ({openTag}) => `<div${openTag}><div>Before</div>Inside</div>`
			});

			itRendersWithLazy('after', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							<Lazy />
							<div>After</div>
						</div>
					</Suspense>
				),
				html: ({openTag}) => `<div${openTag}>Inside<div>After</div></div>`
			});

			itRendersWithLazy('before and after', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							<div>Before</div>
							<Lazy />
							<div>After</div>
						</div>
					</Suspense>
				),
				html: ({openTag}) => `<div${openTag}><div>Before</div>Inside<div>After</div></div>`
			});
		});
	});

	describe('with empty inside lazy', () => {
		const itRendersWithLazy = itRendersWithFallback.extend({
			prep: ({lazy}) => ({
				Lazy: lazy(() => null)
			})
		});

		itRendersWithLazy('only', {
			element: ({Suspense, Lazy, fallback}) => (
				<Suspense fallback={fallback}><Lazy /></Suspense>
			),
			html: ''
		});

		describe('and string(s)', () => {
			itRendersWithLazy('before', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							Before
							<Lazy />
						</div>
					</Suspense>
				),
				html: ({openTag}) => `<div${openTag}>Before</div>`
			});

			itRendersWithLazy('after', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							<Lazy />
							After
						</div>
					</Suspense>
				),
				html: ({openTag}) => `<div${openTag}>After</div>`
			});

			itRendersWithLazy('before and after', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							Before
							<Lazy />
							After
						</div>
					</Suspense>
				),
				htmlStatic: '<div>BeforeAfter</div>',
				htmlNonStatic: '<div data-reactroot="">Before<!-- -->After</div>'
			});
		});

		describe('and div(s)', () => {
			itRendersWithLazy('before', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							<div>Before</div>
							<Lazy />
						</div>
					</Suspense>
				),
				html: ({openTag}) => `<div${openTag}><div>Before</div></div>`
			});

			itRendersWithLazy('after', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							<Lazy />
							<div>After</div>
						</div>
					</Suspense>
				),
				html: ({openTag}) => `<div${openTag}><div>After</div></div>`
			});

			itRendersWithLazy('before and after', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							<div>Before</div>
							<Lazy />
							<div>After</div>
						</div>
					</Suspense>
				),
				html: ({openTag}) => `<div${openTag}><div>Before</div><div>After</div></div>`
			});
		});
	});

	describe('with div inside lazy', () => {
		const itRendersWithLazy = itRendersWithFallback.extend({
			prep: ({lazy}) => ({
				Lazy: lazy(() => <div>Inside</div>)
			})
		});

		itRendersWithLazy('only', {
			element: ({Suspense, Lazy, fallback}) => (
				<Suspense fallback={fallback}><Lazy /></Suspense>
			),
			html: ({openTag}) => `<div${openTag}>Inside</div>`
		});

		describe('and string(s)', () => {
			itRendersWithLazy('before', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							Before
							<Lazy />
						</div>
					</Suspense>
				),
				html: ({openTag}) => `<div${openTag}>Before<div>Inside</div></div>`
			});

			itRendersWithLazy('after', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							<Lazy />
							After
						</div>
					</Suspense>
				),
				html: ({openTag}) => `<div${openTag}><div>Inside</div>After</div>`
			});

			itRendersWithLazy('before and after', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							Before
							<Lazy />
							After
						</div>
					</Suspense>
				),
				html: ({openTag}) => `<div${openTag}>Before<div>Inside</div>After</div>`
			});
		});

		describe('and div(s)', () => {
			itRendersWithLazy('before', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							<div>Before</div>
							<Lazy />
						</div>
					</Suspense>
				),
				html: ({openTag}) => `<div${openTag}><div>Before</div><div>Inside</div></div>`
			});

			itRendersWithLazy('after', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							<Lazy />
							<div>After</div>
						</div>
					</Suspense>
				),
				html: ({openTag}) => `<div${openTag}><div>Inside</div><div>After</div></div>`
			});

			itRendersWithLazy('before and after', {
				element: ({Suspense, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							<div>Before</div>
							<Lazy />
							<div>After</div>
						</div>
					</Suspense>
				),
				html: ({openTag}) => `<div${openTag}><div>Before</div><div>Inside</div><div>After</div></div>`
			});
		});
	});
});
