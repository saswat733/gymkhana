import { test } from 'node:test';
import assert from 'node:assert/strict';

// Smoke test for utilities that don't need a DB connection.
import { ApiError } from '../src/utils/ApiError.js';

test('ApiError.badRequest produces 400 with code', () => {
  const err = ApiError.badRequest('nope');
  assert.equal(err.statusCode, 400);
  assert.equal(err.code, 'BAD_REQUEST');
  assert.equal(err.message, 'nope');
});

test('ApiError.notFound default message', () => {
  const err = ApiError.notFound();
  assert.equal(err.statusCode, 404);
  assert.equal(err.message, 'Not Found');
});
