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

// Globals
const spy = jest.fn;

// Constants
const NO_SUSPENSE_ERROR = 'A React component suspended while rendering, '
	+ 'but no fallback UI was specified.\n\n'
	+ 'Add a <Suspense fallback=...> component higher in the tree to provide '
	+ 'a loading indicator or placeholder to display.';

// Tests

describe('lazy component', () => {
	describe('inside Suspense', () => {
		describe('when promise not marked SSR', () => {
			const itRendersThis = itRenders.extend({
				prep: ({lazy}) => ({
					Lazy: lazy(() => <div>Lazy inner</div>)
				}),
				element: ({Suspense, Lazy}) => (
					<div>
						<div>Before Suspense</div>
						<Suspense fallback={<span>Fallback</span>}>
							<div>Before Lazy</div>
							<Lazy />
							<div>After Lazy</div>
						</Suspense>
						<div>After Suspense</div>
					</div>
				)
			});

			itRendersThis('renders lazily', {
				html: ({openTag}) => (`
					<div${openTag}>
						<div>Before Suspense</div>
						<div>Before Lazy</div>
						<div>Lazy inner</div>
						<div>After Lazy</div>
						<div>After Suspense</div>
					</div>
				`)
			});

			itRendersThis('calls [ON_MOUNT] on promise with true', {
				test({Lazy}) {
					expect(Lazy).toBeMountedWith(true);
				}
			});
		});

		describe('when promise marked no SSR', () => {
			describe('standard fallback', () => {
				const itRendersThis = itRenders.extend({
					prep: ({lazy}) => ({
						Lazy: lazy(() => <div>Lazy inner</div>, {noSsr: true})
					}),
					element: ({Suspended, Lazy}) => (
						<div>
							<div>Before Suspense</div>
							<Suspended fallback={<span>Fallback</span>}>
								<div>Before Lazy</div>
								<Lazy />
								<div>After Lazy</div>
							</Suspended>
							<div>After Suspense</div>
						</div>
					)
				});

				itRendersThis('renders fallback', {
					html: ({openTag}) => (`
						<div${openTag}>
							<div>Before Suspense</div>
							<span>Fallback</span>
							<div>After Suspense</div>
						</div>
					`)
				});

				itRendersThis('calls [ON_MOUNT] on promise with false when fallbackFast mode disabled', {
					fallbackFast: false,
					test({Lazy}) {
						expect(Lazy).toBeMountedWith(false);
					}
				});

				itRendersThis('does not call [ON_MOUNT] on promise when fallbackFast mode enabled', {
					fallbackFast: true,
					test({Lazy}) {
						expect(Lazy).not.toBeMounted();
					}
				});
			});

			itRenders('rejects when fallback throws promise and not inside another Suspense', {
				element({Suspended, lazy}) {
					const Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true}),
						LazyFallback = lazy(() => <div>Fallback</div>);

					return (
						<div>
							<div>Before Suspense</div>
							<Suspended fallback={<LazyFallback />}>
								<div>Before Lazy</div>
								<Lazy />
								<div>After Lazy</div>
							</Suspended>
							<div>After Suspense</div>
						</div>
					);
				},
				async testPromise({promise}) {
					await expect(promise).rejects.toThrow(new Error(NO_SUSPENSE_ERROR));
				}
			});

			describe('when fallback includes lazy component and inside another Suspense', () => {
				const itRendersThis = itRenders.extend({
					prep({lazy}) {
						const Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true}),
							LazyFallback = lazy(() => <div>Lazy fallback</div>),
							Fallback = () => (
								<div>
									<div>Before Fallback</div>
									<LazyFallback />
									<div>After Fallback</div>
								</div>
							);
						return {Lazy, LazyFallback, Fallback};
					},
					element: ({Suspense, Suspended, Lazy, Fallback}) => (
						<Suspense fallback={<span>Fallback outer</span>}>
							<div>
								<div>Before Suspense</div>
								<Suspended fallback={<Fallback />}>
									<div>Before Lazy</div>
									<Lazy />
									<div>After Lazy</div>
								</Suspended>
								<div>After Suspense</div>
							</div>
						</Suspense>
					)
				});

				itRendersThis('renders fallback', {
					html: ({openTag}) => (`
						<div${openTag}>
							<div>Before Suspense</div>
							<div>
								<div>Before Fallback</div>
								<div>Lazy fallback</div>
								<div>After Fallback</div>
							</div>
							<div>After Suspense</div>
						</div>
					`)
				});

				itRendersThis('calls [ON_MOUNT] on promises when fallbackFast mode disabled', {
					fallbackFast: false,
					test({Lazy, LazyFallback}) {
						expect(Lazy).toBeMountedWith(false);
						expect(LazyFallback).toBeMountedWith(true);
						expect(Lazy).toBeMountedBefore(LazyFallback);
					}
				});

				itRendersThis('does not call [ON_MOUNT] on lazy promise when fallbackFast mode enabled', {
					fallbackFast: true,
					test({Lazy}) {
						expect(Lazy).not.toBeMounted();
					}
				});

				itRendersThis('calls [ON_MOUNT] on lazy fallback when fallbackFast mode enabled', {
					fallbackFast: true,
					test({LazyFallback}) {
						expect(LazyFallback).toBeMountedWith(true);
					}
				});
			});
		});
	});

	describe('inside nested Suspenses', () => {
		describe('when promise not marked no SSR', () => {
			const itRendersThis = itRenders.extend({
				prep: ({lazy}) => ({
					Lazy: lazy(() => <div>Lazy inner</div>)
				}),
				element: ({Suspense, Lazy}) => (
					<div>
						<div>Before outer Suspense</div>
						<Suspense fallback={<span>Fallback outer</span>}>
							<div>Before inner Suspense</div>
							<Suspense fallback={<span>Fallback inner</span>}>
								<div>Before Lazy</div>
								<Lazy />
								<div>After Lazy</div>
							</Suspense>
							<div>After inner Suspense</div>
						</Suspense>
						<div>After outer Suspense</div>
					</div>
				)
			});

			itRendersThis('renders lazily', {
				html: ({openTag}) => (`
					<div${openTag}>
						<div>Before outer Suspense</div>
						<div>Before inner Suspense</div>
						<div>Before Lazy</div>
						<div>Lazy inner</div>
						<div>After Lazy</div>
						<div>After inner Suspense</div>
						<div>After outer Suspense</div>
					</div>
				`)
			});

			itRendersThis('calls [ON_MOUNT] on promise with true', {
				test({Lazy}) {
					expect(Lazy).toBeMountedWith(true);
				}
			});
		});

		describe('when promise marked no SSR', () => {
			const itRendersThis = itRenders.extend({
				prep: ({lazy}) => ({
					Lazy: lazy(() => <div>Lazy inner</div>, {noSsr: true})
				}),
				element: ({Suspense, Suspended, Lazy}) => (
					<div>
						<div>Before outer Suspense</div>
						<Suspense fallback={<span>Fallback outer</span>}>
							<div>Before inner Suspense</div>
							<Suspended fallback={<span>Fallback inner</span>}>
								<div>Before Lazy</div>
								<Lazy />
								<div>After Lazy</div>
							</Suspended>
							<div>After inner Suspense</div>
						</Suspense>
						<div>After outer Suspense</div>
					</div>
				)
			});

			itRendersThis('renders fallback of inner Suspense', {
				html: ({openTag}) => (`
					<div${openTag}>
						<div>Before outer Suspense</div>
						<div>Before inner Suspense</div>
						<span>Fallback inner</span>
						<div>After inner Suspense</div>
						<div>After outer Suspense</div>
					</div>
				`)
			});

			itRendersThis('calls [ON_MOUNT] on promise with false when fallbackFast disabled', {
				fallbackFast: false,
				test({Lazy}) {
					expect(Lazy).toBeMountedWith(false);
				}
			});

			itRendersThis('does not call [ON_MOUNT] on promise when fallbackFast enabled', {
				fallbackFast: true,
				test({Lazy}) {
					expect(Lazy).not.toBeMounted();
				}
			});
		});

		describe('when marked no SSR and inner fallback throws promise marked no SSR', () => {
			const itRendersThis = itRenders.extend({
				prep: ({lazy}) => ({
					Lazy: lazy(() => <div>Lazy inner</div>, {noSsr: true}),
					LazyFallback: lazy(() => <div>Lazy fallback</div>, {noSsr: true})
				}),
				element: ({Suspended, Lazy, LazyFallback}) => (
					<div>
						<div>Before outer Suspense</div>
						<Suspended fallback={<span>Fallback outer</span>}>
							<div>Before inner Suspense</div>
							<Suspended fallback={<LazyFallback />}>
								<div>Before Lazy</div>
								<Lazy />
								<div>After Lazy</div>
							</Suspended>
							<div>After inner Suspense</div>
						</Suspended>
						<div>After outer Suspense</div>
					</div>
				)
			});

			itRendersThis('renders fallback', {
				html: ({openTag}) => (`
					<div${openTag}>
						<div>Before outer Suspense</div>
						<span>Fallback outer</span>
						<div>After outer Suspense</div>
					</div>
				`)
			});

			itRendersThis('calls [ON_MOUNT] on lazy promise and fallback promise with false when fallbackFast disabled', {
				fallbackFast: false,
				test({Lazy, LazyFallback}) {
					expect(Lazy).toBeMountedWith(false);
					expect(LazyFallback).toBeMountedWith(false);
					expect(Lazy).toBeMountedBefore(LazyFallback);
				}
			});

			itRendersThis('does not call [ON_MOUNT] on lazy promise or fallback promise when fallbackFast enabled', {
				fallbackFast: true,
				test({Lazy, LazyFallback}) {
					expect(Lazy).not.toBeMounted();
					expect(LazyFallback).not.toBeMounted();
				}
			});
		});

		describe('when marked no SSR and inner Suspense has no fallback', () => {
			const itRendersThis = itRenders.extend({
				prep: ({lazy}) => ({
					Lazy: lazy(() => <div>Lazy inner</div>, {noSsr: true})
				}),
				element: ({Suspense, Suspended, Lazy}) => (
					<div>
						<div>Before outer Suspense</div>
						<Suspended fallback={<span>Fallback outer</span>}>
							<div>Before inner Suspense</div>
							<Suspense>
								<div>Before Lazy</div>
								<Lazy />
								<div>After Lazy</div>
							</Suspense>
							<div>After inner Suspense</div>
						</Suspended>
						<div>After outer Suspense</div>
					</div>
				)
			});

			itRendersThis('renders fallback of outer Suspense', {
				html: ({openTag}) => (`
					<div${openTag}>
						<div>Before outer Suspense</div>
						<span>Fallback outer</span>
						<div>After outer Suspense</div>
					</div>
				`)
			});

			itRendersThis('calls [ON_MOUNT] on lazy promise with false when fallbackFast disabled', {
				fallbackFast: false,
				test({Lazy}) {
					expect(Lazy).toBeMountedWith(false);
				}
			});

			itRendersThis('does not call [ON_MOUNT] on lazy promise when fallbackFast enabled', {
				fallbackFast: true,
				test({Lazy}) {
					expect(Lazy).not.toBeMounted();
				}
			});
		});

		itRenders('rejects when promise marked no SSR and inner fallback throws promise marked no SSR and outer fallback throws promise', {
			element({Suspense, lazy}) {
				const Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true}),
					LazyFallbackInner = lazy(() => <div>Fallback inner</div>, {noSsr: true}),
					LazyFallbackOuter = lazy(() => <div>Fallback outer</div>);

				return (
					<div>
						<div>Before outer Suspense</div>
						<Suspense fallback={<LazyFallbackOuter />}>
							<div>Before inner Suspense</div>
							<Suspense fallback={<LazyFallbackInner />}>
								<div>Before Lazy</div>
								<Lazy />
								<div>After Lazy</div>
							</Suspense>
							<div>After inner Suspense</div>
						</Suspense>
						<div>After outer Suspense</div>
					</div>
				);
			},
			async testPromise({promise}) {
				await expect(promise).rejects.toThrow(new Error(NO_SUSPENSE_ERROR));
			}
		});

		itRenders('rejects when both Suspense elements have no fallback', {
			element({Suspense, lazy}) {
				const Lazy = lazy(() => <div>Lazy inner</div>);

				return (
					<div>
						<div>Before outer Suspense</div>
						<Suspense>
							<div>Before inner Suspense</div>
							<Suspense>
								<div>Before Lazy</div>
								<Lazy />
								<div>After Lazy</div>
							</Suspense>
							<div>After inner Suspense</div>
						</Suspense>
						<div>After outer Suspense</div>
					</div>
				);
			},
			async testPromise({promise}) {
				await expect(promise).rejects.toThrow(new Error(NO_SUSPENSE_ERROR));
			}
		});
	});

	describe('inside Suspense with peer nested Suspense', () => {
		describe('does not trigger inner Suspense fallbacks if promise not marked no SSR', () => {
			const itRendersThis = itRenders.extend({
				prep: ({lazy}) => ({
					Lazy: lazy(() => <div>Lazy</div>),
					Fallback1: spy(() => <span>Fallback 1</span>),
					Fallback2: spy(() => <span>Fallback 2</span>),
					Fallback3: spy(() => <span>Fallback 2</span>)
				})
			});

			itRendersThis('and lazy before Suspense', {
				element: ({Suspense, Lazy, Fallback1, Fallback2, Fallback3}) => (
					<div>
						<Suspense fallback={<span>Fallback outer</span>}>
							<Lazy />
							<Suspense fallback={<Fallback1 />}>
								<Suspense fallback={<Fallback2 />}>
									<div>Inside Suspense 1</div>
								</Suspense>
							</Suspense>
							<Suspense fallback={<Fallback3 />}>
								<div>Inside Suspense 2</div>
							</Suspense>
						</Suspense>
					</div>
				),
				html: ({openTag}) => (`
					<div${openTag}>
						<div>Lazy</div>
						<div>Inside Suspense 1</div>
						<div>Inside Suspense 2</div>
					</div>
				`),
				test({Fallback1, Fallback2, Fallback3}) {
					expect(Fallback1).not.toHaveBeenCalled();
					expect(Fallback2).not.toHaveBeenCalled();
					expect(Fallback3).not.toHaveBeenCalled();
				}
			});

			itRendersThis('and lazy after Suspense', {
				element: ({Suspense, Lazy, Fallback1, Fallback2, Fallback3}) => (
					<div>
						<Suspense fallback={<span>Fallback outer</span>}>
							<Suspense fallback={<Fallback1 />}>
								<Suspense fallback={<Fallback2 />}>
									<div>Inside Suspense 1</div>
								</Suspense>
							</Suspense>
							<Suspense fallback={<Fallback3 />}>
								<div>Inside Suspense 2</div>
							</Suspense>
							<Lazy />
						</Suspense>
					</div>
				),
				html: ({openTag}) => (`
					<div${openTag}>
						<div>Inside Suspense 1</div>
						<div>Inside Suspense 2</div>
						<div>Lazy</div>
					</div>
				`),
				test({Fallback1, Fallback2, Fallback3}) {
					expect(Fallback1).not.toHaveBeenCalled();
					expect(Fallback2).not.toHaveBeenCalled();
					expect(Fallback3).not.toHaveBeenCalled();
				}
			});
		});

		describe('does not trigger inner Suspense fallbacks if promise marked no SSR but no lazy elements within Suspenses', () => {
			const itRendersThis = itRenders.extend({
				prep: ({lazy}) => ({
					Lazy: lazy(() => <div>Lazy</div>, {noSsr: true}),
					Fallback1: spy(() => <span>Fallback 1</span>),
					Fallback2: spy(() => <span>Fallback 2</span>),
					Fallback3: spy(() => <span>Fallback 2</span>)
				})
			});

			itRendersThis('and lazy before Suspense', {
				element: ({Suspense, Suspended, Lazy, Fallback1, Fallback2, Fallback3}) => (
					<div>
						<Suspended fallback={<span>Fallback outer</span>}>
							<Lazy />
							<Suspense fallback={<Fallback1 />}>
								<Suspense fallback={<Fallback2 />}>
									<div>Inside Suspense 1</div>
								</Suspense>
							</Suspense>
							<Suspense fallback={<Fallback3 />}>
								<div>Inside Suspense 2</div>
							</Suspense>
						</Suspended>
					</div>
				),
				html: ({openTag}) => (`
					<div${openTag}>
						<span>Fallback outer</span>
					</div>
				`),
				test({Fallback1, Fallback2, Fallback3}) {
					expect(Fallback1).not.toHaveBeenCalled();
					expect(Fallback2).not.toHaveBeenCalled();
					expect(Fallback3).not.toHaveBeenCalled();
				}
			});

			itRendersThis('and lazy after Suspense', {
				element: ({Suspense, Suspended, Lazy, Fallback1, Fallback2, Fallback3}) => (
					<div>
						<Suspended fallback={<span>Fallback outer</span>}>
							<Suspense fallback={<Fallback1 />}>
								<Suspense fallback={<Fallback2 />}>
									<div>Inside Suspense 1</div>
								</Suspense>
							</Suspense>
							<Suspense fallback={<Fallback3 />}>
								<div>Inside Suspense 2</div>
							</Suspense>
							<Lazy />
						</Suspended>
					</div>
				),
				html: ({openTag}) => (`
					<div${openTag}>
						<span>Fallback outer</span>
					</div>
				`),
				test({Fallback1, Fallback2, Fallback3}) {
					expect(Fallback1).not.toHaveBeenCalled();
					expect(Fallback2).not.toHaveBeenCalled();
					expect(Fallback3).not.toHaveBeenCalled();
				}
			});

			itRenders('and nested lazy', {
				prep({lazy}) {
					const LazyInner = lazy(() => <div>Lazy</div>, {noSsr: true}),
						Lazy = lazy(() => <LazyInner />),
						Fallback1 = spy(() => <span>Fallback 1</span>),
						Fallback2 = spy(() => <span>Fallback 2</span>),
						Fallback3 = spy(() => <span>Fallback 2</span>);
					return {LazyInner, Lazy, Fallback1, Fallback2, Fallback3};
				},
				element: ({Suspense, Suspended, Lazy, Fallback1, Fallback2, Fallback3}) => (
					<div>
						<Suspended fallback={<span>Fallback outer</span>}>
							<Lazy />
							<Suspense fallback={<Fallback1 />}>
								<Suspense fallback={<Fallback2 />}>
									<div>Inside Suspense 1</div>
								</Suspense>
							</Suspense>
							<Suspense fallback={<Fallback3 />}>
								<div>Inside Suspense 2</div>
							</Suspense>
						</Suspended>
					</div>
				),
				html: ({openTag}) => (`
					<div${openTag}>
						<span>Fallback outer</span>
					</div>
				`),
				test({Fallback1, Fallback2, Fallback3}) {
					expect(Fallback1).not.toHaveBeenCalled();
					expect(Fallback2).not.toHaveBeenCalled();
					expect(Fallback3).not.toHaveBeenCalled();
				}
			});
		});

		describe('when promise marked no SSR and lazy elements within Suspenses', () => {
			describe('and fallbackFast mode disabled', () => {
				describe('nested 1 deep', () => {
					describe('and lazy before Suspense', () => {
						const itRendersThis = itRenders.extend({
							prep: ({lazy}) => ({
								Lazy: lazy(() => <div>Lazy</div>, {noSsr: true}),
								Lazy2: lazy(() => <div>Lazy 2</div>),
								Fallback: spy(() => <span>Fallback 1</span>)
							}),
							element: ({Suspense, Suspended, Lazy, Lazy2, Fallback}) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Lazy />
										<Suspense fallback={<Fallback />}>
											<Lazy2 />
										</Suspense>
									</Suspended>
								</div>
							)
						});

						itRendersThis('triggers inner Suspense fallback', {
							fallbackFast: false,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback}) {
								expect(Fallback).toHaveBeenCalledTimes(1);
							}
						});

						itRendersThis('calls [ON_MOUNT] on lazy promises with false', {
							fallbackFast: false,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Lazy, Lazy2}) {
								expect(Lazy).toBeMountedWith(false);
								expect(Lazy2).toBeMountedWith(false);
								expect(Lazy).toBeMountedBefore(Lazy2);
							}
						});
					});

					describe('and lazy after Suspense', () => {
						const itRendersThis = itRenders.extend({
							prep: ({lazy}) => ({
								Lazy: lazy(() => <div>Lazy</div>, {noSsr: true}),
								Lazy2: lazy(() => <div>Lazy 2</div>),
								Fallback: spy(() => <span>Fallback 1</span>)
							}),
							element: ({Suspense, Suspended, Lazy, Lazy2, Fallback}) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Suspense fallback={<Fallback />}>
											<Lazy2 />
										</Suspense>
										<Lazy />
									</Suspended>
								</div>
							)
						});

						itRendersThis('triggers inner Suspense fallback', {
							fallbackFast: false,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback}) {
								expect(Fallback).toHaveBeenCalledTimes(1);
							}
						});

						itRendersThis('calls [ON_MOUNT] on lazy promises with false', {
							fallbackFast: false,
							test({Lazy, Lazy2}) {
								expect(Lazy).toBeMountedWith(false);
								expect(Lazy2).toBeMountedWith(false);
								expect(Lazy2).toBeMountedBefore(Lazy);
							}
						});
					});

					describe('and nested lazy', () => {
						const itRendersThis = itRenders.extend({
							prep({lazy}) {
								const LazyInner = lazy(() => <div>Lazy</div>, {noSsr: true}),
									Lazy = lazy(() => <LazyInner />),
									Lazy2 = lazy(() => <div>Lazy 2</div>),
									Fallback = spy(() => <span>Fallback 1</span>);
								return {LazyInner, Lazy, Lazy2, Fallback};
							},
							element: ({Suspense, Suspended, Lazy, Lazy2, Fallback}) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Lazy />
										<Suspense fallback={<Fallback />}>
											<Lazy2 />
										</Suspense>
									</Suspended>
								</div>
							)
						});

						itRendersThis('triggers inner Suspense fallback', {
							fallbackFast: false,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback}) {
								expect(Fallback).toHaveBeenCalledTimes(1);
							}
						});

						itRendersThis('calls [ON_MOUNT] on lazy promises with false', {
							fallbackFast: false,
							test({LazyInner, Lazy, Lazy2}) {
								expect(LazyInner).not.toBeMounted();
								expect(Lazy).toBeMountedWith(false);
								expect(Lazy2).toBeMountedWith(false);
								expect(Lazy).toBeMountedBefore(Lazy2);
							}
						});
					});
				});

				describe('nested 2 deep', () => {
					describe('and lazy before Suspense', () => {
						const itRendersThis = itRenders.extend({
							prep({lazy}) {
								const Lazy = lazy(() => <div>Lazy</div>, {noSsr: true}),
									Lazy2 = lazy(() => <div>Lazy 2</div>),
									Fallback = spy(() => <span>Fallback 1</span>),
									Fallback2 = spy(() => <span>Fallback 2</span>);
								return {Lazy, Lazy2, Fallback, Fallback2};
							},
							element: ({Suspense, Suspended, Lazy, Lazy2, Fallback, Fallback2}) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Lazy />
										<Suspense fallback={<Fallback />}>
											<Suspense fallback={<Fallback2 />}>
												<Lazy2 />
											</Suspense>
										</Suspense>
									</Suspended>
								</div>
							)
						});

						itRendersThis('triggers inner Suspense fallback', {
							fallbackFast: false,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback, Fallback2}) {
								expect(Fallback).not.toHaveBeenCalled();
								expect(Fallback2).toHaveBeenCalledTimes(1);
							}
						});

						itRendersThis('calls [ON_MOUNT] on lazy promises with false', {
							fallbackFast: false,
							test({Lazy, Lazy2}) {
								expect(Lazy).toBeMountedWith(false);
								expect(Lazy2).toBeMountedWith(false);
								expect(Lazy).toBeMountedBefore(Lazy2);
							}
						});
					});

					describe('and lazy after Suspense', () => {
						const itRendersThis = itRenders.extend({
							prep({lazy}) {
								const Lazy = lazy(() => <div>Lazy</div>, {noSsr: true}),
									Lazy2 = lazy(() => <div>Lazy 2</div>),
									Fallback = spy(() => <span>Fallback 1</span>),
									Fallback2 = spy(() => <span>Fallback 2</span>);
								return {Lazy, Lazy2, Fallback, Fallback2};
							},
							element: ({Suspense, Suspended, Lazy, Lazy2, Fallback, Fallback2}) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Suspense fallback={<Fallback />}>
											<Suspense fallback={<Fallback2 />}>
												<Lazy2 />
											</Suspense>
										</Suspense>
										<Lazy />
									</Suspended>
								</div>
							)
						});

						itRendersThis('triggers inner Suspense fallback', {
							fallbackFast: false,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback, Fallback2}) {
								expect(Fallback).not.toHaveBeenCalled();
								expect(Fallback2).toHaveBeenCalledTimes(1);
							}
						});

						itRendersThis('calls [ON_MOUNT] on lazy promises with false', {
							fallbackFast: false,
							test({Lazy, Lazy2}) {
								expect(Lazy).toBeMountedWith(false);
								expect(Lazy2).toBeMountedWith(false);
								expect(Lazy2).toBeMountedBefore(Lazy);
							}
						});
					});

					describe('and nested lazy', () => {
						const itRendersThis = itRenders.extend({
							prep({lazy}) {
								const LazyInner = lazy(() => <div>Lazy</div>, {noSsr: true}),
									Lazy = lazy(() => <LazyInner />),
									Lazy2 = lazy(() => <div>Lazy 2</div>),
									Fallback = spy(() => <span>Fallback 1</span>),
									Fallback2 = spy(() => <span>Fallback 2</span>);
								return {LazyInner, Lazy, Lazy2, Fallback, Fallback2};
							},
							element: ({Suspense, Suspended, Lazy, Lazy2, Fallback, Fallback2}) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Lazy />
										<Suspense fallback={<Fallback />}>
											<Suspense fallback={<Fallback2 />}>
												<Lazy2 />
											</Suspense>
										</Suspense>
									</Suspended>
								</div>
							)
						});

						itRendersThis('triggers inner Suspense fallback', {
							fallbackFast: false,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback, Fallback2}) {
								expect(Fallback).not.toHaveBeenCalled();
								expect(Fallback2).toHaveBeenCalledTimes(1);
							}
						});

						itRendersThis('calls [ON_MOUNT] on lazy promises with false', {
							fallbackFast: false,
							test({LazyInner, Lazy, Lazy2}) {
								expect(LazyInner).not.toBeMounted();
								expect(Lazy).toBeMountedWith(false);
								expect(Lazy2).toBeMountedWith(false);
								expect(Lazy).toBeMountedBefore(Lazy2);
							}
						});
					});
				});

				describe('nested 2 deep with both suspenses containing lazy elements', () => {
					describe('and lazy before Suspense', () => {
						const itRendersThis = itRenders.extend({
							prep({lazy}) {
								const Lazy = lazy(() => <div>Lazy</div>, {noSsr: true}),
									Lazy2 = lazy(() => <div>Lazy 2</div>),
									Lazy3 = lazy(() => <div>Lazy 3</div>),
									Fallback = spy(() => <span>Fallback 1</span>),
									Fallback2 = spy(() => <span>Fallback 2</span>);
								return {Lazy, Lazy2, Lazy3, Fallback, Fallback2};
							},
							element: (
								{Suspense, Suspended, Lazy, Lazy2, Lazy3, Fallback, Fallback2}
							) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Lazy />
										<Suspense fallback={<Fallback />}>
											<Suspense fallback={<Fallback2 />}>
												<Lazy2 />
											</Suspense>
											<Lazy3 />
										</Suspense>
									</Suspended>
								</div>
							)
						});

						itRendersThis('triggers both inner Suspense fallbacks', {
							fallbackFast: false,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback, Fallback2}) {
								expect(Fallback).toHaveBeenCalledTimes(1);
								expect(Fallback2).toHaveBeenCalledTimes(1);
							}
						});

						itRendersThis('calls [ON_MOUNT] on lazy promises with false', {
							fallbackFast: false,
							test({Lazy, Lazy2, Lazy3}) {
								expect(Lazy).toBeMountedWith(false);
								expect(Lazy2).toBeMountedWith(false);
								expect(Lazy3).toBeMountedWith(false);
								expect(Lazy).toBeMountedBefore(Lazy2);
								expect(Lazy2).toBeMountedBefore(Lazy3);
							}
						});
					});

					describe('and lazy after Suspense', () => {
						const itRendersThis = itRenders.extend({
							prep({lazy}) {
								const Lazy = lazy(() => <div>Lazy</div>, {noSsr: true}),
									Lazy2 = lazy(() => <div>Lazy 2</div>),
									Lazy3 = lazy(() => <div>Lazy 3</div>),
									Fallback = spy(() => <span>Fallback 1</span>),
									Fallback2 = spy(() => <span>Fallback 2</span>);
								return {Lazy, Lazy2, Lazy3, Fallback, Fallback2};
							},
							element: (
								{Suspense, Suspended, Lazy, Lazy2, Lazy3, Fallback, Fallback2}
							) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Suspense fallback={<Fallback />}>
											<Suspense fallback={<Fallback2 />}>
												<Lazy2 />
											</Suspense>
											<Lazy3 />
										</Suspense>
										<Lazy />
									</Suspended>
								</div>
							)
						});

						itRendersThis('triggers both inner Suspense fallbacks', {
							fallbackFast: false,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback, Fallback2}) {
								expect(Fallback).toHaveBeenCalledTimes(1);
								expect(Fallback2).toHaveBeenCalledTimes(1);
							}
						});

						itRendersThis('calls [ON_MOUNT] on lazy promises with false', {
							fallbackFast: false,
							test({Lazy, Lazy2, Lazy3}) {
								expect(Lazy).toBeMountedWith(false);
								expect(Lazy2).toBeMountedWith(false);
								expect(Lazy3).toBeMountedWith(false);
								expect(Lazy2).toBeMountedBefore(Lazy3);
								expect(Lazy3).toBeMountedBefore(Lazy);
							}
						});
					});

					describe('and nested lazy', () => {
						const itRendersThis = itRenders.extend({
							prep({lazy}) {
								const LazyInner = lazy(() => <div>Lazy</div>, {noSsr: true}),
									Lazy = lazy(() => <LazyInner />),
									Lazy2 = lazy(() => <div>Lazy 2</div>),
									Lazy3 = lazy(() => <div>Lazy 3</div>),
									Fallback = spy(() => <span>Fallback 1</span>),
									Fallback2 = spy(() => <span>Fallback 2</span>);
								return {LazyInner, Lazy, Lazy2, Lazy3, Fallback, Fallback2};
							},
							element: (
								{Suspense, Suspended, Lazy, Lazy2, Lazy3, Fallback, Fallback2}
							) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Lazy />
										<Suspense fallback={<Fallback />}>
											<Suspense fallback={<Fallback2 />}>
												<Lazy2 />
											</Suspense>
											<Lazy3 />
										</Suspense>
									</Suspended>
								</div>
							)
						});

						itRendersThis('triggers both inner Suspense fallbacks', {
							fallbackFast: false,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback, Fallback2}) {
								expect(Fallback).toHaveBeenCalledTimes(1);
								expect(Fallback2).toHaveBeenCalledTimes(1);
							}
						});

						itRendersThis('calls [ON_MOUNT] on lazy promises with false', {
							fallbackFast: false,
							test({LazyInner, Lazy, Lazy2, Lazy3}) {
								expect(LazyInner).not.toBeMounted();
								expect(Lazy).toBeMountedWith(false);
								expect(Lazy2).toBeMountedWith(false);
								expect(Lazy3).toBeMountedWith(false);
								expect(Lazy).toBeMountedBefore(Lazy2);
								expect(Lazy2).toBeMountedBefore(Lazy3);
							}
						});
					});
				});
			});

			describe('and fallbackFast mode enabled', () => {
				describe('nested 1 deep', () => {
					const itRendersWithTwoLazy = itRenders.extend({
						prep: ({lazy}) => ({
							Lazy: lazy(() => <div>Lazy</div>, {noSsr: true}),
							Lazy2: lazy(() => <div>Lazy 2</div>),
							Fallback: spy(() => <span>Fallback 1</span>)
						})
					});

					describe('and lazy before Suspense', () => {
						const itRendersThis = itRendersWithTwoLazy.extend({
							element: ({Suspense, Suspended, Lazy, Lazy2, Fallback}) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Lazy />
										<Suspense fallback={<Fallback />}>
											<Lazy2 />
										</Suspense>
									</Suspended>
								</div>
							)
						});

						itRendersThis('does not trigger inner Suspense fallbacks', {
							fallbackFast: true,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback}) {
								expect(Fallback).not.toHaveBeenCalled();
							}
						});

						itRendersThis('does not call [ON_MOUNT] on lazy promises', {
							fallbackFast: true,
							test({Lazy, Lazy2}) {
								expect(Lazy).not.toBeMounted();
								expect(Lazy2).not.toHaveBeenCalled();
							}
						});
					});

					describe('and lazy after Suspense', () => {
						const itRendersThis = itRendersWithTwoLazy.extend({
							element: ({Suspense, Suspended, Lazy, Lazy2, Fallback}) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Suspense fallback={<Fallback />}>
											<Lazy2 />
										</Suspense>
										<Lazy />
									</Suspended>
								</div>
							)
						});

						itRendersThis('does not trigger inner Suspense fallbacks', {
							fallbackFast: true,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback}) {
								expect(Fallback).not.toHaveBeenCalled();
							}
						});

						itRendersThis('does not call [ON_MOUNT] on lazy promises', {
							fallbackFast: true,
							test({Lazy, Lazy2}) {
								expect(Lazy).not.toBeMounted();
								expect(Lazy2).not.toBeMounted();
							}
						});
					});

					describe('and nested lazy', () => {
						const itRendersThis = itRenders.extend({
							prep({lazy}) {
								const LazyInner = lazy(() => <div>Lazy</div>, {noSsr: true}),
									Lazy = lazy(() => <LazyInner />),
									Lazy2 = lazy(() => <div>Lazy 2</div>),
									Fallback = spy(() => <span>Fallback 1</span>);
								return {LazyInner, Lazy, Lazy2, Fallback};
							},
							element: ({Suspense, Suspended, Lazy, Lazy2, Fallback}) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Lazy />
										<Suspense fallback={<Fallback />}>
											<Lazy2 />
										</Suspense>
									</Suspended>
								</div>
							)
						});

						itRendersThis('does not trigger inner Suspense fallbacks', {
							fallbackFast: true,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback}) {
								expect(Fallback).not.toHaveBeenCalled();
							}
						});

						itRendersThis('does not call [ON_MOUNT] on lazy promises', {
							fallbackFast: true,
							test({LazyInner, Lazy, Lazy2}) {
								expect(LazyInner).not.toBeMounted();
								expect(Lazy).not.toBeMounted();
								expect(Lazy2).not.toBeMounted();
							}
						});
					});
				});

				describe('nested 2 deep', () => {
					const itRendersWithTwoLazy = itRenders.extend({
						prep: ({lazy}) => ({
							Lazy: lazy(() => <div>Lazy</div>, {noSsr: true}),
							Lazy2: lazy(() => <div>Lazy 2</div>),
							Fallback: spy(() => <span>Fallback 1</span>),
							Fallback2: spy(() => <span>Fallback 2</span>)
						})
					});

					describe('and lazy before Suspense', () => {
						const itRendersThis = itRendersWithTwoLazy.extend({
							element: ({Suspense, Suspended, Lazy, Lazy2, Fallback, Fallback2}) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Lazy />
										<Suspense fallback={<Fallback />}>
											<Suspense fallback={<Fallback2 />}>
												<Lazy2 />
											</Suspense>
										</Suspense>
									</Suspended>
								</div>
							)
						});

						itRendersThis('does not trigger inner Suspense fallbacks', {
							fallbackFast: true,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback, Fallback2}) {
								expect(Fallback).not.toHaveBeenCalled();
								expect(Fallback2).not.toHaveBeenCalled();
							}
						});

						itRendersThis('does not call [ON_MOUNT] on lazy promises', {
							fallbackFast: true,
							test({Lazy, Lazy2}) {
								expect(Lazy).not.toBeMounted();
								expect(Lazy2).not.toHaveBeenCalled();
							}
						});
					});

					describe('and lazy after Suspense', () => {
						const itRendersThis = itRendersWithTwoLazy.extend({
							element: ({Suspense, Suspended, Lazy, Lazy2, Fallback, Fallback2}) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Suspense fallback={<Fallback />}>
											<Suspense fallback={<Fallback2 />}>
												<Lazy2 />
											</Suspense>
										</Suspense>
										<Lazy />
									</Suspended>
								</div>
							)
						});

						itRendersThis('does not trigger inner Suspense fallbacks', {
							fallbackFast: true,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback, Fallback2}) {
								expect(Fallback).not.toHaveBeenCalled();
								expect(Fallback2).not.toHaveBeenCalled();
							}
						});

						itRendersThis('does not call [ON_MOUNT] on lazy promises', {
							fallbackFast: true,
							test({Lazy, Lazy2}) {
								expect(Lazy).not.toBeMounted();
								expect(Lazy2).not.toBeMounted();
							}
						});
					});

					describe('and nested lazy', () => {
						const itRendersThis = itRenders.extend({
							prep({lazy}) {
								const LazyInner = lazy(() => <div>Lazy</div>, {noSsr: true}),
									Lazy = lazy(() => <LazyInner />),
									Lazy2 = lazy(() => <div>Lazy 2</div>),
									Fallback = spy(() => <span>Fallback 1</span>),
									Fallback2 = spy(() => <span>Fallback 2</span>);
								return {LazyInner, Lazy, Lazy2, Fallback, Fallback2};
							},
							element: ({Suspense, Suspended, Lazy, Lazy2, Fallback, Fallback2}) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Lazy />
										<Suspense fallback={<Fallback />}>
											<Suspense fallback={<Fallback2 />}>
												<Lazy2 />
											</Suspense>
										</Suspense>
									</Suspended>
								</div>
							)
						});

						itRendersThis('does not trigger inner Suspense fallbacks', {
							fallbackFast: true,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback, Fallback2}) {
								expect(Fallback).not.toHaveBeenCalled();
								expect(Fallback2).not.toHaveBeenCalled();
							}
						});

						itRendersThis('does not call [ON_MOUNT] on lazy promises', {
							fallbackFast: true,
							test({LazyInner, Lazy, Lazy2}) {
								expect(LazyInner).not.toBeMounted();
								expect(Lazy).not.toBeMounted();
								expect(Lazy2).not.toBeMounted();
							}
						});
					});
				});

				describe('nested 2 deep with both suspenses containing lazy elements', () => {
					const itRendersWithThreeLazy = itRenders.extend({
						prep: ({lazy}) => ({
							Lazy: lazy(() => <div>Lazy</div>, {noSsr: true}),
							Lazy2: lazy(() => <div>Lazy 2</div>),
							Lazy3: lazy(() => <div>Lazy 3</div>),
							Fallback: spy(() => <span>Fallback 1</span>),
							Fallback2: spy(() => <span>Fallback 2</span>)
						})
					});

					describe('and lazy before Suspense', () => {
						const itRendersThis = itRendersWithThreeLazy.extend({
							element: (
								{Suspense, Suspended, Lazy, Lazy2, Lazy3, Fallback, Fallback2}
							) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Lazy />
										<Suspense fallback={<Fallback />}>
											<Suspense fallback={<Fallback2 />}>
												<Lazy2 />
											</Suspense>
											<Lazy3 />
										</Suspense>
									</Suspended>
								</div>
							)
						});

						itRendersThis('does not trigger inner Suspense fallbacks', {
							fallbackFast: true,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback, Fallback2}) {
								expect(Fallback).not.toHaveBeenCalled();
								expect(Fallback2).not.toHaveBeenCalled();
							}
						});

						itRendersThis('does not call [ON_MOUNT] on lazy promises', {
							fallbackFast: true,
							test({Lazy, Lazy2, Lazy3}) {
								expect(Lazy).not.toBeMounted();
								expect(Lazy2).not.toHaveBeenCalled();
								expect(Lazy3).not.toHaveBeenCalled();
							}
						});
					});

					describe('and lazy after Suspense', () => {
						const itRendersThis = itRendersWithThreeLazy.extend({
							element: (
								{Suspense, Suspended, Lazy, Lazy2, Lazy3, Fallback, Fallback2}
							) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Suspense fallback={<Fallback />}>
											<Suspense fallback={<Fallback2 />}>
												<Lazy2 />
											</Suspense>
											<Lazy3 />
										</Suspense>
										<Lazy />
									</Suspended>
								</div>
							)
						});

						itRendersThis('does not trigger inner Suspense fallbacks', {
							fallbackFast: true,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback, Fallback2}) {
								expect(Fallback).not.toHaveBeenCalled();
								expect(Fallback2).not.toHaveBeenCalled();
							}
						});

						itRendersThis('does not call [ON_MOUNT] on lazy promises', {
							fallbackFast: true,
							test({Lazy, Lazy2, Lazy3}) {
								expect(Lazy).not.toBeMounted();
								expect(Lazy2).not.toBeMounted();
								expect(Lazy3).not.toBeMounted();
							}
						});
					});

					describe('and nested lazy', () => {
						const itRendersThis = itRenders.extend({
							prep({lazy}) {
								const LazyInner = lazy(() => <div>Lazy</div>, {noSsr: true}),
									Lazy = lazy(() => <LazyInner />),
									Lazy2 = lazy(() => <div>Lazy 2</div>),
									Lazy3 = lazy(() => <div>Lazy 2</div>),
									Fallback = spy(() => <span>Fallback 1</span>),
									Fallback2 = spy(() => <span>Fallback 2</span>);
								return {LazyInner, Lazy, Lazy2, Lazy3, Fallback, Fallback2};
							},
							element: (
								{Suspense, Suspended, Lazy, Lazy2, Lazy3, Fallback, Fallback2}
							) => (
								<div>
									<Suspended fallback={<span>Fallback outer</span>}>
										<Lazy />
										<Suspense fallback={<Fallback />}>
											<Suspense fallback={<Fallback2 />}>
												<Lazy2 />
											</Suspense>
											<Lazy3 />
										</Suspense>
									</Suspended>
								</div>
							)
						});

						itRendersThis('does not trigger inner Suspense fallbacks', {
							fallbackFast: true,
							html: ({openTag}) => `<div${openTag}><span>Fallback outer</span></div>`,
							test({Fallback, Fallback2}) {
								expect(Fallback).not.toHaveBeenCalled();
								expect(Fallback2).not.toHaveBeenCalled();
							}
						});

						itRendersThis('does not call [ON_MOUNT] on lazy promises', {
							fallbackFast: true,
							test({LazyInner, Lazy, Lazy2, Lazy3}) {
								expect(LazyInner).not.toBeMounted();
								expect(Lazy).not.toBeMounted();
								expect(Lazy2).not.toBeMounted();
								expect(Lazy3).not.toBeMounted();
							}
						});
					});
				});
			});
		});
	});

	describe('not inside Suspense', () => {
		const itRendersThis = itRenders.extend({
			prep: ({lazy}) => ({
				Lazy: lazy(() => <div>Lazy inner</div>)
			}),
			element: ({Lazy}) => (
				<div><Lazy /></div>
			)
		});

		itRendersThis('rejects', {
			async testPromise({promise}) {
				await expect(promise).rejects.toThrow(new Error(NO_SUSPENSE_ERROR));
			}
		});

		itRendersThis('calls `[ABORT]()` on promise', {
			testPromise({Lazy}) {
				expect(Lazy).toBeAborted();
			}
		});
	});

	describe('inside Suspense with no fallback', () => {
		const itRendersThis = itRenders.extend({
			prep: ({lazy}) => ({
				Lazy: lazy(() => <div>Lazy inner</div>)
			}),
			element: ({Suspense, Lazy}) => (
				<div>
					<Suspense>
						<Lazy />
					</Suspense>
				</div>
			)
		});

		itRendersThis('rejects', {
			async testPromise({promise}) {
				await expect(promise).rejects.toThrow(new Error(NO_SUSPENSE_ERROR));
			}
		});

		itRendersThis('calls `[ABORT]()` on promise', {
			testPromise({Lazy}) {
				expect(Lazy).toBeAborted();
			}
		});
	});
});

