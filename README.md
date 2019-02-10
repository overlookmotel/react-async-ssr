[![NPM version](https://img.shields.io/npm/v/react-async-ssr.svg)](https://www.npmjs.com/package/react-async-ssr)
[![Build Status](https://img.shields.io/travis/overlookmotel/react-async-ssr/master.svg)](http://travis-ci.org/overlookmotel/react-async-ssr)
[![Dependency Status](https://img.shields.io/david/overlookmotel/react-async-ssr.svg)](https://david-dm.org/overlookmotel/react-async-ssr)
[![Dev dependency Status](https://img.shields.io/david/dev/overlookmotel/react-async-ssr.svg)](https://david-dm.org/overlookmotel/react-async-ssr)
[![Greenkeeper badge](https://badges.greenkeeper.io/overlookmotel/react-async-ssr.svg)](https://greenkeeper.io/)
[![Coverage Status](https://img.shields.io/coveralls/overlookmotel/react-async-ssr/master.svg)](https://coveralls.io/r/overlookmotel/react-async-ssr)

# Render React Suspense on server

[React](http://www.reactjs.org/) v16.6.0 introduced [Suspense](https://reactjs.org/docs/code-splitting.html#suspense) for lazy-loading components, but it doesn't work yet on the server-side.

This package enables server-side rendering.

It provides async versions of `.renderToString()` and `.renderToStaticMarkup()` methods. The async methods support `Suspense` and allow async loading of components or data.

## Usage

### Installation

```
npm install react-async-ssr
```

Also requires React >= 16.6.0.

### Moving to async server-side rendering

Before:

```js
const ReactDOMServer = require('react-dom/server');

function render() {
  const html = ReactDOMServer.renderToString(<App />);
  return html;
}
```

After:

```js
const ReactDOMServer = require('react-async-ssr');

async function render() {
  const html = await ReactDOMServer.renderToStringAsync(<App />);
  return html;
}
```

### Application code

```js
function App() {
  return (
    <div>
      <Suspense fallback={<Spinner />}>
        <LazyComponent />
        <LazyComponent />
        <LazyData />
      </Suspense>
    </div>
  );
}

const html = await ReactDOM.renderToStringAsync(<App />);
```

`<Suspense>` behaves exactly the same on the server as it does on the client.

`.renderToStringAsync()` will render the app in the usual way, except any lazy elements will be awaited and rendered before the returned promise resolves.

### Lazy components

So I can just use `React.lazy()`, right?

No! `React.lazy()` doesn't make sense to use on the server side. It doesn't have any ability to track the modules that have been lazy-loaded, so there's no way to then reload them on the client side, so that `.hydrate()` has all the code it needs.

[@loadable/component](https://www.smooth-code.com/open-source/loadable-components/docs/api-loadable-component/#lazy) provides a `.lazy()` method which is equivalent to `React.lazy()` but suitable for server-side rendering. [This guide](https://www.smooth-code.com/open-source/loadable-components/docs/server-side-rendering/) explains how to use it for server-side rendering.

### Lazy data

`.renderToStringAsync()` supports any component which fits within React's convention for suspendable components.

In it's `render()` method, the component should throw a Promise which will resolve when the data is loaded. When the promise resolves, the renderer will re-render the component and add it into the markup.

#### Basic example

```js
let data = null;
function LazyData() {
  if (!data) {
    const promise = new Promise(
      resolve => setTimeout(() => {
        data = {foo: 'bar'};
        resolve();
      }, 1000)
    );
    throw promise;
  }

  return <div>{data.foo}</div>;
}

function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <LazyData />
      </Suspense>
    </div>
  );
}
```

#### react-cache example

An example using the experimental package [react-cache](https://www.npmjs.com/package/react-cache):

```js
const {createResource} = require('react-cache');

const PokemonResource = createResource(
  id =>
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}/`)
      .then(res => res.json())
);

function Pokemon(props) {
  const data = PokemonResource.read(props.id);
  return <div>My name is {data.name}</div>;
}

function App() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <Pokemon id={1} />
        <Pokemon id={2} />
        <Pokemon id={3} />
      </Suspense>
    </div>
  );
}

const html = await ReactDOM.renderToStringAsync(<App />);
```

The above example makes 3 async fetch requests, which are made in parallel. They are awaited, and the HTML markup rendered only once all the data is ready.

#### Complicated cases

`.renderToStringAsync()` supports:

* Async components which themselves load more async components/data
* Suspense fallbacks which load async components/data

#### Hydrating the render on client side

The classic model for SSR is:

* Server-side: Load all data required for page asynchronously
* Server-side: Pass data into React app and render synchronously
* Send to client: Rendered HTML + data as JSON
* Client-side: Browser renders static HTML initially
* Client-side: Once all components and data required are loaded, "hydrate" the page using `ReactDOM.hydrate()`

With async SSR, the server-side process is different:

* Server-side: Asynchronously render React app
* Server-side: Data loaded asynchronously *during* render
* (remaining steps same as above)

The advantages of this change are:

* Components define their own data needs
* No need for data dependencies to be "hoisted" to the page's root component
* Therefore, components are less tightly coupled (the React way!)

In the example above, the `<Pokemon>` component is completely independent. You can drop it in to any app, anywhere in the component tree, and it'll be able to load the data it needs, without any complex "wiring up".

However, some mechanism is required to gather the data loaded on the server in order to send it to the client for hydration.

There are many solutions, for example using a [Redux](https://redux.js.org/) store, or a [Context](https://reactjs.org/docs/context.html) Provider at the root of the app. This package does not make any assumptions about how the user wants to handle this, and no doubt solutions will emerge from the community. All that this package requires is that components follow React's convention that components wishing to do async loading throw promises.

#### Aborting unnecessary loading

It's possible for a lazy component to begin loading, but then its result not to be required, because an enclosing Suspense boundary's fallback gets triggered, and so the original content will not be displayed.

In these cases, if the promise has an `.abort()` method, it will be called.

When a Suspense boundary's fallback is triggered, rendering of all further elements within the boundary is abandoned.

### Additional notes

#### Stream rendering

Stream rendering (`.renderToNodeStream()`) is not yet supported by this package.

#### No double-rendering

Many other solutions achieve something like this by "double-rendering" the app.

In the first render pass, all the promises for async-loaded data are collected. Once all the promises resolve, a 2nd render pass produces the actual HTML markup which is sent to the client. Obviously, this is resource-intensive. And if async components themselves make further async requests, 3rd or 4th or more render passes can be required.

The `.renderToStringAsync()` method provided by this package renders in a single pass. The render is interrupted when awaiting an async resource and resumed once it has loaded.

## Tests

Use `npm test` to run the tests. Use `npm run cover` to check coverage.

## Changelog

See [changelog.md](https://github.com/overlookmotel/react-async-ssr/blob/master/changelog.md)

## Issues

If you discover a bug, please raise an issue on Github. https://github.com/overlookmotel/react-async-ssr/issues

## Contribution

Pull requests are very welcome. Please:

* ensure all tests pass before submitting PR
* add tests for new features
* document new functionality/API additions in README
* do not add an entry to Changelog (Changelog is created when cutting releases)
