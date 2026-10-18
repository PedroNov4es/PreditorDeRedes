const pad = (n: number) => String(n).padStart(2, '0');

export function formatNumber(value: number, digits = 1): string {
  return value.toFixed(digits).replace('.', ',');
}

/** "20/08 14:00" no horário do aparelho. */
export function formatPeriod(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "14:00" no horário do aparelho. */
export function formatHour(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
