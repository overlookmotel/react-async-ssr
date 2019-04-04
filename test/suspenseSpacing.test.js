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

function Fallback() {
	return <div>Loading...</div>;
}

describe('suspense spaces correctly', () => {
	describe('with string inside Suspense', () => {
		itRendersWithSyncCompare('only', async ({render, Suspense}) => {
			const e = <Suspense fallback={<Fallback />}>Inside</Suspense>;
			const h = await render(e);
			expect(h).toBe('Inside');
		});

		describe('and string(s)', () => {
			itRendersWithSyncCompare('before', async ({render, Suspense, isStatic}) => {
				const e = (
					<div>
						Before
						<Suspense fallback={<Fallback />}>Inside</Suspense>
					</div>
				);

				const h = await render(e);
				expect(h).toBe(isStatic
					? '<div>BeforeInside</div>'
					: '<div data-reactroot="">Before<!-- -->Inside</div>');
			});

			itRendersWithSyncCompare('after', async ({render, Suspense, isStatic}) => {
				const e = (
					<div>
						<Suspense fallback={<Fallback />}>Inside</Suspense>
						After
					</div>
				);

				const h = await render(e);
				expect(h).toBe(isStatic
					? '<div>InsideAfter</div>'
					: '<div data-reactroot="">Inside<!-- -->After</div>');
			});

			itRendersWithSyncCompare('before and after', async ({render, Suspense, isStatic}) => {
				const e = (
					<div>
						Before
						<Suspense fallback={<Fallback />}>Inside</Suspense>
						After
					</div>
				);

				const h = await render(e);
				expect(h).toBe(isStatic
					? '<div>BeforeInsideAfter</div>'
					: '<div data-reactroot="">Before<!-- -->Inside<!-- -->After</div>');
			});
		});

		describe('and div(s)', () => {
			itRendersWithSyncCompare('before', async ({render, Suspense, openTag}) => {
				const e = (
					<div>
						<div>Before</div>
						<Suspense fallback={<Fallback />}>Inside</Suspense>
					</div>
				);

				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>Before</div>Inside</div>`);
			});

			itRendersWithSyncCompare('after', async ({render, Suspense, openTag}) => {
				const e = (
					<div>
						<Suspense fallback={<Fallback />}>Inside</Suspense>
						<div>After</div>
					</div>
				);

				const h = await render(e);
				expect(h).toBe(`<div${openTag}>Inside<div>After</div></div>`);
			});

			itRendersWithSyncCompare('before and after', async ({render, Suspense, openTag}) => {
				const e = (
					<div>
						<div>Before</div>
						<Suspense fallback={<Fallback />}>Inside</Suspense>
						<div>After</div>
					</div>
				);

				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>Before</div>Inside<div>After</div></div>`);
			});
		});
	});

	describe('with empty inside Suspense', () => {
		itRendersWithSyncCompare('only', async ({render, Suspense}) => {
			const e = <Suspense fallback={<Fallback />} />;
			const h = await render(e);
			expect(h).toBe('');
		});

		describe('and string(s)', () => {
			itRendersWithSyncCompare('before', async ({render, Suspense, openTag}) => {
				const e = (
					<div>
						Before
						<Suspense fallback={<Fallback />} />
					</div>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}>Before</div>`);
			});

			itRendersWithSyncCompare('after', async ({render, Suspense, openTag}) => {
				const e = (
					<div>
						<Suspense fallback={<Fallback />} />
						After
					</div>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}>After</div>`);
			});

			itRendersWithSyncCompare('before and after', async ({render, Suspense, isStatic}) => {
				const e = (
					<div>
						Before
						<Suspense fallback={<Fallback />} />
						After
					</div>
				);
				const h = await render(e);
				expect(h).toBe(isStatic
					? '<div>BeforeAfter</div>'
					: '<div data-reactroot="">Before<!-- -->After</div>');
			});
		});

		describe('and div(s)', () => {
			itRendersWithSyncCompare('before', async ({render, Suspense, openTag}) => {
				const e = (
					<div>
						<div>Before</div>
						<Suspense fallback={<Fallback />} />
					</div>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>Before</div></div>`);
			});

			itRendersWithSyncCompare('after', async ({render, Suspense, openTag}) => {
				const e = (
					<div>
						<Suspense fallback={<Fallback />} />
						<div>After</div>
					</div>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>After</div></div>`);
			});

			itRendersWithSyncCompare('before and after', async ({render, Suspense, openTag}) => {
				const e = (
					<div>
						<div>Before</div>
						<Suspense fallback={<Fallback />} />
						<div>After</div>
					</div>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>Before</div><div>After</div></div>`);
			});
		});
	});

	describe('with div inside Suspense', () => {
		itRendersWithSyncCompare('only', async ({render, Suspense, openTag}) => {
			const e = <Suspense fallback={<Fallback />}><div>Inside</div></Suspense>;
			const h = await render(e);
			expect(h).toBe(`<div${openTag}>Inside</div>`);
		});

		describe('and string(s)', () => {
			itRendersWithSyncCompare('before', async ({render, Suspense, openTag}) => {
				const e = (
					<div>
						Before
						<Suspense fallback={<Fallback />}><div>Inside</div></Suspense>
					</div>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}>Before<div>Inside</div></div>`);
			});

			itRendersWithSyncCompare('after', async ({render, Suspense, openTag}) => {
				const e = (
					<div>
						<Suspense fallback={<Fallback />}><div>Inside</div></Suspense>
						After
					</div>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>Inside</div>After</div>`);
			});

			itRendersWithSyncCompare('before and after', async ({render, Suspense, openTag}) => {
				const e = (
					<div>
						Before
						<Suspense fallback={<Fallback />}><div>Inside</div></Suspense>
						After
					</div>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}>Before<div>Inside</div>After</div>`);
			});
		});

		describe('and div(s)', () => {
			itRendersWithSyncCompare('before', async ({render, Suspense, openTag}) => {
				const e = (
					<div>
						<div>Before</div>
						<Suspense fallback={<Fallback />}><div>Inside</div></Suspense>
					</div>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>Before</div><div>Inside</div></div>`);
			});

			itRendersWithSyncCompare('after', async ({render, Suspense, openTag}) => {
				const e = (
					<div>
						<Suspense fallback={<Fallback />}><div>Inside</div></Suspense>
						<div>After</div>
					</div>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>Inside</div><div>After</div></div>`);
			});

			itRendersWithSyncCompare('before and after', async ({render, Suspense, openTag}) => {
				const e = (
					<div>
						<div>Before</div>
						<Suspense fallback={<Fallback />}><div>Inside</div></Suspense>
						<div>After</div>
					</div>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}><div>Before</div><div>Inside</div><div>After</div></div>`);
			});
		});
	});
});
