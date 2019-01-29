/* --------------------
 * react-async-ssr module
 * Tests
 * ------------------*/

'use strict';

// Modules
const React = require('react'),
	{expect} = require('chai');

// Imports
const {itRendersWithSyncCompare} = require('./utils');

// Tests

describe('Without Suspense', function() {
	describe('plain', function() {
		itRendersWithSyncCompare('string', async ({render}) => {
			const e = 'text';
			const h = await render(e);
			expect(h).to.equal('text');
		});

		itRendersWithSyncCompare('div', async ({render, openTag}) => {
			const e = <div>text</div>;
			const h = await render(e);
			expect(h).to.equal(`<div${openTag}>text</div>`);
		});

		itRendersWithSyncCompare('nested divs', async ({render, openTag}) => {
			const e = <div><div>text</div></div>;
			const h = await render(e);
			expect(h).to.equal(`<div${openTag}><div>text</div></div>`);
		});
	});

	describe('in function component', function() {
		itRendersWithSyncCompare('string', async ({render}) => {
			const Comp = () => 'text';
			const e = <Comp/>;
			const h = await render(e);
			expect(h).to.equal('text');
		});

		itRendersWithSyncCompare('div', async ({render, openTag}) => {
			const Comp = () => <div>text</div>;
			const e = <Comp/>;
			const h = await render(e);
			expect(h).to.equal(`<div${openTag}>text</div>`);
		});

		itRendersWithSyncCompare('nested divs', async ({render, openTag}) => {
			const Comp = () => <div><div>text</div></div>;
			const e = <Comp/>;
			const h = await render(e);
			expect(h).to.equal(`<div${openTag}><div>text</div></div>`);
		});
	});

	describe('in class component', function() {
		itRendersWithSyncCompare('string', async ({render}) => {
			class Comp extends React.Component {
				render() {
					return 'text';
				}
			}
			const e = <Comp/>;
			const h = await render(e);
			expect(h).to.equal('text');
		});

		itRendersWithSyncCompare('div', async ({render, openTag}) => {
			class Comp extends React.Component {
				render() {
					return <div>text</div>;
				}
			}
			const e = <Comp/>;
			const h = await render(e);
			expect(h).to.equal(`<div${openTag}>text</div>`);
		});

		itRendersWithSyncCompare('nested divs', async ({render, openTag}) => {
			class Comp extends React.Component {
				render() {
					return <div><div>text</div></div>;
				}
			}
			const e = <Comp/>;
			const h = await render(e);
			expect(h).to.equal(`<div${openTag}><div>text</div></div>`);
		});
	});
});
