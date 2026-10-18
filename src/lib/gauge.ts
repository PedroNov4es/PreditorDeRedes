import type { Thresholds } from '../domain/quality';

/** Posição (0 a 100) do marcador numa escala que vai de 0 a `max`. Valores fora da escala ficam nas pontas. */
export function markerPercent(value: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

/**
 * Largura relativa (flex) das três faixas Boa / Regular / Instável de uma escala de 0 a `max`.
 * Se `max` for menor que o limite de instável, a última faixa nunca fica com largura negativa.
 */
export function zoneFlex(thresholds: Thresholds, max: number): [number, number, number] {
  const good = thresholds.moderate;
  const moderate = thresholds.unstable - thresholds.moderate;
  const unstable = Math.max(max - thresholds.unstable, 0);
  return [good, moderate, unstable];
}
