/* --------------------
 * react-async-ssr module
 * Tests
 * ------------------*/

'use strict';

// Modules
const React = require('react'),
	{Suspense} = React;

// Imports
const {itRenders, lazy, removeSpacing, preventUnhandledRejection} = require('./utils');

// Globals
const spy = jest.fn;

// Constants
const NO_SUSPENSE_ERROR = /^A React component suspended while rendering, but no fallback UI was specified.\n\nAdd a <Suspense fallback=\.\.\.> component higher in the tree to provide a loading indicator or placeholder to display\.$/;

// Tests

describe('lazy component', () => {
	describe('inside Suspense', () => {
		itRenders('renders lazily', async ({render, openTag}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>);

			const e = (
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

		itRenders('renders fallback when marked no SSR', async ({render, openTag}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true});

			const e = (
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

			const h = await render(e);
			expect(h).toBe(removeSpacing(`
				<div${openTag}>
					<div>Before Suspense</div>
					<span>Fallback</span>
					<div>After Suspense</div>
				</div>
			`));
		});

		itRenders('rejects when promise marked no SSR and fallback throws promise and not inside another Suspense', async ({render}) => {
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

		itRenders('renders fallback when marked no SSR and fallback includes lazy component and inside another Suspense', async ({render, openTag}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true});
			const LazyFallback = lazy(() => <div>Lazy fallback</div>);
			const Fallback = () => (
				<div>
					<div>Before Fallback</div>
					<LazyFallback/>
					<div>After Fallback</div>
				</div>
			);

			const e = (
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
	});

	describe('inside nested Suspenses', () => {
		itRenders('renders lazily', async ({render, openTag}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>);

			const e = (
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

		itRenders('renders fallback of inner Suspense when marked no SSR', async ({render, openTag}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true});

			const e = (
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

		itRenders('renders fallback of outer Suspense when marked no SSR and inner fallback throws promise marked no SSR', async ({render, openTag}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true});
			const LazyFallback = lazy(() => <div>Lazy fallback</div>, {noSsr: true});

			const e = (
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

			const h = await render(e);
			expect(h).toBe(removeSpacing(`
				<div${openTag}>
					<div>Before outer Suspense</div>
					<span>Fallback outer</span>
					<div>After outer Suspense</div>
				</div>
			`));
		});

		itRenders('renders fallback of outer Suspense when marked no SSR and inner Suspense has no fallback', async ({render, openTag}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true});

			const e = (
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

			const h = await render(e);
			expect(h).toBe(removeSpacing(`
				<div${openTag}>
					<div>Before outer Suspense</div>
					<span>Fallback outer</span>
					<div>After outer Suspense</div>
				</div>
			`));
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

	describe('not inside Suspense', () => {
		itRenders('rejects', async ({render}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>);

			const e = <div><Lazy/></div>;

			const p = render(e);
			await expect(p).rejects.toThrow(NO_SUSPENSE_ERROR);
		});

		itRenders('calls `.abort()` on promise', async ({render}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>);

			const e = <div><Lazy/></div>;

			const p = render(e);
			preventUnhandledRejection(p);

			expect(Lazy.promise.abort).toHaveBeenCalledTimes(1);

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

		itRenders('calls `.abort()` on promise', async ({render}) => {
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

			expect(Lazy.promise.abort).toHaveBeenCalledTimes(1);

			await expect(p).rejects.toThrow(NO_SUSPENSE_ERROR);
		});
	});
});

describe('multiple lazy components', () => {
	itRenders('renders all lazily', async ({render, openTag}) => {
		const Lazy1 = lazy(() => <div>Lazy inner 1</div>);
		const Lazy2 = lazy(() => <div>Lazy inner 2</div>);
		const Lazy3 = lazy(() => <div>Lazy inner 3</div>);

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
		expect(h).toBe(removeSpacing(`
			<div${openTag}>
				<div>Lazy inner 1</div>
				<div>Lazy inner 2</div>
				<div>Lazy inner 3</div>
			</div>
		`));
	});

	itRenders('renders all in parallel', async ({render, openTag}) => {
		const Lazy1 = spy(lazy(() => <div>Lazy inner 1</div>));
		const Lazy2 = spy(lazy(() => <div>Lazy inner 2</div>));
		const Lazy3 = spy(lazy(() => <div>Lazy inner 3</div>));

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
		expect(Lazy1).toHaveBeenCalled();
		expect(Lazy2).toHaveBeenCalled();
		expect(Lazy3).toHaveBeenCalled();

		const h = await p;
		expect(h).toBe(removeSpacing(`
			<div${openTag}>
				<div>Lazy inner 1</div>
				<div>Lazy inner 2</div>
				<div>Lazy inner 3</div>
			</div>
		`));
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

		itRenders('still renders later elements', async ({render, openTag}) => {
			const Lazy1 = spy(lazy(() => <div>Lazy inner 1</div>));
			const Lazy2 = spy(lazy(() => <div>Lazy inner 2</div>, {noSsr: true}));
			const Lazy3 = spy(lazy(() => <div>Lazy inner 3</div>));
			const Lazy4 = spy(lazy(() => <div>Lazy inner 4</div>));

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

		itRenders('calls `.abort()` on all promises inside suspense', async ({render, openTag}) => {
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

			expect(Lazy1.promise.abort).toHaveBeenCalledTimes(1);
			expect(Lazy2.promise.abort).toHaveBeenCalledTimes(1);
			expect(Lazy3.promise.abort).toHaveBeenCalledTimes(1);
			expect(Lazy4.promise.abort).not.toHaveBeenCalled();

			const h = await p;
			expect(h).toBe(`<div${openTag}><span>Fallback</span><div>Lazy inner 4</div></div>`);
		});
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
			const Lazy1 = spy(lazy(() => <div>Lazy inner 1</div>));
			const Lazy2 = spy(lazy(() => <div>Lazy inner 2</div>));
			const Lazy3 = spy(lazy(() => <div>Lazy inner 3</div>));

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
	itRenders('renders lazily', async ({render, openTag}) => {
		const Lazy3 = lazy(() => <div>Lazy inner</div>);
		const Lazy2 = lazy(() => <div>Before Lazy Layer 2<Lazy3/>After Lazy Layer 2</div>);
		const Lazy = lazy(() => <div>Before Lazy Layer 1<Lazy2/>After Lazy Layer 1</div>);

		const e = (
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

	describe('renders fallback when promise marked no SSR', () => {
		itRenders('when nested 1 deep', async ({render, openTag}) => {
			const LazyInner = lazy(() => <div>Lazy inner</div>, {noSsr: true});
			const Lazy = lazy(() => <div>Before Lazy Layer 1<LazyInner/>After Lazy Layer 1</div>);

			const e = (
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

			const h = await render(e);
			expect(h).toBe(removeSpacing(`
				<div${openTag}>
					<div>Before Suspense</div>
					<span>Fallback</span>
					<div>After Suspense</div>
				</div>
			`));
		});

		itRenders('when nested 2 deep', async ({render, openTag}) => {
			const LazyInnerInner = lazy(() => <div>Lazy inner</div>, {noSsr: true});
			const LazyInner = lazy(
				() => <div>Before Lazy Layer 2<LazyInnerInner/>After Lazy Layer 2</div>
			);
			const Lazy = lazy(() => <div>Before Lazy Layer 1<LazyInner/>After Lazy Layer 1</div>);

			const e = (
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

			const h = await render(e);
			expect(h).toBe(removeSpacing(`
				<div${openTag}>
					<div>Before Suspense</div>
					<span>Fallback</span>
					<div>After Suspense</div>
				</div>
			`));
		});
	});

	describe('any one throwing promise aborts render and', () => {
		describe('calls `.abort()` on all promises inside suspense', () => {
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

				expect(Lazy1.promise.abort).toHaveBeenCalledTimes(1);
				expect(Lazy2.promise.abort).toHaveBeenCalledTimes(1);
				expect(Lazy3.promise.abort).not.toHaveBeenCalled();
				expect(Lazy3Inner.promise.abort).toHaveBeenCalledTimes(1);

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

				expect(Lazy1.promise.abort).not.toHaveBeenCalled();
				expect(Lazy1Inner.promise.abort).toHaveBeenCalledTimes(1);
				expect(Lazy2.promise.abort).not.toHaveBeenCalled();
				expect(Lazy2Inner.promise.abort).toHaveBeenCalledTimes(1);

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
