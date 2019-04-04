/* --------------------
 * react-async-ssr module
 * Tests
 * ------------------*/

'use strict';

// Modules
const React = require('react');

// Imports
const {itRendersWithSyncCompare} = require('./utils');

// Tests

describe('lazy-loaded components space correctly', () => {
	const fallback = <div>Fallback</div>;

	describe('with string inside lazy', () => {
		itRendersWithSyncCompare('only', async ({render, lazy, Suspense}) => {
			const Lazy = lazy(() => 'Inside');
			const e = <Suspense fallback={fallback}><Lazy /></Suspense>;
			const h = await render(e);
			expect(h).toBe('Inside');
		});

		describe('and string(s)', () => {
			itRendersWithSyncCompare('before', async ({render, lazy, Suspense, isStatic}) => {
				const Lazy = lazy(() => 'Inside');
				const e = (
					<Suspense fallback={fallback}>
						<div>
							Before
							<Lazy />
						</div>
					</Suspense>
				);

				const h = await render(e);
				expect(h).toBe(isStatic
					? '<div>BeforeInside</div>'
					: '<div data-reactroot="">Before<!-- -->Inside</div>');
			});

			itRendersWithSyncCompare('after', async ({render, lazy, Suspense, isStatic}) => {
				const Lazy = lazy(() => 'Inside');
				const e = (
					<Suspense fallback={fallback}>
						<div>
							<Lazy />
							After
						</div>
					</Suspense>
				);

				const h = await render(e);
				expect(h).toBe(isStatic
					? '<div>InsideAfter</div>'
					: '<div data-reactroot="">Inside<!-- -->After</div>');
			});

			itRendersWithSyncCompare('before and after', async ({render, lazy, Suspense, isStatic}) => {
				const Lazy = lazy(() => 'Inside');
				const e = (
					<Suspense fallback={fallback}>
						<div>
							Before
							<Lazy />
							After
						</div>
					</Suspense>
				);

				const h = await render(e);
				expect(h).toBe(isStatic
					? '<div>BeforeInsideAfter</div>'
					: '<div data-reactroot="">Before<!-- -->Inside<!-- -->After</div>');
			});
		});

		describe('and div(s)', () => {
			itRendersWithSyncCompare('before', async ({render, lazy, Suspense, openTag}) => {
				const Lazy = lazy(() => 'Inside');
				const e = (
					<Suspense fallback={fallback}>
						<div>
							<div>Before</div>
							<Lazy />
						</div>
					</Suspense>
				);

				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>Before</div>Inside</div>`);
			});

			itRendersWithSyncCompare('after', async ({render, lazy, Suspense, openTag}) => {
				const Lazy = lazy(() => 'Inside');
				const e = (
					<Suspense fallback={fallback}>
						<div>
							<Lazy />
							<div>After</div>
						</div>
					</Suspense>
				);

				const h = await render(e);
				expect(h).toBe(`<div${openTag}>Inside<div>After</div></div>`);
			});

			itRendersWithSyncCompare('before and after', async ({render, lazy, Suspense, openTag}) => {
				const Lazy = lazy(() => 'Inside');
				const e = (
					<Suspense fallback={fallback}>
						<div>
							<div>Before</div>
							<Lazy />
							<div>After</div>
						</div>
					</Suspense>
				);

				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>Before</div>Inside<div>After</div></div>`);
			});
		});
	});

	describe('with empty inside lazy', () => {
		itRendersWithSyncCompare('only', async ({render, lazy, Suspense}) => {
			const Lazy = lazy(() => null);
			const e = <Suspense fallback={fallback}><Lazy /></Suspense>;
			const h = await render(e);
			expect(h).toBe('');
		});

		describe('and string(s)', () => {
			itRendersWithSyncCompare('before', async ({render, lazy, Suspense, openTag}) => {
				const Lazy = lazy(() => null);
				const e = (
					<Suspense fallback={fallback}>
						<div>
						Before
							<Lazy />
						</div>
					</Suspense>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}>Before</div>`);
			});

			itRendersWithSyncCompare('after', async ({render, lazy, Suspense, openTag}) => {
				const Lazy = lazy(() => null);
				const e = (
					<Suspense fallback={fallback}>
						<div>
							<Lazy />
							After
						</div>
					</Suspense>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}>After</div>`);
			});

			itRendersWithSyncCompare('before and after', async ({render, lazy, Suspense, isStatic}) => {
				const Lazy = lazy(() => null);
				const e = (
					<Suspense fallback={fallback}>
						<div>
							Before
							<Lazy />
							After
						</div>
					</Suspense>
				);
				const h = await render(e);
				expect(h).toBe(isStatic
					? '<div>BeforeAfter</div>'
					: '<div data-reactroot="">Before<!-- -->After</div>');
			});
		});

		describe('and div(s)', () => {
			itRendersWithSyncCompare('before', async ({render, lazy, Suspense, openTag}) => {
				const Lazy = lazy(() => null);
				const e = (
					<Suspense fallback={fallback}>
						<div>
							<div>Before</div>
							<Lazy />
						</div>
					</Suspense>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>Before</div></div>`);
			});

			itRendersWithSyncCompare('after', async ({render, lazy, Suspense, openTag}) => {
				const Lazy = lazy(() => null);
				const e = (
					<Suspense fallback={fallback}>
						<div>
							<Lazy />
							<div>After</div>
						</div>
					</Suspense>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>After</div></div>`);
			});

			itRendersWithSyncCompare('before and after', async ({render, lazy, Suspense, openTag}) => {
				const Lazy = lazy(() => null);
				const e = (
					<Suspense fallback={fallback}>
						<div>
							<div>Before</div>
							<Lazy />
							<div>After</div>
						</div>
					</Suspense>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>Before</div><div>After</div></div>`);
			});
		});
	});

	describe('with div inside lazy', () => {
		itRendersWithSyncCompare('only', async ({render, lazy, Suspense, openTag}) => {
			const Lazy = lazy(() => <div>Inside</div>);
			const e = <Suspense fallback={fallback}><Lazy /></Suspense>;
			const h = await render(e);
			expect(h).toBe(`<div${openTag}>Inside</div>`);
		});

		describe('and string(s)', () => {
			itRendersWithSyncCompare('before', async ({render, lazy, Suspense, openTag}) => {
				const Lazy = lazy(() => <div>Inside</div>);
				const e = (
					<Suspense fallback={fallback}>
						<div>
							Before
							<Lazy />
						</div>
					</Suspense>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}>Before<div>Inside</div></div>`);
			});

			itRendersWithSyncCompare('after', async ({render, lazy, Suspense, openTag}) => {
				const Lazy = lazy(() => <div>Inside</div>);
				const e = (
					<Suspense fallback={fallback}>
						<div>
							<Lazy />
							After
						</div>
					</Suspense>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>Inside</div>After</div>`);
			});

			itRendersWithSyncCompare('before and after', async ({render, lazy, Suspense, openTag}) => {
				const Lazy = lazy(() => <div>Inside</div>);
				const e = (
					<Suspense fallback={fallback}>
						<div>
							Before
							<Lazy />
							After
						</div>
					</Suspense>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}>Before<div>Inside</div>After</div>`);
			});
		});

		describe('and div(s)', () => {
			itRendersWithSyncCompare('before', async ({render, lazy, Suspense, openTag}) => {
				const Lazy = lazy(() => <div>Inside</div>);
				const e = (
					<Suspense fallback={fallback}>
						<div>
							<div>Before</div>
							<Lazy />
						</div>
					</Suspense>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>Before</div><div>Inside</div></div>`);
			});

			itRendersWithSyncCompare('after', async ({render, lazy, Suspense, openTag}) => {
				const Lazy = lazy(() => <div>Inside</div>);
				const e = (
					<Suspense fallback={fallback}>
						<div>
							<Lazy />
							<div>After</div>
						</div>
					</Suspense>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>Inside</div><div>After</div></div>`);
			});

			itRendersWithSyncCompare('before and after', async ({render, lazy, Suspense, openTag}) => {
				const Lazy = lazy(() => <div>Inside</div>);
				const e = (
					<Suspense fallback={fallback}>
						<div>
							<div>Before</div>
							<Lazy />
							<div>After</div>
						</div>
					</Suspense>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>Before</div><div>Inside</div><div>After</div></div>`);
			});
		});
	});
});
