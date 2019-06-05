/* --------------------
 * react-async-ssr module
 * Tests
 * ------------------*/

'use strict';

// Modules
const React = require('react');

// Imports
const itRenders = require('./utils/itRenders');

// Init
require('./utils');

// Tests

describe('without Suspense', () => {
	describe('plain', () => {
		itRenders('string', {
			element: () => 'text',
			html: 'text'
		});

		itRenders('div', {
			element: () => <div>text</div>,
			html: ({openTag}) => `<div${openTag}>text</div>`
		});

		itRenders('nested divs', {
			element: () => <div><div>text</div></div>,
			html: ({openTag}) => `<div${openTag}><div>text</div></div>`
		});
	});

	describe('in function component', () => {
		itRenders('string', {
			element() {
				const Comp = () => 'text';
				return <Comp />;
			},
			html: 'text'
		});

		itRenders('div', {
			element() {
				const Comp = () => <div>text</div>;
				return <Comp />;
			},
			html: ({openTag}) => `<div${openTag}>text</div>`
		});

		itRenders('nested divs', {
			element() {
				const Comp = () => <div><div>text</div></div>;
				return <Comp />;
			},
			html: ({openTag}) => `<div${openTag}><div>text</div></div>`
		});
	});

	describe('in class component', () => {
		itRenders('string', {
			element() {
				class Comp extends React.Component {
					render() {
						return 'text';
					}
				}
				return <Comp />;
			},
			html: 'text'
		});

		itRenders('div', {
			element() {
				// eslint-disable-next-line react/prefer-stateless-function
				class Comp extends React.Component {
					render() {
						return <div>text</div>;
					}
				}
				return <Comp />;
			},
			html: ({openTag}) => `<div${openTag}>text</div>`
		});

		itRenders('nested divs', {
			element() {
				// eslint-disable-next-line react/prefer-stateless-function
				class Comp extends React.Component {
					render() {
						return <div><div>text</div></div>;
					}
				}
				return <Comp />;
			},
			html: ({openTag}) => `<div${openTag}><div>text</div></div>`
		});
	});
});
