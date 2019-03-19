/* --------------------
 * react-async-ssr module
 * Methods to create nodes in tree
 * ------------------*/

'use strict';

// Imports
const {isDev} = require('./rendererSuper');

// Exports

/*
 * Create nodes in tree
 */
module.exports = {
	createNode(type) {
		const parent = this.node;

		const child = {
			type,
			parent,
			children: []
		};

		parent.children.push(child);

		// Prevent insertion of '<!-- -->'.
		// '<!-- -->' will be re-inserted later if required once content of the
		// boundary/lazy element is known.
		this.previousWasTextNode = false;

		return child;
	},

	createNodeWithStackState(type, frame) {
		const child = this.createNode(type);

		// Get current contexts from new Context API
		const {threadID} = this;
		const contexts = [];
		for (let i = 0; i <= this.contextIndex; i++) {
			const context = this.contextStack[i];
			const ctx = {context, value: context[threadID]};
			if (isDev) ctx.provider = this.contextProviderStack[i];
			contexts.push(ctx);
		}

		// Record parent suspense node
		child.parentSuspense = this.suspenseNode;

		// Record stackState
		child.stackState = {
			context: frame.context, // Contexts from legacy Context API
			contexts, // Contexts from new Context API
			domNamespace: frame.domNamespace,
			currentSelectValue: this.currentSelectValue,
			domRootAbove: this.domRootIndex !== 0
		};

		return child;
	}
};
