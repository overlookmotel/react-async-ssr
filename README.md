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

Also requires React 16.6.0 - 16.9.x. React 16.10.0+ is not supported at present.

### Moving to async server-side rendering

Before:

```jsx
const { renderToString } = require('react-dom/server');

function render() {
  const html = renderToString( <App /> );
  return html;
}
```

After:

```jsx
const { renderToStringAsync } = require('react-async-ssr');

async function render() {
  const html = await renderToStringAsync( <App /> );
  return html;
}
```

### Application code

```jsx
function App() {
  return (
    <div>
      <Suspense fallback={ <Spinner /> }>
        <LazyComponent />
        <LazyComponent />
        <LazyData />
      </Suspense>
    </div>
  );
}
```

`<Suspense>` behaves exactly the same on the server as it does on the client.

`.renderToStringAsync()` will render the app in the usual way, except any lazy elements will be awaited and rendered before the returned promise resolves.

### Lazy components

So I can just use `React.lazy()`, right?

No! `React.lazy()` doesn't make sense to use on the server side. It doesn't have any ability to track the modules that have been lazy-loaded, so there's no way to then reload them on the client side, so that `.hydrate()` has all the code it needs.

[react-lazy-ssr](https://www.npmjs.com/package/react-lazy-ssr) is a drop-in replacement for `React.lazy()`, designed to work with `react-async-ssr`.

### Lazy data

[react-lazy-data](https://www.npmjs.com/package/react-lazy-data) is a ready-to-go simple solution for async data loading which is designed to work with `react-async-ssr`.

If you're brave, you could also [roll your own](#rolling-your-own-lazy-data-solution) or adapt another existing data-loading package to work with `react-async-ssr`.

If you have success, please [let me know](https://github.com/overlookmotel/react-async-ssr/issues/66).

### Hydrating the render on client side

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

You can create components which load their own data and are completely independent. You can drop these components in to any `react-async-ssr`-enabled app, anywhere in the component tree, and they'll be able to load the data they needs, without any complex "wiring up".

However, some mechanism is required to gather the data loaded on the server in order to send it to the client for hydration.

[react-lazy-ssr](https://www.npmjs.com/package/react-lazy-ssr) and [react-lazy-data](https://www.npmjs.com/package/react-lazy-data) both provide mechanisms for this. But you could use other methods. This package does not make any assumptions about how it's done - all it requires is that components follow React's convention that components wishing to do async loading throw promises, and provides some [hooks](#tracking-components-being-used) to enable tracking what's loaded on the server.

### Complicated cases

`.renderToStringAsync()` supports:

* Async components which themselves load more async components/data
* Suspense fallbacks which load async components/data

### Tracking components being used

If promises thrown have an `[ON_MOUNT]()` method, they are called.

`[ON_MOUNT]` is a symbol which can be imported from `react-async-ssr/symbols`.

```js
const { ON_MOUNT } = require('react-async-ssr/symbols');
```

`[ON_MOUNT]()` is called in the order components will be rendered on the client during hydration. This may not be the same order as the components are rendered on the server, if lazy components are nested within each other. In some cases, a component may render on the server, but not at all on the client during hydration, due to a Suspense fallback being triggered (see [below](#preventing-server-side-rendering-of-components)).

`[ON_MOUNT]()` is called with `true` if the element is needed for initial render on the client, or `false` if it will not. `false` happens if the promise was thrown by a component which ends up being inside a Suspense boundary whose fallback is triggered, so the component is not rendered.

Only components whose promise's `[ON_MOUNT]()` method has been called with `true` should have their imported file/data provided to client so they can be rehydrated synchronously. Those called with `false` should be allowed to load file/data asynchronously.

This is to prevent unnecessary files/data being loaded on the client prior to hydration, when they won't actually be used in hydration. Doing that would increase the time user has to wait before hydration.

### Preventing server-side rendering of components

Sometimes you might want to prevent a component rendering on server side. For example, it might be a low-priority part of the page, "below the fold", or a heavy component which will take a long time to load on client side and increase the delay before hydration.

This module provides a mechanism for that.

The component should throw a promise which has `[NO_SSR]` property set to `true`.

`[NO_SSR]` is a symbol which can be imported from `react-async-ssr/symbols`.

If the promise has this property, the component will not be rendered and the enclosing Suspense boundary's fallback will be triggered.

```jsx
const { NO_SSR } = require('react-async-ssr/symbols');

function LazyNoSSR() {
  const promise = new Promise( () => {} );
  promise[NO_SSR] = true;
  throw promise;
}

function App() {
  return (
    <React.Suspense fallback={ <div>Loading...</div> }>
      <LazyNoSSR/>
    </React.Suspense>
  );
}
```

When rendered on server, this will output `<div>Loading...</div>`. The content can then be loaded on client side after hydration.

On client side, to ensure hydration completes correctly, the component must throw a promise which then resolves to the required component/data, and not render the content synchronously.

#### Warning: Hydration errors

If you leave some content to be rendered on client, `ReactDOM.hydrate()` will log warnings to console.error "Text content did not match". The cause is that React does not officially support using `Suspense` on server side, and so does not expect to encounter `Suspense` in hydrate.

However, aside from the console output, it's not a problem. The page *will* hydrate and then load correctly. This case is covered by this module's tests, and it does work.

There is no console output in production mode, only development, so your users should not see anything. It's just annoying in development.

#### Optimization: Bail out of rendering when suspended

When a `[NO_SSR]` promise is thrown, default behavior is to continue rendering the rest of the Suspense boundary.

However, this content will not be output as the Suspense fallback will be rendered and output instead.

As an optimization, you can cause the render to bail out of rendering all further content within the Suspense boundary as soon as the fallback is triggered, by providing a `fallbackFast` option to `.renderToStringAsync()`.

```jsx
function App() {
  return (
    <React.Suspense fallback={ <div>Loading...</div> }>
      <LazyNoSSR/> <!-- throws `[NO_SSR]` promise -->
      <LazySSR/> <!-- will not be rendered -->
    </React.Suspense>
  );
}

const html = await renderToStringAsync(
  <App />,
  { fallbackFast: true }
);
```

#### Optimization: Aborting unnecessary loading

It's possible for a lazy component to begin loading, but then its result not to be required, because an enclosing Suspense boundary's fallback gets triggered. If so the result will not be displayed.

In these cases, if the promise has an `[ABORT]` method, it will be called.

`[ABORT]` is a symbol which can be imported from `react-async-ssr/symbols`.

```js
const { ABORT } = require('react-async-ssr/symbols');

function AbortableLazy() {
  const promise = new Promise(
    resolve => /* do some stuff */
  );

  promise[ABORT] = () => {
    /* this will be called if result of promise will not be rendered */
  };

  throw promise;
}
```

### Additional notes

#### Stream rendering

Stream rendering (`.renderToNodeStream()`) is not yet supported by this package.

#### No double-rendering

Many other solutions achieve some form of server-side rendering by "double-rendering" the app.

In the first render pass, all the promises for async-loaded data are collected. Once all the promises resolve, a 2nd render pass produces the actual HTML markup which is sent to the client. Obviously, it's resource-intensive to render twice. And if async components themselves make further async requests, 3rd or 4th render passes can be required.

The `.renderToStringAsync()` method provided by this package renders in a single pass. The render is interrupted when awaiting an async resource and resumed once it has loaded.

### Rolling your own lazy data solution

`.renderToStringAsync()` supports any component which fits within React's convention for suspendable components.

In its `render()` method, the component should throw a Promise which will resolve when the data is loaded. When the promise resolves, the renderer will re-render the component and add it into the markup.

Here's a basic example:

```jsx
import React, { createContext } from 'react';
import { renderToStringAsync } from 'react-async-ssr';

const PokemonDataContext = createContext();

function Pokemon( { id } ) {
	const store = useContext( PokemonDataContext );
	let entry = store[id];
	if ( !entry ) entry = store[id] = {};

	const { data } = entry;
	if ( data ) return <div>My name is: { data.name }</div>;

  let { promise } = entry;
	if ( !promise ) {
		promise = fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
			.then( res => res.json() )
			.then( data => {
				entry.data = data;
				entry.promise = undefined;
			} );
		entry.promise = promise;
  }

  throw promise;
}

function App() {
  return (
		<div>
		  <PokemonDataContext.Provider value={{}}>
        <Suspense fallback={ <div>Loading...</div> }>
          <Pokemon id={1} />
          <Pokemon id={2} />
          <Pokemon id={3} />
			  </Suspense>
			</PokemonDataContext.Provider>
    </div>
  );
}

const html = await renderToStringAsync( <App /> );

// html === `
//   <div>
//     <div>My name is bulbasaur.</div>
//     <div>My name is ivysaur.</div>
//     <div>My name is venusaur.</div>
//   </div>
// `
```

The above example makes 3 async fetch requests, which are made in parallel. They are awaited, and the HTML markup rendered only once all the data is ready.

A full solution is more complex than this, but the above shows the gist.

## Versioning

This module follows [semver](https://semver.org/). Breaking changes will only be made in major version updates.

All active NodeJS release lines are supported (v10+ at time of writing). After a release line of NodeJS reaches end of life according to [Node's LTS schedule](https://nodejs.org/en/about/releases/), support for that version of Node may be dropped at any time, and this will not be considered a breaking change. Dropping support for a Node version will be made in a minor version update (e.g. 1.2.0 to 1.3.0). If you are using a Node version which is approaching end of life, pin your dependency of this module to patch updates only using tilde (`~`) e.g. `~1.2.3` to avoid breakages.

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