describe('multiple lazy components', () => {
	describe('with no no-SSR promises', () => {
		const itRendersThis = itRenders.extend({
			prep: ({lazy}) => ({
				Lazy1: lazy(() => <div>Lazy inner 1</div>),
				Lazy2: lazy(() => <div>Lazy inner 2</div>),
				Lazy3: lazy(() => <div>Lazy inner 3</div>)
			}),
			element: ({Suspense, Lazy1, Lazy2, Lazy3}) => (
				<div>
					<Suspense fallback={<span>Fallback</span>}>
						<Lazy1 />
						<Lazy2 />
						<Lazy3 />
					</Suspense>
				</div>
			)
		});

		itRendersThis('renders all lazily', {
			html: ({openTag}) => (`
				<div${openTag}>
					<div>Lazy inner 1</div>
					<div>Lazy inner 2</div>
					<div>Lazy inner 3</div>
				</div>
			`)
		});

		itRendersThis('renders all in parallel', {
			testPromise({Lazy1, Lazy2, Lazy3}) {
				expect(Lazy1).toHaveBeenCalled();
				expect(Lazy2).toHaveBeenCalled();
				expect(Lazy3).toHaveBeenCalled();
			}
		});

		itRendersThis('calls [ON_MOUNT] on all promises', {
			test({Lazy1, Lazy2, Lazy3}) {
				expect(Lazy1).toBeMountedWith(true);
				expect(Lazy2).toBeMountedWith(true);
				expect(Lazy3).toBeMountedWith(true);
				expect(Lazy1).toBeMountedBefore(Lazy2);
				expect(Lazy2).toBeMountedBefore(Lazy3);
			}
		});
	});

	describe('any one throwing no SSR promise aborts render and', () => {
		itRenders('renders fallback', {
			element({Suspended, lazy}) {
				const Lazy1 = lazy(() => <div>Lazy inner 1</div>),
					Lazy2 = lazy(() => <div>Lazy inner 2</div>, {noSsr: true}),
					Lazy3 = lazy(() => <div>Lazy inner 3</div>);

				return (
					<div>
						<div>Before Suspense</div>
						<Suspended fallback={<span>Fallback</span>}>
							<div>Before Lazy</div>
							<Lazy1 />
							<Lazy2 />
							<Lazy3 />
							<div>After Lazy</div>
						</Suspended>
						<div>After Suspense</div>
					</div>
				);
			},
			html: ({openTag}) => (`
				<div${openTag}>
					<div>Before Suspense</div>
					<span>Fallback</span>
					<div>After Suspense</div>
				</div>
			`)
		});

		const itRendersThis = itRenders.extend({
			prep: ({lazy}) => ({
				Lazy1: lazy(() => <div>Lazy inner 1</div>),
				Lazy2: lazy(() => <div>Lazy inner 2</div>, {noSsr: true}),
				Lazy3: lazy(() => <div>Lazy inner 3</div>),
				Lazy4: lazy(() => <div>Lazy inner 4</div>)
			}),
			element: ({Suspense, Suspended, Lazy1, Lazy2, Lazy3, Lazy4}) => (
				<div>
					<Suspense fallback={<span>Fallback outer</span>}>
						<Suspended fallback={<span>Fallback</span>}>
							<Lazy1 />
							<Lazy2 />
							<Lazy3 />
						</Suspended>
						<Lazy4 />
					</Suspense>
				</div>
			)
		});

		describe('with fallbackFast mode disabled', () => {
			itRendersThis('still renders later elements', {
				fallbackFast: false,
				html: ({openTag}) => (`
					<div${openTag}>
						<span>Fallback</span>
						<div>Lazy inner 4</div>
					</div>
				`),
				test({Lazy1, Lazy2, Lazy3, Lazy4}) {
					expect(Lazy1).toHaveBeenCalled();
					expect(Lazy2).toHaveBeenCalled();
					expect(Lazy3).toHaveBeenCalled();
					expect(Lazy4).toHaveBeenCalled();
				}
			});

			itRendersThis('calls [ON_MOUNT] with false on promises inside suspense', {
				fallbackFast: false,
				test({Lazy1, Lazy2, Lazy3}) {
					expect(Lazy1).toBeMountedWith(false);
					expect(Lazy2).toBeMountedWith(false);
					expect(Lazy3).toBeMountedWith(false);
					expect(Lazy1).toBeMountedBefore(Lazy2);
					expect(Lazy2).toBeMountedBefore(Lazy3);
				}
			});

			itRendersThis('calls [ON_MOUNT] with true on promises outside suspense', {
				fallbackFast: false,
				test({Lazy3, Lazy4}) {
					expect(Lazy4).toBeMountedWith(true);
					expect(Lazy3).toBeMountedBefore(Lazy4);
				}
			});
		});

		describe('with fallbackFast mode enabled', () => {
			itRendersThis('does not render later elements', {
				fallbackFast: true,
				html: ({openTag}) => (`
					<div${openTag}>
						<span>Fallback</span>
						<div>Lazy inner 4</div>
					</div>
				`),
				test({Lazy1, Lazy2, Lazy3, Lazy4}) {
					expect(Lazy1).toHaveBeenCalled();
					expect(Lazy2).toHaveBeenCalled();
					expect(Lazy3).not.toHaveBeenCalled();
					expect(Lazy4).toHaveBeenCalled();
				}
			});

			itRendersThis('does not call [ON_MOUNT] on promises inside suspense', {
				fallbackFast: true,
				test({Lazy1, Lazy2, Lazy3}) {
					expect(Lazy1).not.toBeMounted();
					expect(Lazy2).not.toBeMounted();
					expect(Lazy3).not.toBeMounted();
				}
			});

			itRendersThis('calls [ON_MOUNT] with true on promises outside suspense', {
				fallbackFast: true,
				test({Lazy4}) {
					expect(Lazy4).toBeMountedWith(true);
				}
			});
		});

		itRendersThis('does not await previous promises', {
			prep: ({lazy}) => ({
				// Lazy1 + Lazy2 throw promises which never resolve
				Lazy1: lazy(() => null, {noResolve: true}),
				Lazy2: lazy(() => null, {noResolve: true}),
				Lazy3: lazy(() => <div>Lazy inner 3</div>, {noSsr: true}),
				Lazy4: lazy(() => <div>Lazy inner 4</div>)
			}),
			// Use `test` rather than `html` here to avoid testing client-side render.
			// The lazy components will never resolve and so `Suspense` will forever
			// be stuck in fallback mode.
			test({html, openTag}) {
				expect(html).toBe(`<div${openTag}><span>Fallback</span><div>Lazy inner 4</div></div>`);
			}
		});

		itRendersThis('calls `[ABORT]()` on all promises inside suspense', {
			async testPromise({promise, fallbackFast, Lazy1, Lazy2, Lazy3, Lazy4}) {
				expect(Lazy1).toBeAborted();
				expect(Lazy2).toBeAborted();
				if (!fallbackFast) expect(Lazy3).toBeAborted();

				await promise;
				if (fallbackFast) expect(Lazy3).not.toHaveBeenCalled();
				expect(Lazy4).not.toBeAborted();
			}
		});
	});

	describe('outside suspense', () => {
		const itRendersThis = itRenders.extend({
			prep: ({lazy}) => ({
				Lazy1: lazy(() => <div>Lazy inner 1</div>),
				Lazy2: lazy(() => <div>Lazy inner 2</div>),
				Lazy3: lazy(() => <div>Lazy inner 3</div>)
			}),
			element: ({Lazy1, Lazy2, Lazy3}) => (
				<div>
					<Lazy1 />
					<Lazy2 />
					<Lazy3 />
				</div>
			)
		});

		itRendersThis('rejects promise', {
			async testPromise({promise}) {
				await expect(promise).rejects.toThrow(new Error(NO_SUSPENSE_ERROR));
			}
		});

		itRendersThis('prevents later elements being rendered', {
			async testPromise({promise, Lazy1, Lazy2, Lazy3}) {
				expect(Lazy1).toHaveBeenCalled();

				await promise.catch(() => {});

				expect(Lazy2).not.toHaveBeenCalled();
				expect(Lazy3).not.toHaveBeenCalled();
			}
		});
	});
});

