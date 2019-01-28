/* --------------------
 * react-async-ssr module
 * Tests
 * ------------------*/

'use strict';

// Modules
const React = require('react'),
	{Suspense} = React,
	PropTypes = require('prop-types'),
	{expect} = require('chai');

// Imports
const {itRenders, lazy, removeSpacing} = require('./utils');

// Tests

describe('Context propogates with', () => {
	describe('new Context API', () => {
		tests(() => React.createContext('default'));
	});

	describe('new Context API with class prop consumer', () => {
		tests(() => {
			const Context = React.createContext('default');

			class Consumer extends React.Component {
				render() {
					return this.props.children(this.context);
				}
			}
			Consumer.contextType = Context;

			return {Provider: Context.Provider, Consumer};
		});
	});

	describe('legacy Context API', () => {
		tests(num => {
			const key = `ctx${num}`;

			class Provider extends React.Component {
				getChildContext() {
					return {[key]: this.props.value};
				}

				render() {
					return this.props.children;
				}
			}
			Provider.childContextTypes = {
				[key]: PropTypes.string
			};

			function Consumer(props, context) {
				return props.children(context[key] || null);
			}
			Consumer.contextTypes = Provider.childContextTypes;

			return {Provider, Consumer};
		});
	});
});

function tests(makeContext) {
	let Provider, Consumer;
	beforeEach(() => {
		({Provider, Consumer} = makeContext(1));
	});

	describe('across Suspense boundary with', () => {
		describe('one context', () => {
			itRenders('single boundary', async ({render}) => {
				const e = (
					<Provider value="val">
						<Suspense>
							<Consumer>{ctx => ctx}</Consumer>
						</Suspense>
					</Provider>
				);

				const h = await render(e);
				expect(h).to.equal('val');
			});

			itRenders('multiple boundaries', async ({render}) => {
				const e = (
					<Provider value="val">
						<Suspense>
							<Suspense>
								<Suspense>
									<Consumer>{ctx => ctx}</Consumer>
								</Suspense>
							</Suspense>
						</Suspense>
					</Provider>
				);

				const h = await render(e);
				expect(h).to.equal('val');
			});
		});

		describe('multiple contexts', () => {
			let Provider2, Consumer2,
				Provider3, Consumer3;
			beforeEach(() => {
				({Provider: Provider2, Consumer: Consumer2} = makeContext(2));
				({Provider: Provider3, Consumer: Consumer3} = makeContext(3));
			});

			itRenders('single boundary', async ({render, openTag}) => {
				const e = (
					<div>
						<Provider value="val">
							<Provider2 value="val2">
								<Provider3 value="val3">
									<Suspense>
										<div><Consumer>{ctx => ctx}</Consumer></div>
										<div><Consumer2>{ctx => ctx}</Consumer2></div>
										<div><Consumer3>{ctx => ctx}</Consumer3></div>
									</Suspense>
								</Provider3>
							</Provider2>
						</Provider>
					</div>
				);

				const h = await render(e);
				expect(h).to.equal(removeSpacing(`
					<div${openTag}>
						<div>val</div>
						<div>val2</div>
						<div>val3</div>
					</div>
				`));
			});

			itRenders('multiple boundaries', async ({render, openTag}) => {
				const e = (
					<div>
						<Provider value="val">
							<Provider2 value="val2">
								<Provider3 value="val3">
									<Suspense>
										<Suspense>
											<Suspense>
												<div><Consumer>{ctx => ctx}</Consumer></div>
												<div><Consumer2>{ctx => ctx}</Consumer2></div>
												<div><Consumer3>{ctx => ctx}</Consumer3></div>
											</Suspense>
										</Suspense>
									</Suspense>
								</Provider3>
							</Provider2>
						</Provider>
					</div>
				);

				const h = await render(e);
				expect(h).to.equal(removeSpacing(`
					<div${openTag}>
						<div>val</div>
						<div>val2</div>
						<div>val3</div>
					</div>
				`));
			});
		});
	});

	describe('within lazy component', () => {
		describe('one context', () => {
			let Lazy, Lazy2, Lazy3;
			beforeEach(() => {
				Lazy = lazy(() => <Consumer>{ctx => ctx}</Consumer>);
				Lazy2 = lazy(() => <Lazy/>);
				Lazy3 = lazy(() => <Lazy2/>);
			});

			itRenders('single lazy component', async ({render}) => {
				const e = (
					<Provider value="val">
						<Lazy/>
					</Provider>
				);

				const h = await render(e);
				expect(h).to.equal('val');
			});

			itRenders('multiple lazy components', async ({render}) => {
				const e = (
					<Provider value="val">
						<Lazy3/>
					</Provider>
				);

				const h = await render(e);
				expect(h).to.equal('val');
			});
		});

		describe('multiple contexts', () => {
			let Provider2, Consumer2,
				Provider3, Consumer3,
				Lazy, Lazy2, Lazy3;
			beforeEach(() => {
				({Provider: Provider2, Consumer: Consumer2} = makeContext(2));
				({Provider: Provider3, Consumer: Consumer3} = makeContext(3));

				Lazy = lazy(() => (
					<div>
						<div><Consumer>{ctx => ctx}</Consumer></div>
						<div><Consumer2>{ctx => ctx}</Consumer2></div>
						<div><Consumer3>{ctx => ctx}</Consumer3></div>
					</div>
				));
				Lazy2 = lazy(() => <Lazy/>);
				Lazy3 = lazy(() => <Lazy2/>);
			});

			itRenders('single lazy component', async ({render, openTag}) => {
				const e = (
					<div>
						<Provider value="val">
							<Provider2 value="val2">
								<Provider3 value="val3">
									<Lazy/>
								</Provider3>
							</Provider2>
						</Provider>
					</div>
				);

				const h = await render(e);
				expect(h).to.equal(removeSpacing(`
					<div${openTag}>
						<div>
							<div>val</div>
							<div>val2</div>
							<div>val3</div>
						</div>
					</div>
				`));
			});

			itRenders('multiple lazy components', async ({render, openTag}) => {
				const e = (
					<div>
						<Provider value="val">
							<Provider2 value="val2">
								<Provider3 value="val3">
									<Lazy3/>
								</Provider3>
							</Provider2>
						</Provider>
					</div>
				);

				const h = await render(e);
				expect(h).to.equal(removeSpacing(`
					<div${openTag}>
						<div>
							<div>val</div>
							<div>val2</div>
							<div>val3</div>
						</div>
					</div>
				`));
			});
		});
	});

	describe('into suspense fallback', () => {
		let Lazy;
		beforeEach(() => {
			Lazy = lazy(() => {}, {noSsr: true});
		});

		describe('one context', () => {
			let fallback;
			beforeEach(() => {
				fallback = <Consumer>{ctx => ctx}</Consumer>;
			});

			itRenders('when fallback triggered', async ({render}) => {
				const e = (
					<Provider value="val">
						<Suspense fallback={fallback}>
							<Lazy/>
						</Suspense>
					</Provider>
				);

				const h = await render(e);
				expect(h).to.equal('val');
			});

			itRenders('in Suspense\'s scope', async ({render}) => {
				const e = (
					<Provider value="val">
						<Suspense fallback={fallback}>
							<Provider value="valx">
								<Lazy/>
							</Provider>
						</Suspense>
					</Provider>
				);

				const h = await render(e);
				expect(h).to.equal('val');
			});
		});

		describe('multiple contexts', () => {
			let Provider2, Consumer2,
				Provider3, Consumer3,
				fallback;
			beforeEach(() => {
				({Provider: Provider2, Consumer: Consumer2} = makeContext(2));
				({Provider: Provider3, Consumer: Consumer3} = makeContext(3));

				fallback = (
					<div>
						<div><Consumer>{ctx => ctx}</Consumer></div>
						<div><Consumer2>{ctx => ctx}</Consumer2></div>
						<div><Consumer3>{ctx => ctx}</Consumer3></div>
					</div>
				);
			});

			itRenders('when fallback triggered', async ({render, openTag}) => {
				const e = (
					<div>
						<Provider value="val">
							<Provider2 value="val2">
								<Provider3 value="val3">
									<Suspense fallback={fallback}>
										<Lazy/>
									</Suspense>
								</Provider3>
							</Provider2>
						</Provider>
					</div>
				);

				const h = await render(e);
				expect(h).to.equal(removeSpacing(`
					<div${openTag}>
						<div>
							<div>val</div>
							<div>val2</div>
							<div>val3</div>
						</div>
					</div>
				`));
			});

			itRenders('in Suspense\'s scope', async ({render, openTag}) => {
				const e = (
					<div>
						<Provider value="val">
							<Provider2 value="val2">
								<Provider3 value="val3">
									<Suspense fallback={fallback}>
										<Provider value="valx">
											<Provider2 value="val2x">
												<Provider3 value="val3x">
													<Lazy/>
												</Provider3>
											</Provider2>
										</Provider>
									</Suspense>
								</Provider3>
							</Provider2>
						</Provider>
					</div>
				);

				const h = await render(e);
				expect(h).to.equal(removeSpacing(`
					<div${openTag}>
						<div>
							<div>val</div>
							<div>val2</div>
							<div>val3</div>
						</div>
					</div>
				`));
			});
		});
	});
}
