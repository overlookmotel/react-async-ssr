/* --------------------
 * react-async-ssr module
 * Error packing/unpacking
 *
 * Errors which are falsy are packed in an object so they can be evaluated with `!err`.
 * They are then unpacked to the original falsy value.
 * ------------------*/

'use strict';

// Exports

function FalsyError(err) {
	this.err = err;
}

function packError(err) {
	if (!err) return new FalsyError(err);
	return err;
}

function unpackError(err) {
	if (err instanceof FalsyError) return err.err;
	return err;
}

module.exports = {
	packError,
	unpackError
};
