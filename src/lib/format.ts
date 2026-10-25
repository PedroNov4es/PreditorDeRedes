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

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/**
 * Data e hora por extenso, para o leitor de tela: "20 de agosto, 20 horas".
 * Evita que "20/08 20:00" seja lido como números soltos (F2). Só para rótulos falados.
 */
export function spokenPeriod(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const h = d.getHours();
  const m = d.getMinutes();
  const hours = `${h} ${h === 1 ? 'hora' : 'horas'}`;
  const minutes = m > 0 ? ` e ${m} ${m === 1 ? 'minuto' : 'minutos'}` : '';
  return `${d.getDate()} de ${MONTHS[d.getMonth()]}, ${hours}${minutes}`;
}

/** "14:00" no horário do aparelho. */
export function formatHour(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
