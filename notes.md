# Loading order problem

## The problem

There is a need for lazy components to know whether they are meant to be rendered sync or not, determined by server render.

The case is this:

Either of:

1. Lazy component used multiple times, sometimes within a `Suspense` which gets rendered, sometimes within a `Suspense` which has fallback triggered
2. Extraneous modules may be loaded as part of a chunk (i.e. chunks sometimes contain more modules than they need to)

Then:

```js
const Lazy1Inner = Lazy(() => <div>Lazy 1 inner</div>);
const Lazy1 = Lazy(() => <Lazy1Inner/>);
const Lazy2 = Lazy(() => <div>Lazy 2</div>);
const Lazy3 = Lazy(() => <div>Lazy 3</div>, {noSsr: true});

const App = () => (
	<div>
		<Suspense fallback={<div>Loading...</div>}>
			<Lazy1/>
		</Suspense>
		<Suspense fallback={<div>Loading...</div>}>
			<Lazy1/>
			<Lazy2/>
			<Lazy3/>
		</Suspense>
	</div>
);
```

`Lazy3` is not server-rendered, so triggers fallback of 2nd Suspense. So what should happen on client is:

As far as 2nd Suspense is concerned, none of `Lazy1`, `Lazy2`, `Lazy3` should be preloaded. But Lazy1 has been due to it's earlier usage.

Calling order 2nd Suspense expects: `Lazy1`, `Lazy2`, `Lazy3`

1. `Lazy1`
2. `Lazy2`
3. `Lazy3`
(end of hydration)
4. `Lazy1Inner`

What actually happens is:

1. `Lazy1`
2. `Lazy1Inner`
3. `Lazy2`
4. `Lazy3`
(end of hydration)

If `Lazy()` implementation relies on calling order, it will not get what it expects.

## Actually this is not a problem

In the case of lazy component loading (as opposed to lazy *data* loading), order of calling is not important.

The fallback will still get triggered on client, so the page will rehydrate correctly without errors.

So it's fine for lazy component loading.

## BUT could cause problems for other modules which do rely on calling order

An implementation of lazy data loading might rely on calling order. In which case, this could be a problem.

If `Lazy1Inner` was a lazy data fetcher, rather than lazy component fetcher, then it will get called in an unexpected order.

Not good.
