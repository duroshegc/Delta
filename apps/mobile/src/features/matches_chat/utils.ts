export const formatRelative = (iso: string | null): string => {
  if (!iso) return '';
  const dt = new Date(iso);
  const diff = Date.now() - dt.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return dt.toLocaleDateString();
};
