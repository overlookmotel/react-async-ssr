"use strict";

/* eslint-disable no-console */

/* global React */

/* global ReactDOM */

/* global document */
// eslint-disable-next-line no-unused-vars

/* global window */
//const internals = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
//const {ReactCurrentDispatcher} = internals;
//const {ReactCurrentOwner} = internals;
const {
  Suspense
} = React;
/*
function clone(o) {
	return Object.assign({}, o);
}
*/

/*
const callCounts = {};

function lazy(name, component, options) {
	if (typeof name !== 'string') {
		options = component;
		component = name;
		name = null;
	}
	if (!options) options = {};

	let loaded = false, promise;
	return function LazyComponent(props) {
		if (name) {
			const count = callCounts[name] = (callCounts[name] || 0) + 1;
			console.log(`Called LazyComponent ${name} (${count}) (${loaded ? 'loaded' : 'not loaded'})`);
		}
		//console.log('Lazy parent:', clone(ReactCurrentOwner.current.return));

		if (loaded) return React.createElement(component, props);

		if (!promise) {
			promise = new Promise(
				resolve => {
					function done() {
						loaded = true;
						resolve();
					}

					if (options.delay == null) return done();
					setTimeout(done, options.delay);
				}
			);
		}
		throw promise;
	};
}
*/

/*
// eslint-disable-next-line no-unused-vars
class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = {errored: false, err: null};
	}

	static getDerivedStateFromError(err) {
		return {errored: true, err};
	}

	componentDidCatch(err, info) {
		console.log('Error:', err);
		console.log('Info:', info);
	}

	render() {
		if (this.state.errored) return <p>ERRORED</p>;
		return this.props.children;
	}
}
*/

/*
const Lazy1 = lazy('Lazy1', () => <div>Inside lazy 1</div>, {delay: 1000});
const Lazy2 = lazy('Lazy2', () => <div>Inside lazy 2</div>, {delay: 1000});
const Lazy3 = lazy('Lazy3', () => <div>Inside lazy 3</div>, {delay: 5000});

//const LazyFallback = lazy('LazyFallback', () => <div>Fallback</div>, {delay: 1000});

function FallbackOuter() {
	console.log('Called outer fallback');
	return <div>Outer fallback</div>;
}

function FallbackInner() {
	console.log('Called inner fallback');
	return <div>Inner fallback</div>;
}

function App() {
	return (
		<Suspense fallback={<FallbackOuter/>}>
			<div>Before outer lazy</div>
			<Lazy1/>
			<div>Before inner suspense</div>
			<Suspense fallback={<FallbackInner/>}>
				<div>Before inner lazy</div>
				<Lazy2/>
				<div>Between inner lazy</div>
				<Lazy3/>
				<div>After inner lazy</div>
			</Suspense>
			<div>After inner suspense</div>
		</Suspense>
	);
}
*/

/*
let loaded = false, promise = null;

class Lazy extends React.Component {
	constructor(props, context) {
		super(props, context);
		console.log('> ctor');
	}

	static ggetDerivedStateFromProps() {
		console.log('> getDerivedStateFromProps');
		return null;
	}

	UNSAFE_componentWillMount() {
		console.log('> UNSAFE_componentWillMount');
	}

	componentWillMount() {
		console.log('> componentWillMount');
	}

	componentDidMount() {
		console.log('> componentDidMount');
	}

	componentWillUnmount() {
		console.log('> componentWillUnmount');
	}

	render() {
		if (loaded) return <div>Hello!</div>;

		if (!promise) {
			promise = new Promise(resolve => {
				setTimeout(() => {
					loaded = true;
					promise = null;
					resolve();
				}, 5000);
			});
		}

		throw promise;
	}
}

function App() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<Lazy/>
		</Suspense>
	);
}
*/

function LazyInner() {
  return React.createElement("div", null, "lazy-loaded");
} //const Lazy = React.lazy(() => Promise.resolve({default: LazyInner}));

/*
const Lazy = React.lazy(() => {
	return new Promise(resolve => {
		setTimeout(() => resolve({default: LazyInner}), 3000);
	});
});
*/


let loaded = false,
    promise = null;

function Lazy() {
  console.log('> Lazy', loaded);
  if (loaded) return React.createElement(LazyInner, null);

  if (!promise) {
    promise = {
      then(fn) {
        loaded = true;
        fn();
      }

    };
  }

  throw promise;
}

function Fallback() {
  console.log('> Fallback');
  return React.createElement("div", null, "Loading...");
}

function NextElement() {
  console.log('> NextElement');
  return React.createElement("div", null, "Next element");
}

function App() {
  return React.createElement(Suspense, {
    fallback: React.createElement(Fallback, null)
  }, React.createElement(Lazy, null), React.createElement(NextElement, null));
}

const e = React.createElement(App, null);
ReactDOM.render(e, document.getElementById('app'));
