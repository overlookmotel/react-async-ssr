/* --------------------
 * react-async-ssr module
 * Tests
 * ------------------*/

'use strict';

// Modules
const React = require('react'),
	{Suspense} = React,
	{ABORT} = require('../symbols');

// Imports
const {itRenders, lazy, removeSpacing, preventUnhandledRejection} = require('./utils');

// Globals
const spy = jest.fn;

// Constants
const NO_SUSPENSE_ERROR = /^A React component suspended while rendering, but no fallback UI was specified.\n\nAdd a <Suspense fallback=\.\.\.> component higher in the tree to provide a loading indicator or placeholder to display\.$/;

// Tests

describe('lazy component', () => {
	describe('inside Suspense', () => {
		describe('when promise not marked SSR', () => {
			let e, Lazy;
			beforeEach(() => {
				Lazy = lazy(() => <div>Lazy inner</div>);

				e = (
					<div>
						<div>Before Suspense</div>
						<Suspense fallback={<span>Fallback</span>}>
							<div>Before Lazy</div>
							<Lazy/>
							<div>After Lazy</div>
						</Suspense>
						<div>After Suspense</div>
					</div>
				);
			});

			itRenders('renders lazily', async ({render, openTag}) => {
				const h = await render(e);
				expect(h).toBe(removeSpacing(`
					<div${openTag}>
						<div>Before Suspense</div>
						<div>Before Lazy</div>
						<div>Lazy inner</div>
						<div>After Lazy</div>
						<div>After Suspense</div>
					</div>
				`));
			});

			itRenders('calls [ON_MOUNT] on promise with true', async ({render}) => {
				await render(e);
				expect(Lazy).toBeMountedWith(true);
			});
		});

		describe('when promise marked no SSR', () => {
			describe('standard fallback', () => {
				let e, Lazy;
				beforeEach(() => {
					Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true});

					e = (
						<div>
							<div>Before Suspense</div>
							<Suspense fallback={<span>Fallback</span>}>
								<div>Before Lazy</div>
								<Lazy/>
								<div>After Lazy</div>
							</Suspense>
							<div>After Suspense</div>
						</div>
					);
				});

				itRenders('renders fallback', async ({render, openTag}) => {
					const h = await render(e);
					expect(h).toBe(removeSpacing(`
						<div${openTag}>
							<div>Before Suspense</div>
							<span>Fallback</span>
							<div>After Suspense</div>
						</div>
					`));
				});

				itRenders('calls [ON_MOUNT] on promise with false when fallbackFast mode disabled', async ({render}) => {
					await render(e);
					expect(Lazy).toBeMountedWith(false);
				}, {fallbackFast: false});

				itRenders('does not call [ON_MOUNT] on promise when fallbackFast mode enabled', async ({render}) => {
					await render(e);
					expect(Lazy).not.toBeMounted();
				}, {fallbackFast: true});
			});

			itRenders('rejects when fallback throws promise and not inside another Suspense', async ({render}) => {
				const Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true});
				const LazyFallback = lazy(() => <div>Fallback</div>);

				const e = (
					<div>
						<div>Before Suspense</div>
						<Suspense fallback={<LazyFallback/>}>
							<div>Before Lazy</div>
							<Lazy/>
							<div>After Lazy</div>
						</Suspense>
						<div>After Suspense</div>
					</div>
				);

				const p = render(e);
				await expect(p).rejects.toThrow(NO_SUSPENSE_ERROR);
			});

			describe('when fallback includes lazy component and inside another Suspense', () => {
				let e, Lazy, LazyFallback, Fallback;
				beforeEach(() => {
					Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true});
					LazyFallback = lazy(() => <div>Lazy fallback</div>);
					Fallback = function Fallback() {
						return (
							<div>
								<div>Before Fallback</div>
								<LazyFallback/>
								<div>After Fallback</div>
							</div>
						);
					};

					e = (
						<Suspense fallback={<span>Fallback outer</span>}>
							<div>
								<div>Before Suspense</div>
								<Suspense fallback={<Fallback/>}>
									<div>Before Lazy</div>
									<Lazy/>
									<div>After Lazy</div>
								</Suspense>
								<div>After Suspense</div>
							</div>
						</Suspense>
					);
				});

				itRenders('renders fallback', async ({render, openTag}) => {
					const h = await render(e);
					expect(h).toBe(removeSpacing(`
						<div${openTag}>
							<div>Before Suspense</div>
							<div>
								<div>Before Fallback</div>
								<div>Lazy fallback</div>
								<div>After Fallback</div>
							</div>
							<div>After Suspense</div>
						</div>
					`));
				});

				itRenders('calls [ON_MOUNT] on promises when fallbackFast mode disabled', async ({render}) => {
					await render(e);
					expect(Lazy).toBeMountedWith(false);
					expect(LazyFallback).toBeMountedWith(true);
					expect(Lazy).toBeMountedBefore(LazyFallback);
				}, {fallbackFast: false});

				itRenders('does not call [ON_MOUNT] on lazy promise when fallbackFast mode enabled', async ({render}) => {
					await render(e);
					expect(Lazy).not.toBeMounted();
				}, {fallbackFast: true});

				itRenders('calls [ON_MOUNT] on lazy fallback when fallbackFast mode enabled', async ({render}) => {
					await render(e);
					expect(LazyFallback).toBeMountedWith(true);
				}, {fallbackFast: true});
			});
		});
	});

	describe('inside nested Suspenses', () => {
		describe('when promise not marked no SSR', () => {
			let e, Lazy;
			beforeEach(() => {
				Lazy = lazy(() => <div>Lazy inner</div>);

				e = (
					<div>
						<div>Before outer Suspense</div>
						<Suspense fallback={<span>Fallback outer</span>}>
							<div>Before inner Suspense</div>
							<Suspense fallback={<span>Fallback inner</span>}>
								<div>Before Lazy</div>
								<Lazy/>
								<div>After Lazy</div>
							</Suspense>
							<div>After inner Suspense</div>
						</Suspense>
						<div>After outer Suspense</div>
					</div>
				);
			});

			itRenders('renders lazily', async ({render, openTag}) => {
				const h = await render(e);
				expect(h).toBe(removeSpacing(`
					<div${openTag}>
						<div>Before outer Suspense</div>
						<div>Before inner Suspense</div>
						<div>Before Lazy</div>
						<div>Lazy inner</div>
						<div>After Lazy</div>
						<div>After inner Suspense</div>
						<div>After outer Suspense</div>
					</div>
				`));
			});

			itRenders('calls [ON_MOUNT] on promise with true', async ({render}) => {
				await render(e);
				expect(Lazy).toBeMountedWith(true);
			});
		});

		describe('when promise marked no SSR', () => {
			let e, Lazy;
			beforeEach(() => {
				Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true});

				e = (
					<div>
						<div>Before outer Suspense</div>
						<Suspense fallback={<span>Fallback outer</span>}>
							<div>Before inner Suspense</div>
							<Suspense fallback={<span>Fallback inner</span>}>
								<div>Before Lazy</div>
								<Lazy/>
								<div>After Lazy</div>
							</Suspense>
							<div>After inner Suspense</div>
						</Suspense>
						<div>After outer Suspense</div>
					</div>
				);
			});

			itRenders('renders fallback of inner Suspense', async ({render, openTag}) => {
				const h = await render(e);
				expect(h).toBe(removeSpacing(`
					<div${openTag}>
						<div>Before outer Suspense</div>
						<div>Before inner Suspense</div>
						<span>Fallback inner</span>
						<div>After inner Suspense</div>
						<div>After outer Suspense</div>
					</div>
				`));
			});

			itRenders('calls [ON_MOUNT] on promise with false when fallbackFast disabled', async ({render}) => {
				await render(e);
				expect(Lazy).toBeMountedWith(false);
			}, {fallbackFast: false});

			itRenders('does not call [ON_MOUNT] on promise when fallbackFast enabled', async ({render}) => {
				await render(e);
				expect(Lazy).not.toBeMounted();
			}, {fallbackFast: true});
		});

		describe('when marked no SSR and inner fallback throws promise marked no SSR', () => {
			let e, Lazy, LazyFallback;
			beforeEach(() => {
				Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true});
				LazyFallback = lazy(() => <div>Lazy fallback</div>, {noSsr: true});

				e = (
					<div>
						<div>Before outer Suspense</div>
						<Suspense fallback={<span>Fallback outer</span>}>
							<div>Before inner Suspense</div>
							<Suspense fallback={<LazyFallback/>}>
								<div>Before Lazy</div>
								<Lazy/>
								<div>After Lazy</div>
							</Suspense>
							<div>After inner Suspense</div>
						</Suspense>
						<div>After outer Suspense</div>
					</div>
				);
			});

			itRenders('renders fallback', async ({render, openTag}) => {
				const h = await render(e);
				expect(h).toBe(removeSpacing(`
					<div${openTag}>
						<div>Before outer Suspense</div>
						<span>Fallback outer</span>
						<div>After outer Suspense</div>
					</div>
				`));
			});

			itRenders('calls [ON_MOUNT] on lazy promise and fallback promise with false when fallbackFast disabled', async ({render}) => {
				await render(e);
				expect(Lazy).toBeMountedWith(false);
				expect(LazyFallback).toBeMountedWith(false);
				expect(Lazy).toBeMountedBefore(LazyFallback);
			}, {fallbackFast: false});

			itRenders('does not call [ON_MOUNT] on lazy promise or fallback promise when fallbackFast enabled', async ({render}) => {
				await render(e);
				expect(Lazy).not.toBeMounted();
				expect(LazyFallback).not.toBeMounted();
			}, {fallbackFast: true});
		});

		describe('when marked no SSR and inner Suspense has no fallback', () => {
			let e, Lazy;
			beforeEach(() => {
				Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true});

				e = (
					<div>
						<div>Before outer Suspense</div>
						<Suspense fallback={<span>Fallback outer</span>}>
							<div>Before inner Suspense</div>
							<Suspense>
								<div>Before Lazy</div>
								<Lazy/>
								<div>After Lazy</div>
							</Suspense>
							<div>After inner Suspense</div>
						</Suspense>
						<div>After outer Suspense</div>
					</div>
				);
			});

			itRenders('renders fallback of outer Suspense', async ({render, openTag}) => {
				const h = await render(e);
				expect(h).toBe(removeSpacing(`
					<div${openTag}>
						<div>Before outer Suspense</div>
						<span>Fallback outer</span>
						<div>After outer Suspense</div>
					</div>
				`));
			});

			itRenders('calls [ON_MOUNT] on lazy promise with false when fallbackFast disabled', async ({render}) => {
				await render(e);
				expect(Lazy).toBeMountedWith(false);
			}, {fallbackFast: false});

			itRenders('does not calls [ON_MOUNT] on lazy promise when fallbackFast enabled', async ({render}) => {
				await render(e);
				expect(Lazy).not.toBeMounted();
			}, {fallbackFast: true});
		});

		itRenders('rejects when promise marked no SSR and inner fallback throws promise marked no SSR and outer fallback throws promise', async ({render}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true});
			const LazyFallbackInner = lazy(() => <div>Fallback inner</div>, {noSsr: true});
			const LazyFallbackOuter = lazy(() => <div>Fallback outer</div>);

			const e = (
				<div>
					<div>Before outer Suspense</div>
					<Suspense fallback={<LazyFallbackOuter/>}>
						<div>Before inner Suspense</div>
						<Suspense fallback={<LazyFallbackInner/>}>
							<div>Before Lazy</div>
							<Lazy/>
							<div>After Lazy</div>
						</Suspense>
						<div>After inner Suspense</div>
					</Suspense>
					<div>After outer Suspense</div>
				</div>
			);

			const p = render(e);
			await expect(p).rejects.toThrow(NO_SUSPENSE_ERROR);
		});

		itRenders('rejects when both Suspense elements have no fallback', async ({render}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>);

			const e = (
				<div>
					<div>Before outer Suspense</div>
					<Suspense>
						<div>Before inner Suspense</div>
						<Suspense>
							<div>Before Lazy</div>
							<Lazy/>
							<div>After Lazy</div>
						</Suspense>
						<div>After inner Suspense</div>
					</Suspense>
					<div>After outer Suspense</div>
				</div>
			);

			const p = render(e);
			await expect(p).rejects.toThrow(NO_SUSPENSE_ERROR);
		});
	});

	describe('inside Suspense with peer nested Suspense', () => {
		describe('does not trigger inner Suspense fallbacks if promise not marked no SSR', () => {
			itRenders('and lazy before Suspense', async ({render, openTag}) => {
				const Lazy = lazy(() => <div>Lazy</div>);
				const Fallback1 = spy(() => <span>Fallback 1</span>);
				const Fallback2 = spy(() => <span>Fallback 2</span>);
				const Fallback3 = spy(() => <span>Fallback 2</span>);

				const e = (
					<div>
						<Suspense fallback={<span>Fallback outer</span>}>
							<Lazy/>
							<Suspense fallback={<Fallback1/>}>
								<Suspense fallback={<Fallback2/>}>
									<div>Inside Suspense 1</div>
								</Suspense>
							</Suspense>
							<Suspense fallback={<Fallback3/>}>
								<div>Inside Suspense 2</div>
							</Suspense>
						</Suspense>
					</div>
				);

				const h = await render(e);
				expect(h).toBe(removeSpacing(`
					<div${openTag}>
						<div>Lazy</div>
						<div>Inside Suspense 1</div>
						<div>Inside Suspense 2</div>
					</div>
				`));

				expect(Fallback1).not.toHaveBeenCalled();
				expect(Fallback2).not.toHaveBeenCalled();
				expect(Fallback3).not.toHaveBeenCalled();
			});

			itRenders('and lazy after Suspense', async ({render, openTag}) => {
				const Lazy = lazy(() => <div>Lazy</div>);
				const Fallback1 = spy(() => <span>Fallback 1</span>);
				const Fallback2 = spy(() => <span>Fallback 2</span>);
				const Fallback3 = spy(() => <span>Fallback 2</span>);

				const e = (
					<div>
						<Suspense fallback={<span>Fallback outer</span>}>
							<Suspense fallback={<Fallback1/>}>
								<Suspense fallback={<Fallback2/>}>
									<div>Inside Suspense 1</div>
								</Suspense>
							</Suspense>
							<Suspense fallback={<Fallback3/>}>
								<div>Inside Suspense 2</div>
							</Suspense>
							<Lazy/>
						</Suspense>
					</div>
				);

				const h = await render(e);
				expect(h).toBe(removeSpacing(`
					<div${openTag}>
						<div>Inside Suspense 1</div>
						<div>Inside Suspense 2</div>
						<div>Lazy</div>
					</div>
				`));

				expect(Fallback1).not.toHaveBeenCalled();
				expect(Fallback2).not.toHaveBeenCalled();
				expect(Fallback3).not.toHaveBeenCalled();
			});
		});

		describe('does not trigger inner Suspense fallbacks if promise marked no SSR but no lazy elements within Suspenses', () => {
			itRenders('and lazy before Suspense', async ({render, openTag}) => {
				const Lazy = lazy(() => <div>Lazy</div>, {noSsr: true});
				const Fallback1 = spy(() => <span>Fallback 1</span>);
				const Fallback2 = spy(() => <span>Fallback 2</span>);
				const Fallback3 = spy(() => <span>Fallback 2</span>);

				const e = (
					<div>
						<Suspense fallback={<span>Fallback outer</span>}>
							<Lazy/>
							<Suspense fallback={<Fallback1/>}>
								<Suspense fallback={<Fallback2/>}>
									<div>Inside Suspense 1</div>
								</Suspense>
							</Suspense>
							<Suspense fallback={<Fallback3/>}>
								<div>Inside Suspense 2</div>
							</Suspense>
						</Suspense>
					</div>
				);

				const h = await render(e);
				expect(h).toBe(removeSpacing(`
					<div${openTag}>
						<span>Fallback outer</span>
					</div>
				`));

				expect(Fallback1).not.toHaveBeenCalled();
				expect(Fallback2).not.toHaveBeenCalled();
				expect(Fallback3).not.toHaveBeenCalled();
			});

			itRenders('and lazy after Suspense', async ({render, openTag}) => {
				const Lazy = lazy(() => <div>Lazy</div>, {noSsr: true});
				const Fallback1 = spy(() => <span>Fallback 1</span>);
				const Fallback2 = spy(() => <span>Fallback 2</span>);
				const Fallback3 = spy(() => <span>Fallback 2</span>);

				const e = (
					<div>
						<Suspense fallback={<span>Fallback outer</span>}>
							<Suspense fallback={<Fallback1/>}>
								<Suspense fallback={<Fallback2/>}>
									<div>Inside Suspense 1</div>
								</Suspense>
							</Suspense>
							<Suspense fallback={<Fallback3/>}>
								<div>Inside Suspense 2</div>
							</Suspense>
							<Lazy/>
						</Suspense>
					</div>
				);

				const h = await render(e);
				expect(h).toBe(removeSpacing(`
					<div${openTag}>
						<span>Fallback outer</span>
					</div>
				`));

				expect(Fallback1).not.toHaveBeenCalled();
				expect(Fallback2).not.toHaveBeenCalled();
				expect(Fallback3).not.toHaveBeenCalled();
			});

			itRenders('and nested lazy', async ({render, openTag}) => {
				const LazyInner = lazy(() => <div>Lazy</div>, {noSsr: true});
				const Lazy = lazy(() => <LazyInner/>);
				const Fallback1 = spy(() => <span>Fallback 1</span>);
				const Fallback2 = spy(() => <span>Fallback 2</span>);
				const Fallback3 = spy(() => <span>Fallback 2</span>);

				const e = (
					<div>
						<Suspense fallback={<span>Fallback outer</span>}>
							<Lazy/>
							<Suspense fallback={<Fallback1/>}>
								<Suspense fallback={<Fallback2/>}>
									<div>Inside Suspense 1</div>
								</Suspense>
							</Suspense>
							<Suspense fallback={<Fallback3/>}>
								<div>Inside Suspense 2</div>
							</Suspense>
						</Suspense>
					</div>
				);

				const h = await render(e);
				expect(h).toBe(removeSpacing(`
					<div${openTag}>
						<span>Fallback outer</span>
					</div>
				`));

				expect(Fallback1).not.toHaveBeenCalled();
				expect(Fallback2).not.toHaveBeenCalled();
				expect(Fallback3).not.toHaveBeenCalled();
			});
		});

		describe('when promise marked no SSR and lazy elements within Suspenses', () => {
			describe('and fallbackFast mode disabled', () => {
				describe('nested 1 deep', () => {
					describe('and lazy before Suspense', () => {
						let e, Lazy, Lazy2, Fallback;
						beforeEach(() => {
							Lazy = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Fallback = spy(() => <span>Fallback 1</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Lazy/>
										<Suspense fallback={<Fallback/>}>
											<Lazy2/>
										</Suspense>
									</Suspense>
								</div>
							);
						});

						itRenders('triggers inner Suspense fallback', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).toHaveBeenCalledTimes(1);
						}, {fallbackFast: false});

						itRenders('calls [ON_MOUNT] on lazy promises with false', async ({render}) => {
							await render(e);
							expect(Lazy).toBeMountedWith(false);
							expect(Lazy2).toBeMountedWith(false);
							expect(Lazy).toBeMountedBefore(Lazy2);
						}, {fallbackFast: false});
					});

					describe('and lazy after Suspense', () => {
						let e, Lazy, Lazy2, Fallback;
						beforeEach(() => {
							Lazy = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Fallback = spy(() => <span>Fallback 1</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Suspense fallback={<Fallback/>}>
											<Lazy2/>
										</Suspense>
										<Lazy/>
									</Suspense>
								</div>
							);
						});

						itRenders('triggers inner Suspense fallback', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).toHaveBeenCalledTimes(1);
						}, {fallbackFast: false});

						itRenders('calls [ON_MOUNT] on lazy promises with false', async ({render}) => {
							await render(e);
							expect(Lazy).toBeMountedWith(false);
							expect(Lazy2).toBeMountedWith(false);
							expect(Lazy2).toBeMountedBefore(Lazy);
						}, {fallbackFast: false});
					});

					describe('and nested lazy', () => {
						let e, LazyInner, Lazy, Lazy2, Fallback;
						beforeEach(() => {
							LazyInner = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy = lazy(() => <LazyInner/>);
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Fallback = spy(() => <span>Fallback 1</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Lazy/>
										<Suspense fallback={<Fallback/>}>
											<Lazy2/>
										</Suspense>
									</Suspense>
								</div>
							);
						});

						itRenders('triggers inner Suspense fallback', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).toHaveBeenCalledTimes(1);
						}, {fallbackFast: false});

						itRenders('calls [ON_MOUNT] on lazy promises with false', async ({render}) => {
							await render(e);
							expect(LazyInner).not.toBeMounted();
							expect(Lazy).toBeMountedWith(false);
							expect(Lazy2).toBeMountedWith(false);
							expect(Lazy).toBeMountedBefore(Lazy2);
						}, {fallbackFast: false});
					});
				});

				describe('nested 2 deep', () => {
					describe('and lazy before Suspense', () => {
						let e, Lazy, Lazy2, Fallback, Fallback2;
						beforeEach(() => {
							Lazy = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Fallback = spy(() => <span>Fallback 1</span>);
							Fallback2 = spy(() => <span>Fallback 2</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Lazy/>
										<Suspense fallback={<Fallback/>}>
											<Suspense fallback={<Fallback2/>}>
												<Lazy2/>
											</Suspense>
										</Suspense>
									</Suspense>
								</div>
							);
						});

						itRenders('triggers inner Suspense fallback', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).not.toHaveBeenCalled();
							expect(Fallback2).toHaveBeenCalledTimes(1);
						}, {fallbackFast: false});

						itRenders('calls [ON_MOUNT] on lazy promises with false', async ({render}) => {
							await render(e);
							expect(Lazy).toBeMountedWith(false);
							expect(Lazy2).toBeMountedWith(false);
							expect(Lazy).toBeMountedBefore(Lazy2);
						}, {fallbackFast: false});
					});

					describe('and lazy after Suspense', () => {
						let e, Lazy, Lazy2, Fallback, Fallback2;
						beforeEach(() => {
							Lazy = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Fallback = spy(() => <span>Fallback 1</span>);
							Fallback2 = spy(() => <span>Fallback 2</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Suspense fallback={<Fallback/>}>
											<Suspense fallback={<Fallback2/>}>
												<Lazy2/>
											</Suspense>
										</Suspense>
										<Lazy/>
									</Suspense>
								</div>
							);
						});

						itRenders('triggers inner Suspense fallback', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).not.toHaveBeenCalled();
							expect(Fallback2).toHaveBeenCalledTimes(1);
						}, {fallbackFast: false});

						itRenders('calls [ON_MOUNT] on lazy promises with false', async ({render}) => {
							await render(e);
							expect(Lazy).toBeMountedWith(false);
							expect(Lazy2).toBeMountedWith(false);
							expect(Lazy2).toBeMountedBefore(Lazy);
						}, {fallbackFast: false});
					});

					describe('and nested lazy', () => {
						let e, LazyInner, Lazy, Lazy2, Fallback, Fallback2;
						beforeEach(() => {
							LazyInner = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy = lazy(() => <LazyInner/>);
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Fallback = spy(() => <span>Fallback 1</span>);
							Fallback2 = spy(() => <span>Fallback 2</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Lazy/>
										<Suspense fallback={<Fallback/>}>
											<Suspense fallback={<Fallback2/>}>
												<Lazy2/>
											</Suspense>
										</Suspense>
									</Suspense>
								</div>
							);
						});

						itRenders('triggers inner Suspense fallback', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).not.toHaveBeenCalled();
							expect(Fallback2).toHaveBeenCalledTimes(1);
						}, {fallbackFast: false});

						itRenders('calls [ON_MOUNT] on lazy promises with false', async ({render}) => {
							await render(e);
							expect(LazyInner).not.toBeMounted();
							expect(Lazy).toBeMountedWith(false);
							expect(Lazy2).toBeMountedWith(false);
							expect(Lazy).toBeMountedBefore(Lazy2);
						}, {fallbackFast: false});
					});
				});

				describe('nested 2 deep with both suspenses containing lazy elements', () => {
					describe('and lazy before Suspense', () => {
						let e, Lazy, Lazy2, Lazy3, Fallback, Fallback2;
						beforeEach(() => {
							Lazy = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Lazy3 = lazy(() => <div>Lazy 3</div>);
							Fallback = spy(() => <span>Fallback 1</span>);
							Fallback2 = spy(() => <span>Fallback 2</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Lazy/>
										<Suspense fallback={<Fallback/>}>
											<Suspense fallback={<Fallback2/>}>
												<Lazy2/>
											</Suspense>
											<Lazy3/>
										</Suspense>
									</Suspense>
								</div>
							);
						});

						itRenders('triggers both inner Suspense fallbacks', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).toHaveBeenCalledTimes(1);
							expect(Fallback2).toHaveBeenCalledTimes(1);
						}, {fallbackFast: false});

						itRenders('calls [ON_MOUNT] on lazy promises with false', async ({render}) => {
							await render(e);
							expect(Lazy).toBeMountedWith(false);
							expect(Lazy2).toBeMountedWith(false);
							expect(Lazy3).toBeMountedWith(false);
							expect(Lazy).toBeMountedBefore(Lazy2);
							expect(Lazy2).toBeMountedBefore(Lazy3);
						}, {fallbackFast: false});
					});

					describe('and lazy after Suspense', () => {
						let e, Lazy, Lazy2, Lazy3, Fallback, Fallback2;
						beforeEach(() => {
							Lazy = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Lazy3 = lazy(() => <div>Lazy 3</div>);
							Fallback = spy(() => <span>Fallback 1</span>);
							Fallback2 = spy(() => <span>Fallback 2</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Suspense fallback={<Fallback/>}>
											<Suspense fallback={<Fallback2/>}>
												<Lazy2/>
											</Suspense>
											<Lazy3/>
										</Suspense>
										<Lazy/>
									</Suspense>
								</div>
							);
						});

						itRenders('triggers both inner Suspense fallbacks', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).toHaveBeenCalledTimes(1);
							expect(Fallback2).toHaveBeenCalledTimes(1);
						}, {fallbackFast: false});

						itRenders('calls [ON_MOUNT] on lazy promises with false', async ({render}) => {
							await render(e);
							expect(Lazy).toBeMountedWith(false);
							expect(Lazy2).toBeMountedWith(false);
							expect(Lazy3).toBeMountedWith(false);
							expect(Lazy2).toBeMountedBefore(Lazy3);
							expect(Lazy3).toBeMountedBefore(Lazy);
						}, {fallbackFast: false});
					});

					describe('and nested lazy', () => {
						let e, LazyInner, Lazy, Lazy2, Lazy3, Fallback, Fallback2;
						beforeEach(() => {
							LazyInner = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy = lazy(() => <LazyInner/>);
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Lazy3 = lazy(() => <div>Lazy 3</div>);
							Fallback = spy(() => <span>Fallback 1</span>);
							Fallback2 = spy(() => <span>Fallback 2</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Lazy/>
										<Suspense fallback={<Fallback/>}>
											<Suspense fallback={<Fallback2/>}>
												<Lazy2/>
											</Suspense>
											<Lazy3/>
										</Suspense>
									</Suspense>
								</div>
							);
						});

						itRenders('triggers both inner Suspense fallbacks', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).toHaveBeenCalledTimes(1);
							expect(Fallback2).toHaveBeenCalledTimes(1);
						}, {fallbackFast: false});

						itRenders('calls [ON_MOUNT] on lazy promises with false', async ({render}) => {
							await render(e);
							expect(LazyInner).not.toBeMounted();
							expect(Lazy).toBeMountedWith(false);
							expect(Lazy2).toBeMountedWith(false);
							expect(Lazy3).toBeMountedWith(false);
							expect(Lazy).toBeMountedBefore(Lazy2);
							expect(Lazy2).toBeMountedBefore(Lazy3);
						}, {fallbackFast: false});
					});
				});
			});

			describe('and fallbackFast mode enabled', () => {
				describe('nested 1 deep', () => {
					describe('and lazy before Suspense', () => {
						let e, Lazy, Lazy2, Fallback;
						beforeEach(() => {
							Lazy = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Fallback = spy(() => <span>Fallback 1</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Lazy/>
										<Suspense fallback={<Fallback/>}>
											<Lazy2/>
										</Suspense>
									</Suspense>
								</div>
							);
						});

						itRenders('does not trigger inner Suspense fallbacks', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).not.toHaveBeenCalled();
						}, {fallbackFast: true});

						itRenders('does not call [ON_MOUNT] on lazy promises', async ({render}) => {
							await render(e);
							expect(Lazy).not.toBeMounted();
							expect(Lazy2).not.toHaveBeenCalled();
						}, {fallbackFast: true});
					});

					describe('and lazy after Suspense', () => {
						let e, Lazy, Lazy2, Fallback;
						beforeEach(() => {
							Lazy = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Fallback = spy(() => <span>Fallback 1</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Suspense fallback={<Fallback/>}>
											<Lazy2/>
										</Suspense>
										<Lazy/>
									</Suspense>
								</div>
							);
						});

						itRenders('does not trigger inner Suspense fallbacks', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).not.toHaveBeenCalled();
						}, {fallbackFast: true});

						itRenders('does not call [ON_MOUNT] on lazy promises', async ({render}) => {
							await render(e);
							expect(Lazy).not.toBeMounted();
							expect(Lazy2).not.toBeMounted();
						}, {fallbackFast: true});
					});

					describe('and nested lazy', () => {
						let e, LazyInner, Lazy, Lazy2, Fallback;
						beforeEach(() => {
							LazyInner = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy = lazy(() => <LazyInner/>);
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Fallback = spy(() => <span>Fallback 1</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Lazy/>
										<Suspense fallback={<Fallback/>}>
											<Lazy2/>
										</Suspense>
									</Suspense>
								</div>
							);
						});

						itRenders('does not trigger inner Suspense fallbacks', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).not.toHaveBeenCalled();
						}, {fallbackFast: true});

						itRenders('does not call [ON_MOUNT] on lazy promises', async ({render}) => {
							await render(e);
							expect(LazyInner).not.toBeMounted();
							expect(Lazy).not.toBeMounted();
							expect(Lazy2).not.toBeMounted();
						}, {fallbackFast: true});
					});
				});

				describe('nested 2 deep', () => {
					describe('and lazy before Suspense', () => {
						let e, Lazy, Lazy2, Fallback, Fallback2;
						beforeEach(() => {
							Lazy = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Fallback = spy(() => <span>Fallback 1</span>);
							Fallback2 = spy(() => <span>Fallback 2</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Lazy/>
										<Suspense fallback={<Fallback/>}>
											<Suspense fallback={<Fallback2/>}>
												<Lazy2/>
											</Suspense>
										</Suspense>
									</Suspense>
								</div>
							);
						});

						itRenders('does not trigger inner Suspense fallbacks', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).not.toHaveBeenCalled();
							expect(Fallback2).not.toHaveBeenCalled();
						}, {fallbackFast: true});

						itRenders('does not call [ON_MOUNT] on lazy promises', async ({render}) => {
							await render(e);
							expect(Lazy).not.toBeMounted();
							expect(Lazy2).not.toHaveBeenCalled();
						}, {fallbackFast: true});
					});

					describe('and lazy after Suspense', () => {
						let e, Lazy, Lazy2, Fallback, Fallback2;
						beforeEach(() => {
							Lazy = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Fallback = spy(() => <span>Fallback 1</span>);
							Fallback2 = spy(() => <span>Fallback 2</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Suspense fallback={<Fallback/>}>
											<Suspense fallback={<Fallback2/>}>
												<Lazy2/>
											</Suspense>
										</Suspense>
										<Lazy/>
									</Suspense>
								</div>
							);
						});

						itRenders('does not trigger inner Suspense fallbacks', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).not.toHaveBeenCalled();
							expect(Fallback2).not.toHaveBeenCalled();
						}, {fallbackFast: true});

						itRenders('does not call [ON_MOUNT] on lazy promises', async ({render}) => {
							await render(e);
							expect(Lazy).not.toBeMounted();
							expect(Lazy2).not.toBeMounted();
						}, {fallbackFast: true});
					});

					describe('and nested lazy', () => {
						let e, LazyInner, Lazy, Lazy2, Fallback, Fallback2;
						beforeEach(() => {
							LazyInner = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy = lazy(() => <LazyInner/>);
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Fallback = spy(() => <span>Fallback 1</span>);
							Fallback2 = spy(() => <span>Fallback 2</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Lazy/>
										<Suspense fallback={<Fallback/>}>
											<Suspense fallback={<Fallback2/>}>
												<Lazy2/>
											</Suspense>
										</Suspense>
									</Suspense>
								</div>
							);
						});

						itRenders('does not trigger inner Suspense fallbacks', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).not.toHaveBeenCalled();
							expect(Fallback2).not.toHaveBeenCalled();
						}, {fallbackFast: true});

						itRenders('does not call [ON_MOUNT] on lazy promises', async ({render}) => {
							await render(e);
							expect(LazyInner).not.toBeMounted();
							expect(Lazy).not.toBeMounted();
							expect(Lazy2).not.toBeMounted();
						}, {fallbackFast: true});
					});
				});

				describe('nested 2 deep with both suspenses containing lazy elements', () => {
					describe('and lazy before Suspense', () => {
						let e, Lazy, Lazy2, Lazy3, Fallback, Fallback2;
						beforeEach(() => {
							Lazy = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Lazy3 = lazy(() => <div>Lazy 2</div>);
							Fallback = spy(() => <span>Fallback 1</span>);
							Fallback2 = spy(() => <span>Fallback 2</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Lazy/>
										<Suspense fallback={<Fallback/>}>
											<Suspense fallback={<Fallback2/>}>
												<Lazy2/>
											</Suspense>
											<Lazy3/>
										</Suspense>
									</Suspense>
								</div>
							);
						});

						itRenders('does not trigger inner Suspense fallbacks', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).not.toHaveBeenCalled();
							expect(Fallback2).not.toHaveBeenCalled();
						}, {fallbackFast: true});

						itRenders('does not call [ON_MOUNT] on lazy promises', async ({render}) => {
							await render(e);
							expect(Lazy).not.toBeMounted();
							expect(Lazy2).not.toHaveBeenCalled();
							expect(Lazy3).not.toHaveBeenCalled();
						}, {fallbackFast: true});
					});

					describe('and lazy after Suspense', () => {
						let e, Lazy, Lazy2, Lazy3, Fallback, Fallback2;
						beforeEach(() => {
							Lazy = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Lazy3 = lazy(() => <div>Lazy 2</div>);
							Fallback = spy(() => <span>Fallback 1</span>);
							Fallback2 = spy(() => <span>Fallback 2</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Suspense fallback={<Fallback/>}>
											<Suspense fallback={<Fallback2/>}>
												<Lazy2/>
											</Suspense>
											<Lazy3/>
										</Suspense>
										<Lazy/>
									</Suspense>
								</div>
							);
						});

						itRenders('does not trigger inner Suspense fallbacks', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).not.toHaveBeenCalled();
							expect(Fallback2).not.toHaveBeenCalled();
						}, {fallbackFast: true});

						itRenders('does not call [ON_MOUNT] on lazy promises', async ({render}) => {
							await render(e);
							expect(Lazy).not.toBeMounted();
							expect(Lazy2).not.toBeMounted();
							expect(Lazy3).not.toBeMounted();
						}, {fallbackFast: true});
					});

					describe('and nested lazy', () => {
						let e, LazyInner, Lazy, Lazy2, Lazy3, Fallback, Fallback2;
						beforeEach(() => {
							LazyInner = lazy(() => <div>Lazy</div>, {noSsr: true});
							Lazy = lazy(() => <LazyInner/>);
							Lazy2 = lazy(() => <div>Lazy 2</div>);
							Lazy3 = lazy(() => <div>Lazy 2</div>);
							Fallback = spy(() => <span>Fallback 1</span>);
							Fallback2 = spy(() => <span>Fallback 2</span>);

							e = (
								<div>
									<Suspense fallback={<span>Fallback outer</span>}>
										<Lazy/>
										<Suspense fallback={<Fallback/>}>
											<Suspense fallback={<Fallback2/>}>
												<Lazy2/>
											</Suspense>
											<Lazy3/>
										</Suspense>
									</Suspense>
								</div>
							);
						});

						itRenders('does not trigger inner Suspense fallbacks', async ({render, openTag}) => {
							const h = await render(e);
							expect(h).toBe(`<div${openTag}><span>Fallback outer</span></div>`);
							expect(Fallback).not.toHaveBeenCalled();
							expect(Fallback2).not.toHaveBeenCalled();
						}, {fallbackFast: true});

						itRenders('does not call [ON_MOUNT] on lazy promises', async ({render}) => {
							await render(e);
							expect(LazyInner).not.toBeMounted();
							expect(Lazy).not.toBeMounted();
							expect(Lazy2).not.toBeMounted();
							expect(Lazy3).not.toBeMounted();
						}, {fallbackFast: true});
					});
				});
			});
		});
	});

	describe('not inside Suspense', () => {
		itRenders('rejects', async ({render}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>);

			const e = <div><Lazy/></div>;

			const p = render(e);
			await expect(p).rejects.toThrow(NO_SUSPENSE_ERROR);
		});

		itRenders('calls `[ABORT]()` on promise', async ({render}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>);

			const e = <div><Lazy/></div>;

			const p = render(e);
			preventUnhandledRejection(p);

			expect(Lazy.promise[ABORT]).toHaveBeenCalledTimes(1);

			await expect(p).rejects.toThrow(NO_SUSPENSE_ERROR);
		});
	});

	describe('inside Suspense with no fallback', () => {
		itRenders('rejects', async ({render}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>);

			const e = (
				<div>
					<Suspense>
						<Lazy/>
					</Suspense>
				</div>
			);

			const p = render(e);
			await expect(p).rejects.toThrow(NO_SUSPENSE_ERROR);
		});

		itRenders('calls `[ABORT]()` on promise', async ({render}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>);

			const e = (
				<div>
					<Suspense>
						<Lazy/>
					</Suspense>
				</div>
			);

			const p = render(e);
			preventUnhandledRejection(p);

			expect(Lazy.promise[ABORT]).toHaveBeenCalledTimes(1);

			await expect(p).rejects.toThrow(NO_SUSPENSE_ERROR);
		});
	});
});

