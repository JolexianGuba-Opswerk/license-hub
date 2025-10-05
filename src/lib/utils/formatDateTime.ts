// utils/date.ts
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();

  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const isYesterday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate() - 1;

  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };

  if (isToday) return `Today at ${d.toLocaleTimeString([], options)}`;
  if (isYesterday) return `Yesterday at ${d.toLocaleTimeString([], options)}`;

  return d.toLocaleString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
