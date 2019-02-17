/* --------------------
 * react-async-ssr module
 * Tests
 * ------------------*/

'use strict';

// Modules
const React = require('react');

// Imports
const {itRendersWithSyncCompare, lazy} = require('./utils');

// Tests

describe('suspense fallback spaces correctly', () => {
	let Lazy;
	beforeEach(() => {
		Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true});
	});

	describe('with string inside fallback', () => {
		describe('only', () => {
			itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback}) => {
				const e = (
					<Fallback fallback="Fallback">
						<Lazy/>
					</Fallback>
				);

				const h = await render(e);
				expect(h).toBe('Fallback');
			});

			itRendersWithSyncCompare('and string before lazy', async ({render, Fallback}) => {
				const e = (
					<Fallback fallback="Fallback">
						Before Lazy
						<Lazy/>
					</Fallback>
				);

				const h = await render(e);
				expect(h).toBe('Fallback');
			});

			itRendersWithSyncCompare('and div before lazy', async ({render, Fallback}) => {
				const e = (
					<Fallback fallback="Fallback">
						<div>Before Lazy</div>
						<Lazy/>
					</Fallback>
				);

				const h = await render(e);
				expect(h).toBe('Fallback');
			});
		});

		describe('and string(s)', () => {
			describe('before', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, isStatic}) => {
					const e = (
						<div>
						Before
							<Fallback fallback="Fallback">
								<Lazy/>
							</Fallback>
						</div>
					);

					const h = await render(e);
					expect(h).toBe(isStatic ?
						'<div>BeforeFallback</div>' :
						'<div data-reactroot="">Before<!-- -->Fallback</div>'
					);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, isStatic}) => {
					const e = (
						<div>
						Before
							<Fallback fallback="Fallback">
								Before Lazy
								<Lazy/>
							</Fallback>
						</div>
					);

					const h = await render(e);
					expect(h).toBe(isStatic ?
						'<div>BeforeFallback</div>' :
						'<div data-reactroot="">Before<!-- -->Fallback</div>'
					);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, isStatic}) => {
					const e = (
						<div>
						Before
							<Fallback fallback="Fallback">
								<div>Before Lazy</div>
								<Lazy/>
							</Fallback>
						</div>
					);

					const h = await render(e);
					expect(h).toBe(isStatic ?
						'<div>BeforeFallback</div>' :
						'<div data-reactroot="">Before<!-- -->Fallback</div>'
					);
				});
			});

			describe('after', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, isStatic}) => {
					const e = (
						<div>
							<Fallback fallback="Fallback">
								<Lazy/>
							</Fallback>
						After
						</div>
					);

					const h = await render(e);
					expect(h).toBe(isStatic ?
						'<div>FallbackAfter</div>' :
						'<div data-reactroot="">Fallback<!-- -->After</div>'
					);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, isStatic}) => {
					const e = (
						<div>
							<Fallback fallback="Fallback">
								Before Lazy
								<Lazy/>
							</Fallback>
						After
						</div>
					);

					const h = await render(e);
					expect(h).toBe(isStatic ?
						'<div>FallbackAfter</div>' :
						'<div data-reactroot="">Fallback<!-- -->After</div>'
					);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, isStatic}) => {
					const e = (
						<div>
							<Fallback fallback="Fallback">
								<div>Before Lazy</div>
								<Lazy/>
							</Fallback>
						After
						</div>
					);

					const h = await render(e);
					expect(h).toBe(isStatic ?
						'<div>FallbackAfter</div>' :
						'<div data-reactroot="">Fallback<!-- -->After</div>'
					);
				});
			});

			describe('before and after', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, isStatic}) => {
					const e = (
						<div>
						Before
							<Fallback fallback="Fallback">
								<Lazy/>
							</Fallback>
						After
						</div>
					);

					const h = await render(e);
					expect(h).toBe(isStatic ?
						'<div>BeforeFallbackAfter</div>' :
						'<div data-reactroot="">Before<!-- -->Fallback<!-- -->After</div>'
					);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, isStatic}) => {
					const e = (
						<div>
						Before
							<Fallback fallback="Fallback">
								Before Lazy
								<Lazy/>
							</Fallback>
						After
						</div>
					);

					const h = await render(e);
					expect(h).toBe(isStatic ?
						'<div>BeforeFallbackAfter</div>' :
						'<div data-reactroot="">Before<!-- -->Fallback<!-- -->After</div>'
					);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, isStatic}) => {
					const e = (
						<div>
						Before
							<Fallback fallback="Fallback">
								<div>Before Lazy</div>
								<Lazy/>
							</Fallback>
						After
						</div>
					);

					const h = await render(e);
					expect(h).toBe(isStatic ?
						'<div>BeforeFallbackAfter</div>' :
						'<div data-reactroot="">Before<!-- -->Fallback<!-- -->After</div>'
					);
				});
			});
		});

		describe('and div(s)', () => {
			describe('before', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback="Fallback">
								<Lazy/>
							</Fallback>
						</div>
					);

					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div>Fallback</div>`);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback="Fallback">
								Before Lazy
								<Lazy/>
							</Fallback>
						</div>
					);

					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div>Fallback</div>`);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback="Fallback">
								<div>Before Lazy</div>
								<Lazy/>
							</Fallback>
						</div>
					);

					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div>Fallback</div>`);
				});
			});

			describe('after', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<Fallback fallback="Fallback">
								<Lazy/>
							</Fallback>
							<div>After</div>
						</div>
					);

					const h = await render(e);
					expect(h).toBe(`<div${openTag}>Fallback<div>After</div></div>`);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<Fallback fallback="Fallback">
								Before Lazy
								<Lazy/>
							</Fallback>
							<div>After</div>
						</div>
					);

					const h = await render(e);
					expect(h).toBe(`<div${openTag}>Fallback<div>After</div></div>`);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<Fallback fallback="Fallback">
								<div>Before Lazy</div>
								<Lazy/>
							</Fallback>
							<div>After</div>
						</div>
					);

					const h = await render(e);
					expect(h).toBe(`<div${openTag}>Fallback<div>After</div></div>`);
				});
			});

			describe('before and after', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback="Fallback">
								<Lazy/>
							</Fallback>
							<div>After</div>
						</div>
					);

					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div>Fallback<div>After</div></div>`);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback="Fallback">
								Before Lazy
								<Lazy/>
							</Fallback>
							<div>After</div>
						</div>
					);

					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div>Fallback<div>After</div></div>`);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback="Fallback">
								<div>Before Lazy</div>
								<Lazy/>
							</Fallback>
							<div>After</div>
						</div>
					);

					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div>Fallback<div>After</div></div>`);
				});
			});
		});
	});

	describe('with null fallback', () => {
		describe('only', () => {
			itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback}) => {
				const e = <Fallback fallback={null}><Lazy/></Fallback>;
				const h = await render(e);
				expect(h).toBe('');
			});

			itRendersWithSyncCompare('and string before lazy', async ({render, Fallback}) => {
				const e = <Fallback fallback={null}>Before Lazy<Lazy/></Fallback>;
				const h = await render(e);
				expect(h).toBe('');
			});

			itRendersWithSyncCompare('and div before lazy', async ({render, Fallback}) => {
				const e = <Fallback fallback={null}><div>Before Lazy</div><Lazy/></Fallback>;
				const h = await render(e);
				expect(h).toBe('');
			});
		});

		describe('and string(s)', () => {
			describe('before', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							Before
							<Fallback fallback={null}><Lazy/></Fallback>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}>Before</div>`);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							Before
							<Fallback fallback={null}>Before Lazy<Lazy/></Fallback>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}>Before</div>`);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							Before
							<Fallback fallback={null}><div>Before Lazy</div><Lazy/></Fallback>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}>Before</div>`);
				});
			});

			describe('after', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<Fallback fallback={null}><Lazy/></Fallback>
							After
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}>After</div>`);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<Fallback fallback={null}>Before Lazy<Lazy/></Fallback>
							After
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}>After</div>`);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<Fallback fallback={null}><div>Before Lazy</div><Lazy/></Fallback>
							After
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}>After</div>`);
				});
			});

			describe('before and after', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, isStatic}) => {
					const e = (
						<div>
							Before
							<Fallback fallback={null}><Lazy/></Fallback>
							After
						</div>
					);
					const h = await render(e);
					expect(h).toBe(isStatic ?
						'<div>BeforeAfter</div>' :
						'<div data-reactroot="">Before<!-- -->After</div>'
					);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, isStatic}) => {
					const e = (
						<div>
							Before
							<Fallback fallback={null}>Before Lazy<Lazy/></Fallback>
							After
						</div>
					);
					const h = await render(e);
					expect(h).toBe(isStatic ?
						'<div>BeforeAfter</div>' :
						'<div data-reactroot="">Before<!-- -->After</div>'
					);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, isStatic}) => {
					const e = (
						<div>
							Before
							<Fallback fallback={null}><div>Before Lazy</div><Lazy/></Fallback>
							After
						</div>
					);
					const h = await render(e);
					expect(h).toBe(isStatic ?
						'<div>BeforeAfter</div>' :
						'<div data-reactroot="">Before<!-- -->After</div>'
					);
				});
			});
		});

		describe('and div(s)', () => {
			describe('before', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback={null}><Lazy/></Fallback>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div></div>`);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback={null}>Before Lazy<Lazy/></Fallback>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div></div>`);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback={null}><div>Before Lazy</div><Lazy/></Fallback>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div></div>`);
				});
			});

			describe('after', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<Fallback fallback={null}><Lazy/></Fallback>
							<div>After</div>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>After</div></div>`);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<Fallback fallback={null}>Before Lazy<Lazy/></Fallback>
							<div>After</div>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>After</div></div>`);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<Fallback fallback={null}><div>Before Lazy</div><Lazy/></Fallback>
							<div>After</div>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>After</div></div>`);
				});
			});

			describe('before and after', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback={null}><Lazy/></Fallback>
							<div>After</div>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div><div>After</div></div>`);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback={null}>Before Lazy<Lazy/></Fallback>
							<div>After</div>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div><div>After</div></div>`);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback={null}><div>Before Lazy</div><Lazy/></Fallback>
							<div>After</div>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div><div>After</div></div>`);
				});
			});
		});
	});

	describe('with div inside fallback', () => {
		describe('only', () => {
			itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, openTag}) => {
				const e = <Fallback fallback={<div>Fallback</div>}><Lazy/></Fallback>;
				const h = await render(e);
				expect(h).toBe(`<div${openTag}>Fallback</div>`);
			});

			itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, openTag}) => {
				const e = (
					<Fallback fallback={<div>Fallback</div>}>
						Before Lazy
						<Lazy/>
					</Fallback>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}>Fallback</div>`);
			});

			itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, openTag}) => {
				const e = (
					<Fallback fallback={<div>Fallback</div>}>
						<div>Before Lazy</div>
						<Lazy/>
					</Fallback>
				);
				const h = await render(e);
				expect(h).toBe(`<div${openTag}>Fallback</div>`);
			});
		});

		describe('and string(s)', () => {
			describe('before', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							Before
							<Fallback fallback={<div>Fallback</div>}>
								<Lazy/>
							</Fallback>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}>Before<div>Fallback</div></div>`);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							Before
							<Fallback fallback={<div>Fallback</div>}>
								Before Lazy
								<Lazy/>
							</Fallback>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}>Before<div>Fallback</div></div>`);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							Before
							<Fallback fallback={<div>Fallback</div>}>
								<div>Before Lazy</div>
								<Lazy/>
							</Fallback>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}>Before<div>Fallback</div></div>`);
				});
			});

			describe('after', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<Fallback fallback={<div>Fallback</div>}><Lazy/></Fallback>
							After
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Fallback</div>After</div>`);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<Fallback fallback={<div>Fallback</div>}>
								Before Lazy
								<Lazy/>
							</Fallback>
							After
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Fallback</div>After</div>`);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<Fallback fallback={<div>Fallback</div>}>
								<div>Before Lazy</div>
								<Lazy/>
							</Fallback>
							After
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Fallback</div>After</div>`);
				});
			});

			describe('before and after', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							Before
							<Fallback fallback={<div>Fallback</div>}><Lazy/></Fallback>
							After
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}>Before<div>Fallback</div>After</div>`);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							Before
							<Fallback fallback={<div>Fallback</div>}>
								Before Lazy
								<Lazy/>
							</Fallback>
							After
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}>Before<div>Fallback</div>After</div>`);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							Before
							<Fallback fallback={<div>Fallback</div>}>
								<div>Before Lazy</div>
								<Lazy/>
							</Fallback>
							After
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}>Before<div>Fallback</div>After</div>`);
				});
			});
		});

		describe('and div(s)', () => {
			describe('before', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback={<div>Fallback</div>}><Lazy/></Fallback>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div><div>Fallback</div></div>`);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback={<div>Fallback</div>}>
								Before Lazy
								<Lazy/>
							</Fallback>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div><div>Fallback</div></div>`);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback={<div>Fallback</div>}>
								<div>Before Lazy</div>
								<Lazy/>
							</Fallback>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div><div>Fallback</div></div>`);
				});
			});

			describe('after', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<Fallback fallback={<div>Fallback</div>}><Lazy/></Fallback>
							<div>After</div>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Fallback</div><div>After</div></div>`);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<Fallback fallback={<div>Fallback</div>}>
								Before Lazy
								<Lazy/>
							</Fallback>
							<div>After</div>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Fallback</div><div>After</div></div>`);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<Fallback fallback={<div>Fallback</div>}>
								<div>Before Lazy</div>
								<Lazy/>
							</Fallback>
							<div>After</div>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Fallback</div><div>After</div></div>`);
				});
			});

			describe('before and after', () => {
				itRendersWithSyncCompare('and nothing before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback={<div>Fallback</div>}><Lazy/></Fallback>
							<div>After</div>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div><div>Fallback</div><div>After</div></div>`);
				});

				itRendersWithSyncCompare('and string before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback={<div>Fallback</div>}>
								Before Lazy
								<Lazy/>
							</Fallback>
							<div>After</div>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div><div>Fallback</div><div>After</div></div>`);
				});

				itRendersWithSyncCompare('and div before lazy', async ({render, Fallback, openTag}) => {
					const e = (
						<div>
							<div>Before</div>
							<Fallback fallback={<div>Fallback</div>}>
								<div>Before Lazy</div>
								<Lazy/>
							</Fallback>
							<div>After</div>
						</div>
					);
					const h = await render(e);
					expect(h).toBe(`<div${openTag}><div>Before</div><div>Fallback</div><div>After</div></div>`);
				});
			});
		});
	});
});
