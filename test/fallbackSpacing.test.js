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

describe('suspense fallback spaces correctly', () => {
	const itRendersWithLazy = itRenders.extend({
		prep: ({lazy}) => ({
			Lazy: lazy(() => <div>Lazy inner</div>, {noSsr: true})
		}),
		hydrationWarning: true
	});

	describe('with string inside fallback', () => {
		describe('only', () => {
			itRendersWithLazy('and nothing before lazy', {
				element: ({Lazy, Suspended}) => (
					<Suspended fallback="Fallback">
						<Lazy />
					</Suspended>
				),
				html: 'Fallback'
			});

			itRendersWithLazy('and string before lazy', {
				element: ({Lazy, Suspended}) => (
					<Suspended fallback="Fallback">
						Before Lazy
						<Lazy />
					</Suspended>
				),
				html: 'Fallback'
			});

			itRendersWithLazy('and div before lazy', {
				element: ({Lazy, Suspended}) => (
					<Suspended fallback="Fallback">
						<div>Before Lazy</div>
						<Lazy />
					</Suspended>
				),
				html: 'Fallback'
			});
		});

		describe('and string(s)', () => {
			describe('before', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback="Fallback">
								<Lazy />
							</Suspended>
						</div>
					),
					htmlStatic: '<div>BeforeFallback</div>',
					htmlNonStatic: '<div data-reactroot="">Before<!-- -->Fallback</div>'
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback="Fallback">
								Before Lazy
								<Lazy />
							</Suspended>
						</div>
					),
					htmlStatic: '<div>BeforeFallback</div>',
					htmlNonStatic: '<div data-reactroot="">Before<!-- -->Fallback</div>'
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback="Fallback">
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
						</div>
					),
					htmlStatic: '<div>BeforeFallback</div>',
					htmlNonStatic: '<div data-reactroot="">Before<!-- -->Fallback</div>'
				});
			});

			describe('after', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback="Fallback">
								<Lazy />
							</Suspended>
							After
						</div>
					),
					htmlStatic: '<div>FallbackAfter</div>',
					htmlNonStatic: '<div data-reactroot="">Fallback<!-- -->After</div>'
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback="Fallback">
								Before Lazy
								<Lazy />
							</Suspended>
							After
						</div>
					),
					htmlStatic: '<div>FallbackAfter</div>',
					htmlNonStatic: '<div data-reactroot="">Fallback<!-- -->After</div>'
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback="Fallback">
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
							After
						</div>
					),
					htmlStatic: '<div>FallbackAfter</div>',
					htmlNonStatic: '<div data-reactroot="">Fallback<!-- -->After</div>'
				});
			});

			describe('before and after', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback="Fallback">
								<Lazy />
							</Suspended>
							After
						</div>
					),
					htmlStatic: '<div>BeforeFallbackAfter</div>',
					htmlNonStatic: '<div data-reactroot="">Before<!-- -->Fallback<!-- -->After</div>'
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback="Fallback">
								Before Lazy
								<Lazy />
							</Suspended>
							After
						</div>
					),
					htmlStatic: '<div>BeforeFallbackAfter</div>',
					htmlNonStatic: '<div data-reactroot="">Before<!-- -->Fallback<!-- -->After</div>'
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback="Fallback">
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
							After
						</div>
					),
					htmlStatic: '<div>BeforeFallbackAfter</div>',
					htmlNonStatic: '<div data-reactroot="">Before<!-- -->Fallback<!-- -->After</div>'
				});
			});
		});

		describe('and div(s)', () => {
			describe('before', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback="Fallback">
								<Lazy />
							</Suspended>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div>Fallback</div>`
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback="Fallback">
								Before Lazy
								<Lazy />
							</Suspended>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div>Fallback</div>`
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback="Fallback">
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div>Fallback</div>`
				});
			});

			describe('after', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback="Fallback">
								<Lazy />
							</Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}>Fallback<div>After</div></div>`
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback="Fallback">
								Before Lazy
								<Lazy />
							</Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}>Fallback<div>After</div></div>`
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback="Fallback">
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}>Fallback<div>After</div></div>`
				});
			});

			describe('before and after', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback="Fallback">
								<Lazy />
							</Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div>Fallback<div>After</div></div>`
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback="Fallback">
								Before Lazy
								<Lazy />
							</Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div>Fallback<div>After</div></div>`
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback="Fallback">
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div>Fallback<div>After</div></div>`
				});
			});
		});
	});

	describe('with null fallback', () => {
		describe('only', () => {
			itRendersWithLazy('and nothing before lazy', {
				element: ({Lazy, Suspended}) => (
					<Suspended fallback={null}><Lazy /></Suspended>
				),
				html: ''
			});

			itRendersWithLazy('and string before lazy', {
				element: ({Lazy, Suspended}) => (
					<Suspended fallback={null}>
						Before Lazy
						<Lazy />
					</Suspended>
				),
				html: ''
			});

			itRendersWithLazy('and div before lazy', {
				element: ({Lazy, Suspended}) => (
					<Suspended fallback={null}>
						<div>Before Lazy</div>
						<Lazy />
					</Suspended>
				),
				html: ''
			});
		});

		describe('and string(s)', () => {
			describe('before', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback={null}><Lazy /></Suspended>
						</div>
					),
					html: ({openTag}) => `<div${openTag}>Before</div>`
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback={null}>
								Before Lazy
								<Lazy />
							</Suspended>
						</div>
					),
					html: ({openTag}) => `<div${openTag}>Before</div>`
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback={null}>
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
						</div>
					),
					html: ({openTag}) => `<div${openTag}>Before</div>`
				});
			});

			describe('after', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback={null}><Lazy /></Suspended>
							After
						</div>
					),
					html: ({openTag}) => `<div${openTag}>After</div>`
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback={null}>
								Before Lazy
								<Lazy />
							</Suspended>
							After
						</div>
					),
					html: ({openTag}) => `<div${openTag}>After</div>`
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback={null}>
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
							After
						</div>
					),
					html: ({openTag}) => `<div${openTag}>After</div>`
				});
			});

			describe('before and after', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback={null}><Lazy /></Suspended>
							After
						</div>
					),
					htmlStatic: '<div>BeforeAfter</div>',
					htmlNonStatic: '<div data-reactroot="">Before<!-- -->After</div>'
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback={null}>
								Before Lazy
								<Lazy />
							</Suspended>
							After
						</div>
					),
					htmlStatic: '<div>BeforeAfter</div>',
					htmlNonStatic: '<div data-reactroot="">Before<!-- -->After</div>'
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback={null}>
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
							After
						</div>
					),
					htmlStatic: '<div>BeforeAfter</div>',
					htmlNonStatic: '<div data-reactroot="">Before<!-- -->After</div>'
				});
			});
		});

		describe('and div(s)', () => {
			describe('before', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback={null}><Lazy /></Suspended>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div></div>`
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback={null}>
								Before Lazy
								<Lazy />
							</Suspended>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div></div>`
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback={null}>
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div></div>`
				});
			});

			describe('after', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback={null}><Lazy /></Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>After</div></div>`
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback={null}>
								Before Lazy
								<Lazy />
							</Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>After</div></div>`
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback={null}>
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>After</div></div>`
				});
			});

			describe('before and after', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback={null}><Lazy /></Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div><div>After</div></div>`
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback={null}>
								Before Lazy
								<Lazy />
							</Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div><div>After</div></div>`
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback={null}>
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div><div>After</div></div>`
				});
			});
		});
	});

	describe('with div inside fallback', () => {
		describe('only', () => {
			itRendersWithLazy('and nothing before lazy', {
				element: ({Lazy, Suspended}) => (
					<Suspended fallback={<div>Fallback</div>}><Lazy /></Suspended>
				),
				html: ({openTag}) => `<div${openTag}>Fallback</div>`
			});

			itRendersWithLazy('and string before lazy', {
				element: ({Lazy, Suspended}) => (
					<Suspended fallback={<div>Fallback</div>}>
						Before Lazy
						<Lazy />
					</Suspended>
				),
				html: ({openTag}) => `<div${openTag}>Fallback</div>`
			});

			itRendersWithLazy('and div before lazy', {
				element: ({Lazy, Suspended}) => (
					<Suspended fallback={<div>Fallback</div>}>
						<div>Before Lazy</div>
						<Lazy />
					</Suspended>
				),
				html: ({openTag}) => `<div${openTag}>Fallback</div>`
			});
		});

		describe('and string(s)', () => {
			describe('before', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback={<div>Fallback</div>}>
								<Lazy />
							</Suspended>
						</div>
					),
					html: ({openTag}) => `<div${openTag}>Before<div>Fallback</div></div>`
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback={<div>Fallback</div>}>
								Before Lazy
								<Lazy />
							</Suspended>
						</div>
					),
					html: ({openTag}) => `<div${openTag}>Before<div>Fallback</div></div>`
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback={<div>Fallback</div>}>
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
						</div>
					),
					html: ({openTag}) => `<div${openTag}>Before<div>Fallback</div></div>`
				});
			});

			describe('after', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback={<div>Fallback</div>}><Lazy /></Suspended>
							After
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Fallback</div>After</div>`
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback={<div>Fallback</div>}>
								Before Lazy
								<Lazy />
							</Suspended>
							After
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Fallback</div>After</div>`
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback={<div>Fallback</div>}>
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
							After
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Fallback</div>After</div>`
				});
			});

			describe('before and after', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback={<div>Fallback</div>}><Lazy /></Suspended>
							After
						</div>
					),
					html: ({openTag}) => `<div${openTag}>Before<div>Fallback</div>After</div>`
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback={<div>Fallback</div>}>
								Before Lazy
								<Lazy />
							</Suspended>
							After
						</div>
					),
					html: ({openTag}) => `<div${openTag}>Before<div>Fallback</div>After</div>`
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							Before
							<Suspended fallback={<div>Fallback</div>}>
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
							After
						</div>
					),
					html: ({openTag}) => `<div${openTag}>Before<div>Fallback</div>After</div>`
				});
			});
		});

		describe('and div(s)', () => {
			describe('before', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback={<div>Fallback</div>}><Lazy /></Suspended>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div><div>Fallback</div></div>`
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback={<div>Fallback</div>}>
								Before Lazy
								<Lazy />
							</Suspended>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div><div>Fallback</div></div>`
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback={<div>Fallback</div>}>
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div><div>Fallback</div></div>`
				});
			});

			describe('after', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback={<div>Fallback</div>}><Lazy /></Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Fallback</div><div>After</div></div>`
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback={<div>Fallback</div>}>
								Before Lazy
								<Lazy />
							</Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Fallback</div><div>After</div></div>`
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<Suspended fallback={<div>Fallback</div>}>
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Fallback</div><div>After</div></div>`
				});
			});

			describe('before and after', () => {
				itRendersWithLazy('and nothing before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback={<div>Fallback</div>}><Lazy /></Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div><div>Fallback</div><div>After</div></div>`
				});

				itRendersWithLazy('and string before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback={<div>Fallback</div>}>
								Before Lazy
								<Lazy />
							</Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div><div>Fallback</div><div>After</div></div>`
				});

				itRendersWithLazy('and div before lazy', {
					element: ({Lazy, Suspended}) => (
						<div>
							<div>Before</div>
							<Suspended fallback={<div>Fallback</div>}>
								<div>Before Lazy</div>
								<Lazy />
							</Suspended>
							<div>After</div>
						</div>
					),
					html: ({openTag}) => `<div${openTag}><div>Before</div><div>Fallback</div><div>After</div></div>`
				});
			});
		});
	});
});
