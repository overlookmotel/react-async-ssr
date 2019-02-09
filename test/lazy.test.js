/* --------------------
 * react-async-ssr module
 * Tests
 * ------------------*/

'use strict';

// Modules
const React = require('react'),
	{Suspense} = React;

// Imports
const {itRenders, lazy, removeSpacing} = require('./utils');

// Globals
const spy = jest.fn;

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

		itRenders('renders fallback when marked no SSR and fallback includes lazy component', async ({render, openTag}) => {
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
				<div>
					<div>Before Suspense</div>
					<Suspense fallback={<Fallback/>}>
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
					<div>
						<div>Before Fallback</div>
						<div>Lazy fallback</div>
						<div>After Fallback</div>
					</div>
					<div>After Suspense</div>
				</div>
			`));
		});

		itRenders('rejects when promise marked no SSR and fallback throws promise marked no SSR', async ({render}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true});
			const LazyFallback = lazy(() => <div>Fallback</div>, {noSsr: true});

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
			await expect(p).rejects.toBe(LazyFallback.promise);
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

		itRenders('rejects when promise marked no SSR and both fallbacks throw promises marked no SSR', async ({render}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true});
			const LazyFallbackInner = lazy(() => <div>Fallback inner</div>, {noSsr: true});
			const LazyFallbackOuter = lazy(() => <div>Fallback outer</div>, {noSsr: true});

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
			await expect(p).rejects.toBe(LazyFallbackOuter.promise);
		});
	});

	describe('not inside Suspense', () => {
		itRenders('renders lazily', async ({render, openTag}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>);

			const e = (
				<div>
					<Lazy/>
				</div>
			);

			const h = await render(e);
			expect(h).toBe(removeSpacing(`
				<div${openTag}>
					<div>Lazy inner</div>
				</div>
			`));
		});

		itRenders('rejects when promise marked no SSR', async ({render}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true});

			const e = <div><Lazy/></div>;

			const p = render(e);
			await expect(p).rejects.toBe(Lazy.promise);
		});
	});
});

describe('multiple lazy components', () => {
	describe('renders all lazily', () => {
		itRenders('with no Suspense', async ({render, openTag}) => {
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

			const h = await render(e);
			expect(h).toBe(removeSpacing(`
				<div${openTag}>
					<div>Lazy inner 1</div>
					<div>Lazy inner 2</div>
					<div>Lazy inner 3</div>
				</div>
			`));
		});

		itRenders('inside Suspense', async ({render, openTag}) => {
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
	});

	describe('renders all in parallel', () => {
		itRenders('with no Suspense', async ({render, openTag}) => {
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

		itRenders('inside Suspense', async ({render, openTag}) => {
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
	});

	describe('any one throwing promise aborts render and', () => {
		describe('inside suspense', () => {
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

			itRenders('prevents later elements being rendered', async ({render, openTag}) => {
				const Lazy1 = spy(lazy(() => <div>Lazy inner 1</div>));
				const Lazy2 = spy(lazy(() => <div>Lazy inner 2</div>, {noSsr: true}));
				const Lazy3 = spy(lazy(() => <div>Lazy inner 3</div>));
				const Lazy4 = spy(lazy(() => <div>Lazy inner 4</div>));

				const e = (
					<div>
						<Suspense fallback={<span>Fallback</span>}>
							<Lazy1/>
							<Lazy2/>
							<Lazy3/>
						</Suspense>
						<Lazy4/>
					</div>
				);

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
			});

			itRenders('calls `.abort()` on all promises inside suspense', async ({render, openTag}) => {
				const Lazy1 = lazy(() => <div>Lazy inner 1</div>);
				const Lazy2 = lazy(() => <div>Lazy inner 2</div>, {noSsr: true});
				const Lazy3 = lazy(() => <div>Lazy inner 3</div>);
				const Lazy4 = lazy(() => <div>Lazy inner 4</div>);

				const e = (
					<div>
						<Suspense fallback={<span>Fallback</span>}>
							<Lazy1/>
							<Lazy2/>
							<Lazy3/>
						</Suspense>
						<Lazy4/>
					</div>
				);

				const p = render(e);

				expect(Lazy1.promise.abort).toHaveBeenCalledTimes(1);
				expect(Lazy2.promise.abort).toHaveBeenCalledTimes(1);
				expect(Lazy3.promise).toBeUndefined();
				expect(Lazy4.promise.abort).not.toHaveBeenCalled();

				const h = await p;
				expect(h).toBe(`<div${openTag}><span>Fallback</span><div>Lazy inner 4</div></div>`);
			});
		});

		describe('outside suspense', () => {
			itRenders('rejects promise', async ({render}) => {
				const Lazy1 = lazy(() => <div>Lazy inner 1</div>);
				const Lazy2 = lazy(() => <div>Lazy inner 2</div>, {noSsr: true});
				const Lazy3 = lazy(() => <div>Lazy inner 3</div>);

				const e = (
					<div>
						<Lazy1/>
						<Lazy2/>
						<Lazy3/>
					</div>
				);

				const p = render(e);
				await expect(p).rejects.toBe(Lazy2.promise);
			});

			itRenders('prevents later elements being rendered', async ({render}) => {
				const Lazy1 = spy(lazy(() => <div>Lazy inner 1</div>));
				const Lazy2Actual = lazy(() => <div>Lazy inner 2</div>, {noSsr: true});
				const Lazy2 = spy(Lazy2Actual);
				const Lazy3 = spy(lazy(() => <div>Lazy inner 3</div>));

				const e = (
					<div>
						<Lazy1/>
						<Lazy2/>
						<Lazy3/>
					</div>
				);

				const p = render(e);

				expect(Lazy1).toHaveBeenCalled();
				expect(Lazy2).toHaveBeenCalled();
				expect(Lazy3).not.toHaveBeenCalled();

				await expect(p).rejects.toBe(Lazy2Actual.promise);
			});

			itRenders('calls `.abort()` on all promises', async ({render}) => {
				const Lazy1 = lazy(() => <div>Lazy inner 1</div>);
				const Lazy2 = lazy(() => <div>Lazy inner 2</div>, {noSsr: true});
				const Lazy3 = lazy(() => <div>Lazy inner 3</div>);

				const e = (
					<div>
						<Lazy1/>
						<Lazy2/>
						<Lazy3/>
					</div>
				);

				const p = render(e);

				expect(Lazy1.promise.abort).toHaveBeenCalledTimes(1);
				expect(Lazy2.promise.abort).toHaveBeenCalledTimes(1);
				expect(Lazy3.promise).toBeUndefined();

				await expect(p).rejects.toBe(Lazy2.promise);
			});
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

	describe('rejects when promise marked no SSR', function() {
		itRenders('when nested 1 deep', async ({render}) => {
			const LazyInner = lazy(() => <div>Lazy inner</div>, {noSsr: true});
			const Lazy = lazy(() => <div>Before Lazy Layer 1<LazyInner/>After Lazy Layer 1</div>);

			const e = (
				<div>
					<div>Before Lazy</div>
					<Lazy/>
					<div>After Lazy</div>
				</div>
			);

			const p = render(e);
			await Lazy.promise;
			await expect(p).rejects.toBe(LazyInner.promise);
		});

		itRenders('when nested 2 deep', async ({render}) => {
			const LazyInnerInner = lazy(() => <div>Lazy inner</div>, {noSsr: true});
			const LazyInner = lazy(
				() => <div>Before Lazy Layer 2<LazyInnerInner/>After Lazy Layer 2</div>
			);
			const Lazy = lazy(
				() => <div>Before Lazy Layer 1<LazyInner/>After Lazy Layer 1</div>
			);

			const e = (
				<div>
					<div>Before Lazy</div>
					<Lazy/>
					<div>After Lazy</div>
				</div>
			);

			const p = render(e);
			await Lazy.promise;
			await LazyInner.promise;
			await expect(p).rejects.toBe(LazyInnerInner.promise);
		});
	});

	describe('renders fallback when promise marked no SSR', function() {
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
	});
});
