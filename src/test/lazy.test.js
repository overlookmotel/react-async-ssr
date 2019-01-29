/* --------------------
 * react-async-ssr module
 * Tests
 * ------------------*/

'use strict';

// Modules
const React = require('react'),
	{Suspense} = React,
	{expect} = require('chai'),
	{spy} = require('sinon');

// Imports
const {itRenders, lazy, getPromiseState, removeSpacing} = require('./utils');

// Tests

describe('Lazy component', () => {
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
			expect(h).to.equal(removeSpacing(`
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
			expect(h).to.equal(removeSpacing(`
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
			expect(h).to.equal(removeSpacing(`
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
			const promise = Object.assign(new Promise(resolve => resolve()), {noSsr: true});
			const LazyFallback = () => {throw promise;};

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
			await expect(p).to.be.rejected;
			const {err} = await getPromiseState(p);
			expect(err).to.equal(promise);
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
			expect(h).to.equal(removeSpacing(`
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
			expect(h).to.equal(removeSpacing(`
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
			expect(h).to.equal(removeSpacing(`
				<div${openTag}>
					<div>Before outer Suspense</div>
					<span>Fallback outer</span>
					<div>After outer Suspense</div>
				</div>
			`));
		});

		itRenders('rejects when promise marked no SSR and both fallbacks throw promises marked no SSR', async ({render}) => {
			const Lazy = lazy(() => <div>Lazy inner</div>, {noSsr: true});
			const LazyFallbackInner = lazy(() => <div>Lazy fallback</div>, {noSsr: true});
			const promise = Object.assign(new Promise(resolve => resolve()), {noSsr: true});
			const LazyFallbackOuter = () => {throw promise;};

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
			await expect(p).to.be.rejected;
			const {err} = await getPromiseState(p);
			expect(err).to.equal(promise);
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
			expect(h).to.equal(removeSpacing(`
				<div${openTag}>
					<div>Lazy inner</div>
				</div>
			`));
		});

		itRenders('rejects when promise marked no SSR', async ({render}) => {
			const promise = Object.assign(new Promise(resolve => resolve()), {noSsr: true});
			const Lazy = () => {throw promise;};
			const e = <div><Lazy/></div>;

			const p = render(e);
			await expect(p).to.be.rejected;
			const {err} = await getPromiseState(p);
			expect(err).to.equal(promise);
		});
	});
});

describe('Multiple lazy components', () => {
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
			expect(h).to.equal(removeSpacing(`
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
			expect(h).to.equal(removeSpacing(`
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
			expect(Lazy1).to.have.been.called;
			expect(Lazy2).to.have.been.called;
			expect(Lazy3).to.have.been.called;

			const h = await p;
			expect(h).to.equal(removeSpacing(`
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
			expect(Lazy1).to.have.been.called;
			expect(Lazy2).to.have.been.called;
			expect(Lazy3).to.have.been.called;

			const h = await p;
			expect(h).to.equal(removeSpacing(`
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
				const promise = Object.assign(new Promise(resolve => resolve()), {noSsr: true});
				const Lazy2 = () => {throw promise;};
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
				expect(h).to.equal(removeSpacing(`
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

				expect(Lazy1).to.be.called;
				expect(Lazy2).to.be.called;
				expect(Lazy3).not.to.be.called;
				expect(Lazy4).to.be.called;

				expect(h).to.equal(removeSpacing(`
					<div${openTag}>
						<span>Fallback</span>
						<div>Lazy inner 4</div>
					</div>
				`));
			});

			itRenders('calls `.abort()` on all promises inside suspense', async ({render, openTag}) => {
				const promises = [];
				function makeLazy(num, noSsr) {
					let loaded = false, promise;
					return function LazyComponent() {
						if (loaded) return <div>{`Lazy inner ${num}`}</div>;
						if (!promise) {
							promise = new Promise(resolve => resolve()).then(() => loaded = true);
							if (noSsr) promise.noSsr = true;
							promise.abort = spy();
							promises[num - 1] = promise;
						}
						throw promise;
					};
				}

				const Lazy1 = makeLazy(1);
				const Lazy2 = makeLazy(2, true);
				const Lazy3 = makeLazy(3);
				const Lazy4 = makeLazy(4);

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

				expect(promises[0].abort).to.be.calledOnce;
				expect(promises[1].abort).to.be.calledOnce;
				expect(promises[2]).to.be.undefined;
				expect(promises[3].abort).not.to.be.called;

				const h = await p;
				expect(h).to.equal(`<div${openTag}><span>Fallback</span><div>Lazy inner 4</div></div>`);
			});
		});

		describe('outside suspense', () => {
			itRenders('rejects promise', async ({render}) => {
				const Lazy1 = lazy(() => <div>Lazy inner 1</div>);
				const promise = Object.assign(new Promise(resolve => resolve()), {noSsr: true});
				const Lazy2 = () => {throw promise;};
				const Lazy3 = lazy(() => <div>Lazy inner 3</div>);

				const e = (
					<div>
						<Lazy1/>
						<Lazy2/>
						<Lazy3/>
					</div>
				);

				const p = render(e);
				await expect(p).to.be.rejected;
				const {err} = await getPromiseState(p);
				expect(err).to.equal(promise);
			});

			itRenders('prevents later elements being rendered', async ({render}) => {
				const Lazy1 = spy(lazy(() => <div>Lazy inner 1</div>));
				const promise = Object.assign(new Promise(resolve => resolve()), {noSsr: true});
				const Lazy2 = spy(() => {throw promise;});
				const Lazy3 = spy(lazy(() => <div>Lazy inner 3</div>));

				const e = (
					<div>
						<Lazy1/>
						<Lazy2/>
						<Lazy3/>
					</div>
				);

				const p = render(e);

				expect(Lazy1).to.be.called;
				expect(Lazy2).to.be.called;
				expect(Lazy3).not.to.be.called;

				await expect(p).to.be.rejected;
				const {err} = await getPromiseState(p);
				expect(err).to.equal(promise);
			});

			itRenders('calls `.abort()` on all promises', async ({render}) => {
				const promises = [];
				function makeLazy(num, noSsr) {
					let loaded = false, promise;
					return function LazyComponent() {
						if (loaded) return <div>{`Lazy inner ${num}`}</div>;
						if (!promise) {
							promise = new Promise(resolve => resolve()).then(() => loaded = true);
							if (noSsr) promise.noSsr = true;
							promise.abort = spy();
							promises[num - 1] = promise;
						}
						throw promise;
					};
				}

				const Lazy1 = makeLazy(1);
				const Lazy2 = makeLazy(2, true);
				const Lazy3 = makeLazy(3);

				const e = (
					<div>
						<Lazy1/>
						<Lazy2/>
						<Lazy3/>
					</div>
				);

				const p = render(e);

				expect(promises[0].abort).to.be.calledOnce;
				expect(promises[1].abort).to.be.calledOnce;
				expect(promises[2]).to.be.undefined;

				await expect(p).to.be.rejected;
				const {err} = await getPromiseState(p);
				expect(err).to.equal(promises[1]);
			});
		});
	});
});

describe('Nested lazy components', () => {
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
		expect(h).to.equal(removeSpacing(`
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
			const promise = Object.assign(new Promise(resolve => resolve()), {noSsr: true});
			const Lazy2 = () => {throw promise;};
			const Lazy = lazy(() => <div>Before Lazy Layer 1<Lazy2/>After Lazy Layer 1</div>);
			const e = (
				<div>
					<div>Before Lazy</div>
					<Lazy/>
					<div>After Lazy</div>
				</div>
			);

			const p = render(e);
			await expect(p).to.be.rejected;
			const {err} = await getPromiseState(p);
			expect(err).to.equal(promise);
		});

		itRenders('when nested 2 deep', async ({render}) => {
			const promise = Object.assign(new Promise(resolve => resolve()), {noSsr: true});
			const Lazy3 = () => {throw promise;};
			const Lazy2 = lazy(() => <div>Before Lazy Layer 2<Lazy3/>After Lazy Layer 2</div>);
			const Lazy = lazy(() => <div>Before Lazy Layer 1<Lazy2/>After Lazy Layer 1</div>);
			const e = (
				<div>
					<div>Before Lazy</div>
					<Lazy/>
					<div>After Lazy</div>
				</div>
			);

			const p = render(e);
			await expect(p).to.be.rejected;
			const {err} = await getPromiseState(p);
			expect(err).to.equal(promise);
		});
	});

	describe('renders fallback when promise marked no SSR', function() {
		itRenders('when nested 1 deep', async ({render, openTag}) => {
			const promise = Object.assign(new Promise(resolve => resolve()), {noSsr: true});
			const Lazy2 = () => {throw promise;};
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
			expect(h).to.equal(removeSpacing(`
				<div${openTag}>
					<div>Before Suspense</div>
					<span>Fallback</span>
					<div>After Suspense</div>
				</div>
			`));
		});

		itRenders('when nested 2 deep', async ({render, openTag}) => {
			const promise = Object.assign(new Promise(resolve => resolve()), {noSsr: true});
			const Lazy3 = () => {throw promise;};
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
			expect(h).to.equal(removeSpacing(`
				<div${openTag}>
					<div>Before Suspense</div>
					<span>Fallback</span>
					<div>After Suspense</div>
				</div>
			`));
		});
	});
});
