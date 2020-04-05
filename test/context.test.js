/* --------------------
 * react-async-ssr module
 * Tests
 * ------------------*/

'use strict';

// Modules
const React = require('react'),
	PropTypes = require('prop-types');

// Imports
const itRenders = require('./utils/itRenders.js');

// Init
require('./utils/index.js');

// Tests

describe('context propogates with', () => {
	describe('new Context API', () => {
		tests(ReactLocal => ReactLocal.createContext('default'));
	});

	describe('new Context API with class prop consumer', () => {
		tests((ReactLocal) => {
			const Context = ReactLocal.createContext('default');

			class Consumer extends React.Component {
				render() {
					return this.props.children(this.context);
				}
			}
			Consumer.contextType = Context;

			return {Provider: Context.Provider, Consumer};
		});
	});

	describe('new Context API with `useContext()` consumer', () => {
		tests((ReactLocal) => {
			const Context = ReactLocal.createContext('default');

			function Consumer(props) {
				const context = ReactLocal.useContext(Context);
				return props.children(context);
			}

			return {Provider: Context.Provider, Consumer};
		});
	});

	describe('legacy Context API', () => {
		tests((ReactLocal, num) => {
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

function tests(makeContextGivenReact) {
	// Extend itRenders to add Context and fallback
	const itRendersWithContext = itRenders.extend({
		prep({React: ReactLocal}) {
			const makeContext = num => makeContextGivenReact(ReactLocal, num);
			const {Provider, Consumer} = makeContext(1);
			const fallback = <div>Loading...</div>;
			return {makeContext, Provider, Consumer, fallback};
		}
	});

	describe('across Suspense boundary with', () => {
		describe('one context', () => {
			itRendersWithContext('single boundary', {
				element: ({Suspense, Provider, Consumer, fallback}) => (
					<Provider value="val">
						<Suspense fallback={fallback}>
							<Consumer>{ctx => ctx}</Consumer>
						</Suspense>
					</Provider>
				),
				html: 'val'
			});

			itRendersWithContext('multiple boundaries', {
				element: ({Suspense, Provider, Consumer, fallback}) => (
					<Provider value="val">
						<Suspense fallback={fallback}>
							<Suspense fallback={fallback}>
								<Suspense fallback={fallback}>
									<Consumer>{ctx => ctx}</Consumer>
								</Suspense>
							</Suspense>
						</Suspense>
					</Provider>
				),
				html: 'val'
			});
		});

		describe('multiple contexts', () => {
			const itRendersWithMultipleContexts = itRendersWithContext.extend({
				prep({makeContext}) {
					const {Provider: Provider2, Consumer: Consumer2} = makeContext(2),
						{Provider: Provider3, Consumer: Consumer3} = makeContext(3);
					return {Provider2, Consumer2, Provider3, Consumer3};
				}
			});

			itRendersWithMultipleContexts('single boundary', {
				element: (
					{Suspense, Provider, Consumer, Provider2, Consumer2, Provider3, Consumer3, fallback}
				) => (
					<div>
						<Provider value="val">
							<Provider2 value="val2">
								<Provider3 value="val3">
									<Suspense fallback={fallback}>
										<div><Consumer>{ctx => ctx}</Consumer></div>
										<div><Consumer2>{ctx => ctx}</Consumer2></div>
										<div><Consumer3>{ctx => ctx}</Consumer3></div>
									</Suspense>
								</Provider3>
							</Provider2>
						</Provider>
					</div>
				),
				html: ({openTag}) => (`
					<div${openTag}>
						<div>val</div>
						<div>val2</div>
						<div>val3</div>
					</div>
				`)
			});

			itRendersWithMultipleContexts('multiple boundaries', {
				element: (
					{Suspense, Provider, Consumer, Provider2, Consumer2, Provider3, Consumer3, fallback}
				) => (
					<div>
						<Provider value="val">
							<Provider2 value="val2">
								<Provider3 value="val3">
									<Suspense fallback={fallback}>
										<Suspense fallback={fallback}>
											<Suspense fallback={fallback}>
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
				),
				html: ({openTag}) => (`
					<div${openTag}>
						<div>val</div>
						<div>val2</div>
						<div>val3</div>
					</div>
				`)
			});
		});
	});

	describe('within lazy component', () => {
		describe('one context', () => {
			itRendersWithContext('single lazy component', {
				element({Suspense, lazy, Provider, Consumer, fallback}) {
					const Lazy = lazy(() => <Consumer>{ctx => ctx}</Consumer>);

					return (
						<Suspense fallback={fallback}>
							<Provider value="val">
								<Lazy />
							</Provider>
						</Suspense>
					);
				},
				html: 'val'
			});

			itRendersWithContext('multiple lazy components', {
				element({Suspense, lazy, Provider, Consumer, fallback}) {
					const Lazy = lazy(() => <Consumer>{ctx => ctx}</Consumer>),
						Lazy2 = lazy(() => <Lazy />),
						Lazy3 = lazy(() => <Lazy2 />);

					return (
						<Suspense fallback={fallback}>
							<Provider value="val">
								<Lazy3 />
							</Provider>
						</Suspense>
					);
				},
				html: 'val'
			});
		});

		describe('multiple contexts', () => {
			const itRendersWithMultipleContexts = itRendersWithContext.extend({
				prep({lazy, makeContext, Consumer}) {
					const {Provider: Provider2, Consumer: Consumer2} = makeContext(2),
						{Provider: Provider3, Consumer: Consumer3} = makeContext(3);

					const Lazy = lazy(() => (
						<div>
							<div><Consumer>{ctx => ctx}</Consumer></div>
							<div><Consumer2>{ctx => ctx}</Consumer2></div>
							<div><Consumer3>{ctx => ctx}</Consumer3></div>
						</div>
					));

					return {Provider2, Consumer2, Provider3, Consumer3, Lazy};
				}
			});

			itRendersWithMultipleContexts('single lazy component', {
				element: ({Suspense, Provider, Provider2, Provider3, Lazy, fallback}) => (
					<Suspense fallback={fallback}>
						<div>
							<Provider value="val">
								<Provider2 value="val2">
									<Provider3 value="val3">
										<Lazy />
									</Provider3>
								</Provider2>
							</Provider>
						</div>
					</Suspense>
				),
				html: ({openTag}) => (`
					<div${openTag}>
						<div>
							<div>val</div>
							<div>val2</div>
							<div>val3</div>
						</div>
					</div>
				`)
			});

			itRendersWithMultipleContexts('multiple lazy components', {
				element({Suspense, lazy, Provider, Provider2, Provider3, Lazy, fallback}) {
					const Lazy2 = lazy(() => <Lazy />),
						Lazy3 = lazy(() => <Lazy2 />);

					return (
						<Suspense fallback={fallback}>
							<div>
								<Provider value="val">
									<Provider2 value="val2">
										<Provider3 value="val3">
											<Lazy3 />
										</Provider3>
									</Provider2>
								</Provider>
							</div>
						</Suspense>
					);
				},
				html: ({openTag}) => (`
					<div${openTag}>
						<div>
							<div>val</div>
							<div>val2</div>
							<div>val3</div>
						</div>
					</div>
				`)
			});
		});
	});

	describe('into suspense fallback', () => {
		// Extend itRenders to add Lazy
		const itRendersWithLazy = itRendersWithContext.extend({
			prep: ({lazy}) => ({
				Lazy: lazy(() => <div>Lazy inner</div>, {noSsr: true})
			})
		});

		describe('one context', () => {
			// Extend itRenders to add fallback containing Consumer
			const itRendersWithFallbackContext = itRendersWithLazy.extend({
				prep: ({Consumer}) => ({
					fallback: <Consumer>{ctx => ctx}</Consumer>
				})
			});

			itRendersWithFallbackContext('when fallback triggered', {
				element: ({Suspended, Lazy, Provider, fallback}) => (
					<Provider value="val">
						<Suspended fallback={fallback}>
							<Lazy />
						</Suspended>
					</Provider>
				),
				html: 'val'
			});

			itRendersWithFallbackContext("in Suspense's scope", {
				element: ({Suspended, Lazy, Provider, fallback}) => (
					<Provider value="val">
						<Suspended fallback={fallback}>
							<Provider value="valx">
								<Lazy />
							</Provider>
						</Suspended>
					</Provider>
				),
				html: 'val'
			});
		});

		describe('multiple contexts', () => {
			// Extend itRenders to add fallback containing Consumers
			const itRendersWithContextsFallback = itRendersWithLazy.extend({
				prep({makeContext, Consumer}) {
					const {Provider: Provider2, Consumer: Consumer2} = makeContext(2),
						{Provider: Provider3, Consumer: Consumer3} = makeContext(3);

					const fallback = (
						<div>
							<div><Consumer>{ctx => ctx}</Consumer></div>
							<div><Consumer2>{ctx => ctx}</Consumer2></div>
							<div><Consumer3>{ctx => ctx}</Consumer3></div>
						</div>
					);

					return {Provider2, Consumer2, Provider3, Consumer3, fallback};
				}
			});

			itRendersWithContextsFallback('when fallback triggered', {
				element: ({Suspended, Lazy, Provider, Provider2, Provider3, fallback}) => (
					<div>
						<Provider value="val">
							<Provider2 value="val2">
								<Provider3 value="val3">
									<Suspended fallback={fallback}>
										<Lazy />
									</Suspended>
								</Provider3>
							</Provider2>
						</Provider>
					</div>
				),
				html: ({openTag}) => (`
					<div${openTag}>
						<div>
							<div>val</div>
							<div>val2</div>
							<div>val3</div>
						</div>
					</div>
				`)
			});

			itRendersWithContextsFallback("in Suspense's scope", {
				element: ({Suspended, Lazy, Provider, Provider2, Provider3, fallback}) => (
					<div>
						<Provider value="val">
							<Provider2 value="val2">
								<Provider3 value="val3">
									<Suspended fallback={fallback}>
										<Provider value="valx">
											<Provider2 value="val2x">
												<Provider3 value="val3x">
													<Lazy />
												</Provider3>
											</Provider2>
										</Provider>
									</Suspended>
								</Provider3>
							</Provider2>
						</Provider>
					</div>
				),
				html: ({openTag}) => (`
					<div${openTag}>
						<div>
							<div>val</div>
							<div>val2</div>
							<div>val3</div>
						</div>
					</div>
				`)
			});
		});
	});
}
