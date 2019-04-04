/* --------------------
 * react-async-ssr module
 * Tests for expect extensions
 * ------------------*/

'use strict';

// Modules
const React = require('react'),
	{ABORT, ON_MOUNT} = require('../../symbols');

// Imports
const {lazy} = require('./index');

// Tests

describe('jest expect extensions (used in tests only)', () => {
	describe('toBeAborted', () => {
		it('passes if passed a correctly aborted lazy component', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ABORT]();
			expect(Lazy).toBeAborted();
		});

		it('errors if passed a non-function', () => {
			expect(() => {
				expect(null).toBeAborted();
			}).toThrow(/^Expected component to be aborted - it is not a component$/);
		});

		it('errors if passed a function which is not a test lazy component', () => {
			expect(() => {
				expect(() => {}).toBeAborted();
			}).toThrow(/^Expected component to be aborted - it is not a test lazy component$/);
		});

		it('errors if passed a component which was not called', () => {
			const Lazy = lazy(() => <div />);
			expect(() => {
				expect(Lazy).toBeAborted();
			}).toThrow(/^Expected Lazy to be aborted - it was not called$/);
		});

		it('errors if passed a component which was not aborted', () => {
			const Lazy = lazy(() => <div />);
			tryCatch(Lazy);
			expect(() => {
				expect(Lazy).toBeAborted();
			}).toThrow(/^Expected Lazy to be aborted$/);
		});

		it('errors if passed a component which was aborted twice', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ABORT]();
			promise[ABORT]();
			expect(() => {
				expect(Lazy).toBeAborted();
			}).toThrow(/^Expected Lazy to be aborted - it was aborted 2 times$/);
		});
	});

	describe('not.toBeAborted', () => {
		it('passes if passed a lazy component which was called but not aborted', () => {
			const Lazy = lazy(() => <div />);
			tryCatch(Lazy);
			expect(Lazy).not.toBeAborted();
		});

		it('passes if passed a lazy component which was not called', () => {
			const Lazy = lazy(() => <div />);
			expect(Lazy).not.toBeAborted();
		});

		it('errors if passed a non-function', () => {
			expect(() => {
				expect(null).not.toBeAborted();
			}).toThrow(/^Expected component not to be aborted - it is not a component$/);
		});

		it('errors if passed a function which is not a test lazy component', () => {
			expect(() => {
				expect(() => {}).not.toBeAborted();
			}).toThrow(/^Expected component not to be aborted - it is not a test lazy component$/);
		});

		it('errors if passed a component which was aborted', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ABORT]();
			expect(() => {
				expect(Lazy).not.toBeAborted();
			}).toThrow(/^Expected Lazy not to be aborted$/);
		});

		it('errors if passed a component which was aborted twice', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ABORT]();
			promise[ABORT]();
			expect(() => {
				expect(Lazy).not.toBeAborted();
			}).toThrow(/^Expected Lazy not to be aborted - it was aborted 2 times$/);
		});
	});

	describe('toBeMounted', () => {
		it('passes if passed a correctly mounted lazy component', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](true);
			expect(Lazy).toBeMounted();
		});

		it('errors if passed a non-function', () => {
			expect(() => {
				expect(null).toBeMounted();
			}).toThrow(/^Expected component to be mounted - it is not a component$/);
		});

		it('errors if passed a function which is not a test lazy component', () => {
			expect(() => {
				expect(() => {}).toBeMounted();
			}).toThrow(/^Expected component to be mounted - it is not a test lazy component$/);
		});

		it('errors if passed a component which was not called', () => {
			const Lazy = lazy(() => <div />);
			expect(() => {
				expect(Lazy).toBeMounted();
			}).toThrow(/^Expected Lazy to be mounted - it was not called$/);
		});

		it('errors if passed a component which was not mounted', () => {
			const Lazy = lazy(() => <div />);
			tryCatch(Lazy);
			expect(() => {
				expect(Lazy).toBeMounted();
			}).toThrow(/^Expected Lazy to be mounted$/);
		});

		it('errors if passed a component which was mounted twice', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](true);
			promise[ON_MOUNT](true);
			expect(() => {
				expect(Lazy).toBeMounted();
			}).toThrow(/^Expected Lazy to be mounted - it was mounted 2 times$/);
		});

		it('errors if passed a component which was mounted with no arguments', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT]();
			expect(() => {
				expect(Lazy).toBeMounted();
			}).toThrow(/^Expected Lazy to be mounted - \[ON_MOUNT\] was called with no arguments$/);
		});

		it('errors if passed a component which was mounted with 2 arguments', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](true, true);
			expect(() => {
				expect(Lazy).toBeMounted();
			}).toThrow(/^Expected Lazy to be mounted - \[ON_MOUNT\] was called with 2 arguments$/);
		});

		it('errors if passed a component which was mounted with non-boolean argument', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](1);
			expect(() => {
				expect(Lazy).toBeMounted();
			}).toThrow(/^Expected Lazy to be mounted - \[ON_MOUNT\] was not called with a boolean - called with 1$/);
		});
	});

	describe('not.toBeMounted', () => {
		it('passes if passed a lazy component which was called but not mounted', () => {
			const Lazy = lazy(() => <div />);
			tryCatch(Lazy);
			expect(Lazy).not.toBeMounted();
		});

		it('passes if passed a lazy component which was not called', () => {
			const Lazy = lazy(() => <div />);
			expect(Lazy).not.toBeMounted();
		});

		it('errors if passed a non-function', () => {
			expect(() => {
				expect(null).not.toBeMounted();
			}).toThrow(/^Expected component not to be mounted - it is not a component$/);
		});

		it('errors if passed a function which is not a test lazy component', () => {
			expect(() => {
				expect(() => {}).not.toBeMounted();
			}).toThrow(/^Expected component not to be mounted - it is not a test lazy component$/);
		});

		it('errors if passed a component which was mounted', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](true);
			expect(() => {
				expect(Lazy).not.toBeMounted();
			}).toThrow(/^Expected Lazy not to be mounted$/);
		});

		it('errors if passed a component which was mounted twice', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](true);
			promise[ON_MOUNT](true);
			expect(() => {
				expect(Lazy).not.toBeMounted();
			}).toThrow(/^Expected Lazy not to be mounted - it was mounted 2 times$/);
		});

		it('errors if passed a component which was mounted with no arguments', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT]();
			expect(() => {
				expect(Lazy).not.toBeMounted();
			}).toThrow(/^Expected Lazy not to be mounted - \[ON_MOUNT\] was called with no arguments$/);
		});

		it('errors if passed a component which was mounted with 2 arguments', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](true, true);
			expect(() => {
				expect(Lazy).not.toBeMounted();
			}).toThrow(/^Expected Lazy not to be mounted - \[ON_MOUNT\] was called with 2 arguments$/);
		});

		it('errors if passed a component which was mounted with non-boolean argument', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](1);
			expect(() => {
				expect(Lazy).not.toBeMounted();
			}).toThrow(/^Expected Lazy not to be mounted - \[ON_MOUNT\] was not called with a boolean - called with 1$/);
		});
	});

	describe('toBeMountedWith', () => {
		it('passes if passed a correctly mounted lazy component with correct value', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](true);
			expect(Lazy).toBeMountedWith(true);
		});

		it('errors if passed a non-function', () => {
			expect(() => {
				expect(null).toBeMountedWith(true);
			}).toThrow(/^Expected component to be mounted with true - it is not a component$/);
		});

		it('errors if passed a function which is not a test lazy component', () => {
			expect(() => {
				expect(() => {}).toBeMountedWith(true);
			}).toThrow(/^Expected component to be mounted with true - it is not a test lazy component$/);
		});

		it('errors if passed a component which was not called', () => {
			const Lazy = lazy(() => <div />);
			expect(() => {
				expect(Lazy).toBeMountedWith(true);
			}).toThrow(/^Expected Lazy to be mounted with true - it was not called$/);
		});

		it('errors if passed a component which was not mounted', () => {
			const Lazy = lazy(() => <div />);
			tryCatch(Lazy);
			expect(() => {
				expect(Lazy).toBeMountedWith(true);
			}).toThrow(/^Expected Lazy to be mounted with true - it was not mounted$/);
		});

		it('errors if passed a component which was mounted twice', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](true);
			promise[ON_MOUNT](true);
			expect(() => {
				expect(Lazy).toBeMountedWith(true);
			}).toThrow(/^Expected Lazy to be mounted with true - it was mounted 2 times$/);
		});

		it('errors if passed a component which was mounted with no arguments', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT]();
			expect(() => {
				expect(Lazy).toBeMountedWith(true);
			}).toThrow(/^Expected Lazy to be mounted with true - \[ON_MOUNT\] was called with no arguments$/);
		});

		it('errors if passed a component which was mounted with 2 arguments', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](true, true);
			expect(() => {
				expect(Lazy).toBeMountedWith(true);
			}).toThrow(/^Expected Lazy to be mounted with true - \[ON_MOUNT\] was called with 2 arguments$/);
		});

		it('errors if passed a component which was mounted with non-boolean argument', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](1);
			expect(() => {
				expect(Lazy).toBeMountedWith(true);
			}).toThrow(/^Expected Lazy to be mounted with true - \[ON_MOUNT\] was not called with a boolean - called with 1$/);
		});

		it('errors if passed a component which was mounted with wrong value', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](false);
			expect(() => {
				expect(Lazy).toBeMountedWith(true);
			}).toThrow(/^Expected Lazy to be mounted with true - it was mounted with false$/);
		});
	});

	describe('not.toBeMountedWith', () => {
		it('always errors', () => {
			expect(() => {
				expect(null).not.toBeMountedWith(true);
			}).toThrow(/^`\.toBeMountedWith\(\)` cannot be modified with `\.not`$/);
		});
	});

	describe('toBeMountedBefore', () => {
		it('passes if passed a correctly mounted lazy components, mounted in correct order', () => {
			const Lazy1 = lazy(() => <div />);
			const Lazy2 = lazy(() => <div />);
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT](true);
			promise2[ON_MOUNT](true);
			expect(Lazy1).toBeMountedBefore(Lazy2);
		});

		it('errors if passed a non-function', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](true);
			expect(() => {
				expect(null).toBeMountedBefore(Lazy);
			}).toThrow(/^Expected component to be mounted before Lazy - it is not a component$/);
		});

		it('errors if comparing to a non-function', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](true);
			expect(() => {
				expect(Lazy).toBeMountedBefore(null);
			}).toThrow(/^Expected Lazy to be mounted before component - it is not a component$/);
		});

		it('errors if passed a function which is not a test lazy component', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](true);
			expect(() => {
				expect(() => {}).toBeMountedBefore(Lazy);
			}).toThrow(/^Expected component to be mounted before Lazy - component is not a test lazy component$/);
		});

		it('errors if comparing to a function which is not a test lazy component', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](true);
			expect(() => {
				expect(Lazy).toBeMountedBefore(() => {});
			}).toThrow(/^Expected Lazy to be mounted before component - component is not a test lazy component$/);
		});

		it('errors if passed a component which was not called', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise2 = tryCatch(Lazy2);
			promise2[ON_MOUNT](true);
			expect(() => {
				expect(Lazy1).toBeMountedBefore(Lazy2);
			}).toThrow(/^Expected Lazy1 to be mounted before Lazy2 - Lazy1 was not called$/);
		});

		it('errors if comparing to a component which was not called', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			promise1[ON_MOUNT](true);
			expect(() => {
				expect(Lazy1).toBeMountedBefore(Lazy2);
			}).toThrow(/^Expected Lazy1 to be mounted before Lazy2 - Lazy2 was not called$/);
		});

		it('errors if passed a component which was not mounted', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise2[ON_MOUNT](true);
			expect(() => {
				expect(Lazy1).toBeMountedBefore(Lazy2);
			}).toThrow(/^Expected Lazy1 to be mounted before Lazy2 - Lazy1 was not mounted$/);
		});

		it('errors if compared to a component which was not mounted', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			tryCatch(Lazy2);
			promise1[ON_MOUNT](true);
			expect(() => {
				expect(Lazy1).toBeMountedBefore(Lazy2);
			}).toThrow(/^Expected Lazy1 to be mounted before Lazy2 - Lazy2 was not mounted$/);
		});

		it('errors if passed a component which was mounted twice', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT](true);
			promise1[ON_MOUNT](true);
			promise2[ON_MOUNT](true);
			expect(() => {
				expect(Lazy1).toBeMountedBefore(Lazy2);
			}).toThrow(/^Expected Lazy1 to be mounted before Lazy2 - Lazy1 was mounted 2 times$/);
		});

		it('errors if comparing to a component which was mounted twice', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT](true);
			promise2[ON_MOUNT](true);
			promise2[ON_MOUNT](true);
			expect(() => {
				expect(Lazy1).toBeMountedBefore(Lazy2);
			}).toThrow(/^Expected Lazy1 to be mounted before Lazy2 - Lazy2 was mounted 2 times$/);
		});

		it('errors if passed a component which was mounted with no arguments', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT]();
			promise2[ON_MOUNT](true);
			expect(() => {
				expect(Lazy1).toBeMountedBefore(Lazy2);
			}).toThrow(/^Expected Lazy1 to be mounted before Lazy2 - Lazy1\[ON_MOUNT\] was called with no arguments$/);
		});

		it('errors if comparing to a component which was mounted with no arguments', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT](true);
			promise2[ON_MOUNT]();
			expect(() => {
				expect(Lazy1).toBeMountedBefore(Lazy2);
			}).toThrow(/^Expected Lazy1 to be mounted before Lazy2 - Lazy2\[ON_MOUNT\] was called with no arguments$/);
		});

		it('errors if passed a component which was mounted with 2 arguments', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT](true, true);
			promise2[ON_MOUNT](true);
			expect(() => {
				expect(Lazy1).toBeMountedBefore(Lazy2);
			}).toThrow(/^Expected Lazy1 to be mounted before Lazy2 - Lazy1\[ON_MOUNT\] was called with 2 arguments$/);
		});

		it('errors if comparing to a component which was mounted with 2 arguments', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT](true);
			promise2[ON_MOUNT](true, true);
			expect(() => {
				expect(Lazy1).toBeMountedBefore(Lazy2);
			}).toThrow(/^Expected Lazy1 to be mounted before Lazy2 - Lazy2\[ON_MOUNT\] was called with 2 arguments$/);
		});

		it('errors if passed a component which was mounted with non-boolean argument', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT](1);
			promise2[ON_MOUNT](true);
			expect(() => {
				expect(Lazy1).toBeMountedBefore(Lazy2);
			}).toThrow(/^Expected Lazy1 to be mounted before Lazy2 - Lazy1\[ON_MOUNT\] was not called with a boolean - called with 1$/);
		});

		it('errors if comparing to a component which was mounted with non-boolean argument', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT](true);
			promise2[ON_MOUNT](1);
			expect(() => {
				expect(Lazy1).toBeMountedBefore(Lazy2);
			}).toThrow(/^Expected Lazy1 to be mounted before Lazy2 - Lazy2\[ON_MOUNT\] was not called with a boolean - called with 1$/);
		});

		it('errors if components mounted in wrong order', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise2[ON_MOUNT](true);
			promise1[ON_MOUNT](true);
			expect(() => {
				expect(Lazy1).toBeMountedBefore(Lazy2);
			}).toThrow(/^Expected Lazy1 to be mounted before Lazy2 - it was mounted after$/);
		});
	});

	describe('not.toBeMountedBefore', () => {
		it('always errors', () => {
			expect(() => {
				expect(null).not.toBeMountedBefore(null);
			}).toThrow(/^`\.toBeMountedBefore\(\)` cannot be modified with `\.not`$/);
		});
	});

	describe('toBeMountedAfter', () => {
		it('passes if passed correctly mounted lazy components, mounted in correct order', () => {
			const Lazy1 = lazy(() => <div />);
			const Lazy2 = lazy(() => <div />);
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT](true);
			promise2[ON_MOUNT](true);
			expect(Lazy2).toBeMountedAfter(Lazy1);
		});

		it('errors if passed a non-function', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](true);
			expect(() => {
				expect(null).toBeMountedAfter(Lazy);
			}).toThrow(/^Expected component to be mounted after Lazy - it is not a component$/);
		});

		it('errors if comparing to a non-function', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](true);
			expect(() => {
				expect(Lazy).toBeMountedAfter(null);
			}).toThrow(/^Expected Lazy to be mounted after component - it is not a component$/);
		});

		it('errors if passed a function which is not a test lazy component', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](true);
			expect(() => {
				expect(() => {}).toBeMountedAfter(Lazy);
			}).toThrow(/^Expected component to be mounted after Lazy - component is not a test lazy component$/);
		});

		it('errors if comparing to a function which is not a test lazy component', () => {
			const Lazy = lazy(() => <div />);
			const promise = tryCatch(Lazy);
			promise[ON_MOUNT](true);
			expect(() => {
				expect(Lazy).toBeMountedAfter(() => {});
			}).toThrow(/^Expected Lazy to be mounted after component - component is not a test lazy component$/);
		});

		it('errors if passed a component which was not called', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise2 = tryCatch(Lazy2);
			promise2[ON_MOUNT](true);
			expect(() => {
				expect(Lazy2).toBeMountedAfter(Lazy1);
			}).toThrow(/^Expected Lazy2 to be mounted after Lazy1 - Lazy1 was not called$/);
		});

		it('errors if comparing to a component which was not called', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			promise1[ON_MOUNT](true);
			expect(() => {
				expect(Lazy2).toBeMountedAfter(Lazy1);
			}).toThrow(/^Expected Lazy2 to be mounted after Lazy1 - Lazy2 was not called$/);
		});

		it('errors if passed a component which was not mounted', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise2[ON_MOUNT](true);
			expect(() => {
				expect(Lazy2).toBeMountedAfter(Lazy1);
			}).toThrow(/^Expected Lazy2 to be mounted after Lazy1 - Lazy1 was not mounted$/);
		});

		it('errors if compared to a component which was not mounted', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			tryCatch(Lazy2);
			promise1[ON_MOUNT](true);
			expect(() => {
				expect(Lazy2).toBeMountedAfter(Lazy1);
			}).toThrow(/^Expected Lazy2 to be mounted after Lazy1 - Lazy2 was not mounted$/);
		});

		it('errors if passed a component which was mounted twice', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT](true);
			promise1[ON_MOUNT](true);
			promise2[ON_MOUNT](true);
			expect(() => {
				expect(Lazy2).toBeMountedAfter(Lazy1);
			}).toThrow(/^Expected Lazy2 to be mounted after Lazy1 - Lazy1 was mounted 2 times$/);
		});

		it('errors if comparing to a component which was mounted twice', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT](true);
			promise2[ON_MOUNT](true);
			promise2[ON_MOUNT](true);
			expect(() => {
				expect(Lazy2).toBeMountedAfter(Lazy1);
			}).toThrow(/^Expected Lazy2 to be mounted after Lazy1 - Lazy2 was mounted 2 times$/);
		});

		it('errors if passed a component which was mounted with no arguments', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT]();
			promise2[ON_MOUNT](true);
			expect(() => {
				expect(Lazy2).toBeMountedAfter(Lazy1);
			}).toThrow(/^Expected Lazy2 to be mounted after Lazy1 - Lazy1\[ON_MOUNT\] was called with no arguments$/);
		});

		it('errors if comparing to a component which was mounted with no arguments', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT](true);
			promise2[ON_MOUNT]();
			expect(() => {
				expect(Lazy2).toBeMountedAfter(Lazy1);
			}).toThrow(/^Expected Lazy2 to be mounted after Lazy1 - Lazy2\[ON_MOUNT\] was called with no arguments$/);
		});

		it('errors if passed a component which was mounted with 2 arguments', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT](true, true);
			promise2[ON_MOUNT](true);
			expect(() => {
				expect(Lazy2).toBeMountedAfter(Lazy1);
			}).toThrow(/^Expected Lazy2 to be mounted after Lazy1 - Lazy1\[ON_MOUNT\] was called with 2 arguments$/);
		});

		it('errors if comparing to a component which was mounted with 2 arguments', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT](true);
			promise2[ON_MOUNT](true, true);
			expect(() => {
				expect(Lazy2).toBeMountedAfter(Lazy1);
			}).toThrow(/^Expected Lazy2 to be mounted after Lazy1 - Lazy2\[ON_MOUNT\] was called with 2 arguments$/);
		});

		it('errors if passed a component which was mounted with non-boolean argument', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT](1);
			promise2[ON_MOUNT](true);
			expect(() => {
				expect(Lazy2).toBeMountedAfter(Lazy1);
			}).toThrow(/^Expected Lazy2 to be mounted after Lazy1 - Lazy1\[ON_MOUNT\] was not called with a boolean - called with 1$/);
		});

		it('errors if comparing to a component which was mounted with non-boolean argument', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise1[ON_MOUNT](true);
			promise2[ON_MOUNT](1);
			expect(() => {
				expect(Lazy2).toBeMountedAfter(Lazy1);
			}).toThrow(/^Expected Lazy2 to be mounted after Lazy1 - Lazy2\[ON_MOUNT\] was not called with a boolean - called with 1$/);
		});

		it('errors if components mounted in wrong order', () => {
			const Lazy1 = lazy(() => <div />);
			Lazy1.displayName = 'Lazy1';
			const Lazy2 = lazy(() => <div />);
			Lazy2.displayName = 'Lazy2';
			const promise1 = tryCatch(Lazy1);
			const promise2 = tryCatch(Lazy2);
			promise2[ON_MOUNT](true);
			promise1[ON_MOUNT](true);
			expect(() => {
				expect(Lazy2).toBeMountedAfter(Lazy1);
			}).toThrow(/^Expected Lazy2 to be mounted after Lazy1 - it was mounted before$/);
		});
	});

	describe('not.toBeMountedAfter', () => {
		it('always errors', () => {
			expect(() => {
				expect(null).not.toBeMountedAfter(null);
			}).toThrow(/^`\.toBeMountedAfter\(\)` cannot be modified with `\.not`$/);
		});
	});
});

function tryCatch(fn) { // eslint-disable-line consistent-return
	try {
		fn();
	} catch (err) {
		return err;
	}
}
