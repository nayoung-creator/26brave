export const SHELF_THEMES = [
  { id: 'oak', name: '봄나무 책장' },
  { id: 'mint', name: '민트 책장' },
  { id: 'star', name: '별빛 책장' },
  { id: 'blossom', name: '꽃잎 책장' },
  { id: 'forest', name: '숲속 책장' },
  { id: 'sea', name: '바다 책장' },
  { id: 'sunset', name: '노을 책장' },
  { id: 'cloud', name: '구름 책장' },
];

export const SPINES = [
  { bg: '#d94f3d', fg: '#fff6ea' },
  { bg: '#2f6fad', fg: '#f3f7ff' },
  { bg: '#1f8a70', fg: '#f3fffb' },
  { bg: '#e39b12', fg: '#3a2a08' },
  { bg: '#7a4ea3', fg: '#fbf5ff' },
  { bg: '#c4476a', fg: '#fff5f8' },
  { bg: '#3e6b48', fg: '#f4fff5' },
  { bg: '#c4622d', fg: '#fff6ee' },
  { bg: '#3d4a8a', fg: '#f4f6ff' },
  { bg: '#8c3e3e', fg: '#fff6f4' },
  { bg: '#0f766e', fg: '#f2fffc' },
  { bg: '#b45309', fg: '#fff8ef' },
];

export function themeForShelf(index) {
  return SHELF_THEMES[index % SHELF_THEMES.length];
}
