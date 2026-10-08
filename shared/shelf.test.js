import test from 'node:test';
import assert from 'node:assert/strict';
import { groupIntoShelves } from './shelf.js';

function book(id, createdAt) {
  return { id, createdAt, title: id, content: '독후감' };
}

test('an empty list still opens one shelf', () => {
  const shelves = groupIntoShelves([]);
  assert.equal(shelves.length, 1);
  assert.deepEqual(shelves[0], []);
});

test('books stay in the order they were written', () => {
  const shelves = groupIntoShelves([
    book('b', '2026-10-08T02:00:00.000Z'),
    book('a', '2026-10-08T01:00:00.000Z'),
    book('c', '2026-10-08T01:00:00.000Z'),
  ]);
  assert.deepEqual(shelves[0].map((item) => item.id), ['a', 'c', 'b']);
});

test('a full shelf keeps the finished case and opens a new design', () => {
  const books = Array.from({ length: 50 }, (_, index) => (
    book(`b${String(index).padStart(2, '0')}`, `2026-10-08T00:${String(index).padStart(2, '0')}:00.000Z`)
  ));
  const shelves = groupIntoShelves(books);
  assert.equal(shelves.length, 2);
  assert.equal(shelves[0].length, 50);
  assert.equal(shelves[1].length, 0);
});

test('the 51st book is the first book on the next shelf', () => {
  const books = Array.from({ length: 51 }, (_, index) => (
    book(`b${String(index).padStart(2, '0')}`, new Date(Date.UTC(2026, 9, 8, 0, index)).toISOString())
  ));
  const shelves = groupIntoShelves(books);
  assert.equal(shelves.length, 2);
  assert.equal(shelves[0].length, 50);
  assert.equal(shelves[1].length, 1);
  assert.equal(shelves[1][0].id, 'b50');
});
