const dateTime = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});

export function formatDateTime(iso) {
  if (!iso) return '아직 들어오지 않았어요';
  return dateTime.format(new Date(iso));
}