describe('nested lazy components', () => {
	describe('with no no-SSR promises', () => {
		const itRendersThis = itRenders.extend({
			prep({lazy}) {
				const Lazy3 = lazy(() => <div>Lazy inner</div>),
					Lazy2 = lazy(() => (
						<div>
							Before Lazy Layer 2
							<Lazy3 />
							After Lazy Layer 2
						</div>
					)),
					Lazy = lazy(() => (
						<div>
							Before Lazy Layer 1
							<Lazy2 />
							After Lazy Layer 1
						</div>
					));
				return {Lazy, Lazy2, Lazy3};
			},
			element: ({Suspense, Lazy}) => (
				<div>
					<div>Before Suspense</div>
					<Suspense fallback={<span>Fallback</span>}>
						<div>Before Lazy</div>
						<Lazy />
						<div>After Lazy</div>
					</Suspense>
					<div>After Suspense</div>
				</div>
			)
		});

		itRendersThis('renders lazily', {
			html: ({openTag}) => (`
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
			`)
		});

		itRendersThis('calls [ON_MOUNT] on all promises with true', {
			test({Lazy, Lazy2, Lazy3}) {
				expect(Lazy).toBeMountedWith(true);
				expect(Lazy2).toBeMountedWith(true);
				expect(Lazy3).toBeMountedWith(true);
				expect(Lazy).toBeMountedBefore(Lazy2);
				expect(Lazy2).toBeMountedBefore(Lazy3);
			}
		});
	});

	describe('when promise marked no SSR', () => {
		describe('nested 1 deep', () => {
			const itRendersThis = itRenders.extend({
				prep({lazy}) {
					const LazyInner = lazy(() => <div>Lazy inner</div>, {noSsr: true}),
						Lazy = lazy(() => (
							<div>
								Before Lazy Layer 1
								<LazyInner />
								After Lazy Layer 1
							</div>
						));
					return {Lazy, LazyInner};
				},
				element: ({Suspended, Lazy}) => (
					<div>
						<div>Before Suspense</div>
						<Suspended fallback={<span>Fallback</span>}>
							<div>Before Lazy</div>
							<Lazy />
							<div>After Lazy</div>
						</Suspended>
						<div>After Suspense</div>
					</div>
				)
			});

			itRendersThis('renders fallback', {
				html: ({openTag}) => (`
					<div${openTag}>
						<div>Before Suspense</div>
						<span>Fallback</span>
						<div>After Suspense</div>
					</div>
				`)
			});

			itRendersThis('calls [ON_MOUNT] with false on outer promise only when fallbackFast mode disabled', {
				fallbackFast: false,
				test({Lazy, LazyInner}) {
					expect(Lazy).toBeMountedWith(false);
					expect(LazyInner).not.toBeMounted();
				}
			});

			itRendersThis('does not call [ON_MOUNT] on promises when fallbackFast mode enabled', {
				fallbackFast: true,
				test({Lazy, LazyInner}) {
					expect(Lazy).not.toBeMounted();
					expect(LazyInner).not.toBeMounted();
				}
			});
		});

		describe('nested 2 deep', () => {
			const itRendersThis = itRenders.extend({
				prep({lazy}) {
					const LazyInnerInner = lazy(() => <div>Lazy inner</div>, {noSsr: true}),
						LazyInner = lazy(() => (
							<div>
								Before Lazy Layer 2
								<LazyInnerInner />
								After Lazy Layer 2
							</div>
						)),
						Lazy = lazy(() => (
							<div>
								Before Lazy Layer 1
								<LazyInner />
								After Lazy Layer 1
							</div>
						));
					return {Lazy, LazyInner, LazyInnerInner};
				},
				element: ({Suspended, Lazy}) => (
					<div>
						<div>Before Suspense</div>
						<Suspended fallback={<span>Fallback</span>}>
							<div>Before Lazy</div>
							<Lazy />
							<div>After Lazy</div>
						</Suspended>
						<div>After Suspense</div>
					</div>
				)
			});

			itRendersThis('renders fallback', {
				html: ({openTag}) => (`
					<div${openTag}>
						<div>Before Suspense</div>
						<span>Fallback</span>
						<div>After Suspense</div>
					</div>
				`)
			});

			itRendersThis('calls [ON_MOUNT] with false on outer promise only when fallbackFast mode disabled', {
				fallbackFast: false,
				test({Lazy, LazyInner, LazyInnerInner}) {
					expect(Lazy).toBeMountedWith(false);
					expect(LazyInner).not.toBeMounted();
					expect(LazyInnerInner).not.toBeMounted();
				}
			});

			itRendersThis('does not call [ON_MOUNT] on promises when fallbackFast mode enabled', {
				fallbackFast: true,
				test({Lazy, LazyInner, LazyInnerInner}) {
					expect(Lazy).not.toBeMounted();
					expect(LazyInner).not.toBeMounted();
					expect(LazyInnerInner).not.toBeMounted();
				}
			});
		});
	});

	describe('any one throwing promise aborts render and', () => {
		describe('calls `[ABORT]()` on all promises inside suspense', () => {
			itRenders('when triggered from inside nested lazy element', {
				prep({lazy}) {
					const Lazy1 = lazy(() => <div>Lazy inner 1</div>, {delay: 500}),
						Lazy2 = lazy(() => <div>Lazy inner 2</div>, {delay: 500}),
						Lazy3Inner = lazy(() => <div>Lazy inner 3</div>, {noSsr: true}),
						Lazy3 = lazy(() => <Lazy3Inner />);
					return {Lazy1, Lazy2, Lazy3Inner, Lazy3};
				},
				element: ({Suspended, Lazy1, Lazy2, Lazy3}) => (
					<div>
						<Suspended fallback={<span>Fallback</span>}>
							<Lazy1 />
							<Lazy2 />
							<Lazy3 />
						</Suspended>
					</div>
				),
				async testPromise({promise, Lazy1, Lazy2, Lazy3Inner, Lazy3}) {
					await Lazy3.promise;

					expect(Lazy1).toBeAborted();
					expect(Lazy2).toBeAborted();
					expect(Lazy3Inner).toBeAborted();

					await promise;

					expect(Lazy3).not.toBeAborted();
				},
				html: ({openTag}) => `<div${openTag}><span>Fallback</span></div>`
			});

			itRenders('including inside nested lazy element', {
				prep({lazy}) {
					const Lazy1Inner = lazy(() => <div>Lazy inner 1</div>, {delay: 500}),
						Lazy1 = lazy(() => <Lazy1Inner />),
						Lazy2Inner = lazy(() => <div>Lazy inner 2</div>, {noSsr: true}),
						Lazy2 = lazy(() => <Lazy2Inner />);
					return {Lazy1, Lazy1Inner, Lazy2, Lazy2Inner};
				},
				element: ({Suspended, Lazy1, Lazy2}) => (
					<div>
						<Suspended fallback={<span>Fallback</span>}>
							<Lazy1 />
							<Lazy2 />
						</Suspended>
					</div>
				),
				async testPromise({promise, Lazy1, Lazy1Inner, Lazy2, Lazy2Inner}) {
					await Lazy1.promise;
					await Lazy2.promise;

					expect(Lazy1Inner).toBeAborted();
					expect(Lazy2Inner).toBeAborted();

					await promise;

					expect(Lazy1).not.toBeAborted();
					expect(Lazy2).not.toBeAborted();
				},
				html: ({openTag}) => `<div${openTag}><span>Fallback</span></div>`
			});
		});

		itRenders('does not await previous promises', {
			element({Suspended, lazy}) {
				// Lazy1 + Lazy2 throw promises which never resolve
				const Lazy1 = lazy(() => null, {noResolve: true}),
					Lazy2 = lazy(() => null, {noResolve: true}),
					Lazy3Inner = lazy(() => <div>Lazy inner 3</div>, {noSsr: true}),
					Lazy3 = lazy(() => <Lazy3Inner />);

				return (
					<div>
						<Suspended fallback={<span>Fallback</span>}>
							<Lazy1 />
							<Lazy2 />
							<Lazy3 />
						</Suspended>
					</div>
				);
			},
			// Use `test` rather than `html` here to avoid testing client-side render.
			// The lazy components will never resolve and so `Suspense` will forever
			// be stuck in fallback mode.
			test({html, openTag}) {
				expect(html).toBe(`<div${openTag}><span>Fallback</span></div>`);
			}
		});
	});
});
