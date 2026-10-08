import test from 'node:test';
import assert from 'node:assert/strict';
import { EXAMPLE_BOOK } from './exampleBook.js';

test('the class example is the picture book about words', () => {
  assert.equal(EXAMPLE_BOOK.title, '말들이 사는 나라');
  assert.match(EXAMPLE_BOOK.content, /바른 말/);
  assert.match(EXAMPLE_BOOK.content, /고운 말/);
  assert.match(EXAMPLE_BOOK.content, /나를 지키는 말/);
});
