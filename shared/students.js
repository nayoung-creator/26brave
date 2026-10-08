export const STUDENTS = [
  { id: 'nojiho', name: '노지호', color: '#3A7BD5', animal: 'dragon' },
  { id: 'ahniejeong', name: '안이정', color: '#E09A2B', animal: 'fox' },
  { id: 'yoonseol', name: '윤설', color: '#E25B8A', animal: 'rabbit' },
  { id: 'leeseoha', name: '이서하', color: '#7B5CC4', animal: 'owl' },
  { id: 'leeeunwoo', name: '이은우', color: '#2E9B6A', animal: 'bear' },
];

export function studentMeta(id) {
  return STUDENTS.find((student) => student.id === id) || {
    id,
    name: '',
    color: '#8a7560',
    animal: 'bear',
  };
}