describe('multiple lazy components', () => {
	describe('with no no-SSR promises', () => {
		let e, Lazy1, Lazy2, Lazy3;
		beforeEach(() => {
			Lazy1 = lazy(() => <div>Lazy inner 1</div>);
			Lazy2 = lazy(() => <div>Lazy inner 2</div>);
			Lazy3 = lazy(() => <div>Lazy inner 3</div>);

			e = (
				<div>
					<Suspense fallback={<span>Fallback</span>}>
						<Lazy1/>
						<Lazy2/>
						<Lazy3/>
					</Suspense>
				</div>
			);
		});

		itRenders('renders all lazily', async ({render, openTag}) => {
			const h = await render(e);
			expect(h).toBe(removeSpacing(`
				<div${openTag}>
					<div>Lazy inner 1</div>
					<div>Lazy inner 2</div>
					<div>Lazy inner 3</div>
				</div>
			`));
		});

		itRenders('renders all in parallel', async ({render}) => {
			const p = render(e);
			preventUnhandledRejection(p);
			expect(Lazy1).toHaveBeenCalled();
			expect(Lazy2).toHaveBeenCalled();
			expect(Lazy3).toHaveBeenCalled();
			await p;
		});

		itRenders('calls [ON_MOUNT] on all promises', async ({render}) => {
			await render(e);
			expect(Lazy1).toBeMountedWith(true);
			expect(Lazy2).toBeMountedWith(true);
			expect(Lazy3).toBeMountedWith(true);
			expect(Lazy1).toBeMountedBefore(Lazy2);
			expect(Lazy2).toBeMountedBefore(Lazy3);
		});
	});

	describe('any one throwing no SSR promise aborts render and', () => {
		itRenders('renders fallback', async ({render, openTag}) => {
			const Lazy1 = lazy(() => <div>Lazy inner 1</div>);
			const Lazy2 = lazy(() => <div>Lazy inner 2</div>, {noSsr: true});
			const Lazy3 = lazy(() => <div>Lazy inner 3</div>);

			const e = (
				<div>
					<div>Before Suspense</div>
					<Suspense fallback={<span>Fallback</span>}>
						<div>Before Lazy</div>
						<Lazy1/>
						<Lazy2/>
						<Lazy3/>
						<div>After Lazy</div>
					</Suspense>
					<div>After Suspense</div>
				</div>
			);

			const h = await render(e);
			expect(h).toBe(removeSpacing(`
				<div${openTag}>
					<div>Before Suspense</div>
					<span>Fallback</span>
					<div>After Suspense</div>
				</div>
			`));
		});

		describe('with fallbackFast mode disabled', () => {
			let e, Lazy1, Lazy2, Lazy3, Lazy4;
			beforeEach(() => {
				Lazy1 = lazy(() => <div>Lazy inner 1</div>);
				Lazy2 = lazy(() => <div>Lazy inner 2</div>, {noSsr: true});
				Lazy3 = lazy(() => <div>Lazy inner 3</div>);
				Lazy4 = lazy(() => <div>Lazy inner 4</div>);

				e = (
					<div>
						<Suspense fallback={<span>Fallback outer</span>}>
							<Suspense fallback={<span>Fallback</span>}>
								<Lazy1/>
								<Lazy2/>
								<Lazy3/>
							</Suspense>
							<Lazy4/>
						</Suspense>
					</div>
				);
			});

			itRenders('still renders later elements', async ({render, openTag}) => {
				const h = await render(e);

				expect(Lazy1).toHaveBeenCalled();
				expect(Lazy2).toHaveBeenCalled();
				expect(Lazy3).toHaveBeenCalled();
				expect(Lazy4).toHaveBeenCalled();

				expect(h).toBe(removeSpacing(`
					<div${openTag}>
						<span>Fallback</span>
						<div>Lazy inner 4</div>
					</div>
				`));
			}, {fallbackFast: false});

			itRenders('calls [ON_MOUNT] with false on promises inside suspense', async ({render}) => {
				await render(e);
				expect(Lazy1).toBeMountedWith(false);
				expect(Lazy2).toBeMountedWith(false);
				expect(Lazy3).toBeMountedWith(false);
				expect(Lazy1).toBeMountedBefore(Lazy2);
				expect(Lazy2).toBeMountedBefore(Lazy3);
			}, {fallbackFast: false});

			itRenders('calls [ON_MOUNT] with true on promises outside suspense', async ({render}) => {
				await render(e);
				expect(Lazy4).toBeMountedWith(true);
				expect(Lazy3).toBeMountedBefore(Lazy4);
			}, {fallbackFast: false});
		});

		describe('with fallbackFast mode enabled', () => {
			let e, Lazy1, Lazy2, Lazy3, Lazy4;
			beforeEach(() => {
				Lazy1 = lazy(() => <div>Lazy inner 1</div>);
				Lazy2 = lazy(() => <div>Lazy inner 2</div>, {noSsr: true});
				Lazy3 = lazy(() => <div>Lazy inner 3</div>);
				Lazy4 = lazy(() => <div>Lazy inner 4</div>);

				e = (
					<div>
						<Suspense fallback={<span>Fallback outer</span>}>
							<Suspense fallback={<span>Fallback</span>}>
								<Lazy1/>
								<Lazy2/>
								<Lazy3/>
							</Suspense>
							<Lazy4/>
						</Suspense>
					</div>
				);
			});

			itRenders('does not render later elements', async ({render, openTag}) => {
				const h = await render(e);

				expect(Lazy1).toHaveBeenCalled();
				expect(Lazy2).toHaveBeenCalled();
				expect(Lazy3).not.toHaveBeenCalled();
				expect(Lazy4).toHaveBeenCalled();

				expect(h).toBe(removeSpacing(`
					<div${openTag}>
						<span>Fallback</span>
						<div>Lazy inner 4</div>
					</div>
				`));
			}, {fallbackFast: true});

			itRenders('does not call [ON_MOUNT] on promises inside suspense', async ({render}) => {
				await render(e);
				expect(Lazy1).not.toBeMounted();
				expect(Lazy2).not.toBeMounted();
				expect(Lazy3).not.toBeMounted();
			}, {fallbackFast: true});

			itRenders('calls [ON_MOUNT] with true on promises outside suspense', async ({render}) => {
				await render(e);
				expect(Lazy4).toBeMountedWith(true);
			}, {fallbackFast: true});
		});

		itRenders('does not await previous promises', async ({render, openTag}) => {
			// Lazy1 + Lazy2 throw promises which never resolve
			const Lazy1 = () => {throw new Promise(() => {});};
			const Lazy2 = () => {throw new Promise(() => {});};
			const Lazy3 = lazy(() => <div>Lazy inner 3</div>, {noSsr: true});
			const Lazy4 = lazy(() => <div>Lazy inner 4</div>);

			const e = (
				<div>
					<Suspense fallback={<span>Fallback outer</span>}>
						<Suspense fallback={<span>Fallback</span>}>
							<Lazy1/>
							<Lazy2/>
							<Lazy3/>
						</Suspense>
						<Lazy4/>
					</Suspense>
				</div>
			);

			const h = await render(e);

			expect(h).toBe(removeSpacing(`
				<div${openTag}>
					<span>Fallback</span>
					<div>Lazy inner 4</div>
				</div>
			`));
		});

		itRenders('calls `[ABORT]()` on all promises inside suspense',
			async ({render, fallbackFast, openTag}) => {
				const Lazy1 = lazy(() => <div>Lazy inner 1</div>);
				const Lazy2 = lazy(() => <div>Lazy inner 2</div>, {noSsr: true});
				const Lazy3 = lazy(() => <div>Lazy inner 3</div>);
				const Lazy4 = lazy(() => <div>Lazy inner 4</div>);

				const e = (
					<div>
						<Suspense fallback={<span>Fallback outer</span>}>
							<Suspense fallback={<span>Fallback</span>}>
								<Lazy1/>
								<Lazy2/>
								<Lazy3/>
							</Suspense>
							<Lazy4/>
						</Suspense>
					</div>
				);

				const p = render(e);
				preventUnhandledRejection(p);

				expect(Lazy1.promise[ABORT]).toHaveBeenCalledTimes(1);
				expect(Lazy2.promise[ABORT]).toHaveBeenCalledTimes(1);
				if (fallbackFast) {
					expect(Lazy3).not.toHaveBeenCalled();
				} else {
					expect(Lazy3.promise[ABORT]).toHaveBeenCalledTimes(1);
				}
				expect(Lazy4.promise[ABORT]).not.toHaveBeenCalled();

				const h = await p;
				expect(h).toBe(`<div${openTag}><span>Fallback</span><div>Lazy inner 4</div></div>`);
			}
		);
	});

	describe('outside suspense', () => {
		itRenders('rejects promise', async ({render}) => {
			const Lazy1 = lazy(() => <div>Lazy inner 1</div>);
			const Lazy2 = lazy(() => <div>Lazy inner 2</div>);
			const Lazy3 = lazy(() => <div>Lazy inner 3</div>);

			const e = (
				<div>
					<Lazy1/>
					<Lazy2/>
					<Lazy3/>
				</div>
			);

			const p = render(e);
			await expect(p).rejects.toThrow(NO_SUSPENSE_ERROR);
		});

		itRenders('prevents later elements being rendered', async ({render}) => {
			const Lazy1 = lazy(() => <div>Lazy inner 1</div>);
			const Lazy2 = lazy(() => <div>Lazy inner 2</div>);
			const Lazy3 = lazy(() => <div>Lazy inner 3</div>);

			const e = (
				<div>
					<Lazy1/>
					<Lazy2/>
					<Lazy3/>
				</div>
			);

			const p = render(e);
			preventUnhandledRejection(p);

			expect(Lazy1).toHaveBeenCalled();
			expect(Lazy2).not.toHaveBeenCalled();
			expect(Lazy3).not.toHaveBeenCalled();

			await expect(p).rejects.toThrow(NO_SUSPENSE_ERROR);
		});
	});
});

