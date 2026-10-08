import { BOOKS_PER_SHELF } from './constants.js';

export function groupIntoShelves(books) {
  const sorted = [...books].sort((a, b) => {
    const delta = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (delta !== 0) return delta;
    return String(a.id).localeCompare(String(b.id));
  });

  const groups = [];
  for (let index = 0; index < sorted.length; index += BOOKS_PER_SHELF) {
    groups.push(sorted.slice(index, index + BOOKS_PER_SHELF));
  }
  if (groups.length === 0 || groups[groups.length - 1].length === BOOKS_PER_SHELF) {
    groups.push([]);
  }
  return groups;
}

export function spineIndex(id, paletteLength) {
  let hash = 0;
  const text = String(id);
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash % paletteLength;
}
