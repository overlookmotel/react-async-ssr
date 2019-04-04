/* --------------------
 * react-async-ssr module
 * Tests
 * ------------------*/

'use strict';

// Modules
const React = require('react');

// Imports
const {itRendersWithSyncCompare} = require('./utils');

// Tests

describe('without Suspense', () => {
	describe('plain', () => {
		itRendersWithSyncCompare('string', async ({render}) => {
			const e = 'text';
			const h = await render(e);
			expect(h).toBe('text');
		});

		itRendersWithSyncCompare('div', async ({render, openTag}) => {
			const e = <div>text</div>;
			const h = await render(e);
			expect(h).toBe(`<div${openTag}>text</div>`);
		});

		itRendersWithSyncCompare('nested divs', async ({render, openTag}) => {
			const e = <div><div>text</div></div>;
			const h = await render(e);
			expect(h).toBe(`<div${openTag}><div>text</div></div>`);
		});
	});

	describe('in function component', () => {
		itRendersWithSyncCompare('string', async ({render}) => {
			const Comp = () => 'text';
			const e = <Comp />;
			const h = await render(e);
			expect(h).toBe('text');
		});

		itRendersWithSyncCompare('div', async ({render, openTag}) => {
			const Comp = () => <div>text</div>;
			const e = <Comp />;
			const h = await render(e);
			expect(h).toBe(`<div${openTag}>text</div>`);
		});

		itRendersWithSyncCompare('nested divs', async ({render, openTag}) => {
			const Comp = () => <div><div>text</div></div>;
			const e = <Comp />;
			const h = await render(e);
			expect(h).toBe(`<div${openTag}><div>text</div></div>`);
		});
	});

	describe('in class component', () => {
		itRendersWithSyncCompare('string', async ({render}) => {
			class Comp extends React.Component {
				render() {
					return 'text';
				}
			}
			const e = <Comp />;
			const h = await render(e);
			expect(h).toBe('text');
		});

		itRendersWithSyncCompare('div', async ({render, openTag}) => {
			// eslint-disable-next-line react/prefer-stateless-function
			class Comp extends React.Component {
				render() {
					return <div>text</div>;
				}
			}
			const e = <Comp />;
			const h = await render(e);
			expect(h).toBe(`<div${openTag}>text</div>`);
		});

		itRendersWithSyncCompare('nested divs', async ({render, openTag}) => {
			// eslint-disable-next-line react/prefer-stateless-function
			class Comp extends React.Component {
				render() {
					return <div><div>text</div></div>;
				}
			}
			const e = <Comp />;
			const h = await render(e);
			expect(h).toBe(`<div${openTag}><div>text</div></div>`);
		});
	});
});