describe('nested lazy components', () => {
	describe('with no no-SSR promises', () => {
		let e, Lazy, Lazy2, Lazy3;
		beforeEach(() => {
			Lazy3 = lazy(() => <div>Lazy inner</div>);
			Lazy2 = lazy(() => <div>Before Lazy Layer 2<Lazy3/>After Lazy Layer 2</div>);
			Lazy = lazy(() => <div>Before Lazy Layer 1<Lazy2/>After Lazy Layer 1</div>);

			e = (
				<div>
					<div>Before Suspense</div>
					<Suspense fallback={<span>Fallback</span>}>
						<div>Before Lazy</div>
						<Lazy/>
						<div>After Lazy</div>
					</Suspense>
					<div>After Suspense</div>
				</div>
			);
		});

		itRenders('renders lazily', async ({render, openTag}) => {
			const h = await render(e);
			expect(h).toBe(removeSpacing(`
				<div${openTag}>
					<div>Before Suspense</div>
					<div>Before Lazy</div>
					<div>
						Before Lazy Layer 1
						<div>
							Before Lazy Layer 2
							<div>Lazy inner</div>
							After Lazy Layer 2
						</div>
						After Lazy Layer 1
					</div>
					<div>After Lazy</div>
					<div>After Suspense</div>
				</div>
			`));
		});

		itRenders('calls [ON_MOUNT] on all promises with true', async ({render}) => {
			await render(e);
			expect(Lazy).toBeMountedWith(true);
			expect(Lazy2).toBeMountedWith(true);
			expect(Lazy3).toBeMountedWith(true);
			expect(Lazy).toBeMountedBefore(Lazy2);
			expect(Lazy2).toBeMountedBefore(Lazy3);
		});
	});

	describe('when promise marked no SSR', () => {
		describe('nested 1 deep', () => {
			let e, Lazy, LazyInner;
			beforeEach(() => {
				LazyInner = lazy(() => <div>Lazy inner</div>, {noSsr: true});
				Lazy = lazy(() => <div>Before Lazy Layer 1<LazyInner/>After Lazy Layer 1</div>);

				e = (
					<div>
						<div>Before Suspense</div>
						<Suspense fallback={<span>Fallback</span>}>
							<div>Before Lazy</div>
							<Lazy/>
							<div>After Lazy</div>
						</Suspense>
						<div>After Suspense</div>
					</div>
				);
			});

			itRenders('renders fallback', async ({render, openTag}) => {
				const h = await render(e);
				expect(h).toBe(removeSpacing(`
					<div${openTag}>
						<div>Before Suspense</div>
						<span>Fallback</span>
						<div>After Suspense</div>
					</div>
				`));
			});

			itRenders('calls [ON_MOUNT] with false on outer promise only when fallbackFast mode disabled', async ({render}) => {
				await render(e);
				expect(Lazy).toBeMountedWith(false);
				expect(LazyInner).not.toBeMounted();
			}, {fallbackFast: false});

			itRenders('does not call [ON_MOUNT] on promises when fallbackFast mode enabled', async ({render}) => {
				await render(e);
				expect(Lazy).not.toBeMounted();
				expect(LazyInner).not.toBeMounted();
			}, {fallbackFast: true});
		});

		describe('nested 2 deep', () => {
			let e, Lazy, LazyInner, LazyInnerInner;
			beforeEach(() => {
				LazyInnerInner = lazy(() => <div>Lazy inner</div>, {noSsr: true});
				LazyInner = lazy(
					() => <div>Before Lazy Layer 2<LazyInnerInner/>After Lazy Layer 2</div>
				);
				Lazy = lazy(() => <div>Before Lazy Layer 1<LazyInner/>After Lazy Layer 1</div>);

				e = (
					<div>
						<div>Before Suspense</div>
						<Suspense fallback={<span>Fallback</span>}>
							<div>Before Lazy</div>
							<Lazy/>
							<div>After Lazy</div>
						</Suspense>
						<div>After Suspense</div>
					</div>
				);
			});

			itRenders('renders fallback', async ({render, openTag}) => {
				const h = await render(e);
				expect(h).toBe(removeSpacing(`
					<div${openTag}>
						<div>Before Suspense</div>
						<span>Fallback</span>
						<div>After Suspense</div>
					</div>
				`));
			});

			itRenders('calls [ON_MOUNT] with false on outer promise only when fallbackFast mode disabled', async ({render}) => {
				await render(e);
				expect(Lazy).toBeMountedWith(false);
				expect(LazyInner).not.toBeMounted();
				expect(LazyInnerInner).not.toBeMounted();
			}, {fallbackFast: false});

			itRenders('does not call [ON_MOUNT] on promises when fallbackFast mode enabled', async ({render}) => {
				await render(e);
				expect(Lazy).not.toBeMounted();
				expect(LazyInner).not.toBeMounted();
				expect(LazyInnerInner).not.toBeMounted();
			}, {fallbackFast: true});
		});
	});

	describe('any one throwing promise aborts render and', () => {
		describe('calls `[ABORT]()` on all promises inside suspense', () => {
			itRenders('when triggered from inside nested lazy element', async ({render, openTag}) => {
				const Lazy1 = lazy(() => <div>Lazy inner 1</div>, {delay: 500});
				const Lazy2 = lazy(() => <div>Lazy inner 2</div>, {delay: 500});
				const Lazy3Inner = lazy(() => <div>Lazy inner 3</div>, {noSsr: true});
				const Lazy3 = lazy(() => <Lazy3Inner/>);

				const e = (
					<div>
						<Suspense fallback={<span>Fallback</span>}>
							<Lazy1/>
							<Lazy2/>
							<Lazy3/>
						</Suspense>
					</div>
				);

				const p = render(e);
				preventUnhandledRejection(p);

				await Lazy3.promise;

				expect(Lazy1.promise[ABORT]).toHaveBeenCalledTimes(1);
				expect(Lazy2.promise[ABORT]).toHaveBeenCalledTimes(1);
				expect(Lazy3.promise[ABORT]).not.toHaveBeenCalled();
				expect(Lazy3Inner.promise[ABORT]).toHaveBeenCalledTimes(1);

				const h = await p;

				expect(h).toBe(`<div${openTag}><span>Fallback</span></div>`);
			});

			itRenders('including inside nested lazy element', async ({render, openTag}) => {
				const Lazy1Inner = lazy(() => <div>Lazy inner 1</div>, {delay: 500});
				const Lazy1 = lazy(() => <Lazy1Inner/>);
				const Lazy2Inner = lazy(() => <div>Lazy inner 2</div>, {noSsr: true});
				const Lazy2 = lazy(() => <Lazy2Inner/>);

				const e = (
					<div>
						<Suspense fallback={<span>Fallback</span>}>
							<Lazy1/>
							<Lazy2/>
						</Suspense>
					</div>
				);

				const p = render(e);
				preventUnhandledRejection(p);

				await Lazy1.promise;
				await Lazy2.promise;

				expect(Lazy1.promise[ABORT]).not.toHaveBeenCalled();
				expect(Lazy1Inner.promise[ABORT]).toHaveBeenCalledTimes(1);
				expect(Lazy2.promise[ABORT]).not.toHaveBeenCalled();
				expect(Lazy2Inner.promise[ABORT]).toHaveBeenCalledTimes(1);

				const h = await p;

				expect(h).toBe(`<div${openTag}><span>Fallback</span></div>`);
			});
		});

		itRenders('does not await previous promises', async ({render, openTag}) => {
			// Lazy1 + Lazy2 throw promises which never resolve
			const Lazy1 = () => {throw new Promise(() => {});};
			const Lazy2 = () => {throw new Promise(() => {});};
			const Lazy3Inner = lazy(() => <div>Lazy inner 3</div>, {noSsr: true});
			const Lazy3 = lazy(() => <Lazy3Inner/>);

			const e = (
				<div>
					<Suspense fallback={<span>Fallback</span>}>
						<Lazy1/>
						<Lazy2/>
						<Lazy3/>
					</Suspense>
				</div>
			);

			const h = await render(e);

			expect(h).toBe(`<div${openTag}><span>Fallback</span></div>`);
		});
	});
});
